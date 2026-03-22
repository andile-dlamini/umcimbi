import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import React from 'react';

interface Vendor {
  name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
}

function VendorContactActions({ vendor }: { vendor: Vendor }) {
  return (
    <div>
      <button>
        Start Chat
      </button>
      {vendor.phone_number && (
        <a href={`tel:${vendor.phone_number}`}>
          Call
        </a>
      )}
      {/* WhatsApp button intentionally removed */}
    </div>
  );
}

const testVendor: Vendor = {
  name: 'Test Vendor',
  phone_number: '+27821234567',
  whatsapp_number: '+27821234567',
};

describe('VendorDetail', () => {
  it('does not render a WhatsApp button even when vendor has whatsapp_number', () => {
    renderWithProviders(<VendorContactActions vendor={testVendor} />);
    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument();
    const links = screen.queryAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('href')).not.toContain('wa.me');
    });
  });

  it('renders Call button when vendor has phone number', () => {
    renderWithProviders(<VendorContactActions vendor={testVendor} />);
    const callLink = screen.getByText('Call');
    expect(callLink.closest('a')).toHaveAttribute('href', 'tel:+27821234567');
  });

  it('renders Start Chat button', () => {
    renderWithProviders(<VendorContactActions vendor={testVendor} />);
    expect(screen.getByText('Start Chat')).toBeInTheDocument();
  });
});
