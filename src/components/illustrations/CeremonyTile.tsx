import { Badge } from '@/components/ui/badge';

interface CeremonyTileProps {
  name: string;
  description: string;
  categories: string[];
  accentClass: string;
  icon: string;
}

export default function CeremonyTile({ name, description, categories, accentClass, icon }: CeremonyTileProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5">
      {/* Accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentClass}`} />

      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {categories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-[10px] px-2 py-0.5">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
