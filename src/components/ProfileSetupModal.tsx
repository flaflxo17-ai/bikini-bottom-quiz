import { useState } from 'react';
import { CheckpointSave, GradeLevel, PlayerProfile, SUBJECTS, SubjectId } from '../types/game';
import { ArrowLeft, BookOpen, Play, RotateCcw } from 'lucide-react';

interface ProfileSetupModalProps {
  initialProfile: PlayerProfile;
  savedCheckpoint: CheckpointSave | null;
  onBack: () => void;
  onStartNew: (profile: PlayerProfile) => void;
  onContinueCheckpoint: () => void;
}

export function ProfileSetupModal({
  initialProfile,
  savedCheckpoint,
  onBack,
  onStartNew,
  onContinueCheckpoint,
}: ProfileSetupModalProps) {
  const [playerName, setPlayerName] = useState(initialProfile.playerName);
  const [grade, setGrade] = useState<GradeLevel>(initialProfile.grade);
  const [subject, setSubject] = useState<SubjectId>(initialProfile.subject);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerName.trim();
    if (!trimmed) {
      setError('Masukkan nama panggilanmu terlebih dahulu agar tercatat di nilai akhir.');
      return;
    }
    setError('');
    onStartNew({ playerName: trimmed, grade, subject });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#040a18]/88 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-[#0b162c] border border-sky-400/25 p-6 sm:p-7 shadow-2xl my-auto"
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-amber-300">
              Profil Pembelajaran SMP
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Pilih kelas & mata pelajaran — soal akan disesuaikan otomatis dengan kurikulummu.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Saved Checkpoint Banner if available */}
        {savedCheckpoint && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-[#112447] border border-emerald-400/35 px-4 py-3">
            <div className="text-xs sm:text-sm">
              <div className="font-bold text-emerald-300">
                Checkpoint Tersimpan: {savedCheckpoint.profile.playerName} (Kelas {savedCheckpoint.profile.grade})
              </div>
              <div className="text-slate-300 mt-0.5">
                Pos dicapai: {savedCheckpoint.checkpointsCleared}/7 · Soal terjawab: {savedCheckpoint.records.length}
              </div>
            </div>
            <button
              type="button"
              onClick={onContinueCheckpoint}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Lanjutkan Checkpoint</span>
            </button>
          </div>
        )}

        {/* Player Name */}
        <div className="mb-5">
          <label htmlFor="player-name-input" className="block text-sm font-semibold text-slate-200 mb-1.5">
            Nama Pemain
          </label>
          <input
            id="player-name-input"
            type="text"
            maxLength={32}
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Contoh: Aisyah / Rafi"
            className="w-full rounded-xl bg-[#071020] border border-slate-700 focus:border-amber-400 focus:outline-none px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
          {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
        </div>

        {/* Grade Selector */}
        <div className="mb-5">
          <span className="block text-sm font-semibold text-slate-200 mb-2">Pilih Kelas</span>
          <div className="grid grid-cols-3 gap-2.5">
            {([7, 8, 9] as GradeLevel[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`py-2.5 px-4 rounded-xl border font-display font-bold text-sm transition-colors cursor-pointer ${
                  grade === g
                    ? 'bg-amber-400 border-amber-300 text-slate-950'
                    : 'bg-[#081224] border-slate-700 text-slate-200 hover:border-sky-400/50'
                }`}
              >
                Kelas {g}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Subjects Grid */}
        <div className="mb-6">
          <span className="block text-sm font-semibold text-slate-200 mb-2">
            Pilih Mata Pelajaran (8 Mapel)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SUBJECTS.map((subj) => {
              const active = subject === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => setSubject(subj.id)}
                  className={`flex flex-col items-start text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-sky-500/20 border-sky-400 text-white'
                      : 'bg-[#081224] border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <BookOpen className={`w-3.5 h-3.5 ${active ? 'text-sky-300' : 'text-slate-400'}`} />
                    <span>{subj.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                    {subj.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-base tracking-wide shadow-lg cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Mulai Petualangan</span>
        </button>
      </form>
    </div>
  );
}
