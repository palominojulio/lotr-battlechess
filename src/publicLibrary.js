import { Chess } from 'chess.js';

/**
 * Public Chess Repositories, YouTube Chess Importer, Live Tournament Broadcasts (Lichess API)
 * & Deduplicated Master Database
 */

export const CURATED_TOURNAMENT_GAMES = [
  {
    id: 'kasparov-topalov-1999',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=vnf-ktmpjjw',
    championship: 'Torneo Tata Steel (Wijk aan Zee)',
    year: '1999',
    category: '🏆 Torneo Tata Steel (Wijk aan Zee) · Año 1999',
    title: 'Kasparov vs. Topalov («La Inmortal de Kasparov»)',
    white: 'Garry Kasparov (2812)',
    black: 'Veselin Topalov (2700)',
    result: '1-0',
    description: 'Sacrificio legendario de torre en d4 (24.Txd4!!) cazando al rey negro desde e8 hasta a1.',
    moveComments: {
      1: 'Kasparov abre con 1.e4 buscando control central inmediato y líneas abiertas.',
      2: 'Topalov plantea la Defensa Pirc (1...d6), invitando a las blancas a ocupar el centro para contraatacar.',
      21: '11.O-O-O: Enroque largo agresivo; Kasparov pone al rey a salvo en c1 y lanza las torres al ataque.',
      47: '24.Txd4!! ¡SACRIFICIO INMORTAL DE TORRE! Kasparov entrega una torre entera para destruir el escudo del rey negro.',
      49: '25.Te7+!! Segundo golpe demoledor: obliga al rey de Topalov a salir a campo abierto en b6.',
      51: '26.Dxd4+! La dama entra con jaque cazando al rey negro por el flanco de dama.',
      71: '36.Af1! Jugada silenciosa y mortal: teje una red de mate imparable contra el rey negro en d1.'
    },
    pgn: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7'
  },
  {
    id: 'ding-nepo-2023',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=YQ24pBnehak',
    championship: 'Campeonato Mundial FIDE (Astaná)',
    year: '2023',
    category: '🏆 Campeonato Mundial FIDE (Astaná) · Año 2023',
    title: 'Ding Liren vs. Ian Nepomniachtchi (Partida 6)',
    white: 'Ding Liren (2788)',
    black: 'Ian Nepomniachtchi (2795)',
    result: '1-0',
    description: 'Sistema Londres de Campeonato Mundial con red de mate geométrica y sacrificio final.',
    moveComments: {
      5: '3.Af4: Ding Liren emplea el Sistema Londres por primera vez en la historia de un Mundial.',
      43: '22.Cc5! El caballo blanco se instala en una casilla dominante paralizando el flanco de dama negro.',
      63: '32.Tc5! Maniobra profunda de torre para cortar la retirada y preparar el asalto final al rey.',
      81: '41.Dg6+! Golpe táctico definitivo que fuerza la ganancia de material o el mate en pocas jugadas.'
    },
    pgn: '1. d4 Nf6 2. Nf3 d5 3. Bf4 c5 4. e3 Nc6 5. Nbd2 cxd4 6. exd4 Bf5 7. c3 e6 8. Bb5 Bd6 9. Bxd6 Qxd6 10. O-O O-O 11. Re1 h6 12. Ne5 Ne7 13. a4 a6 14. Bf1 Nd7 15. Nxd7 Qxd7 16. a5 Qc7 17. Qf3 Rfc8 18. Ra3 Bg6 19. Nb3 Nc6 20. Qg3 Qe7 21. h4 Re8 22. Nc5 e5 23. Rb3 Nxa5 24. Rxe5 Qf6 25. Ra3 Nc4 26. Bxc4 dxc4 27. h5 Bc2 28. Nxb7 Qb6 29. Nd6 Rxe5 30. Qxe5 Qxb2 31. Ra5 Qxc3 32. Rc5 Bb3 33. Rc7 Rf8 34. Nxf7 Qc1+ 35. Kh2 Bxf7 36. Rxf7 Rxf7 37. Qe8+ Rf8 38. Qe6+ Kh8 39. Qe7 Rf5 40. Qe8+ Kh7 41. Qg6+ Kg8 42. Qxf5 c3 43. Qe6+ Kh7 44. d5'
  },
  {
    id: 'fischer-spassky-1972',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=1lpETuz2W74',
    championship: 'Campeonato Mundial FIDE (Reikiavik)',
    year: '1972',
    category: '🏆 Campeonato Mundial FIDE (Reikiavik) · Año 1972',
    title: 'Bobby Fischer vs. Boris Spassky (Partida 6)',
    white: 'Bobby Fischer (2785)',
    black: 'Boris Spassky (2660)',
    result: '1-0',
    description: 'Gambito de Dama (Variante Tartakower); Spassky aplaudió de pie a Fischer al terminar.',
    moveComments: {
      1: '1.c4! Sorpresa histórica: Fischer, famoso por jugar siempre 1.e4, abre con la Apertura Inglesa / Gambito de Dama.',
      27: '14.Ab5! Clava el caballo y obliga a debilitar la estructura de peones negros en el flanco de dama.',
      39: '20.e4! Ruptura central perfecta que abre todas las líneas para las torres y el alfil de Fischer.',
      75: '38.Txf6! Sacrificio de calidad que destruye por completo la fortaleza del rey de Spassky.'
    },
    pgn: '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4'
  },
  {
    id: 'byrne-fischer-1956',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=MRoTJntvv_8',
    championship: 'Torneo Memorial Rosenwald (Nueva York)',
    year: '1956',
    category: '🏆 Torneo Rosenwald (Nueva York) · Año 1956',
    title: 'Donald Byrne vs. Bobby Fischer («Partida del Siglo»)',
    white: 'Donald Byrne',
    black: 'Bobby Fischer (13 años)',
    result: '0-1',
    description: 'Defensa Grünfeld con sacrificio de caballo (11...Ca4!!) y sacrificio de dama (17...Ae6!!) hasta el mate.',
    moveComments: {
      22: '11...Ca4!! ¡Sacrificio genial de Fischer a los 13 años! Desvía la dama blanca y abre la columna central.',
      34: '17...Ae6!! ¡EL SACRIFICIO DE DAMA DEL SIGLO! Fischer entrega su dama en b6 a cambio de un ataque de molino imparable.',
      82: '41...Tc2# ¡Jaque mate de antología coordinando torre, alfiles y caballo!'
    },
    pgn: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#'
  },
  {
    id: 'karpov-kasparov-1985',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=cXp-f9hi0Gw',
    championship: 'Campeonato Mundial FIDE (Moscú)',
    year: '1985',
    category: '🏆 Campeonato Mundial FIDE (Moscú) · Año 1985',
    title: 'Anatoly Karpov vs. Garry Kasparov (Partida 16)',
    white: 'Anatoly Karpov (2700)',
    black: 'Garry Kasparov (2710)',
    result: '0-1',
    description: 'Defensa Siciliana con el célebre caballo pulpo en d3 que paralizó a todo el ejército blanco.',
    moveComments: {
      32: '16...Cd3!! El famoso «Caballo Pulpo» de Kasparov se incrusta en el corazón de la posición de Karpov.',
      80: '40...Te1+! Sacrificio final de dama y entrada triunfal de la torre que fuerza la rendición de Karpov.'
    },
    pgn: '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nb5 d6 6. c4 Nf6 7. N1c3 a6 8. Na3 d5 9. cxd5 exd5 10. exd5 Nb4 11. Be2 Bc5 12. O-O O-O 13. Bf3 Bf5 14. Bg5 Re8 15. Qd2 b5 16. Rad1 Nd3 17. Nab1 h6 18. Bh4 b4 19. Na4 Bd6 20. Bg3 Rc8 21. b3 g5 22. Bxd6 Qxd6 23. g3 Nd7 24. Bg2 Qf6 25. a3 a5 26. axb4 axb4 27. Qa2 Bg6 28. d6 g4 29. Qd2 Kg7 30. f3 Qxd6 31. fxg4 Qd4+ 32. Kh1 Nf6 33. Rf4 Ne4 34. Qxd3 Nf2+ 35. Rxf2 Bxd3 36. Rfd2 Qe3 37. Rxd3 Rc1 38. Nb2 Qf2 39. Nd2 Rxd1+ 40. Nxd1 Re1+'
  },
  {
    id: 'morphy-opera-1858',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=KKYs-WM2ZLc',
    championship: 'Exhibición de la Ópera de París',
    year: '1858',
    category: '🏛️ Exhibición de la Ópera de París · Año 1858',
    title: 'Paul Morphy vs. Duque de Brunswick («La Ópera»)',
    white: 'Paul Morphy',
    black: 'Duque de Brunswick & Conde Isouard',
    result: '1-0',
    description: 'La mejor partida de la historia para aprender desarrollo rápido, iniciativa y sacrificio de dama (16.Db8+!!).',
    moveComments: {
      19: '10.Cxb5! Morphy sacrifica un caballo para abrir líneas contra el rey negro atrapado en el centro.',
      23: '12.O-O-O! Enroque largo trayendo la torre directamente a la columna abierta d con ganancia de tiempo.',
      31: '16.Db8+!! ¡SACRIFICIO DE DAMA INMORTAL! Obliga al caballo negro a capturar en b8 dejando libre d8.',
      33: '17.Td8# ¡Jaque mate de la Ópera con torre y alfil!'
    },
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#'
  },
  {
    id: 'anderssen-immortal-1851',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=DY54GhcGFyA',
    championship: 'Torneo Internacional de Londres',
    year: '1851',
    category: '🏛️ Torneo Internacional de Londres · Año 1851',
    title: 'Anderssen vs. Kieseritzky («La Inmortal»)',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    result: '1-0',
    description: 'Gambito de Rey en el primer torneo internacional moderno: sacrificio de alfil, las dos torres y la dama.',
    moveComments: {
      35: '18.Ad6!! Anderssen ofrece sus dos torres en a1 y g1 para encerrar al rey negro en el centro.',
      43: '22.Df6+!! ¡Sacrificio final de dama en f6 que desvía al caballo de g8!',
      45: '23.Ae7# ¡Jaque mate inmortal solo con tres piezas menores!'
    },
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#'
  },
  {
    id: 'opening-ruy-lopez',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=cXp-f9hi0Gw',
    championship: 'Enciclopedia de Aperturas FIDE (C92)',
    year: 'Clásico',
    category: '📘 Enciclopedia de Aperturas FIDE · Línea Principal',
    title: 'Apertura Española (Ruy López · Línea Principal)',
    white: 'Blancas (Estudio)',
    black: 'Negras (Estudio)',
    result: '*',
    description: 'Posición clásica de torneo tras 9 jugadas para practicar planes de medio juego con ambos bandos.',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3'
  },
  {
    id: 'opening-sicilian-najdorf',
    source: 'tournament_db',
    youtubeUrl: 'https://www.youtube.com/watch?v=cXp-f9hi0Gw',
    championship: 'Enciclopedia de Aperturas FIDE (B90)',
    year: 'Clásico',
    category: '📘 Enciclopedia de Aperturas FIDE · Variante Najdorf',
    title: 'Defensa Siciliana · Variante Najdorf (Ataque Inglés)',
    white: 'Blancas (Estudio)',
    black: 'Negras (Estudio)',
    result: '*',
    description: 'La defensa de torneo más combativa de Kasparov, Fischer y Carlsen lista para practicar desde la jugada 8.',
    pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3'
  }
];

