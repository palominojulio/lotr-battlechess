import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Chess } from 'chess.js';
import { getPieceLore } from './lotrLore.js';
import { createLOTRPieceMesh } from './pieceBuilder.js';
import { animateWalk, executeCinematicCombat, spawnParticleBurst } from './combatSystem.js';
import { chooseBestMove } from './aiEngine.js';
import { soundFX } from './soundFX.js';
import { OnlineRoomManager, PUBLIC_GAME_URL, extractRoomCode } from './onlineMultiplayer.js';

// --- Constants & Board Mapping ---
const TILE_SIZE = 1.65;
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function squareToWorld(square) {
  const file = FILES.indexOf(square[0]);
  const rank = parseInt(square[1], 10) - 1;
  // White on rank 1 (+Z), Black on rank 8 (-Z)
  const x = (file - 3.5) * TILE_SIZE;
  const z = (3.5 - rank) * TILE_SIZE;
  return new THREE.Vector3(x, 0, z);
}

function coordsToSquare(fileIdx, rankIdx) {
  return `${FILES[fileIdx]}${rankIdx + 1}`;
}

// --- Game State ---
const chess = new Chess();
let gameMode = 'ai-2'; // 'ai-1', 'ai-2', 'ai-3', 'pvp', 'online'
let cinematicCameraEnabled = true;
let isAnimating = false;
let selectedSquare = null;
let legalMovesForSelected = [];
let lastMoveSnapshot = null; // { preFen, from, to, promotion } for WhatsApp turn sharing

const pieceMeshes = new Map(); // square -> THREE.Group
const tileMeshes = new Map();  // square -> THREE.Mesh
const highlightMeshes = [];
const activeParticles = [];

const capturedByWhite = [];
const capturedByBlack = [];

// --- Three.js Scene Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080a10);
scene.fog = new THREE.FogExp2(0x080a10, 0.024);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 150);
const defaultWhiteCamPos = new THREE.Vector3(0, 12.2, 13.8);
camera.position.copy(defaultWhiteCamPos);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2 - 0.06;
controls.minDistance = 5;
controls.maxDistance = 28;
controls.target.set(0, 0.5, 0);

// --- Lighting (Gondor Blue-Gold vs. Mordor Crimson Lava) ---
const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
scene.add(ambientLight);

const mainSun = new THREE.DirectionalLight(0xfffbeb, 1.45);
mainSun.position.set(8, 18, 10);
mainSun.castShadow = true;
mainSun.shadow.mapSize.width = 2048;
mainSun.shadow.mapSize.height = 2048;
mainSun.shadow.camera.near = 1;
mainSun.shadow.camera.far = 45;
const d = 10;
mainSun.shadow.camera.left = -d;
mainSun.shadow.camera.right = d;
mainSun.shadow.camera.top = d;
mainSun.shadow.camera.bottom = -d;
scene.add(mainSun);

const gondorLight = new THREE.PointLight(0x38bdf8, 2.2, 22);
gondorLight.position.set(0, 5, 9);
scene.add(gondorLight);

const mordorLight = new THREE.PointLight(0xff6600, 3.8, 28);
mordorLight.position.set(0, 7, -8.5);
scene.add(mordorLight);

const mordorFill = new THREE.DirectionalLight(0xffedd5, 0.95);
mordorFill.position.set(-8, 15, -12);
scene.add(mordorFill);

// --- Build Middle-earth x Cyber-Laser Board & Environment ---
const boardGroup = new THREE.Group();
scene.add(boardGroup);

function buildBoardArena() {
  // Outer Citadel Frame
  const frameSize = TILE_SIZE * 8 + 1.3;
  const frameGeo = new THREE.BoxGeometry(frameSize, 0.45, frameSize);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x161922,
    metalness: 0.78,
    roughness: 0.32
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.position.y = -0.24;
  frameMesh.receiveShadow = true;
  boardGroup.add(frameMesh);

  // Glowing Runic Cyber Border
  const borderLineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(frameSize + 0.04, 0.46, frameSize + 0.04));
  const borderLineMat = new THREE.LineBasicMaterial({ color: 0xe6c259 });
  const borderLines = new THREE.LineSegments(borderLineGeo, borderLineMat);
  borderLines.position.y = -0.24;
  boardGroup.add(borderLines);

  // 64 Squares (High-contrast Gondor Marble & Slate Bluestone so both White and Black pieces pop)
  const lightTileMat = new THREE.MeshStandardMaterial({
    color: 0xe2dfd7,
    metalness: 0.2,
    roughness: 0.35
  });
  const darkTileMat = new THREE.MeshStandardMaterial({
    color: 0x526178,
    metalness: 0.25,
    roughness: 0.45
  });

  const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.98, 0.16, TILE_SIZE * 0.98);

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const isLight = (r + f) % 2 === 1;
      const square = coordsToSquare(f, r);
      const tile = new THREE.Mesh(tileGeo, isLight ? lightTileMat.clone() : darkTileMat.clone());
      const pos = squareToWorld(square);
      tile.position.set(pos.x, -0.08, pos.z);
      tile.receiveShadow = true;
      tile.userData = { square, isLight };
      boardGroup.add(tile);
      tileMeshes.set(square, tile);
    }
  }

  // 4 Corner Cyber-Medieval Watchtowers (Gondor Blue on +Z, Mordor Red on -Z)
  const corners = [
    [-1, 1, 0x00e5ff],
    [1, 1, 0x00e5ff],
    [-1, -1, 0xff1133],
    [1, -1, 0xff1133]
  ];
  const offset = (TILE_SIZE * 4) + 0.85;
  corners.forEach(([cx, cz, crystalColor]) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(cx * offset, 0, cz * offset);

    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.44, 2.2, 8),
      frameMat
    );
    col.position.y = 0.9;
    col.castShadow = true;
    pillarGroup.add(col);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshBasicMaterial({ color: crystalColor })
    );
    crystal.position.y = 2.4;
    crystal.userData.isCrystal = true;
    pillarGroup.add(crystal);

    boardGroup.add(pillarGroup);
  });
}

