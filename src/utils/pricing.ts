import { CategoryType, ListingType, PackageTierId } from '../types';

export interface PriceTier {
  id: PackageTierId;
  nameEn: string;
  nameAm: string;
  fee: number; // 150, 250, 350, 500 ETB
  maxPrice: number; // Max property rent/price eligible
  unlockCount: number; // 5 homes
  descriptionEn: string;
  descriptionAm: string;
}

/**
 * 5-Home Range Tiers:
 * When paying once on a range, the user unlocks 5 homes in that similar range!
 */
export const PRICE_TIERS: PriceTier[] = [
  {
    id: 'tier_10k', // used as up to 15k
    nameEn: 'Budget Tier (Up to 15,000 ETB/mo)',
    nameAm: 'መደበኛ ደረጃ (እስከ 15,000 ብር/ወር)',
    fee: 150,
    maxPrice: 15000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the ≤ 15,000 ETB range',
    descriptionAm: 'እስከ 15,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_25k', // used as up to 35k
    nameEn: 'Standard Tier (15,001 - 35,000 ETB/mo)',
    nameAm: 'መካከለኛ ደረጃ (15,001 - 35,000 ብር/ወር)',
    fee: 250,
    maxPrice: 35000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the ≤ 35,000 ETB range',
    descriptionAm: 'እስከ 35,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_50k', // used as up to 75k
    nameEn: 'Premium Tier (35,001 - 75,000 ETB/mo)',
    nameAm: 'ከፍተኛ ደረጃ (35,001 - 75,000 ብር/ወር)',
    fee: 350,
    maxPrice: 75000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the ≤ 75,000 ETB range',
    descriptionAm: 'እስከ 75,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_unlimited',
    nameEn: 'Luxury & Sale Tier (Any Price / Sale)',
    nameAm: 'ፕሪሚየም እና ሽያጭ (ማንኛውም ዋጋ / ሽያጭ)',
    fee: 500,
    maxPrice: 999999999,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes of any price or property for sale',
    descriptionAm: 'የማንኛውም ዋጋ ወይም የሽያጭ 5 ቤቶችን ይክፈቱ',
  },
];

/**
 * Identify matching tier for a property
 */
export function getTierForProperty(
  price: number,
  listingType?: ListingType,
  _category?: CategoryType
): PriceTier {
  if (listingType === 'sale') {
    if (price <= 500000) return PRICE_TIERS[1]; // 250 ETB
    if (price <= 2000000) return PRICE_TIERS[2]; // 350 ETB
    return PRICE_TIERS[3]; // 500 ETB
  }

  // Rent
  if (price <= 15000) {
    return PRICE_TIERS[0]; // 150 ETB
  } else if (price <= 35000) {
    return PRICE_TIERS[1]; // 250 ETB
  } else if (price <= 75000) {
    return PRICE_TIERS[2]; // 350 ETB
  } else {
    return PRICE_TIERS[3]; // 500 ETB
  }
}

/**
 * Calculate the unlock fee for a single house / 5-house bundle
 */
export function calculateTierFee(
  price: number,
  listingType?: ListingType,
  category?: CategoryType
): number {
  const tier = getTierForProperty(price, listingType, category);
  return tier.fee;
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
