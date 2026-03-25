import { Check } from 'lucide-react';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const hasChild = userEventTypes.some(t =>
    ['imbeleko', 'ancestral_ritual'].includes(t)
  );
  const hasComingOfAge = userEventTypes.includes('umemulo');

  let journey: CeremonyStep[];
  if (hasChild) {
    journey = CHILD_JOURNEY;
  } else if (hasComingOfAge) {
    journey = COMING_OF_AGE_JOURNEY;
  } else {
    journey = MARRIAGE_JOURNEY;
  }

  const allCompleted = journey.every(c =>
    userEventTypes.includes(c.id)
  );
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
    <div className="w-full">
      <div className="relative flex items-start w-full">
        {journey.map((ceremony, i) => {
          const status = statuses[i];
          const Icon = iconMap[ceremony.id] || Gift;
          const isFirst = i === 0;
          const isLast = i === journey.length - 1;

          return (
            <div key={ceremony.id} className="relative flex-1 flex flex-col items-center">
              {/* Left half-line */}
              {!isFirst && (
                <div className={cn(
                  'absolute top-6 right-1/2 w-1/2 h-0.5',
                  statuses[i - 1] === 'completed' && status === 'completed'
                    ? 'bg-accent/50'
                    : 'bg-border'
                )} />
              )}

              {/* Right half-line */}
              {!isLast && (
                <div className={cn(
                  'absolute top-6 left-1/2 w-1/2 h-0.5',
                  status === 'completed' && statuses[i + 1] === 'completed'
                    ? 'bg-accent/50'
                    : 'bg-border'
                )} />
              )}

              <button
                className="relative z-10 flex flex-col items-center gap-1.5"
                onClick={() => onCeremonyPress(ceremony.id)}
              >
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                  status === 'completed'
                    ? 'bg-accent text-accent-foreground'
                    : status === 'current'
                    ? 'bg-muted text-foreground/65 ring-2 ring-accent ring-offset-2 ring-offset-background'
                    : 'bg-muted text-foreground/50 opacity-50'
                )}>
                  {status === 'completed'
                    ? <Check className="h-5 w-5" />
                    : <Icon className="h-5 w-5" />
                  }
                </div>

                {status === 'current' && (
                  <span className="text-[10px] font-bold text-accent">
                    Next →
                  </span>
                )}

                <div className="text-center">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    {ceremony.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {ceremony.english}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
