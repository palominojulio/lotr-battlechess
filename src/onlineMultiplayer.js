import Peer from 'peerjs';

const PEER_PREFIX = 'lotr-bchess-v1-';

export class OnlineRoomManager {
  constructor({ onStatusChange, onRemoteMove, onRemoteReset, onConnected }) {
    this.peer = null;
    this.conn = null;
    this.roomCode = null;
    this.myColor = 'w'; // 'w' (Gondor) or 'b' (Mordor)
    this.isConnected = false;
    this.isHost = false;

    this.onStatusChange = onStatusChange;
    this.onRemoteMove = onRemoteMove;
    this.onRemoteReset = onRemoteReset;
    this.onConnected = onConnected;
  }

  disconnect() {
    if (this.conn) {
      try { this.conn.close(); } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
    this.isConnected = false;
    this.roomCode = null;
  }

  createRoom(hostColor = 'w') {
    this.disconnect();
    this.isHost = true;
    this.myColor = hostColor;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.roomCode = `SANTI-${randomNum}`;
    const fullPeerId = `${PEER_PREFIX}${this.roomCode}`;

    this.onStatusChange?.({
      state: 'creating',
      roomCode: this.roomCode,
      message: '⏳ Creando sala en la Tierra Media...'
    });

    this.peer = new Peer(fullPeerId);

    this.peer.on('open', () => {
      this.onStatusChange?.({
        state: 'waiting',
        roomCode: this.roomCode,
        myColor: this.myColor,
        shareUrl: this.getShareUrl(),
        message: `✅ Sala ${this.roomCode} lista. Comparte el enlace con Santi y espera a que entre.`
      });
    });

    this.peer.on('connection', (conn) => {
      this.conn = conn;
      this._setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      this.onStatusChange?.({
        state: 'error',
        roomCode: this.roomCode,
        message: `⚠️ Error de red P2P: ${err.type || err.message}. Intenta crear la sala de nuevo.`
      });
    });
  }

  joinRoom(rawCode) {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    this.disconnect();
    this.isHost = false;
    this.roomCode = cleanCode;
    const targetPeerId = `${PEER_PREFIX}${cleanCode}`;

    this.onStatusChange?.({
      state: 'joining',
      roomCode: cleanCode,
      message: `⏳ Conectando con la sala ${cleanCode}...`
    });

    this.peer = new Peer();

    this.peer.on('open', () => {
      const conn = this.peer.connect(targetPeerId, { reliable: true });
      this.conn = conn;
      this._setupConnection(conn);
    });

    this.peer.on('error', (err) => {
      this.onStatusChange?.({
        state: 'error',
        roomCode: cleanCode,
        message: `⚠️ No se pudo conectar a la sala ${cleanCode} (${err.type || 'sala no encontrada'}).`
      });
    });
  }

  _setupConnection(conn) {
    conn.on('open', () => {
      this.isConnected = true;
      if (this.isHost) {
        // Send welcome packet telling guest which color they play
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
      }
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.onStatusChange?.({
        state: 'disconnected',
        roomCode: this.roomCode,
        message: '🔌 El otro jugador se ha desconectado de la partida.'
      });
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

  getShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomCode);
    return url.toString();
  }
}
