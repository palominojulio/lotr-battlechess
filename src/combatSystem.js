import * as THREE from 'three';
import { soundFX } from './soundFX.js';

/**
 * Spawns 3D plasma sparks, lightsaber clash flashes, or exploding mecha debris
 */
export function spawnParticleBurst(scene, position, colorHex, count = 28, speed = 4.2) {
  const particles = [];
  const geo = new THREE.OctahedronGeometry(0.065, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 1
  });

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.position.copy(position);
    mesh.position.y += 0.6 + Math.random() * 0.5;

    const angle = Math.random() * Math.PI * 2;
    const up = 1.2 + Math.random() * speed;
    const out = (0.4 + Math.random() * 0.9) * speed;
    const velocity = new THREE.Vector3(Math.cos(angle) * out, up, Math.sin(angle) * out);

    scene.add(mesh);
    particles.push({ mesh, velocity, life: 1.0 });
  }

  return particles;
}

/**
 * Spawns a laser beam or Force lightning bolt between two 3D points
 */
export function createLaserBeam(scene, startPos, endPos, colorHex, thickness = 0.06) {
  const dir = new THREE.Vector3().subVectors(endPos, startPos);
  const length = dir.length();
  const geo = new THREE.CylinderGeometry(thickness, thickness, length, 8);
  geo.translate(0, length / 2, 0);
  geo.rotateX(Math.PI / 2);

  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.92
  });

  const beam = new THREE.Mesh(geo, mat);
  beam.position.copy(startPos);
  beam.lookAt(endPos);
  scene.add(beam);
  return beam;
}

/**
 * Animates a piece walking or robot-horse galloping from `fromPos` to `toPos`
 */
