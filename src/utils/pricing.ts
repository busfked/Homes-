import { CategoryType, ListingType } from '../types';

/**
 * Direct Fair Tier Schedule (Both for Owner Listing & Buyer Unlock):
 * - Rent <= 15,000 ETB          -> 150 ETB
 * - Rent 15,001 to 35,000 ETB   -> 250 ETB
 * - Rent 35,001 to 75,000 ETB   -> 350 ETB
 * - Rent > 75,000 ETB or Sale   -> 500 ETB
 * 
 * Direct 1:1 model: No bundles, no credit discounts.
 * A house posted at 150 ETB costs 150 ETB to unlock.
 * A house posted at 250 ETB costs 250 ETB to unlock.
 * A house posted at 350 ETB costs 350 ETB to unlock.
 * A house posted at 500 ETB costs 500 ETB to unlock.
 */
export function calculateTierFee(
  price: number,
  listingType?: ListingType,
  _category?: CategoryType
): number {
  if (!price || price <= 0) return 150;

  if (listingType === 'sale') {
    if (price <= 500000) return 250;
    if (price <= 2000000) return 350;
    return 500;
  }

  // Rent listings
  if (price <= 15000) {
    return 150;
  } else if (price <= 35000) {
    return 250;
  } else if (price <= 75000) {
    return 350;
  } else {
    return 500;
  }
}

export const calculateOwnerListingFee = calculateTierFee;
export const calculateHouseUnlockFee = calculateTierFee;

/**
 * Format currency in Ethiopian Birr with commas
 */
export function formatEtbPrice(
  price: number,
  pricePeriod?: 'month' | 'day' | 'total',
  currentLang: 'am' | 'en' = 'am'
): string {
  const formattedNum = Number(price).toLocaleString('en-US');
  const currency = currentLang === 'am' ? 'ብር' : 'ETB';

  if (!pricePeriod || pricePeriod === 'total') {
    return `${formattedNum} ${currency}`;
  }
  if (pricePeriod === 'day') {
    return `${formattedNum} ${currency} / ${currentLang === 'am' ? 'በቀን' : 'day'}`;
  }
  return `${formattedNum} ${currency} / ${currentLang === 'am' ? 'በወር' : 'month'}`;
}

