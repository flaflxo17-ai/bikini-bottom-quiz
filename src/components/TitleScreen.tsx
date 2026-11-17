import { useState } from 'react';
import { GameSettings } from '../types/game';
import { Sliders, HelpCircle, LogOut, Play, Volume2, VolumeX, X } from 'lucide-react';

interface TitleScreenProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onPlayClick: () => void;
}

export function TitleScreen({ settings, onUpdateSettings, onPlayClick }: TitleScreenProps) {
  const [modal, setModal] = useState<'none' | 'settings' | 'howto' | 'exit'>('none');

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none">
      {/* Measured contrast scrim preserving 3D Bikini Bottom night view on the right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(95deg, rgba(4,10,24,0.86) 0%, rgba(4,10,24,0.42) 44%, rgba(4,10,24,0.05) 100%)',
        }}
      />

      {/* Top-right compact audio toggle */}
      <div className="relative z-10 flex justify-end p-5 pointer-events-auto">
        <button
          type="button"
          onClick={() => onUpdateSettings({ ...settings, muted: !settings.muted })}
          aria-label={settings.muted ? 'Aktifkan suara' : 'Bisukan suara'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0b162b]/90 border border-sky-400/25 text-xs font-semibold text-slate-200 hover:bg-[#122240] transition-colors cursor-pointer"
        >
          {settings.muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          <span>{settings.muted ? 'Suara Mati' : 'Audio Aktif'}</span>
        </button>
      </div>

      {/* Left-third Title Lockup & Menu Buttons */}
      <div className="relative z-10 px-6 sm:px-12 pb-10 sm:pb-14 max-w-xl pointer-events-auto">
        {/* Custom Inline SVG Emblem Lockup */}
        <div className="mb-6">
          <svg
            viewBox="0 0 560 146"
            className="w-full max-w-[490px] h-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]"
            role="img"
            aria-label="Escape From Bikini Bottom: The Zombie Secret"
          >
            <defs>
              <linearGradient id="spongeGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="dangerRed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <path
              d="M12 22 Q280 6 548 22 L542 130 Q280 142 18 130 Z"
              fill="#071326"
              fillOpacity="0.9"
              stroke="#38bdf8"
              strokeOpacity="0.4"
              strokeWidth="2"
            />
            <text
              x="280"
              y="60"
              textAnchor="middle"
              fill="url(#spongeGold)"
              fontFamily="Bricolage Grotesque, sans-serif"
              fontWeight="800"
              fontSize="27"
              letterSpacing="1"
            >
              ESCAPE FROM BIKINI BOTTOM
            </text>
            <line x1="75" y1="78" x2="485" y2="78" stroke="#38bdf8" strokeOpacity="0.32" strokeWidth="1.5" />
            <text
              x="280"
              y="108"
              textAnchor="middle"
              fill="url(#dangerRed)"
              fontFamily="Bricolage Grotesque, sans-serif"
              fontWeight="800"
              fontSize="21"
              letterSpacing="4"
            >
              THE ZOMBIE SECRET
            </text>
          </svg>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-md">
            Petualangan Horor Edukasi 3D SMP · Jelajahi Bikini Bottom malam hari, pecahkan kode brankas, dan selamatkan diri dari rahasia zombie.
          </p>
        </div>

        {/* 4 Menu Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            data-start="true"
            onClick={onPlayClick}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-lg tracking-wide shadow-lg shadow-amber-500/20 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>PLAY</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setModal('settings')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0d1c36]/95 hover:bg-[#14294f] border border-sky-400/25 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>SETTINGS</span>
            </button>
            <button
              type="button"
              onClick={() => setModal('howto')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0d1c36]/95 hover:bg-[#14294f] border border-sky-400/25 text-slate-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>HOW TO PLAY</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModal('exit')}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#1a111a]/90 hover:bg-[#2d1620] border border-red-500/30 text-red-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>EXIT</span>
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Kontrol: HP (Joystick Bulat) · Laptop (Keyboard WASD/Panah, Shift, Space, E, F, V + Mouse)
        </p>
      </div>

      {/* SETTINGS MODAL */}
      {modal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-2xl bg-[#0b1528] border border-sky-400/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-amber-300">SETTINGS</h2>
              <button
                type="button"
                aria-label="Tutup settings"
                onClick={() => setModal('none')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label htmlFor="sens-range" className="font-medium text-slate-200">Sensitivitas Kamera</label>
                  <span className="font-mono-num text-sky-300">{settings.cameraSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  id="sens-range"
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

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label htmlFor="music-range" className="font-medium text-slate-200">Volume Musik Latar</label>
                  <span className="font-mono-num text-sky-300">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  id="music-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label htmlFor="sfx-range" className="font-medium text-slate-200">Volume Efek Suara</label>
                  <span className="font-mono-num text-sky-300">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  id="sfx-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-slate-200">Mode Kontrol</span>
                <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg">
                  {(['hp', 'laptop'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, controlMode: m })}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        settings.controlMode === m
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {m === 'hp' ? 'HP (Touch)' : 'Laptop (Keyboard/Mouse)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-slate-200">Kualitas Grafis 3D</span>
                <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg">
                  {(['high', 'balanced'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q })}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        settings.graphicsQuality === q
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {q === 'high' ? 'HD Ultra' : 'Seimbang'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModal('none')}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {modal === 'howto' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#0b1528] border border-sky-400/30 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-emerald-300">HOW TO PLAY</h2>
              <button
                type="button"
                aria-label="Tutup panduan"
                onClick={() => setModal('none')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
              <li><strong className="text-amber-300">1. Profil Belajar:</strong> Pilih Kelas (7, 8, atau 9) dan salah satu dari 8 mata pelajaran SMP sebelum memulai petualangan.</li>
              <li><strong className="text-amber-300">2. Mode HP & Laptop:</strong> Mode HP memakai joystick bulat sentuh. Mode Laptop memakai keyboard (WASD/Panah, Shift Lari, Space Lompat, E Aksi, F Senter, V Ganti Kamera 3rd/1st + seret Mouse).</li>
              <li><strong className="text-amber-300">3. Soal & Checkpoint Setiap Pos:</strong> Setiap perpindahan Pos memiliki checkpoint & soal unik tanpa pengulangan. Di Rumah Sandy (Pos 6), jawab 5 soal benar agar tidak dimakan Sandy & SpongeBob!</li>
              <li><strong className="text-amber-300">4. Teka-Teki Keluar:</strong> Hindari rumput laut 1 meter Squidward, taklukkan obby naik-turun & seluncuran Patrick, pilih jalan kanan untuk ambil Peta, lalu pecahkan teka-teki 4 Pilar Pohon Kamelia Besar!</li>
            </ul>
            <button
              type="button"
              onClick={() => setModal('none')}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Mengerti!
            </button>
          </div>
        </div>
      )}

      {/* EXIT MODAL */}
      {modal === 'exit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
          <div className="w-full max-w-sm rounded-2xl bg-[#0b1528] border border-red-500/35 p-6 text-center shadow-2xl">
            <h2 className="font-display text-xl font-bold text-red-300 mb-2">Keluar dari Permainan?</h2>
            <p className="text-sm text-slate-300 mb-5">
              Terima kasih telah berkunjung ke Bikini Bottom! Kamu dapat menutup tab browser atau kembali ke beranda untuk bermain lagi.
            </p>
            <button
              type="button"
              onClick={() => setModal('none')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
