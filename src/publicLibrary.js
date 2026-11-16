/**
 * Public Chess Repositories, Live Tournament Broadcasts (Lichess API) & Master Tournament Archive
 */

export const CURATED_TOURNAMENT_GAMES = [
  {
    id: 'kasparov-topalov-1999',
    category: '🏆 Torneo Tata Steel (Wijk aan Zee 1999)',
    title: 'Kasparov vs. Topalov («La Inmortal de Kasparov»)',
    white: 'Garry Kasparov (2812)',
    black: 'Veselin Topalov (2700)',
    result: '1-0',
    description: 'Sacrificio legendario de torre en d4 (24.Txd4!) cazando al rey negro desde e8 hasta a1.',
    pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7'
  },
  {
    id: 'ding-nepo-2023',
    category: '🏆 Campeonato Mundial FIDE 2023 (Astaná, P6)',
    title: 'Ding Liren vs. Ian Nepomniachtchi',
    white: 'Ding Liren (2788)',
    black: 'Ian Nepomniachtchi (2795)',
    result: '1-0',
    description: 'Sistema Londres de torneo mundial con red de mate geométrica y sacrificio final.',
    pgn: '1. d4 Nf6 2. Nf3 d5 3. Bf4 c5 4. e3 Nc6 5. Nbd2 cxd4 6. exd4 Bf5 7. c3 e6 8. Bb5 Bd6 9. Bxd6 Qxd6 10. O-O O-O 11. Re1 h6 12. Ne5 Ne7 13. a4 a6 14. Bf1 Nd7 15. Nxd7 Qxd7 16. a5 Qc7 17. Qf3 Rfc8 18. Ra3 Bg6 19. Nb3 Nc6 20. Qg3 Qe7 21. h4 Re8 22. Nc5 e5 23. Rb3 Nxa5 24. Rxe5 Qf6 25. Ra3 Nc4 26. Bxc4 dxc4 27. h5 Bc2 28. Nxb7 Qb6 29. Nd6 Rxe5 30. Qxe5 Qxb2 31. Ra5 Qxc3 32. Rc5 Bb3 33. Rc7 Rf8 34. Nxf7 Qc1+ 35. Kh2 Bxf7 36. Rxf7 Rxf7 37. Qe8+ Rf8 38. Qe6+ Kh8 39. Qe7 Rf5 40. Qe8+ Kh7 41. Qg6+ Kg8 42. Qxf5 c3 43. Qe6+ Kh7 44. d5'
  },
  {
    id: 'fischer-spassky-1972',
    category: '🏆 Campeonato Mundial 1972 (Reikiavik, P6)',
    title: 'Bobby Fischer vs. Boris Spassky',
    white: 'Bobby Fischer (2785)',
    black: 'Boris Spassky (2660)',
    result: '1-0',
    description: 'Gambito de Dama (Variante Tartakower); Spassky aplaudió de pie a Fischer al terminar.',
    pgn: '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4'
  },
  {
    id: 'byrne-fischer-1956',
    category: '🏆 Torneo Rosenwald (Nueva York 1956)',
    title: 'Donald Byrne vs. Bobby Fischer («Partida del Siglo»)',
    white: 'Donald Byrne',
    black: 'Bobby Fischer (13 años)',
    result: '0-1',
    description: 'Defensa Grünfeld con sacrificio de caballo (11...Na4!!) y sacrificio de dama (17...Be6!!) hasta el mate.',
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#'
  },
  {
    id: 'karpov-kasparov-1985',
    category: '🏆 Campeonato Mundial 1985 (Moscú, P16)',
    title: 'Anatoly Karpov vs. Garry Kasparov',
    white: 'Anatoly Karpov (2700)',
    black: 'Garry Kasparov (2710)',
    result: '0-1',
    description: 'Defensa Siciliana con el célebre caballo pulpo en d3 que paralizó a todo el ejército blanco.',
    pgn: '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29.Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+'
  },
  {
    id: 'morphy-opera-1858',
    category: '🏛️ Clásico de Estudio (París 1858)',
    title: 'Paul Morphy vs. Duque de Brunswick («La Ópera»)',
    white: 'Paul Morphy',
    black: 'Duque de Brunswick & Conde Isouard',
    result: '1-0',
    description: 'La mejor partida de la historia para aprender desarrollo rápido, iniciativa y sacrificio de dama (16.Qb8+!!).',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#'
  },
  {
    id: 'anderssen-immortal-1851',
    category: '🏛️ Torneo Internacional de Londres 1851',
    title: 'Anderssen vs. Kieseritzky («La Inmortal»)',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: '1-0',
    description: 'Gambito de Rey en el primer torneo internacional moderno: sacrificio de alfil, las dos torres y la dama.',
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#'
  },
  {
    id: 'opening-ruy-lopez',
    category: '📘 Práctica de Aperturas de Torneo',
    title: 'Apertura Española (Ruy López · Línea Principal)',
    white: 'Blancas (Estudio)',
    black: 'Negras (Estudio)',
    result: '*',
    description: 'Posición clásica de torneo tras 9 jugadas para practicar planes de medio juego con ambos bandos.',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3'
  },
  {
    id: 'opening-sicilian-najdorf',
    category: '📘 Práctica de Aperturas de Torneo',
    title: 'Defensa Siciliana · Variante Najdorf (Ataque Inglés)',
    white: 'Blancas (Estudio)',
    black: 'Negras (Estudio)',
    result: '*',
    description: 'La defensa de torneo más combativa de Kasparov, Fischer y Carlsen lista para practicar desde la jugada 8.',
    pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3'
  }
];

/**
 * Parses a multi-game PGN string into an array of game objects
 */
