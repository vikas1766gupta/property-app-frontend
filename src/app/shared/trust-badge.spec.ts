import { businessVerificationBadge, listingVerificationBadge } from './trust-badge';

describe('trust badge visibility', () => {
  it('does not show a listing badge before review succeeds', () => {
    expect(listingVerificationBadge('PENDING')).toBeNull();
    expect(listingVerificationBadge('UNDER_REVIEW')).toBeNull();
    expect(listingVerificationBadge('REJECTED')).toBeNull();
  });

  it('labels only verified businesses and preserves their account role', () => {
    expect(businessVerificationBadge('VERIFIED', 'BROKER')).toBe('Verified Broker');
    expect(businessVerificationBadge('VERIFIED', 'BUILDER')).toBe('Verified Builder');
    expect(businessVerificationBadge('SUSPENDED', 'BROKER')).toBeNull();
  });
});
