import { useNavigate } from 'react-router-dom';
import { BookOpen, Gift, Calendar, Heart, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

const articles = [
  {
    id: 'umembeso',
    path: '/learn/umembeso',
    icon: Gift,
    title: 'Umembeso Basics',
    description: 'Learn about the gift-giving ceremony and its significance',
    colorClass: 'bg-secondary/15 text-secondary ring-secondary/30',
    patternClass: 'shweshwe-pattern-teal',
  },
  {
    id: 'umabo',
    path: '/learn/umabo',
    icon: Calendar,
    title: 'Umabo: Traditional Wedding Guide',
    description: 'Everything you need to know about the Zulu traditional wedding',
    colorClass: 'bg-primary/15 text-primary ring-primary/30',
    patternClass: 'shweshwe-pattern-red',
  },
  {
    id: 'combined',
    path: '/learn/combining-ceremonies',
    icon: Heart,
    title: 'Combining Ceremonies',
    description: 'Respectfully combining church and traditional ceremonies',
    colorClass: 'bg-accent/15 text-accent ring-accent/30',
    patternClass: 'shweshwe-dots',
  },
];

export default function Learn() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Learn" subtitle="Traditional ceremony guides" />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Hero Card */}
        <Card className="mb-6 overflow-hidden border-0 shadow-shweshwe">
          <div className="relative h-32 shweshwe-pattern-teal">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/80 to-secondary/60" />
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center text-secondary-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2" />
                <p className="font-semibold">Discover Zulu Traditions</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {articles.map((article) => {
            const Icon = article.icon;
            
            return (
              <Card 
                key={article.id}
                className="cursor-pointer hover:shadow-shweshwe-lg transition-all tap-highlight-none overflow-hidden group"
                onClick={() => navigate(article.path)}
              >
                <CardContent className="p-4 flex items-start gap-4 relative">
                  {/* Subtle pattern on hover */}
                  <div className={`absolute inset-0 ${article.patternClass} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className={`relative w-14 h-14 rounded-xl ${article.colorClass} flex items-center justify-center flex-shrink-0 ring-2`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 relative">
                    <h3 className="font-semibold text-foreground mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {article.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full shweshwe-dots flex items-center justify-center mb-3">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">
            More guides coming soon
          </p>
        </div>
      </div>
    </div>
  );
}