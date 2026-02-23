export default function VendorSereneIllustration() {
  return (
    <div className="relative w-full max-w-xs mx-auto aspect-square">
      <div className="absolute inset-4 rounded-3xl bg-primary/[0.04]" />
      <div className="absolute top-10 left-10 right-10 bottom-10 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="h-6 bg-primary/[0.06] flex items-center px-3">
          <div className="w-2 h-2 rounded-full bg-primary/20" />
          <div className="ml-2 h-1.5 w-12 rounded bg-primary/15" />
        </div>
        <div className="p-4 space-y-3">
          {/* Incoming request */}
          <div className="rounded-lg border border-primary/10 p-2.5 bg-primary/[0.03] space-y-1">
            <div className="flex justify-between items-center">
              <div className="h-1.5 w-16 rounded bg-primary/15" />
              <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[7px] font-medium text-primary">New</div>
            </div>
            <div className="h-1 w-20 rounded bg-muted-foreground/10" />
          </div>

          {/* Quote sent */}
          <div className="rounded-lg border border-border p-2.5 space-y-1">
            <div className="flex justify-between items-center">
              <div className="h-1.5 w-14 rounded bg-foreground/10" />
              <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[7px] font-medium text-primary">Sent</div>
            </div>
            <div className="h-1 w-18 rounded bg-muted-foreground/8" />
          </div>

          {/* Stats row */}
          <div className="flex gap-2 pt-1">
            <div className="flex-1 rounded-lg bg-primary/[0.06] p-2 text-center">
              <div className="text-[10px] font-bold text-primary">12</div>
              <div className="text-[7px] text-muted-foreground">Leads</div>
            </div>
            <div className="flex-1 rounded-lg bg-primary/[0.06] p-2 text-center">
              <div className="text-[10px] font-bold text-primary">8</div>
              <div className="text-[7px] text-muted-foreground">Booked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