export function animateWalk(pieceMesh, targetPos, durationMs = 680) {
  return new Promise((resolve) => {
    const startPos = pieceMesh.position.clone();
    const startRotY = pieceMesh.rotation.y;
    const dx = targetPos.x - startPos.x;
    const dz = targetPos.z - startPos.z;
    const targetRotY = Math.atan2(dx, dz);

    const isMecha = pieceMesh.userData.type === 'n' || pieceMesh.userData.type === 'r';
    const parts = pieceMesh.userData.parts;
    const startTime = performance.now();
    let lastStepSound = 0;

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      pieceMesh.position.lerpVectors(startPos, targetPos, ease);
      pieceMesh.rotation.y = targetRotY;

      // Walking bob or Robot Horse hydraulic leg cycle
      const stride = Math.sin(t * Math.PI * 6);
      if (parts?.bodyGroup) {
        parts.bodyGroup.position.y = 0.16 + Math.abs(stride) * 0.14;
      }
      if (parts?.rightArm) {
        parts.rightArm.rotation.x = stride * 0.35;
      }
      if (parts?.leftArm) {
        parts.leftArm.rotation.x = -stride * 0.35;
      }
      if (parts?.mountGroup?.userData?.legs) {
        const legs = parts.mountGroup.userData.legs;
        legs[0].rotation.x = stride * 0.55;
        legs[1].rotation.x = -stride * 0.55;
        legs[2].rotation.x = -stride * 0.55;
        legs[3].rotation.x = stride * 0.55;
      }

      if (now - lastStepSound > 170 && t < 0.95) {
        soundFX.playStep(isMecha);
        lastStepSound = now;
      }

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        pieceMesh.position.copy(targetPos);
        if (parts?.bodyGroup) parts.bodyGroup.position.y = 0.16;
        if (parts?.rightArm) parts.rightArm.rotation.set(0, 0, 0);
        if (parts?.leftArm) parts.leftArm.rotation.set(0, 0, 0);
        if (parts?.mountGroup?.userData?.legs) {
          parts.mountGroup.userData.legs.forEach((l) => l.rotation.set(0, 0, 0));
        }
        // Restore default faction facing at end of normal walk (White faces -Z, Black faces +Z)
        pieceMesh.rotation.y = pieceMesh.userData.color === 'w' ? Math.PI : 0;
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

/**
 * Executes a full cinematic Battle Chess duel (LOTR Medieval x Star Wars Lightsabers & Robot Horses)
 * Returns a Promise that resolves when the defender is slain and the attacker claims the square.
 */
export function executeCinematicCombat({
  scene,
  attackerMesh,
  defenderMesh,
  targetPos,
  spawnBurst,
  onCombatProgress
}) {
  return new Promise(async (resolve) => {
    const attLore = attackerMesh.userData.lore;
    const defLore = defenderMesh.userData.lore;
    const attParts = attackerMesh.userData.parts;
    const defParts = defenderMesh.userData.parts;

    // 1. Move attacker to a duel stance 1.15 units in front of the defender
    const dir = new THREE.Vector3().subVectors(targetPos, attackerMesh.position);
    const dist = dir.length();
    dir.normalize();

    const stopDist = Math.max(0.1, dist - 1.15);
    const duelPos = attackerMesh.position.clone().addScaledVector(dir, stopDist);

    await animateWalk(attackerMesh, duelPos, 520);

    // Face each other directly
    const angleToDef = Math.atan2(
      defenderMesh.position.x - attackerMesh.position.x,
      defenderMesh.position.z - attackerMesh.position.z
    );
    attackerMesh.rotation.y = angleToDef;
    defenderMesh.rotation.y = angleToDef + Math.PI;

    soundFX.playSaberIgnite();

    // 2. Phase 1: Exchange of blows / Lightsaber Clash or Robot Horse Laser Barrage (0 -> 900ms)
    onCombatProgress?.({
      attackerHp: 100,
      defenderHp: 100,
      caption: `⚔️ ${attLore.name}: "${attLore.battleCry}"`
    });

    await new Promise((r) => {
      const start = performance.now();
      const duration = 950;
      let clashed1 = false;
      let clashed2 = false;
      let activeBeam = null;

      function duelLoop(now) {
        const t = Math.min(1, (now - start) / duration);

        if (attLore.attackType === 'mecha_charge') {
          // ROBOT HORSE: Rears up on hydraulic hind legs & fires ocular laser beams!
          const rearAngle = Math.sin(t * Math.PI) * -0.55;
          if (attParts?.bodyGroup) {
            attParts.bodyGroup.rotation.x = rearAngle;
            attParts.bodyGroup.position.y = 0.16 + Math.sin(t * Math.PI) * 0.35;
          }
          if (!clashed1 && t > 0.28) {
            clashed1 = true;
            soundFX.playSaberSwing();
            soundFX.playLaserShot();
            const eyeOrigin = attackerMesh.position.clone().add(new THREE.Vector3(0, 1.15, 0));
            const hitPoint = defenderMesh.position.clone().add(new THREE.Vector3(0, 0.85, 0));
            activeBeam = createLaserBeam(scene, eyeOrigin, hitPoint, attLore.saberColor, 0.055);
            spawnBurst(defenderMesh.position, attLore.saberColor, 22, 3.8);
            onCombatProgress?.({
              attackerHp: 90,
              defenderHp: 55,
              caption: `🤖 ¡El Caballo Robot dispara láseres oculares y carga con lanza de plasma!`
            });
          }
          if (!clashed2 && t > 0.68) {
            clashed2 = true;
            if (activeBeam) {
              scene.remove(activeBeam);
              activeBeam = null;
            }
            soundFX.playSaberSwing();
            soundFX.playSwordClash();
            spawnBurst(defenderMesh.position, 0xffffff, 26, 4.5);
          }
        } else if (attLore.attackType === 'force_lightning' || attLore.attackType === 'force_saber') {
          // FORCE TELEKINESIS + LIGHTNING / DOUBLE SABER
          if (attParts?.leftArm) {
            attParts.leftArm.rotation.x = -Math.PI / 2.2;
          }
          if (attParts?.rightArm) {
            attParts.rightArm.rotation.z = Math.sin(t * Math.PI * 6) * 0.9;
          }
          // Defender gets lifted into the air by the Force!
          if (defParts?.bodyGroup) {
            defParts.bodyGroup.position.y = 0.16 + Math.sin(t * Math.PI * 0.85) * 0.75;
            defParts.bodyGroup.rotation.z = Math.sin(t * 25) * 0.12;
          }
          if (!clashed1 && t > 0.25) {
            clashed1 = true;
            soundFX.playSaberSwing();
            soundFX.playSwordClash();
            soundFX.playMagicBlast();
            const startBeam = attackerMesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
            const endBeam = defenderMesh.position.clone().add(new THREE.Vector3(0, 1.35, 0));
            activeBeam = createLaserBeam(scene, startBeam, endBeam, attLore.beamColor, 0.07);
            spawnBurst(endBeam, attLore.saberColor, 26, 4.0);
            onCombatProgress?.({
              attackerHp: 94,
              defenderHp: 48,
              caption: `⚡ ¡${attLore.shortName} levanta a ${defLore.shortName} con la Fuerza y descarga plasma!`
            });
          }
          if (!clashed2 && t > 0.72) {
            clashed2 = true;
            if (activeBeam) {
              scene.remove(activeBeam);
              activeBeam = null;
            }
            soundFX.playSaberSwing();
            soundFX.playSwordClash();
          }
        } else {
          // MEDIEVAL LIGHTSABER DUEL: Multiple rapid slashes & defensive parries
          const swing = Math.sin(t * Math.PI * 4);
          if (attParts?.rightArm) {
            attParts.rightArm.rotation.x = -0.9 + swing * 1.35;
            attParts.rightArm.rotation.z = Math.cos(t * Math.PI * 4) * 0.45;
          }
          if (defParts?.rightArm) {
            defParts.rightArm.rotation.x = -0.7 - swing * 1.05;
          }
          // Defender recoils slightly on hit
          if (defParts?.bodyGroup) {
            defParts.bodyGroup.rotation.x = Math.max(0, Math.sin(t * Math.PI * 4) * 0.22);
          }

          if (!clashed1 && t > 0.24) {
            clashed1 = true;
            soundFX.playSaberSwing();
            soundFX.playSwordClash();
            const midPoint = attackerMesh.position.clone().lerp(defenderMesh.position, 0.55);
            spawnBurst(midPoint, attLore.saberColor, 24, 3.8);
            onCombatProgress?.({
              attackerHp: 85,
              defenderHp: 60,
              caption: `⚔️ ¡Choque de sables láser medievales entre ${attLore.shortName} y ${defLore.shortName}!`
            });
          }
          if (!clashed2 && t > 0.65) {
            clashed2 = true;
            soundFX.playSaberSwing();
            soundFX.playSwordClash();
            const midPoint = attackerMesh.position.clone().lerp(defenderMesh.position, 0.65);
            spawnBurst(midPoint, 0xffffff, 28, 4.2);
            onCombatProgress?.({
              attackerHp: 78,
              defenderHp: 28,
              caption: `🔥 ¡${attLore.shortName} rompe la guardia de ${defLore.shortName}!`
            });
          }
        }

        if (t < 1) {
          requestAnimationFrame(duelLoop);
        } else {
          if (activeBeam) scene.remove(activeBeam);
          if (attParts?.bodyGroup) {
            attParts.bodyGroup.rotation.set(0, 0, 0);
            attParts.bodyGroup.position.y = 0.16;
          }
          r();
        }
      }

      requestAnimationFrame(duelLoop);
    });

    // 3. Phase 2: THE FINISHER & SACRIFICE / DEATH ANIMATION (950ms)
    const deathStyle = defLore.deathStyle || 'saber_slice';
    soundFX.playDefeatShatter();

    let finisherCaption = `💀 ¡${attLore.shortName} ejecuta a ${defLore.shortName} con corte de sable láser!`;
    if (deathStyle === 'force_ascension') {
      finisherCaption = `✨ ¡Sacrificio Heroico! ${defLore.shortName} se une a la Fuerza de Valinor...`;
    } else if (deathStyle === 'mecha_explosion') {
      finisherCaption = `💥 ¡Sobrecarga del reactor! El chasis robótico de ${defLore.shortName} explota en pedazos.`;
    }

    onCombatProgress?.({
      attackerHp: 78,
      defenderHp: 0,
      caption: finisherCaption
    });

    // Big spark & plasma burst at execution moment
    spawnBurst(defenderMesh.position, attLore.saberColor, 42, 5.5);
    spawnBurst(defenderMesh.position, 0xffaa00, 24, 4.0);

    await new Promise((r) => {
      const start = performance.now();
      const duration = 920;

      function deathLoop(now) {
        const t = Math.min(1, (now - start) / duration);

        // Attacker holds heroic finishing strike pose
        if (attParts?.rightArm) {
          attParts.rightArm.rotation.x = -Math.PI / 2.4;
          attParts.rightArm.rotation.z = -0.5;
        }

        if (deathStyle === 'force_ascension') {
          // JEDI / MEDIEVAL MARTYR SACRIFICE:
          // Upper body rises as a glowing cyan Force hologram while spinning gently into the sky
          if (defParts?.upperBody) {
            defParts.upperBody.position.y = 0.65 + t * 2.2;
            defParts.upperBody.rotation.y = t * Math.PI * 3;
            defParts.upperBody.scale.setScalar(Math.max(0.01, 1 - t * 0.85));
          }
          if (defParts?.lowerBody) {
            defParts.lowerBody.scale.y = Math.max(0.05, 1 - t * 0.9);
          }
        } else if (deathStyle === 'mecha_explosion') {
          // ROBOT HORSE / CYBER-TROLL EXPLOSION:
          // Head, arms, and upper chassis fly apart in different directions!
          if (defParts?.headGroup) {
            defParts.headGroup.position.y = 0.7 + t * 2.6;
            defParts.headGroup.position.x = t * 1.1;
            defParts.headGroup.rotation.z = t * 8;
          }
          if (defParts?.rightArm) {
            defParts.rightArm.position.x = 0.4 + t * 1.6;
            defParts.rightArm.position.y = 0.4 + Math.sin(t * Math.PI) * 1.2;
            defParts.rightArm.rotation.z = -t * 6;
          }
          if (defParts?.leftArm) {
            defParts.leftArm.position.x = -0.4 - t * 1.6;
            defParts.leftArm.rotation.x = t * 6;
          }
          if (defParts?.upperBody) {
            defParts.upperBody.rotation.x = -t * 1.4;
            defParts.upperBody.position.z = -t * 0.9;
          }
        } else {
          // MEDIEVAL LIGHTSABER BISECTION & DECAPITATION (`saber_slice`):
          // Glowing orange cauterization ring appears at the slice line while upper body & head slide off!
          if (defParts?.sliceRing) {
            defParts.sliceRing.material.opacity = Math.sin(t * Math.PI);
            defParts.sliceRing.scale.setScalar(1 + t * 0.5);
          }
          if (defParts?.headGroup) {
            defParts.headGroup.position.x = -t * 0.85;
            defParts.headGroup.position.y = 0.65 - t * t * 0.95;
            defParts.headGroup.rotation.z = t * 4.2;
          }
          if (defParts?.upperBody) {
            defParts.upperBody.position.x = t * 0.75;
            defParts.upperBody.position.z = -t * 0.55;
            defParts.upperBody.rotation.z = -t * 1.35;
            defParts.upperBody.rotation.x = t * 0.85;
          }
          if (defParts?.lowerBody) {
            defParts.lowerBody.rotation.x = t * 0.6;
          }
        }

        // Fade out pedestal at the very end
        defenderMesh.scale.setScalar(Math.max(0.01, 1 - Math.pow(t, 3) * 0.95));

        if (t < 1) {
          requestAnimationFrame(deathLoop);
        } else {
          r();
        }
      }

      requestAnimationFrame(deathLoop);
    });

    // Reset attacker arm pose and step into the conquered square
    if (attParts?.rightArm) attParts.rightArm.rotation.set(0, 0, 0);
    if (attParts?.leftArm) attParts.leftArm.rotation.set(0, 0, 0);

    await animateWalk(attackerMesh, targetPos, 340);
    resolve();
  });
}
