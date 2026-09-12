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
    id: 'tier_15k',
    nameEn: 'Budget Tier (≤ 15,000 ETB/mo)',
    nameAm: 'መደበኛ ደረጃ (እስከ 15,000 ብር/ወር)',
    fee: 200,
    maxPrice: 15000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the ≤ 15,000 ETB range',
    descriptionAm: 'እስከ 15,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_45k',
    nameEn: 'Mid-Range Tier (15,001 - 45,000 ETB/mo)',
    nameAm: 'መካከለኛ ደረጃ (15,001 - 45,000 ብር/ወር)',
    fee: 300,
    maxPrice: 45000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the 15,001 - 45,000 ETB range',
    descriptionAm: 'ከ 15,001 እስከ 45,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_75k',
    nameEn: 'Upper-Mid Tier (45,001 - 75,000 ETB/mo)',
    nameAm: 'ከፍተኛ-መካከለኛ ደረጃ (45,001 - 75,000 ብር/ወር)',
    fee: 400,
    maxPrice: 75000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the 45,001 - 75,000 ETB range',
    descriptionAm: 'ከ 45,001 እስከ 75,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_100k',
    nameEn: 'Executive Tier (75,001 - 100,000 ETB/mo)',
    nameAm: 'ከፍተኛ ደረጃ (75,001 - 100,000 ብር/ወር)',
    fee: 500,
    maxPrice: 100000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the 75,001 - 100,000 ETB range',
    descriptionAm: 'ከ 75,001 እስከ 100,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_200k',
    nameEn: 'Luxury Tier (100,001 - 200,000 ETB/mo)',
    nameAm: 'ፕሪሚየም ደረጃ (100,001 - 200,000 ብር/ወር)',
    fee: 600,
    maxPrice: 200000,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes in the 100,001 - 200,000 ETB range',
    descriptionAm: 'ከ 100,001 እስከ 200,000 ብር ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_above200k',
    nameEn: 'Ultra-Luxury Tier (> 200,000 ETB/mo)',
    nameAm: 'ልዩ የቅንጦት ደረጃ (ከ 200,000 ብር በላይ)',
    fee: 700,
    maxPrice: 999999999,
    unlockCount: 5,
    descriptionEn: 'Unlock 5 homes above 200,000 ETB/mo',
    descriptionAm: 'ከ 200,000 ብር በላይ ኪራይ ያላቸውን 5 ቤቶች ይክፈቱ',
  },
  {
    id: 'tier_sale',
    nameEn: 'For Sale Tier (Flat All Sales)',
    nameAm: 'የሽያጭ ደረጃ (ቋሚ ለሁሉም ሽያጭ)',
    fee: 700,
    maxPrice: 999999999,
    unlockCount: 5,
    descriptionEn: 'Flat 700 ETB to unlock 5 properties for sale',
    descriptionAm: 'ለማንኛውም የሽያጭ ንብረት 5 ቤቶችን ለመክፈት ቋሚ 700 ብር',
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
    return PRICE_TIERS[6]; // Flat 700 ETB for all sales
  }

  // Rent tiers
  if (price <= 15000) {
    return PRICE_TIERS[0]; // 200 ETB
  } else if (price <= 45000) {
    return PRICE_TIERS[1]; // 300 ETB
  } else if (price <= 75000) {
    return PRICE_TIERS[2]; // 400 ETB
  } else if (price <= 100000) {
    return PRICE_TIERS[3]; // 500 ETB
  } else if (price <= 200000) {
    return PRICE_TIERS[4]; // 600 ETB
  } else {
    return PRICE_TIERS[5]; // 700 ETB
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
