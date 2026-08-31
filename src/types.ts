export type Language = 'am' | 'en';
export type Theme = 'light' | 'dark';

export type CategoryType = 'home' | 'car' | 'machinery';

export type PropertyType = 'apartment' | 'condominium' | 'villa' | 'studio' | 'g_plus_1' | 'g_plus_2' | 'commercial';

export type CarType = 'sedan' | 'suv' | 'pickup' | 'hatchback' | 'minibus' | 'truck' | 'electric_car' | 'van';

export type MachineryType = 'excavator' | 'wheel_loader' | 'dump_truck' | 'crane' | 'generator' | 'tractor' | 'forklift' | 'roller' | 'concrete_mixer' | 'other';

export type ListingType = 'rent' | 'sale';

export type PropertyStatus = 'active' | 'occupied' | 'expired' | 'pending_approval';

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
}

export type PaymentMethod = 'telebirr' | 'cbe' | 'awash' | 'cbebirr';

export type UnlockStatus = 'pending' | 'approved' | 'rejected';

export interface UnlockRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyArea: string;
  buyerName: string;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  screenshotUrl: string;
  screenshotSizeKb?: number;
  status: UnlockStatus;
  amountBirr: number; // 100 for rent, 500 for sale
  createdAt: string;
  approvedAt?: string;
  adminNote?: string;
}

export interface PaymentSettings {
  telebirrNumber: string;
  telebirrName: string;
  cbeAccount: string;
  cbeName: string;
  awashAccount: string;
  awashName: string;
  feeAmountRentBirr: number; // 100 ETB
  feeAmountSaleBirr: number; // 500 ETB
  sellerListingFeeBirr: number; // 500 ETB for posting sale house
  feeAmountBirr?: number; // legacy fallback
  adminPin: string;
  autoDeleteDays: number;
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

