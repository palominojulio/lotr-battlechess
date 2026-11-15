# ⚔️🤖 Cyber-Medieval Battle Chess: Alianza Solar vs. Legión de Antracita

Juego de ajedrez 3D interactivo inspirado en el clásico **Battle Chess**, con estética original **Cyber-Medieval** (**100% libre de derechos de autor y marcas comerciales**), enfrentando a la **Alianza Solar** contra la **Legión de Antracita** con **mandobles de plasma**, **caballos robots articulados con láseres oculares**, **multijugador online P2P**, **chat en vivo** y **planilla de nomenclatura algebraica**.

## ✨ Características

- **Tablero 3D WebGL (Three.js) + Reglas Oficiales (`chess.js`):**
  - Enroque, captura al paso (*en passant*), jaque, jaque mate y coronación de peones.
  - Cámara orbital libre 360° y **Cámara de Combate Cinemática** que hace zoom automático en cada captura.
  - **Planilla Oficial de Movimientos (SAN / PGN):** Registro en tiempo real de todas las jugadas (`1. e4 e5`, `2. Cf3 Cc6`) con exportación a portapapeles.
- **Multijugador Online P2P + Chat en Vivo (`PeerJS`):**
  - Salas instantáneas e invitaciones por WhatsApp con un clic, más chat integrado con frases rápidas.
- **Facciones y Campeones Originales (100% Copyright-Free):**
  - **Alianza Solar (Blancas):** Rey Valerius (Mandoble de plasma azul *Nova*), Reina Astral Lyra (Lanza doble estelar y telequinesis), Sabio Arcano Orion (Pica de fotones y relámpagos astrales), Paladín en Caballo Robot, Coloso Guardián Atlas y Centinela Escudero.
  - **Legión de Antracita (Negras):** Emperador Malakor (Mandoble cruzado y maza de plasma carmesí), Soberana Nocturna Vex (Guadaña doble giratoria), Brujo del Vacío (Rayos voltaicos), Espectro en Corcel Cibernético, Ciber-Ogro Acorazado y Guerrero Orco Blindado.
- **Música de Dominio Público y Audio Procedural (Web Audio API):**
  - Fanfarrias sinfónicas **100% de Dominio Público** sintetizadas en tiempo real: *Marte, el Portador de la Guerra* (Gustav Holst, 1914), *Así habló Zaratustra* (Richard Strauss, 1896) y *Cabalgata de las Valquirias* (Richard Wagner, 1856).
  - Efectos de sonido sintetizados: pitido de droide en jugadas blancas, gruñido de orco en jugadas negras, encendido de hojas de plasma, zumbido Doppler, choque eléctrico de espadas láser y tajo final.

## 🚀 Cómo jugar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/` en tu navegador y pulsa **«⚔️ Probar Combate»** o mueve cualquier pieza.
