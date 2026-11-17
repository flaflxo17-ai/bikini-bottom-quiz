import { useEffect, useRef, useState } from 'react';
import { HudState } from '../types/game';
import { VirtualInputState } from './GameCanvas';
import {
  ArrowUp,
  Camera,
  EyeOff,
  Flashlight,
  Hand,
  Laptop,
  Map as MapIcon,
  Pause,
  Smartphone,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { formatDuration } from '../game/rules';

interface GameHUDProps {
  hud: HudState;
  muted: boolean;
  controlMode: 'hp' | 'laptop';
  virtualInputRef: React.MutableRefObject<VirtualInputState>;
  onPause: () => void;
  onToggleMute: () => void;
  onChangeControlMode: (mode: 'hp' | 'laptop') => void;
  onUfoConfirm: () => void;
}

export function GameHUD({
  hud,
  muted,
  controlMode,
  virtualInputRef,
  onPause,
  onToggleMute,
  onChangeControlMode,
  onUfoConfirm,
}: GameHUDProps) {
  const joyRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);
  const [runToggle, setRunToggle] = useState(false);
  const [physicalCodes, setPhysicalCodes] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setJoyActive(false);
    setKnobOffset({ x: 0, y: 0 });
    virtualInputRef.current.moveX = 0;
    virtualInputRef.current.moveY = 0;
    virtualInputRef.current.turnX = 0;
  }, [controlMode, virtualInputRef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setPhysicalCodes((prev) => {
        if (prev.has(e.code)) return prev;
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });
    };
    const onKeyUp = (e: KeyboardEvent) => {
      setPhysicalCodes((prev) => {
        if (!prev.has(e.code)) return prev;
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };
    const onBlur = () => {
      setPhysicalCodes(new Set());
      setJoyActive(false);
      setKnobOffset({ x: 0, y: 0 });
      virtualInputRef.current.moveX = 0;
      virtualInputRef.current.moveY = 0;
      virtualInputRef.current.turnX = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [virtualInputRef]);

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    virtualInputRef.current.moveX = dx / maxR;
    virtualInputRef.current.moveY = -dy / maxR;
  };

  const resetJoystick = () => {
    setJoyActive(false);
    setKnobOffset({ x: 0, y: 0 });
    virtualInputRef.current.moveX = 0;
    virtualInputRef.current.moveY = 0;
  };

  const kbdBadge = (label: string, hint: string, active: boolean) => (
    <div
      key={label}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
        active
          ? 'bg-amber-400 text-slate-950 border-white'
          : 'bg-[#071327]/88 text-slate-200 border-sky-400/25'
      }`}
    >
      <span className="font-mono-num px-1 py-0.2 rounded bg-slate-900/70 text-amber-300 text-[10px]">
        {label}
      </span>
      <span className={active ? 'text-slate-950' : 'text-slate-300'}>{hint}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none overflow-hidden">
      {/* Wake-up Eyelids & Blur Effect during Pos 1 opening */}
      {hud.wakeProgress < 1 && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, rgba(0,0,0,${(1 - hud.wakeProgress) * 0.4}) 25%, rgba(0,0,0,${0.92 - hud.wakeProgress * 0.85}) 85%)`,
          }}
        >
          <div
            className="absolute top-0 inset-x-0 bg-black"
            style={{ height: `${Math.max(0, (1 - hud.wakeProgress) * 46)}%` }}
          />
          <div
            className="absolute bottom-0 inset-x-0 bg-black"
            style={{ height: `${Math.max(0, (1 - hud.wakeProgress) * 46)}%` }}
          />
        </div>
      )}

      {/* Red Danger Vignette */}
      {(hud.redAlertFlash > 0 || hud.suspicionLevel > 40) && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 90px rgba(239, 68, 68, ${Math.max(
              hud.redAlertFlash,
              (hud.suspicionLevel / 100) * 0.65
            )})`,
          }}
        />
      )}

      {/* TOP BAR */}
      <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-3 p-2.5 sm:p-4">
        {/* Top-Left Objective & Status */}
        <div className="min-w-0 flex-1 max-w-[205px] sm:max-w-[330px] rounded-xl bg-[#071226]/90 border border-sky-400/25 px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-lg">
          <div className="flex items-center justify-between gap-1 text-[9.5px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-amber-300">
            <span className="truncate">{hud.stageTitle}</span>
            <span className="font-mono-num text-sky-300 shrink-0">{formatDuration(hud.elapsedSeconds)}</span>
          </div>
          <p className="text-[11px] sm:text-sm font-semibold text-white mt-0.5 leading-snug">
            {hud.objectiveText}
          </p>
          {hud.subHint && (
            <p className="text-[10px] sm:text-[11px] text-sky-200/85 mt-0.5 leading-snug">{hud.subHint}</p>
          )}

          {/* Safe Code Progress in Pos 1 */}
          {hud.stage === 'pos1_krusty_krab' && (
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 mr-0.5">Kode:</span>
              {hud.safeCodeTarget.map((digit, idx) => {
                const unlocked = hud.safeDigitsFound.includes(idx);
                return (
                  <span
                    key={idx}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-mono-num text-[11px] sm:text-xs font-bold border ${
                      unlocked
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                        : 'bg-slate-900/90 border-slate-700 text-slate-500'
                    }`}
                  >
                    {unlocked ? digit : '?'}
                  </span>
                );
              })}
              {hud.hasDoorKey && (
                <span className="ml-1 text-[10px] sm:text-[11px] font-bold text-amber-300">Kunci ✓</span>
              )}
            </div>
          )}

          {/* Map Badge */}
          {hud.hasMap && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-300">
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta Bikini Bottom ✓</span>
            </div>
          )}

          {/* Stamina Bar */}
          <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 w-8 sm:w-10">Lari</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-[width] duration-100"
                style={{ width: `${hud.stamina}%` }}
              />
            </div>
          </div>

          {/* Sandy Boss: Stealth + 5 Question Survival Progress */}
          {hud.stage === 'pos6_sandy_boss' && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                <span>Soal Selamat</span>
                <span className="font-mono-num">{hud.sandyBattleCorrect}/5 Benar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-slate-300 flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-emerald-400" />
                  {hud.isHiding ? 'Tersembunyi' : 'Terlihat'}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-100 ${
                      hud.suspicionLevel > 65 ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${hud.suspicionLevel}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Camellia Pillar Puzzle Progress */}
          {hud.stage === 'pos7_tree_portal' && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-pink-300">Pilar</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-pink-400 transition-[width] duration-150"
                  style={{ width: `${Math.round((hud.camelliaStep / 4) * 100)}%` }}
                />
              </div>
              <span className="font-mono-num text-[10px] font-bold text-pink-200">{hud.camelliaStep}/4</span>
            </div>
          )}
        </div>

        {/* Top-Right Compact Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pointer-events-auto">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#071226]/90 border border-slate-700/80 text-xs text-slate-300 font-mono-num">
            <span>Soal: {hud.answeredCount}</span>
            <span aria-hidden="true">·</span>
            <span>Pos: {hud.checkpointsCleared}/7</span>
          </div>

          {/* 3rd / 1st Person Camera Toggle */}
          <button
            type="button"
            aria-label={`Ganti kamera (saat ini ${hud.cameraView === '3rd' ? 'Orang Ketiga' : 'Orang Pertama'})`}
            onClick={(e) => {
              e.currentTarget.blur();
              virtualInputRef.current.cameraTogglePressed = true;
            }}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#071226]/90 hover:bg-[#0e2042] border border-sky-400/25 text-[10px] sm:text-[11px] font-bold text-sky-200 cursor-pointer shadow-md"
          >
            <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>{hud.cameraView === '3rd' ? '3rd' : '1st'}</span>
          </button>

          {/* 1-Click HP / Laptop Mode Switcher */}
          <div
            role="group"
            aria-label="Mode Kontrol"
            className="flex items-center p-0.5 rounded-xl bg-[#071226]/90 border border-sky-400/25 shadow-md"
          >
            <button
              type="button"
              aria-pressed={controlMode === 'hp'}
              aria-label="Mode Kontrol HP"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeControlMode('hp');
              }}
              className={`flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-colors cursor-pointer ${
                controlMode === 'hp'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>HP</span>
            </button>
            <button
              type="button"
              aria-pressed={controlMode === 'laptop'}
              aria-label="Mode Kontrol Laptop"
              onClick={(e) => {
                e.currentTarget.blur();
                onChangeControlMode('laptop');
              }}
              className={`flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-colors cursor-pointer ${
                controlMode === 'laptop'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Laptop</span>
            </button>
          </div>

          <button
            type="button"
            aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#071226]/90 hover:bg-[#0e2042] border border-sky-400/25 flex items-center justify-center text-slate-200 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-300" />}
          </button>
          <button
            type="button"
            aria-label="Jeda permainan"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#071226]/90 hover:bg-[#0e2042] border border-sky-400/25 flex items-center justify-center text-slate-200 cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER CROSSHAIR */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 shadow-[0_0_6px_rgba(0,0,0,0.9)] pointer-events-none" />

      {/* CENTER INTERACTION PROMPT OR POS 4 CONFIRM */}
      {hud.interactPrompt && (
        <div className="fixed left-1/2 top-[58%] -translate-x-1/2 px-4 py-2 rounded-xl bg-[#071226]/95 border border-amber-400/60 text-amber-200 text-xs sm:text-sm font-bold shadow-lg text-center">
          {hud.interactPrompt}
        </div>
      )}

      {hud.ufoChoicePending && (
        <div className="fixed left-1/2 top-[65%] -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onUfoConfirm();
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm shadow-xl cursor-pointer"
          >
            Lari Ikuti SpongeBob ke Rumah Sandy →
          </button>
        </div>
      )}

      {/* DIALOGUE SUBTITLE BOX */}
      {hud.dialogue && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 w-[min(520px,88vw)] rounded-xl bg-[#071226]/92 border border-sky-400/30 px-4 py-3 shadow-xl ${
            controlMode === 'hp' ? 'bottom-36 sm:bottom-8' : 'bottom-16'
          }`}
        >
          <div
            className={`text-xs font-extrabold uppercase tracking-wider mb-0.5 ${
              hud.dialogue.tone === 'warning' || hud.dialogue.tone === 'creepy'
                ? 'text-red-400'
                : 'text-amber-300'
            }`}
          >
            {hud.dialogue.speaker}
          </div>
          <p className="text-xs sm:text-sm text-slate-100 leading-snug">{hud.dialogue.text}</p>
        </div>
      )}

      {/* =================================================================== */}
      {/* HP CONTROLS: Round Left Virtual Joystick + 4 Circular Action Buttons */}
      {/* =================================================================== */}
      {controlMode === 'hp' && (
        <>
          <div
            ref={joyRef}
            aria-label="Joystick Gerak"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              setJoyActive(true);
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!joyActive) return;
              e.stopPropagation();
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              resetJoystick();
            }}
            onPointerCancel={resetJoystick}
            className="fixed bottom-5 left-5 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#08152b]/75 border-2 border-sky-300/40 flex items-center justify-center pointer-events-auto touch-none"
          >
            <div
              className="w-12 h-12 rounded-full bg-amber-400/90 border-2 border-white/70 shadow-md transition-transform duration-75"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
            />
          </div>

          <div className="fixed bottom-5 right-5 grid grid-cols-2 gap-2.5 pointer-events-auto">
            <button
              type="button"
              aria-label="FLASHLIGHT"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
                virtualInputRef.current.flashlightTogglePressed = true;
              }}
              className={`w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center text-[10px] font-bold transition-transform active:scale-90 cursor-pointer ${
                hud.flashlightOn
                  ? 'bg-amber-400/90 border-amber-200 text-slate-950'
                  : 'bg-[#08152b]/85 border-slate-500 text-slate-200'
              }`}
            >
              <Flashlight className="w-4 h-4" />
              <span className="mt-0.5">SENTER</span>
            </button>

            <button
              type="button"
              aria-label="RUN"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
                const next = !runToggle;
                setRunToggle(next);
                virtualInputRef.current.runHeld = next;
              }}
              className={`w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center text-[10px] font-bold transition-transform active:scale-90 cursor-pointer ${
                runToggle
                  ? 'bg-sky-400/90 border-white text-slate-950'
                  : 'bg-[#08152b]/85 border-sky-400/40 text-sky-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="mt-0.5">RUN</span>
            </button>

            <button
              type="button"
              aria-label="ACTION"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
                virtualInputRef.current.actionPressed = true;
              }}
              className="w-14 h-14 rounded-full bg-emerald-500/90 hover:bg-emerald-400 border-2 border-emerald-200 text-slate-950 flex flex-col items-center justify-center text-[10px] font-extrabold shadow-lg transition-transform active:scale-90 cursor-pointer"
            >
              <Hand className="w-4 h-4" />
              <span className="mt-0.5">ACTION</span>
            </button>

            <button
              type="button"
              aria-label="JUMP"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
                virtualInputRef.current.jumpPressed = true;
              }}
              className="w-14 h-14 rounded-full bg-amber-500/90 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 flex flex-col items-center justify-center text-[10px] font-extrabold shadow-lg transition-transform active:scale-90 cursor-pointer"
            >
              <ArrowUp className="w-5 h-5" />
              <span className="mt-0.5">JUMP</span>
            </button>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* LAPTOP CONTROLS: Clean Physical Keyboard Guide (No Virtual Buttons!) */}
      {/* =================================================================== */}
      {controlMode === 'laptop' && (
        <div
          aria-label="Panduan Kontrol Keyboard Laptop"
          className="fixed bottom-4 left-4 right-4 flex flex-wrap items-center justify-center gap-1.5 pointer-events-none"
        >
          {kbdBadge(
            'WASD / Panah',
            'Gerak',
            physicalCodes.has('KeyW') ||
              physicalCodes.has('KeyA') ||
              physicalCodes.has('KeyS') ||
              physicalCodes.has('KeyD') ||
              physicalCodes.has('ArrowUp') ||
              physicalCodes.has('ArrowLeft') ||
              physicalCodes.has('ArrowDown') ||
              physicalCodes.has('ArrowRight')
          )}
          {kbdBadge('Seret / Q C', 'Kamera', physicalCodes.has('KeyQ') || physicalCodes.has('KeyC'))}
          {kbdBadge('Shift', 'Lari', physicalCodes.has('ShiftLeft') || physicalCodes.has('ShiftRight'))}
          {kbdBadge('Space', 'Lompat', physicalCodes.has('Space'))}
          {kbdBadge('E', 'Aksi', physicalCodes.has('KeyE'))}
          {kbdBadge('F', hud.flashlightOn ? 'Senter ON' : 'Senter OFF', physicalCodes.has('KeyF'))}
          {kbdBadge('V', `Kamera ${hud.cameraView === '3rd' ? '3rd' : '1st'}`, physicalCodes.has('KeyV'))}
        </div>
      )}
    </div>
  );
}
