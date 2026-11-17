import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createProceduralTextures } from '../three/textures';
import { animateCharacter, createKidAvatarRig, createSpongeBobRig } from '../three/characters';
import { soundEngine } from '../audio/soundEngine';

interface CinematicCutsceneProps {
  mode: 'intro' | 'ending';
  onComplete: () => void;
}

export function CinematicCutscene({ mode, onComplete }: CinematicCutsceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [caption, setCaption] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [whiteFlash, setWhiteFlash] = useState(0);
  const [blackFade, setBlackFade] = useState(0);
  const [endingWakeFade, setEndingWakeFade] = useState(mode === 'ending' ? 1 : 0);
  const [endingTitleVisible, setEndingTitleVisible] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mode === 'ending' ? 0x0c2442 : 0x07182e);
    scene.fog = new THREE.FogExp2(mode === 'ending' ? 0x0c2442 : 0x07182e, 0.02);

    const camera = new THREE.PerspectiveCamera(
      62,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      120
    );

    const hemi = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, mode === 'ending' ? 1.45 : 1.15);
    const key = new THREE.DirectionalLight(0xfffbeb, 1.75);
    key.position.set(6, 12, 8);
    scene.add(hemi, key);

    const textures = createProceduralTextures(renderer);

    // Bright Aquarium Hall Floor
    const hallFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.15 })
    );
    hallFloor.rotation.x = -Math.PI / 2;
    scene.add(hallFloor);

    // Giant Aquarium Tank
    const tankWater = new THREE.Mesh(
      new THREE.BoxGeometry(16, 6.5, 5),
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    tankWater.position.set(0, 3.25, -6.5);
    scene.add(tankWater);

    const tankLight = new THREE.PointLight(0x38bdf8, 5.2, 24, 1.1);
    tankLight.position.set(0, 5.2, -6.2);
    scene.add(tankLight);

    // Colorful Swimming Fish inside Tank
    const fishGroup: Array<{ mesh: THREE.Group; baseY: number; speed: number; offset: number }> = [];
    const fishColors = [0xf59e0b, 0xec4899, 0x22d3ee, 0xa3e635, 0xfbbf24];
    for (let i = 0; i < 12; i++) {
      const f = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: fishColors[i % fishColors.length],
        roughness: 0.35,
      });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat);
      body.scale.set(1.5, 0.85, 0.5);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 6), mat);
      tail.rotation.z = -Math.PI / 2;
      tail.position.x = -0.45;
      f.add(body, tail);
      const by = 1.4 + (i % 4) * 1.1;
      f.position.set(-6 + i * 1.1, by, -6.5 + ((i % 3) - 1) * 1.2);
      scene.add(f);
      fishGroup.push({ mesh: f, baseY: by, speed: 1.2 + (i % 3) * 0.45, offset: i * 0.9 });
    }

    // Yellow School Bus visible beside hall (Intro)
    const bus = new THREE.Group();
    bus.position.set(-13, 0, -2);
    const busBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.15, 4.2, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 })
    );
    busBody.rotation.z = Math.PI / 2;
    busBody.position.y = 1.6;
    bus.add(busBody);
    [-1.6, 1.6].forEach((wx) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.5, 1.0);
      bus.add(wheel);
    });
    scene.add(bus);

    // Stylized Teacher & Friends helper (with faces & waving arms!)
    const makePerson = (shirtHex: number, height: number, px: number, pz: number) => {
      const g = new THREE.Group();
      g.position.set(px, 0, pz);
      const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.22, height * 0.45, 6, 12),
        new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.65 })
      );
      torso.position.y = height * 0.52;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 })
      );
      head.position.y = height * 0.92;
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      [-0.07, 0.07].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
        eye.position.set(ex, height * 0.93, 0.175);
        g.add(eye);
      });
      const leftArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.06, 0.35, 4, 8),
        new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.65 })
      );
      leftArm.position.set(-0.28, height * 0.65, 0.08);
      leftArm.rotation.z = 0.4;
      const rightArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.06, 0.35, 4, 8),
        new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.65 })
      );
      rightArm.position.set(0.28, height * 0.65, 0.08);
      rightArm.rotation.z = -0.4;
      g.add(torso, head, leftArm, rightArm);
      scene.add(g);
      return { root: g, leftArm, rightArm };
    };

    const playerKid = createKidAvatarRig(textures);
    playerKid.root.position.set(0, 0, 0.5);
    playerKid.root.visible = mode === 'intro';
    scene.add(playerKid.root);

    let crowd: Array<{ root: THREE.Group; leftArm: THREE.Mesh; rightArm: THREE.Mesh }> = [];
    if (mode === 'intro') {
      crowd = [
        makePerson(0x0f766e, 1.75, -3.5, -1.8), // Teacher
        makePerson(0x3b82f6, 1.35, -1.8, -2.2),
        makePerson(0xef4444, 1.32, 0.4, -2.5),
        makePerson(0xa855f7, 1.38, 1.8, -2.0),
      ];
    } else {
      // ENDING SCENE: Player wakes up closely SURROUNDED in a semicircle by Teacher + 5 Friends!
      const crowdCoords: Array<[number, number, number, number]> = [
        [0x0f766e, 1.74, -2.1, -1.6], // Bu/Pak Guru
        [0x3b82f6, 1.38, -1.5, -0.2], // Teman 1 (kiri dekat)
        [0xef4444, 1.34, -0.8, -1.8], // Teman 2 (depan kiri)
        [0xa855f7, 1.36, 0.85, -1.75], // Teman 3 (depan kanan)
        [0x10b981, 1.35, 1.65, -0.3], // Teman 4 (kanan dekat)
        [0xf97316, 1.36, 0.0, -2.1], // Teman 5 (tepat di depan)
      ];
      crowd = crowdCoords.map(([color, h, x, z]) => {
        const p = makePerson(color, h, x, z);
        p.root.lookAt(0, 0, 1.2); // Facing the waking player!
        return p;
      });
    }

    // Restricted "DILARANG MASUK" Door (Intro)
    const forbiddenDoor = new THREE.Group();
    forbiddenDoor.position.set(7.5, 0, -2.5);
    forbiddenDoor.rotation.y = -Math.PI / 4;
    const doorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 3.6, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 })
    );
    doorSlab.position.y = 1.8;
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.45, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xdc2626, emissiveIntensity: 0.9 })
    );
    sign.position.set(0, 2.55, 0.16);
    const doorLight = new THREE.PointLight(0xef4444, 2.5, 10, 1.5);
    doorLight.position.set(0, 3.2, 1.2);
    forbiddenDoor.add(doorSlab, sign, doorLight);
    forbiddenDoor.visible = mode === 'intro';
    scene.add(forbiddenDoor);

    // SpongeBob inside Aquarium Tank (for Ending Cutscene!)
    const spongebobTank = createSpongeBobRig(textures);
    spongebobTank.root.position.set(0, 1.2, -5.8);
    spongebobTank.root.visible = mode === 'ending';
    if (mode === 'ending') {
      spongebobTank.setMood('evil');
    }
    scene.add(spongebobTank.root);

    let elapsed = 0;
    let lastTime = performance.now();
    let frameId = 0;
    let finished = false;
    let triggeredVoice = false;

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      fishGroup.forEach((f) => {
        f.mesh.position.x = Math.sin(elapsed * 0.55 * f.speed + f.offset) * 5.8;
        f.mesh.position.y = f.baseY + Math.sin(elapsed * 1.8 + f.offset) * 0.25;
        f.mesh.rotation.y = Math.cos(elapsed * 0.55 * f.speed + f.offset) >= 0 ? 0 : Math.PI;
      });

      if (mode === 'intro') {
        if (elapsed < 4.5) {
          setSpeaker('Narator');
          setCaption('Kunjungan edukasi sekolah ke Akuarium Raksasa dimulai. Kamu berjalan bersama guru dan teman-teman...');
          playerKid.root.position.set(-1.0 + elapsed * 0.5, 0, -0.5 - elapsed * 0.2);
          playerKid.root.rotation.y = Math.PI;
          animateCharacter(playerKid, 'walk', elapsed, dt);
          camera.position.set(-3.2 + elapsed * 0.8, 1.95, 5.2 - elapsed * 0.45);
          camera.lookAt(0, 2.2, -5.0);
          crowd.forEach((p, idx) => {
            p.root.position.y = Math.abs(Math.sin(elapsed * 4 + idx)) * 0.08;
          });
        } else if (elapsed < 8.8) {
          setSpeaker('Kamu');
          setCaption('Tunggu... ada ruangan misterius bertuliskan "DILARANG MASUK". Apa yang ada di dalam?');
          const p = (elapsed - 4.5) / 4.3;
          playerKid.root.position.set(THREE.MathUtils.lerp(1.2, 4.8, p), 0, THREE.MathUtils.lerp(-1.4, -1.9, p));
          playerKid.root.rotation.y = -Math.PI / 2;
          animateCharacter(playerKid, 'walk', elapsed, dt);
          camera.position.set(THREE.MathUtils.lerp(-0.5, 4.6, p), 1.65, THREE.MathUtils.lerp(3.2, -0.4, p));
          camera.lookAt(7.5, 1.9, -2.5);
        } else if (elapsed < 11.8) {
          setSpeaker('Suara Misterius');
          setCaption('Lampu mulai berkedip... cahaya putih menyilaukan memenuhi ruangan!');
          doorLight.intensity = Math.sin(elapsed * 34) > 0 ? 6 : 0.2;
          const flash = THREE.MathUtils.clamp((elapsed - 9.0) / 1.8, 0, 1);
          setWhiteFlash(flash);
          if (!triggeredVoice) {
            triggeredVoice = true;
            soundEngine.playMysteriousVoice();
          }
        } else if (elapsed < 13.6) {
          setWhiteFlash(0);
          setBlackFade(THREE.MathUtils.clamp((elapsed - 11.8) / 1.2, 0, 1));
          setCaption('...');
        } else if (!finished) {
          finished = true;
          onCompleteRef.current();
        }
      } else {
        // ENDING CUTSCENE: Bangun di lantai akuarium dikerumuni teman-teman sekolah!
        animateCharacter(spongebobTank, 'talk', elapsed, dt);
        crowd.forEach((p, idx) => {
          p.root.position.y = Math.abs(Math.sin(elapsed * 5 + idx)) * 0.06;
          p.leftArm.rotation.z = 0.65 + Math.sin(elapsed * 7 + idx) * 0.35;
          p.rightArm.rotation.z = -0.65 - Math.sin(elapsed * 7 + idx) * 0.35;
        });

        const wake = THREE.MathUtils.clamp(elapsed / 2.2, 0, 1);
        setEndingWakeFade(1 - wake);

        if (elapsed < 3.4) {
          setSpeaker('Teman-Teman Sekolah');
          setCaption('"HORE! Dia sudah bangun!! Kamu sempat pingsan di depan akuarium—kami semua sangat khawatir!"');
          camera.position.set(0, THREE.MathUtils.lerp(0.35, 1.55, wake), THREE.MathUtils.lerp(1.4, 2.1, wake));
          camera.lookAt(0, THREE.MathUtils.lerp(1.2, 1.35, wake), -1.4);
        } else if (elapsed < 6.4) {
          setSpeaker('Guru & Sahabatmu');
          setCaption('"Syukurlah kamu kembali sadar! Ayo ikut rombongan kembali ke bus sekolah!"');
          camera.position.set(Math.sin((elapsed - 3.4) * 0.6) * 1.1, 1.65, 2.1);
          camera.lookAt(0, 1.35, -1.5);
        } else if (elapsed < 10.2) {
          setSpeaker('Kamu');
          setCaption('Tunggu... kenapa di dalam akuarium kaca itu terlihat SpongeBob sedang tersenyum ke arahku?!');
          const zoom = THREE.MathUtils.clamp((elapsed - 6.4) / 3.4, 0, 1);
          camera.position.set(0, 1.75, THREE.MathUtils.lerp(2.1, -1.9, zoom));
          camera.lookAt(0, 2.1, -5.8);
        } else if (elapsed < 13.8) {
          setSpeaker('');
          setCaption('');
          setBlackFade(THREE.MathUtils.clamp((elapsed - 10.2) / 1.4, 0, 1));
          if (elapsed > 11.2) {
            setEndingTitleVisible(true);
          }
        } else if (!finished) {
          finished = true;
          onCompleteRef.current();
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
    };
  }, [mode]);

  return (
    <div className="fixed inset-0 z-40 bg-black overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      {/* Ending Wake-up Eyelids */}
      {mode === 'ending' && endingWakeFade > 0.02 && (
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute top-0 inset-x-0 bg-black"
            style={{ height: `${endingWakeFade * 46}%` }}
          />
          <div
            className="absolute bottom-0 inset-x-0 bg-black"
            style={{ height: `${endingWakeFade * 46}%` }}
          />
        </div>
      )}

      {whiteFlash > 0 && (
        <div
          className="fixed inset-0 bg-white pointer-events-none"
          style={{ opacity: whiteFlash }}
        />
      )}

      {blackFade > 0 && (
        <div
          className="fixed inset-0 bg-black pointer-events-none"
          style={{ opacity: blackFade }}
        />
      )}

      {endingTitleVisible && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none px-6 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-wider text-red-500">
            KAMU BERHASIL PULANG... ATAU BELUM?
          </h2>
        </div>
      )}

      {caption && !endingTitleVisible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[min(680px,92vw)] bg-slate-950/90 border border-slate-700/70 rounded-2xl px-6 py-4 shadow-2xl">
          {speaker && (
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              {speaker}
            </div>
          )}
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed">{caption}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onComplete}
        className="fixed top-5 right-5 z-50 px-4 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
      >
        Lewati Cutscene →
      </button>
    </div>
  );
}
