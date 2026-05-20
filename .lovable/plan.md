# Paginate vendor reviews

Show only the first 3 reviews by default on the vendor profile. Add a "Show more reviews" button beneath the list that reveals the next 5 each click. Once all are shown, switch to a "Show less" button that collapses back to 3.

## Where
`src/components/vendors/VendorRating.tsx` — the reviews list rendered in the "Reviews" card.

## Behavior
- Initial visible count: 3
- Click "Show more reviews (N remaining)" → reveal 5 more
- When all visible → button becomes "Show less"
- Hide button entirely when total ≤ 3
- User's own review (if present in the list) keeps its existing styling

## Technical notes
- Local `useState` for `visibleCount`, initialized to 3
- Slice `reviews.slice(0, visibleCount)` in the map
- Reset to 3 when collapsing
