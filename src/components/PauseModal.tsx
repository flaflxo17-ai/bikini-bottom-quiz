import { GameSettings } from '../types/game';
import { Home, Play, RotateCcw } from 'lucide-react';

interface PauseModalProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onResume: () => void;
  onRespawnCheckpoint: () => void;
  onQuitToTitle: () => void;
}

export function PauseModal({
  settings,
  onUpdateSettings,
  onResume,
  onRespawnCheckpoint,
  onQuitToTitle,
}: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#030814]/82 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#0b162d] border border-sky-400/30 p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-extrabold text-amber-300 text-center mb-1">
          Permainan Dijeda
        </h2>
        <p className="text-xs text-slate-400 text-center mb-5">
          Progress checkpoint tersimpan otomatis.
        </p>

        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1">
            <label htmlFor="pause-sens" className="text-slate-300 font-medium">
              Sensitivitas Kamera
            </label>
            <span className="font-mono-num text-sky-300">{settings.cameraSensitivity.toFixed(1)}x</span>
          </div>
          <input
            id="pause-sens"
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={settings.cameraSensitivity}
            onChange={(e) =>
              onUpdateSettings({ ...settings, cameraSensitivity: parseFloat(e.target.value) })
            }
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-medium text-slate-300">Mode Tombol</span>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
            {(['hp', 'laptop'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, controlMode: m })}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${
                  settings.controlMode === m
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {m === 'hp' ? 'HP' : 'Laptop'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Lanjutkan</span>
          </button>

          <button
            type="button"
            onClick={onRespawnCheckpoint}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulang dari Checkpoint</span>
          </button>

          <button
            type="button"
            onClick={onQuitToTitle}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/30 text-red-200 font-semibold text-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