buildBoardArena();

// --- Sync Pieces with Chess.js State ---
function rebuildAllPieces() {
  for (const mesh of pieceMeshes.values()) {
    scene.remove(mesh);
  }
  pieceMeshes.clear();

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[7 - r][f];
      if (cell) {
        const sq = coordsToSquare(f, r);
        const mesh = createLOTRPieceMesh(cell.type, cell.color);
        mesh.position.copy(squareToWorld(sq));
        mesh.userData.square = sq;
        scene.add(mesh);
        pieceMeshes.set(sq, mesh);
      }
    }
  }
}

// --- Highlights for Selected Square & Legal Moves ---
function clearHighlights() {
  while (highlightMeshes.length > 0) {
    const m = highlightMeshes.pop();
    scene.remove(m);
  }
}

function showHighlights(originSquare, moves) {
  clearHighlights();

  // Origin ring
  const originPos = squareToWorld(originSquare);
  const selGeo = new THREE.RingGeometry(0.55, 0.72, 28);
  selGeo.rotateX(-Math.PI / 2);
  const selMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
  const selMesh = new THREE.Mesh(selGeo, selMat);
  selMesh.position.set(originPos.x, 0.02, originPos.z);
  scene.add(selMesh);
  highlightMeshes.push(selMesh);

  // Legal destination markers
  moves.forEach((m) => {
    const pos = squareToWorld(m.to);
    const isCapture = Boolean(m.captured);
    const geo = isCapture
      ? new THREE.RingGeometry(0.52, 0.76, 6)
      : new THREE.CircleGeometry(0.28, 24);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: isCapture ? 0xff1e1e : 0x38bdf8,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    });

    const marker = new THREE.Mesh(geo, mat);
    marker.position.set(pos.x, 0.025, pos.z);
    scene.add(marker);
    highlightMeshes.push(marker);
  });
}

// --- Camera Transitions ---
let camAnim = null;

function animateCameraTo(targetPos, targetLookAt, duration = 650) {
  return new Promise((resolve) => {
    camAnim = {
      startPos: camera.position.clone(),
      endPos: targetPos.clone(),
      startLook: controls.target.clone(),
      endLook: targetLookAt.clone(),
      startTime: performance.now(),
      duration,
      resolve
    };
  });
}

function setCameraPreset(preset) {
  if (preset === 'white') {
    animateCameraTo(new THREE.Vector3(0, 12.2, 13.8), new THREE.Vector3(0, 0.5, 0));
  } else if (preset === 'black') {
    animateCameraTo(new THREE.Vector3(0, 12.2, -13.8), new THREE.Vector3(0, 0.5, 0));
  } else if (preset === 'top') {
    animateCameraTo(new THREE.Vector3(0, 18.5, 0.01), new THREE.Vector3(0, 0, 0));
  } else if (preset === 'side') {
    animateCameraTo(new THREE.Vector3(14.5, 8.5, 0), new THREE.Vector3(0, 0.8, 0));
  }
}

// --- UI Updates ---
const turnDot = document.getElementById('turn-dot');
const turnFactionName = document.getElementById('turn-faction-name');
const gameStatusText = document.getElementById('game-status-text');
const battleLog = document.getElementById('battle-log');
const moveCounterEl = document.getElementById('move-counter');
const capturedBlackEl = document.getElementById('captured-black');
const capturedWhiteEl = document.getElementById('captured-white');

const champFactionEl = document.getElementById('champ-faction');
const champRoleEl = document.getElementById('champ-chess-type');
const champNameEl = document.getElementById('champ-name');
const champWeaponEl = document.getElementById('champ-weapon');
const champLoreEl = document.getElementById('champ-lore');
const champStyleEl = document.getElementById('champ-combat-style');

const combatOverlay = document.getElementById('combat-overlay');
const combatAttackerName = document.getElementById('combat-attacker-name');
const combatDefenderName = document.getElementById('combat-defender-name');
const combatAttackerHp = document.getElementById('combat-attacker-hp');
const combatDefenderHp = document.getElementById('combat-defender-hp');
const combatCaption = document.getElementById('combat-caption');

function inspectPieceUI(color, type) {
  const lore = getPieceLore(color, type);
  champFactionEl.textContent = lore.faction;
  champFactionEl.className = `champion-badge ${color === 'b' ? 'mordor' : ''}`;
  champRoleEl.textContent = lore.chessRole;
  champNameEl.textContent = `${lore.icon} ${lore.name}`;
  champWeaponEl.textContent = lore.weapon;
  champLoreEl.textContent = `"${lore.lore}"`;
  champStyleEl.textContent = `⚔️ Finisher: ${lore.combatStyle}`;
}

function updateHUD() {
  const turn = chess.turn();
  const isWhite = turn === 'w';
  turnDot.className = `faction-dot ${isWhite ? 'white-faction' : 'black-faction'}`;
  turnFactionName.textContent = isWhite
    ? 'Turno: Orden de Gondor (Blancas)'
    : 'Turno: Imperio de Mordor (Negras)';

  if (chess.isCheckmate()) {
    const winner = isWhite ? 'Imperio de Mordor (Negras)' : 'Orden de Gondor (Blancas)';
    gameStatusText.textContent = `¡JAQUE MATE! Victoria de ${winner}`;
  } else if (chess.isDraw()) {
    gameStatusText.textContent = '¡Tablas! Tregua en la Tierra Media';
  } else if (chess.inCheck()) {
    const kingName = isWhite ? 'Aragorn' : 'Darth Sauron';
    gameStatusText.textContent = `⚠️ ¡JAQUE A ${kingName.toUpperCase()}!`;
  } else {
    gameStatusText.textContent = isAnimating
      ? '⚔️ Duelo cinemático en curso...'
      : 'Selecciona un campeón o casilla';
  }

  moveCounterEl.textContent = `Jugada ${chess.moveNumber()}`;
}

