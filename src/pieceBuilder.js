import * as THREE from 'three';
import { getPieceLore } from './lotrLore.js';

/**
 * Helper to create a glowing medieval crossguard lightsaber / laser weapon
 */
function createLightsaber({
  saberColor = 0x00e5ff,
  bladeLength = 1.15,
  bladeRadius = 0.036,
  hasCrossguard = true,
  isDoubleBladed = false,
  isLance = false,
  isHammer = false
}) {
  const weaponGroup = new THREE.Group();

  const hiltMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.25
  });
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });
  const auraMat = new THREE.MeshBasicMaterial({
    color: saberColor,
    transparent: true,
    opacity: 0.58
  });

  // Hilt handle
  const hiltLen = isLance ? 0.95 : isHammer ? 1.1 : 0.32;
  const hiltGeo = new THREE.CylinderGeometry(0.038, 0.042, hiltLen, 10);
  const hilt = new THREE.Mesh(hiltGeo, hiltMat);
  weaponGroup.add(hilt);

  // Pommel
  const pommelGeo = new THREE.SphereGeometry(0.06, 10, 10);
  const pommel = new THREE.Mesh(pommelGeo, goldMat);
  pommel.position.y = -hiltLen / 2;
  weaponGroup.add(pommel);

  const bladeGroup = new THREE.Group();
  bladeGroup.position.y = hiltLen / 2;
  weaponGroup.add(bladeGroup);

  if (isHammer) {
    // Cyber-Plasma Warhammer / Sauron Mace head
    const headGeo = new THREE.BoxGeometry(0.46, 0.28, 0.28);
    const headMesh = new THREE.Mesh(headGeo, hiltMat);
    headMesh.position.y = 0.14;
    bladeGroup.add(headMesh);

    const faceGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.52, 8);
    faceGeo.rotateZ(Math.PI / 2);
    const faceCore = new THREE.Mesh(faceGeo, coreMat);
    faceCore.position.y = 0.14;
    bladeGroup.add(faceCore);

    const auraGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.56, 8);
    auraGeo.rotateZ(Math.PI / 2);
    const faceAura = new THREE.Mesh(auraGeo, auraMat);
    faceAura.position.y = 0.14;
    bladeGroup.add(faceAura);
  } else {
    // Primary plasma blade core
    const coreGeo = new THREE.CylinderGeometry(bladeRadius * 0.45, bladeRadius * 0.65, bladeLength, 10);
    coreGeo.translate(0, bladeLength / 2, 0);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    bladeGroup.add(coreMesh);

    // Outer plasma glow sheath
    const auraGeo = new THREE.CylinderGeometry(bladeRadius * 1.35, bladeRadius * 1.6, bladeLength * 1.03, 12);
    auraGeo.translate(0, bladeLength / 2, 0);
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    bladeGroup.add(auraMesh);

    // Medieval Crossguard Plasma Quillons
    if (hasCrossguard) {
      const guardMetalGeo = new THREE.BoxGeometry(0.28, 0.05, 0.06);
      const guardMetal = new THREE.Mesh(guardMetalGeo, goldMat);
      bladeGroup.add(guardMetal);

      const ventCoreGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.38, 8);
      ventCoreGeo.rotateZ(Math.PI / 2);
      const ventCore = new THREE.Mesh(ventCoreGeo, coreMat);
      bladeGroup.add(ventCore);

      const ventAuraGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.42, 8);
      ventAuraGeo.rotateZ(Math.PI / 2);
      const ventAura = new THREE.Mesh(ventAuraGeo, auraMat);
      bladeGroup.add(ventAura);
    }

    if (isDoubleBladed) {
      const bottomCore = coreMesh.clone();
      bottomCore.rotation.z = Math.PI;
      bottomCore.position.y = -hiltLen;
      bladeGroup.add(bottomCore);

      const bottomAura = auraMesh.clone();
      bottomAura.rotation.z = Math.PI;
      bottomAura.position.y = -hiltLen;
      bladeGroup.add(bottomAura);
    }
  }

  weaponGroup.userData.bladeGroup = bladeGroup;
  return weaponGroup;
}

/**
 * Builds a prominent Medieval Heraldic Heater Shield ("Escudito") for Pawns
 * with Gondor White Tree / Star emblem or Mordor Flaming Eye emblem
 */
