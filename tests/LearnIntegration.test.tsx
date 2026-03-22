import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import React, { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface Article {
  id: string;
  eventTypeId: string;
  title: string;
  sections: Array<{ heading: string; body: string }>;
}

const mockArticles: Article[] = [
  {
    id: 'umembeso',
    eventTypeId: 'umembeso',
    title: 'Umembeso Guide',
    sections: [{ heading: 'What is Umembeso?', body: 'Test body text' }],
  },
];

function CeremonyGuideCard({ eventType }: { eventType: string }) {
  const [open, setOpen] = useState(false);
  const article = mockArticles.find(a => a.eventTypeId === eventType);

  if (!article) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} data-testid="guide-card">
      <CollapsibleTrigger asChild>
        <button data-testid="guide-trigger">
          What is {article.title.replace(' Guide', '')}?
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p>{article.sections[0].body}</p>
        <a href={`/learn/${article.id}`}>Read full guide →</a>
      </CollapsibleContent>
    </Collapsible>
  );
}

describe('LearnIntegration', () => {
  it('shows ceremony guide card after selecting a ceremony type', () => {
    renderWithProviders(<CeremonyGuideCard eventType="umembeso" />);
    expect(screen.getByText('What is Umembeso?')).toBeInTheDocument();
  });

  it('guide card is collapsed by default', () => {
    renderWithProviders(<CeremonyGuideCard eventType="umembeso" />);
    expect(screen.queryByText('Test body text')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('guide-trigger'));
    expect(screen.getByText('Test body text')).toBeInTheDocument();
  });

  it('guide card shows read full guide link', () => {
    renderWithProviders(<CeremonyGuideCard eventType="umembeso" />);
    fireEvent.click(screen.getByTestId('guide-trigger'));
    const link = screen.getByText('Read full guide →');
    expect(link.closest('a')).toHaveAttribute('href', '/learn/umembeso');
  });

  it('does not show guide card for ceremony types with no article', () => {
    renderWithProviders(<CeremonyGuideCard eventType="lobola" />);
    expect(screen.queryByTestId('guide-card')).not.toBeInTheDocument();
  });
});
