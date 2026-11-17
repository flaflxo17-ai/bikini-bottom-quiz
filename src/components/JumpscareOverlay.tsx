import { useEffect } from 'react';
import { JumpscareState } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface JumpscareOverlayProps {
  jumpscare: JumpscareState;
  onDismiss: () => void;
}

export function JumpscareOverlay({ jumpscare, onDismiss }: JumpscareOverlayProps) {
  useEffect(() => {
    if (!jumpscare.active) return;
    soundEngine.playJumpscare();
    const timer = window.setTimeout(() => {
      onDismiss();
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [jumpscare.active, onDismiss]);

  if (!jumpscare.active) return null;

  const palette = {
    mr_krabs: { bg: '#3b0707', accent: '#ef4444', face: '#dc2626', eye: '#fef08a' },
    squidward: { bg: '#072727', accent: '#f87171', face: '#67a99f', eye: '#fca5a5' },
    patrick: { bg: '#260d1c', accent: '#a3e635', face: '#d87e9a', eye: '#bef264' },
    sandy: { bg: '#1e1035', accent: '#f472b6', face: '#a1623b', eye: '#ef4444' },
    spongebob: { bg: '#281d04', accent: '#ef4444', face: '#facc15', eye: '#ef4444' },
  }[jumpscare.character];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: palette.bg }}
    >
      <div className="animate-jumpscare w-60 h-60 sm:w-80 sm:h-80 mb-5">
        <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-[0_0_32px_rgba(0,0,0,0.95)]">
          {/* Scratched Face Base */}
          <circle cx="110" cy="110" r="90" fill={palette.face} stroke="#050505" strokeWidth="6" />
          <path d="M55 45 L72 62 M165 45 L148 62 M40 120 L58 115" stroke="#180505" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          {/* Deep Sunken Eye Sockets */}
          <ellipse cx="75" cy="86" rx="28" ry="33" fill="#0d0305" />
          <ellipse cx="145" cy="86" rx="28" ry="33" fill="#0d0305" />
          {/* Bloodshot Glowing Eyes + Pinprick Horror Pupils */}
          <ellipse cx="75" cy="86" rx="21" ry="26" fill={palette.eye} stroke="#000" strokeWidth="3" />
          <ellipse cx="145" cy="86" rx="21" ry="26" fill={palette.eye} stroke="#000" strokeWidth="3" />
          <circle cx="75" cy="86" r="10" fill="#dc2626" />
          <circle cx="145" cy="86" r="10" fill="#dc2626" />
          <circle cx="75" cy="86" r="4.5" fill="#050505" />
          <circle cx="145" cy="86" r="4.5" fill="#050505" />
          {/* Sharp Furrowed Brows */}
          <path d="M40 50 L102 74" stroke="#000" strokeWidth="11" strokeLinecap="round" />
          <path d="M180 50 L118 74" stroke="#000" strokeWidth="11" strokeLinecap="round" />
          {/* Gaping Jagged Horror Jaw + Sharp Fangs */}
          <path
            d="M46 134 Q110 202 174 134 Q140 152 110 144 Q80 152 46 134 Z"
            fill="#140204"
            stroke="#000"
            strokeWidth="5"
          />
          <polygon points="62,140 70,162 79,143" fill="#f8fafc" />
          <polygon points="84,144 92,165 100,145" fill="#f8fafc" />
          <polygon points="120,145 128,165 136,144" fill="#f8fafc" />
          <polygon points="141,143 150,162 158,140" fill="#f8fafc" />
          <polygon points="75,172 83,155 91,170" fill="#f8fafc" />
          <polygon points="129,170 137,155 145,172" fill="#f8fafc" />
        </svg>
      </div>

      <h2
        className="font-display text-3xl sm:text-5xl font-extrabold tracking-wide mb-2"
        style={{ color: palette.accent }}
      >
        {jumpscare.title}
      </h2>
      <p className="text-sm sm:text-base text-slate-100 max-w-md mb-6">{jumpscare.subtitle}</p>

      <button
        type="button"
        onClick={onDismiss}
        className="px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-sm font-bold text-white cursor-pointer"
      >
        Kembali ke Checkpoint Terakhir
      </button>
    </div>
  );
}