/**
 * Curated YouTube Viral & Educational Chess Games (100% distinct from CURATED_TOURNAMENT_GAMES — zero duplicates!)
 */
export const YOUTUBE_FEATURED_GAMES = [
  {
    id: 'yt-rey-enigma-karpov-2021',
    source: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=Pclp2jUfNs0',
    championship: 'Final Got Talent España · Duelo Especial (Madrid)',
    year: '2021',
    category: '📺 Final Got Talent & YouTube · Año 2021',
    title: 'Rey Enigma vs. Anatoly Karpov (Duelo Épico en YouTube)',
    white: 'Rey Enigma',
    black: 'GM Anatoly Karpov',
    result: '1/2-1/2',
    description: 'El vídeo de ajedrez en español más viral de YouTube: Rey Enigma resiste a la leyenda mundial Karpov.',
    moveComments: {
      1: '1.e4: Rey Enigma abre con peón de rey ante el excampeón mundial Anatoly Karpov.',
      2: '1...c6! Karpov responde con su favorita Defensa Caro-Kann, famosa por su solidez granítica.',
      11: '6.Af4: Desarrollo clásico de la variante del cambio manteniendo una estructura firme.',
      27: '14.Ce5! Rey Enigma instala un caballo centralizado muy activo en e5.'
    },
    pgn: '1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 Nc6 5. c3 Nf6 6. Bf4 Bg4 7. Qb3 Qd7 8. Nd2 e6 9. Ngf3 Bxf3 10. Nxf3 Bd6 11. Bxd6 Qxd6 12. O-O O-O 13. Rae1 Rab8 14. Ne5 b5 15. a3 a5 16. Qd1 b4 17. axb4 axb4 18. Re3 bxc3 19. bxc3 g6 20. Qf3 Kg7 21. Rfe1 Ne7 22. h4 Nf5 23. Bxf5 exf5'
  },
  {
    id: 'yt-carlsen-bill-gates-2014',
    source: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=KFi48q7X3ac',
    championship: 'Exhibición Internacional Skavlan (Londres)',
    year: '2014',
    category: '📺 Exhibición Skavlan (YouTube) · Año 2014',
    title: 'Bill Gates vs. Magnus Carlsen (Mate en 9 Jugadas)',
    white: 'Bill Gates',
    black: 'GM Magnus Carlsen',
    result: '0-1',
    description: 'Una de las partidas más vistas en la historia de YouTube: Carlsen da jaque mate en solo 9 movimientos.',
    moveComments: {
      14: '7...Ce5!! Carlsen sacrifica el caballo para abrir la columna h sobre el enroque de Bill Gates.',
      18: '9...Dh2# ¡Jaque mate relámpago de Magnus Carlsen en solo 9 jugadas!'
    },
    pgn: '1. e4 Nc6 2. Nf3 d5 3. Bd3 Nf6 4. exd5 Qxd5 5. Nc3 Qh5 6. O-O Bg4 7. h3 Ne5 8. hxg4 Nfxg4 9. Nxe5 Qh2#'
  },
  {
    id: 'yt-deep-blue-kasparov-1997',
    source: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=UrsvWd36A_Q',
    championship: 'Match Mundial IBM Humano vs. Máquina (Nueva York)',
    year: '1997',
    category: '📺 Match Mundial IBM (Nueva York) · Año 1997',
    title: 'Deep Blue vs. Garry Kasparov (Partida 6 · Sacrificio 8.Cxe6!)',
    white: 'Deep Blue (IBM)',
    black: 'GM Garry Kasparov',
    result: '1-0',
    description: 'El sacrificio de caballo en la Defensa Caro-Kann más analizado por Agadmator, GothamChess y Partidas Inmortales.',
    moveComments: {
      15: '8.Cxe6!! ¡El sacrificio de caballo que cambió la historia! Deep Blue destruye el centro de Kasparov e impide el enroque.'
    },
    pgn: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4'
  },
  {
    id: 'yt-rosen-stafford-gambit',
    source: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=CbSUtDBoDpg',
    championship: 'Torneo Online Blitz Arena (YouTube)',
    year: '2020',
    category: '📺 Torneo Online Blitz Arena · Año 2020',
    title: 'Gambito Stafford · Celada de Sacrificio de Dama (Eric Rosen)',
    white: 'Rival Online',
    black: 'IM Eric Rosen',
    result: '0-1',
    description: 'La celada táctica más famosa de YouTube («Oh no, my Queen!») para estudiar ataques fulminantes sobre f2 y d1.',
    moveComments: {
      12: '6...Cxe4!! «Oh no, my Queen!» Eric Rosen deja su dama en d8 para tender una red de mate mortal.',
      14: '7...Axf2+! El alfil golpea f2 obligando al rey blanco a subir a e2.',
      16: '8...Ag4# ¡Jaque mate con dos alfiles y un caballo tras sacrificar la dama!'
    },
    pgn: '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nc6 4. Nxc6 dxc6 5. d3 Bc5 6. Bg5 Nxe4 7. Bxd8 Bxf2+ 8. Ke2 Bg4#'
  },
  {
    id: 'yt-rotlewi-rubinstein-1907',
    source: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=BnfONHUqAgM',
    championship: 'Torneo Nacional de Maestros (Lodz)',
    year: '1907',
    category: '📺 Torneo de Maestros de Lodz · Año 1907',
    title: 'Rotlewi vs. Akiba Rubinstein («La Inmortal de Rubinstein»)',
    white: 'Georg Rotlewi',
    black: 'Akiba Rubinstein',
    result: '0-1',
    description: 'Sacrificio consecutivo de dama y torre (22...Txc3!! y 23...Td2!!) imprescindible en todos los canales de estudio.',
    moveComments: {
      44: '22...Txc3!! ¡Primer sacrificio brillante de Rubinstein! Entrega la torre dejando además su dama atacada en h4.',
      46: '23...Td2!! ¡Segundo sacrificio consecutivo! Desvía la dama blanca de la defensa de la diagonal b7-h1.',
      50: '25...Th3! Amenaza mate imparable en h2; una de las combinaciones más bellas de todos los tiempos.'
    },
    pgn: '1. d4 d5 2. Nf3 e6 3. e3 c5 4. c4 Nc6 5. Nc3 Nf6 6. dxc5 Bxc5 7. a3 a6 8. b4 Bd6 9. Bb2 O-O 10. Qd2 Qe7 11. Bd3 dxc4 12. Bxc4 b5 13. Bd3 Rd8 14. Qe2 Bb7 15. O-O Ne5 16. Nxe5 Bxe5 17. f4 Bc7 18. e4 Rac8 19. e5 Bb6+ 20. Kh1 Ng4 21. Be4 Qh4 22. g3 Rxc3 23. gxh4 Rd2 24. Qxd2 Bxe4+ 25. Qg2 Rh3'
  }
];

