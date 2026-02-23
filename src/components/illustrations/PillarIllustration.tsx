interface PillarIllustrationProps {
  variant: 'trusted' | 'quotes' | 'organised';
}

export default function PillarIllustration({ variant }: PillarIllustrationProps) {
  const configs = {
    trusted: {
      bg: 'bg-primary/[0.06]',
      icon: (
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle cx="24" cy="24" r="20" className="fill-primary/[0.08]" />
          <path d="M24 12 L28 20 L36 21 L30 27 L31.5 35 L24 31 L16.5 35 L18 27 L12 21 L20 20 Z" className="fill-primary/20 stroke-primary/30" strokeWidth="1" />
          <circle cx="24" cy="24" r="4" className="fill-primary/25" />
        </svg>
      ),
    },
    quotes: {
      bg: 'bg-secondary/[0.06]',
      icon: (
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <rect x="8" y="10" width="14" height="28" rx="3" className="fill-primary/10 stroke-primary/15" strokeWidth="1" />
          <rect x="26" y="10" width="14" height="28" rx="3" className="fill-secondary/10 stroke-secondary/15" strokeWidth="1" />
          <line x1="12" y1="18" x2="18" y2="18" className="stroke-primary/20" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="22" x2="16" y2="22" className="stroke-primary/15" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="30" y1="18" x2="36" y2="18" className="stroke-secondary/20" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="30" y1="22" x2="34" y2="22" className="stroke-secondary/15" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    organised: {
      bg: 'bg-accent/[0.06]',
      icon: (
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <rect x="10" y="8" width="28" height="32" rx="4" className="fill-primary/[0.06] stroke-primary/10" strokeWidth="1" />
          <circle cx="18" cy="18" r="2.5" className="fill-primary/20" />
          <line x1="24" y1="18" x2="34" y2="18" className="stroke-primary/15" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="18" cy="26" r="2.5" className="fill-accent/20" />
          <line x1="24" y1="26" x2="32" y2="26" className="stroke-accent/15" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="18" cy="34" r="2.5" className="fill-muted-foreground/15" />
          <line x1="24" y1="34" x2="30" y2="34" className="stroke-muted-foreground/10" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  };

  const c = configs[variant];

  return (
    <div className={`w-16 h-16 rounded-2xl ${c.bg} p-2 shrink-0`}>
      {c.icon}
    </div>
  );
}
