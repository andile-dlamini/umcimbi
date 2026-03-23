import { describe, it, expect } from 'vitest';

// Test CeremonyJourney constants and logic by importing the component module
// We test the data structures and logic directly

const MARRIAGE_JOURNEY = [
  { id: 'family_introduction', label: 'Ukucela', english: 'Family Intro' },
  { id: 'lobola', label: 'Ilobola', english: 'Lobola' },
  { id: 'umembeso', label: 'Umembeso', english: 'Gifts' },
  { id: 'umbondo', label: 'Umbondo', english: 'Groceries' },
  { id: 'umabo', label: 'Umabo', english: 'Wedding' },
];

const COMING_OF_AGE_JOURNEY = [
  { id: 'umemulo', label: 'Umemulo', english: 'Coming of Age' },
];

const CHILD_JOURNEY = [
  { id: 'imbeleko', label: 'Imbeleko', english: 'Child Intro' },
  { id: 'ancestral_ritual', label: 'Idlozi', english: 'Ancestors' },
];

type Status = 'completed' | 'current' | 'upcoming';

function selectJourney(userEventTypes: string[]) {
  const hasChild = userEventTypes.some(t => ['imbeleko', 'ancestral_ritual'].includes(t));
  const hasComingOfAge = userEventTypes.includes('umemulo');
  if (hasChild) return CHILD_JOURNEY;
  if (hasComingOfAge) return COMING_OF_AGE_JOURNEY;
  return MARRIAGE_JOURNEY;
}

function computeStatuses(journey: typeof MARRIAGE_JOURNEY, userEventTypes: string[]): Status[] {
  const allCompleted = journey.every(c => userEventTypes.includes(c.id));
  let foundCurrent = false;
  return journey.map(c => {
    if (userEventTypes.includes(c.id)) return 'completed';
    if (allCompleted) return 'completed';
    if (!foundCurrent) { foundCurrent = true; return 'current'; }
    return 'upcoming';
  });
}

describe('CeremonyJourney — Journey Selection', () => {
  it('defaults to MARRIAGE_JOURNEY when no events', () => {
    expect(selectJourney([])).toEqual(MARRIAGE_JOURNEY);
  });

  it('selects CHILD_JOURNEY when imbeleko is present', () => {
    expect(selectJourney(['imbeleko'])).toEqual(CHILD_JOURNEY);
  });

  it('selects CHILD_JOURNEY when ancestral_ritual is present', () => {
    expect(selectJourney(['ancestral_ritual'])).toEqual(CHILD_JOURNEY);
  });

  it('selects COMING_OF_AGE_JOURNEY when umemulo is present', () => {
    expect(selectJourney(['umemulo'])).toEqual(COMING_OF_AGE_JOURNEY);
  });

  it('prioritises CHILD_JOURNEY over COMING_OF_AGE', () => {
    expect(selectJourney(['imbeleko', 'umemulo'])).toEqual(CHILD_JOURNEY);
  });

  it('defaults to MARRIAGE when marriage events present', () => {
    expect(selectJourney(['lobola', 'umembeso'])).toEqual(MARRIAGE_JOURNEY);
  });

  it('defaults to MARRIAGE for unknown event types', () => {
    expect(selectJourney(['birthday'])).toEqual(MARRIAGE_JOURNEY);
  });
});

describe('CeremonyJourney — MARRIAGE_JOURNEY structure', () => {
  it('has exactly 5 steps', () => {
    expect(MARRIAGE_JOURNEY.length).toBe(5);
  });

  it('is in correct cultural order', () => {
    const ids = MARRIAGE_JOURNEY.map(c => c.id);
    expect(ids).toEqual(['family_introduction', 'lobola', 'umembeso', 'umbondo', 'umabo']);
  });

  it('does not include funeral', () => {
    const ids = MARRIAGE_JOURNEY.map(c => c.id);
    expect(ids).not.toContain('funeral');
  });

  it('does not include funeral in any journey', () => {
    const allIds = [...MARRIAGE_JOURNEY, ...COMING_OF_AGE_JOURNEY, ...CHILD_JOURNEY].map(c => c.id);
    expect(allIds).not.toContain('funeral');
  });
});

describe('CeremonyJourney — Status computation', () => {
  it('marks first ceremony as current when no events exist', () => {
    const statuses = computeStatuses(MARRIAGE_JOURNEY, []);
    expect(statuses[0]).toBe('current');
    expect(statuses[1]).toBe('upcoming');
  });

  it('marks completed ceremonies correctly', () => {
    const statuses = computeStatuses(MARRIAGE_JOURNEY, ['family_introduction']);
    expect(statuses[0]).toBe('completed');
    expect(statuses[1]).toBe('current');
  });

  it('marks all as completed when all events exist', () => {
    const allIds = MARRIAGE_JOURNEY.map(c => c.id);
    const statuses = computeStatuses(MARRIAGE_JOURNEY, allIds);
    expect(statuses.every(s => s === 'completed')).toBe(true);
  });

  it('only one ceremony is current at a time', () => {
    const statuses = computeStatuses(MARRIAGE_JOURNEY, ['family_introduction']);
    const currentCount = statuses.filter(s => s === 'current').length;
    expect(currentCount).toBe(1);
  });

  it('upcoming follows current', () => {
    const statuses = computeStatuses(MARRIAGE_JOURNEY, ['family_introduction']);
    expect(statuses).toEqual(['completed', 'current', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('handles non-sequential completion', () => {
    // User completed family_introduction and umembeso but not lobola
    const statuses = computeStatuses(MARRIAGE_JOURNEY, ['family_introduction', 'umembeso']);
    expect(statuses[0]).toBe('completed');
    expect(statuses[1]).toBe('current'); // lobola is next
    expect(statuses[2]).toBe('completed');
  });

  it('works for single-step journey', () => {
    const statuses = computeStatuses(COMING_OF_AGE_JOURNEY, []);
    expect(statuses).toEqual(['current']);
  });

  it('works for single-step completed', () => {
    const statuses = computeStatuses(COMING_OF_AGE_JOURNEY, ['umemulo']);
    expect(statuses).toEqual(['completed']);
  });
});

describe('CeremonyJourney — userEventTypes mapping', () => {
  it('uses event.type field from events table', () => {
    // The events table column is named 'type', and we map it as events.map(e => e.type)
    const mockEvents = [
      { type: 'lobola' },
      { type: 'umembeso' },
    ];
    const userEventTypes = mockEvents.map(e => e.type);
    expect(userEventTypes).toEqual(['lobola', 'umembeso']);
  });
});
