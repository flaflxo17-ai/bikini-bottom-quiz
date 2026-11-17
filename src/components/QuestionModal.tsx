import { useState } from 'react';
import { ActiveQuizPrompt, QuestionRecord } from '../types/game';
import { CheckCircle2, XCircle } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface QuestionModalProps {
  quiz: ActiveQuizPrompt;
  onComplete: (result: {
    isCorrect: boolean;
    record: QuestionRecord;
    digitIndex?: number;
    context: ActiveQuizPrompt['context'];
  }) => void;
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuestionModal({ quiz, onComplete }: QuestionModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === quiz.question.correctIndex;

  const handleChoose = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    if (idx === quiz.question.correctIndex) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }
  };

  const handleContinue = () => {
    if (selected === null) return;
    if (!isCorrect && quiz.allowRetryOnWrong) {
      // Allow retry only when puzzle permits (e.g. safe code / sandy exit), but note:
      // For clean single-attempt scoring without question repetition, we still record or allow retry?
      // Prompt says: "Total: 11 soal. Semua soal harus unik dalam satu sesi."
      // So each quiz slot submits 1 clean recorded answer and advances cleanly (for Krabs/RedLight),
      // while for Safe/Sandy, if wrong, let them see explanation & retry the same slot or advance!
      // Wait: if they retry same question, it shouldn't duplicate in final 11-question count.
      // Even better: if allowRetryOnWrong is true and wrong, let's let them pick again on the same question!
      setSelected(null);
      setSubmitted(false);
      return;
    }
    onComplete({
      isCorrect,
      context: quiz.context,
      digitIndex: quiz.digitIndex,
      record: {
        questionId: quiz.question.id,
        stageLabel: quiz.title,
        question: quiz.question.question,
        selectedIndex: selected,
        correctIndex: quiz.question.correctIndex,
        isCorrect,
        explanation: quiz.question.explanation,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#030814]/88 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#0c1830] border border-sky-400/35 p-5 sm:p-6 shadow-2xl">
        <div className="mb-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
            {quiz.title}
          </div>
          <p className="text-xs text-slate-300 mt-0.5">{quiz.subtitle}</p>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-4">
          {quiz.question.question}
        </h3>

        <div className="space-y-2.5">
          {quiz.question.options.map((opt, idx) => {
            let style =
              'bg-[#081122] border-slate-700 text-slate-100 hover:border-sky-400/60 hover:bg-[#10203d]';
            if (submitted) {
              if (idx === quiz.question.correctIndex) {
                style = 'bg-emerald-500/20 border-emerald-400 text-emerald-100';
              } else if (idx === selected) {
                style = 'bg-red-500/20 border-red-400 text-red-100';
              } else {
                style = 'bg-[#081122]/60 border-slate-800 text-slate-400';
              }
            }
            return (
              <button
                key={idx}
                type="button"
                disabled={submitted}
                onClick={() => handleChoose(idx)}
                className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${style}`}
              >
                <span className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-600/60 flex items-center justify-center font-mono-num text-xs font-bold shrink-0">
                  {LETTERS[idx]}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`mt-4 rounded-xl border p-3.5 text-xs sm:text-sm ${
              isCorrect
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
                : 'bg-red-950/60 border-red-500/40 text-red-100'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Jawaban Benar!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    {quiz.isGradedOnly
                      ? 'Jawaban Salah — Tercatat untuk Nilai Akhir'
                      : quiz.allowRetryOnWrong
                        ? 'Jawaban Kurang Tepat — Coba Lagi!'
                        : 'Jawaban Salah!'}
                  </span>
                </>
              )}
            </div>
            {(isCorrect || !quiz.allowRetryOnWrong) && (
              <p className="text-slate-200 leading-relaxed">{quiz.question.explanation}</p>
            )}
            <button
              type="button"
              onClick={handleContinue}
              className="mt-3 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
            >
              {!isCorrect && quiz.allowRetryOnWrong ? 'Coba Jawab Lagi' : 'Lanjutkan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
