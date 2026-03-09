// Umcimbi Score: deterministic value score (0–100) for quote comparison
// ValueScore = 60% TrustScore + 40% PriceScore

export interface VendorScoreInput {
  quoteId: string;
  vendorName: string;
  vendorImage?: string | null;
  vendorCategory?: string;
  rating: number | null;
  reviewCount: number;
  jobsCompleted: number;
  isVerified: boolean;
  isSuperVendor: boolean;
  price: number;
  depositPercentage: number;
  expiresAt: string;
  notes: string | null;
  offerNumber: string | null;
  status: string;
}

export interface ScoredVendor extends VendorScoreInput {
  trustScore: number;
  priceScore: number;
  umcimbiScore: number;
  badges: ('best_value' | 'cheapest' | 'highest_trust' | 'new')[];
}

function normRating(rating: number | null, reviewCount: number): number {
  if (reviewCount < 3) return 0.5; // neutral baseline for new vendors
  return Math.min((rating ?? 0) / 5, 1);
}

function normJobsCompleted(jobs: number, maxJobs: number): number {
  if (maxJobs === 0) return 0;
  return Math.min(jobs / maxJobs, 1);
}

export function calculateUmcimbiScores(vendors: VendorScoreInput[]): ScoredVendor[] {
  if (vendors.length === 0) return [];

  const maxJobs = Math.max(...vendors.map(v => v.jobsCompleted), 1);
  const prices = vendors.map(v => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Calculate scores
  const scored: ScoredVendor[] = vendors.map(v => {
    const ratingNorm = normRating(v.rating, v.reviewCount);
    const jobsNorm = normJobsCompleted(v.jobsCompleted, maxJobs);
    const verifiedFlag = v.isVerified ? 1 : 0;

    // TrustScore = 50% jobs + 35% rating + 15% verified
    const trustScore = 0.5 * jobsNorm + 0.35 * ratingNorm + 0.15 * verifiedFlag;

    // PriceScore: 1 = cheapest, 0 = most expensive
    const priceScore = priceRange === 0 ? 1 : (maxPrice - v.price) / priceRange;

    // ValueScore = 60% trust + 40% price
    const umcimbiScore = Math.round((0.6 * trustScore + 0.4 * priceScore) * 100);

    const badges: ScoredVendor['badges'] = [];
    if (v.reviewCount < 3) badges.push('new');

    return { ...v, trustScore, priceScore, umcimbiScore, badges };
  });

  // Assign badges
  const bestValue = scored.reduce((a, b) => a.umcimbiScore > b.umcimbiScore ? a : b);
  const cheapest = scored.reduce((a, b) => a.price < b.price ? a : b);
  const highestTrust = scored.reduce((a, b) => a.trustScore > b.trustScore ? a : b);

  bestValue.badges.push('best_value');
  
  // Only add cheapest badge if there's a price difference
  if (priceRange > 0) cheapest.badges.push('cheapest');
  
  // Only add highest_trust if there's a difference
  const trustValues = scored.map(s => s.trustScore);
  if (Math.max(...trustValues) !== Math.min(...trustValues)) {
    highestTrust.badges.push('highest_trust');
  }

  return scored.sort((a, b) => b.umcimbiScore - a.umcimbiScore);
}
