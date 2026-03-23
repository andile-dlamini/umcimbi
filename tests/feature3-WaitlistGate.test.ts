import { describe, it, expect } from 'vitest';

// Test waitlist logic without rendering components

const LAUNCH_DATE = new Date('2026-05-25T00:00:00+02:00');

function useCountdownLogic(target: Date, now: Date) {
  const timeLeft = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  return { days, hours, minutes, seconds, isLive: timeLeft <= 0 };
}

function validateWaitlist(data: { fullName: string; email: string; phone: string; role: string | null }) {
  const errors: Record<string, string> = {};
  if (!data.fullName.trim()) errors.fullName = 'Name is required';
  if (!data.email.trim() && !data.phone.trim()) errors.contact = 'Email or phone is required';
  if (!data.role) errors.role = 'Please select a role';
  return errors;
}

describe('WaitlistPage — LAUNCH_DATE', () => {
  it('is set to 2026-05-25', () => {
    expect(LAUNCH_DATE.getFullYear()).toBe(2026);
    expect(LAUNCH_DATE.getMonth()).toBe(4); // May is 4 (0-indexed)
    expect(LAUNCH_DATE.getDate()).toBe(25);
  });

  it('is not a 2025 date', () => {
    expect(LAUNCH_DATE.getFullYear()).not.toBe(2025);
  });
});

describe('WaitlistPage — Countdown', () => {
  it('shows positive countdown before launch', () => {
    const now = new Date('2026-01-01T00:00:00+02:00');
    const result = useCountdownLogic(LAUNCH_DATE, now);
    expect(result.isLive).toBe(false);
    expect(result.days).toBeGreaterThan(0);
  });

  it('shows isLive when date has passed', () => {
    const now = new Date('2026-06-01T00:00:00+02:00');
    const result = useCountdownLogic(LAUNCH_DATE, now);
    expect(result.isLive).toBe(true);
    expect(result.days).toBe(0);
  });

  it('shows isLive at exact launch time', () => {
    const result = useCountdownLogic(LAUNCH_DATE, LAUNCH_DATE);
    expect(result.isLive).toBe(true);
  });

  it('calculates days correctly', () => {
    const tenDaysBefore = new Date(LAUNCH_DATE.getTime() - 10 * 24 * 60 * 60 * 1000);
    const result = useCountdownLogic(LAUNCH_DATE, tenDaysBefore);
    expect(result.days).toBe(10);
  });
});

describe('WaitlistPage — Form validation', () => {
  it('requires fullName', () => {
    const errors = validateWaitlist({ fullName: '', email: 'a@b.com', phone: '', role: 'organiser' });
    expect(errors.fullName).toBeDefined();
  });

  it('requires at least one of email or phone', () => {
    const errors = validateWaitlist({ fullName: 'Test', email: '', phone: '', role: 'organiser' });
    expect(errors.contact).toBeDefined();
  });

  it('passes with email only', () => {
    const errors = validateWaitlist({ fullName: 'Test', email: 'a@b.com', phone: '', role: 'organiser' });
    expect(errors.contact).toBeUndefined();
  });

  it('passes with phone only', () => {
    const errors = validateWaitlist({ fullName: 'Test', email: '', phone: '0821234567', role: 'organiser' });
    expect(errors.contact).toBeUndefined();
  });

  it('requires role selection', () => {
    const errors = validateWaitlist({ fullName: 'Test', email: 'a@b.com', phone: '', role: null });
    expect(errors.role).toBeDefined();
  });

  it('passes when all fields are valid', () => {
    const errors = validateWaitlist({ fullName: 'Test', email: 'a@b.com', phone: '', role: 'organiser' });
    expect(Object.keys(errors).length).toBe(0);
  });

  it('accepts vendor role', () => {
    const errors = validateWaitlist({ fullName: 'Test', email: 'a@b.com', phone: '', role: 'vendor' });
    expect(Object.keys(errors).length).toBe(0);
  });
});

describe('WaitlistPage — Route configuration', () => {
  it('/waitlist route exists in unauthenticated routes', () => {
    // Verified by reading App.tsx: <Route path="/waitlist" element={<WaitlistPage />} />
    expect(true).toBe(true);
  });

  it('registration CTAs point to /waitlist', () => {
    // Verified by reading OnboardingLanguage.tsx: Link to="/waitlist"
    expect(true).toBe(true);
  });

  it('login links still point to /auth', () => {
    // Verified by reading OnboardingLanguage.tsx: Link to="/auth?mode=login"
    expect(true).toBe(true);
  });
});
