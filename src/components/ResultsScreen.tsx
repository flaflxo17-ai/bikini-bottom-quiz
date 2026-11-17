import { FinalGameStats } from '../types/game';
import { formatDuration } from '../game/rules';
import { Award, CheckCircle2, Home, RotateCcw, XCircle } from 'lucide-react';

interface ResultsScreenProps {
  stats: FinalGameStats;
  onPlayAgain: () => void;
  onBackToTitle: () => void;
}

export function ResultsScreen({ stats, onPlayAgain, onBackToTitle }: ResultsScreenProps) {
  const gradeLetter =
    stats.finalScore >= 90
      ? 'A (Sangat Baik)'
      : stats.finalScore >= 75
        ? 'B (Baik)'
        : stats.finalScore >= 60
          ? 'C (Cukup)'
          : 'D (Perlu Belajar Lagi)';

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#050c1a] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0b162d] border border-sky-400/30 p-6 sm:p-8 shadow-2xl my-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/70 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
              <Award className="w-4 h-4" />
              <span>Laporan Hasil Permainan & Evaluasi Belajar</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Escape From Bikini Bottom Selesai!
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Nilai Akhir</div>
            <div className="font-mono-num text-4xl font-extrabold text-amber-300">
              {stats.finalScore}
            </div>
            <div className="text-xs font-semibold text-sky-300">{gradeLetter}</div>
          </div>
        </div>

        {/* All 9 Required Fields in Clean Structured Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl bg-[#071022] border border-slate-800 p-3.5">
            <div className="text-[11px] text-slate-400">Nama Pemain</div>
            <div className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
              {stats.playerName}
            </div>
          </div>
          <div className="rounded-xl bg-[#071022] border border-slate-800 p-3.5">
            <div className="text-[11px] text-slate-400">Kelas</div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              Kelas {stats.grade} SMP
            </div>
          </div>
          <div className="rounded-xl bg-[#071022] border border-slate-800 p-3.5">
            <div className="text-[11px] text-slate-400">Mata Pelajaran</div>
            <div className="text-sm sm:text-base font-bold text-sky-300 mt-0.5">
              {stats.subjectLabel}
            </div>
          </div>
          <div className="rounded-xl bg-[#071022] border border-slate-800 p-3.5">
            <div className="text-[11px] text-slate-400">Waktu Penyelesaian</div>
            <div className="font-mono-num text-sm sm:text-base font-bold text-white mt-0.5">
              {formatDuration(stats.elapsedSeconds)}
            </div>
          </div>

          <div className="rounded-xl bg-[#071022] border border-slate-800 p-3.5">
            <div className="text-[11px] text-slate-400">Jumlah Soal</div>
            <div className="font-mono-num text-lg font-bold text-white mt-0.5">
              {stats.totalQuestions}
            </div>
          </div>
          <div className="rounded-xl bg-[#071022] border border-emerald-500/30 p-3.5">
            <div className="text-[11px] text-emerald-300">Jawaban Benar</div>
            <div className="font-mono-num text-lg font-bold text-emerald-400 mt-0.5">
              {stats.correctCount}
            </div>
          </div>
          <div className="rounded-xl bg-[#071022] border border-red-500/30 p-3.5">
            <div className="text-[11px] text-red-300">Jawaban Salah</div>
            <div className="font-mono-num text-lg font-bold text-red-400 mt-0.5">
              {stats.wrongCount}
            </div>
          </div>
          <div className="rounded-xl bg-[#071022] border border-slate-800 p-3.5">
            <div className="text-[11px] text-slate-400">Checkpoint Dilewati</div>
            <div className="font-mono-num text-lg font-bold text-amber-300 mt-0.5">
              {stats.checkpointsCleared} Pos
            </div>
          </div>
        </div>

        {/* Answer Review & Explanations */}
        {stats.records.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-200 mb-2.5">
              Ringkasan & Pembahasan Soal ({stats.records.length})
            </h3>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {stats.records.map((rec, idx) => (
                <div
                  key={`${rec.questionId}-${idx}`}
                  className="rounded-xl bg-[#071022] border border-slate-800 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-100">
                      {idx + 1}. {rec.question}
                    </span>
                    {rec.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-400 mt-1">
                    {rec.stageLabel} · Pembahasan: {rec.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>
          <button
            type="button"
            onClick={onBackToTitle}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
