import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './test-utils';

// Simple Quote Card component for testing
interface Quote {
  id: string;
  vendorName: string;
  price: number;
  status: 'pending_client' | 'client_accepted' | 'client_declined';
}

interface QuotesListProps {
  quotes: Quote[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

function QuotesList({ quotes, onAccept, onDecline }: QuotesListProps) {
  return (
    <div data-testid="quotes-list">
      {quotes.map((quote) => (
        <div key={quote.id} data-testid={`quote-${quote.id}`} className="quote-card">
          <span data-testid={`vendor-${quote.id}`}>{quote.vendorName}</span>
          <span data-testid={`price-${quote.id}`}>R{quote.price.toLocaleString()}</span>
          <span data-testid={`status-${quote.id}`}>{quote.status}</span>
          
          {quote.status === 'pending_client' && (
            <>
              <button data-testid={`accept-${quote.id}`} onClick={() => onAccept(quote.id)}>
                Accept
              </button>
              <button data-testid={`decline-${quote.id}`} onClick={() => onDecline(quote.id)}>
                Decline
              </button>
            </>
          )}
          
          {quote.status === 'client_accepted' && (
            <span data-testid={`accepted-badge-${quote.id}`}>✓ Accepted</span>
          )}
          
          {quote.status === 'client_declined' && (
            <span data-testid={`declined-badge-${quote.id}`}>Not selected</span>
          )}
        </div>
      ))}
    </div>
  );
}

describe('QuotesList Component', () => {
  const mockQuotes: Quote[] = [
    { id: 'q1', vendorName: 'Budget Caterers', price: 5000, status: 'pending_client' },
    { id: 'q2', vendorName: 'Quality Foods', price: 8000, status: 'pending_client' },
    { id: 'q3', vendorName: 'Luxury Catering', price: 15000, status: 'pending_client' },
  ];

  it('renders all quotes with vendor names and prices', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <QuotesList quotes={mockQuotes} onAccept={onAccept} onDecline={onDecline} />
    );

    expect(screen.getByText('Budget Caterers')).toBeInTheDocument();
    expect(screen.getByText('Quality Foods')).toBeInTheDocument();
    expect(screen.getByText('Luxury Catering')).toBeInTheDocument();

    expect(screen.getByText('R5,000')).toBeInTheDocument();
    expect(screen.getByText('R8,000')).toBeInTheDocument();
    expect(screen.getByText('R15,000')).toBeInTheDocument();
  });

  it('calls onAccept with quote id when Accept is clicked', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <QuotesList quotes={mockQuotes} onAccept={onAccept} onDecline={onDecline} />
    );

    fireEvent.click(screen.getByTestId('accept-q2'));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith('q2');
  });

  it('calls onDecline with quote id when Decline is clicked', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    renderWithProviders(
      <QuotesList quotes={mockQuotes} onAccept={onAccept} onDecline={onDecline} />
    );

    fireEvent.click(screen.getByTestId('decline-q1'));

    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledWith('q1');
  });

  it('shows Accepted badge for accepted quotes', () => {
    const decidedQuotes: Quote[] = [
      { id: 'q1', vendorName: 'Budget Caterers', price: 5000, status: 'client_declined' },
      { id: 'q2', vendorName: 'Quality Foods', price: 8000, status: 'client_accepted' },
    ];

    renderWithProviders(
      <QuotesList quotes={decidedQuotes} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    expect(screen.getByTestId('accepted-badge-q2')).toHaveTextContent('✓ Accepted');
    expect(screen.getByTestId('declined-badge-q1')).toHaveTextContent('Not selected');
  });

  it('hides action buttons for decided quotes', () => {
    const decidedQuotes: Quote[] = [
      { id: 'q1', vendorName: 'Caterers', price: 5000, status: 'client_accepted' },
    ];

    renderWithProviders(
      <QuotesList quotes={decidedQuotes} onAccept={vi.fn()} onDecline={vi.fn()} />
    );

    expect(screen.queryByTestId('accept-q1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('decline-q1')).not.toBeInTheDocument();
  });
});
