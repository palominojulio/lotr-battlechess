import { PIECE_VALUES } from './lotrLore.js';

const PST_PAWN = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_CENTER = [
  [-30,-20,-20,-20,-20,-20,-20,-30],
  [-20,  0,  0,  5,  5,  0,  0,-20],
  [-20,  5, 15, 20, 20, 15,  5,-20],
  [-20, 10, 20, 30, 30, 20, 10,-20],
  [-20, 10, 20, 30, 30, 20, 10,-20],
  [-20,  5, 15, 20, 20, 15,  5,-20],
  [-20,  0,  0,  5,  5,  0,  0,-20],
  [-30,-20,-20,-20,-20,-20,-20,-30]
];

function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw()) {
    return 0;
  }

  const board = chess.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;

      const base = PIECE_VALUES[p.type] || 100;
      const rowIdx = p.color === 'w' ? r : 7 - r;
      const posBonus = p.type === 'p' ? PST_PAWN[rowIdx][c] : PST_CENTER[rowIdx][c] * 0.4;

      if (p.color === 'w') {
        score += base + posBonus;
      } else {
        score -= base + posBonus;
      }
    }
  }

  return score;
}

function minimax(chess, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
  // Sort captures first for better alpha-beta pruning and aggressive Battle Chess action
  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const ev = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const ev = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function chooseBestMove(chess, level = 2) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Level 1 (Easy): mostly random with preference for captures
  if (level === 1) {
    const captures = moves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.7) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = level >= 3 ? 3 : 2;
  const isWhite = chess.turn() === 'w';
  let bestMove = moves[0];
  let bestValue = isWhite ? -Infinity : Infinity;

  // Order captures first
  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  for (const move of moves) {
    chess.move(move);
    const val = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
    chess.undo();

    // Small random jitter so equal moves vary
    const jitter = (Math.random() - 0.5) * 12;
    const totalVal = val + jitter;

    if (isWhite && totalVal > bestValue) {
      bestValue = totalVal;
      bestMove = move;
    } else if (!isWhite && totalVal < bestValue) {
      bestValue = totalVal;
      bestMove = move;
    }
  }

  return bestMove;
}