function renderCasualties() {
  capturedBlackEl.innerHTML = capturedByWhite
    .map((l) => `<span class="casualty-chip" title="${l.name}">${l.icon} ${l.shortName}</span>`)
    .join('');
  capturedWhiteEl.innerHTML = capturedByBlack
    .map((l) => `<span class="casualty-chip" title="${l.name}">${l.icon} ${l.shortName}</span>`)
    .join('');
}

const SPANISH_PIECE_MAP = { N: 'C', B: 'A', R: 'T', Q: 'D', K: 'R' };

function toSpanishSAN(san) {
  if (!san) return '';
  return san.replace(/[NBRQK]/g, (m) => SPANISH_PIECE_MAP[m] || m);
}

const notationTbody = document.getElementById('notation-tbody');
const notationSheetWrap = document.getElementById('notation-sheet-wrap');

function renderMoveNotation() {
  if (!notationTbody) return;
  const history = chess.history({ verbose: true });
  if (history.length === 0) {
    notationTbody.innerHTML =
      '<tr class="notation-empty-row"><td colspan="3">Sin movimientos aún (ej. 1. e4 e5)</td></tr>';
    return;
  }

  let rowsHtml = '';
  for (let i = 0; i < history.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const wMove = history[i];
    const bMove = history[i + 1];

    const wSan = toSpanishSAN(wMove.san);
    const wSep = wMove.captured ? '×' : '→';
    const wCell = `<span class="notation-san">${wSan}</span><span class="notation-coords">(${wMove.from}${wSep}${wMove.to})</span>`;

    let bCell = '—';
    if (bMove) {
      const bSan = toSpanishSAN(bMove.san);
      const bSep = bMove.captured ? '×' : '→';
      bCell = `<span class="notation-san">${bSan}</span><span class="notation-coords">(${bMove.from}${bSep}${bMove.to})</span>`;
    }

    rowsHtml += `<tr>
      <td class="notation-turn-num">${moveNum}.</td>
      <td class="notation-cell-white ${wMove.captured ? 'notation-capture' : ''}">${wCell}</td>
      <td class="notation-cell-black ${bMove?.captured ? 'notation-capture' : ''}">${bCell}</td>
    </tr>`;
  }

  notationTbody.innerHTML = rowsHtml;
  if (notationSheetWrap) {
    notationSheetWrap.scrollTop = notationSheetWrap.scrollHeight;
  }
}

function appendBattleLog(moveResult) {
  const attLore = getPieceLore(moveResult.color, moveResult.piece);
  const li = document.createElement('li');
  const historyLen = chess.history().length;
  const moveNum = Math.ceil(historyLen / 2);
  const prefix = moveResult.color === 'w' ? `${moveNum}.` : `${moveNum}...`;
  const espSan = toSpanishSAN(moveResult.san);
  const coordStr = `${moveResult.from}${moveResult.captured ? '×' : '→'}${moveResult.to}`;

  if (moveResult.captured) {
    const defColor = moveResult.color === 'w' ? 'b' : 'w';
    const defLore = getPieceLore(defColor, moveResult.captured);
    li.className = 'log-entry capture-log';
    li.textContent = `[${prefix} ${espSan} (${coordStr})] ⚔️ ${attLore.shortName} ejecuta a ${defLore.shortName}`;
  } else {
    li.className = `log-entry ${moveResult.color === 'w' ? 'white-move' : 'black-move'}`;
    li.textContent = `[${prefix} ${espSan} (${coordStr})] ${attLore.icon} ${attLore.shortName}`;
  }

  battleLog.prepend(li);
  renderMoveNotation();
}

// --- Dialogs (Native <dialog> following modern-web-guidance) ---
const promoDialog = document.getElementById('promotion-dialog');
const gameoverDialog = document.getElementById('gameover-dialog');
const gameoverTitle = document.getElementById('gameover-title');
const gameoverMessage = document.getElementById('gameover-message');

// Guard `cancel` event on promotion-dialog (`closedby="none"`) so Esc doesn't skip choosing a promotion piece
promoDialog.addEventListener('cancel', (e) => {
  e.preventDefault();
});

// Fallback for light-dismiss on `dialog[closedby="any"]` where closedBy is unsupported
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
    dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dialog)) dialog.close(); });
  }
}

gameoverDialog.addEventListener('close', () => {
  const choice = gameoverDialog.returnValue;
  gameoverDialog.returnValue = '';
  if (choice === 'new-game') {
    resetGame();
  }
});

function promptPawnPromotion(color) {
  return new Promise((resolve) => {
    const isW = color === 'w';
    document.getElementById('promo-name-q').textContent = isW ? 'Dama Galadriel (Sable Doble)' : 'Rey Brujo (Sable Doble)';
    document.getElementById('promo-name-r').textContent = isW ? 'Mecha-Bárbol (Torre)' : 'Ciber-Troll (Torre)';
    document.getElementById('promo-name-b').textContent = isW ? 'Gandalf Cyber-Maia' : 'Conde Saruman';
    document.getElementById('promo-name-n').textContent = isW ? 'Rohirrim en Caballo Robot' : 'Nazgûl en Caballo Robot';

    function onClose() {
      promoDialog.removeEventListener('close', onClose);
      const val = promoDialog.returnValue || 'q';
      promoDialog.returnValue = '';
      resolve(val);
    }

    promoDialog.addEventListener('close', onClose);
    promoDialog.showModal();
  });
}

