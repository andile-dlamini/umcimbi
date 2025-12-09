import { useNavigate } from 'react-router-dom';
import { BookOpen, Gift, Calendar, Heart, ChevronRight, Baby, Users, Handshake, Package, Sparkles, Flower2, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

const articles = [
  {
    id: 'imbeleko',
    path: '/learn/imbeleko',
    icon: Baby,
    title: 'Imbeleko Basics',
    description: 'Learn about the child and ancestor introduction ceremony',
    color: 'bg-amber-500/20 text-amber-600',
  },
  {
    id: 'family-introduction',
    path: '/learn/family-introduction',
    icon: Users,
    title: 'Family Introduction Guide',
    description: 'Understanding Ukucela / Ukumisa isizwe',
    color: 'bg-blue-500/20 text-blue-600',
  },
  {
    id: 'lobola',
    path: '/learn/lobola',
    icon: Handshake,
    title: 'Lobola Overview',
    description: 'The bridewealth negotiation process',
    color: 'bg-emerald-500/20 text-emerald-600',
  },
  {
    id: 'umembeso',
    path: '/learn/umembeso',
    icon: Gift,
    title: 'Umembeso Guide',
    description: 'Learn about the gift-giving ceremony and its significance',
    color: 'bg-secondary/20 text-secondary',
  },
  {
    id: 'umbondo',
    path: '/learn/umbondo',
    icon: Package,
    title: 'Umbondo Guide',
    description: 'Return gifts from the bride\'s family',
    color: 'bg-purple-500/20 text-purple-600',
  },
  {
    id: 'umabo',
    path: '/learn/umabo',
    icon: Heart,
    title: 'Traditional Wedding (Umabo) Guide',
    description: 'Everything you need to know about the Zulu traditional wedding',
    color: 'bg-accent/20 text-accent',
  },
  {
    id: 'umemulo',
    path: '/learn/umemulo',
    icon: Sparkles,
    title: 'Umemulo Guide',
    description: 'The coming-of-age ceremony explained',
    color: 'bg-pink-500/20 text-pink-600',
  },
  {
    id: 'funeral',
    path: '/learn/funeral',
    icon: Flower2,
    title: 'Funeral Planning Basics',
    description: 'Understanding Umngcwabo traditions',
    color: 'bg-slate-500/20 text-slate-600',
  },
  {
    id: 'ancestral',
    path: '/learn/ancestral-rituals',
    icon: Flame,
    title: 'Ancestral Rituals Overview',
    description: 'Rituals, cleansing, and spiritual consultations',
    color: 'bg-orange-500/20 text-orange-600',
  },
  {
    id: 'combined',
    path: '/learn/combining-ceremonies',
    icon: Calendar,
    title: 'Combining Ceremonies',
    description: 'Respectfully combining church and traditional ceremonies',
    color: 'bg-primary/20 text-primary',
  },
];

export default function Learn() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Learn" subtitle="Traditional ceremony guides" />

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="space-y-3">
          {articles.map((article) => {
            const Icon = article.icon;
            
            return (
              <Card 
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none"
                onClick={() => navigate(article.path)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${article.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {article.description}
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
