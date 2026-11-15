# 💍⚔️ Battle Chess: Tierra Media × Cyber-Laser

Juego de ajedrez 3D interactivo inspirado en **Battle Chess**, fusionando los campeones medievales de **El Señor de los Anillos** (Orden de Gondor vs. Imperio de Mordor) con **espadas láser (sables de plasma cruzados y dobles)**, **caballos robots articulados con láseres oculares** y **ejecuciones/sacrificios cinemáticos al estilo Star Wars**.

## ✨ Características

- **Tablero 3D WebGL (Three.js) + Reglas Oficiales (`chess.js`):**
  - Enroque, captura al paso (*en passant*), jaque, jaque mate y coronación de peones.
  - Cámara orbital libre 360° y **Cámara de Combate Cinemática** que hace zoom automático en cada captura.
- **Facciones y Campeones:**
  - **Orden de Gondor (Blancas):** Aragorn (Mandoble láser azul *Andúril*), Galadriel (Sable doble estelar y levitación de la Fuerza), Gandalf Cyber-Maia (Pica láser y relámpagos de Anor), Rohirrim en Caballo Robot, Mecha-Bárbol (Ent Coloso) y Escudero Hobbit Jedi.
  - **Imperio de Mordor (Negras):** Darth Sauron (Mandoble cruzado y maza de plasma carmesí), Rey Brujo Inquisidor (Sable doble giratorio), Conde Saruman (Rayos Sith), Nazgûl en Corcel Cibernético, Ciber-Troll Olog-Mech y Trooper Uruk-Sith.
- **Muertes y Sacrificios Cinemáticos:**
  - **Corte / Decapitación con Sable Láser:** Anillo incandescente de cauterización de plasma y desmembramiento.
  - **Ascensión en la Fuerza:** Sacrificio heroico con espíritu holográfico ascendente.
  - **Sobrecarga Mecha:** Explosión del chasis de los caballos robots y colosos en fragmentos 3D.
- **Audio Procedural (Web Audio API):** Sonidos sintetizados en tiempo real de encendido de sable láser, zumbido Doppler, choque de plasma, disparos láser y pisadas robóticas.
- **Versión Portátil incluida (`standalone-playable.html`):** Archivo HTML autocontenido listo para abrir directamente en cualquier navegador.

## 🚀 Cómo jugar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/` en tu navegador y pulsa **«⚔️ Probar Combate»** o mueve cualquier pieza.