function createPawnShield(isWhite, saberColor, scanners = []) {
  const shieldGroup = new THREE.Group();

  // Classic medieval heater shield silhouette
  const shape = new THREE.Shape();
  shape.moveTo(-0.24, 0.26);
  shape.lineTo(0.24, 0.26);
  shape.lineTo(0.24, -0.02);
  shape.quadraticCurveTo(0.22, -0.24, 0, -0.38);
  shape.quadraticCurveTo(-0.22, -0.24, -0.24, -0.02);
  shape.closePath();

  const extrudeSettings = {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02
  };

  const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const shieldPlateMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x1e3a8a : 0x262930,
    emissive: isWhite ? 0x0f172a : 0x14171d,
    metalness: 0.6,
    roughness: 0.28
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldPlateMat);
  shieldMesh.castShadow = true;
  shieldGroup.add(shieldMesh);

  // Bright Metallic Heraldic Rim (Gold for Gondor, Molten Orange-Gold for Mordor)
  const rimEdgeGeo = new THREE.EdgesGeometry(shieldGeo);
  const rimMat = new THREE.LineBasicMaterial({
    color: isWhite ? 0xfacc15 : 0xff6600
  });
  const rimLines = new THREE.LineSegments(rimEdgeGeo, rimMat);
  shieldGroup.add(rimLines);

  // Center Heraldic Boss + Glowing Faction Emblem on Front Face
  const emblemMat = new THREE.MeshBasicMaterial({
    color: isWhite ? 0xe0f2fe : 0xffaa00
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: saberColor
  });

  if (isWhite) {
    // Gondor Emblem on both front and back of shield: White Tree + Star of Eärendil
    [0.065, -0.025].forEach((zPos) => {
      const starBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), emblemMat);
      starBoss.position.set(0, 0.02, zPos);
      shieldGroup.add(starBoss);

      const verticalBar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.03), glowMat);
      verticalBar.position.set(0, -0.02, zPos);
      shieldGroup.add(verticalBar);

      const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.03), glowMat);
      crossBar.position.set(0, 0.04, zPos);
      shieldGroup.add(crossBar);
    });
  } else {
    // Mordor Emblem on both front and back of shield: Blazing Eye of Sauron with scanning pupil
    [0.06, -0.025].forEach((zPos) => {
      const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 20), emblemMat);
      eyeRing.position.set(0, 0.0, zPos);
      shieldGroup.add(eyeRing);

      const slitPupil = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.04), glowMat);
      slitPupil.position.set(0, 0.0, zPos + (zPos > 0 ? 0.005 : -0.005));
      shieldGroup.add(slitPupil);
      scanners.push({ mesh: slitPupil, range: 0.065, speed: 1.25 });
    });
  }

  return shieldGroup;
}

/**
 * Helper to create a Cyber Visor that keeps the full glowing background visor line
 * while a bright white-hot scanner point oscillates back and forth across it.
 */
