import { useEffect, useState } from 'react';

export default function HeroSereneIllustration() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5]">
      {/* Glowing backdrop */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/[0.12] via-secondary/[0.06] to-accent/[0.08]" />

      {/* Decorative rings */}
      <div className="absolute top-[5%] right-[8%] w-32 h-32 rounded-full border-2 border-primary/[0.08]" />
      <div className="absolute bottom-[10%] left-[5%] w-24 h-24 rounded-full border-2 border-secondary/[0.08]" />
      <div className="absolute top-[35%] left-[3%] w-12 h-12 rounded-full bg-accent/[0.08]" />

      {/* Back card 2 */}
      <div
        className="absolute left-[8%] top-[16%] w-[44%] h-[30%] rounded-2xl bg-card/90 border border-border shadow-lg transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 0.85 : 0,
          transform: visible ? 'rotate(-6deg) translateY(0)' : 'rotate(-6deg) translateY(20px)',
        }}
      >
        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary/20" />
            <div className="h-2 w-16 rounded bg-foreground/10" />
          </div>
          <div className="h-2 w-20 rounded bg-muted-foreground/10" />
          <div className="h-7 w-full rounded-lg bg-secondary/12 flex items-center justify-center mt-1">
            <span className="text-[8px] font-semibold text-secondary">R 3,200 — Catering</span>
          </div>
        </div>
      </div>

      {/* Back card 1 */}
      <div
        className="absolute right-[6%] top-[10%] w-[42%] h-[26%] rounded-2xl bg-card/80 border border-border shadow-md transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 0.75 : 0,
          transform: visible ? 'rotate(5deg) translateY(0)' : 'rotate(5deg) translateY(20px)',
          transitionDelay: '150ms',
        }}
      >
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent/20" />
            <div className="h-2 w-12 rounded bg-foreground/10" />
          </div>
          <div className="h-6 w-full rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-[8px] font-semibold text-accent">R 1,800 — Decor</span>
          </div>
        </div>
      </div>

      {/* Main phone */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[54%] h-[70%] rounded-[2rem] border-2 border-primary/20 bg-card shadow-2xl shadow-primary/[0.12] overflow-hidden transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translate(-50%, -50%) translateY(0)' : 'translate(-50%, -50%) translateY(24px)',
          transitionDelay: '300ms',
        }}
      >
        {/* Status bar */}
        <div className="h-8 bg-primary flex items-center justify-center">
          <div className="w-14 h-1.5 rounded-full bg-primary-foreground/30" />
        </div>

        {/* Screen content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">U</span>
            </div>
            <div>
              <div className="h-2 w-20 rounded bg-foreground/12" />
              <div className="h-1.5 w-14 rounded bg-muted-foreground/8 mt-1" />
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {/* Quote card 1 */}
            <div className="rounded-xl border border-primary/15 p-3 space-y-1.5 bg-primary/[0.03]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-primary/15" />
                  <div className="h-1.5 w-14 rounded bg-primary/15" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-primary/15">
                  <span className="text-[7px] font-bold text-primary">R 2,400</span>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-1 w-8 rounded bg-primary/10" />
                <div className="h-1 w-6 rounded bg-primary/8" />
              </div>
            </div>

            {/* Quote card 2 */}
            <div className="rounded-xl border border-secondary/15 p-3 space-y-1.5 bg-secondary/[0.03]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-secondary/15" />
                  <div className="h-1.5 w-16 rounded bg-secondary/15" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-secondary/15">
                  <span className="text-[7px] font-bold text-secondary">R 3,100</span>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-1 w-10 rounded bg-secondary/10" />
                <div className="h-1 w-5 rounded bg-secondary/8" />
              </div>
            </div>

            {/* Action button */}
            <div className="h-9 rounded-xl bg-primary flex items-center justify-center mt-2 shadow-md shadow-primary/20">
              <span className="text-[10px] font-bold text-primary-foreground">Compare Quotes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="absolute bottom-[10%] right-[5%] transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '800ms',
          animation: visible ? 'serene-float 5s ease-in-out 1s infinite' : 'none',
        }}
      >
        <div className="px-3.5 py-2 rounded-xl bg-card border border-border shadow-lg text-[11px] font-semibold text-foreground flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
            <span className="text-[8px]">✓</span>
          </div>
          Confirmed
        </div>
      </div>

      <div
        className="absolute top-[6%] left-[15%] transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '1000ms',
          animation: visible ? 'serene-float 6s ease-in-out 1.5s infinite' : 'none',
        }}
      >
        <div className="px-3 py-1.5 rounded-lg bg-card border border-border shadow-md text-[10px] font-medium text-muted-foreground">
          📅 Umembeso · 15 Mar
        </div>
      </div>

      <style>{`
        @keyframes serene-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