// --- Execute Move + Battle Chess Animations ---
function triggerBurst(pos, colorHex, count = 28, speed = 4.2) {
  const burst = spawnParticleBurst(scene, pos, colorHex, count, speed);
  activeParticles.push(...burst);
}

async function performChessMove(from, to, promotionPiece = null, isRemote = false) {
  if (isAnimating) return false;
  isAnimating = true;
  clearHighlights();
  selectedSquare = null;
  legalMovesForSelected = [];

  const preMoveFen = chess.fen();

  // Check if promotion is needed
  const movingPiece = chess.get(from);
  const targetRank = to[1];
  const isPromo =
    movingPiece &&
    movingPiece.type === 'p' &&
    ((movingPiece.color === 'w' && targetRank === '8') ||
      (movingPiece.color === 'b' && targetRank === '1'));

  let promo = promotionPiece;
  if (isPromo && !promo) {
    const isAITurn = gameMode.startsWith('ai') && movingPiece.color === 'b';
    promo = isAITurn || isRemote ? 'q' : await promptPawnPromotion(movingPiece.color);
  }

  let moveResult;
  try {
    moveResult = chess.move({ from, to, promotion: promo || 'q' });
  } catch {
    isAnimating = false;
    return false;
  }

  if (!moveResult) {
    isAnimating = false;
    return false;
  }

  lastMoveSnapshot = {
    preFen: preMoveFen,
    from,
    to,
    promotion: moveResult.promotion || null
  };

  if (gameMode === 'online' && !isRemote) {
    onlineManager.sendMove(from, to, moveResult.promotion || null);
  }

  updateHUD();

  // Play faction movement sound: R2-D2 chirp for White (Gondor), Orc growl for Black (Mordor)
  if (moveResult.color === 'w') {
    soundFX.playR2D2Chirp();
  } else {
    soundFX.playOrcGrowl();
  }

  const attackerMesh = pieceMeshes.get(from);
  const targetPos = squareToWorld(to);

  // Handle En Passant captured square
  let capturedSquare = to;
  if (moveResult.flags.includes('e')) {
    capturedSquare = `${to[0]}${from[1]}`;
  }

  const defenderMesh = moveResult.captured ? pieceMeshes.get(capturedSquare) : null;

  if (attackerMesh && defenderMesh) {
    // BATTLE CHESS CINEMATIC CAPTURE DUEL!
    const attLore = attackerMesh.userData.lore;
    const defLore = defenderMesh.userData.lore;

    // Show Combat Overlay
    combatOverlay.hidden = false;
    combatAttackerName.textContent = `${attLore.icon} ${attLore.name}`;
    combatDefenderName.textContent = `${defLore.icon} ${defLore.name}`;
    combatAttackerHp.style.width = '100%';
    combatDefenderHp.style.width = '100%';
    combatCaption.textContent = `⚔️ ¡Duelo a muerte en ${to.toUpperCase()}!`;

    const savedCamPos = camera.position.clone();
    const savedTarget = controls.target.clone();

    if (cinematicCameraEnabled) {
      const midpoint = attackerMesh.position.clone().lerp(defenderMesh.position, 0.55);
      const dir = new THREE.Vector3().subVectors(defenderMesh.position, attackerMesh.position).normalize();
      // Perpendicular dramatic side-angle camera
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const duelCamPos = midpoint.clone().addScaledVector(side, 4.6).add(new THREE.Vector3(0, 3.1, 0));
      await animateCameraTo(duelCamPos, midpoint.clone().add(new THREE.Vector3(0, 0.7, 0)), 480);
    }

    await executeCinematicCombat({
      scene,
      attackerMesh,
      defenderMesh,
      targetPos,
      spawnBurst: triggerBurst,
      onCombatProgress: ({ attackerHp, defenderHp, caption }) => {
        combatAttackerHp.style.width = `${attackerHp}%`;
        combatDefenderHp.style.width = `${defenderHp}%`;
        if (caption) combatCaption.textContent = caption;
      }
    });

    // Remove slain defender mesh and record casualty
    scene.remove(defenderMesh);
    pieceMeshes.delete(capturedSquare);

    if (moveResult.color === 'w') {
      capturedByWhite.push(defLore);
    } else {
      capturedByBlack.push(defLore);
    }
    renderCasualties();

    if (cinematicCameraEnabled) {
      await animateCameraTo(savedCamPos, savedTarget, 520);
    }
    combatOverlay.hidden = true;
  } else if (attackerMesh) {
    // Normal walk / gallop
    await animateWalk(attackerMesh, targetPos, 540);
  }

  // Update piece map & handle Castling or Promotion mesh replacement
  if (attackerMesh) {
    pieceMeshes.delete(from);
    attackerMesh.userData.square = to;
    pieceMeshes.set(to, attackerMesh);
  }

  // Handle Castling Rook movement (`k` or `q` flags)
  if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
    const rank = moveResult.color === 'w' ? '1' : '8';
    const rookFrom = moveResult.flags.includes('k') ? `h${rank}` : `a${rank}`;
    const rookTo = moveResult.flags.includes('k') ? `f${rank}` : `d${rank}`;
    const rookMesh = pieceMeshes.get(rookFrom);
    if (rookMesh) {
      await animateWalk(rookMesh, squareToWorld(rookTo), 400);
      pieceMeshes.delete(rookFrom);
      rookMesh.userData.square = rookTo;
      pieceMeshes.set(rookTo, rookMesh);
    }
  }

  // Handle Pawn Promotion mesh upgrade
  if (moveResult.promotion) {
    const oldMesh = pieceMeshes.get(to);
    if (oldMesh) scene.remove(oldMesh);
    const promotedMesh = createLOTRPieceMesh(moveResult.promotion, moveResult.color);
    promotedMesh.position.copy(targetPos);
    promotedMesh.userData.square = to;
    scene.add(promotedMesh);
    pieceMeshes.set(to, promotedMesh);
    triggerBurst(targetPos, promotedMesh.userData.lore.saberColor, 35, 4.5);
    soundFX.playHornFanfare();
  }

  appendBattleLog(moveResult);
  isAnimating = false;
  updateHUD();

  // Check Game Over
  if (chess.isGameOver()) {
    soundFX.playHornFanfare();
    if (chess.isCheckmate()) {
      const winnerIsWhite = moveResult.color === 'w';
      gameoverTitle.textContent = winnerIsWhite
        ? '☀️ ¡Victoria de la Orden de Gondor!'
        : '👁️ ¡Triunfo del Imperio de Mordor!';
      gameoverMessage.textContent = winnerIsWhite
        ? 'Aragorn y los Pueblos Libres han destruido el poder oscuro de Darth Sauron con sus sables de luz.'
        : 'Las legiones cibernéticas de Mordor y los Caballos Robot Nazgûl han conquistado la Tierra Media.';
    } else {
      gameoverTitle.textContent = '⚖️ ¡Tregua en la Tierra Media!';
      gameoverMessage.textContent = 'La batalla ha terminado en tablas tras un duelo legendario.';
    }
    gameoverDialog.showModal();
    return true;
  }

  // Trigger AI move if it's Black's turn in AI mode
  if (gameMode.startsWith('ai') && chess.turn() === 'b') {
    const aiLevel = parseInt(gameMode.split('-')[1], 10) || 2;
    setTimeout(async () => {
      if (chess.turn() === 'b' && !chess.isGameOver() && !isAnimating) {
        const aiMove = chooseBestMove(chess, aiLevel);
        if (aiMove) {
          await performChessMove(aiMove.from, aiMove.to, aiMove.promotion);
        }
      }
    }, 320);
  }

  return true;
}

