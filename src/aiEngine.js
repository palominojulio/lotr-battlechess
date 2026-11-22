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

export function evaluateBoard(chess) {
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

/**
 * Maps a player's win probability (0..100), signed advantage (pawns), and check risk
 * to a dynamic traffic-light color tier:
 * - Green (#22c55e / #10b981): Winning / Dominating / Good position
 * - Orange (#f97316): At risk / Losing ground / Trailing
 * - Red (#ef4444): High risk / Losing badly / In Check
 */
function getPlayerRiskColorTier(myAdvantagePawns, myWinProb, amInCheck) {
  if (amInCheck || myWinProb <= 34 || myAdvantagePawns <= -1.8) {
    return {
      tier: 'danger',
      hex: '#ef4444',
      hex3D: 0xef4444,
      bgGradient: 'linear-gradient(180deg, #dc2626 0%, #ef4444 50%, #991b1b 100%)',
      glow: 'rgba(239, 68, 68, 0.75)',
      statusLabel: amInCheck ? '🔴 ¡EN JAQUE!' : '🔴 Perdiendo'
    };
  }
  if (myWinProb < 49 || myAdvantagePawns < -0.12) {
    return {
      tier: 'risk',
      hex: '#f97316',
      hex3D: 0xf97316,
      bgGradient: 'linear-gradient(180deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
      glow: 'rgba(249, 115, 22, 0.7)',
      statusLabel: '🟠 En Riesgo'
    };
  }
  if (myWinProb >= 62 || myAdvantagePawns >= 1.2) {
    return {
      tier: 'winning',
      hex: '#22c55e',
      hex3D: 0x22c55e,
      bgGradient: 'linear-gradient(180deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
      glow: 'rgba(34, 197, 94, 0.8)',
      statusLabel: '🟢 Dominando'
    };
  }
  // Balanced or slight advantage (>= 49%) -> Green ("va bien")
  return {
    tier: 'good',
    hex: '#10b981',
    hex3D: 0x10b981,
    bgGradient: 'linear-gradient(180deg, #059669 0%, #10b981 50%, #34d399 100%)',
    glow: 'rgba(16, 185, 129, 0.65)',
    statusLabel: myAdvantagePawns > 0.12 ? '🟢 Ventaja' : '🟢 Estable'
  };
}

/**
 * Computes the Attack-Line Advance, Win Probability, and Dynamic Risk Colors (Green / Orange / Red)
 * for BOTH players on the right-side vertical column.
 */
export function computeAttackAdvanceMetrics(chess) {
  const rawScore = evaluateBoard(chess);
  const board = chess.board();

  let maxWhiteRank = 2; // 1..8
  let minBlackRank = 7; // 1..8
  let whiteAdvSum = 0;
  let whiteCount = 0;
  let blackAdvSum = 0;
  let blackCount = 0;

  for (let r = 0; r < 8; r++) {
    const rankNum = 8 - r; // r=0 is rank 8, r=7 is rank 1
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.color === 'w') {
        if (rankNum > maxWhiteRank) maxWhiteRank = rankNum;
        if (p.type !== 'k') {
          whiteAdvSum += rankNum;
          whiteCount++;
        }
      } else {
        if (rankNum < minBlackRank) minBlackRank = rankNum;
        if (p.type !== 'k') {
          blackAdvSum += rankNum;
          blackCount++;
        }
      }
    }
  }

  const avgWhiteRank = whiteCount > 0 ? whiteAdvSum / whiteCount : 2;
  const avgBlackRank = blackCount > 0 ? blackAdvSum / blackCount : 7;

  // Combine material/positional score with attack-line territorial advance
  const territoryBonus = ((avgWhiteRank - 2) - (7 - avgBlackRank)) * 38;
  const combinedCp = Math.abs(rawScore) > 50000 ? rawScore : rawScore + territoryBonus;
  const evalPawns = combinedCp / 100;

  let evalText = '0.0';
  let whiteBarPct = 50;

  if (Math.abs(rawScore) > 50000) {
    const whiteWins = rawScore > 0;
    evalText = whiteWins ? '1-0' : '0-1';
    whiteBarPct = whiteWins ? 98 : 2;
  } else {
    const sign = evalPawns > 0.05 ? '+' : '';
    evalText = `${sign}${evalPawns.toFixed(1)}`;
    // Logistic win probability curve (1 / (1 + 10^(-evalPawns / 3.5)))
    const winLogistic = 1 / (1 + Math.pow(10, -evalPawns / 3.5));
    whiteBarPct = Math.round(winLogistic * 100);
    whiteBarPct = Math.max(4, Math.min(96, whiteBarPct));
  }

  const whiteWinProb = whiteBarPct;
  const blackWinProb = 100 - whiteBarPct;

  const inCheck = chess.inCheck();
  const whiteInCheck = inCheck && chess.turn() === 'w';
  const blackInCheck = inCheck && chess.turn() === 'b';

  const whiteColor = getPlayerRiskColorTier(evalPawns, whiteWinProb, whiteInCheck);
  const blackColor = getPlayerRiskColorTier(-evalPawns, blackWinProb, blackInCheck);

  // Frontline rank (1..8) mapped from whiteBarPct & forward pieces
  const frontlineRank = Math.max(1, Math.min(8, Math.round((whiteBarPct / 100) * 7 + 1)));

  return {
    evalPawns,
    evalText,
    whiteBarPct,
    whiteWinProb,
    blackWinProb,
    whiteColor,
    blackColor,
    whiteAttackRank: maxWhiteRank,
    blackAttackRank: minBlackRank,
    frontlineRank
  };
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
