import { Check } from 'lucide-react';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flame } from 'lucide-react';
import { toast } from 'sonner';

// TODO: Journey paths are currently Zulu-specific.
// When multi-culture support is added, accept a
// 'culture' prop ('zulu' | 'xhosa' | 'sotho' etc)
// and select the appropriate journey array.
// Xhosa journey will differ — e.g. includes
// imvulamlomo, ikhazi stages within lobola process.

interface CeremonyStep {
  id: string;
  label: string;
  english: string;
}

const MARRIAGE_JOURNEY: CeremonyStep[] = [
  { id: 'family_introduction', label: 'Ukucela', english: 'Family Intro' },
  { id: 'lobola', label: 'Ilobola', english: 'Lobola' },
  { id: 'umembeso', label: 'Umembeso', english: 'Gifts' },
  { id: 'umbondo', label: 'Umbondo', english: 'Groceries' },
  { id: 'umabo', label: 'Umabo', english: 'Wedding' },
];

const COMING_OF_AGE_JOURNEY: CeremonyStep[] = [
  { id: 'umemulo', label: 'Umemulo', english: 'Coming of Age' },
];

const CHILD_JOURNEY: CeremonyStep[] = [
  { id: 'imbeleko', label: 'Imbeleko', english: 'Child Intro' },
  { id: 'ancestral_ritual', label: 'Idlozi', english: 'Ancestors' },
];

type Status = 'completed' | 'current' | 'upcoming';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  family_introduction: Users,
  lobola: Handshake,
  umembeso: Gift,
  umbondo: Package,
  umabo: Heart,
  umemulo: Sparkles,
  imbeleko: Baby,
  ancestral_ritual: Flame,
};

interface CeremonyJourneyProps {
  userEventTypes: string[];
  onCeremonyPress: (eventTypeId: string) => void;
}

export function CeremonyJourney({ userEventTypes, onCeremonyPress }: CeremonyJourneyProps) {
  // Determine which journey to display
  const hasChild = userEventTypes.some(t => ['imbeleko', 'ancestral_ritual'].includes(t));
  const hasComingOfAge = userEventTypes.includes('umemulo');

  let journey: CeremonyStep[];
  if (hasChild) {
    journey = CHILD_JOURNEY;
  } else if (hasComingOfAge) {
    journey = COMING_OF_AGE_JOURNEY;
  } else {
    journey = MARRIAGE_JOURNEY;
  }

  // Determine status for each ceremony
  const allCompleted = journey.every(c => userEventTypes.includes(c.id));
  let foundCurrent = false;

  const statuses: Status[] = journey.map(c => {
    if (userEventTypes.includes(c.id)) return 'completed';
    if (allCompleted) return 'completed';
    if (!foundCurrent) {
      foundCurrent = true;
      return 'current';
    }
    return 'upcoming';
  });

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your Journey
        </h2>
        <button
          className="text-xs text-primary hover:underline"
          onClick={() =>
            toast('This shows the traditional sequence of Zulu ceremonies. Tap any ceremony to learn more.')
          }
        >
          What's this?
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Tap a ceremony to learn about it</p>

      {/* Timeline strip */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex items-start gap-0 py-2" style={{ minWidth: 'max-content' }}>
          {journey.map((ceremony, i) => {
            const status = statuses[i];
            const Icon = iconMap[ceremony.id] || Gift;
            const isLast = i === journey.length - 1;

            return (
              <div key={ceremony.id} className="flex items-start">
                {/* Ceremony bubble + label */}
                <button
                  className="flex flex-col items-center min-w-[72px] gap-1.5"
                  onClick={() => onCeremonyPress(ceremony.id)}
                >
                  {/* Circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      status === 'completed'
                        ? 'bg-primary text-primary-foreground'
                        : status === 'current'
                        ? 'bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground opacity-50'
                    }`}
                  >
                    {status === 'completed' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* "Next →" badge for current */}
                  {status === 'current' && (
                    <span className="text-[10px] font-semibold text-accent">
                      Next →
                    </span>
                  )}

                  {/* Labels */}
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground leading-tight">
                      {ceremony.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {ceremony.english}
                    </p>
                  </div>
                </button>

                {/* Connecting line */}
                {!isLast && (
                  <div className="flex items-center pt-5">
                    <div
                      className={`w-6 h-0.5 ${
                        status === 'completed' && statuses[i + 1] === 'completed'
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
