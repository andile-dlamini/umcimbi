import { useEffect, useState } from 'react';

export default function HeroSereneIllustration() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5]">
      {/* Abstract bg shapes */}
      <div className="absolute top-[8%] right-[5%] w-40 h-40 rounded-full bg-primary/[0.04]" />
      <div className="absolute bottom-[12%] left-[2%] w-28 h-28 rounded-full bg-secondary/[0.04]" />
      <div className="absolute top-[40%] left-[8%] w-16 h-16 rounded-full bg-accent/[0.03]" />

      {/* Back card 2 */}
      <div
        className="absolute left-[12%] top-[18%] w-[42%] h-[28%] rounded-2xl bg-card border border-border/60 shadow-sm transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 0.7 : 0,
          transform: visible ? 'rotate(-6deg) translateY(0)' : 'rotate(-6deg) translateY(16px)',
        }}
      >
        <div className="p-4 space-y-2">
          <div className="h-1.5 w-16 rounded bg-primary/12" />
          <div className="h-1.5 w-10 rounded bg-muted-foreground/10" />
          <div className="h-5 w-full rounded-lg bg-secondary/8 mt-3" />
        </div>
      </div>

      {/* Back card 1 */}
      <div
        className="absolute right-[10%] top-[12%] w-[40%] h-[24%] rounded-2xl bg-card border border-border/60 shadow-sm transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 0.6 : 0,
          transform: visible ? 'rotate(4deg) translateY(0)' : 'rotate(4deg) translateY(16px)',
          transitionDelay: '150ms',
        }}
      >
        <div className="p-4 space-y-2">
          <div className="h-1.5 w-12 rounded bg-accent/12" />
          <div className="h-1.5 w-8 rounded bg-muted-foreground/10" />
        </div>
      </div>

      {/* Main phone */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[52%] h-[72%] rounded-[2rem] border-2 border-border/40 bg-card shadow-2xl shadow-primary/[0.08] overflow-hidden transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? 'translate(-50%, -50%) translateY(0)'
            : 'translate(-50%, -50%) translateY(20px)',
          transitionDelay: '300ms',
        }}
      >
        {/* Status bar */}
        <div className="h-8 bg-primary/[0.06] flex items-center justify-center">
          <div className="w-14 h-1.5 rounded-full bg-primary/15" />
        </div>

        {/* Screen content */}
        <div className="p-4 space-y-3">
          <div className="h-2 w-3/5 rounded bg-foreground/10" />
          <div className="h-1.5 w-2/5 rounded bg-muted-foreground/8" />

          <div className="mt-4 space-y-2.5">
            {/* Quote card mini */}
            <div className="rounded-xl border border-border/50 p-3 space-y-1.5 bg-background/50">
              <div className="flex justify-between items-center">
                <div className="h-1.5 w-14 rounded bg-primary/15" />
                <div className="h-4 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[7px] font-medium text-primary">R 2,400</span>
                </div>
              </div>
              <div className="h-1 w-20 rounded bg-muted-foreground/8" />
            </div>

            {/* Quote card mini 2 */}
            <div className="rounded-xl border border-border/50 p-3 space-y-1.5 bg-background/50">
              <div className="flex justify-between items-center">
                <div className="h-1.5 w-16 rounded bg-secondary/15" />
                <div className="h-4 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-[7px] font-medium text-secondary">R 3,100</span>
                </div>
              </div>
              <div className="h-1 w-16 rounded bg-muted-foreground/8" />
            </div>

            {/* Action button */}
            <div className="h-8 rounded-xl bg-primary/12 flex items-center justify-center mt-2">
              <span className="text-[9px] font-semibold text-primary">Compare Quotes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating label */}
      <div
        className="absolute bottom-[8%] right-[8%] transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '800ms',
          animation: visible ? 'serene-float 5s ease-in-out 1s infinite' : 'none',
        }}
      >
        <div className="px-3 py-1.5 rounded-full bg-card border border-border shadow-md text-[11px] font-medium text-foreground">
          ✓ Confirmed
        </div>
      </div>

      <style>{`
        @keyframes serene-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
