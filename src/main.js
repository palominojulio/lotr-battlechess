import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Chess } from 'chess.js';
import { getPieceLore } from './lotrLore.js';
import { createLOTRPieceMesh } from './pieceBuilder.js';
import { animateWalk, executeCinematicCombat, spawnParticleBurst } from './combatSystem.js';
import { chooseBestMove, computeAttackAdvanceMetrics } from './aiEngine.js';
import { soundFX } from './soundFX.js';
import { OnlineRoomManager, PUBLIC_GAME_URL, extractRoomCode } from './onlineMultiplayer.js';
import {
  CURATED_TOURNAMENT_GAMES,
  YOUTUBE_FEATURED_GAMES,
  normalizeSpanishOrEnglishPgn,
  getGameFingerprint,
  deduplicateGames,
  getBuiltInDatabaseFingerprints,
  importGameFromYouTube,
  parseMultiGamePgn,
  fetchLichessLiveTournaments,
  fetchLichessTournamentGames,
  fetchLichessUserGames,
  fetchLichessGameById,
  fetchLichessDailyPuzzle,
  autoSyncNoveltiesFeed
} from './publicLibrary.js';

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

let attackBar3D = null; // { whiteBar, blackBar, marker, totalLen, startZ }

function createBoardCoordinatePlate(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Obsidian plate with golden rim
  ctx.fillStyle = 'rgba(14, 18, 28, 0.92)';
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e6c259';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#ffd970';
  ctx.font = 'bold 68px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText(String(text), 64, 67);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function buildBoardArena() {
  // Outer Citadel Frame (widened slightly so coordinate numbers 1-8 and letters A-H sit clearly on the 4 borders)
  const frameSize = TILE_SIZE * 8 + 1.55;
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

  // 64 Squares (High-contrast Marble & Slate Bluestone so both White and Black pieces pop)
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

  // --- 3D Coordinate Letters (A-H) and Numbers (1-8) on all 4 lateral edges of the board ---
  const edgeDist = TILE_SIZE * 4 + 0.42;
  for (let i = 0; i < 8; i++) {
    // File Letters A..H along Bottom (+Z, White side) and Top (-Z, Black side)
    const letter = FILES[i].toUpperCase();
    const xPos = (i - 3.5) * TILE_SIZE;

    const bottomPlate = createBoardCoordinatePlate(letter);
    bottomPlate.position.set(xPos, 0.01, edgeDist);
    boardGroup.add(bottomPlate);

    const topPlate = createBoardCoordinatePlate(letter);
    topPlate.position.set(xPos, 0.01, -edgeDist);
    boardGroup.add(topPlate);

    // Rank Numbers 1..8 along Left (-X, File A side) and Right (+X, File H side)
    const rankNum = i + 1;
    const zPos = (3.5 - i) * TILE_SIZE;

    const leftPlate = createBoardCoordinatePlate(rankNum);
    leftPlate.position.set(-edgeDist, 0.01, zPos);
    boardGroup.add(leftPlate);

    const rightPlate = createBoardCoordinatePlate(rankNum);
    rightPlate.position.set(edgeDist, 0.01, zPos);
    boardGroup.add(rightPlate);
  }

  // --- 3D Attack-Line Advance Column right alongside the Right (+X) edge of the board ---
  const totalLen = TILE_SIZE * 8;
  const colX = edgeDist + 0.56;
  const baseTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.14, totalLen + 0.2),
    new THREE.MeshStandardMaterial({ color: 0x111520, metalness: 0.8, roughness: 0.3 })
  );
  baseTrack.position.set(colX, -0.04, 0);
  boardGroup.add(baseTrack);

  // White Attack Advance Bar (grows from +Z [Rank 1] toward -Z [Rank 8])
  const whiteBarGeo = new THREE.BoxGeometry(0.24, 0.22, 1);
  const whiteBarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const whiteBar = new THREE.Mesh(whiteBarGeo, whiteBarMat);
  boardGroup.add(whiteBar);

  // Black Attack Advance Bar (grows from -Z [Rank 8] toward +Z [Rank 1])
  const blackBarGeo = new THREE.BoxGeometry(0.24, 0.22, 1);
  const blackBarMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const blackBar = new THREE.Mesh(blackBarGeo, blackBarMat);
  boardGroup.add(blackBar);

  // Glowing Frontline Marker where White and Black attack lines meet
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.32, 0.14),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  boardGroup.add(marker);

  attackBar3D = { whiteBar, blackBar, marker, totalLen, colX };

  // 4 Corner Cyber-Medieval Watchtowers (Gondor Blue on +Z, Mordor Red on -Z)
  const corners = [
    [-1, 1, 0x00e5ff],
    [1, 1, 0x00e5ff],
    [-1, -1, 0xff1133],
    [1, -1, 0xff1133]
  ];
  const offset = (TILE_SIZE * 4) + 1.32;
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
    ? 'Turno: Alianza Solar (Blancas)'
    : 'Turno: Legión de Antracita (Negras)';

  if (chess.isCheckmate()) {
    const winner = isWhite ? 'Legión de Antracita (Negras)' : 'Alianza Solar (Blancas)';
    gameStatusText.textContent = `¡JAQUE MATE! Victoria de ${winner}`;
  } else if (chess.isDraw()) {
    gameStatusText.textContent = '¡Tablas! Tregua en el campo de batalla';
  } else if (chess.inCheck()) {
    const kingName = isWhite ? 'Rey Valerius' : 'Emperador Malakor';
    gameStatusText.textContent = `⚠️ ¡JAQUE A ${kingName.toUpperCase()}!`;
  } else {
    gameStatusText.textContent = isAnimating
      ? '⚔️ Duelo cinemático en curso...'
      : 'Selecciona un campeón o casilla';
  }

  moveCounterEl.textContent = `Jugada ${chess.moveNumber()}`;
  updateAttackAdvanceColumn();
}

