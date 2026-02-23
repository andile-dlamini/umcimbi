interface StepIllustrationProps {
  step: 1 | 2 | 3;
}

export default function StepIllustration({ step }: StepIllustrationProps) {
  const configs = {
    1: {
      bg: 'bg-primary/10',
      icon: '🎉',
      shapes: (
        <>
          <circle cx="10" cy="10" r="4" className="fill-secondary/30" />
          <rect x="32" y="6" width="8" height="8" rx="2" className="fill-accent/20" />
        </>
      ),
    },
    2: {
      bg: 'bg-secondary/10',
      icon: '📊',
      shapes: (
        <>
          <circle cx="38" cy="12" r="3" className="fill-primary/20" />
          <rect x="4" y="30" width="6" height="6" rx="1" className="fill-secondary/25" />
        </>
      ),
    },
    3: {
      bg: 'bg-accent/10',
      icon: '✅',
      shapes: (
        <>
          <circle cx="8" cy="35" r="3" className="fill-primary/15" />
          <circle cx="35" cy="8" r="5" className="fill-accent/15" />
        </>
      ),
    },
  };

  const c = configs[step];

  return (
    <div className={`relative w-16 h-16 rounded-2xl ${c.bg} flex items-center justify-center`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 44 44">
        {c.shapes}
      </svg>
      <span className="text-2xl relative z-10">{c.icon}</span>
    </div>
  );
}
