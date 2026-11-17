import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFinalStats,
  checkCircleOverlap,
  computeStealthSuspicion,
  findHighestSupportY,
  findSlideSurfaceY,
  formatDuration,
  generateSafeCode,
  parseCheckpoint,
  pickUniqueQuestion,
  resolveCircleWalls,
  serializeCheckpoint,
} from './rules';
import { QUESTION_BANK } from '../data/questions';
import { GradeLevel, SUBJECTS } from '../types/game';

test('generateSafeCode produces 5 varied digits between 0 and 9', () => {
  const code = generateSafeCode();
  assert.equal(code.length, 5);
  for (const d of code) {
    assert.ok(Number.isInteger(d) && d >= 0 && d <= 9);
  }
  const forced = generateSafeCode(() => 0.2);
  assert.equal(forced.length, 5);
  assert.notEqual(forced[0], forced[4]);
});

test('QUESTION_BANK has >= 24 unique questions for every grade and subject combination', () => {
  const grades: GradeLevel[] = [7, 8, 9];
  const seenIds = new Set<string>();
  for (const q of QUESTION_BANK) {
    assert.ok(!seenIds.has(q.id), `Duplicate question ID: ${q.id}`);
    seenIds.add(q.id);
    assert.equal(q.options.length, 4);
    assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
    assert.ok(q.explanation.trim().length > 5);
  }
  for (const g of grades) {
    for (const s of SUBJECTS) {
      const count = QUESTION_BANK.filter((q) => q.grade === g && q.subject === s.id).length;
      assert.ok(count >= 24, `Expected >= 24 questions for Kelas ${g} ${s.label}, got ${count}`);
    }
  }
});

test('pickUniqueQuestion never repeats a question within a session of 20 questions', () => {
  let used: string[] = [];
  for (let i = 0; i < 20; i++) {
    const res = pickUniqueQuestion(QUESTION_BANK, 8, 'ipa', used);
    assert.ok(!used.includes(res.question.id), `Repeated question ${res.question.id}`);
    assert.equal(res.question.grade, 8);
    assert.equal(res.question.subject, 'ipa');
    used = res.nextUsedIds;
  }
  assert.equal(new Set(used).size, 20);
});

test('calculateFinalStats computes accurate score and counts', () => {
  const records = Array.from({ length: 18 }, (_, idx) => ({
    questionId: `q-${idx}`,
    stageLabel: 'Pos 1',
    question: 'Q?',
    selectedIndex: idx < 15 ? 0 : 1,
    correctIndex: 0,
    isCorrect: idx < 15,
    explanation: 'Penjelasan',
  }));
  const stats = calculateFinalStats({
    profile: { playerName: 'Budi', grade: 7, subject: 'matematika' },
    records,
    elapsedSeconds: 425,
    checkpointsCleared: 7,
  });
  assert.equal(stats.playerName, 'Budi');
  assert.equal(stats.subjectLabel, 'Matematika');
  assert.equal(stats.totalQuestions, 18);
  assert.equal(stats.correctCount, 15);
  assert.equal(stats.wrongCount, 3);
  assert.equal(stats.finalScore, 83);
  assert.equal(stats.checkpointsCleared, 7);
  assert.equal(formatDuration(stats.elapsedSeconds), '07:05');
});

test('resolveCircleWalls prevents penetrating wall AABB and locked kk_front_door until unlocked', () => {
  const walls = [
    { minX: 2, maxX: 4, minZ: -5, maxZ: 5 },
    { id: 'kk_front_door', minX: -1.75, maxX: 1.75, minZ: 9.8, maxZ: 10.45 },
  ];
  const resolved = resolveCircleWalls(1.8, 0.5, 0.5, walls);
  assert.ok(resolved.x <= 1.5001, `Expected x <= 1.5, got ${resolved.x}`);
  assert.equal(resolved.z, 0.5);

  // Player attempting to walk straight through Krusty Krab front door without key
  const blockedDoor = resolveCircleWalls(0, 10.0, 0.48, walls);
  assert.ok(blockedDoor.z <= 9.33, `Expected blocked z <= 9.33, got ${blockedDoor.z}`);

  // Once key unlocks the front door, kk_front_door is removed and player can exit
  const unlockedDoor = resolveCircleWalls(
    0,
    10.0,
    0.48,
    walls.filter((w) => w.id !== 'kk_front_door')
  );
  assert.equal(unlockedDoor.z, 10.0);
});

test('checkCircleOverlap, findHighestSupportY, and findSlideSurfaceY detect hazards, obby platforms, and slide ramps', () => {
  assert.equal(checkCircleOverlap(0, 0, 0.5, 0.8, 0, 0.5), true);
  assert.equal(checkCircleOverlap(0, 0, 0.5, 2.0, 0, 0.5), false);

  const platforms = [
    { id: 'p1', minX: -2, maxX: 2, minZ: -2, maxZ: 2, topY: 1.5 },
    { id: 'p2', minX: 4, maxX: 6, minZ: -2, maxZ: 2, topY: 3.0 },
  ];
  assert.equal(findHighestSupportY(0, 0, 1.6, 0.4, platforms), 1.5);
  assert.equal(findHighestSupportY(3, 0, 1.6, 0.4, platforms), null);

  const slides = [
    { id: 's1', minX: -1.5, maxX: 1.5, startZ: 50, endZ: 60, startY: 2.0, endY: 0.4 },
  ];
  const midY = findSlideSurfaceY(0, 55, 1.5, 0.4, slides);
  assert.ok(midY !== null && Math.abs(midY - 1.2) < 0.01, `Expected 1.2, got ${midY}`);
  assert.equal(findSlideSurfaceY(4, 55, 1.5, 0.4, slides), null);
});

test('computeStealthSuspicion rises in open and decays when hiding', () => {
  const exposed = computeStealthSuspicion(1.0, 20, false, 6);
  assert.ok(exposed > 20);
  const hidden = computeStealthSuspicion(1.0, exposed, true, 6);
  assert.ok(hidden < exposed);
});

test('checkpoint serialization round-trips safely', () => {
  const save = {
    profile: { playerName: 'Siti', grade: 9 as GradeLevel, subject: 'ppkn' as const },
    stage: 'pos3_patrick_obby' as const,
    pos1SubPhase: 'door_unlocked_outside' as const,
    safeDigitsFound: [1, 4, 7, 2, 9],
    safeCodeTarget: [1, 4, 7, 2, 9],
    hasDoorKey: true,
    hasMap: false,
    sandyBattleCorrect: 0,
    camelliaStep: 0,
    usedQuestionIds: ['q1', 'q2'],
    records: [],
    checkpointsCleared: 2,
    elapsedSeconds: 180,
    savedAt: 1700000000,
  };
  const parsed = parseCheckpoint(serializeCheckpoint(save));
  assert.deepEqual(parsed, save);
  assert.equal(parseCheckpoint('invalid json'), null);
});