function updateAttackAdvanceColumn() {
  const metrics = computeAttackAdvanceMetrics(chess);

  // 1. Update HTML Right-of-Board Vertical Risk, Dominance & Win-Probability Column
  const whiteFillEl = document.getElementById('attack-bar-white-fill');
  const blackBgEl = document.getElementById('attack-bar-black-bg');
  const markerEl = document.getElementById('attack-frontline-marker');
  const tagEl = document.getElementById('attack-frontline-tag');

  const whiteProbEl = document.getElementById('attack-white-prob');
  const whiteStatusEl = document.getElementById('attack-white-status');
  const blackProbEl = document.getElementById('attack-black-prob');
  const blackStatusEl = document.getElementById('attack-black-status');

  if (whiteFillEl) {
    whiteFillEl.style.height = `${metrics.whiteBarPct}%`;
    whiteFillEl.style.background = metrics.whiteColor.bgGradient;
    whiteFillEl.style.boxShadow = `0 -2px 12px ${metrics.whiteColor.glow}`;
  }
  if (blackBgEl) {
    blackBgEl.style.background = metrics.blackColor.bgGradient;
  }
  if (markerEl) {
    markerEl.style.bottom = `${metrics.whiteBarPct}%`;
  }
  if (tagEl) {
    tagEl.textContent = `⚔️F${metrics.frontlineRank}·${metrics.evalText}`;
  }

  if (whiteProbEl) {
    whiteProbEl.textContent = `${metrics.whiteWinProb}%`;
    whiteProbEl.style.borderColor = metrics.whiteColor.hex;
    whiteProbEl.style.background = `${metrics.whiteColor.hex}33`;
  }
  if (whiteStatusEl) {
    whiteStatusEl.textContent = `${metrics.whiteColor.statusLabel} (F${metrics.whiteAttackRank})`;
    whiteStatusEl.style.color = metrics.whiteColor.hex;
  }

  if (blackProbEl) {
    blackProbEl.textContent = `${metrics.blackWinProb}%`;
    blackProbEl.style.borderColor = metrics.blackColor.hex;
    blackProbEl.style.background = `${metrics.blackColor.hex}33`;
  }
  if (blackStatusEl) {
    blackStatusEl.textContent = `${metrics.blackColor.statusLabel} (F${metrics.blackAttackRank})`;
    blackStatusEl.style.color = metrics.blackColor.hex;
  }

  // 2. Update 3D Attack-Line Advance Column on the Right (+X) edge of the 3D board with Green/Orange/Red Risk colors!
  if (attackBar3D) {
    const { whiteBar, blackBar, marker, totalLen, colX } = attackBar3D;
    const pct = metrics.whiteBarPct / 100;
    const whiteLen = Math.max(0.15, totalLen * pct);
    const blackLen = Math.max(0.15, totalLen * (1 - pct));
    const halfTotal = totalLen / 2;

    whiteBar.material.color.setHex(metrics.whiteColor.hex3D);
    whiteBar.scale.z = whiteLen;
    whiteBar.position.set(colX, 0.08, halfTotal - whiteLen / 2);

    blackBar.material.color.setHex(metrics.blackColor.hex3D);
    blackBar.scale.z = blackLen;
    blackBar.position.set(colX, 0.08, -halfTotal + blackLen / 2);

    const meetZ = halfTotal - whiteLen;
    marker.position.set(colX, 0.14, meetZ);
  }
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
    document.getElementById('promo-name-q').textContent = isW ? 'Reina Lyra (Espada Doble)' : 'Dama Vex (Espada Doble)';
    document.getElementById('promo-name-r').textContent = isW ? 'Coloso Atlas (Torre)' : 'Ciber-Ogro (Torre)';
    document.getElementById('promo-name-b').textContent = isW ? 'Sabio Orion (Alfil)' : 'Brujo del Vacío (Alfil)';
    document.getElementById('promo-name-n').textContent = isW ? 'Paladín en Caballo Robot' : 'Jinete en Caballo Robot';

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
  saveAutoGameSnapshot();
  isAnimating = false;
  updateHUD();

  // Check Game Over
  if (chess.isGameOver()) {
    soundFX.playHornFanfare();
    if (chess.isCheckmate()) {
      const winnerIsWhite = moveResult.color === 'w';
      gameoverTitle.textContent = winnerIsWhite
        ? '☀️ ¡Victoria de la Alianza Solar!'
        : '👁️ ¡Triunfo de la Legión de Antracita!';
      gameoverMessage.textContent = winnerIsWhite
        ? 'El Rey Valerius y la Alianza Solar han derrotado a la Legión con sus espadas de plasma.'
        : 'Las legiones cibernéticas de Antracita y sus Caballos Robot han conquistado el tablero.';
    } else {
      gameoverTitle.textContent = '⚖️ ¡Tablas en el Campo de Batalla!';
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
const chatNickInput = document.getElementById('chat-nick-input');
const chatStatusBadge = document.getElementById('chat-status-badge');
let lastChatSent = '';

const AI_CHAT_REPLIES = [
  '👁️ Emperador Malakor: «¡No conocéis el poder de la Legión de Antracita!»',
  '🤖 Jinete Mecha: «¡Nuestros caballos robot y espadas rojas aplastarán vuestras filas!»',
  '🔥 Guerrero Orco: «¡La era de la Alianza Solar ha terminado!»',
  '⚡ Brujo del Vacío: «¡Mis rayos voltaicos reducirán vuestras torres a cenizas!»'
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
    const factionLabel = myColor === 'w' ? 'Alianza Solar (Blancas)' : 'Legión de Antracita (Negras)';
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
      text: `🎉 ¡Conectado en directo con tu amigo / invitado en la sala ${roomCode}! Escribe abajo para hablar.`
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
  onRemoteLoadGame: (payload) => {
    if (payload) loadSavedGame(payload, true);
  },
  onRemoteChat: ({ text, sender, color }) => {
    appendChatMessage({ sender, text, color, playAudio: true });
  }
});

function handleSendChat(rawText) {
  const clean = String(rawText || '').trim();
  if (!clean) return;

  const myColor = onlineManager.isConnected ? onlineManager.myColor : chess.turn();
  const customNick = chatNickInput?.value?.trim();
  const baseName = customNick || (onlineManager.isHost ? 'Anfitrión' : 'Invitado');
  const senderName = myColor === 'w' ? `☀️ ${baseName} (Blancas)` : `👁️ ${baseName} (Negras)`;

  lastChatSent = clean;
  appendChatMessage({ sender: senderName, text: clean, color: myColor, playAudio: true });

  if (onlineManager.isConnected) {
    onlineManager.sendChat(clean, senderName);
  } else if (gameMode.startsWith('ai')) {
    setTimeout(() => {
      const reply = AI_CHAT_REPLIES[Math.floor(Math.random() * AI_CHAT_REPLIES.length)];
      appendChatMessage({ sender: '👁️ Legión IA', text: reply, color: 'b', playAudio: true });
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
  const text = `⚔️ ¡Te reto a una partida online de Battle Chess 3D (Crónicas de Plasma)! Entra a mi sala en directo (${code}) como Invitado:\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});

// Asynchronous / Instant WhatsApp Turn Share button ("💬 Invitar Amigo / Mandar Jugada por WhatsApp")
document.getElementById('btn-whatsapp-turn')?.addEventListener('click', () => {
  const shareUrl = new URL(PUBLIC_GAME_URL);
  if (onlineManager.roomCode) {
    shareUrl.searchParams.set('room', onlineManager.roomCode);
    const text = `⚔️ ¡Estoy en la sala en vivo ${onlineManager.roomCode} de Battle Chess 3D! Entra aquí como Invitado desde tu móvil u ordenador para jugar en directo:\n${shareUrl.toString()}`;
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
    const nextTurnName = chess.turn() === 'w' ? 'Alianza Solar (Blancas)' : 'Legión de Antracita (Negras)';
    const chatPart = lastChatSent ? `\n💬 Mensaje: "${lastChatSent}"` : '';
    const text = `⚔️ He movido de ${lastMoveSnapshot.from.toUpperCase()} a ${lastMoveSnapshot.to.toUpperCase()} en nuestro Battle Chess 3D.${chatPart}\nAbre este enlace para ver el duelo de plasma y hacer tu jugada como Invitado con ${nextTurnName}:\n${shareUrl.toString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  } else {
    // No move made yet -> open the Online Room modal and auto-create a room for a friend / guest!
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
  const label = trackName || 'Fanfarria (Holst)';
  btnMidi.textContent = playing ? `🎵 ${label}` : '🎵 Sonar Fanfarria';
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

// --- Save & Load Games Manager (LocalStorage + AutoSave + JSON Import/Export) ---
const SAVES_STORAGE_KEY = 'cyber_battlechess_saves_v1';
const AUTOSAVE_STORAGE_KEY = 'cyber_battlechess_autosave_v1';
const saveDialog = document.getElementById('save-dialog');
const saveNameInput = document.getElementById('save-name-input');
const savedGamesListEl = document.getElementById('saved-games-list');
const saveStatusBanner = document.getElementById('save-status-banner');

function buildGameSnapshot(customTitle = '') {
  const history = chess.history({ verbose: true });
  const moveNumber = Math.floor(history.length / 2) + 1;
  const turnLabel = chess.turn() === 'w' ? 'Blancas (Alianza)' : 'Negras (Legión)';
  const nowStr = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  return {
    id: `save-${Date.now()}`,
    title: customTitle.trim() || `Partida · Jugada ${moveNumber} (${nowStr})`,
    date: nowStr,
    fen: chess.fen(),
    pgn: chess.pgn(),
    moves: history.map((m) => ({ from: m.from, to: m.to, promotion: m.promotion || null })),
    halfMoves: history.length,
    turn: chess.turn(),
    turnLabel,
    gameMode
  };
}

function getSavedGames() {
  try {
    const raw = localStorage.getItem(SAVES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSavedGames(list) {
  try {
    localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(list.slice(0, 25)));
  } catch {}
}

function saveAutoGameSnapshot() {
  try {
    if (chess.history().length === 0) return;
    const snap = buildGameSnapshot('⚡ Guardado Automático');
    snap.id = 'autosave';
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(snap));
  } catch {}
}

function getAutoSaveSnapshot() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadSavedGame(snapshot, isRemote = false) {
  if (!snapshot || isAnimating) return;
  chess.reset();
  capturedByWhite.length = 0;
  capturedByBlack.length = 0;

  if (Array.isArray(snapshot.moves) && snapshot.moves.length > 0) {
    for (const mv of snapshot.moves) {
      const res = chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion || 'q' });
      if (res && res.captured) {
        if (res.color === 'w') capturedByWhite.push(res.captured);
        else capturedByBlack.push(res.captured);
      }
    }
  } else if (snapshot.pgn) {
    try {
      chess.loadPgn(snapshot.pgn);
      for (const mv of chess.history({ verbose: true })) {
        if (mv.captured) {
          if (mv.color === 'w') capturedByWhite.push(mv.captured);
          else capturedByBlack.push(mv.captured);
        }
      }
    } catch {
      if (snapshot.fen) chess.load(snapshot.fen);
    }
  } else if (snapshot.fen) {
    chess.load(snapshot.fen);
  }

  clearHighlights();
  selectedSquare = null;
  legalMovesForSelected = [];
  rebuildAllPieces();
  renderCasualties();
  renderMoveNotation();
  updateHUD();
  soundFX.playHornFanfare();

  const li = document.createElement('li');
  li.className = 'log-entry lore-intro';
  li.innerHTML = `📂 Partida cargada: <strong>${snapshot.title || 'Partida Guardada'}</strong> (${Math.ceil((snapshot.halfMoves || chess.history().length) / 2)} jugadas).`;
  battleLog.prepend(li);

  if (gameMode === 'online' && onlineManager.isConnected && !isRemote) {
    onlineManager.sendLoadGame(snapshot);
  }

  if (saveStatusBanner) {
    saveStatusBanner.innerHTML = `✅ Partida <strong>${snapshot.title || ''}</strong> cargada en el tablero.`;
  }
  setTimeout(() => {
    if (saveDialog?.open) saveDialog.close();
  }, 450);
}

function renderSavedGamesList() {
  if (!savedGamesListEl) return;
  const saves = getSavedGames();
  const autoSave = getAutoSaveSnapshot();
  savedGamesListEl.innerHTML = '';

  const allItems = [];
  if (autoSave && autoSave.halfMoves > 0) {
    allItems.push({ ...autoSave, isAuto: true });
  }
  for (const s of saves) {
    allItems.push({ ...s, isAuto: false });
  }

  if (allItems.length === 0) {
    savedGamesListEl.innerHTML = '<div class="saved-empty">No hay partidas guardadas todavía. Haz algún movimiento y pulsa «💾 Guardar».</div>';
    return;
  }

  allItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = `saved-game-card ${item.isAuto ? 'autosave-card' : ''}`;

    const info = document.createElement('div');
    info.className = 'saved-game-info';

    const title = document.createElement('div');
    title.className = 'saved-game-title';
    title.textContent = item.title;

    const meta = document.createElement('div');
    meta.className = 'saved-game-meta';
    const jugadas = Math.ceil((item.halfMoves || 0) / 2);
    meta.textContent = `${item.date || ''} · ${jugadas} jugadas · Turno: ${item.turnLabel || ''}`;

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'saved-game-actions';

    const btnLoad = document.createElement('button');
    btnLoad.type = 'button';
    btnLoad.className = 'btn-save-item';
    btnLoad.textContent = '📂 Cargar';
    btnLoad.addEventListener('click', () => loadSavedGame(item, false));
    actions.appendChild(btnLoad);

    if (!item.isAuto) {
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn-save-item btn-del';
      btnDel.textContent = '🗑️';
      btnDel.title = 'Borrar partida guardada';
      btnDel.addEventListener('click', () => {
        const updated = getSavedGames().filter((s) => s.id !== item.id);
        setSavedGames(updated);
        renderSavedGamesList();
      });
      actions.appendChild(btnDel);
    }

    card.appendChild(info);
    card.appendChild(actions);
    savedGamesListEl.appendChild(card);
  });
}

function openSaveDialog() {
  if (!saveDialog) return;
  renderSavedGamesList();
  if (saveNameInput && !saveNameInput.value) {
    const moveNum = Math.floor(chess.history().length / 2) + 1;
    const nick = chatNickInput?.value?.trim() || 'Invitado';
    saveNameInput.placeholder = `Ej: Partida con ${nick} (Jugada ${moveNum})`;
  }
  saveDialog.showModal();
}

document.getElementById('btn-save-header')?.addEventListener('click', openSaveDialog);
document.getElementById('btn-save-manager')?.addEventListener('click', openSaveDialog);

document.getElementById('btn-save-now')?.addEventListener('click', () => {
  const snap = buildGameSnapshot(saveNameInput?.value || '');
  const fp = getGameFingerprint(snap);
  snap.fingerprint = fp;
  const list = getSavedGames().filter((existing) => {
    const existingFp = existing.fingerprint || getGameFingerprint(existing);
    return !fp || existingFp !== fp;
  });
  list.unshift(snap);
  setSavedGames(list);
  if (saveNameInput) saveNameInput.value = '';
  renderSavedGamesList();
  soundFX.playSelect();
  if (saveStatusBanner) {
    saveStatusBanner.innerHTML = `✅ Partida guardada sin duplicados como <strong>${snap.title}</strong>.`;
  }
});

document.getElementById('btn-export-json')?.addEventListener('click', () => {
  const snap = buildGameSnapshot(saveNameInput?.value || '');
  snap.fingerprint = getGameFingerprint(snap);
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `partida-battlechess-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (saveStatusBanner) {
    saveStatusBanner.innerHTML = '📥 Archivo <code>.json</code> descargado correctamente.';
  }
});

document.getElementById('input-import-json')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (parsed && (parsed.fen || parsed.moves || parsed.pgn)) {
        const fp = getGameFingerprint(parsed);
        parsed.fingerprint = fp;
        const list = getSavedGames().filter((existing) => {
          const existingFp = existing.fingerprint || getGameFingerprint(existing);
          return !fp || existingFp !== fp;
        });
        list.unshift(parsed);
        setSavedGames(list);
        renderSavedGamesList();
        loadSavedGame(parsed, false);
      }
    } catch {
      if (saveStatusBanner) {
        saveStatusBanner.textContent = '⚠️ El archivo seleccionado no es una partida válida.';
      }
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// --- Public Repositories, YouTube Importer, Live Tournaments (Lichess API) & Step-by-Step Study Mode ---
const studyDialog = document.getElementById('study-dialog');
const studyGamesListEl = document.getElementById('study-games-list');
const studyListHeading = document.getElementById('study-list-heading');
const studyStatusBanner = document.getElementById('study-status-banner');
const studySearchInput = document.getElementById('study-search-input');
const studyYoutubeInput = document.getElementById('study-youtube-input');
const studyPgnInput = document.getElementById('study-pgn-input');

const studyBar = document.getElementById('study-bar');
const studyBarTitle = document.getElementById('study-bar-title');
const studyBarStep = document.getElementById('study-bar-step');
const studyYtLink = document.getElementById('study-yt-link');
const btnStudyAuto = document.getElementById('btn-study-auto');

let activeStudy = null; // { title, moves: [...], cursor: 0, savedMode: 'ai-2', autoPlaying: false, youtubeUrl: null }
let studyAutoTimer = null;

function getAllDatabaseFingerprints() {
  const set = getBuiltInDatabaseFingerprints();
  for (const s of getSavedGames()) {
    const fp = s.fingerprint || getGameFingerprint(s);
    if (fp) set.add(fp);
  }
  return set;
}

function stopStudyAutoPlay() {
  if (studyAutoTimer) {
    clearTimeout(studyAutoTimer);
    studyAutoTimer = null;
  }
  if (activeStudy) activeStudy.autoPlaying = false;
  if (btnStudyAuto) btnStudyAuto.textContent = '⏯️ Auto';
}

function updateStudyBarUI() {
  if (!studyBar) return;
  if (!activeStudy) {
    studyBar.hidden = true;
    return;
  }
  studyBar.hidden = false;
  if (studyBarTitle) studyBarTitle.textContent = `🏆 ${activeStudy.title}`;
  if (studyBarStep) studyBarStep.textContent = `${activeStudy.cursor} / ${activeStudy.moves.length}`;
  if (studyYtLink) {
    if (activeStudy.youtubeUrl) {
      studyYtLink.href = activeStudy.youtubeUrl;
      studyYtLink.hidden = false;
    } else {
      studyYtLink.hidden = true;
    }
  }
}

function jumpToStudyStep(targetCursor) {
  if (!activeStudy || isAnimating) return;
  stopStudyAutoPlay();
  const clamped = Math.max(0, Math.min(activeStudy.moves.length, targetCursor));
  activeStudy.cursor = clamped;

  chess.reset();
  capturedByWhite.length = 0;
  capturedByBlack.length = 0;

  for (let i = 0; i < clamped; i++) {
    const mv = activeStudy.moves[i];
    const res = chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion || 'q' });
    if (res && res.captured) {
      if (res.color === 'w') capturedByWhite.push(res.captured);
      else capturedByBlack.push(res.captured);
    }
  }

  clearHighlights();
  selectedSquare = null;
  legalMovesForSelected = [];
  rebuildAllPieces();
  renderCasualties();
  renderMoveNotation();
  updateHUD();
  updateStudyBarUI();
}

async function stepStudyForwardAnimated() {
  if (!activeStudy || isAnimating) return false;
  if (activeStudy.cursor >= activeStudy.moves.length) {
    stopStudyAutoPlay();
    return false;
  }
  const nextMv = activeStudy.moves[activeStudy.cursor];
  activeStudy.cursor++;
  updateStudyBarUI();
  await performChessMove(nextMv.from, nextMv.to, nextMv.promotion || 'q', true);
  updateStudyBarUI();
  return activeStudy.cursor < activeStudy.moves.length;
}

async function runStudyAutoLoop() {
  if (!activeStudy || !activeStudy.autoPlaying) return;
  if (isAnimating) {
    studyAutoTimer = setTimeout(runStudyAutoLoop, 300);
    return;
  }
  const hasMore = await stepStudyForwardAnimated();
  if (hasMore && activeStudy?.autoPlaying) {
    studyAutoTimer = setTimeout(runStudyAutoLoop, 650);
  } else {
    stopStudyAutoPlay();
  }
}

function startStudySession(gameObj, startAtEnd = false) {
  if (!gameObj || isAnimating) return;
  stopStudyAutoPlay();

  const tempChess = new Chess();
  let loadedOk = false;
  const rawPgn = String(gameObj.pgn || '').trim();
  const normalizedPgn = normalizeSpanishOrEnglishPgn(rawPgn);

  try {
    tempChess.loadPgn(normalizedPgn || rawPgn);
    loadedOk = tempChess.history().length > 0;
  } catch {}

  if (!loadedOk) {
    try {
      tempChess.loadPgn(rawPgn);
      loadedOk = tempChess.history().length > 0;
    } catch {}
  }

  if (!loadedOk) {
    try {
      tempChess.load(rawPgn);
      loadedOk = true;
    } catch {}
  }

  if (!loadedOk) {
    if (studyStatusBanner) {
      studyStatusBanner.textContent = '⚠️ No se pudo interpretar el formato PGN/FEN de esta partida.';
    }
    return;
  }

  const allMoves = tempChess.history({ verbose: true });
  const prevMode = gameMode.startsWith('ai') || gameMode === 'online' ? gameMode : 'ai-2';
  // Switch to 'pvp' during step-by-step study so AI doesn't interrupt the master replay
  gameMode = 'pvp';

  activeStudy = {
    title: gameObj.title || 'Partida de Torneo',
    category: gameObj.category || 'Torneo',
    description: gameObj.description || '',
    youtubeUrl: gameObj.youtubeUrl || null,
    moves: allMoves,
    cursor: startAtEnd ? allMoves.length : 0,
    savedMode: prevMode,
    autoPlaying: false
  };

  jumpToStudyStep(activeStudy.cursor);
  soundFX.playHornFanfare();

  battleLog.innerHTML = '';
  const li = document.createElement('li');
  li.className = 'log-entry lore-intro';
  const ytBadge = gameObj.youtubeUrl
    ? ` <a href="${gameObj.youtubeUrl}" target="_blank" rel="noopener noreferrer" style="color:#fcd34d;text-decoration:underline;">[📺 Ver Vídeo en YouTube]</a>`
    : '';
  li.innerHTML = `📚 <strong>${gameObj.category || 'Estudio'}: ${gameObj.title}</strong> — ${gameObj.description || 'Usa ▶️ Sig. o ⏯️ Auto para ver cada jugada y duelo 3D.'}${ytBadge}`;
  battleLog.prepend(li);

  if (studyDialog?.open) studyDialog.close();

  // If user chose "Estudiar desde Jugada 1", automatically play the first move after a brief pause!
  if (!startAtEnd && allMoves.length > 0) {
    setTimeout(() => {
      if (activeStudy && activeStudy.cursor === 0 && !isAnimating) {
        stepStudyForwardAnimated();
      }
    }, 450);
  }
}

document.getElementById('btn-study-first')?.addEventListener('click', () => jumpToStudyStep(0));
document.getElementById('btn-study-prev')?.addEventListener('click', () => {
  if (activeStudy) jumpToStudyStep(activeStudy.cursor - 1);
});
document.getElementById('btn-study-next')?.addEventListener('click', () => {
  stopStudyAutoPlay();
  stepStudyForwardAnimated();
});
document.getElementById('btn-study-last')?.addEventListener('click', () => {
  if (activeStudy) jumpToStudyStep(activeStudy.moves.length);
});
btnStudyAuto?.addEventListener('click', () => {
  if (!activeStudy) return;
  if (activeStudy.autoPlaying) {
    stopStudyAutoPlay();
  } else {
    if (activeStudy.cursor >= activeStudy.moves.length) {
      jumpToStudyStep(0);
    }
    activeStudy.autoPlaying = true;
    btnStudyAuto.textContent = '⏸️ Pausa';
    runStudyAutoLoop();
  }
});

document.getElementById('btn-study-practice')?.addEventListener('click', () => {
  stopStudyAutoPlay();
  const resumeMode = activeStudy?.savedMode || 'ai-2';
  activeStudy = null;
  updateStudyBarUI();
  gameMode = resumeMode;
  if (gameModeSelect) gameModeSelect.value = gameMode;
  updateHUD();
  const li = document.createElement('li');
  li.className = 'log-entry lore-intro';
  li.innerHTML = '⚔️ <strong>¡Modo Práctica Activado!</strong> Ahora tienes el mando del tablero desde esta posición.';
  battleLog.prepend(li);
  if (gameMode.startsWith('ai') && chess.turn() === 'b' && !chess.isGameOver()) {
    const aiLevel = parseInt(gameMode.split('-')[1], 10) || 2;
    const aiMove = chooseBestMove(chess, aiLevel);
    if (aiMove) performChessMove(aiMove.from, aiMove.to, aiMove.promotion);
  }
});

function renderStudyGamesCatalog(gamesArray, headingText = null) {
  if (!studyGamesListEl) return;
  if (headingText && studyListHeading) studyListHeading.textContent = headingText;
  studyGamesListEl.innerHTML = '';

  const uniqueGames = deduplicateGames(gamesArray);

  if (!uniqueGames || uniqueGames.length === 0) {
    studyGamesListEl.innerHTML = '<div class="saved-empty">No se encontraron partidas nuevas (o todas ya estaban en la base de datos sin duplicar).</div>';
    return;
  }

  uniqueGames.forEach((g) => {
    const card = document.createElement('div');
    card.className = 'saved-game-card';

    const info = document.createElement('div');
    info.className = 'saved-game-info';

    const title = document.createElement('div');
    title.className = 'saved-game-title';
    title.textContent = `${g.title} (${g.result || '*'})`;

    const meta = document.createElement('div');
    meta.className = 'saved-game-meta';
    meta.textContent = `${g.category} · ${g.description || ''}`;

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'saved-game-actions';

    if (g.youtubeUrl) {
      const btnYt = document.createElement('a');
      btnYt.href = g.youtubeUrl;
      btnYt.target = '_blank';
      btnYt.rel = 'noopener noreferrer';
      btnYt.className = 'btn-save-item';
      btnYt.style.textDecoration = 'none';
      btnYt.textContent = '📺 Vídeo';
      btnYt.title = 'Abrir vídeo en YouTube';
      actions.appendChild(btnYt);
    }

    const btnReplay = document.createElement('button');
    btnReplay.type = 'button';
    btnReplay.className = 'btn-save-item';
    btnReplay.textContent = g.isPuzzle ? '🧩 Resolver' : '🎬 Estudiar 3D';
    btnReplay.title = 'Cargar para reproducir jugada a jugada con combates 3D';
    btnReplay.addEventListener('click', () => startStudySession(g, Boolean(g.isPuzzle)));
    actions.appendChild(btnReplay);

    if (!g.isPuzzle) {
      const btnEnd = document.createElement('button');
      btnEnd.type = 'button';
      btnEnd.className = 'btn-save-item';
      btnEnd.textContent = '⚔️ Posición';
      btnEnd.title = 'Cargar posición avanzada lista para practicar';
      btnEnd.addEventListener('click', () => startStudySession(g, true));
      actions.appendChild(btnEnd);
    }

    card.appendChild(info);
    card.appendChild(actions);
    studyGamesListEl.appendChild(card);
  });
}

function openStudyDialog() {
  if (!studyDialog) return;
  const listToShow = autoLoadedNovelties.length > 0 ? autoLoadedNovelties : CURATED_TOURNAMENT_GAMES;
  const heading =
    autoLoadedNovelties.length > 0
      ? `3. ✨ Novedades Auto-Cargadas Hoy (${autoLoadedNovelties.length} Únicas de YouTube & Torneos)`
      : '3. 🏆 Grandes Partidas de Torneos Mundiales (Sin Duplicados)';
  renderStudyGamesCatalog(listToShow, heading);
  studyDialog.showModal();
}

document.getElementById('btn-study-header')?.addEventListener('click', openStudyDialog);
document.getElementById('btn-study-manager')?.addEventListener('click', openStudyDialog);

document.getElementById('btn-study-novelties-tab')?.addEventListener('click', () => {
  renderStudyGamesCatalog(
    autoLoadedNovelties,
    `3. ✨ Novedades Auto-Cargadas Hoy (${autoLoadedNovelties.length} Únicas de YouTube & Torneos)`
  );
  if (studyStatusBanner) {
    studyStatusBanner.textContent = `✨ Mostrando ${autoLoadedNovelties.length} novedades descargadas automáticamente de YouTube y Torneos en Vivo (0 duplicados).`;
  }
});

document.getElementById('btn-study-reset-catalog')?.addEventListener('click', () => {
  renderStudyGamesCatalog(
    CURATED_TOURNAMENT_GAMES,
    '3. 🏆 Grandes Partidas de Torneos Mundiales (Sin Duplicados)'
  );
  if (studyStatusBanner) {
    studyStatusBanner.textContent = `🏛️ Mostrando ${CURATED_TOURNAMENT_GAMES.length} partidas únicas de torneos mundiales.`;
  }
});

document.getElementById('btn-study-youtube-catalog')?.addEventListener('click', () => {
  // Filter against CURATED_TOURNAMENT_GAMES fingerprints so zero games are duplicated between Tournament DB and YouTube DB
  const tournamentFps = new Set(CURATED_TOURNAMENT_GAMES.map((g) => getGameFingerprint(g)));
  const uniqueYt = deduplicateGames(YOUTUBE_FEATURED_GAMES, tournamentFps);
  renderStudyGamesCatalog(
    uniqueYt,
    '3. 📺 Partidas Virales Publicadas en YouTube (0 Duplicados con Torneos)'
  );
  if (studyStatusBanner) {
    studyStatusBanner.textContent = `📺 Mostrando ${uniqueYt.length} partidas virales de YouTube verificadas sin duplicar las de la base de datos de torneos.`;
  }
});

document.getElementById('btn-study-all-unique')?.addEventListener('click', () => {
  const combined = deduplicateGames([...CURATED_TOURNAMENT_GAMES, ...YOUTUBE_FEATURED_GAMES, ...getSavedGames()]);
  renderStudyGamesCatalog(
    combined,
    `3. 🗂️ Todas las Bases de Datos Combinadas (${combined.length} Partidas Únicas)`
  );
  if (studyStatusBanner) {
    studyStatusBanner.textContent = `✅ Base de datos unificada: ${combined.length} partidas únicas (0 duplicados).`;
  }
});

document.getElementById('btn-study-youtube-load')?.addEventListener('click', async () => {
  const raw = studyYoutubeInput?.value?.trim();
  if (!raw) {
    if (studyStatusBanner) {
      studyStatusBanner.textContent = '⚠️ Pega un enlace de YouTube (youtube.com/watch?v=...) o el texto de la descripción con las jugadas.';
    }
    return;
  }
  if (studyStatusBanner) {
    studyStatusBanner.textContent = '⏳ Analizando vídeo / descripción de YouTube y verificando duplicados en la base de datos...';
  }
  try {
    const dbFingerprints = getAllDatabaseFingerprints();
    const { game } = await importGameFromYouTube(raw, dbFingerprints);
    if (studyStatusBanner) {
      studyStatusBanner.textContent = game.alreadyInDb
        ? `ℹ️ Esta partida ya figuraba en la base de datos: cargando "${game.title}" sin crear duplicados.`
        : `✅ Partida de YouTube "${game.title}" importada correctamente.`;
    }
    startStudySession(game, false);
  } catch (err) {
    if (studyStatusBanner) {
      studyStatusBanner.textContent = `⚠️ ${err.message}`;
    }
  }
});

document.getElementById('btn-fetch-live-tournaments')?.addEventListener('click', async () => {
  if (studyStatusBanner) studyStatusBanner.textContent = '⏳ Conectando en directo con los torneos oficiales de Lichess.org...';
  try {
    const tournaments = await fetchLichessLiveTournaments();
    if (!studyGamesListEl) return;
    if (studyListHeading) studyListHeading.textContent = '🏆 Torneos Oficiales en Vivo (Lichess.org)';
    studyGamesListEl.innerHTML = '';

    tournaments.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'saved-game-card autosave-card';
      const info = document.createElement('div');
      info.className = 'saved-game-info';
      const title = document.createElement('div');
      title.className = 'saved-game-title';
      title.textContent = `🏆 ${t.name}`;
      const meta = document.createElement('div');
      meta.className = 'saved-game-meta';
      meta.textContent = `Ritmo: ${t.perf} · ${t.nbPlayers} jugadores inscritos · ID: ${t.id}`;
      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'saved-game-actions';
      const btnFetchGames = document.createElement('button');
      btnFetchGames.type = 'button';
      btnFetchGames.className = 'btn-save-item';
      btnFetchGames.textContent = '📂 Ver Partidas';
      btnFetchGames.addEventListener('click', async () => {
        if (studyStatusBanner) studyStatusBanner.textContent = `⏳ Descargando partidas únicas del torneo "${t.name}"...`;
        try {
          const games = await fetchLichessTournamentGames(t.id, 10, getAllDatabaseFingerprints());
          renderStudyGamesCatalog(games, `🏆 Partidas del Torneo: ${t.name} (Sin Duplicados)`);
          if (studyStatusBanner) studyStatusBanner.textContent = `✅ ${games.length} partidas únicas cargadas del torneo "${t.name}".`;
        } catch (err) {
          if (studyStatusBanner) studyStatusBanner.textContent = `⚠️ ${err.message}`;
        }
      });
      actions.appendChild(btnFetchGames);
      card.appendChild(info);
      card.appendChild(actions);
      studyGamesListEl.appendChild(card);
    });

    if (studyStatusBanner) {
      studyStatusBanner.textContent = '✅ Selecciona un torneo oficial en vivo para descargar sus partidas únicas al tablero 3D.';
    }
  } catch (err) {
    if (studyStatusBanner) studyStatusBanner.textContent = `⚠️ ${err.message}`;
  }
});

document.getElementById('btn-fetch-daily-puzzle')?.addEventListener('click', async () => {
  if (studyStatusBanner) studyStatusBanner.textContent = '⏳ Descargando el Reto Táctico Diario oficial de Lichess.org...';
  try {
    const puzzleGame = await fetchLichessDailyPuzzle();
    renderStudyGamesCatalog([puzzleGame], '🧩 Reto Táctico Diario Oficial (Lichess.org)');
    if (studyStatusBanner) {
      studyStatusBanner.innerHTML = `✅ Reto Diario listo: pulsa <strong>🧩 Resolver</strong> para saltar a la posición crítica o <strong>⚔️ Practicar</strong>.`;
    }
  } catch (err) {
    if (studyStatusBanner) studyStatusBanner.textContent = `⚠️ ${err.message}`;
  }
});

async function handleLichessQuery(rawQuery) {
  const q = String(rawQuery || '').trim();
  if (!q) return;

  // If the user pasted a YouTube link into the search box, route it to the YouTube importer!
  if (/youtube\.com|youtu\.be/i.test(q)) {
    if (studyYoutubeInput) studyYoutubeInput.value = q;
    document.getElementById('btn-study-youtube-load')?.click();
    return;
  }

  if (studyStatusBanner) studyStatusBanner.textContent = `⏳ Buscando "${q}" en Lichess.org y filtrando duplicados de la base de datos...`;

  try {
    const existingFps = getAllDatabaseFingerprints();
    if (/lichess\.org\/tournament\//i.test(q)) {
      const games = await fetchLichessTournamentGames(q, 10, existingFps);
      renderStudyGamesCatalog(games, `🏆 Partidas de Torneo Lichess (Sin Duplicados)`);
      if (studyStatusBanner) studyStatusBanner.textContent = `✅ ${games.length} partidas únicas de torneo encontradas.`;
      return;
    }
    if (/lichess\.org\/[a-zA-Z0-9]{8}/i.test(q) || /^[a-zA-Z0-9]{8}$/.test(q)) {
      try {
        const single = await fetchLichessGameById(q);
        if (single) {
          const fp = getGameFingerprint(single);
          const alreadyInDb = existingFps.has(fp);
          renderStudyGamesCatalog([single], `🌐 Partida Pública Encontrada`);
          if (studyStatusBanner) {
            studyStatusBanner.textContent = alreadyInDb
              ? `ℹ️ La partida ${single.title} ya estaba en la base de datos (mostrada sin duplicar).`
              : `✅ Partida ${single.title} lista para estudiar.`;
          }
          return;
        }
      } catch {}
    }
    const userGames = await fetchLichessUserGames(q, 10, existingFps);
    renderStudyGamesCatalog(userGames, `🌐 Últimas Partidas Únicas de ${q}`);
    if (studyStatusBanner) studyStatusBanner.textContent = `✅ ${userGames.length} partidas públicas únicas de "${q}" descargadas (filtradas sin duplicar).`;
  } catch (err) {
    if (studyStatusBanner) studyStatusBanner.textContent = `⚠️ ${err.message}`;
  }
}

document.getElementById('btn-study-search')?.addEventListener('click', () => {
  if (studySearchInput?.value) handleLichessQuery(studySearchInput.value);
});

document.querySelectorAll('.gm-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const user = chip.dataset.user;
    if (user) {
      if (studySearchInput) studySearchInput.value = user;
      handleLichessQuery(user);
    }
  });
});

document.getElementById('btn-study-load-pgn')?.addEventListener('click', () => {
  const raw = studyPgnInput?.value?.trim();
  if (!raw) return;
  const existingFps = getAllDatabaseFingerprints();
  const normalized = normalizeSpanishOrEnglishPgn(raw);
  const parsedList = parseMultiGamePgn(raw, 'Partida PGN Importada');
  const gameObj = parsedList[0] || {
    id: `custom-${Date.now()}`,
    category: '📋 PGN / FEN Personalizado',
    title: 'Partida de Estudio Importada',
    description: 'Cargada desde texto PGN/FEN (Español o Inglés)',
    pgn: normalized || raw
  };
  const fp = getGameFingerprint(gameObj);
  if (fp && existingFps.has(fp) && studyStatusBanner) {
    studyStatusBanner.textContent = 'ℹ️ Esta partida ya existía en la base de datos; se carga directamente sin duplicarla.';
  }
  startStudySession(gameObj, false);
});

// --- Automatic Background Novelties Feed & On-Board Novelty Offer Widget ---
const noveltyCounterBadge = document.getElementById('novelty-counter-badge');
const noveltySourceBadge = document.getElementById('novelty-source-badge');
const noveltyGameTitle = document.getElementById('novelty-game-title');
const noveltyGameDesc = document.getElementById('novelty-game-desc');
const btnNoveltyPlay = document.getElementById('btn-novelty-play');
const btnNoveltyNext = document.getElementById('btn-novelty-next');
const btnNoveltyAll = document.getElementById('btn-novelty-all');

let autoLoadedNovelties = [];
let currentNoveltyIndex = 0;

function renderNoveltyBoardCard() {
  if (!noveltyGameTitle) return;
  if (autoLoadedNovelties.length === 0) {
    if (noveltyCounterBadge) noveltyCounterBadge.textContent = 'Sincronizando...';
    noveltyGameTitle.textContent = 'Buscando novedades en YouTube y Lichess...';
    return;
  }
  if (currentNoveltyIndex >= autoLoadedNovelties.length) {
    currentNoveltyIndex = 0;
  }
  const item = autoLoadedNovelties[currentNoveltyIndex];
  if (noveltyCounterBadge) {
    noveltyCounterBadge.textContent = `✨ ${currentNoveltyIndex + 1} / ${autoLoadedNovelties.length}`;
  }
  if (noveltySourceBadge) {
    noveltySourceBadge.textContent = item.badge || item.category || '✨ NOVEDAD DEL DÍA';
  }
  noveltyGameTitle.textContent = item.title || 'Partida Destacada';
  if (noveltyGameDesc) {
    noveltyGameDesc.textContent = item.description || `${item.category}`;
  }
  if (btnNoveltyHeaderCount) {
    btnNoveltyHeaderCount.textContent = `📚 Torneos / Novedades (${autoLoadedNovelties.length})`;
  }
}

const btnNoveltyHeaderCount = document.getElementById('btn-study-header');

btnNoveltyPlay?.addEventListener('click', () => {
  if (autoLoadedNovelties.length === 0) return;
  const item = autoLoadedNovelties[currentNoveltyIndex];
  if (item) {
    startStudySession(item, Boolean(item.isPuzzle));
  }
});

btnNoveltyNext?.addEventListener('click', () => {
  if (autoLoadedNovelties.length === 0) return;
  currentNoveltyIndex = (currentNoveltyIndex + 1) % autoLoadedNovelties.length;
  renderNoveltyBoardCard();
  soundFX.playSelect();
});

btnNoveltyAll?.addEventListener('click', () => {
  openStudyDialog();
});

// Automatically rotate the offered novelty on the board every 14 seconds so the user sees fresh games
setInterval(() => {
  if (autoLoadedNovelties.length > 1 && !activeStudy && !studyDialog?.open) {
    currentNoveltyIndex = (currentNoveltyIndex + 1) % autoLoadedNovelties.length;
    renderNoveltyBoardCard();
  }
}, 14000);

// Trigger automatic background discovery of YouTube & Live Tournament novelties on startup!
function initAutoNoveltiesFeed() {
  const existingDbFps = getSetOfExistingTournamentAndSavedFps();
  autoSyncNoveltiesFeed(existingDbFps, (updatedNovelties) => {
    autoLoadedNovelties = deduplicateGames(updatedNovelties);
    renderNoveltyBoardCard();
  });
}

function getSetOfExistingTournamentAndSavedFps() {
  const set = new Set();
  for (const g of CURATED_TOURNAMENT_GAMES) {
    const fp = getGameFingerprint(g);
    if (fp) set.add(fp);
  }
  for (const s of getSavedGames()) {
    const fp = s.fingerprint || getGameFingerprint(s);
    if (fp) set.add(fp);
  }
  return set;
}

initAutoNoveltiesFeed();

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
          sender: senderColor === 'w' ? '☀️ Alianza (Blancas)' : '👁️ Legión (Negras)',
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