export function parseMultiGamePgn(rawPgnText, defaultCategory = '🏆 Torneo / Repositorio Público') {
  if (!rawPgnText || typeof rawPgnText !== 'string') return [];
  const chunks = rawPgnText
    .replace(/\r\n/g, '\n')
    .split(/\n(?=\[Event\s+")/g)
    .map((c) => c.trim())
    .filter(Boolean);

  const games = [];
  for (const chunk of chunks) {
    const getHeader = (tag) => {
      const m = chunk.match(new RegExp(`\\[${tag}\\s+"([^"]*)"\\]`, 'i'));
      return m ? m[1] : '';
    };
    const event = getHeader('Event') || defaultCategory;
    const white = getHeader('White') || 'Blancas';
    const black = getHeader('Black') || 'Negras';
    const result = getHeader('Result') || '*';
    const date = getHeader('Date') || getHeader('UTCDate') || '';
    const whiteElo = getHeader('WhiteElo');
    const blackElo = getHeader('BlackElo');
    const site = getHeader('Site') || '';

    // Extract moves body (strip headers and PGN comments/annotations for clean chess.js loadPgn)
    const body = chunk
      .replace(/^\[.*\]\s*$/gm, '')
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\$\d+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (body && body.length > 4) {
      const wLabel = whiteElo ? `${white} (${whiteElo})` : white;
      const bLabel = blackElo ? `${black} (${blackElo})` : black;
      games.push({
        id: `pgn-${games.length}-${Date.now()}`,
        category: `🏆 ${event}${date ? ` (${date})` : ''}`,
        title: `${wLabel} vs. ${bLabel}`,
        white: wLabel,
        black: bLabel,
        result,
        description: site ? `Fuente: ${site} · Resultado: ${result}` : `Resultado: ${result}`,
        pgn: body
      });
    }
  }
  return games;
}

/**
 * Fetches live or recent official Tournament Broadcasts from Lichess API
 */
export async function fetchLichessLiveTournaments() {
  const res = await fetch('https://lichess.org/api/tournament', {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('No se pudo conectar con la API de torneos de Lichess.');
  const data = await res.json();
  const list = [
    ...(data.started || []),
    ...(data.finished || []),
    ...(data.created || [])
  ].slice(0, 8);

  return list.map((t) => ({
    id: t.id,
    name: t.fullName || t.name || 'Torneo Lichess',
    nbPlayers: t.nbPlayers || 0,
    variant: t.variant?.name || 'Standard',
    perf: t.perf?.name || 'Blitz/Rapid'
  }));
}

/**
 * Fetches top games from a specific Lichess Tournament ID
 */
export async function fetchLichessTournamentGames(tournamentId, max = 8) {
  const cleanId = String(tournamentId).trim().replace(/^.*\/tournament\//i, '').split(/[/?#]/)[0];
  const url = `https://lichess.org/api/tournament/${encodeURIComponent(cleanId)}/games?max=${max}&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-chess-pgn' }
  });
  if (!res.ok) throw new Error(`No se encontraron partidas para el torneo ${cleanId}`);
  const pgnText = await res.text();
  return parseMultiGamePgn(pgnText, `Torneo Lichess #${cleanId}`);
}

/**
 * Fetches recent public games (including tournament games) for any Lichess user / Grandmaster
 */
export async function fetchLichessUserGames(username, max = 8) {
  const cleanUser = String(username).trim().replace(/^.*\/@\//i, '').split(/[/?#]/)[0];
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(cleanUser)}?max=${max}&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-chess-pgn' }
  });
  if (!res.ok) throw new Error(`No se encontraron partidas públicas del jugador "${cleanUser}".`);
  const pgnText = await res.text();
  return parseMultiGamePgn(pgnText, `Partidas de ${cleanUser}`);
}

/**
 * Fetches a single public game by Lichess URL or 8-char game ID
 */
export async function fetchLichessGameById(rawUrlOrId) {
  const str = String(rawUrlOrId).trim();
  const match = str.match(/(?:lichess\.org\/)?([a-zA-Z0-9]{8})(?:\/|\b|$)/);
  const gameId = match ? match[1] : str.slice(0, 8);
  const url = `https://lichess.org/game/export/${encodeURIComponent(gameId)}?clocks=false&evals=false`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-chess-pgn' }
  });
  if (!res.ok) throw new Error(`No se encontró la partida pública con ID "${gameId}".`);
  const pgnText = await res.text();
  const parsed = parseMultiGamePgn(pgnText, 'Partida Lichess');
  return parsed[0] || null;
}

/**
 * Fetches the official Lichess Daily Tactical Puzzle
 */
export async function fetchLichessDailyPuzzle() {
  const res = await fetch('https://lichess.org/api/puzzle/daily', {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('No se pudo cargar el Reto Diario de Lichess.');
  const data = await res.json();
  const pgn = data.game?.pgn || '';
  const players = data.game?.players || [];
  const w = players.find((p) => p.color === 'white')?.name || 'Blancas';
  const b = players.find((p) => p.color === 'black')?.name || 'Negras';
  const rating = data.puzzle?.rating || 1800;
  const solution = data.puzzle?.solution || [];

  return {
    id: `puzzle-${data.puzzle?.id || 'daily'}`,
    category: `🧩 Reto Táctico Diario de Lichess (ELO ${rating})`,
    title: `${w} vs. ${b} (Problema #${data.puzzle?.id || 'Hoy'})`,
    white: w,
    black: b,
    result: '*',
    description: `Encuentra la mejor combinación táctica tras la última jugada. Solución: ${solution.join(' → ')}`,
    pgn,
    isPuzzle: true,
    solution
  };
}
