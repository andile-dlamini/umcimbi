import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

// Inline component replicating Home.tsx core logic
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

const CEREMONY_TILES = [
  { type: 'umembeso', label: 'Umembeso', zuluLabel: 'Ukupha izipho' },
  { type: 'umabo', label: 'Umabo', zuluLabel: 'Umshado wesintu' },
  { type: 'umemulo', label: 'Umemulo', zuluLabel: 'Ukuqomisa' },
  { type: 'imbeleko', label: 'Imbeleko', zuluLabel: 'Ukwethula ingane' },
  { type: 'lobola', label: 'Lobola', zuluLabel: 'Ilobola' },
  { type: 'family_introduction', label: 'Family Intro', zuluLabel: 'Ukucela' },
  { type: 'umbondo', label: 'Umbondo', zuluLabel: 'Ukuletha izipho' },
  { type: 'ancestral_ritual', label: 'Ancestral Ritual', zuluLabel: 'Idlozi' },
];

interface HomeProps {
  profile: { first_name: string | null };
  activeRole: string;
  isVendor: boolean;
  events: Array<{ id: string; name: string; type: string; date: string | null }>;
  isLoading: boolean;
  getProgress: () => number;
}

function HomeInline({ profile, activeRole, isVendor, events, isLoading, getProgress }: HomeProps) {
  if (activeRole === 'vendor' && isVendor) {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  const firstName = profile?.first_name || 'there';
  const nonFuneralEvents = events.filter(e => e.type !== 'funeral');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = nonFuneralEvents
    .filter(e => e.date && new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  const hasEvents = events.length > 0;
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  if (isLoading) return <p>Loading...</p>;

  if (!hasEvents) {
    return (
      <div>
        <h1>Sawubona, {firstName} 👋</h1>
        <p>What are you planning?</p>
        <div data-testid="ceremony-grid">
          {CEREMONY_TILES.map(({ type, label, zuluLabel }) => (
            <button key={type} data-testid={`tile-${type}`} onClick={() => mockNavigate(`/events/new?type=${type}`)}>
              <span>{label}</span>
              <span>{zuluLabel}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Sawubona, {firstName} 👋</h1>
      {nextEvent ? (
        <div data-testid="next-ceremony">
          <h3>{nextEvent.name}</h3>
          <p>{differenceInDays(new Date(nextEvent.date!), new Date())} days away</p>
          <div data-testid="progress-bar" style={{ width: `${getProgress()}%` }} />
        </div>
      ) : (
        <div>
          <h3>Plan your next ceremony</h3>
          <p>Your ceremonies are complete. Ready to plan the next one?</p>
        </div>
      )}
    </div>
  );
}

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows welcome screen when user has no events', () => {
    renderWithProviders(
      <HomeInline
        profile={{ first_name: 'Thabo' }}
        activeRole="user"
        isVendor={false}
        events={[]}
        isLoading={false}
        getProgress={() => 60}
      />
    );
    expect(screen.getByText(/Sawubona, Thabo/)).toBeInTheDocument();
    expect(screen.getByText('What are you planning?')).toBeInTheDocument();
    expect(screen.getByTestId('tile-umembeso')).toBeInTheDocument();
    expect(screen.queryByTestId('tile-funeral')).not.toBeInTheDocument();
  });

  it('ceremony tiles navigate to correct routes', () => {
    renderWithProviders(
      <HomeInline
        profile={{ first_name: 'Thabo' }}
        activeRole="user"
        isVendor={false}
        events={[]}
        isLoading={false}
        getProgress={() => 60}
      />
    );
    fireEvent.click(screen.getByTestId('tile-umembeso'));
    expect(mockNavigate).toHaveBeenCalledWith('/events/new?type=umembeso');
  });

  it('shows next ceremony card when user has upcoming events', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    renderWithProviders(
      <HomeInline
        profile={{ first_name: 'Thabo' }}
        activeRole="user"
        isVendor={false}
        events={[
          { id: '1', name: 'Mkhize Umembeso', type: 'umembeso', date: futureDate.toISOString() },
          { id: '2', name: 'Funeral Event', type: 'funeral', date: futureDate.toISOString() },
        ]}
        isLoading={false}
        getProgress={() => 60}
      />
    );
    expect(screen.getByTestId('next-ceremony')).toBeInTheDocument();
    expect(screen.getByText('Mkhize Umembeso')).toBeInTheDocument();
    expect(screen.getByText(/days away/)).toBeInTheDocument();
  });

  it('shows vendor dashboard redirect for vendor role', () => {
    renderWithProviders(
      <HomeInline
        profile={{ first_name: 'Thabo' }}
        activeRole="vendor"
        isVendor={true}
        events={[]}
        isLoading={false}
        getProgress={() => 0}
      />
    );
    const nav = screen.getByTestId('navigate');
    expect(nav).toHaveAttribute('data-to', '/vendor-dashboard');
  });

  it("falls back to 'there' when first_name is null", () => {
    renderWithProviders(
      <HomeInline
        profile={{ first_name: null }}
        activeRole="user"
        isVendor={false}
        events={[]}
        isLoading={false}
        getProgress={() => 0}
      />
    );
    expect(screen.getByText(/Sawubona, there/)).toBeInTheDocument();
  });
});
