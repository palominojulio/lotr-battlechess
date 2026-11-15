import Peer from 'peerjs';

const PEER_PREFIX = 'lotr-bchess-v1-';
export const PUBLIC_GAME_URL = 'https://palominojulio.github.io/lotr-battlechess/';

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }
};

/**
 * Extracts a clean room code (e.g. "SANTI-5420") even if the user pastes the full
 * URL ("https://palominojulio.github.io/lotr-battlechess/?room=SANTI-5420"),
 * a full WhatsApp message, or just the 4 digits ("5420").
 */
export function extractRoomCode(rawInput) {
  if (!rawInput) return '';
  const str = String(rawInput).trim();

  // 1. Look for SANTI-XXXX anywhere in the pasted string or URL
  const santiMatch = str.match(/SANTI-\d{3,6}/i);
  if (santiMatch) return santiMatch[0].toUpperCase();

  // 2. Look for ?room=... parameter if it's a URL
  try {
    const url = new URL(str);
    const roomParam = url.searchParams.get('room');
    if (roomParam) return extractRoomCode(roomParam);
  } catch {}

  const roomQueryMatch = str.match(/[?&]room=([A-Za-z0-9-_]+)/i);
  if (roomQueryMatch) return roomQueryMatch[1].toUpperCase();

  // 3. If user only typed numbers like "5420", prefix with SANTI-
  if (/^\d{3,6}$/.test(str)) {
    return `SANTI-${str}`;
  }

  return str.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
}