function createScannerVisor(width, height, depth, saberColor, scanners) {
  const visorGroup = new THREE.Group();

  // Continuous glowing background visor line (always visible across the full visor)
  const bgLineMat = new THREE.MeshBasicMaterial({
    color: saberColor
  });
  const bgLineMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bgLineMat);
  visorGroup.add(bgLineMesh);

  // Subtle inner bright strip along the visor line
  const innerLineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35
  });
  const innerLineMesh = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, height * 0.35, depth * 1.02),
    innerLineMat
  );
  visorGroup.add(innerLineMesh);

  // Bright oscillating Cylon/Cyber scanner hotspot riding on top of the background line
  const eyeGroup = new THREE.Group();
  const coreMesh = new THREE.Mesh(
    new THREE.SphereGeometry(height * 0.72, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const glowMesh = new THREE.Mesh(
    new THREE.SphereGeometry(height * 1.35, 12, 12),
    new THREE.MeshBasicMaterial({ color: saberColor, transparent: true, opacity: 0.9 })
  );
  eyeGroup.add(coreMesh, glowMesh);
  eyeGroup.position.z = depth * 0.55;
  visorGroup.add(eyeGroup);

  scanners.push({
    mesh: eyeGroup,
    range: width * 0.38,
    speed: 1.4
  });

  return visorGroup;
}

/**
 * Builds a tiered Cyber-Medieval Cape / Royal Mantle for Bishops ('b'), Queens ('q'), and Kings ('k')
 * scaled and ornamented according to their hierarchical status.
 */
function createStatusCape(type, isWhite, saberColor, hScale) {
  const capeGroup = new THREE.Group();
  // Position at shoulder height on the back (-Z in local space)
  capeGroup.position.set(0, 0.52 * hScale, -0.14 * hScale);

  // Status hierarchy dimensions:
  // 'b' (Bishop): Arcane Cloak (medium width & length)
  // 'q' (Queen): Royal Flowing Mantle + High Collar (wider, floor-length, elegant flare)
  // 'k' (King): Grand Sovereign Imperial Cape + Pauldron Clasps + Crown Mantle (widest, longest, double-trimmed)
  const tierConfig = {
    b: {
      topW: 0.28 * hScale,
      botW: 0.44 * hScale,
      len: 0.78 * hScale,
      curveDepth: 0.14,
      hasHighCollar: false,
      hasRoyalClasps: false,
      capeColor: isWhite ? 0x1e3a8a : 0x232730,
      trimColor: isWhite ? 0x38bdf8 : 0xc084fc
    },
    q: {
      topW: 0.34 * hScale,
      botW: 0.62 * hScale,
      len: 0.96 * hScale,
      curveDepth: 0.22,
      hasHighCollar: true,
      hasRoyalClasps: true,
      capeColor: isWhite ? 0x1d4ed8 : 0x1f232b,
      trimColor: isWhite ? 0xfde047 : 0xff2244
    },
    k: {
      topW: 0.42 * hScale,
      botW: 0.76 * hScale,
      len: 1.06 * hScale,
      curveDepth: 0.26,
      hasHighCollar: true,
      hasRoyalClasps: true,
      capeColor: isWhite ? 0x172554 : 0x1a1d24,
      trimColor: isWhite ? 0xfacc15 : 0xff5500
    }
  }[type];

  if (!tierConfig) return capeGroup;

  // Build trapezoidal flared cape silhouette
  const shape = new THREE.Shape();
  shape.moveTo(-tierConfig.topW / 2, 0);
  shape.lineTo(tierConfig.topW / 2, 0);
  shape.quadraticCurveTo(
    tierConfig.botW * 0.54,
    -tierConfig.len * 0.55,
    tierConfig.botW / 2,
    -tierConfig.len
  );
  // Scalloped / rounded royal bottom hem
  shape.quadraticCurveTo(0, -tierConfig.len * 1.08, -tierConfig.botW / 2, -tierConfig.len);
  shape.quadraticCurveTo(
    -tierConfig.botW * 0.54,
    -tierConfig.len * 0.55,
    -tierConfig.topW / 2,
    0
  );
  shape.closePath();

  const capeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008
  });

  const capeMat = new THREE.MeshStandardMaterial({
    color: tierConfig.capeColor,
    emissive: isWhite ? 0x0a192f : 0x2a050d,
    roughness: 0.4,
    metalness: 0.35,
    side: THREE.DoubleSide
  });

  const capeMesh = new THREE.Mesh(capeGeo, capeMat);
  // Tilt backward so it drapes gracefully behind the lower skirt
  capeMesh.rotation.x = 0.24;
  capeMesh.castShadow = true;
  capeGroup.add(capeMesh);

  // Glowing Heraldic Trim Border around the entire cape
  const borderEdges = new THREE.EdgesGeometry(capeGeo);
  const borderMat = new THREE.LineBasicMaterial({
    color: tierConfig.trimColor
  });
  const borderLines = new THREE.LineSegments(borderEdges, borderMat);
  capeMesh.add(borderLines);

  // For King ('k'): Add an inner royal gold/crimson mantle layer & central glowing plasma spine
  if (type === 'k') {
    const innerMantleGeo = new THREE.BoxGeometry(tierConfig.topW * 1.05, 0.22 * hScale, 0.05);
    const innerMantleMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xfacc15 : 0xb91c1c,
      metalness: 0.8,
      roughness: 0.25
    });
    const innerMantle = new THREE.Mesh(innerMantleGeo, innerMantleMat);
    innerMantle.position.set(0, -0.08 * hScale, -0.02);
    capeMesh.add(innerMantle);

    const centerStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, tierConfig.len * 0.9, 0.036),
      new THREE.MeshBasicMaterial({ color: saberColor })
    );
    centerStrip.position.set(0, -tierConfig.len * 0.48, 0.015);
    capeMesh.add(centerStrip);
  }

  // High Royal / Arcane Collar for Queen & King
  if (tierConfig.hasHighCollar) {
    const collarGeo = new THREE.CylinderGeometry(
      0.23 * hScale,
      0.20 * hScale,
      type === 'k' ? 0.20 * hScale : 0.16 * hScale,
      16,
      1,
      true,
      Math.PI * 0.55,
      Math.PI * 0.9
    );
    const collarMat = new THREE.MeshStandardMaterial({
      color: tierConfig.trimColor,
      metalness: 0.85,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 0.08 * hScale, 0.10 * hScale);
    capeGroup.add(collar);
  }

  // Twin Glowing Shoulder Clasps / Royal Brooches for Queen & King (single central clasp for Bishop)
  const claspMat = new THREE.MeshBasicMaterial({ color: tierConfig.trimColor });
  if (tierConfig.hasRoyalClasps) {
    [-tierConfig.topW * 0.42, tierConfig.topW * 0.42].forEach((cx) => {
      const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.065 * hScale, 0), claspMat);
      brooch.position.set(cx, 0.02, 0.12 * hScale);
      capeGroup.add(brooch);
    });
  } else {
    const bishopBrooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 * hScale, 0), claspMat);
    bishopBrooch.position.set(0, 0.02, 0.16 * hScale);
    capeGroup.add(bishopBrooch);
  }

  return capeGroup;
}

