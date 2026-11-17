import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActiveQuizPrompt,
  CheckpointSave,
  FinalGameStats,
  GameScreen,
  GameSettings,
  HudState,
  JumpscareCharacter,
  JumpscareState,
  PlayerProfile,
  QuestionRecord,
} from './types/game';
import {
  calculateFinalStats,
  CHECKPOINT_STORAGE_KEY,
  generateSafeCode,
  parseCheckpoint,
  serializeCheckpoint,
} from './game/rules';
import { GameCanvas, VirtualInputState } from './components/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { CinematicCutscene } from './components/CinematicCutscene';
import { GameHUD } from './components/GameHUD';
import { QuestionModal } from './components/QuestionModal';
import { JumpscareOverlay } from './components/JumpscareOverlay';
import { PauseModal } from './components/PauseModal';
import { ResultsScreen } from './components/ResultsScreen';
import { soundEngine } from './audio/soundEngine';

const DEFAULT_HUD: HudState = {
  stage: 'pos1_krusty_krab',
  stageTitle: 'Pos 1 · Krusty Krab',
  objectiveText: 'Terbangun di dapur Krusty Krab...',
  subHint: '',
  flashlightOn: true,
  cameraView: '3rd',
  stamina: 100,
  isHiding: false,
  suspicionLevel: 0,
  safeDigitsFound: [],
  safeCodeTarget: [3, 7, 1, 9, 4],
  hasDoorKey: false,
  hasMap: false,
  sandyBattleCorrect: 0,
  camelliaStep: 0,
  interactPrompt: null,
  dialogue: null,
  wakeProgress: 0,
  blurAmount: 8,
  redAlertFlash: 0,
  checkpointsCleared: 0,
  answeredCount: 0,
  elapsedSeconds: 0,
  climbProgress: 0,
  ufoChoicePending: false,
};

function createFreshCheckpoint(profile: PlayerProfile): CheckpointSave {
  return {
    profile,
    stage: 'pos1_krusty_krab',
    pos1SubPhase: 'waking_up',
    safeDigitsFound: [],
    safeCodeTarget: generateSafeCode(),
    hasDoorKey: false,
    hasMap: false,
    sandyBattleCorrect: 0,
    camelliaStep: 0,
    usedQuestionIds: [],
    records: [],
    checkpointsCleared: 0,
    elapsedSeconds: 0,
    savedAt: Date.now(),
  };
}