export class OnlineRoomManager {
  constructor({ onStatusChange, onRemoteMove, onRemoteReset, onConnected, onRemoteChat }) {
    this.peer = null;
    this.conn = null;
    this.roomCode = null;
    this.preferredColor = 'w';
    this.myColor = 'w'; // 'w' (Gondor) or 'b' (Mordor)
    this.isConnected = false;
    this.isHost = false;
    this.retryTimer = null;

    this.onStatusChange = onStatusChange;
    this.onRemoteMove = onRemoteMove;
    this.onRemoteReset = onRemoteReset;
    this.onConnected = onConnected;
    this.onRemoteChat = onRemoteChat;

    // When returning from WhatsApp app on mobile/desktop, automatically ensure room is active
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.roomCode && !this.isConnected) {
        if (!this.peer || this.peer.disconnected || this.peer.destroyed) {
          this.enterRoom(this.roomCode, this.preferredColor);
        }
      }
    });
  }

  disconnect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.conn) {
      try { this.conn.close(); } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
    this.isConnected = false;
  }

  createRoom(hostColor = 'w') {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = this.roomCode || `SANTI-${randomNum}`;
    this.enterRoom(code, hostColor);
  }

  joinRoom(rawInput) {
    const cleanCode = extractRoomCode(rawInput);
    if (!cleanCode) return;
    this.enterRoom(cleanCode, 'b');
  }

  /**
   * Symmetric room entry:
   * - First tries to claim the room ID (`lotr-bchess-v1-SANTI-XXXX`) as Host and wait.
   * - If the room ID is already taken (`unavailable-id`), that means the other player
   *   is ALREADY waiting in the room, so it immediately connects to them as Guest!
   * - If the other player isn't there yet (`peer-unavailable`), it automatically holds
   *   the room and waits for them without throwing an error!
   */
  enterRoom(rawCode, preferredColor = 'w') {
    const cleanCode = extractRoomCode(rawCode);
    if (!cleanCode) return;

    this.disconnect();
    this.roomCode = cleanCode;
    this.preferredColor = preferredColor;
    const hostPeerId = `${PEER_PREFIX}${cleanCode}`;

    this.onStatusChange?.({
      state: 'waiting',
      roomCode: this.roomCode,
      myColor: this.myColor,
      shareUrl: this.getShareUrl(),
      message: `⏳ Conectando a la sala ${this.roomCode}...`
    });

    // Step 1: Try to open the room as Host
    const hostPeer = new Peer(hostPeerId, PEER_CONFIG);
    this.peer = hostPeer;

    hostPeer.on('open', () => {
      this.isHost = true;
      this.myColor = this.preferredColor;
      this.onStatusChange?.({
        state: 'waiting',
        roomCode: this.roomCode,
        myColor: this.myColor,
        shareUrl: this.getShareUrl(),
        message: `🟢 Sala ${this.roomCode} abierta y esperando. Envíale el enlace por WhatsApp a Santi; en cuanto él lo abra se conectará automáticamente.`
      });
    });

    hostPeer.on('connection', (conn) => {
      this.conn = conn;
      this._setupConnection(conn);
    });

    hostPeer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // The other player is ALREADY hosting this room! Connect to them as Guest!
        this._connectAsGuest(hostPeerId);
      } else {
        this.onStatusChange?.({
          state: 'waiting',
          roomCode: this.roomCode,
          shareUrl: this.getShareUrl(),
          message: `🔄 Reconectando sala ${this.roomCode}...`
        });
        this.retryTimer = setTimeout(() => {
          if (!this.isConnected && this.roomCode) {
            this.enterRoom(this.roomCode, this.preferredColor);
          }
        }, 2200);
      }
    });
  }

  _connectAsGuest(hostPeerId) {
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
    }
    this.isHost = false;
    const guestPeer = new Peer(undefined, PEER_CONFIG);
    this.peer = guestPeer;

    guestPeer.on('open', () => {
      const conn = guestPeer.connect(hostPeerId, { reliable: true });
      this.conn = conn;
      this._setupConnection(conn);
    });

    guestPeer.on('error', (err) => {
      if (err.type === 'peer-unavailable') {
        // Host just left or switched apps; claim the room as Host and wait for them!
        this.retryTimer = setTimeout(() => {
          if (!this.isConnected && this.roomCode) {
            this.enterRoom(this.roomCode, this.preferredColor);
          }
        }, 1200);
      }
    });
  }

  _setupConnection(conn) {
    conn.on('open', () => {
      this.isConnected = true;
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      if (this.isHost) {
        const guestColor = this.myColor === 'w' ? 'b' : 'w';
        conn.send({
          type: 'welcome',
          guestColor,
          roomCode: this.roomCode
        });
        this.onConnected?.({
          myColor: this.myColor,
          roomCode: this.roomCode,
          isHost: true
        });
      }
    });

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'welcome') {
        this.myColor = data.guestColor || 'b';
        this.isConnected = true;
        this.onConnected?.({
          myColor: this.myColor,
          roomCode: this.roomCode,
          isHost: false
        });
      } else if (data.type === 'move') {
        this.onRemoteMove?.({
          from: data.from,
          to: data.to,
          promotion: data.promotion
        });
      } else if (data.type === 'reset') {
        this.onRemoteReset?.();
      } else if (data.type === 'chat') {
        this.onRemoteChat?.({
          text: String(data.text || '').slice(0, 240),
          sender: String(data.sender || 'Rival').slice(0, 24),
          color: data.color || 'b'
        });
      }
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.onStatusChange?.({
        state: 'waiting',
        roomCode: this.roomCode,
        shareUrl: this.getShareUrl(),
        message: `🔌 Conexión en pausa en ${this.roomCode}. Reconectando automáticamente cuando el otro jugador vuelva a la pestaña...`
      });
      this.retryTimer = setTimeout(() => {
        if (!this.isConnected && this.roomCode) {
          this.enterRoom(this.roomCode, this.myColor);
        }
      }, 1500);
    });
  }

  sendMove(from, to, promotion = null) {
    if (this.isConnected && this.conn?.open) {
      this.conn.send({ type: 'move', from, to, promotion });
    }
  }

  sendReset() {
    if (this.isConnected && this.conn?.open) {
      this.conn.send({ type: 'reset' });
    }
  }

  sendChat(text, sender = 'Jugador') {
    const cleanText = String(text || '').trim().slice(0, 240);
    if (!cleanText) return false;
    if (this.isConnected && this.conn?.open) {
      this.conn.send({
        type: 'chat',
        text: cleanText,
        sender,
        color: this.myColor
      });
      return true;
    }
    return false;
  }

  getShareUrl() {
    const url = new URL(PUBLIC_GAME_URL);
    url.searchParams.set('room', this.roomCode);
    url.searchParams.set('v', '4');
    return url.toString();
  }
}
