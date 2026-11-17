import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ActiveQuizPrompt,
  CheckpointSave,
  GameScreen,
  GameSettings,
  HudState,
  JumpscareCharacter,
  PlayerProfile,
  Pos1SubPhase,
  PosStage,
  QuestionRecord,
} from '../types/game';
import { createProceduralTextures } from '../three/textures';
import {
  animateCharacter,
  CharacterRig,
  createKidAvatarRig,
  createMrKrabsRig,
  createPatrickRig,
  createPlanktonRig,
  createSandyRig,
  createSpongeBobRig,
  createSquidwardRig,
  createZombieFishRig,
} from '../three/characters';
import { buildBikiniBottomWorld } from '../three/worldBuilder';
import {
  checkCircleOverlap,
  computeStealthSuspicion,
  findHighestSupportY,
  findSlideSurfaceY,
  pickUniqueQuestion,
  resolveCircleWalls,
} from '../game/rules';
import { QUESTION_BANK } from '../data/questions';
import { soundEngine } from '../audio/soundEngine';

export interface VirtualInputState {
  moveX: number; // -1..1
  moveY: number; // -1..1 (forward positive)
  turnX: number; // -1..1 (left negative, right positive)
  jumpPressed: boolean;
  runHeld: boolean;
  actionPressed: boolean;
  flashlightTogglePressed: boolean;
  cameraTogglePressed: boolean;
}

interface GameCanvasProps {
  screen: GameScreen;
  profile: PlayerProfile;
  settings: GameSettings;
  activeQuiz: ActiveQuizPrompt | null;
  jumpscareActive: boolean;
  initialCheckpoint: CheckpointSave | null;
  virtualInputRef: React.MutableRefObject<VirtualInputState>;
  onHudUpdate: (hud: HudState) => void;
  onTriggerQuiz: (quiz: ActiveQuizPrompt) => void;
  onTriggerJumpscare: (char: JumpscareCharacter, title: string, subtitle: string) => void;
  onSaveCheckpoint: (save: CheckpointSave) => void;
  onFinishGame: (records: QuestionRecord[], elapsedSeconds: number, checkpointsCleared: number) => void;
  quizResultSignal: {
    seq: number;
    context: ActiveQuizPrompt['context'];
    isCorrect: boolean;
    record: QuestionRecord;
    digitIndex?: number;
  } | null;
  respawnSignal: number;
  ufoConfirmSignal: number;
}

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