/**
 * Builds an anatomical, sculpted Bionic Cyber-Horse (Caballo Robot) for Knights (n)
 * featuring a rounded chest/barrel/croup, visible muscular thighs, hydraulic knees,
 * and a long, flowing natural-shaped cybernetic fiber-optic tail.
 */
function buildRobotHorse(isWhite, saberColor, scanners = []) {
  const mountGroup = new THREE.Group();

  const chassisMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xdbeafe : 0x282c34,
    emissive: isWhite ? 0x091526 : 0x161920,
    metalness: 0.55,
    roughness: 0.3
  });
  const muscleMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x94a3b8 : 0x3b404c,
    emissive: isWhite ? 0x000000 : 0x1c2029,
    metalness: 0.6,
    roughness: 0.28
  });
  const neonMat = new THREE.MeshBasicMaterial({
    color: saberColor
  });

  // 1. Sculpted Organic-Bionic Equine Torso (Chest + Tapered Barrel + Rounded Croup/Haunches)
  // Muscular Front Chest (Pecho)
  const chestGeo = new THREE.SphereGeometry(0.24, 16, 14);
  chestGeo.scale(1.05, 0.95, 1.15);
  const chestMesh = new THREE.Mesh(chestGeo, chassisMat);
  chestMesh.position.set(0, 0.56, 0.26);
  chestMesh.castShadow = true;
  mountGroup.add(chestMesh);

  // Tapered Ribcage / Barrel (Tronco cilíndrico estilizado, no cuadrado)
  const barrelGeo = new THREE.CylinderGeometry(0.21, 0.19, 0.54, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, chassisMat);
  barrelMesh.position.set(0, 0.55, 0.0);
  barrelMesh.castShadow = true;
  mountGroup.add(barrelMesh);

  // Sculpted Rear Croup / Haunches (Grupa / Ancas redondeadas)
  const croupGeo = new THREE.SphereGeometry(0.23, 16, 14);
  croupGeo.scale(1.04, 0.92, 1.12);
  const croupMesh = new THREE.Mesh(croupGeo, chassisMat);
  croupMesh.position.set(0, 0.57, -0.27);
  croupMesh.castShadow = true;
  mountGroup.add(croupMesh);

  // Curved Neon Energy Ribs wrapping the rounded barrel
  for (let z = -0.16; z <= 0.16; z += 0.16) {
    const ribArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.212, 0.018, 8, 20, Math.PI * 1.2),
      neonMat
    );
    ribArc.position.set(0, 0.55, z);
    ribArc.rotation.z = -Math.PI * 0.1;
    mountGroup.add(ribArc);
  }

  // 2. Four Articulated Equine Legs with Prominent Muscular Thighs (Muslos visibles)
  const legs = [];
  const legConfigs = [
    { x: -0.21, y: 0.52, z: 0.28, isHind: false },
    { x: 0.21, y: 0.52, z: 0.28, isHind: false },
    { x: -0.22, y: 0.54, z: -0.28, isHind: true },
    { x: 0.22, y: 0.54, z: -0.28, isHind: true }
  ];

  legConfigs.forEach(({ x, y, z, isHind }) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(x, y, z);

    // Prominent Upper Muscular Thigh / Haunch (Muslo / Anca biónica)
    const thighRadiusTop = isHind ? 0.125 : 0.105;
    const thighGeo = new THREE.CylinderGeometry(thighRadiusTop, 0.055, 0.26, 12);
    const thighMesh = new THREE.Mesh(thighGeo, muscleMat);
    thighMesh.position.set(0, -0.11, isHind ? -0.03 : 0.02);
    thighMesh.rotation.x = isHind ? 0.28 : -0.18;
    thighMesh.castShadow = true;
    legPivot.add(thighMesh);

    // Sculpted Hip/Thigh Armor Plate on outer flank
    const hipBall = new THREE.Mesh(
      new THREE.SphereGeometry(thighRadiusTop * 0.95, 12, 10),
      chassisMat
    );
    hipBall.scale.set(0.75, 1.15, 1.1);
    hipBall.position.set(x > 0 ? 0.03 : -0.03, -0.04, 0);
    legPivot.add(hipBall);

    // Glowing Cybernetic Knee / Hock Joint
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 10), neonMat);
    kneeJoint.position.set(0, -0.24, isHind ? -0.06 : 0.04);
    legPivot.add(kneeJoint);

    // Tapered Lower Cannon Bone (Caña inferior)
    const lowerLegGeo = new THREE.CylinderGeometry(0.05, 0.038, 0.24, 10);
    const lowerLeg = new THREE.Mesh(lowerLegGeo, chassisMat);
    lowerLeg.position.set(0, -0.36, isHind ? -0.02 : 0.01);
    lowerLeg.rotation.x = isHind ? -0.18 : 0.1;
    legPivot.add(lowerLeg);

    // Armored Cyber-Hoof (Casco con borde de plasma)
    const hoofGeo = new THREE.CylinderGeometry(0.048, 0.072, 0.07, 10);
    const hoof = new THREE.Mesh(hoofGeo, muscleMat);
    hoof.position.set(0, -0.48, isHind ? 0.01 : 0.03);
    legPivot.add(hoof);

    mountGroup.add(legPivot);
    legs.push(legPivot);
  });

  // 3. Sculpted Arched Equine Neck & Tapered Cyber Head
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.64, 0.32);
  neckGroup.rotation.x = -0.38;

  const neckGeo = new THREE.CylinderGeometry(0.11, 0.16, 0.44, 14);
  const neckMesh = new THREE.Mesh(neckGeo, chassisMat);
  neckMesh.position.y = 0.18;
  neckGroup.add(neckMesh);

  // Curved Cyber Mane (Crin de plasma segmentada)
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 6), neonMat);
    fin.rotation.x = -Math.PI * 0.35;
    fin.position.set(0, 0.08 + i * 0.09, -0.12);
    neckGroup.add(fin);
  }

  // Tapered Equine Head & Snout (Cabeza equina estilizada, no cuadrada)
  const skullMesh = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), chassisMat);
  skullMesh.position.set(0, 0.38, 0.04);
  neckGroup.add(skullMesh);

  const snoutGeo = new THREE.CylinderGeometry(0.075, 0.12, 0.34, 12);
  snoutGeo.rotateX(Math.PI / 2.2);
  const snoutMesh = new THREE.Mesh(snoutGeo, chassisMat);
  snoutMesh.position.set(0, 0.35, 0.18);
  neckGroup.add(snoutMesh);

  // Pointed Cyber Ears
  [-0.08, 0.08].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), muscleMat);
    ear.position.set(ex, 0.5, -0.02);
    ear.rotation.x = 0.25;
    neckGroup.add(ear);
  });

  const visorMesh = createScannerVisor(0.24, 0.055, 0.14, saberColor, scanners);
  visorMesh.position.set(0, 0.4, 0.16);
  neckGroup.add(visorMesh);

  mountGroup.add(neckGroup);

  // 4. Long, Flowing Natural-Shaped Cybernetic Tail (Cola alargada natural pero ciber)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.62, -0.44);

  // Flowing S-curve of overlapping bionic & neon fiber-optic tail segments
  const tailPoints = [
    { y: 0.02, z: -0.05, r: 0.068, rotX: 0.6 },
    { y: -0.04, z: -0.13, r: 0.078, rotX: 0.35 },
    { y: -0.13, z: -0.20, r: 0.082, rotX: 0.15 },
    { y: -0.24, z: -0.24, r: 0.072, rotX: 0.05 },
    { y: -0.35, z: -0.26, r: 0.055, rotX: -0.08 },
    { y: -0.45, z: -0.25, r: 0.032, rotX: -0.2 }
  ];

  tailPoints.forEach((pt, i) => {
    const segGeo = new THREE.CylinderGeometry(pt.r * 0.85, pt.r, 0.14, 10);
    const segMat = i % 2 === 0 ? muscleMat : neonMat;
    const seg = new THREE.Mesh(segGeo, segMat);
    seg.position.set(0, pt.y, pt.z);
    seg.rotation.x = pt.rotX;
    tailGroup.add(seg);
  });

  // Glowing Fiber-Optic Plume Strands along the flowing tail
  [-0.04, 0, 0.04].forEach((tx, idx) => {
    const strandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(tx * 0.4, 0.03, -0.02),
      new THREE.Vector3(tx, -0.08, -0.18),
      new THREE.Vector3(tx * 1.1, -0.26, -0.27),
      new THREE.Vector3(tx * 0.5, -0.48, -0.25)
    ]);
    const tubeGeo = new THREE.TubeGeometry(strandCurve, 14, idx === 1 ? 0.022 : 0.016, 8, false);
    const strand = new THREE.Mesh(tubeGeo, neonMat);
    tailGroup.add(strand);
  });

  mountGroup.add(tailGroup);

  mountGroup.userData = { legs, neckGroup, visorMesh, tailGroup };
  return mountGroup;
}

