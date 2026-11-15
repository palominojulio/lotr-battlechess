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
function createPawnShield(isWhite, saberColor) {
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
    color: isWhite ? 0x1e3a8a : 0x7f1d1d,
    emissive: isWhite ? 0x0f172a : 0x3b0707,
    metalness: 0.7,
    roughness: 0.25
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
    // Mordor Emblem on both front and back of shield: Blazing Eye of Sauron
    [0.06, -0.025].forEach((zPos) => {
      const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 8, 20), emblemMat);
      eyeRing.position.set(0, 0.0, zPos);
      shieldGroup.add(eyeRing);

      const slitPupil = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.04), glowMat);
      slitPupil.position.set(0, 0.0, zPos);
      shieldGroup.add(slitPupil);
    });
  }

  return shieldGroup;
}

/**
 * Builds a Robotic Cyber-Horse (Caballo Robot) for Knights (n)
 */
function buildRobotHorse(isWhite, saberColor) {
  const mountGroup = new THREE.Group();

  const chassisMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xdbeafe : 0x4c1d24,
    emissive: isWhite ? 0x000000 : 0x2a080c,
    metalness: 0.85,
    roughness: 0.22
  });
  const jointMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x64748b : 0x7f1d1d,
    metalness: 0.9,
    roughness: 0.28
  });
  const neonMat = new THREE.MeshBasicMaterial({
    color: saberColor
  });

  // Armored Robotic Horse Torso
  const torsoGeo = new THREE.BoxGeometry(0.46, 0.36, 0.88);
  const torso = new THREE.Mesh(torsoGeo, chassisMat);
  torso.position.set(0, 0.52, 0);
  torso.castShadow = true;
  mountGroup.add(torso);

  // Neon Energy Core Ribs on flanks
  for (let z = -0.22; z <= 0.22; z += 0.22) {
    const ribGeo = new THREE.BoxGeometry(0.5, 0.06, 0.05);
    const rib = new THREE.Mesh(ribGeo, neonMat);
    rib.position.set(0, 0.52, z);
    mountGroup.add(rib);
  }

  // 4 Articulated Robotic Hydraulic Legs
  const legs = [];
  const legPositions = [
    [-0.19, 0.42, 0.32],
    [0.19, 0.42, 0.32],
    [-0.19, 0.42, -0.32],
    [0.19, 0.42, -0.32]
  ];

  legPositions.forEach(([lx, ly, lz]) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, ly, lz);

    const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.24, 8), chassisMat);
    upperLeg.position.y = -0.1;
    legPivot.add(upperLeg);

    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), neonMat);
    kneeJoint.position.y = -0.22;
    legPivot.add(kneeJoint);

    const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.24, 8), jointMat);
    lowerLeg.position.y = -0.32;
    legPivot.add(lowerLeg);

    mountGroup.add(legPivot);
    legs.push(legPivot);
  });

  // Cybernetic Neck & Horse Head
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.68, 0.36);
  neckGroup.rotation.x = -0.35;

  const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.24), chassisMat);
  neckMesh.position.y = 0.16;
  neckGroup.add(neckMesh);

  // Laser Mane (Cresta de Plasma)
  const maneGeo = new THREE.BoxGeometry(0.05, 0.44, 0.12);
  const maneMesh = new THREE.Mesh(maneGeo, neonMat);
  maneMesh.position.set(0, 0.2, -0.12);
  neckGroup.add(maneMesh);

  // Robotic Snout + Laser Visor Eyes
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.44), chassisMat);
  headMesh.position.set(0, 0.38, 0.12);
  neckGroup.add(headMesh);

  const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.16), neonMat);
  visorMesh.position.set(0, 0.41, 0.22);
  neckGroup.add(visorMesh);

  mountGroup.add(neckGroup);

  // Rear Plasma Thruster Exhaust
  const thrusterGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.18, 10);
  thrusterGeo.rotateX(Math.PI / 2);
  const thruster = new THREE.Mesh(thrusterGeo, neonMat);
  thruster.position.set(0, 0.54, -0.48);
  mountGroup.add(thruster);

  mountGroup.userData = { legs, neckGroup, visorMesh, thruster };
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

  // High-Contrast Faction Materials so Black pieces stand out vividly on dark tiles
  const baseMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xcbd5e1 : 0x5c1922,
    emissive: isWhite ? 0x0f172a : 0x2e080d,
    metalness: 0.72,
    roughness: 0.28
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: isWhite ? 0x38bdf8 : 0xff4500
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: lore.primaryColor,
    emissive: isWhite ? 0x091526 : 0x330a10,
    metalness: 0.68,
    roughness: 0.26
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: lore.accentColor,
    emissive: isWhite ? 0x1a1200 : 0x421000,
    metalness: 0.85,
    roughness: 0.2
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xfde68a : 0x7c2d12,
    roughness: 0.45
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
  let rightArm = new THREE.Group();
  let leftArm = new THREE.Group();
  let headGroup = new THREE.Group();

  if (type === 'n') {
    // KNIGHT: Robotic Cyber-Horse + Medieval Rider with Laser Lance
    mountGroup = buildRobotHorse(isWhite, saberColor);
    lowerBody.add(mountGroup);

    upperBody.position.set(0, 0.72, -0.05);

    const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.48, 12), armorMat);
    riderTorso.position.y = 0.24;
    riderTorso.castShadow = true;
    upperBody.add(riderTorso);

    headGroup.position.set(0, 0.58, 0);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), armorMat);
    headGroup.add(helm);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.16), ringMat);
    visor.position.set(0, 0.02, 0.1);
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
    const eyeVisor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.34), ringMat);
    eyeVisor.position.y = 0.04;
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

    // Glowing Cyber/Jedi/Sith Eyes
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22 * hScale, 0.05 * hScale, 0.18 * hScale), ringMat);
    visor.position.set(0, 0.03 * hScale, 0.1 * hScale);
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
      }
    } else if (type === 'q') {
      const diadem = new THREE.Mesh(new THREE.TorusGeometry(0.2 * hScale, 0.03, 8, 20), trimMat);
      diadem.rotation.x = Math.PI / 2;
      diadem.position.y = 0.15 * hScale;
      headGroup.add(diadem);
    } else if (type === 'b') {
      const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.24 * hScale, 0.45 * hScale, 12), armorMat);
      hatCone.position.y = 0.28 * hScale;
      headGroup.add(hatCone);
    } else if (type === 'p') {
      // Infantry Helmet Crest for Pawns so they look like armored medieval guards
      const helmCrest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.26), trimMat);
      helmCrest.position.set(0, 0.16 * hScale, 0);
      headGroup.add(helmCrest);
    }

    upperBody.add(headGroup);

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
      const pawnShield = createPawnShield(isWhite, saberColor);
      pawnShield.position.set(0.12, -0.04, 0.14);
      pawnShield.rotation.y = 0.12;
      leftArm.add(pawnShield);
    } else if (type === 'b' || type === 'q') {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), ringMat);
      orb.position.set(0, 0.1, 0.18);
      leftArm.add(orb);
    } else {
      const royalShield = createPawnShield(isWhite, saberColor);
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
    sliceRing
  };

  return root;
}
