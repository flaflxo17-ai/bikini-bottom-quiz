import {
  CheckpointSave,
  FinalGameStats,
  GradeLevel,
  PlayerProfile,
  QuestionItem,
  QuestionRecord,
  SUBJECTS,
  SubjectId,
} from '../types/game';

export interface WallBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  id?: string;
}

export interface ObbyPlatform {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  topY: number;
}

export interface SlideRamp {
  id: string;
  minX: number;
  maxX: number;
  startZ: number;
  endZ: number;
  startY: number;
  endY: number;
}

export function generateSafeCode(rng: () => number = Math.random): number[] {
  const digits: number[] = [];
  for (let i = 0; i < 5; i++) {
    digits.push(Math.floor(rng() * 10));
  }
  if (digits.every((d) => d === digits[0])) {
    digits[4] = (digits[0] + 3) % 10;
  }
  return digits;
}

export function pickUniqueQuestion(
  bank: QuestionItem[],
  grade: GradeLevel,
  subject: SubjectId,
  usedQuestionIds: string[],
  rng: () => number = Math.random
): { question: QuestionItem; nextUsedIds: string[] } {
  const usedSet = new Set(usedQuestionIds);
  const exactMatches = bank.filter(
    (q) => q.grade === grade && q.subject === subject && !usedSet.has(q.id)
  );
  const subjectFallback = bank.filter(
    (q) => q.subject === subject && !usedSet.has(q.id)
  );
  const anyFallback = bank.filter((q) => !usedSet.has(q.id));

  const pool =
    exactMatches.length > 0
      ? exactMatches
      : subjectFallback.length > 0
        ? subjectFallback
        : anyFallback;

  if (pool.length === 0) {
    const resetPool = bank.filter((q) => q.grade === grade && q.subject === subject);
    const chosen = resetPool[Math.floor(rng() * resetPool.length)] ?? bank[0];
    return { question: chosen, nextUsedIds: [...usedQuestionIds, chosen.id] };
  }

  const chosen = pool[Math.floor(rng() * pool.length)];
  return {
    question: chosen,
    nextUsedIds: [...usedQuestionIds, chosen.id],
  };
}

export function calculateFinalStats(params: {
  profile: PlayerProfile;
  records: QuestionRecord[];
  elapsedSeconds: number;
  checkpointsCleared: number;
}): FinalGameStats {
  const { profile, records, elapsedSeconds, checkpointsCleared } = params;
  const subjectInfo = SUBJECTS.find((s) => s.id === profile.subject);
  const totalQuestions = records.length;
  const correctCount = records.filter((r) => r.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const finalScore =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    playerName: profile.playerName.trim() || 'Petualang',
    grade: profile.grade,
    subjectLabel: subjectInfo ? subjectInfo.label : profile.subject,
    totalQuestions,
    correctCount,
    wrongCount,
    finalScore,
    elapsedSeconds: Math.max(0, Math.round(elapsedSeconds)),
    checkpointsCleared,
    records,
  };
}

export function resolveCircleWalls(
  x: number,
  z: number,
  radius: number,
  walls: WallBox[]
): { x: number; z: number } {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      const closestX = Math.max(w.minX, Math.min(px, w.maxX));
      const closestZ = Math.max(w.minZ, Math.min(pz, w.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          px += (dx / dist) * overlap;
          pz += (dz / dist) * overlap;
        } else {
          const leftPen = Math.abs(px - w.minX);
          const rightPen = Math.abs(w.maxX - px);
          const topPen = Math.abs(pz - w.minZ);
          const bottomPen = Math.abs(w.maxZ - pz);
          const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
          if (minPen === leftPen) px = w.minX - radius;
          else if (minPen === rightPen) px = w.maxX + radius;
          else if (minPen === topPen) pz = w.minZ - radius;
          else pz = w.maxZ + radius;
        }
      }
    }
  }

  return { x: px, z: pz };
}

export function checkCircleOverlap(
  ax: number,
  az: number,
  ar: number,
  bx: number,
  bz: number,
  br: number
): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  const rSum = ar + br;
  return dx * dx + dz * dz <= rSum * rSum;
}

export function findHighestSupportY(
  x: number,
  z: number,
  playerY: number,
  playerRadius: number,
  platforms: ObbyPlatform[]
): number | null {
  let bestY: number | null = null;
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (
      x + playerRadius * 0.55 >= p.minX &&
      x - playerRadius * 0.55 <= p.maxX &&
      z + playerRadius * 0.55 >= p.minZ &&
      z - playerRadius * 0.55 <= p.maxZ
    ) {
      if (playerY >= p.topY - 0.55 && (bestY === null || p.topY > bestY)) {
        bestY = p.topY;
      }
    }
  }
  return bestY;
}

export function findSlideSurfaceY(
  x: number,
  z: number,
  playerY: number,
  playerRadius: number,
  slides: SlideRamp[]
): number | null {
  let bestY: number | null = null;
  for (let i = 0; i < slides.length; i++) {
    const sl = slides[i];
    const minZ = Math.min(sl.startZ, sl.endZ);
    const maxZ = Math.max(sl.startZ, sl.endZ);
    if (
      x + playerRadius * 0.5 >= sl.minX &&
      x - playerRadius * 0.5 <= sl.maxX &&
      z >= minZ - 0.3 &&
      z <= maxZ + 0.3
    ) {
      const span = sl.endZ - sl.startZ;
      const t = span === 0 ? 0 : Math.max(0, Math.min(1, (z - sl.startZ) / span));
      const yAtZ = sl.startY + (sl.endY - sl.startY) * t;
      if (playerY >= yAtZ - 0.7 && (bestY === null || yAtZ > bestY)) {
        bestY = yAtZ;
      }
    }
  }
  return bestY;
}

export function computeStealthSuspicion(
  dt: number,
  currentSuspicion: number,
  isHiding: boolean,
  nearestEnemyDist: number
): number {
  if (isHiding) {
    return Math.max(0, currentSuspicion - dt * 32);
  }
  const proximityBoost = nearestEnemyDist < 8 ? 22 : nearestEnemyDist < 14 ? 13 : 8;
  return Math.min(100, currentSuspicion + dt * proximityBoost);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const CHECKPOINT_STORAGE_KEY = 'efbb_checkpoint_v1';

export function serializeCheckpoint(save: CheckpointSave): string {
  return JSON.stringify(save);
}

export function parseCheckpoint(raw: string | null): CheckpointSave | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CheckpointSave;
    if (
      !parsed ||
      !parsed.profile ||
      !parsed.stage ||
      !Array.isArray(parsed.safeCodeTarget) ||
      parsed.safeCodeTarget.length !== 5
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