/**
 * Builds a complete 3D LOTR x Star Wars Cyber-Medieval chess piece
 */
export function createLOTRPieceMesh(type, color) {
  const lore = getPieceLore(color, type);
  const isWhite = color === 'w';
  const saberColor = lore.saberColor || (isWhite ? 0x00e5ff : 0xff0033);

  const root = new THREE.Group();
  root.userData = {
    type,
    color,
    lore
  };

  // High-Contrast Faction Materials: Gondor Pearl-White vs. Mordor Anthracite Black (Negro Antracita)
  const baseMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xe2e8f0 : 0x1f232a,
    emissive: isWhite ? 0x0f172a : 0x12151a,
    metalness: 0.55,
    roughness: 0.3
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: isWhite ? 0x38bdf8 : 0xff5500
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: lore.primaryColor,
    emissive: isWhite ? 0x091526 : 0x181c24,
    metalness: 0.52,
    roughness: 0.3
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: lore.accentColor,
    emissive: isWhite ? 0x1a1200 : 0x3d1400,
    metalness: 0.7,
    roughness: 0.25
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xfde68a : 0x363b47,
    emissive: isWhite ? 0x000000 : 0x161920,
    roughness: 0.38
  });

  // 1. Pedestal Base with High-Contrast Glowing Faction Rings
  const pedGeo = new THREE.CylinderGeometry(0.58, 0.68, 0.18, 24);
  const pedestal = new THREE.Mesh(pedGeo, baseMat);
  pedestal.position.y = 0.09;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  const neonRingGeo = new THREE.TorusGeometry(0.61, 0.036, 10, 32);
  neonRingGeo.rotateX(Math.PI / 2);
  const neonRing = new THREE.Mesh(neonRingGeo, ringMat);
  neonRing.position.y = 0.17;
  root.add(neonRing);

  // 2. Articulated Body Hierarchy (allows decapitation / waist-slice / Force levitation)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.18;
  root.add(bodyGroup);

  const lowerBody = new THREE.Group();
  bodyGroup.add(lowerBody);

  const upperBody = new THREE.Group();
  bodyGroup.add(upperBody);

  // Molten plasma cauterization ring (hidden until sliced by a lightsaber!)
  const sliceRingGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.05, 20);
  const sliceRingMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0
  });
  const sliceRing = new THREE.Mesh(sliceRingGeo, sliceRingMat);
  sliceRing.position.y = 0.75;
  bodyGroup.add(sliceRing);

  // Scale height by piece role
  const scaleMap = {
    p: 0.85,
    n: 1.0,
    b: 1.08,
    r: 1.22,
    q: 1.18,
    k: 1.28
  };
  const hScale = scaleMap[type] || 1.0;

  let mountGroup = null;
  let capeGroup = null;
  let rightArm = new THREE.Group();
  let leftArm = new THREE.Group();
  let headGroup = new THREE.Group();
  const scanners = [];

  if (type === 'n') {
    // KNIGHT: Robotic Cyber-Horse + Medieval Rider with Laser Lance
    mountGroup = buildRobotHorse(isWhite, saberColor, scanners);
    lowerBody.add(mountGroup);

    upperBody.position.set(0, 0.72, -0.05);

    const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.48, 12), armorMat);
    riderTorso.position.y = 0.24;
    riderTorso.castShadow = true;
    upperBody.add(riderTorso);

    headGroup.position.set(0, 0.58, 0);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), armorMat);
    headGroup.add(helm);
    const visor = createScannerVisor(0.24, 0.06, 0.16, saberColor, scanners);
    visor.position.set(0, 0.02, 0.11);
    headGroup.add(visor);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 6), trimMat);
    crest.position.set(0, 0.22, -0.04);
    headGroup.add(crest);
    upperBody.add(headGroup);

    rightArm.position.set(0.26, 0.36, 0.05);
    const lance = createLightsaber({
      saberColor,
      bladeLength: 1.35,
      bladeRadius: 0.038,
      hasCrossguard: true,
      isLance: true
    });
    lance.rotation.x = Math.PI / 3;
    rightArm.add(lance);
    upperBody.add(rightArm);

    leftArm.position.set(-0.26, 0.32, 0.08);
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), trimMat);
    shield.rotation.z = Math.PI / 2;
    leftArm.add(shield);
    upperBody.add(leftArm);
  } else if (type === 'r') {
    // ROOK: Mecha-Ent (White) or Cyber-Troll Olog-Mech (Black)
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.24), armorMat);
    legL.position.set(-0.18, 0.28, 0);
    const legR = legL.clone();
    legR.position.x = 0.18;
    lowerBody.add(legL, legR);

    upperBody.position.y = 0.55;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.65, 0.44), armorMat);
    chest.position.y = 0.32;
    chest.castShadow = true;
    upperBody.add(chest);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.46, 16), ringMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.35, 0);
    upperBody.add(core);

    const pauldronGeo = new THREE.BoxGeometry(0.24, 0.22, 0.34);
    const pL = new THREE.Mesh(pauldronGeo, trimMat);
    pL.position.set(-0.42, 0.56, 0);
    const pR = pL.clone();
    pR.position.x = 0.42;
    upperBody.add(pL, pR);

    headGroup.position.set(0, 0.78, 0);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.32), armorMat);
    headGroup.add(headMesh);
    const eyeVisor = createScannerVisor(0.3, 0.075, 0.18, saberColor, scanners);
    eyeVisor.position.set(0, 0.04, 0.12);
    headGroup.add(eyeVisor);
    upperBody.add(headGroup);

    rightArm.position.set(0.46, 0.48, 0);
    const hammer = createLightsaber({
      saberColor,
      isHammer: true
    });
    hammer.rotation.x = Math.PI / 6;
    rightArm.add(hammer);
    upperBody.add(rightArm);

    leftArm.position.set(-0.46, 0.48, 0);
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.2), trimMat);
    claw.position.y = -0.15;
    leftArm.add(claw);
    upperBody.add(leftArm);
  } else {
    // HUMANOID CHAMPIONS: Pawns (Hobbit/Uruk), Bishops (Gandalf/Saruman), Queens (Galadriel/Witch-king), Kings (Aragorn/Sauron)
    const lowerSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26 * hScale, 0.38 * hScale, 0.62 * hScale, 16),
      armorMat
    );
    lowerSkirt.position.y = 0.31 * hScale;
    lowerSkirt.castShadow = true;
    lowerBody.add(lowerSkirt);

    upperBody.position.y = 0.62 * hScale;

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 * hScale, 0.24 * hScale, 0.54 * hScale, 16),
      armorMat
    );
    torso.position.y = 0.27 * hScale;
    torso.castShadow = true;
    upperBody.add(torso);

    // Chest armor plate
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.36 * hScale, 0.34 * hScale, 0.26 * hScale),
      trimMat
    );
    chestPlate.position.set(0, 0.32 * hScale, 0.04);
    upperBody.add(chestPlate);

    // Head Group
    headGroup.position.set(0, 0.68 * hScale, 0);
    const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18 * hScale, 16, 16), skinMat);
    headGroup.add(headSphere);

    // Oscillating Cyber/Jedi/Sith Scanner Eyes
    const visor = createScannerVisor(0.24 * hScale, 0.055 * hScale, 0.16 * hScale, saberColor, scanners);
    visor.position.set(0, 0.03 * hScale, 0.12 * hScale);
    headGroup.add(visor);

    // Role-specific headgear
    if (type === 'k') {
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22 * hScale, 0.17 * hScale, 0.24 * hScale, 8, 1, true),
        trimMat
      );
      crown.position.y = 0.18 * hScale;
      headGroup.add(crown);

      if (!isWhite) {
        const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), ringMat);
        eye.position.y = 0.42 * hScale;
        headGroup.add(eye);
        scanners.push({ mesh: eye, range: 0.12, speed: 1.15 });
      }
    } else if (type === 'q') {
      const diadem = new THREE.Mesh(new THREE.TorusGeometry(0.2 * hScale, 0.03, 8, 20), trimMat);
      diadem.rotation.x = Math.PI / 2;
      diadem.position.y = 0.15 * hScale;
      headGroup.add(diadem);
    } else if (type === 'b') {
      // Bishop Cone Hat + Circular Brim Ring ("el círculo del cono") + Glowing Top Finial Sphere ("el punto arriba")
      const hatCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.24 * hScale, 0.46 * hScale, 16),
        armorMat
      );
      hatCone.position.y = 0.28 * hScale;
      headGroup.add(hatCone);

      // Glowing Circle / Brim Ring around the base of the cone ("el círculo del cono")
      const coneCircleMat = new THREE.MeshBasicMaterial({
        color: isWhite ? 0xfacc15 : 0xff5500
      });
      const coneBrimDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32 * hScale, 0.32 * hScale, 0.035, 24),
        trimMat
      );
      coneBrimDisc.position.y = 0.08 * hScale;
      headGroup.add(coneBrimDisc);

      const coneCircleRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.32 * hScale, 0.028, 10, 28),
        coneCircleMat
      );
      coneCircleRing.rotation.x = Math.PI / 2;
      coneCircleRing.position.y = 0.09 * hScale;
      headGroup.add(coneCircleRing);

      // Glowing Top Finial Sphere at the tip of the cone ("un punto arriba que lo identifique")
      const topDotCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.075 * hScale, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      topDotCore.position.y = 0.53 * hScale;
      headGroup.add(topDotCore);

      const topDotAura = new THREE.Mesh(
        new THREE.SphereGeometry(0.11 * hScale, 14, 14),
        new THREE.MeshBasicMaterial({
          color: isWhite ? 0x38bdf8 : saberColor,
          transparent: true,
          opacity: 0.85
        })
      );
      topDotAura.position.y = 0.53 * hScale;
      headGroup.add(topDotAura);
    } else if (type === 'p') {
      // Curved Roman Centurion / Legionary Plume Crest (Cresta Romana curva en abanico)
      const crestGroup = new THREE.Group();
      crestGroup.position.set(0, 0.06 * hScale, -0.02 * hScale);

      // Metallic crest spine (support arch above helmet)
      const spineGeo = new THREE.TorusGeometry(0.16 * hScale, 0.025, 8, 20, Math.PI * 1.15);
      spineGeo.rotateY(Math.PI / 2);
      spineGeo.rotateX(-Math.PI * 0.08);
      const spineMesh = new THREE.Mesh(spineGeo, trimMat);
      crestGroup.add(spineMesh);

      // Sweeping curved Roman horsehair plume fan (extruded curved sector)
      const plumeShape = new THREE.Shape();
      const innerR = 0.16 * hScale;
      const outerR = 0.34 * hScale;
      const startAngle = -0.15;
      const endAngle = Math.PI + 0.25;
      plumeShape.absarc(0, 0, outerR, startAngle, endAngle, false);
      plumeShape.absarc(0, 0, innerR, endAngle, startAngle, true);
      plumeShape.closePath();

      const plumeGeo = new THREE.ExtrudeGeometry(plumeShape, {
        depth: 0.065,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.012,
        bevelThickness: 0.012
      });
      plumeGeo.center();
      plumeGeo.rotateY(Math.PI / 2);

      const plumeMat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0xfacc15 : 0xff3b00,
        emissive: isWhite ? 0x3b2f00 : 0x661100,
        roughness: 0.35,
        metalness: 0.3
      });
      const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
      plumeMesh.position.set(0, 0.14 * hScale, 0);
      crestGroup.add(plumeMesh);

      // Glowing outer neon plasma arc along the top edge of the Roman crest
      const rimArcGeo = new THREE.TorusGeometry(outerR + 0.01, 0.018, 8, 24, Math.PI * 1.15);
      rimArcGeo.rotateY(Math.PI / 2);
      rimArcGeo.rotateX(-Math.PI * 0.08);
      const rimArcMat = new THREE.MeshBasicMaterial({
        color: isWhite ? 0x38bdf8 : 0xffaa00
      });
      const rimArc = new THREE.Mesh(rimArcGeo, rimArcMat);
      crestGroup.add(rimArc);

      headGroup.add(crestGroup);
    }

    upperBody.add(headGroup);

    // Attach Hierarchical Status Cape for Bishops ('b'), Queens ('q'), and Kings ('k')
    if (type === 'b' || type === 'q' || type === 'k') {
      capeGroup = createStatusCape(type, isWhite, saberColor, hScale);
      upperBody.add(capeGroup);
    }

    // Right Arm + Lightsaber Weapon
    rightArm.position.set(0.32 * hScale, 0.42 * hScale, 0);
    const saber = createLightsaber({
      saberColor,
      bladeLength: type === 'p' ? 0.85 : 1.22,
      bladeRadius: type === 'k' ? 0.044 : 0.034,
      hasCrossguard: type === 'k' || type === 'p',
      isDoubleBladed: type === 'q' || type === 'b'
    });
    saber.rotation.x = Math.PI / 5;
    rightArm.add(saber);
    upperBody.add(rightArm);

    // Left Arm + Prominent Heraldic Shield ("Escudito") in FRONT of the Pawn
    leftArm.position.set(-0.22 * hScale, 0.36 * hScale, 0.22);
    if (type === 'p') {
      // Prominent front-facing Medieval Heater Shield ("escudito") held forward toward the enemy!
      const pawnShield = createPawnShield(isWhite, saberColor, scanners);
      pawnShield.position.set(0.12, -0.04, 0.14);
      pawnShield.rotation.y = 0.12;
      leftArm.add(pawnShield);
    } else if (type === 'b' || type === 'q') {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), ringMat);
      orb.position.set(0, 0.1, 0.18);
      leftArm.add(orb);
    } else {
      const royalShield = createPawnShield(isWhite, saberColor, scanners);
      royalShield.scale.setScalar(0.85);
      royalShield.position.set(0.06, -0.05, 0.12);
      royalShield.rotation.y = 0.18;
      leftArm.add(royalShield);
    }
    upperBody.add(leftArm);
  }

  // Face direction: White starts at +Z so rotates Math.PI to face -Z (towards Black);
  // Black starts at -Z so rotates 0 to face +Z (towards White)
  root.rotation.y = isWhite ? Math.PI : 0;

  root.userData.parts = {
    pedestal,
    neonRing,
    bodyGroup,
    lowerBody,
    upperBody,
    headGroup,
    rightArm,
    leftArm,
    mountGroup,
    capeGroup,
    sliceRing
  };
  root.userData.scanners = scanners;

  return root;
}