/**
 * Converts Spanish algebraic notation (C=Knight, A=Bishop, T=Rook, D=Queen, R=King)
 * and cleans YouTube timestamps/descriptions into standard English SAN PGN.
 */
export function normalizeSpanishOrEnglishPgn(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  // 1. Remove PGN header tags, curly comments, parenthetical variations, and YouTube timestamps (e.g. 04:15)
  let cleaned = rawText
    .replace(/^\[.*\]\s*$/gm, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/0-0-0/g, 'O-O-O')
    .replace(/0-0/g, 'O-O');

  // 2. If there is prose before "1.", slice starting from the first move "1."
  const firstMoveIdx = cleaned.search(/\b1\s*\.\s*[a-hNBRQKCATOR]/);
  if (firstMoveIdx >= 0) {
    cleaned = cleaned.slice(firstMoveIdx);
  }

  // 3. Convert Spanish piece letters (C->N, A->B, T->R, D->Q, R->K) at the start of SAN tokens
  const mapEsToEn = { C: 'N', A: 'B', T: 'R', D: 'Q', R: 'K' };
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const outTokens = [];

  for (let tok of tokens) {
    // Handle attached move numbers like "1.Cf3" or "12...Txd4"
    const numMatch = tok.match(/^(\d+\.+)(.*)$/);
    let prefix = '';
    let movePart = tok;
    if (numMatch) {
      prefix = numMatch[1];
      movePart = numMatch[2];
    }

    if (!movePart) {
      if (prefix) outTokens.push(prefix);
      continue;
    }

    // Check if movePart is a valid chess move token in Spanish or English
    const sanMatch = movePart.match(/^([CATDRNBRQK])([a-h1-8]?x?[a-h][1-8](?:=[CATDRNBRQK])?[+#!?]*)$/);
    if (sanMatch) {
      const pieceChar = sanMatch[1];
      let rest = sanMatch[2];
      // Replace Spanish promotion piece if present (e.g. =D -> =Q)
      rest = rest.replace(/=([CATDR])/, (_, p) => `=${mapEsToEn[p] || p}`);
      // Note: 'R' exists in both Spanish (Rey = K) and English (Rook = R).
      // We keep 'R' as Rook if the PGN already uses English 'N'/'B'/'Q', or convert Spanish C/A/T/D.
      const usesSpanishLetters = /\b(?:\d+\.*)?[CAD][a-h1-8x]/.test(cleaned);
      let mappedPiece = pieceChar;
      if (pieceChar === 'C' || pieceChar === 'A' || pieceChar === 'T' || pieceChar === 'D') {
        mappedPiece = mapEsToEn[pieceChar];
      } else if (pieceChar === 'R' && usesSpanishLetters) {
        mappedPiece = 'K';
      }
      outTokens.push(`${prefix}${mappedPiece}${rest}`);
    } else if (/^(?:[a-h](?:x[a-h])?[1-8](?:=[CATDRNBRQK])?|O-O(?:-O)?)[+#!?]*$/.test(movePart)) {
      const fixedPawn = movePart.replace(/=([CATDR])/, (_, p) => `=${mapEsToEn[p] || p}`);
      outTokens.push(`${prefix}${fixedPawn}`);
    } else if (/^\d+\.+$/.test(tok) || /^(?:1-0|0-1|1\/2-1\/2|\*)$/.test(tok)) {
      outTokens.push(tok);
    }
  }

  return outTokens.join(' ').trim();
}

/**
 * Computes a unique canonical fingerprint for any chess game based on its exact coordinate moves
 * (e.g. "e2e4|e7e5|g1f3...") so identical games across Tournament DB, YouTube, Lichess, or Saved Games
 * are NEVER duplicated!
 */
export function getGameFingerprint(gameOrPgn) {
  try {
    if (!gameOrPgn) return '';
    if (typeof gameOrPgn === 'object' && Array.isArray(gameOrPgn.moves) && gameOrPgn.moves.length > 0) {
      return gameOrPgn.moves.map((m) => `${m.from}${m.to}${m.promotion || ''}`).join('|');
    }
    const rawPgn = typeof gameOrPgn === 'string' ? gameOrPgn : (gameOrPgn.pgn || gameOrPgn.fen || '');
    if (!rawPgn) return '';

    const temp = new Chess();
    const normalized = normalizeSpanishOrEnglishPgn(rawPgn);
    try {
      temp.loadPgn(normalized || rawPgn);
    } catch {
      try {
        temp.loadPgn(rawPgn);
      } catch {
        temp.load(rawPgn.trim());
      }
    }
    const hist = temp.history({ verbose: true });
    if (hist.length > 0) {
      return hist.map((m) => `${m.from}${m.to}${m.promotion || ''}`).join('|');
    }
    return temp.fen();
  } catch {
    return '';
  }
}

/**
 * Deduplicates an array of game objects by their canonical move fingerprint,
 * optionally excluding games whose fingerprints are already in `existingFingerprintsSet`.
 */
export function deduplicateGames(gamesArray, existingFingerprintsSet = null) {
  const seen = new Set(existingFingerprintsSet ? [...existingFingerprintsSet] : []);
  const unique = [];

  for (const g of gamesArray || []) {
    const fp = g.fingerprint || getGameFingerprint(g);
    if (!fp) continue;
    if (seen.has(fp)) continue;
    seen.add(fp);
    unique.push({ ...g, fingerprint: fp });
  }
  return unique;
}

/**
 * Returns the set of all fingerprints in the built-in Tournament & YouTube databases
 */
export function getBuiltInDatabaseFingerprints() {
  const set = new Set();
  for (const g of [...CURATED_TOURNAMENT_GAMES, ...YOUTUBE_FEATURED_GAMES]) {
    const fp = getGameFingerprint(g);
    if (fp) set.add(fp);
  }
  return set;
}

/**
 * Extracts a YouTube Video ID (11 chars) from any YouTube URL
 */
export function extractYouTubeVideoId(rawUrl) {
  if (!rawUrl) return null;
  const m = String(rawUrl).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Loads a chess game published on YouTube:
 * - From a YouTube URL (`https://www.youtube.com/watch?v=...` or `https://youtu.be/...`)
 * - Or from a YouTube video description / comment pasted by the user (supports Spanish & English notation!)
 * Ensures it does NOT duplicate existing database games.
 */
export async function importGameFromYouTube(rawInput, existingFingerprints = new Set()) {
  const text = String(rawInput || '').trim();
  if (!text) throw new Error('Introduce un enlace de YouTube o pega la descripción con las jugadas.');

  const videoId = extractYouTubeVideoId(text);
  const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

  // 1. Check if the user pasted additional text alongside or instead of a URL that already contains PGN moves
  const candidatePgnFromInput = normalizeSpanishOrEnglishPgn(text);
  if (candidatePgnFromInput.split(/\s+/).length >= 4) {
    const testChess = new Chess();
    try {
      testChess.loadPgn(candidatePgnFromInput);
      if (testChess.history().length >= 2) {
        const fp = getGameFingerprint(candidatePgnFromInput);
        const isDup = existingFingerprints.has(fp);
        return {
          game: {
            id: `yt-custom-${Date.now()}`,
            source: 'youtube',
            youtubeUrl,
            category: '📺 Partida Extraída de YouTube',
            title: videoId ? `Vídeo YouTube (${videoId})` : 'Partida de YouTube (Notación Extraída)',
            white: 'Blancas (YouTube)',
            black: 'Negras (YouTube)',
            result: '*',
            description: isDup
              ? 'ℹ️ Esta partida ya existía en la base de datos (se ha vinculado sin duplicarla).'
              : 'Jugadas extraídas y convertidas automáticamente desde la descripción de YouTube.',
            pgn: candidatePgnFromInput,
            fingerprint: fp,
            alreadyInDb: isDup
          }
        };
      }
    } catch {}
  }

  // 2. If a YouTube URL was provided, check our YouTube featured catalog or fetch video metadata & description
  if (videoId) {
    const matchedFeatured = YOUTUBE_FEATURED_GAMES.find((g) => g.youtubeUrl?.includes(videoId));
    if (matchedFeatured) {
      return { game: { ...matchedFeatured, alreadyInDb: true } };
    }

    let videoTitle = `Partida de YouTube (${videoId})`;
    let authorName = 'Canal de Ajedrez';
    let fullDescription = '';

    // 2a. Fetch title & author via Noembed (CORS-friendly)
    try {
      const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`);
      if (oembedRes.ok) {
        const meta = await oembedRes.json();
        if (meta.title) videoTitle = meta.title;
        if (meta.author_name) authorName = meta.author_name;
      }
    } catch {}

    // 2b. Try fetching the YouTube page description via public CORS proxy to extract embedded PGN or Lichess link
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(youtubeUrl)}`;
      const pageRes = await fetch(proxyUrl);
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        const html = pageData?.contents || '';
        const descMatch = html.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
        if (descMatch && descMatch[1]) {
          fullDescription = JSON.parse(`"${descMatch[1]}"`);
        }
      }
    } catch {}

    // 2c. If description has a Lichess game URL, fetch its PGN directly!
    if (fullDescription) {
      const lichessMatch = fullDescription.match(/lichess\.org\/([a-zA-Z0-9]{8})\b/);
      if (lichessMatch) {
        try {
          const lichessGame = await fetchLichessGameById(lichessMatch[1]);
          if (lichessGame) {
            const fp = getGameFingerprint(lichessGame);
            return {
              game: {
                ...lichessGame,
                source: 'youtube',
                youtubeUrl,
                category: `📺 YouTube · ${authorName}`,
                title: videoTitle,
                fingerprint: fp,
                alreadyInDb: existingFingerprints.has(fp)
              }
            };
          }
        } catch {}
      }

      // 2d. Extract PGN moves (English or Spanish) from the YouTube video description!
      const descPgn = normalizeSpanishOrEnglishPgn(fullDescription);
      if (descPgn.split(/\s+/).length >= 4) {
        const testChess = new Chess();
        try {
          testChess.loadPgn(descPgn);
          if (testChess.history().length >= 2) {
            const fp = getGameFingerprint(descPgn);
            const isDup = existingFingerprints.has(fp);
            return {
              game: {
                id: `yt-${videoId}`,
                source: 'youtube',
                youtubeUrl,
                category: `📺 YouTube · ${authorName}`,
                title: videoTitle,
                white: 'Blancas',
                black: 'Negras',
                result: '*',
                description: isDup
                  ? `ℹ️ Partida detectada en la base de datos (sin duplicar) · Canal: ${authorName}`
                  : `Extraída automáticamente de la descripción del vídeo de ${authorName}.`,
                pgn: descPgn,
                fingerprint: fp,
                alreadyInDb: isDup
              }
            };
          }
        } catch {}
      }
    }

    // 2e. Match by keywords in the YouTube Video Title against non-duplicate games
    const lowerTitle = videoTitle.toLowerCase();
    const allKnown = [...YOUTUBE_FEATURED_GAMES, ...CURATED_TOURNAMENT_GAMES];
    const keywordMatch = allKnown.find((g) => {
      const words = g.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      return words.some((w) => lowerTitle.includes(w));
    });
    if (keywordMatch) {
      const fp = getGameFingerprint(keywordMatch);
      return {
        game: {
          ...keywordMatch,
          source: 'youtube',
          youtubeUrl,
          category: `📺 YouTube · ${authorName}`,
          title: videoTitle,
          fingerprint: fp,
          alreadyInDb: true
        }
      };
    }

    throw new Error(
      `El vídeo "${videoTitle}" no incluye la lista de jugadas PGN en su descripción pública. Copia las jugadas de la descripción o comentario de YouTube y pégalas aquí mismo.`
    );
  }

  throw new Error('No se detectó un enlace válido de YouTube ni jugadas en formato algebraico (ej: 1. e4 e5 2. Cf3 Cc6).');
}

/**
 * Parses a multi-game PGN string into an array of deduplicated game objects
 */
export function parseMultiGamePgn(rawPgnText, defaultCategory = '🏆 Torneo / Repositorio Público', existingFingerprints = null) {
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

    const body = normalizeSpanishOrEnglishPgn(chunk);

    if (body && body.length > 4) {
      const wLabel = whiteElo ? `${white} (${whiteElo})` : white;
      const bLabel = blackElo ? `${black} (${blackElo})` : black;
      const yearMatch = (date || event).match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
      games.push({
        id: `pgn-${games.length}-${Date.now()}`,
        championship: event,
        year,
        category: `🏆 ${event} · Año ${year}`,
        title: `${wLabel} vs. ${bLabel}`,
        white: wLabel,
        black: bLabel,
        result,
        description: site ? `Campeonato: ${event} (${year}) · Fuente: ${site} · Resultado: ${result}` : `Campeonato: ${event} (${year}) · Resultado: ${result}`,
        pgn: body
      });
    }
  }
  return deduplicateGames(games, existingFingerprints);
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
  ];

  // Deduplicate tournaments by ID
  const seenIds = new Set();
  const uniqueTournaments = [];
  for (const t of list) {
    if (!t?.id || seenIds.has(t.id)) continue;
    seenIds.add(t.id);
    uniqueTournaments.push({
      id: t.id,
      name: t.fullName || t.name || 'Torneo Lichess',
      nbPlayers: t.nbPlayers || 0,
      variant: t.variant?.name || 'Standard',
      perf: t.perf?.name || 'Blitz/Rapid'
    });
    if (uniqueTournaments.length >= 8) break;
  }
  return uniqueTournaments;
}

/**
 * Fetches top games from a specific Lichess Tournament ID (deduplicated against built-in DB)
 */
export async function fetchLichessTournamentGames(tournamentId, max = 10, existingFingerprints = null) {
  const cleanId = String(tournamentId).trim().replace(/^.*\/tournament\//i, '').split(/[/?#]/)[0];
  const url = `https://lichess.org/api/tournament/${encodeURIComponent(cleanId)}/games?max=${max}&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-chess-pgn' }
  });
  if (!res.ok) throw new Error(`No se encontraron partidas para el torneo ${cleanId}`);
  const pgnText = await res.text();
  return parseMultiGamePgn(pgnText, `Torneo Lichess #${cleanId}`, existingFingerprints);
}

/**
 * Fetches recent public games (including tournament games) for any Lichess user / Grandmaster (deduplicated)
 */
export async function fetchLichessUserGames(username, max = 10, existingFingerprints = null) {
  const cleanUser = String(username).trim().replace(/^.*\/@\//i, '').split(/[/?#]/)[0];
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(cleanUser)}?max=${max}&clocks=false&evals=false&opening=true`;
  const res = await fetch(url, {
    headers: { Accept: 'application/x-chess-pgn' }
  });
  if (!res.ok) throw new Error(`No se encontraron partidas públicas del jugador "${cleanUser}".`);
  const pgnText = await res.text();
  return parseMultiGamePgn(pgnText, `Partidas de ${cleanUser}`, existingFingerprints);
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

  const currentYear = String(new Date().getFullYear());
  return {
    id: `puzzle-${data.puzzle?.id || 'daily'}`,
    championship: `Torneo Clasificatorio Lichess (ELO ${rating})`,
    year: currentYear,
    category: `🧩 Reto Táctico Diario Lichess · Año ${currentYear}`,
    title: `${w} vs. ${b} (Problema #${data.puzzle?.id || 'Hoy'})`,
    white: w,
    black: b,
    result: '*',
    description: `Encuentra la mejor combinación táctica tras la última jugada. Solución: ${solution.join(' → ')}`,
    pgn,
    isPuzzle: true,
    isNovelty: true,
    badge: `🧩 RETO OFICIAL (${currentYear})`,
    solution
  };
}

/**
 * Generates an explanatory Spanish Legend & Tactical Commentary for ANY chess move
 * (combining curated master move comments with intelligent positional/tactical analysis).
 */
export function explainChessMove(moveObj, halfMoveNumber, gameMeta = null) {
  if (!moveObj) {
    if (gameMeta?.championship || gameMeta?.year) {
      return `📜 ${gameMeta.championship || 'Torneo Oficial'} (${gameMeta.year || ''}) — ${gameMeta.description || 'Pulsa «Avanzar ▶️» para ver la explicación de cada jugada.'}`;
    }
    return '📜 Posición inicial: Pulsa «Avanzar ▶️» (o mueve una pieza) para ver la leyenda táctica de cada movimiento.';
  }

  // 1. Check if this game has a curated master commentary for this exact half-move (1-based)
  if (gameMeta?.moveComments && gameMeta.moveComments[halfMoveNumber]) {
    return `💡 ${gameMeta.moveComments[halfMoveNumber]}`;
  }

  const PIECE_NAMES_ES = {
    p: 'Peón',
    n: 'Caballo',
    b: 'Alfil',
    r: 'Torre',
    q: 'Dama',
    k: 'Rey'
  };
  const PIECE_LETTERS_ES = { p: '', n: 'C', b: 'A', r: 'T', q: 'D', k: 'R' };

  const moveNum = Math.ceil(halfMoveNumber / 2);
  const sideLabel = moveObj.color === 'w' ? 'Blancas' : 'Negras';
  const pieceName = PIECE_NAMES_ES[moveObj.piece] || 'Pieza';
  const sanEs = String(moveObj.san || '')
    .replace(/^N/, 'C')
    .replace(/^B/, 'A')
    .replace(/^R/, 'T')
    .replace(/^Q/, 'D')
    .replace(/^K/, 'R');
  const header = `Jugada ${moveNum}${moveObj.color === 'w' ? '.' : '...'} ${sanEs} (${moveObj.from}→${moveObj.to}):`;

  // 2. Checkmate or Check
  if (moveObj.san?.includes('#')) {
    return `👑 ${header} ¡JAQUE MATE! El ${pieceName} de ${sideLabel} cierra todas las casillas de escape del Rey rival y decide la partida.`;
  }
  if (moveObj.san?.includes('+')) {
    const capTxt = moveObj.captured ? ` capturando ${PIECE_NAMES_ES[moveObj.captured].toLowerCase()} en ${moveObj.to} y` : '';
    return `⚡ ${header} ¡JAQUE AL REY! El ${pieceName} entra en ${moveObj.to}${capTxt} obligando al Rey enemigo a defenderse de inmediato.`;
  }

  // 3. Castling
  if (moveObj.flags?.includes('k')) {
    return `🏰 ${header} Enroque corto de ${sideLabel}: pone al Rey bajo la protección de los peones del flanco y activa la Torre hacia las columnas centrales.`;
  }
  if (moveObj.flags?.includes('q')) {
    return `🏰 ${header} Enroque largo de ${sideLabel}: asegura al Rey en el flanco de dama y coloca la Torre directamente en la columna central d para atacar.`;
  }

  // 4. Promotion
  if (moveObj.promotion) {
    return `👑 ${header} ¡Coronación en ${moveObj.to}! El peón atraviesa todo el campo de batalla y se transforma en ${PIECE_NAMES_ES[moveObj.promotion]}.`;
  }

  // 5. Captures
  if (moveObj.captured) {
    const victimName = PIECE_NAMES_ES[moveObj.captured] || 'pieza';
    const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const diff = (VAL[moveObj.captured] || 1) - (VAL[moveObj.piece] || 1);
    if (diff >= 2) {
      return `⚔️ ${header} ¡Golpe táctico! El ${pieceName} elimina a la ${victimName} enemiga en ${moveObj.to}, ganando ventaja decisiva de material.`;
    }
    if (diff < 0) {
      return `🔥 ${header}Captura agresiva / sacrificio en ${moveObj.to}: entrega el ${pieceName} por ${victimName.toLowerCase()} para abrir líneas o destruir la estructura defensiva rival.`;
    }
    return `⚔️ ${header} Intercambio en ${moveObj.to}: el ${pieceName} captura ${victimName.toLowerCase()} para abrir columnas y disputar el control de la casilla.`;
  }

  // 6. Opening Phase (first 12 half-moves)
  const toFile = moveObj.to[0];
  const toRank = parseInt(moveObj.to[1], 10);
  const isCenterSquare = ['d4', 'e4', 'd5', 'e5', 'c4', 'c5', 'f4', 'f5'].includes(moveObj.to);

  if (halfMoveNumber <= 12) {
    if (moveObj.piece === 'p' && isCenterSquare) {
      return `♟️ ${header} Avance central de apertura: lucha por el dominio de las casillas centrales y abre diagonales para desarrollar los alfiles.`;
    }
    if (moveObj.piece === 'n') {
      return `🐎 ${header} Desarrollo activo del Caballo hacia ${moveObj.to}, controlando casillas centrales y preparando el enroque.`;
    }
    if (moveObj.piece === 'b') {
      return `🪄 ${header} Desarrollo del Alfil a la diagonal activa desde ${moveObj.to}, presionando el campo enemigo.`;
    }
  }

  // 7. Deep Attack-Line Advance into Enemy Territory
  const isDeepInvasion = (moveObj.color === 'w' && toRank >= 5) || (moveObj.color === 'b' && toRank <= 4);
  if (isDeepInvasion) {
    return `🚀 ${header} Avance de la línea de ataque: el ${pieceName} penetra en la fila ${toRank} del territorio enemigo aumentando la presión espacial.`;
  }

  if (moveObj.piece === 'r' && ['c', 'd', 'e', 'f'].includes(toFile)) {
    return `🏰 ${header} Centralización de Torre en la columna ${toFile.toUpperCase()} para dominar las líneas abiertas del tablero.`;
  }

  return `🧭 ${header} Maniobra posicional de ${pieceName} hacia ${moveObj.to} mejorando la coordinación y defensa de ${sideLabel}.`;
}

/**
 * Automatically fetches fresh chess games from YouTube Chess Channels (via RSS XML descriptions)
 * + Lichess Daily Puzzle + Live Grandmaster & Tournament games, strictly deduplicated against
 * the local & tournament databases so zero duplicates ever appear.
 */
const YOUTUBE_CHESS_CHANNELS = [
  { name: 'Agadmator Chess', channelId: 'UCL5YbN5WLFD8dLIegT5QAbA' },
  { name: 'Partidas Inmortales', channelId: 'UCXz5xX84S2rE5y0bW71iNpw' }
];

export async function autoFetchYouTubeChannelGames(existingFingerprints = new Set()) {
  const foundGames = [];
  for (const ch of YOUTUBE_CHESS_CHANNELS) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) continue;
      const data = await res.json();
      const xmlText = data?.contents || '';
      if (!xmlText.includes('<entry>')) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const entries = Array.from(doc.querySelectorAll('entry')).slice(0, 6);

      for (const entry of entries) {
        const title = entry.querySelector('title')?.textContent?.trim() || 'Partida de YouTube';
        const videoId =
          entry.getElementsByTagName('yt:videoId')[0]?.textContent?.trim() ||
          entry.querySelector('videoId')?.textContent?.trim() ||
          '';
        const desc =
          entry.getElementsByTagName('media:description')[0]?.textContent ||
          entry.querySelector('description')?.textContent ||
          '';
        if (!desc) continue;

        const cleanPgn = normalizeSpanishOrEnglishPgn(desc);
        if (cleanPgn.split(/\s+/).length < 6) continue;

        const testChess = new Chess();
        try {
          testChess.loadPgn(cleanPgn);
          if (testChess.history().length >= 4) {
            const fp = getGameFingerprint(cleanPgn);
            if (!fp || existingFingerprints.has(fp)) continue;
            foundGames.push({
              id: `yt-rss-${videoId || Date.now()}`,
              source: 'youtube_auto',
              youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
              category: `📺 Nuevo en YouTube · ${ch.name}`,
              title,
              white: 'Blancas',
              black: 'Negras',
              result: '*',
              description: `Cargada automáticamente del feed de YouTube de ${ch.name}.`,
              pgn: cleanPgn,
              fingerprint: fp,
              isNovelty: true,
              badge: '📺 NUEVO EN YOUTUBE'
            });
          }
        } catch {}
      }
    } catch {}
  }
  return deduplicateGames(foundGames, existingFingerprints);
}

