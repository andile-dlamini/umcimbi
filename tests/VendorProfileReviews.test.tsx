import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from './test-utils';

// Vendor reviews component for testing
interface Review {
  id: string;
  rating: number;
  comment: string | null;
}

interface VendorReviewsProps {
  vendorName: string;
  reviews: Review[];
  onSubmitReview?: (rating: number, comment: string) => Promise<void>;
}

function VendorProfileReviews({ vendorName, reviews, onSubmitReview }: VendorReviewsProps) {
  const hasReviews = reviews.length > 0;
  const averageRating = hasReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');

  return (
    <div data-testid="reviews-section">
      <h1 data-testid="vendor-name">{vendorName}</h1>

      {/* Rating Display */}
      <div data-testid="rating-section">
        {hasReviews ? (
          <>
            <span data-testid="average-rating">{averageRating?.toFixed(1)}</span>
            <span data-testid="star-display">★</span>
            <span data-testid="review-count">({reviews.length} reviews)</span>
          </>
        ) : (
          <span data-testid="no-reviews-message">No reviews yet</span>
        )}
      </div>

      {/* Reviews List */}
      <div data-testid="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} data-testid={`review-${review.id}`}>
            <span data-testid={`rating-${review.id}`}>{review.rating} stars</span>
            {review.comment && (
              <p data-testid={`comment-${review.id}`}>{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {/* Submit Form */}
      {onSubmitReview && (
        <form
          data-testid="review-form"
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmitReview(rating, comment);
          }}
        >
          <select
            data-testid="rating-select"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>{r} stars</option>
            ))}
          </select>
          <textarea
            data-testid="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" data-testid="submit-review">Submit</button>
        </form>
      )}
    </div>
  );
}

describe('VendorProfileReviews Component', () => {
  const mockReviews: Review[] = [
    { id: 'r1', rating: 5, comment: 'Excellent!' },
    { id: 'r2', rating: 4, comment: 'Very good' },
    { id: 'r3', rating: 5, comment: null },
  ];

  describe('Average Rating Display', () => {
    it('calculates and displays correct average', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      // (5 + 4 + 5) / 3 = 4.67
      expect(screen.getByTestId('average-rating')).toHaveTextContent('4.7');
    });

    it('displays review count', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      expect(screen.getByTestId('review-count')).toHaveTextContent('(3 reviews)');
    });

    it('shows star icon with reviews', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      expect(screen.getByTestId('star-display')).toBeInTheDocument();
    });
  });

  describe('No Reviews State', () => {
    it('shows "No reviews yet" when empty', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={[]} />
      );

      expect(screen.getByTestId('no-reviews-message')).toHaveTextContent('No reviews yet');
    });

    it('hides average rating when no reviews', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={[]} />
      );

      expect(screen.queryByTestId('average-rating')).not.toBeInTheDocument();
    });

    it('hides star display when no reviews', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={[]} />
      );

      expect(screen.queryByTestId('star-display')).not.toBeInTheDocument();
    });
  });

  describe('Review Submission', () => {
    it('calls onSubmitReview with rating and comment', async () => {
      const onSubmitReview = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <VendorProfileReviews
          vendorName="Caterers"
          reviews={mockReviews}
          onSubmitReview={onSubmitReview}
        />
      );

      fireEvent.change(screen.getByTestId('rating-select'), { target: { value: '5' } });
      fireEvent.change(screen.getByTestId('comment-input'), { target: { value: 'Great!' } });
      fireEvent.click(screen.getByTestId('submit-review'));

      await waitFor(() => {
        expect(onSubmitReview).toHaveBeenCalledWith(5, 'Great!');
      });
    });

    it('updates average after new review is added', () => {
      const { rerender } = renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      // Add a new 5-star review
      const updatedReviews = [...mockReviews, { id: 'r4', rating: 5, comment: 'New!' }];

      rerender(
        <VendorProfileReviews vendorName="Caterers" reviews={updatedReviews} />
      );

      // (5 + 4 + 5 + 5) / 4 = 4.75
      expect(screen.getByTestId('average-rating')).toHaveTextContent('4.8');
      expect(screen.getByTestId('review-count')).toHaveTextContent('(4 reviews)');
    });
  });

  describe('Individual Reviews', () => {
    it('displays all review ratings', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      expect(screen.getByTestId('rating-r1')).toHaveTextContent('5 stars');
      expect(screen.getByTestId('rating-r2')).toHaveTextContent('4 stars');
    });

    it('displays comments when present', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      expect(screen.getByTestId('comment-r1')).toHaveTextContent('Excellent!');
      expect(screen.getByTestId('comment-r2')).toHaveTextContent('Very good');
    });

    it('hides comment element when null', () => {
      renderWithProviders(
        <VendorProfileReviews vendorName="Caterers" reviews={mockReviews} />
      );

      expect(screen.queryByTestId('comment-r3')).not.toBeInTheDocument();
    });
  });
});
