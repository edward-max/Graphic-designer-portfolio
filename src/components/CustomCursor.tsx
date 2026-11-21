import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [label, setLabel] = useState<string | null>(null);
  const [isPointer, setIsPointer] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorEl) {
        const mode = cursorEl.getAttribute('data-cursor');
        if (mode === 'view') {
          setLabel('VIEW');
          setIsPointer(true);
          return;
        }
        if (mode === 'folder') {
          setLabel('OPEN');
          setIsPointer(true);
          return;
        }
      }

      setLabel(null);
      const interactive = target.closest('a, button, input, select, textarea, [role="button"]');
      setIsPointer(Boolean(interactive));
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (!enabled || !visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 pointer-events-none z-[100] transition-opacity duration-150"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
    >
      {label ? (
        <div className="-translate-x-1/2 -translate-y-1/2 px-3.5 py-2 rounded-full bg-white text-neutral-950 font-['Space_Grotesk'] text-[11px] font-bold tracking-widest shadow-2xl">
          {label}
        </div>
      ) : (
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform duration-150 ${
            isPointer
              ? 'w-9 h-9 border-violet-400/70 bg-violet-500/15 scale-110'
              : 'w-5 h-5 border-white/40 bg-white/5 scale-100'
          }`}
        />
      )}
    </div>
  );
};
