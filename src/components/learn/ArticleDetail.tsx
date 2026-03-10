import { Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LearnArticle } from '@/data/learnArticles';

interface ArticleDetailProps {
  article: LearnArticle;
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  const navigate = useNavigate();

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Learn about ${article.title}! Check out this guide on UMCIMBI.`
  )}`;

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/learn')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-sm truncate max-w-[200px]">{article.title}</h1>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Content */}
      <article className="px-4 py-6 max-w-lg mx-auto">
        {/* Title Card */}
        <div className="bg-secondary/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {article.category && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {article.category}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mt-0">{article.title}</h2>
          {article.subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{article.subtitle}</p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {article.sections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-foreground mb-2">{section.heading}</h3>
              <p className="text-muted-foreground">{section.body}</p>
              {section.items && section.items.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="bg-accent/10 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-foreground mt-0 mb-2">Ready to plan?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Use Isiko Planner to organize your {article.title.toLowerCase()} with ease.
          </p>
          <Button onClick={() => navigate('/events/new')} className="w-full">
            Start Planning
          </Button>
        </div>
      </article>
    </div>
  );
}