// --- Raycasting & Click Interaction ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  // Play the short Star Wars chorus ONCE at the very start of the match
  if (!userMutedMidi && !soundFX.introPlayed && soundFX.enabled) {
    soundFX.startMusic();
    updateMidiButtonUI(true);
  }
});

renderer.domElement.addEventListener('pointerup', async (e) => {
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 6 || isAnimating) return; // Ignore camera drag

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // Check pieces and board tiles
  const allTargets = [...tileMeshes.values(), ...pieceMeshes.values()];
  const intersects = raycaster.intersectObjects(allTargets, true);
  if (intersects.length === 0) return;

  let hitObj = intersects[0].object;
  while (hitObj && !hitObj.userData?.square && hitObj.parent) {
    hitObj = hitObj.parent;
  }
  const clickedSquare = hitObj?.userData?.square;
  if (!clickedSquare) return;

  // If a piece is already selected and user clicked a legal destination square:
  const matchingMove = legalMovesForSelected.find((m) => m.to === clickedSquare);
  if (selectedSquare && matchingMove) {
    await performChessMove(selectedSquare, clickedSquare);
    return;
  }

  // Otherwise check if user clicked a piece
  const pieceOnSquare = chess.get(clickedSquare);
  if (pieceOnSquare) {
    inspectPieceUI(pieceOnSquare.color, pieceOnSquare.type);
    soundFX.playSelect();

    // Only allow selecting active turn's pieces (and only White if vs AI, or only myColor if Online)
    const isHumanTurn =
      pieceOnSquare.color === chess.turn() &&
      !(gameMode.startsWith('ai') && pieceOnSquare.color === 'b') &&
      !(gameMode === 'online' && onlineManager.isConnected && pieceOnSquare.color !== onlineManager.myColor);

    if (isHumanTurn) {
      selectedSquare = clickedSquare;
      legalMovesForSelected = chess.moves({ square: clickedSquare, verbose: true });
      showHighlights(clickedSquare, legalMovesForSelected);
    } else {
      clearHighlights();
      selectedSquare = null;
      legalMovesForSelected = [];
    }
  } else {
    clearHighlights();
    selectedSquare = null;
    legalMovesForSelected = [];
  }
});

// --- Online P2P Multiplayer, In-Game Chat & WhatsApp Sharing ---
const onlineDialog = document.getElementById('online-dialog');
const onlineShareBox = document.getElementById('online-share-box');
const onlineRoomCodeEl = document.getElementById('online-room-code');
const onlineShareUrlInput = document.getElementById('online-share-url');
const onlineJoinInput = document.getElementById('online-join-input');
const onlineStatusBanner = document.getElementById('online-status-banner');
const gameModeSelect = document.getElementById('game-mode-select');
const btnOnlineRoom = document.getElementById('btn-online-room');

const chatMessagesEl = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatStatusBadge = document.getElementById('chat-status-badge');
let lastChatSent = '';

const AI_CHAT_REPLIES = [
  '👁️ Darth Sauron: «¡No conoces el poder del Lado Oscuro del Anillo Único!»',
  '🤖 Nazgûl Ciber: «¡Nuestros caballos robot y sables rojos aplastarán Minas Tirith!»',
  '🔥 Uruk-Sith: «¡La era de los Jedi de Gondor ha terminado!»',
  '⚡ Conde Saruman: «¡Mis rayos de la Fuerza reducirán tus torres a cenizas!»'
];

