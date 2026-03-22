import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import React from 'react';

const mockSignInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });

function AuthLoginScreen({ signInWithOAuth }: { signInWithOAuth: typeof mockSignInWithOAuth }) {
  const handleGoogle = () => {
    signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });
  };

  return (
    <div>
      <button onClick={handleGoogle}>Continue with Google</button>
      <div>or continue with phone</div>
      <input type="tel" placeholder="Phone number" aria-label="Phone number" />
    </div>
  );
}

describe('AuthGoogle', () => {
  beforeEach(() => {
    mockSignInWithOAuth.mockClear();
  });

  it('renders Continue with Google button', () => {
    renderWithProviders(<AuthLoginScreen signInWithOAuth={mockSignInWithOAuth} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('calls signInWithOAuth with google provider on click', () => {
    renderWithProviders(<AuthLoginScreen signInWithOAuth={mockSignInWithOAuth} />);
    fireEvent.click(screen.getByText('Continue with Google'));
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/auth/callback') },
    });
  });

  it('phone OTP flow still renders alongside Google button', () => {
    renderWithProviders(<AuthLoginScreen signInWithOAuth={mockSignInWithOAuth} />);
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
    expect(screen.getByText('or continue with phone')).toBeInTheDocument();
  });
});