export default function App() {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [screen, setScreen] = useState<GameScreen>(autostart ? 'playing' : 'title');
  const [profile, setProfile] = useState<PlayerProfile>({
    playerName: autostart ? 'Petualang' : '',
    grade: 7,
    subject: 'matematika',
  });
  const [settings, setSettings] = useState<GameSettings>(() => {
    const isTouchOrSmall =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)').matches);
    return {
      cameraSensitivity: 1.0,
      musicVolume: 0.5,
      sfxVolume: 0.75,
      muted: false,
      graphicsQuality: 'high',
      controlMode: isTouchOrSmall ? 'hp' : 'laptop',
    };
  });

  const [savedCheckpoint, setSavedCheckpoint] = useState<CheckpointSave | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseCheckpoint(window.localStorage.getItem(CHECKPOINT_STORAGE_KEY));
  });

  const [activeCheckpoint, setActiveCheckpoint] = useState<CheckpointSave | null>(() =>
    autostart ? createFreshCheckpoint({ playerName: 'Petualang', grade: 7, subject: 'matematika' }) : null
  );

  const [hud, setHud] = useState<HudState>(DEFAULT_HUD);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuizPrompt | null>(null);
  const [jumpscare, setJumpscare] = useState<JumpscareState>({
    active: false,
    character: 'mr_krabs',
    title: '',
    subtitle: '',
  });
  const [quizResultSignal, setQuizResultSignal] = useState<{
    seq: number;
    context: ActiveQuizPrompt['context'];
    isCorrect: boolean;
    record: QuestionRecord;
    digitIndex?: number;
  } | null>(null);
  const [respawnSignal, setRespawnSignal] = useState(0);
  const [ufoConfirmSignal, setUfoConfirmSignal] = useState(0);
  const [finalStats, setFinalStats] = useState<FinalGameStats | null>(null);

  const virtualInputRef = useRef<VirtualInputState>({
    moveX: 0,
    moveY: 0,
    turnX: 0,
    jumpPressed: false,
    runHeld: false,
    actionPressed: false,
    flashlightTogglePressed: false,
    cameraTogglePressed: false,
  });

  // Sync audio settings & music mode
  useEffect(() => {
    soundEngine.setSettings(settings.musicVolume, settings.sfxVolume, settings.muted);
    if (screen === 'title' || screen === 'profile') {
      soundEngine.setMusicMode('menu');
    } else if (screen === 'playing') {
      soundEngine.setMusicMode('explore');
    } else if (screen === 'paused' || screen === 'results') {
      soundEngine.stopMusic();
    }
  }, [settings, screen]);

  // Sync document.body.dataset.state for game shell state machine
  useEffect(() => {
    if (screen === 'title' || screen === 'profile') {
      document.body.dataset.state = 'title';
    } else if (screen === 'playing' || screen === 'cutscene_intro' || screen === 'cutscene_ending') {
      document.body.dataset.state = 'playing';
    } else if (screen === 'paused') {
      document.body.dataset.state = 'paused';
    } else if (screen === 'results') {
      document.body.dataset.state = 'gameover';
    }
  }, [screen]);

  // Global keyboard shortcuts (Enter/Space on Title, Escape/P for Pause, M for Mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        soundEngine.unlock();
        setScreen('profile');
      } else if (screen === 'playing' && !activeQuiz && !jumpscare.active && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        setScreen('paused');
      } else if (screen === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        setScreen('playing');
      } else if (e.code === 'KeyM' && screen !== 'profile') {
        setSettings((prev) => ({ ...prev, muted: !prev.muted }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, activeQuiz, jumpscare.active]);

  const handleStartNew = useCallback((chosenProfile: PlayerProfile) => {
    soundEngine.unlock();
    setProfile(chosenProfile);
    const fresh = createFreshCheckpoint(chosenProfile);
    setActiveCheckpoint(fresh);
    setActiveQuiz(null);
    setJumpscare({ active: false, character: 'mr_krabs', title: '', subtitle: '' });
    setFinalStats(null);
    setScreen('cutscene_intro');
  }, []);

  const handleContinueCheckpoint = useCallback(() => {
    if (!savedCheckpoint) return;
    soundEngine.unlock();
    setProfile(savedCheckpoint.profile);
    setActiveCheckpoint({ ...savedCheckpoint });
    setActiveQuiz(null);
    setFinalStats(null);
    setScreen('playing');
  }, [savedCheckpoint]);

  const handleSaveCheckpoint = useCallback((save: CheckpointSave) => {
    setSavedCheckpoint(save);
    try {
      window.localStorage.setItem(CHECKPOINT_STORAGE_KEY, serializeCheckpoint(save));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, []);

  const handleTriggerQuiz = useCallback((quiz: ActiveQuizPrompt) => {
    setActiveQuiz(quiz);
  }, []);

  const handleQuizComplete = useCallback(
    (result: {
      isCorrect: boolean;
      record: QuestionRecord;
      digitIndex?: number;
      context: ActiveQuizPrompt['context'];
    }) => {
      setActiveQuiz(null);
      setQuizResultSignal({
        seq: Date.now() + Math.random(),
        context: result.context,
        isCorrect: result.isCorrect,
        record: result.record,
        digitIndex: result.digitIndex,
      });
    },
    []
  );

  const handleTriggerJumpscare = useCallback(
    (character: JumpscareCharacter, title: string, subtitle: string) => {
      setActiveQuiz(null);
      setJumpscare({ active: true, character, title, subtitle });
    },
    []
  );

  const handleDismissJumpscare = useCallback(() => {
    setJumpscare((prev) => (prev.active ? { ...prev, active: false } : prev));
    setRespawnSignal((n) => n + 1);
  }, []);

  const handleFinishGame = useCallback(
    (records: QuestionRecord[], elapsedSeconds: number, checkpointsCleared: number) => {
      const stats = calculateFinalStats({
        profile,
        records,
        elapsedSeconds,
        checkpointsCleared,
      });
      setFinalStats(stats);
      try {
        window.localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
      } catch {
        // Ignore
      }
      setSavedCheckpoint(null);
      setScreen('cutscene_ending');
    },
    [profile]
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050b16]">
      {/* Persistent 3D World Canvas (runs Title Night Tour + Active FPS Gameplay) */}
      <GameCanvas
        screen={screen}
        profile={profile}
        settings={settings}
        activeQuiz={activeQuiz}
        jumpscareActive={jumpscare.active}
        initialCheckpoint={activeCheckpoint}
        virtualInputRef={virtualInputRef}
        onHudUpdate={setHud}
        onTriggerQuiz={handleTriggerQuiz}
        onTriggerJumpscare={handleTriggerJumpscare}
        onSaveCheckpoint={handleSaveCheckpoint}
        onFinishGame={handleFinishGame}
        quizResultSignal={quizResultSignal}
        respawnSignal={respawnSignal}
        ufoConfirmSignal={ufoConfirmSignal}
      />

      {screen === 'title' && (
        <TitleScreen
          settings={settings}
          onUpdateSettings={setSettings}
          onPlayClick={() => {
            soundEngine.unlock();
            setScreen('profile');
          }}
        />
      )}

      {screen === 'profile' && (
        <ProfileSetupModal
          initialProfile={profile}
          savedCheckpoint={savedCheckpoint}
          onBack={() => setScreen('title')}
          onStartNew={handleStartNew}
          onContinueCheckpoint={handleContinueCheckpoint}
        />
      )}

      {screen === 'cutscene_intro' && (
        <CinematicCutscene
          mode="intro"
          onComplete={() => setScreen('playing')}
        />
      )}

      {screen === 'playing' && (
        <GameHUD
          hud={hud}
          muted={settings.muted}
          controlMode={settings.controlMode}
          virtualInputRef={virtualInputRef}
          onPause={() => setScreen('paused')}
          onToggleMute={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
          onChangeControlMode={(mode) => setSettings((s) => ({ ...s, controlMode: mode }))}
          onUfoConfirm={() => setUfoConfirmSignal((n) => n + 1)}
        />
      )}

      {screen === 'playing' && activeQuiz && (
        <QuestionModal quiz={activeQuiz} onComplete={handleQuizComplete} />
      )}

      {screen === 'playing' && jumpscare.active && (
        <JumpscareOverlay jumpscare={jumpscare} onDismiss={handleDismissJumpscare} />
      )}

      {screen === 'paused' && (
        <PauseModal
          settings={settings}
          onUpdateSettings={setSettings}
          onResume={() => setScreen('playing')}
          onRespawnCheckpoint={() => {
            setRespawnSignal((n) => n + 1);
            setScreen('playing');
          }}
          onQuitToTitle={() => setScreen('title')}
        />
      )}

      {screen === 'cutscene_ending' && (
        <CinematicCutscene
          mode="ending"
          onComplete={() => setScreen('results')}
        />
      )}

      {screen === 'results' && finalStats && (
        <ResultsScreen
          stats={finalStats}
          onPlayAgain={() => setScreen('profile')}
          onBackToTitle={() => setScreen('title')}
        />
      )}
    </main>
  );
}