/**
 * Master Auto-Discovery Feed: runs automatically on startup to gather fresh, non-duplicate games
 * from YouTube, Live Tournaments, Daily Puzzle, and Grandmasters, offering them directly on the board.
 */
export async function autoSyncNoveltiesFeed(existingDatabaseFingerprints = new Set(), onNoveltyBatch = null) {
  const seen = new Set([...existingDatabaseFingerprints]);
  const allNovelties = [];

  const pushUniqueNovelties = (candidates) => {
    const fresh = deduplicateGames(candidates, seen);
    for (const g of fresh) {
      seen.add(g.fingerprint);
      allNovelties.push({ ...g, isNovelty: true });
    }
    if (fresh.length > 0 && onNoveltyBatch) {
      onNoveltyBatch([...allNovelties]);
    }
  };

  // 1. Immediately offer curated YouTube viral games (deduplicated against Tournament DB & Saved Games)
  const tournamentOnlyFps = new Set(CURATED_TOURNAMENT_GAMES.map((g) => getGameFingerprint(g)));
  for (const fp of existingDatabaseFingerprints) {
    // Keep track of user saved games too
    if (!YOUTUBE_FEATURED_GAMES.some((yg) => getGameFingerprint(yg) === fp)) {
      tournamentOnlyFps.add(fp);
    }
  }
  const initialYt = deduplicateGames(
    YOUTUBE_FEATURED_GAMES.map((g) => ({
      ...g,
      isNovelty: true,
      badge: '📺 DESTACADO YOUTUBE'
    })),
    tournamentOnlyFps
  );
  for (const g of initialYt) {
    seen.add(g.fingerprint);
    allNovelties.push(g);
  }
  if (allNovelties.length > 0 && onNoveltyBatch) {
    onNoveltyBatch([...allNovelties]);
  }

  // 2. Auto-fetch Lichess Daily Tactical Puzzle in background
  fetchLichessDailyPuzzle()
    .then((puzzle) => {
      if (puzzle) pushUniqueNovelties([puzzle]);
    })
    .catch(() => {});

  // 3. Auto-fetch latest games from a Live Official Tournament on Lichess
  fetchLichessLiveTournaments()
    .then(async (tournaments) => {
      if (tournaments && tournaments.length > 0) {
        const topTour = tournaments[0];
        const tGames = await fetchLichessTournamentGames(topTour.id, 4, seen);
        pushUniqueNovelties(
          tGames.map((g) => ({
            ...g,
            isNovelty: true,
            badge: `🏆 TORNEO EN VIVO: ${topTour.name.slice(0, 22)}`
          }))
        );
      }
    })
    .catch(() => {});

  // 4. Auto-fetch latest games from Grandmasters (Magnus Carlsen / Hikaru)
  fetchLichessUserGames('DrNykterstein', 3, seen)
    .then((gmGames) => {
      pushUniqueNovelties(
        gmGames.map((g) => ({
          ...g,
          isNovelty: true,
          badge: '👑 NUEVA DE CARLSEN'
        }))
      );
    })
    .catch(() => {});

  // 5. Auto-fetch latest videos with PGNs from YouTube Chess Channels RSS feeds
  autoFetchYouTubeChannelGames(seen)
    .then((ytRssGames) => {
      if (ytRssGames.length > 0) pushUniqueNovelties(ytRssGames);
    })
    .catch(() => {});

  return allNovelties;
}
