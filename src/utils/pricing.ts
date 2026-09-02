import { CategoryType, ListingType, PackageTierId } from '../types';

export interface PackageTierDefinition {
  id: PackageTierId;
  nameEn: string;
  nameAm: string;
  maxPrice: number;
  packagePriceBirr: number;
  totalUnlocks: number;
  singleUnlockPriceBirr: number;
  descriptionEn: string;
  descriptionAm: string;
}

export const USER_PACKAGE_TIERS: PackageTierDefinition[] = [
  {
    id: 'tier_10k',
    nameEn: 'Starter Tier (Up to 10,000 ETB)',
    nameAm: 'ጀማሪ ጥቅል (እስከ 10,000 ብር ቤቶች)',
    maxPrice: 10000,
    packagePriceBirr: 150,
    totalUnlocks: 5,
    singleUnlockPriceBirr: 50,
    descriptionEn: 'Unlock 5 different house contacts priced up to 10,000 ETB/month (Only 30 ETB per house!).',
    descriptionAm: 'ዋጋቸው እስከ 10,000 ብር የሆኑ 5 ቤቶችን ይምረጡና የባለቤቱን ስልክ እና ሙሉ አድራሻ ይክፈቱ (በቤት 30 ብር ብቻ!)።',
  },
  {
    id: 'tier_35k',
    nameEn: 'Standard Tier (Up to 35,000 ETB)',
    nameAm: 'መካከለኛ ጥቅል (እስከ 35,000 ብር ቤቶች)',
    maxPrice: 35000,
    packagePriceBirr: 250,
    totalUnlocks: 5,
    singleUnlockPriceBirr: 100,
    descriptionEn: 'Unlock 5 different house/car contacts priced up to 35,000 ETB/month (Only 50 ETB per item!).',
    descriptionAm: 'ዋጋቸው እስከ 35,000 ብር የሆኑ 5 ቤቶችን ወይም መኪናዎችን ይክፈቱ (በቤት 50 ብር ብቻ!)።',
  },
  {
    id: 'tier_75k',
    nameEn: 'Premium Tier (Up to 75,000 ETB)',
    nameAm: 'ፕሪሚየም ጥቅል (እስከ 75,000 ብር ቤቶች)',
    maxPrice: 75000,
    packagePriceBirr: 350,
    totalUnlocks: 5,
    singleUnlockPriceBirr: 150,
    descriptionEn: 'Unlock 5 different house/car/machinery contacts priced up to 75,000 ETB/month (Only 70 ETB per item!).',
    descriptionAm: 'ዋጋቸው እስከ 75,000 ብር የሆኑ 5 ቪላዎችን፣ አፓርታማዎችን ወይም ንብረቶችን ይክፈቱ (በቤት 70 ብር ብቻ!)።',
  },
  {
    id: 'tier_unlimited',
    nameEn: 'VIP / Luxury & Sale (All Properties)',
    nameAm: 'ቪአይፒ / የሽያጭ እና የቅንጦት ጥቅል (ሁሉም)',
    maxPrice: 999999999,
    packagePriceBirr: 500,
    totalUnlocks: 5,
    singleUnlockPriceBirr: 200,
    descriptionEn: 'Unlock 5 different listings of ANY price, including homes for sale, luxury villas, and heavy machineries.',
    descriptionAm: 'የማንኛውም ዋጋ ያላቸው 5 የሽያጭ ቤቶችን፣ የቅንጦት ቪላዎችን ወይም ማሽነሪዎችን ስልክ ይክፈቱ።',
  },
];

/**
 * Calculates owner listing fee according to the required tiered schedule:
 * - price <= 15,000 ETB  -> 150 ETB
 * - 15,001 to 35,000 ETB -> 250 ETB
 * - 35,001 to 75,000 ETB -> 350 ETB
 * - 75,001+ ETB (or large / sale) -> 500 ETB
 */
export function calculateOwnerListingFee(
  price: number,
  listingType?: ListingType,
  category?: CategoryType
): number {
  if (!price || price <= 0) return 150;

  // If sale listing with large price
  if (listingType === 'sale') {
    if (price <= 500000) return 250;
    if (price <= 2000000) return 350;
    return 500;
  }

  // Rent listings: strict exact user requested boundaries
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

/**
 * Find suitable package tier definition for a given property price & listing type
 */
export function getRecommendedPackageForProperty(
  price: number,
  listingType?: ListingType
): PackageTierDefinition {
  if (listingType === 'sale' || price > 75000) {
    return USER_PACKAGE_TIERS[3]; // tier_unlimited (500 ETB)
  }
  if (price <= 10000) {
    return USER_PACKAGE_TIERS[0]; // tier_10k (150 ETB)
  }
  if (price <= 35000) {
    return USER_PACKAGE_TIERS[1]; // tier_35k (250 ETB)
  }
  return USER_PACKAGE_TIERS[2]; // tier_75k (350 ETB)
}

export const getUserPackageTierForHousePrice = getRecommendedPackageForProperty;

/**
 * Format currency in Ethiopian Birr with commas
 */
export function formatEtbPrice(price: number, pricePeriod?: 'month' | 'day' | 'total', currentLang: 'am' | 'en' = 'am'): string {
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
