import { useEffect, useState } from 'react';

const floatingCards = [
  { label: 'Request quotes', x: 10, y: 20, delay: 0 },
  { label: 'Compare', x: 55, y: 10, delay: 0.5 },
  { label: 'Confirm ✓', x: 35, y: 70, delay: 1 },
];

const icons = [
  { emoji: '📅', x: 5, y: 60, size: 28, delay: 0.3 },
  { emoji: '📋', x: 80, y: 55, size: 24, delay: 0.7 },
  { emoji: '⛺', x: 85, y: 15, size: 22, delay: 1.2 },
  { emoji: '🍲', x: 10, y: 85, size: 22, delay: 0.9 },
];

export default function HeroIllustration() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square">
      {/* Decorative blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-[10%] left-[5%] w-24 h-24 rounded-full bg-primary/8" />
        <div className="absolute bottom-[15%] right-[10%] w-32 h-32 rounded-full bg-secondary/8" />
        <div className="absolute top-[50%] right-[5%] w-16 h-16 rounded-full bg-accent/6" />
      </div>

      {/* Phone mock */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[65%] rounded-3xl border-2 border-primary/20 bg-card shadow-xl overflow-hidden">
        <div className="h-6 bg-primary/10 flex items-center justify-center">
          <div className="w-12 h-1.5 rounded-full bg-primary/20" />
        </div>
        <div className="p-3 space-y-2">
          <div className="h-2 w-3/4 rounded bg-primary/15" />
          <div className="h-2 w-1/2 rounded bg-primary/10" />
          <div className="mt-3 space-y-1.5">
            <div className="h-8 rounded-lg bg-primary/8 border border-primary/10" />
            <div className="h-8 rounded-lg bg-secondary/8 border border-secondary/10" />
            <div className="h-8 rounded-lg bg-accent/8 border border-accent/10" />
          </div>
        </div>
      </div>

      {/* Floating cards */}
      {floatingCards.map((card, i) => (
        <div
          key={card.label}
          className="absolute transition-all duration-700 ease-out"
          style={{
            left: `${card.x}%`,
            top: `${card.y}%`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: `${card.delay}s`,
          }}
        >
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border shadow-md text-xs font-medium text-foreground whitespace-nowrap">
            {card.label}
          </div>
        </div>
      ))}

      {/* Floating icons */}
      {icons.map((icon) => (
        <div
          key={icon.emoji}
          className="absolute transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            fontSize: icon.size,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transitionDelay: `${icon.delay}s`,
            animation: visible ? `gentle-float 4s ease-in-out ${icon.delay}s infinite` : 'none',
          }}
        >
          {icon.emoji}
        </div>
      ))}

      <style>{`
        @keyframes gentle-float {
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
