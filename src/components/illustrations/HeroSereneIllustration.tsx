import { useEffect, useState } from 'react';

export default function HeroSereneIllustration() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5]">
      {/* Glowing backdrop */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/[0.12] via-secondary/[0.06] to-accent/[0.08]" />

      {/* Main phone — Event Dashboard */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] h-[78%] rounded-[2rem] border-2 border-white/15 bg-[hsl(220_20%_13%)] shadow-2xl shadow-primary/[0.15] overflow-hidden transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translate(-50%, -50%) translateY(0)' : 'translate(-50%, -50%) translateY(24px)',
        }}
      >
        {/* Status bar */}
        <div className="h-7 bg-primary flex items-center justify-between px-3">
          <span className="text-[7px] font-bold text-primary-foreground/70">9:41</span>
          <div className="w-14 h-1.5 rounded-full bg-primary-foreground/20" />
          <div className="flex gap-1">
            <div className="w-2.5 h-1.5 rounded-sm bg-primary-foreground/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/40" />
          </div>
        </div>

        {/* App header */}
        <div className="px-3.5 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-[7px] font-bold text-primary-foreground">U</span>
              </div>
              <div>
                <div className="text-[8px] font-bold text-white">My Umembeso</div>
                <div className="text-[6px] text-white/40">15 Mar 2025 · Durban</div>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-secondary/20">
              <span className="text-[6px] font-semibold text-secondary">Planning</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-3.5 pb-2">
          <div className="flex justify-between text-[6px] text-white/40 mb-1">
            <span>Progress</span>
            <span className="text-primary font-semibold">65%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div className="h-1.5 rounded-full bg-primary w-[65%]" />
          </div>
        </div>

        {/* Budget summary card */}
        <div className="mx-3.5 mb-2 rounded-xl bg-white/[0.06] border border-white/8 p-2.5">
          <div className="text-[6px] text-white/40 mb-1.5">Budget Overview</div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[11px] font-bold text-white">R 28,500</div>
              <div className="text-[6px] text-white/30">of R 45,000</div>
            </div>
            <div className="flex gap-1.5">
              <div className="text-center">
                <div className="w-4 h-8 rounded-sm bg-primary/30 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full h-[70%] bg-primary rounded-sm" />
                </div>
                <div className="text-[5px] text-white/30 mt-0.5">Cat</div>
              </div>
              <div className="text-center">
                <div className="w-4 h-8 rounded-sm bg-secondary/30 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full h-[45%] bg-secondary rounded-sm" />
                </div>
                <div className="text-[5px] text-white/30 mt-0.5">Dec</div>
              </div>
              <div className="text-center">
                <div className="w-4 h-8 rounded-sm bg-accent/30 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full h-[55%] bg-accent rounded-sm" />
                </div>
                <div className="text-[5px] text-white/30 mt-0.5">Tent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor cards */}
        <div className="px-3.5 space-y-1.5">
          <div className="text-[6px] text-white/40 mb-1">Booked Vendors</div>

          {/* Vendor 1 - Catering */}
          <div className="rounded-lg border border-primary/15 p-2 bg-primary/[0.04] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-[10px]">🍲</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[7px] font-semibold text-white">Mama Dlamini's Kitchen</div>
              <div className="text-[6px] text-white/35">Catering · 100 guests</div>
            </div>
            <div className="px-1.5 py-0.5 rounded bg-primary/15">
              <span className="text-[6px] font-bold text-primary">R 12,000</span>
            </div>
          </div>

          {/* Vendor 2 - Decor */}
          <div className="rounded-lg border border-secondary/15 p-2 bg-secondary/[0.04] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
              <span className="text-[10px]">🎨</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[7px] font-semibold text-white">Zulu Elegance Decor</div>
              <div className="text-[6px] text-white/35">Decor · Traditional</div>
            </div>
            <div className="px-1.5 py-0.5 rounded bg-secondary/15">
              <span className="text-[6px] font-bold text-secondary">R 8,500</span>
            </div>
          </div>

          {/* Vendor 3 - Tents */}
          <div className="rounded-lg border border-white/8 p-2 bg-white/[0.03] flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <span className="text-[10px]">⛺</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[7px] font-semibold text-white">KZN Tent Hire</div>
              <div className="text-[6px] text-white/35">Tents · 1× marquee</div>
            </div>
            <div className="px-1.5 py-0.5 rounded bg-accent/15">
              <span className="text-[6px] font-bold text-accent">R 8,000</span>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[hsl(220_20%_10%)] border-t border-white/8 flex items-center justify-around px-4">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3.5 h-3.5 rounded bg-primary/30" />
            <span className="text-[5px] text-primary font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3.5 h-3.5 rounded bg-white/15" />
            <span className="text-[5px] text-white/30">Vendors</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3.5 h-3.5 rounded bg-white/15" />
            <span className="text-[5px] text-white/30">Chat</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-3.5 h-3.5 rounded bg-white/15" />
            <span className="text-[5px] text-white/30">Profile</span>
          </div>
        </div>
      </div>

      {/* Floating badge — confirmed booking */}
      <div
        className="absolute bottom-[12%] right-[3%] transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '800ms',
          animation: visible ? 'serene-float 5s ease-in-out 1s infinite' : 'none',
        }}
      >
        <div className="px-3 py-2 rounded-xl bg-[hsl(220_20%_13%)] border border-white/10 shadow-lg text-[10px] font-semibold text-white flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-primary/25 flex items-center justify-center">
            <span className="text-[8px] text-primary">✓</span>
          </div>
          Booking confirmed
        </div>
      </div>

      {/* Floating badge — event date */}
      <div
        className="absolute top-[6%] left-[8%] transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '1000ms',
          animation: visible ? 'serene-float 6s ease-in-out 1.5s infinite' : 'none',
        }}
      >
        <div className="px-3 py-1.5 rounded-lg bg-[hsl(220_20%_13%)] border border-white/10 shadow-md text-[10px] font-medium text-white/70">
          📅 Umembeso · 15 Mar
        </div>
      </div>

      {/* Floating badge — quote received */}
      <div
        className="absolute top-[20%] right-[2%] transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '1200ms',
          animation: visible ? 'serene-float 5.5s ease-in-out 2s infinite' : 'none',
        }}
      >
        <div className="px-2.5 py-1.5 rounded-lg bg-secondary/20 border border-secondary/20 shadow-md text-[9px] font-semibold text-secondary">
          💬 New quote: R 3,200
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
