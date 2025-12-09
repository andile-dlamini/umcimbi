import { useNavigate } from 'react-router-dom';
import { Baby, Users, Handshake, Gift, Package, Heart, Sparkles, Flower2, Flame, Calendar, ChevronRight, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { learnArticles } from '@/data/learnArticles';

const iconMap: Record<string, LucideIcon> = {
  'imbeleko': Baby,
  'family-introduction': Users,
  'lobola': Handshake,
  'umembeso': Gift,
  'umbondo': Package,
  'umabo': Heart,
  'umemulo': Sparkles,
  'funeral': Flower2,
  'ancestral-rituals': Flame,
  'combining-ceremonies': Calendar,
};

const colorMap: Record<string, string> = {
  'imbeleko': 'bg-accent/20 text-accent',
  'family-introduction': 'bg-accent/20 text-accent',
  'lobola': 'bg-accent/20 text-accent',
  'umembeso': 'bg-accent/20 text-accent',
  'umbondo': 'bg-accent/20 text-accent',
  'umabo': 'bg-accent/20 text-accent',
  'umemulo': 'bg-accent/20 text-accent',
  'funeral': 'bg-accent/20 text-accent',
  'ancestral-rituals': 'bg-accent/20 text-accent',
  'combining-ceremonies': 'bg-accent/20 text-accent',
};

export default function Learn() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Learn" subtitle="Traditional ceremony guides" />

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="space-y-3">
          {learnArticles.map((article) => {
            const Icon = iconMap[article.id] || Calendar;
            const color = colorMap[article.id] || 'bg-muted/20 text-muted-foreground';
            
            return (
              <Card 
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border-card-border"
                onClick={() => navigate(`/learn/${article.id}`)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {article.summary}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}