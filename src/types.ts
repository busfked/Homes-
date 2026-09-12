export type Language = 'am' | 'en';
export type Theme = 'light' | 'dark';

export type CategoryType = 'home' | 'car' | 'machinery';

export type PropertyType = 'apartment' | 'condominium' | 'villa' | 'studio' | 'g_plus_1' | 'g_plus_2' | 'commercial';

export type CarType = 'sedan' | 'suv' | 'pickup' | 'hatchback' | 'minibus' | 'truck' | 'electric_car' | 'van';

export type MachineryType = 'excavator' | 'wheel_loader' | 'dump_truck' | 'crane' | 'generator' | 'tractor' | 'forklift' | 'roller' | 'concrete_mixer' | 'other';

export type ListingType = 'rent' | 'sale';

export type PropertyStatus = 'active' | 'occupied' | 'expired' | 'pending' | 'pending_approval' | 'rejected';

export interface PropertyImage {
  url: string;
  originalSizeKb: number;
  compressedSizeKb: number;
}

export interface Property {
  id: string;
  category: CategoryType; // 'home' | 'car' | 'machinery'
  title: string;
  titleAm?: string;
  description: string;
  descriptionAm?: string;
  area: string;
  areaAm?: string;
  subCity?: string;
  exactLandmark: string; // Hidden until unlocked (exact street / parking location / garage)
  propertyType?: PropertyType; // For homes
  carType?: CarType; // For cars
  machineryType?: MachineryType; // For machineries
  
  // Car specific properties
  carMake?: string; // Toyota, Hyundai, Suzuki, BYD, Isuzu, etc.
  carModel?: string; // Corolla, Tucson, Dzire, Atto 3, etc.
  carYear?: number; // 2023, etc.
  transmission?: 'automatic' | 'manual';
  fuelType?: 'benzine' | 'diesel' | 'hybrid' | 'electric';
  mileageKm?: number;

  // Machinery specific properties
  machineryBrand?: string; // Caterpillar, Komatsu, Sinotruk, Perkins, SANY
  machineryCondition?: 'brand_new' | 'good_used' | 'refurbished';
  operatingHours?: number;
  capacity?: string; // e.g. "20 Ton", "150 kVA", "3.5 m³"

  listingType: ListingType;
  price: number; // in ETB
  pricePeriod: 'month' | 'day' | 'total';
  bedrooms?: number;
  bathrooms?: number;
  areaSqMeters?: number;
  images: PropertyImage[];
  nationalIdFrontUrl?: string; // National ID front photo for owner verification & safety
  nationalIdSizeKb?: number;
  ownerPhone: string; // Hidden until unlocked
  ownerName: string; // Hidden until unlocked
  ownerPin: string; // 4-digit PIN for owner to manage, mark occupied, or renew
  status: PropertyStatus;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  sellerListingFeeBirr?: number; // 500 ETB for sale, 0 for rent
  sellerPaymentScreenshotUrl?: string; // 500 ETB screenshot for sale listings
  sellerPaymentMethod?: PaymentMethod;
  sellerTransactionRef?: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string (7 days from creation or renewal)
  lastRenewedAt?: string;
  viewCount: number;
  unlockCount: number;
  isPromoFree?: boolean; // Posted under the 100-owners free promotion
}

export type PaymentMethod = 'telebirr' | 'cbe' | 'boa' | 'awash' | 'cbebirr';

export type UnlockStatus = 'pending' | 'approved' | 'rejected';

export type PackageTierId =
  | 'tier_10k'
  | 'tier_15k'
  | 'tier_25k'
  | 'tier_35k'
  | 'tier_45k'
  | 'tier_50k'
  | 'tier_75k'
  | 'tier_100k'
  | 'tier_200k'
  | 'tier_above200k'
  | 'tier_unlimited'
  | 'tier_sale';

export interface UserCreditPackage {
  id?: string;
  tierId: PackageTierId;
  tierName: string;
  maxPrice: number; // 10000, 35000, 75000, or 999999999
  maxHousePrice?: number;
  remainingUnlocks: number; // e.g. 5, 4, 3, 2, 1, 0
  totalPurchased: number; // 5
  purchasedAt: string;
  isPromo?: boolean; // 1-time 100 Launch Promo package
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  pin: string; // 4-digit PIN or password
  createdAt: string;
  unlockedPropertyIds: string[]; // List of property IDs unlocked by this user
  packages: UserCreditPackage[];
  hasUsedPromo?: boolean; // True once user claimed their 1-time 5-home promo
  promoClaimedAt?: string;
}

export type UnlockRequestType = 'single_property' | 'credit_package' | 'package_purchase' | 'owner_listing_fee' | 'single_unlock';

export interface UnlockRequest {
  id: string;
  requestType?: UnlockRequestType;
  type?: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyArea?: string;
  packageTierId?: PackageTierId;
  packageTierName?: string;
  maxHousePrice?: number;
  remainingUnlocks?: number;
  creditsToGrant?: number; // 5
  buyerName: string;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  screenshotUrl: string;
  screenshotSizeKb?: number;
  status: UnlockStatus;
  amountBirr: number;
  createdAt: string;
  approvedAt?: string;
  adminNote?: string;
  isPromoFree?: boolean; // Claimed under the 100-renters/buyers free unlock promotion
}

export interface PromoConfig {
  isEnabled: boolean;
  maxOwners: number; // 100 owners
  maxUsers: number; // 100 renters/buyers
  durationMonths: number; // 3 months
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface PaymentSettings {
  telebirrNumber: string;
  telebirrName: string;
  cbeAccount: string;
  cbeName: string;
  boaAccount: string; // Bank of Abyssinia
  boaName: string;
  awashAccount: string;
  awashName: string;
  feeAmountRentBirr: number; // 100 ETB
  feeAmountSaleBirr: number; // 500 ETB
  sellerListingFeeBirr: number; // 500 ETB for posting sale house
  feeAmountBirr?: number; // legacy fallback
  adminPin: string;
  autoDeleteDays: number;
  autoApproveListings?: boolean; // When true, owner listings appear on front page immediately
  promoConfig?: PromoConfig;
}

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savingsPercent: number;
}

export interface ReportedBroker {
  id: string;
  reporterPhone: string;
  reporterRole: 'owner' | 'buyer' | 'user';
  reportedPhone: string;
  propertyId?: string;
  propertyTitle?: string;
  reason: 'broker_middleman_activity' | 'reselling_info' | 'harassment' | 'fraud_scam' | 'other';
  reasonText: string;
  createdAt: string;
  status: 'pending_review' | 'banned' | 'dismissed';
}

export type ReviewUserRole = 'buyer' | 'renter' | 'owner' | 'client';

export interface Review {
  id: string;
  userName: string;
  userPhone?: string;
  userRole: ReviewUserRole;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string; // ISO string
  isApproved?: boolean;
  status?: 'active' | 'hidden';
}