function appendChatMessage({ sender, text, color = 'w', isSystem = false, playAudio = true }) {
  if (!chatMessagesEl || !text) return;
  const div = document.createElement('div');
  if (isSystem) {
    div.className = 'chat-msg system-msg';
    div.textContent = text;
  } else {
    div.className = `chat-msg ${color === 'w' ? 'white-msg' : 'black-msg'}`;
    const strong = document.createElement('span');
    strong.className = 'chat-sender';
    strong.textContent = `${sender}:`;
    div.appendChild(strong);
    div.appendChild(document.createTextNode(` ${text}`));
    if (playAudio) {
      if (color === 'w') soundFX.playR2D2Chirp();
      else soundFX.playOrcGrowl();
    }
  }
  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

const onlineManager = new OnlineRoomManager({
  onStatusChange: ({ state, roomCode, shareUrl, message }) => {
    if (onlineStatusBanner && message) {
      onlineStatusBanner.textContent = message;
    }
    if (state === 'waiting' && shareUrl) {
      onlineShareBox.hidden = false;
      onlineRoomCodeEl.textContent = roomCode;
      onlineShareUrlInput.value = shareUrl;
      if (chatStatusBadge) chatStatusBadge.textContent = `⏳ Sala ${roomCode}`;
    }
  },
  onConnected: ({ myColor, roomCode }) => {
    gameMode = 'online';
    if (gameModeSelect) gameModeSelect.value = 'online';
    const factionLabel = myColor === 'w' ? 'Gondor (Blancas)' : 'Mordor (Negras)';
    if (onlineStatusBanner) {
      onlineStatusBanner.textContent = `🎉 ¡Conectado en directo en la sala ${roomCode}! Juegas con ${factionLabel}.`;
    }
    if (btnOnlineRoom) {
      btnOnlineRoom.textContent = `🟢 Online: ${roomCode}`;
    }
    if (chatStatusBadge) {
      chatStatusBadge.textContent = `🟢 En Vivo (${roomCode})`;
    }
    appendChatMessage({
      isSystem: true,
      text: `🎉 ¡Conectado en directo con Santi en la sala ${roomCode}! Escribe abajo para hablar.`
    });
    setCameraPreset(myColor === 'w' ? 'white' : 'black');
    soundFX.playHornFanfare();
    resetGame(true);
    setTimeout(() => {
      if (onlineDialog?.open) onlineDialog.close();
    }, 900);
  },
  onRemoteMove: async ({ from, to, promotion }) => {
    await performChessMove(from, to, promotion, true);
  },
  onRemoteReset: () => {
    resetGame(true);
  },
  onRemoteChat: ({ text, sender, color }) => {
    appendChatMessage({ sender, text, color, playAudio: true });
  }
});

function handleSendChat(rawText) {
  const clean = String(rawText || '').trim();
  if (!clean) return;

  const myColor = onlineManager.isConnected ? onlineManager.myColor : chess.turn();
  const senderName = myColor === 'w' ? '☀️ Gondor (Blancas)' : '👁️ Mordor (Negras)';

  lastChatSent = clean;
  appendChatMessage({ sender: senderName, text: clean, color: myColor, playAudio: true });

  if (onlineManager.isConnected) {
    onlineManager.sendChat(clean, senderName);
  } else if (gameMode.startsWith('ai')) {
    setTimeout(() => {
      const reply = AI_CHAT_REPLIES[Math.floor(Math.random() * AI_CHAT_REPLIES.length)];
      appendChatMessage({ sender: '👁️ Mordor IA', text: reply, color: 'b', playAudio: true });
    }, 650);
  }
}

chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!chatInput?.value) return;
  handleSendChat(chatInput.value);
  chatInput.value = '';
});

document.querySelectorAll('.chat-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    if (chip.dataset.msg) handleSendChat(chip.dataset.msg);
  });
});

if (btnOnlineRoom && onlineDialog) {
  btnOnlineRoom.addEventListener('click', () => {
    onlineDialog.showModal();
    if (!onlineManager.roomCode) {
      onlineManager.createRoom('w');
    }
  });
}

document.getElementById('btn-host-white')?.addEventListener('click', () => {
  onlineManager.createRoom('w');
});

document.getElementById('btn-host-black')?.addEventListener('click', () => {
  onlineManager.createRoom('b');
});

document.getElementById('btn-join-room')?.addEventListener('click', () => {
  if (onlineJoinInput?.value) {
    const clean = extractRoomCode(onlineJoinInput.value);
    onlineJoinInput.value = clean;
    onlineManager.joinRoom(clean);
  }
});

document.getElementById('btn-copy-link')?.addEventListener('click', async (e) => {
  const url = onlineShareUrlInput?.value;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    e.target.textContent = '✅ ¡Enlace Copiado!';
    setTimeout(() => { e.target.textContent = '📋 Copiar Enlace'; }, 2000);
  } catch {
    onlineShareUrlInput.select();
  }
});

