export type GradeLevel = 7 | 8 | 9;

export type SubjectId =
  | 'matematika'
  | 'ipa'
  | 'ips'
  | 'bahasa_inggris'
  | 'bahasa_arab'
  | 'pai'
  | 'ppkn'
  | 'bahasa_indonesia';

export interface SubjectInfo {
  id: SubjectId;
  label: string;
  shortLabel: string;
  description: string;
}

export const SUBJECTS: SubjectInfo[] = [
  { id: 'matematika', label: 'Matematika', shortLabel: 'MTK', description: 'Aljabar, geometri, aritmetika & statistika SMP' },
  { id: 'ipa', label: 'IPA', shortLabel: 'IPA', description: 'Fisika, biologi, ekosistem & zat SMP' },
  { id: 'ips', label: 'IPS', shortLabel: 'IPS', description: 'Geografi, sejarah, ekonomi & sosial SMP' },
  { id: 'bahasa_inggris', label: 'Bahasa Inggris', shortLabel: 'ENG', description: 'Grammar, reading, vocabulary & tenses' },
  { id: 'bahasa_arab', label: 'Bahasa Arab', shortLabel: 'ARB', description: 'Mufrodat, qawaid & percakapan dasar' },
  { id: 'pai', label: 'PAI', shortLabel: 'PAI', description: 'Akidah, akhlak, fikih & sejarah Islam' },
  { id: 'ppkn', label: 'PPKN', shortLabel: 'PKN', description: 'Pancasila, UUD 1945, norma & NKRI' },
  { id: 'bahasa_indonesia', label: 'Bahasa Indonesia', shortLabel: 'IND', description: 'Teks deskripsi, puisi, EYD & struktur kalimat' },
];

export type GameScreen =
  | 'title'
  | 'profile'
  | 'cutscene_intro'
  | 'playing'
  | 'paused'
  | 'cutscene_ending'
  | 'results';

export type PosStage =
  | 'pos1_krusty_krab'
  | 'pos1_red_light'
  | 'pos2_street_squidward'
  | 'pos3_patrick_obby'
  | 'pos4_plankton_ufo'
  | 'pos5_zombie_chase'
  | 'pos6_sandy_boss'
  | 'pos7_tree_portal';

export type Pos1SubPhase =
  | 'waking_up'
  | 'krabs_approaching'
  | 'krabs_stunned_escape'
  | 'meet_spongebob'
  | 'find_safe_code'
  | 'safe_unlocked_chase'
  | 'door_unlocked_outside';

export interface QuestionItem {
  id: string;
  grade: GradeLevel;
  subject: SubjectId;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface QuestionRecord {
  questionId: string;
  stageLabel: string;
  question: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

export type QuizContextType =
  | 'krabs_ambush'
  | 'safe_digit'
  | 'red_light_eval'
  | 'pos2_gate'
  | 'pos3_gate'
  | 'pos4_gate'
  | 'pos5_gate'
  | 'sandy_survive'
  | 'portal_riddle';

export interface ActiveQuizPrompt {
  context: QuizContextType;
  title: string;
  subtitle: string;
  question: QuestionItem;
  digitIndex?: number;
  totalDigits?: number;
  allowRetryOnWrong: boolean;
  isGradedOnly?: boolean;
}

export interface DialogueMessage {
  speaker: string;
  text: string;
  tone?: 'normal' | 'warning' | 'creepy';
}

export interface PlayerProfile {
  playerName: string;
  grade: GradeLevel;
  subject: SubjectId;
}

export interface GameSettings {
  cameraSensitivity: number; // 0.5 to 2.5
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  muted: boolean;
  graphicsQuality: 'high' | 'balanced';
  controlMode: 'hp' | 'laptop';
}

export interface CheckpointSave {
  profile: PlayerProfile;
  stage: PosStage;
  pos1SubPhase: Pos1SubPhase;
  safeDigitsFound: number[];
  safeCodeTarget: number[];
  hasDoorKey: boolean;
  hasMap?: boolean;
  sandyBattleCorrect?: number;
  camelliaStep?: number;
  usedQuestionIds: string[];
  records: QuestionRecord[];
  checkpointsCleared: number;
  elapsedSeconds: number;
  savedAt: number;
}

export interface FinalGameStats {
  playerName: string;
  grade: GradeLevel;
  subjectLabel: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  finalScore: number;
  elapsedSeconds: number;
  checkpointsCleared: number;
  records: QuestionRecord[];
}

export interface HudState {
  stage: PosStage;
  stageTitle: string;
  objectiveText: string;
  subHint: string;
  flashlightOn: boolean;
  cameraView: '3rd' | '1st';
  stamina: number; // 0..100
  isHiding: boolean;
  suspicionLevel: number; // 0..100
  safeDigitsFound: number[];
  safeCodeTarget: number[];
  hasDoorKey: boolean;
  hasMap: boolean;
  sandyBattleCorrect: number;
  camelliaStep: number;
  interactPrompt: string | null;
  dialogue: DialogueMessage | null;
  wakeProgress: number; // 0..1 (1 = fully awake)
  blurAmount: number; // px
  redAlertFlash: number; // 0..1
  checkpointsCleared: number;
  answeredCount: number;
  elapsedSeconds: number;
  climbProgress: number; // 0..1
  ufoChoicePending: boolean;
}

export type JumpscareCharacter = 'mr_krabs' | 'squidward' | 'patrick' | 'sandy' | 'spongebob';

export interface JumpscareState {
  active: boolean;
  character: JumpscareCharacter;
  title: string;
  subtitle: string;
}
