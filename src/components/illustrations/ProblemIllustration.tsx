export default function ProblemIllustration() {
  return (
    <div className="relative w-full max-w-xs mx-auto aspect-square">
      {/* Background shape */}
      <div className="absolute inset-0 rounded-3xl bg-muted/40" />

      {/* "Messy" side */}
      <div className="absolute top-6 left-4 w-[42%] h-[80%] space-y-2 opacity-60">
        <div className="h-6 rounded-lg bg-destructive/10 border border-destructive/15 rotate-[-2deg]" />
        <div className="h-5 rounded-lg bg-warning/10 border border-warning/15 rotate-[1deg] ml-2" />
        <div className="h-7 rounded-lg bg-destructive/8 border border-destructive/10 rotate-[-1deg]" />
        <div className="h-4 rounded-lg bg-warning/8 border border-warning/10 rotate-[2deg] ml-1" />
        <div className="h-6 rounded-lg bg-muted-foreground/8 border border-muted-foreground/10 rotate-[-1.5deg]" />
        <div className="text-center text-lg mt-1">😩</div>
      </div>

      {/* Arrow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* "Organised" side */}
      <div className="absolute top-8 right-4 w-[40%] h-[72%] rounded-2xl bg-card border border-border shadow-sm p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-12 rounded bg-primary/15" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-10 rounded bg-primary/12" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-14 rounded bg-primary/10" />
        </div>
        <div className="text-center text-lg mt-2">😌</div>
      </div>
    </div>
  );
}