document.getElementById('btn-whatsapp-share')?.addEventListener('click', () => {
  const url = onlineShareUrlInput?.value || PUBLIC_GAME_URL;
  const code = onlineManager.roomCode || '';
  const text = `⚔️ ¡Santi! Entra a mi sala online de Battle Chess (El Señor de los Anillos x Star Wars) para jugar en directo (Sala ${code}):\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});

// Asynchronous / Instant WhatsApp Turn Share button ("💬 Mandar Jugada por WhatsApp a Santi")
document.getElementById('btn-whatsapp-turn')?.addEventListener('click', () => {
  const shareUrl = new URL(PUBLIC_GAME_URL);
  if (onlineManager.roomCode) {
    shareUrl.searchParams.set('room', onlineManager.roomCode);
    const text = `⚔️ ¡Santi! Estoy en la sala en vivo ${onlineManager.roomCode} de Battle Chess. Entra aquí desde tu móvil u ordenador para jugar en directo:\n${shareUrl.toString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    return;
  }

  if (lastMoveSnapshot) {
    shareUrl.searchParams.set('preFen', lastMoveSnapshot.preFen);
    shareUrl.searchParams.set('from', lastMoveSnapshot.from);
    shareUrl.searchParams.set('to', lastMoveSnapshot.to);
    if (lastMoveSnapshot.promotion) {
      shareUrl.searchParams.set('promo', lastMoveSnapshot.promotion);
    }
    if (lastChatSent) {
      shareUrl.searchParams.set('chat', lastChatSent);
    }
    const nextTurnName = chess.turn() === 'w' ? 'Gondor (Blancas)' : 'Mordor (Negras)';
    const chatPart = lastChatSent ? `\n💬 Mensaje: "${lastChatSent}"` : '';
    const text = `⚔️ ¡Santi! He movido de ${lastMoveSnapshot.from.toUpperCase()} a ${lastMoveSnapshot.to.toUpperCase()} en nuestro Battle Chess.${chatPart}\nAbre este enlace público para ver el duelo láser y hacer tu jugada con ${nextTurnName}:\n${shareUrl.toString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  } else {
    // No move made yet -> open the Online Room modal and auto-create a room for Santi!
    onlineDialog?.showModal();
    onlineManager.createRoom('w');
  }
});

// --- UI Controls Wiring ---
gameModeSelect.addEventListener('change', (e) => {
  gameMode = e.target.value;
  if (gameMode === 'online') {
    onlineDialog?.showModal();
  }
});

const btnCinematic = document.getElementById('btn-cinematic');
btnCinematic.addEventListener('click', () => {
  cinematicCameraEnabled = !cinematicCameraEnabled;
  btnCinematic.classList.toggle('active', cinematicCameraEnabled);
  btnCinematic.textContent = `🎥 Cámara Combate: ${cinematicCameraEnabled ? 'ON' : 'OFF'}`;
});

const btnSound = document.getElementById('btn-sound');
const btnMidi = document.getElementById('btn-midi');
const btnMidiNext = document.getElementById('btn-midi-next');
let userMutedMidi = false;

function updateMidiButtonUI(playing, trackName = null) {
  if (!btnMidi) return;
  btnMidi.classList.toggle('active', playing);
  const label = trackName || 'Estribillo Star Wars';
  btnMidi.textContent = playing ? `🎵 ${label}` : '🎵 Sonar Estribillo';
}

soundFX.onMusicEnd = () => {
  updateMidiButtonUI(false);
};

btnSound.addEventListener('click', () => {
  const on = soundFX.toggle();
  btnSound.classList.toggle('active', on);
  btnSound.textContent = `🔊 Sonido: ${on ? 'ON' : 'OFF'}`;
  if (!on) updateMidiButtonUI(false);
});

if (btnMidi) {
  btnMidi.addEventListener('click', () => {
    const { playing, trackName } = soundFX.toggleMusic();
    userMutedMidi = !playing;
    updateMidiButtonUI(playing, trackName);
  });
}

if (btnMidiNext) {
  btnMidiNext.addEventListener('click', () => {
    userMutedMidi = false;
    const trackName = soundFX.nextTrack();
    updateMidiButtonUI(true, trackName);
  });
}

function resetGame(isRemote = false) {
  if (isAnimating) return;
  chess.reset();
  lastMoveSnapshot = null;
  capturedByWhite.length = 0;
  capturedByBlack.length = 0;
  renderCasualties();
  renderMoveNotation();
  clearHighlights();
  selectedSquare = null;
  legalMovesForSelected = [];
  rebuildAllPieces();
  updateHUD();
  battleLog.innerHTML =
    '<li class="log-entry lore-intro">⚔️ Nueva guerra iniciada: Sables láser encendidos y corceles robot listos.</li>';
  if (gameMode === 'online' && !isRemote) {
    onlineManager.sendReset();
  }
  soundFX.startMusic();
  updateMidiButtonUI(true);
}

document.getElementById('btn-reset').addEventListener('click', () => resetGame(false));

document.getElementById('btn-undo').addEventListener('click', () => {
  if (isAnimating) return;
  chess.undo();
  if (gameMode.startsWith('ai')) {
    chess.undo();
  }
  clearHighlights();
  selectedSquare = null;
  legalMovesForSelected = [];
  rebuildAllPieces();
  renderMoveNotation();
  updateHUD();
});

document.getElementById('btn-copy-pgn')?.addEventListener('click', async (e) => {
  const history = chess.history({ verbose: true });
  let text = '';
  for (let i = 0; i < history.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const w = toSpanishSAN(history[i].san);
    const b = history[i + 1] ? ` ${toSpanishSAN(history[i + 1].san)}` : '';
    text += `${num}. ${w}${b} `;
  }
  const finalStr = text.trim() || 'Sin movimientos registrados';
  try {
    await navigator.clipboard.writeText(finalStr);
    e.target.textContent = '✅ Copiado';
    setTimeout(() => { e.target.textContent = '📋 PGN'; }, 1800);
  } catch {}
});

// "⚔️ Probar Combate" button: immediately triggers a capture duel (or sets up an instant clash!)
document.getElementById('btn-demo-battle').addEventListener('click', async () => {
  if (isAnimating || chess.isGameOver()) return;

  // Check if there is already a capture available on the board
  let allMoves = chess.moves({ verbose: true });
  let captures = allMoves.filter((m) => m.captured);

  if (captures.length > 0) {
    const chosen = captures[Math.floor(Math.random() * captures.length)];
    inspectPieceUI(chosen.color, chosen.piece);
    await performChessMove(chosen.from, chosen.to);
    return;
  }

  // If no capture is currently available (e.g., turn 1), quickly play a center gambit (e4 -> d5 -> exd5)
  // so the user immediately sees a full Battle Chess lightsaber/mecha execution!
  const savedMode = gameMode;
  gameMode = 'pvp'; // Temporarily pause auto-AI so we can orchestrate the clash
  const openingSteps = [
    ['e2', 'e4'],
    ['d7', 'd5'],
    ['e4', 'd5']
  ];
  for (const [from, to] of openingSteps) {
    const legal = chess.moves({ verbose: true }).find((m) => m.from === from && m.to === to);
    if (legal) {
      await performChessMove(from, to);
    }
  }
  gameMode = savedMode;
  // If after our scripted clash it's Black's turn in AI mode, let AI respond
  if (gameMode.startsWith('ai') && chess.turn() === 'b' && !chess.isGameOver()) {
    const aiLevel = parseInt(gameMode.split('-')[1], 10) || 2;
    const aiMove = chooseBestMove(chess, aiLevel);
    if (aiMove) {
      await performChessMove(aiMove.from, aiMove.to, aiMove.promotion);
    }
  }
});

document.querySelectorAll('.btn-cam').forEach((btn) => {
  btn.addEventListener('click', () => {
    setCameraPreset(btn.dataset.cam);
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Main Render & Idle Animation Loop ---
const clock = new THREE.Clock();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const elapsedTime = clock.getElapsedTime();

  // Camera smooth interpolation
  if (camAnim) {
    const t = Math.min(1, (now - camAnim.startTime) / camAnim.duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, ease);
    controls.target.lerpVectors(camAnim.startLook, camAnim.endLook, ease);
    if (t >= 1) {
      const done = camAnim.resolve;
      camAnim = null;
      done();
    }
  }

  controls.update();

  // Subtle idle breathing, lightsaber plasma pulse & oscillating Cylon/Cyber scanner eyes
  let idx = 0;
  for (const mesh of pieceMeshes.values()) {
    const parts = mesh.userData.parts;
    const scanners = mesh.userData.scanners;
    if (scanners) {
      for (const s of scanners) {
        s.mesh.position.x = Math.sin(elapsedTime * s.speed + idx * 0.65) * s.range;
      }
    }
    if (!isAnimating) {
      if (parts?.upperBody && mesh.userData.type !== 'n') {
        const baseH = mesh.userData.type === 'r' ? 0.55 : 0.62 * (mesh.userData.type === 'p' ? 0.85 : 1.1);
        parts.upperBody.position.y = baseH + Math.sin(elapsedTime * 2.4 + idx) * 0.025;
      }
      if (parts?.rightArm) {
        parts.rightArm.rotation.z = Math.sin(elapsedTime * 2.0 + idx) * 0.04;
      }
      if (parts?.mountGroup?.userData?.tailGroup) {
        parts.mountGroup.userData.tailGroup.rotation.z = Math.sin(elapsedTime * 2.2 + idx) * 0.14;
        parts.mountGroup.userData.tailGroup.rotation.x = Math.cos(elapsedTime * 1.6 + idx) * 0.08;
      }
      if (parts?.capeGroup) {
        parts.capeGroup.rotation.x = 0.06 + Math.sin(elapsedTime * 2.0 + idx) * 0.05;
        parts.capeGroup.rotation.z = Math.cos(elapsedTime * 1.7 + idx) * 0.04;
      }
    }
    idx++;
  }

  // Rotate watchtower crystals
  boardGroup.traverse((obj) => {
    if (obj.userData?.isCrystal) {
      obj.rotation.y = elapsedTime * 1.8;
      obj.position.y = 2.4 + Math.sin(elapsedTime * 3) * 0.08;
    }
  });

  // Update active 3D combat sparks / explosion debris
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.life -= dt * 1.45;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      activeParticles.splice(i, 1);
    } else {
      p.velocity.y -= 9.8 * dt; // Gravity
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += 6 * dt;
      p.mesh.rotation.y += 6 * dt;
      p.mesh.material.opacity = p.life;
      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.y *= -0.45; // Bounce off stone board
      }
    }
  }

  renderer.render(scene, camera);
}

// Initialize Board & Start Loop
rebuildAllPieces();
inspectPieceUI('w', 'k');
updateHUD();
requestAnimationFrame(animate);

// Auto-handle WhatsApp invite links (?room=SANTI-XXXX or ?preFen=...&from=...&to=...)
function checkUrlParamsOnLoad() {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  const preFenParam = params.get('preFen');
  const fromParam = params.get('from');
  const toParam = params.get('to');
  const promoParam = params.get('promo');
  const chatParam = params.get('chat');

  if (roomParam) {
    gameMode = 'online';
    if (gameModeSelect) gameModeSelect.value = 'online';
    if (onlineJoinInput) onlineJoinInput.value = extractRoomCode(roomParam);
    onlineDialog?.showModal();
    onlineManager.joinRoom(roomParam);
  } else if (preFenParam && fromParam && toParam) {
    try {
      chess.load(preFenParam);
      gameMode = 'pvp';
      if (gameModeSelect) gameModeSelect.value = 'pvp';
      rebuildAllPieces();
      updateHUD();
      const senderColor = chess.turn();
      const receiverColor = senderColor === 'w' ? 'b' : 'w';
      setCameraPreset(receiverColor === 'w' ? 'white' : 'black');
      if (chatParam) {
        appendChatMessage({
          sender: senderColor === 'w' ? '☀️ Gondor (Blancas)' : '👁️ Mordor (Negras)',
          text: chatParam,
          color: senderColor,
          playAudio: false
        });
      }
      setTimeout(() => {
        performChessMove(fromParam, toParam, promoParam || null, true);
      }, 650);
    } catch {}
  }
}

checkUrlParamsOnLoad();
