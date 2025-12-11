import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from './test-utils';

// Request form component for testing
interface Event {
  id: string;
  name: string;
}

interface RequestFormProps {
  events: Event[];
  vendorName: string;
  onSubmit: (data: { eventId: string; message: string; eventDate: string; location: string }) => Promise<boolean>;
  onSuccess?: () => void;
}

function RequestQuoteForm({ events, vendorName, onSubmit, onSuccess }: RequestFormProps) {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const eventId = formData.get('eventId') as string;
    const message = formData.get('message') as string;
    const eventDate = formData.get('eventDate') as string;
    const location = formData.get('location') as string;

    // Validate
    const newErrors: string[] = [];
    if (!eventId) newErrors.push('Please select an event');
    if (!message) newErrors.push('Please enter service details');
    if (!eventDate) newErrors.push('Please enter event date');
    if (!location) newErrors.push('Please enter location');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    const result = await onSubmit({ eventId, message, eventDate, location });
    
    if (result) {
      setSuccess(true);
      onSuccess?.();
    }
  };

  return (
    <form data-testid="request-form" onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div data-testid="form-errors">
          {errors.map((err, i) => (
            <p key={i} data-testid="error-message">{err}</p>
          ))}
        </div>
      )}

      {success && (
        <p data-testid="success-message">Quote request sent successfully!</p>
      )}

      <label>
        Vendor: <input type="text" value={vendorName} disabled data-testid="vendor-input" />
      </label>

      <label>
        Event:
        <select name="eventId" data-testid="event-select">
          <option value="">Select an event</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </label>

      <label>
        Details:
        <textarea name="message" data-testid="message-input" />
      </label>

      <label>
        Date:
        <input type="date" name="eventDate" data-testid="date-input" />
      </label>

      <label>
        Location:
        <input type="text" name="location" data-testid="location-input" />
      </label>

      <button type="submit" data-testid="submit-button">Send request</button>
    </form>
  );
}

describe('RequestQuoteForm Component', () => {
  const mockEvents: Event[] = [
    { id: 'e1', name: 'Wedding Ceremony' },
    { id: 'e2', name: 'Umemulo Celebration' },
  ];

  describe('Successful Submission', () => {
    it('submits form and shows success message', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(true);
      const onSuccess = vi.fn();

      renderWithProviders(
        <RequestQuoteForm
          events={mockEvents}
          vendorName="Premium Caterers"
          onSubmit={onSubmit}
          onSuccess={onSuccess}
        />
      );

      await user.selectOptions(screen.getByTestId('event-select'), 'e1');
      await user.type(screen.getByTestId('message-input'), 'Need catering for 100 guests');
      await user.type(screen.getByTestId('date-input'), '2025-06-15');
      await user.type(screen.getByTestId('location-input'), 'Durban');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          eventId: 'e1',
          message: 'Need catering for 100 guests',
          eventDate: '2025-06-15',
          location: 'Durban',
        });
      });

      expect(screen.getByTestId('success-message')).toHaveTextContent('Quote request sent successfully!');
      expect(onSuccess).toHaveBeenCalled();
    });

    it('displays vendor name', () => {
      renderWithProviders(
        <RequestQuoteForm
          events={mockEvents}
          vendorName="Premium Caterers"
          onSubmit={vi.fn()}
        />
      );

      expect(screen.getByTestId('vendor-input')).toHaveValue('Premium Caterers');
    });

    it('displays all events in dropdown', () => {
      renderWithProviders(
        <RequestQuoteForm
          events={mockEvents}
          vendorName="Caterers"
          onSubmit={vi.fn()}
        />
      );

      const select = screen.getByTestId('event-select');
      expect(select).toContainHTML('Wedding Ceremony');
      expect(select).toContainHTML('Umemulo Celebration');
    });
  });

  describe('Validation Errors', () => {
    it('shows error when submitting empty form', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithProviders(
        <RequestQuoteForm
          events={mockEvents}
          vendorName="Caterers"
          onSubmit={onSubmit}
        />
      );

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('form-errors')).toBeInTheDocument();
        expect(screen.getAllByTestId('error-message').length).toBe(4);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows specific error for missing event', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <RequestQuoteForm
          events={mockEvents}
          vendorName="Caterers"
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('form-errors')).toHaveTextContent('Please select an event');
      });
    });
  });
});