export function GameCanvas({
  screen,
  profile,
  settings,
  activeQuiz,
  jumpscareActive,
  initialCheckpoint,
  virtualInputRef,
  onHudUpdate,
  onTriggerQuiz,
  onTriggerJumpscare,
  onSaveCheckpoint,
  onFinishGame,
  quizResultSignal,
  respawnSignal,
  ufoConfirmSignal,
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const activeQuizRef = useRef(activeQuiz);
  activeQuizRef.current = activeQuiz;
  const jumpscareRef = useRef(jumpscareActive);
  jumpscareRef.current = jumpscareActive;

  const callbacksRef = useRef({
    onHudUpdate,
    onTriggerQuiz,
    onTriggerJumpscare,
    onSaveCheckpoint,
    onFinishGame,
  });
  callbacksRef.current = {
    onHudUpdate,
    onTriggerQuiz,
    onTriggerJumpscare,
    onSaveCheckpoint,
    onFinishGame,
  };

  const simRef = useRef<{
    stage: PosStage;
    pos1SubPhase: Pos1SubPhase;
    safeDigitsFound: number[];
    safeCodeTarget: number[];
    hasDoorKey: boolean;
    hasMap: boolean;
    sandyBattleCorrect: number;
    camelliaStep: number;
    usedQuestionIds: string[];
    records: QuestionRecord[];
    checkpointsCleared: number;
    elapsedSeconds: number;
    playerX: number;
    playerY: number;
    playerZ: number;
    velY: number;
    yaw: number;
    pitch: number;
    stamina: number;
    flashlightOn: boolean;
    cameraView: '3rd' | '1st';
    wakeTimer: number;
    clatterPlayed: boolean;
    dialogueTimer: number;
    redLightStep: number;
    redLightTriggered: boolean;
    gateTriggered: string | null;
    doorBangTimer: number;
    doorBangPlayed: boolean;
    krabsFainted: boolean;
    suspicion: number;
    enemyStunTimer: number;
    pillarWarningTimer: number;
    ufoChoicePending: boolean;
    lastQuizSeq: number;
    lastRespawnSeq: number;
    lastUfoSeq: number;
    needPositionInit: boolean;
    spawnGraceTimer: number;
  }>({
    stage: initialCheckpoint?.stage ?? 'pos1_krusty_krab',
    pos1SubPhase: initialCheckpoint?.pos1SubPhase ?? 'waking_up',
    safeDigitsFound: initialCheckpoint?.safeDigitsFound ?? [],
    safeCodeTarget: initialCheckpoint?.safeCodeTarget ?? [3, 7, 1, 9, 4],
    hasDoorKey: initialCheckpoint?.hasDoorKey ?? false,
    hasMap: initialCheckpoint?.hasMap ?? false,
    sandyBattleCorrect: initialCheckpoint?.sandyBattleCorrect ?? 0,
    camelliaStep: initialCheckpoint?.camelliaStep ?? 0,
    usedQuestionIds: initialCheckpoint?.usedQuestionIds ?? [],
    records: initialCheckpoint?.records ?? [],
    checkpointsCleared: initialCheckpoint?.checkpointsCleared ?? 0,
    elapsedSeconds: initialCheckpoint?.elapsedSeconds ?? 0,
    playerX: 0,
    playerY: 0,
    playerZ: -7.0,
    velY: 0,
    yaw: Math.PI,
    pitch: 0,
    stamina: 100,
    flashlightOn: true,
    cameraView: '3rd',
    wakeTimer: 0,
    clatterPlayed: false,
    dialogueTimer: 0,
    redLightStep: 0,
    redLightTriggered: false,
    gateTriggered: null,
    doorBangTimer: 0,
    doorBangPlayed: false,
    krabsFainted: false,
    suspicion: 0,
    enemyStunTimer: 0,
    pillarWarningTimer: 0,
    ufoChoicePending: false,
    lastQuizSeq: 0,
    lastRespawnSeq: 0,
    lastUfoSeq: 0,
    needPositionInit: true,
    spawnGraceTimer: 1.5,
  });

  useEffect(() => {
    if (!initialCheckpoint) return;
    const s = simRef.current;
    s.stage = initialCheckpoint.stage;
    s.pos1SubPhase = initialCheckpoint.pos1SubPhase;
    s.safeDigitsFound = [...initialCheckpoint.safeDigitsFound];
    s.safeCodeTarget = [...initialCheckpoint.safeCodeTarget];
    s.hasDoorKey = initialCheckpoint.hasDoorKey;
    s.hasMap = initialCheckpoint.hasMap ?? false;
    s.sandyBattleCorrect = initialCheckpoint.sandyBattleCorrect ?? 0;
    s.camelliaStep = initialCheckpoint.camelliaStep ?? 0;
    s.usedQuestionIds = [...initialCheckpoint.usedQuestionIds];
    s.records = [...initialCheckpoint.records];
    s.checkpointsCleared = initialCheckpoint.checkpointsCleared;
    s.elapsedSeconds = initialCheckpoint.elapsedSeconds;
    s.needPositionInit = true;
    s.redLightTriggered = s.stage !== 'pos1_red_light';
    s.redLightStep = 0;
    s.gateTriggered = null;
    s.suspicion = 0;
    s.enemyStunTimer = 0;
    s.pillarWarningTimer = 0;
    s.ufoChoicePending = false;
  }, [initialCheckpoint]);

  // Handle quiz answer signal from QuestionModal
  useEffect(() => {
    if (!quizResultSignal) return;
    const s = simRef.current;
    if (quizResultSignal.seq === s.lastQuizSeq) return;
    s.lastQuizSeq = quizResultSignal.seq;
    s.records.push(quizResultSignal.record);

    const buildCheckpointPayload = (nextStage: PosStage): CheckpointSave => ({
      profile: profileRef.current,
      stage: nextStage,
      pos1SubPhase: s.pos1SubPhase,
      safeDigitsFound: [...s.safeDigitsFound],
      safeCodeTarget: [...s.safeCodeTarget],
      hasDoorKey: s.hasDoorKey,
      hasMap: s.hasMap,
      sandyBattleCorrect: s.sandyBattleCorrect,
      camelliaStep: s.camelliaStep,
      usedQuestionIds: [...s.usedQuestionIds],
      records: [...s.records],
      checkpointsCleared: s.checkpointsCleared,
      elapsedSeconds: s.elapsedSeconds,
      savedAt: Date.now(),
    });

    const { context, isCorrect, digitIndex } = quizResultSignal;

    if (context === 'krabs_ambush') {
      if (isCorrect) {
        s.krabsFainted = true;
        s.pos1SubPhase = 'krabs_stunned_escape';
        soundEngine.playCorrect();
      } else {
        soundEngine.playWrong();
        callbacksRef.current.onTriggerJumpscare(
          'mr_krabs',
          'TERTANGKAP MR. KRABS!',
          'Jawabanmu salah! Mr. Krabs menerkammu di dapur Krusty Krab!'
        );
      }
    } else if (context === 'safe_digit') {
      if (isCorrect && digitIndex !== undefined) {
        if (!s.safeDigitsFound.includes(digitIndex)) {
          s.safeDigitsFound.push(digitIndex);
        }
        soundEngine.playSafeClick();
      }
    } else if (context === 'red_light_eval') {
      s.redLightStep += 1;
      if (s.redLightStep < 3) {
        const picked = pickUniqueQuestion(
          QUESTION_BANK,
          profileRef.current.grade,
          profileRef.current.subject,
          s.usedQuestionIds
        );
        s.usedQuestionIds = picked.nextUsedIds;
        callbacksRef.current.onTriggerQuiz({
          context: 'red_light_eval',
          title: `Pos 1 → Pos 2 · Lampu Merah (${s.redLightStep + 1}/3)`,
          subtitle: 'Soal penilaian otomatis — tidak ada soal yang diulang!',
          question: picked.question,
          allowRetryOnWrong: false,
          isGradedOnly: true,
        });
      } else {
        s.stage = 'pos2_street_squidward';
        s.checkpointsCleared = Math.max(s.checkpointsCleared, 1);
        s.gateTriggered = null;
        s.needPositionInit = true;
        callbacksRef.current.onSaveCheckpoint(buildCheckpointPayload('pos2_street_squidward'));
      }
    } else if (context === 'pos2_gate') {
      if (isCorrect) {
        soundEngine.playCorrect();
        s.stage = 'pos3_patrick_obby';
        s.checkpointsCleared = Math.max(s.checkpointsCleared, 2);
        s.gateTriggered = null;
        s.needPositionInit = true;
        soundEngine.playZombieGrowl();
        soundEngine.setMusicMode('chase');
        callbacksRef.current.onSaveCheckpoint(buildCheckpointPayload('pos3_patrick_obby'));
      }
    } else if (context === 'pos3_gate') {
      if (isCorrect) {
        soundEngine.playCorrect();
        s.stage = 'pos4_plankton_ufo';
        s.checkpointsCleared = Math.max(s.checkpointsCleared, 3);
        s.gateTriggered = null;
        s.dialogueTimer = 0;
        s.ufoChoicePending = false;
        s.needPositionInit = true;
        soundEngine.setMusicMode('explore');
        soundEngine.playMysteriousVoice();
        callbacksRef.current.onSaveCheckpoint(buildCheckpointPayload('pos4_plankton_ufo'));
      }
    } else if (context === 'pos4_gate') {
      if (isCorrect) {
        soundEngine.playCorrect();
        s.ufoChoicePending = false;
        s.stage = 'pos5_zombie_chase';
        s.checkpointsCleared = Math.max(s.checkpointsCleared, 4);
        s.gateTriggered = null;
        s.needPositionInit = true;
        soundEngine.setMusicMode('chase');
        callbacksRef.current.onSaveCheckpoint(buildCheckpointPayload('pos5_zombie_chase'));
      }
    } else if (context === 'pos5_gate') {
      if (isCorrect) {
        soundEngine.playDoorOpen();
        s.stage = 'pos6_sandy_boss';
        s.checkpointsCleared = Math.max(s.checkpointsCleared, 5);
        s.gateTriggered = null;
        s.sandyBattleCorrect = 0;
        s.dialogueTimer = 0;
        s.suspicion = 0;
        s.enemyStunTimer = 0;
        s.needPositionInit = true;
        soundEngine.setMusicMode('explore');
        callbacksRef.current.onSaveCheckpoint(buildCheckpointPayload('pos6_sandy_boss'));
      }
    } else if (context === 'sandy_survive') {
      if (isCorrect) {
        s.sandyBattleCorrect += 1;
        s.suspicion = 0;
        s.enemyStunTimer = 3.2;
        soundEngine.playCorrect();
        if (s.sandyBattleCorrect >= 5) {
          soundEngine.playDoorOpen();
          s.stage = 'pos7_tree_portal';
          s.checkpointsCleared = Math.max(s.checkpointsCleared, 6);
          s.camelliaStep = 0;
          s.gateTriggered = null;
          s.needPositionInit = true;
          callbacksRef.current.onSaveCheckpoint(buildCheckpointPayload('pos7_tree_portal'));
        }
      } else {
        soundEngine.playWrong();
        callbacksRef.current.onTriggerJumpscare(
          Math.random() > 0.5 ? 'sandy' : 'spongebob',
          'DIMAKAN SANDY & SPONGEBOB!',
          'Jawabanmu salah! Mereka menerkammu di Kubah Sandy!'
        );
      }
    } else if (context === 'portal_riddle') {
      if (isCorrect) {
        soundEngine.playPortal();
        callbacksRef.current.onFinishGame(
          s.records,
          s.elapsedSeconds,
          Math.max(s.checkpointsCleared, 7)
        );
      }
    }
  }, [quizResultSignal]);

  // Handle Jumpscare respawn signal
  useEffect(() => {
    if (respawnSignal === 0) return;
    const s = simRef.current;
    if (respawnSignal === s.lastRespawnSeq) return;
    s.lastRespawnSeq = respawnSignal;
    s.needPositionInit = true;
    s.suspicion = 0;
    s.enemyStunTimer = 0;
    s.gateTriggered = null;
    if (s.stage === 'pos1_krusty_krab' && s.pos1SubPhase === 'krabs_approaching') {
      s.krabsFainted = false;
    }
  }, [respawnSignal]);

  // Handle UFO confirm button from HUD -> trigger Pos 4->5 gate question
  useEffect(() => {
    if (ufoConfirmSignal === 0) return;
    const s = simRef.current;
    if (ufoConfirmSignal === s.lastUfoSeq) return;
    s.lastUfoSeq = ufoConfirmSignal;
    if (s.stage === 'pos4_plankton_ufo' && s.gateTriggered !== 'pos4_gate') {
      s.gateTriggered = 'pos4_gate';
      const picked = pickUniqueQuestion(
        QUESTION_BANK,
        profileRef.current.grade,
        profileRef.current.subject,
        s.usedQuestionIds
      );
      s.usedQuestionIds = picked.nextUsedIds;
      callbacksRef.current.onTriggerQuiz({
        context: 'pos4_gate',
        title: 'Pos 4 → Pos 5 · Lari ke Rumah Sandy',
        subtitle: 'Jawab soal ini sebelum berlari melewati jalan penuh zombie!',
        question: picked.question,
        allowRetryOnWrong: true,
      });
    }
  }, [ufoConfirmSignal]);

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
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x031126);
    scene.fog = new THREE.FogExp2(0x031126, 0.013);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.52;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      70,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      260
    );

    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.72);
    const dirLight = new THREE.DirectionalLight(0xbae6fd, 0.82);
    dirLight.position.set(20, 40, 30);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.set(1024, 1024);
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 120;
      const d = 35;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
    }
    scene.add(hemi, dirLight);

    const flashlight = new THREE.SpotLight(0xfffbeb, 6.8, 42, Math.PI / 5.5, 0.72, 1.3);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);

    const textures = createProceduralTextures(renderer);
    const world = buildBikiniBottomWorld(scene, textures, isSoftwareGl);

    // =========================================================================
    // VISIBLE PLAYER AVATAR + ORGANIC 3D CHARACTERS
    // =========================================================================
    const kidAvatar = createKidAvatarRig(textures);
    kidAvatar.root.position.set(0, 0, -8.8);
    scene.add(kidAvatar.root);

    const spongebob = createSpongeBobRig(textures);
    spongebob.root.position.set(2.4, 0, -0.5);
    scene.add(spongebob.root);

    const mrKrabs = createMrKrabsRig(textures);
    mrKrabs.root.position.set(0, 0, 7.2);
    mrKrabs.setMood('angry');
    scene.add(mrKrabs.root);

    const squidward = createSquidwardRig(textures);
    squidward.root.position.set(2.8, 0, 14.5);
    scene.add(squidward.root);

    const patrick = createPatrickRig(textures);
    patrick.setMood('zombie');
    patrick.root.position.set(0, 0.6, 26.5);
    scene.add(patrick.root);

    const sandy = createSandyRig(textures, isSoftwareGl);
    sandy.root.position.set(-80, 0, -4);
    scene.add(sandy.root);

    const plankton = createPlanktonRig(textures);
    plankton.root.position.set(80, 0.8, -3.5);
    scene.add(plankton.root);

    const zombieHorde: Array<{ rig: CharacterRig; offset: number }> = [];
    const hordeTints = [0x5b8c7a, 0x6b7f91, 0x738c67, 0x5f748c];
    for (let i = 0; i < 4; i++) {
      const zFish = createZombieFishRig(textures, hordeTints[i]);
      zFish.root.position.set((i - 1.5) * 3.5, 0, 16 + i * 5);
      scene.add(zFish.root);
      zombieHorde.push({ rig: zFish, offset: i * 1.4 });
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const keysPressed = new Set<string>();
    const justPressed = new Set<string>();
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keysPressed.add(e.code);
      justPressed.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };
    const onBlur = () => {
      keysPressed.clear();
      dragging = false;
    };

    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      soundEngine.unlock();
      dragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || screenRef.current !== 'playing' || activeQuizRef.current || jumpscareRef.current) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      const sens = 0.0032 * settingsRef.current.cameraSensitivity;
      simRef.current.yaw -= dx * sens;
      simRef.current.pitch = THREE.MathUtils.clamp(simRef.current.pitch - dy * sens, -0.95, 0.95);
    };
    const onPointerUp = () => {
      dragging = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);

    const placePlayerForStage = () => {
      const s = simRef.current;
      s.velY = 0;
      s.spawnGraceTimer = 1.8;
      if (s.stage === 'pos1_krusty_krab') {
        if (s.pos1SubPhase === 'waking_up' || s.pos1SubPhase === 'krabs_approaching') {
          s.playerX = 0;
          s.playerZ = -7.0;
          s.playerY = 0;
          s.yaw = Math.PI;
          s.wakeTimer = s.pos1SubPhase === 'waking_up' ? 0 : 1.5;
          world.kitchenDoor.rotation.y = s.pos1SubPhase === 'waking_up' ? 0 : 1.45;
          mrKrabs.root.position.set(0, 0, 7.2);
          mrKrabs.root.rotation.set(0, 0, 0);
          mrKrabs.setMood('angry');
        } else {
          s.playerX = 4.2;
          s.playerZ = 2.5;
          s.playerY = 0;
          s.yaw = Math.PI;
          mrKrabs.root.position.set(-6.5, 0, -8.2);
          mrKrabs.root.rotation.set(0, 0, 0);
          mrKrabs.setMood('angry');
        }
      } else if (s.stage === 'pos1_red_light') {
        s.playerX = 0;
        s.playerZ = 11.4;
        s.playerY = 0;
        s.yaw = Math.PI;
      } else if (s.stage === 'pos2_street_squidward') {
        s.playerX = 0;
        s.playerZ = 11.7;
        s.playerY = 0;
        s.yaw = Math.PI;
        squidward.setMood('angry');
        squidward.root.position.set(2.9, 0, 14.8);
      } else if (s.stage === 'pos3_patrick_obby') {
        s.playerX = 0;
        s.playerZ = 28.8;
        s.playerY = 0.6;
        s.yaw = Math.PI;
        patrick.root.position.set(0, 0.6, 26.2);
      } else if (s.stage === 'pos4_plankton_ufo') {
        s.playerX = 80;
        s.playerZ = 4.5;
        s.playerY = 0;
        s.yaw = 0;
      } else if (s.stage === 'pos5_zombie_chase') {
        s.playerX = 0;
        s.playerZ = 82.0;
        s.playerY = 0;
        s.yaw = Math.PI;
        squidward.setMood('zombie');
        squidward.root.position.set(-1.5, 0, 74);
        patrick.root.position.set(1.5, 0, 74);
        zombieHorde.forEach((zh, idx) => {
          zh.rig.root.position.set((idx - 1.5) * 1.8, 0, 71 + idx);
        });
      } else if (s.stage === 'pos6_sandy_boss') {
        s.playerX = -80;
        s.playerZ = 10.5;
        s.playerY = 0;
        s.yaw = 0;
        sandy.root.position.set(-80, 0, -5);
        spongebob.root.position.set(-77, 0, -4);
        sandy.setMood('evil');
        spongebob.setMood('evil');
      } else if (s.stage === 'pos7_tree_portal') {
        s.playerX = -80;
        s.playerZ = -18.5;
        s.playerY = 0;
        s.yaw = 0;
      }
      s.needPositionInit = false;
    };

    const moveToward = (
      rig: CharacterRig,
      tx: number,
      tz: number,
      speed: number,
      dt: number,
      stopDist = 0.6
    ): number => {
      const dx = tx - rig.root.position.x;
      const dz = tz - rig.root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > stopDist) {
        const step = Math.min(dist - stopDist, speed * dt);
        rig.root.position.x += (dx / dist) * step;
        rig.root.position.z += (dz / dist) * step;
        rig.root.rotation.y = Math.atan2(dx, dz);
      }
      return dist;
    };

    let elapsed = 0;
    let lastTime = performance.now();
    let hudTimer = 0;
    let footstepTimer = 0;
    let frameId = 0;

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
          frameId = window.setTimeout(cb, 16);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.25, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += dt;

      // Ambient underwater animation
      const bAttr = world.bubbles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < bAttr.count; i++) {
        let by = bAttr.getY(i) + dt * 1.4;
        if (by > 25) by = 0.5;
        bAttr.setY(i, by);
      }
      bAttr.needsUpdate = true;

      world.seaweeds.forEach((sw) => {
        sw.mesh.rotation.z = Math.sin(elapsed * 2.1 + sw.phase) * 0.14;
      });

      world.movingPlatforms.forEach((mp) => {
        const nx = mp.baseX + Math.sin(elapsed * mp.speed + mp.phase) * mp.rangeX;
        mp.mesh.position.x = nx;
        const halfW = (mp.platform.maxX - mp.platform.minX) / 2;
        mp.platform.minX = nx - halfW;
        mp.platform.maxX = nx + halfW;
      });

      world.krustyLights.forEach((lt, idx) => {
        const dip = idx < 2 && Math.sin(elapsed * 1.9 + idx) > 0.88 ? 0.25 : 1;
        lt.intensity = (idx < 2 ? 1.85 : 3.8) * dip + Math.sin(elapsed * (11 + idx * 4)) * 0.45;
      });

      world.clueHotspots.forEach((ch) => {
        if (ch.mesh.visible) {
          ch.mesh.rotation.y = elapsed * 1.8 + ch.index;
          ch.mesh.position.y = ch.y + Math.sin(elapsed * 2.6 + ch.index) * 0.1;
        }
      });

      if (world.mapPickup.visible) {
        world.mapPickup.rotation.y = elapsed * 2.0;
        world.mapPickup.position.y = 1.35 + Math.sin(elapsed * 2.8) * 0.12;
      }

      world.portalGroup.rotation.z = elapsed * 1.6;
      world.treeLeaves.forEach((grp, idx) => {
        grp.rotation.z = Math.sin(elapsed * 1.4 + idx) * 0.05;
      });

      const curScreen = screenRef.current;

      // =====================================================================
      // TITLE SCREEN LIVE NIGHT WORLD TOUR
      // =====================================================================
      if (curScreen === 'title' || curScreen === 'profile') {
        flashlight.intensity = 0;
        kidAvatar.root.visible = false;
        scene.environmentIntensity = 0.58;
        hemi.intensity = 0.72;
        dirLight.intensity = 0.8;
        (scene.fog as THREE.FogExp2).density = 0.011;
        const pan = Math.sin(elapsed * 0.22);
        camera.position.set(-22 + pan * 2.6, 6.2 + Math.cos(elapsed * 0.28) * 0.45, 48);
        camera.lookAt(-10, 3.0, 16);

        zombieHorde.forEach((zh, idx) => {
          zh.rig.root.position.x = -1 + Math.sin(elapsed * 0.55 + zh.offset) * 6;
          zh.rig.root.position.z = 22 + idx * 4.5;
          zh.rig.root.rotation.y = Math.cos(elapsed * 0.55 + zh.offset) >= 0 ? Math.PI / 2 : -Math.PI / 2;
          animateCharacter(zh.rig, 'walk', elapsed + zh.offset, dt);
        });

        animateCharacter(spongebob, 'idle', elapsed, dt);
        renderer.render(scene, camera);
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
        return;
      }

      // =====================================================================
      // ACTIVE GAMEPLAY LOOP
      // =====================================================================
      if (curScreen === 'playing') {
        const s = simRef.current;
        if (s.needPositionInit) {
          placePlayerForStage();
        }
        if (s.spawnGraceTimer > 0) {
          s.spawnGraceTimer = Math.max(0, s.spawnGraceTimer - dt);
        }
        if (s.enemyStunTimer > 0) {
          s.enemyStunTimer = Math.max(0, s.enemyStunTimer - dt);
        }
        if (s.pillarWarningTimer > 0) {
          s.pillarWarningTimer = Math.max(0, s.pillarWarningTimer - dt);
        }

        const frozen = Boolean(activeQuizRef.current) || jumpscareRef.current;
        const vIn = virtualInputRef.current;

        const jumpTriggered = justPressed.has('Space') || vIn.jumpPressed;
        const actionTriggered = justPressed.has('KeyE') || justPressed.has('Enter') || vIn.actionPressed;
        const flashTriggered = justPressed.has('KeyF') || vIn.flashlightTogglePressed;
        const camTriggered = justPressed.has('KeyV') || vIn.cameraTogglePressed;
        justPressed.clear();
        vIn.jumpPressed = false;
        vIn.actionPressed = false;
        vIn.flashlightTogglePressed = false;
        vIn.cameraTogglePressed = false;

        if (flashTriggered) {
          s.flashlightOn = !s.flashlightOn;
          soundEngine.playFlashlight();
        }
        if (camTriggered) {
          s.cameraView = s.cameraView === '3rd' ? '1st' : '3rd';
        }
        flashlight.intensity = s.flashlightOn ? 6.8 : 0;

        // Indoor Krusty Krab = Tense Dark Horror; Outdoor Streets/Houses/Tree = Bright & Clear!
        const insideKrustyKrab =
          s.stage === 'pos1_krusty_krab' && s.pos1SubPhase !== 'door_unlocked_outside';
        const targetEnv = insideKrustyKrab ? 0.16 : 0.58;
        const targetHemi = insideKrustyKrab ? 0.22 : 0.78;
        const targetDir = insideKrustyKrab ? 0.22 : 0.92;
        const targetFog = insideKrustyKrab ? 0.028 : 0.011;
        scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity, targetEnv, dt * 3);
        hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, targetHemi, dt * 3);
        dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, targetDir, dt * 3);
        (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
          (scene.fog as THREE.FogExp2).density,
          targetFog,
          dt * 3
        );

        let stageTitle = 'Pos 1 · Krusty Krab';
        let objectiveText = 'Cari jalan keluar dari Krusty Krab';
        let subHint = '';
        let interactPrompt: string | null = null;
        let dialogue: HudState['dialogue'] = null;
        let isHiding = false;
        let redAlertFlash = 0;
        let inputMag = 0;
        let isRunning = false;

        if (!frozen) {
          s.elapsedSeconds += dt;

          const canMove =
            !(s.stage === 'pos1_krusty_krab' && (s.pos1SubPhase === 'waking_up' || s.pos1SubPhase === 'krabs_approaching')) &&
            s.stage !== 'pos4_plankton_ufo';

          let moveF = 0;
          let moveR = 0;
          if (canMove) {
            if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveF += 1;
            if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveF -= 1;
            if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveR += 1;
            if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveR -= 1;

            moveF += vIn.moveY;
            moveR += vIn.moveX;
          }

          if (keysPressed.has('KeyQ')) s.yaw += 1.9 * dt * settingsRef.current.cameraSensitivity;
          if (keysPressed.has('KeyC')) s.yaw -= 1.9 * dt * settingsRef.current.cameraSensitivity;
          if (Math.abs(vIn.turnX) > 0.05) {
            s.yaw -= vIn.turnX * 1.9 * dt * settingsRef.current.cameraSensitivity;
          }

          inputMag = Math.hypot(moveF, moveR);
          isRunning =
            (keysPressed.has('ShiftLeft') || keysPressed.has('ShiftRight') || vIn.runHeld) &&
            inputMag > 0.1 &&
            s.stamina > 2;

          if (isRunning) {
            s.stamina = Math.max(0, s.stamina - dt * 24);
          } else {
            s.stamina = Math.min(100, s.stamina + dt * 16);
          }

          const speed = isRunning ? 8.2 : 5.1;

          _forward.set(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
          _right.set(Math.cos(s.yaw), 0, -Math.sin(s.yaw));

          const frontDoorLocked =
            s.stage === 'pos1_krusty_krab' && s.pos1SubPhase !== 'door_unlocked_outside';
          const activeWalls = frontDoorLocked
            ? world.walls
            : world.walls.filter((w) => w.id !== 'kk_front_door');

          if (inputMag > 0.05) {
            const norm = Math.min(1, inputMag) / inputMag;
            const subSteps = Math.max(1, Math.ceil(dt / 0.04));
            const subDt = dt / subSteps;
            for (let step = 0; step < subSteps; step++) {
              const vx = (_forward.x * moveF + _right.x * moveR) * norm * speed * subDt;
              const vz = (_forward.z * moveF + _right.z * moveR) * norm * speed * subDt;
              const resolved = resolveCircleWalls(s.playerX + vx, s.playerZ + vz, 0.48, activeWalls);
              s.playerX = resolved.x;
              s.playerZ = resolved.z;
            }

            if (frontDoorLocked) {
              s.playerZ = Math.min(s.playerZ, 9.32);
            }

            footstepTimer -= dt;
            if (footstepTimer <= 0 && s.playerY <= 0.85) {
              soundEngine.playFootstep(isRunning);
              footstepTimer = isRunning ? 0.28 : 0.44;
            }
          }

          // Jump, Gravity, Obby Platforms & Pos 3 Seluncuran (Slide Ramp) Physics
          const isObbyZone = s.stage === 'pos3_patrick_obby' && s.playerZ >= 26.0 && s.playerZ <= 79.0;
          let supportY: number | null = 0;
          let onSlide = false;
          if (isObbyZone) {
            const platY = findHighestSupportY(s.playerX, s.playerZ, s.playerY, 0.45, world.obbyPlatforms);
            const slideY = findSlideSurfaceY(s.playerX, s.playerZ, s.playerY, 0.45, world.slides);
            if (slideY !== null && (platY === null || slideY >= platY - 0.15)) {
              supportY = slideY;
              onSlide = true;
            } else {
              supportY = platY;
            }
          }
          const floorY = supportY !== null ? supportY : isObbyZone ? -3.0 : 0;

          if (canMove && jumpTriggered && Math.abs(s.playerY - floorY) < 0.15) {
            s.velY = 8.4;
            soundEngine.playJump();
          }

          // Downhill slide momentum on Pos 3 Seluncuran
          if (onSlide && Math.abs(s.playerY - floorY) < 0.3) {
            const slResolved = resolveCircleWalls(s.playerX, s.playerZ + 5.2 * dt, 0.48, world.walls);
            s.playerX = slResolved.x;
            s.playerZ = slResolved.z;
          }

          s.velY -= 21.0 * dt;
          s.playerY += s.velY * dt;
          if (s.playerY <= floorY) {
            s.playerY = floorY;
            s.velY = 0;
          }

          if (s.stage === 'pos6_sandy_boss') {
            const dx = s.playerX - world.sandyArenaCenter.x;
            const dz = s.playerZ - world.sandyArenaCenter.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 14.3) {
              s.playerX = world.sandyArenaCenter.x + (dx / dist) * 14.3;
              s.playerZ = world.sandyArenaCenter.z + (dz / dist) * 14.3;
            }
          }

          // =================================================================
          // STAGE-BY-STAGE SCRIPTED EVENTS & AI
          // =================================================================
          if (s.stage === 'pos1_krusty_krab') {
            stageTitle = 'Pos 1 · Krusty Krab';
            if (s.pos1SubPhase === 'waking_up') {
              s.wakeTimer += dt;
              objectiveText = 'Terbangun di dapur Krusty Krab...';
              const rise = THREE.MathUtils.clamp((s.wakeTimer - 0.25) / 1.0, 0, 1);
              s.playerY = THREE.MathUtils.lerp(-0.95, 0, rise);
              s.yaw = Math.PI + Math.sin(s.wakeTimer * 2.4) * 0.16;
              if (s.wakeTimer > 1.0 && !s.clatterPlayed) {
                s.clatterPlayed = true;
                soundEngine.playClatter();
              }
              if (s.wakeTimer >= 1.45) {
                s.playerY = 0;
                s.yaw = Math.PI;
                s.spawnGraceTimer = 0.5;
                s.pos1SubPhase = 'krabs_approaching';
                soundEngine.playDoorOpen();
              }
            } else if (s.pos1SubPhase === 'krabs_approaching') {
              objectiveText = 'AWAS! Mr. Krabs mengejar cepat dari ujung ruangan!';
              subHint = 'Bersiap menjawab soal agar Mr. Krabs pingsan!';
              world.kitchenDoor.rotation.y = THREE.MathUtils.lerp(world.kitchenDoor.rotation.y, 1.45, Math.min(1, dt * 4));
              const dist = moveToward(mrKrabs, s.playerX, s.playerZ, 5.4, dt, 2.1);
              mrKrabs.root.position.x = THREE.MathUtils.clamp(mrKrabs.root.position.x, -8.4, 8.4);
              mrKrabs.root.position.z = THREE.MathUtils.clamp(mrKrabs.root.position.z, -9.4, 9.1);
              animateCharacter(mrKrabs, 'attack', elapsed, dt);
              if (dist < 8.5) {
                redAlertFlash = THREE.MathUtils.clamp((1 - dist / 8.5) * 0.45, 0, 0.45);
              }
              if (dist <= 2.45 && s.spawnGraceTimer <= 0) {
                const picked = pickUniqueQuestion(
                  QUESTION_BANK,
                  profileRef.current.grade,
                  profileRef.current.subject,
                  s.usedQuestionIds
                );
                s.usedQuestionIds = picked.nextUsedIds;
                callbacksRef.current.onTriggerQuiz({
                  context: 'krabs_ambush',
                  title: 'HADAPI MR. KRABS!',
                  subtitle: 'Jawab benar agar Mr. Krabs pingsan, atau ia akan menerkammu!',
                  question: picked.question,
                  allowRetryOnWrong: false,
                });
              }
            } else if (s.pos1SubPhase === 'krabs_stunned_escape') {
              objectiveText = 'Mr. Krabs pingsan! Keluar dari pintu dapur!';
              subHint = 'Berjalan keluar menuju ruang makan Krusty Krab';
              mrKrabs.root.rotation.z = THREE.MathUtils.lerp(mrKrabs.root.rotation.z, Math.PI / 2, dt * 6);
              mrKrabs.root.position.y = THREE.MathUtils.lerp(mrKrabs.root.position.y, 0.35, dt * 6);
              if (s.playerZ > -2.3) {
                s.pos1SubPhase = 'meet_spongebob';
                s.dialogueTimer = 0;
                spongebob.root.position.set(1.9, 0, 0.2);
                spongebob.setMood('normal');
              }
            } else if (s.pos1SubPhase === 'meet_spongebob') {
              objectiveText = 'Bicara dengan SpongeBob';
              s.dialogueTimer += dt;
              const lines = [
                { speaker: 'SpongeBob', text: 'Hei! Kamu sudah bangun!' },
                { speaker: 'Pemain', text: 'Kamu siapa? Kenapa aku ada di sini?' },
                { speaker: 'SpongeBob', text: 'Ssst! Jangan keras-keras! Kita harus keluar dari sini! Kuncinya ada di brankas Mr. Krabs.' },
              ];
              const idx = Math.min(2, Math.floor(s.dialogueTimer / 2.6));
              dialogue = lines[idx];
              spongebob.root.lookAt(s.playerX, 0, s.playerZ);
              animateCharacter(spongebob, 'talk', elapsed, dt);
              if (s.dialogueTimer > 7.6 || actionTriggered) {
                s.pos1SubPhase = 'find_safe_code';
              }
            } else if (s.pos1SubPhase === 'find_safe_code') {
              const foundCount = s.safeDigitsFound.length;
              if (foundCount < 5) {
                objectiveText = `Cari 5 angka kode brankas (${foundCount}/5)`;
                const nextClue = world.clueHotspots.find((c) => !s.safeDigitsFound.includes(c.index));
                if (nextClue) {
                  subHint = `SpongeBob menunjuk: periksa ${nextClue.label}`;
                }
              } else if (!s.hasDoorKey) {
                objectiveText = 'Buka brankas Mr. Krabs untuk ambil kunci!';
                subHint = 'Dekati brankas di sisi kanan ruang makan lalu tekan AKSI / E';
              }

              const sbDist = moveToward(spongebob, s.playerX + 1.8, s.playerZ - 1.5, 4.3, dt, 1.4);
              animateCharacter(spongebob, sbDist > 1.6 ? 'walk' : 'talk', elapsed, dt);

              world.clueHotspots.forEach((ch) => {
                const collected = s.safeDigitsFound.includes(ch.index);
                ch.mesh.visible = !collected;
                if (!collected) {
                  const d = Math.hypot(s.playerX - ch.x, s.playerZ - ch.z);
                  if (d < 2.2) {
                    interactPrompt = `Tekan AKSI [E]: Pecahkan Soal ${ch.label}`;
                    if (actionTriggered) {
                      const picked = pickUniqueQuestion(
                        QUESTION_BANK,
                        profileRef.current.grade,
                        profileRef.current.subject,
                        s.usedQuestionIds
                      );
                      s.usedQuestionIds = picked.nextUsedIds;
                      callbacksRef.current.onTriggerQuiz({
                        context: 'safe_digit',
                        title: `Kode Brankas · Digit #${ch.index + 1}`,
                        subtitle: `Angka rahasia ke-${ch.index + 1} terbuka jika jawaban benar!`,
                        question: picked.question,
                        digitIndex: ch.index,
                        totalDigits: 5,
                        allowRetryOnWrong: true,
                      });
                    }
                  }
                }
              });

              if (foundCount === 5 && !s.hasDoorKey) {
                const dSafe = Math.hypot(s.playerX - 6.3, s.playerZ - 0.4);
                if (dSafe < 2.6) {
                  interactPrompt = 'Tekan AKSI [E]: Buka Brankas & Ambil Kunci Pintu';
                  if (actionTriggered) {
                    s.hasDoorKey = true;
                    world.safeDoor.rotation.y = -1.6;
                    world.safeKeyMesh.visible = false;
                    soundEngine.playDoorOpen();
                    mrKrabs.root.rotation.set(0, 0, 0);
                    mrKrabs.root.position.set(-6.5, 0, -8.2);
                    s.spawnGraceTimer = 1.5;
                    s.pos1SubPhase = 'safe_unlocked_chase';
                    soundEngine.setMusicMode('chase');
                  }
                }
              }

              if (!s.hasDoorKey && Math.hypot(s.playerX, s.playerZ - 9.6) < 2.6) {
                interactPrompt = `Pintu Terkunci! Ambil Kunci di Brankas Mr. Krabs (${foundCount}/5 kode)`;
                if (actionTriggered) {
                  soundEngine.playWrong();
                  dialogue = {
                    speaker: 'SpongeBob',
                    text: 'Pintunya terkunci rapat! Kita harus buka brankas Mr. Krabs dan ambil kuncinya dulu!',
                  };
                }
              }
            } else if (s.pos1SubPhase === 'safe_unlocked_chase') {
              objectiveText = 'Keluar ke pintu utama! Mr. Krabs mengejar pelan dari belakang!';
              subHint = 'Menuju pintu depan Krusty Krab dan tekan AKSI / E';
              dialogue = {
                speaker: 'Mr. Krabs',
                text: 'BERHENTI! KEMBALIKAN KUNCI DAN UANGKU!',
                tone: 'warning',
              };
              const distK = moveToward(mrKrabs, s.playerX, s.playerZ, 1.25, dt, 0.4);
              // STRICT: Mr. Krabs NEVER leaves Krusty Krab!
              mrKrabs.root.position.x = THREE.MathUtils.clamp(mrKrabs.root.position.x, -8.4, 8.4);
              mrKrabs.root.position.z = THREE.MathUtils.clamp(mrKrabs.root.position.z, -9.4, 9.1);
              animateCharacter(mrKrabs, 'walk', elapsed, dt);
              redAlertFlash = THREE.MathUtils.clamp((1 - distK / 11) * 0.55, 0.08, 0.55);

              const sbDist = moveToward(spongebob, s.playerX + 1.5, s.playerZ + 1.5, 5.2, dt, 1.3);
              animateCharacter(spongebob, sbDist > 1.5 ? 'run' : 'scared', elapsed, dt);

              if (distK < 1.35 && s.spawnGraceTimer <= 0) {
                callbacksRef.current.onTriggerJumpscare(
                  'mr_krabs',
                  'TERTANGKAP MR. KRABS!',
                  'Mr. Krabs merebut kembali kuncinya!'
                );
              }

              const dDoor = Math.hypot(s.playerX - 0, s.playerZ - 9.6);
              if (dDoor < 2.5) {
                interactPrompt = 'Tekan AKSI [E]: Keluar dari Krusty Krab!';
                if (actionTriggered) {
                  soundEngine.playDoorOpen();
                  world.frontDoorLeft.rotation.y = -1.4;
                  world.frontDoorRight.rotation.y = 1.4;
                  s.playerX = 0;
                  s.playerZ = 11.2;
                  s.pos1SubPhase = 'door_unlocked_outside';
                  s.doorBangTimer = 0;
                  s.doorBangPlayed = false;
                  soundEngine.setMusicMode('explore');
                }
              }
            } else if (s.pos1SubPhase === 'door_unlocked_outside') {
              objectiveText = 'Berhasil keluar dari Krusty Krab! Menuju Pos 2...';
              subHint = 'Mr. Krabs terkunci di dalam! Hati-hati rumah Squidward di depan.';
              s.doorBangTimer += dt;
              // Mr. Krabs bangs on the door from inside — CANNOT EXIT Krusty Krab!
              mrKrabs.root.position.set(0, 0, 8.8);
              mrKrabs.root.rotation.set(0, 0, 0);
              animateCharacter(mrKrabs, 'angry', elapsed, dt);
              world.frontDoorLeft.rotation.y = THREE.MathUtils.lerp(world.frontDoorLeft.rotation.y, 0, dt * 8);
              world.frontDoorRight.rotation.y = THREE.MathUtils.lerp(world.frontDoorRight.rotation.y, 0, dt * 8);

              if (s.doorBangTimer < 2.2) {
                world.frontDoorGroup.position.z = 10.1 + Math.sin(elapsed * 42) * 0.08;
                dialogue = {
                  speaker: 'Mr. Krabs',
                  text: 'GRRR!! AKU TERKUNCI DI DALAM! AWAS KALIAN!',
                  tone: 'warning',
                };
                if (!s.doorBangPlayed) {
                  s.doorBangPlayed = true;
                  soundEngine.playDoorBang();
                }
              } else {
                world.frontDoorGroup.position.z = 10.1;
              }

              const sbDist = moveToward(spongebob, s.playerX + 1.8, s.playerZ - 0.6, 4.8, dt, 1.3);
              animateCharacter(spongebob, sbDist > 1.5 ? 'walk' : 'idle', elapsed, dt);

              if (s.doorBangTimer >= 1.8 || s.playerZ >= 11.8) {
                s.stage = 'pos2_street_squidward';
                s.checkpointsCleared = Math.max(s.checkpointsCleared, 1);
                s.gateTriggered = null;
                s.spawnGraceTimer = 1.0;
                squidward.setMood('angry');
                squidward.root.position.set(2.9, 0, 14.8);
                callbacksRef.current.onSaveCheckpoint({
                  profile: profileRef.current,
                  stage: 'pos2_street_squidward',
                  pos1SubPhase: s.pos1SubPhase,
                  safeDigitsFound: [...s.safeDigitsFound],
                  safeCodeTarget: [...s.safeCodeTarget],
                  hasDoorKey: s.hasDoorKey,
                  hasMap: s.hasMap,
                  sandyBattleCorrect: s.sandyBattleCorrect,
                  camelliaStep: s.camelliaStep,
                  usedQuestionIds: [...s.usedQuestionIds],
                  records: [...s.records],
                  checkpointsCleared: s.checkpointsCleared,
                  elapsedSeconds: s.elapsedSeconds,
                  savedAt: Date.now(),
                });
              }
            }
          } else {
            // Mr. Krabs STRICTLY stays parked inside Krusty Krab for all stages Pos 2..Pos 7!
            mrKrabs.root.position.set(-2, 0, 5.5);
            mrKrabs.root.rotation.set(0, 0, 0);
            world.frontDoorGroup.position.z = 10.1;
          }

          if (s.stage === 'pos1_red_light') {
            // Directly advance to Pos 2 with no post-door question
            s.stage = 'pos2_street_squidward';
            s.checkpointsCleared = Math.max(s.checkpointsCleared, 1);
          } else if (s.stage === 'pos2_street_squidward') {
            stageTitle = 'Pos 2 · Rumah Squidward & Rumput Laut 1m';
            objectiveText = 'Lewati rumah Squidward — JANGAN sentuh rumput laut 1 meter di jalan!';
            subHint = 'Cari celah jalan di antara rumpun rumput laut hijau menuju Pos 3';
            dialogue = {
              speaker: 'SpongeBob',
              text: 'Hati-hati! Rumput laut setinggi 1 meter di depan rumah Squidward sangat sensitif!',
            };

            const sbDist = moveToward(spongebob, s.playerX + 1.9, s.playerZ - 1.5, 4.8, dt, 1.4);
            animateCharacter(spongebob, sbDist > 1.6 ? 'walk' : 'idle', elapsed, dt);
            squidward.root.lookAt(s.playerX, 0, s.playerZ);
            animateCharacter(squidward, 'angry', elapsed, dt);

            if (s.spawnGraceTimer <= 0) {
              for (const sw of world.seaweeds) {
                if (checkCircleOverlap(s.playerX, s.playerZ, 0.42, sw.x, sw.z, sw.radius)) {
                  squidward.setMood('angry');
                  soundEngine.playSquidwardAngry();
                  callbacksRef.current.onTriggerJumpscare(
                    'squidward',
                    'JUMPSCARE SQUIDWARD!',
                    'Kamu menyentuh rumput laut 1 meter di depan rumah Squidward!'
                  );
                  break;
                }
              }
            }

            if (s.playerZ >= 24.5 && s.gateTriggered !== 'pos2_gate') {
              s.gateTriggered = 'pos2_gate';
              const picked = pickUniqueQuestion(
                QUESTION_BANK,
                profileRef.current.grade,
                profileRef.current.subject,
                s.usedQuestionIds
              );
              s.usedQuestionIds = picked.nextUsedIds;
              callbacksRef.current.onTriggerQuiz({
                context: 'pos2_gate',
                title: 'Gerbang Pos 2 → Pos 3 (Obby Patrick)',
                subtitle: 'Jawab soal ini untuk menyimpan checkpoint & masuk Pos 3!',
                question: picked.question,
                allowRetryOnWrong: true,
              });
            }
          } else if (s.stage === 'pos3_patrick_obby') {
            stageTitle = 'Pos 3 · Obby Patrick, Seluncuran & Peta';
            if (!s.hasMap) {
              objectiveText = 'Naik & turun obby, meluncur di seluncuran, lalu pilih jalan KANAN untuk ambil Peta!';
              subHint = 'Ikuti papan petunjuk: "Kalo kanan kamu benar!" — Hindari jalan KIRI yang sesat!';
            } else {
              objectiveText = 'Peta Bikini Bottom ditemukan! Lanjut ke Pos 4!';
            }
            dialogue = {
              speaker: 'Zombie Patrick',
              text: 'GRRRAAAAGHHH!!',
              tone: 'creepy',
            };

            const dPat = moveToward(patrick, s.playerX, s.playerZ, 2.55, dt, 0.4);
            patrick.root.position.y = Math.max(0.5, s.playerY * 0.85);
            animateCharacter(patrick, 'attack', elapsed, dt);

            const sbDist = moveToward(spongebob, s.playerX + 2.2, s.playerZ + 1.5, 5.2, dt, 1.4);
            animateCharacter(spongebob, sbDist > 1.5 ? 'run' : 'idle', elapsed, dt);

            // Wrong Fork Trap (LEFT PATH = SESAT!)
            if (s.playerX < -1.8 && s.playerZ >= 73.5 && s.spawnGraceTimer <= 0) {
              soundEngine.playZombieGrowl();
              callbacksRef.current.onTriggerJumpscare(
                'patrick',
                'JALAN KIRI SESAT!',
                'Papan sudah memperingatkanmu: jalan ke kiri membuatmu tersesat dan diterkam Patrick!'
              );
            } else if (
              s.spawnGraceTimer <= 0 &&
              (s.playerY < -0.5 || (dPat < 1.25 && Math.abs(patrick.root.position.y - s.playerY) < 1.5))
            ) {
              soundEngine.playZombieGrowl();
              callbacksRef.current.onTriggerJumpscare(
                'patrick',
                'TERTANGKAP ZOMBIE PATRICK!',
                s.playerY < -0.5 ? 'Kamu terjatuh ke jurang bawah laut!' : 'Zombie Patrick berhasil menangkapmu!'
              );
            }

            // Map pickup at end of Right Path (x: 3.6, z: 77.2)
            const dMap = Math.hypot(s.playerX - 3.6, s.playerZ - 77.2);
            if (!s.hasMap && dMap < 2.2) {
              s.hasMap = true;
              world.mapPickup.visible = false;
              soundEngine.playSafeClick();
            }

            if (s.hasMap && s.gateTriggered !== 'pos3_gate') {
              s.gateTriggered = 'pos3_gate';
              const picked = pickUniqueQuestion(
                QUESTION_BANK,
                profileRef.current.grade,
                profileRef.current.subject,
                s.usedQuestionIds
              );
              s.usedQuestionIds = picked.nextUsedIds;
              callbacksRef.current.onTriggerQuiz({
                context: 'pos3_gate',
                title: 'Pos 3 → Pos 4 · Peta Bikini Bottom Didapat!',
                subtitle: 'Jawab soal ini untuk lanjut bertemu Plankton di Pos 4!',
                question: picked.question,
                allowRetryOnWrong: true,
              });
            }
          } else if (s.stage === 'pos4_plankton_ufo') {
            stageTitle = 'Pos 4 · Peringatan Plankton';
            objectiveText = 'Dengarkan kebenaran tentang wabah zombie Bikini Bottom!';
            s.dialogueTimer += dt;
            plankton.root.position.set(80, 0.8, -2.5);
            plankton.root.lookAt(s.playerX, 0.8, s.playerZ);
            animateCharacter(plankton, 'talk', elapsed, dt);

            const pos4Lines = [
              {
                speaker: 'Plankton',
                text: 'SpongeBob itu JAHAT! Dialah yang mengubah seluruh warga Bikini Bottom menjadi zombie!',
                tone: 'warning' as const,
              },
              {
                speaker: 'Plankton',
                text: 'Pergilah ke Pohon Kamelia Besar di balik bukit untuk keluar dari dunia ini!',
                tone: 'warning' as const,
              },
              {
                speaker: 'Pemain',
                text: 'Aku tidak percaya! SpongeBob menolongku sejak awal!',
              },
              {
                speaker: 'SpongeBob (Marah!)',
                text: 'JANGAN DENGARKAN DIA! CEPAT LARI KE RUMAH SANDY SEKARANG!!',
                tone: 'warning' as const,
              },
              {
                speaker: 'Plankton',
                text: 'Awas!! Jangan ke Rumah Sandy—itu jebakan!!',
                tone: 'warning' as const,
              },
            ];
            const idx = Math.min(4, Math.floor(s.dialogueTimer / 2.6));
            dialogue = pos4Lines[idx];

            if (idx >= 3) {
              spongebob.root.position.set(78.5, 0, -1.6);
              spongebob.root.lookAt(s.playerX, 0, s.playerZ);
              spongebob.setMood('angry');
              animateCharacter(spongebob, 'angry', elapsed, dt);
            } else {
              spongebob.root.position.set(84.5, 0, 2.5);
              spongebob.setMood('normal');
              animateCharacter(spongebob, 'idle', elapsed, dt);
            }

            if (s.dialogueTimer >= 10.6) {
              s.ufoChoicePending = true;
              interactPrompt = 'Tekan AKSI [E] atau tombol lanjut untuk Lari ke Rumah Sandy';
              if (actionTriggered && s.gateTriggered !== 'pos4_gate') {
                s.gateTriggered = 'pos4_gate';
                const picked = pickUniqueQuestion(
                  QUESTION_BANK,
                  profileRef.current.grade,
                  profileRef.current.subject,
                  s.usedQuestionIds
                );
                s.usedQuestionIds = picked.nextUsedIds;
                callbacksRef.current.onTriggerQuiz({
                  context: 'pos4_gate',
                  title: 'Pos 4 → Pos 5 · Lari ke Rumah Sandy',
                  subtitle: 'Jawab soal ini sebelum berlari melewati jalan penuh zombie!',
                  question: picked.question,
                  allowRetryOnWrong: true,
                });
              }
            }
          } else if (s.stage === 'pos5_zombie_chase') {
            stageTitle = 'Pos 5 · Jalan Penuh Rumah & Zombie';
            objectiveText = 'LARI SECEPATNYA menuju Kubah Rumah Sandy di ujung jalan!';
            subHint = 'Gunakan LARI [SHIFT / RUN] menyusuri perumahan Bikini Bottom!';
            redAlertFlash = 0.16 + Math.abs(Math.sin(elapsed * 9)) * 0.2;

            squidward.setMood('zombie');
            const dSq = moveToward(squidward, s.playerX - 1.2, s.playerZ, 4.35, dt, 0.3);
            animateCharacter(squidward, 'run', elapsed, dt);

            const dPa = moveToward(patrick, s.playerX + 1.2, s.playerZ, 4.3, dt, 0.3);
            patrick.root.position.y = 0;
            animateCharacter(patrick, 'run', elapsed, dt);

            zombieHorde.forEach((zh, idx) => {
              if (zh.rig.root.position.z < 68) {
                zh.rig.root.position.set((idx - 1.5) * 1.8, 0, 71 + idx);
              }
              moveToward(zh.rig, s.playerX + (idx - 1.5) * 1.2, s.playerZ, 4.15, dt, 0.4);
              animateCharacter(zh.rig, 'run', elapsed + zh.offset, dt);
            });

            if ((dSq < 1.35 || dPa < 1.35) && s.spawnGraceTimer <= 0) {
              soundEngine.playZombieGrowl();
              callbacksRef.current.onTriggerJumpscare(
                'squidward',
                'DIKEPUNG ZOMBIE BIKINI BOTTOM!',
                'Gerombolan zombie berhasil mengejarmu di jalan!'
              );
            }

            if (s.playerZ >= 136 && s.gateTriggered !== 'pos5_gate') {
              s.gateTriggered = 'pos5_gate';
              const picked = pickUniqueQuestion(
                QUESTION_BANK,
                profileRef.current.grade,
                profileRef.current.subject,
                s.usedQuestionIds
              );
              s.usedQuestionIds = picked.nextUsedIds;
              callbacksRef.current.onTriggerQuiz({
                context: 'pos5_gate',
                title: 'Pos 5 → Pos 6 · Pintu Kubah Rumah Sandy',
                subtitle: 'Jawab soal ini untuk masuk berlindung ke dalam Rumah Sandy!',
                question: picked.question,
                allowRetryOnWrong: true,
              });
            }
          } else if (s.stage === 'pos6_sandy_boss') {
            stageTitle = 'Pos 6 · Jebakan Sandy & SpongeBob';
            s.dialogueTimer += dt;

            if (s.dialogueTimer < 5.5) {
              objectiveText = 'Sandy & SpongeBob ingin memakanmu!!';
              if (s.dialogueTimer < 2.8) {
                dialogue = {
                  speaker: 'Sandy',
                  text: 'Kamu masuk perangkap! Sekarang kami lapar—waktunya makan besar!',
                  tone: 'creepy',
                };
              } else {
                dialogue = {
                  speaker: 'SpongeBob',
                  text: 'HAHAHA! Plankton benar! Kami akan memakanmu hidup-hidup!!',
                  tone: 'creepy',
                };
              }
              animateCharacter(sandy, 'talk', elapsed, dt);
              animateCharacter(spongebob, 'angry', elapsed, dt);
            } else {
              objectiveText = `Bertahan! Jawab 5 Soal Benar agar Tidak Dimakan (${s.sandyBattleCorrect}/5)`;
              subHint =
                s.enemyStunTimer > 0
                  ? 'Mereka terpukul mundur! Bersiap untuk soal berikutnya...'
                  : 'Bersembunyi di balik semak/peti atau hadapi mereka lalu tekan AKSI [E] untuk menjawab soal!';

              isHiding = world.hidingSpots.some((hs) =>
                checkCircleOverlap(s.playerX, s.playerZ, 0.5, hs.x, hs.z, hs.radius)
              );

              const dSandy = Math.hypot(s.playerX - sandy.root.position.x, s.playerZ - sandy.root.position.z);
              const dSb = Math.hypot(s.playerX - spongebob.root.position.x, s.playerZ - spongebob.root.position.z);
              const nearest = Math.min(dSandy, dSb);

              if (s.enemyStunTimer > 0) {
                // Knocked back while stunned after answering right
                moveToward(sandy, -82, -8, 5.0, dt, 0.4);
                moveToward(spongebob, -77, -8, 5.0, dt, 0.4);
                animateCharacter(sandy, 'scared', elapsed, dt);
                animateCharacter(spongebob, 'scared', elapsed, dt);
              } else {
                s.suspicion = computeStealthSuspicion(dt, s.suspicion, isHiding, nearest);
                const tSandyX = isHiding ? -80 + Math.sin(elapsed * 0.65) * 7.5 : s.playerX - 0.8;
                const tSandyZ = isHiding ? Math.cos(elapsed * 0.55) * 6.0 : s.playerZ;
                const tSbX = isHiding ? -80 + Math.cos(elapsed * 0.6) * 7.5 : s.playerX + 0.8;
                const tSbZ = isHiding ? Math.sin(elapsed * 0.65) * 6.5 : s.playerZ;

                moveToward(sandy, tSandyX, tSandyZ, isHiding ? 2.5 : 3.2, dt, 0.4);
                moveToward(spongebob, tSbX, tSbZ, isHiding ? 2.6 : 3.3, dt, 0.4);
                animateCharacter(sandy, isHiding ? 'walk' : 'attack', elapsed, dt);
                animateCharacter(spongebob, isHiding ? 'walk' : 'attack', elapsed, dt);

                if (nearest < 8) {
                  interactPrompt = `Tekan AKSI [E]: Jawab Soal Pertahanan (${s.sandyBattleCorrect + 1}/5)`;
                }

                const triggeredByTrap =
                  s.spawnGraceTimer <= 0 && (nearest < 2.6 || s.suspicion >= 96);
                const triggeredManually = actionTriggered && nearest < 8;

                if (triggeredByTrap || triggeredManually) {
                  const picked = pickUniqueQuestion(
                    QUESTION_BANK,
                    profileRef.current.grade,
                    profileRef.current.subject,
                    s.usedQuestionIds
                  );
                  s.usedQuestionIds = picked.nextUsedIds;
                  callbacksRef.current.onTriggerQuiz({
                    context: 'sandy_survive',
                    title: `Bertahan dari Sandy & SpongeBob (${s.sandyBattleCorrect + 1}/5)`,
                    subtitle: 'Jawab BENAR untuk memukul mundur mereka! Jika salah, kamu akan dimakan!',
                    question: picked.question,
                    allowRetryOnWrong: false,
                  });
                }
              }
            }
          } else if (s.stage === 'pos7_tree_portal') {
            stageTitle = 'Pos 7 · Teka-Teki Pohon Kamelia Besar';

            // Update visual highlight of the 4 Camellia Pillars
            world.camelliaPillars.forEach((p) => {
              const mat = p.orb.material as THREE.MeshStandardMaterial;
              p.orb.rotation.y = elapsed * 2.1 + p.index;
              if (p.index < s.camelliaStep) {
                mat.color.setHex(0x10b981);
                mat.emissive.setHex(0x10b981);
                mat.emissiveIntensity = 1.6;
                p.light.intensity = 2.4;
                p.orb.scale.setScalar(1.0);
              } else if (p.index === s.camelliaStep) {
                mat.emissiveIntensity = 1.8 + Math.sin(elapsed * 6) * 0.5;
                p.light.intensity = 3.0;
                p.orb.scale.setScalar(1.22 + Math.sin(elapsed * 5) * 0.12);
              } else {
                mat.emissiveIntensity = 0.35;
                p.light.intensity = 0.6;
                p.orb.scale.setScalar(0.9);
              }
            });

            if (s.camelliaStep < 4) {
              const targetPillar = world.camelliaPillars[s.camelliaStep];
              objectiveText = `Pecahkan Teka-Teki 4 Pilar Kamelia (${s.camelliaStep}/4)`;
              subHint = `Petunjuk Peta (${s.camelliaStep + 1}/4): "${targetPillar.clueText}" (${targetPillar.symbolName})`;
              if (s.pillarWarningTimer > 0) {
                dialogue = {
                  speaker: 'Peta Bikini Bottom',
                  text: `Urutan pilar salah! Ikuti petunjuk: "${targetPillar.clueText}"`,
                  tone: 'warning',
                };
              }

              for (const p of world.camelliaPillars) {
                const dp = Math.hypot(s.playerX - p.x, s.playerZ - p.z);
                if (dp < 2.7 && p.index >= s.camelliaStep) {
                  interactPrompt = `Tekan AKSI [E]: Aktifkan ${p.symbolName}`;
                  if (actionTriggered) {
                    if (p.index === s.camelliaStep) {
                      s.camelliaStep += 1;
                      soundEngine.playSafeClick();
                      if (s.camelliaStep >= 4) {
                        world.portalLight.intensity = 5.5;
                        soundEngine.playPortal();
                      }
                    } else {
                      soundEngine.playWrong();
                      s.pillarWarningTimer = 3.0;
                    }
                  }
                  break;
                }
              }
            } else {
              world.portalLight.intensity = 5.5;
              objectiveText = 'Portal Kamelia Terbuka! Masuk untuk Pulang ke Dunia Asli!';
              subHint = 'Masuk ke portal bercahaya di batang Pohon Kamelia & jawab teka-teki terakhir';
              const dPortal = Math.hypot(
                s.playerX - world.greatTreePos.x,
                s.playerZ - (world.greatTreePos.z + 2.7)
              );
              if (dPortal < 3.0) {
                interactPrompt = 'Tekan AKSI [E]: Buka Segel Portal Pulang!';
                if ((actionTriggered || dPortal < 1.55) && s.gateTriggered !== 'portal_riddle') {
                  s.gateTriggered = 'portal_riddle';
                  const picked = pickUniqueQuestion(
                    QUESTION_BANK,
                    profileRef.current.grade,
                    profileRef.current.subject,
                    s.usedQuestionIds
                  );
                  s.usedQuestionIds = picked.nextUsedIds;
                  callbacksRef.current.onTriggerQuiz({
                    context: 'portal_riddle',
                    title: 'Segel Terakhir Portal Pohon Kamelia',
                    subtitle: 'Jawab 1 soal terakhir ini untuk kembali ke dunia asli bersama teman-temanmu!',
                    question: picked.question,
                    allowRetryOnWrong: true,
                  });
                }
              }
            }
          }

          // =================================================================
          // VISIBLE PLAYER AVATAR + 3RD/1ST PERSON CAMERA RIG
          // =================================================================
          const isWaking = s.stage === 'pos1_krusty_krab' && s.pos1SubPhase === 'waking_up';
          kidAvatar.root.position.set(s.playerX, s.playerY, s.playerZ);
          kidAvatar.root.rotation.y = s.yaw + Math.PI;
          kidAvatar.root.visible = s.cameraView === '3rd' && !isWaking;
          animateCharacter(
            kidAvatar,
            isRunning ? 'run' : inputMag > 0.1 ? 'walk' : 'idle',
            elapsed,
            dt
          );

          const bob = inputMag > 0.1 && canMove ? Math.sin(elapsed * (isRunning ? 14 : 9)) * 0.045 : 0;
          const shakeAmp =
            s.stage === 'pos5_zombie_chase' || s.pos1SubPhase === 'safe_unlocked_chase' ? 0.025 : 0;
          const sx = (Math.random() - 0.5) * shakeAmp;
          const sy = (Math.random() - 0.5) * shakeAmp;

          if (s.cameraView === '1st' || isWaking) {
            camera.position.set(s.playerX + sx, s.playerY + 1.55 + bob + sy, s.playerZ);
          } else {
            // Smooth 3rd-person follow camera clamped against walls so it stays inside rooms!
            const maxDist = 3.0;
            let safeDist = maxDist;
            for (let t = 0.2; t <= 1.0; t += 0.2) {
              const testX = s.playerX + Math.sin(s.yaw) * maxDist * t;
              const testZ = s.playerZ + Math.cos(s.yaw) * maxDist * t;
              const res = resolveCircleWalls(testX, testZ, 0.35, world.walls);
              if (Math.hypot(res.x - testX, res.z - testZ) > 0.12) {
                safeDist = Math.max(0.7, maxDist * (t - 0.2));
                break;
              }
            }
            const camX = s.playerX + Math.sin(s.yaw) * safeDist + sx;
            const camZ = s.playerZ + Math.cos(s.yaw) * safeDist;
            const camY = Math.max(s.playerY + 0.7, s.playerY + 1.85 - Math.sin(s.pitch) * 1.2 + bob * 0.4 + sy);
            camera.position.set(camX, camY, camZ);
          }
          camera.rotation.order = 'YXZ';
          camera.rotation.y = s.yaw;
          camera.rotation.x = s.pitch;
        }

        // Throttled HUD sync (~10Hz)
        hudTimer += dt;
        if (hudTimer >= 0.1) {
          hudTimer = 0;
          const s = simRef.current;
          const wakeProg =
            s.stage === 'pos1_krusty_krab' && s.pos1SubPhase === 'waking_up'
              ? THREE.MathUtils.clamp(s.wakeTimer / 1.35, 0, 1)
              : 1;
          const blurAmount = wakeProg < 1 ? Math.round((1 - wakeProg) * 7) : 0;

          callbacksRef.current.onHudUpdate({
            stage: s.stage,
            stageTitle,
            objectiveText,
            subHint,
            flashlightOn: s.flashlightOn,
            cameraView: s.cameraView,
            stamina: Math.round(s.stamina),
            isHiding,
            suspicionLevel: Math.round(s.suspicion),
            safeDigitsFound: [...s.safeDigitsFound],
            safeCodeTarget: [...s.safeCodeTarget],
            hasDoorKey: s.hasDoorKey,
            hasMap: s.hasMap,
            sandyBattleCorrect: s.sandyBattleCorrect,
            camelliaStep: s.camelliaStep,
            interactPrompt,
            dialogue,
            wakeProgress: wakeProg,
            blurAmount,
            redAlertFlash,
            checkpointsCleared: s.checkpointsCleared,
            answeredCount: s.records.length,
            elapsedSeconds: s.elapsedSeconds,
            climbProgress: s.camelliaStep / 4,
            ufoChoicePending: s.ufoChoicePending,
          });
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="game-canvas"
      className="fixed inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
    />
  );
}
