import { type LucideIcon } from 'lucide-react';

interface FeatureIconProps {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function FeatureIcon({ icon: Icon, variant = 'primary' }: FeatureIconProps) {
  const bgMap = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10',
  };
  const colorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
  };

  return (
    <div className={`w-12 h-12 rounded-xl ${bgMap[variant]} flex items-center justify-center shrink-0`}>
      <Icon className={`h-6 w-6 ${colorMap[variant]}`} />
    </div>
  );
}
