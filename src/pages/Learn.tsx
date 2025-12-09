import { BookOpen, Gift, Calendar, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

const articles = [
  {
    id: 'umembeso',
    icon: Gift,
    title: 'Umembeso Basics',
    description: 'Learn about the gift-giving ceremony and its significance',
    color: 'bg-secondary/20 text-secondary',
  },
  {
    id: 'umabo',
    icon: Calendar,
    title: 'Umabo: Traditional Wedding Guide',
    description: 'Everything you need to know about the Zulu traditional wedding',
    color: 'bg-accent/20 text-accent',
  },
  {
    id: 'combined',
    icon: Heart,
    title: 'Combining Ceremonies',
    description: 'Respectfully combining church and traditional ceremonies',
    color: 'bg-primary/20 text-primary',
  },
];

export default function Learn() {
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            More guides coming soon
          </p>
        </div>
      </div>
    </div>
  );
}