import { Property, UnlockRequest, PromoConfig, UserAccount } from '../types';

export const PROMO_STORAGE_KEY = 'bese_broker_promo_config_v1';
export const CAR_PROMO_STORAGE_KEY = 'bese_broker_car_promo_config_v1';

// Default Home Promo: Launch promotion for 100 owners & 100 renters/buyers valid for 3 months
export const DEFAULT_PROMO_CONFIG: PromoConfig = {
  isEnabled: true,
  maxOwners: 100,
  maxUsers: 100,
  durationMonths: 3,
  startDate: new Date().toISOString(),
  // 90 days from launch
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
};

// Default Car Promo: Launch promotion for first 50 car owners & 50 car buyers/renters valid for 3 months
export const DEFAULT_CAR_PROMO_CONFIG: PromoConfig = {
  isEnabled: true,
  maxOwners: 50,
  maxUsers: 50,
  durationMonths: 3,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
};

export interface PromoStats {
  isEnabled: boolean;
  maxOwners: number;
  maxUsers: number;
  claimedOwners: number;
  remainingOwners: number;
  claimedUsers: number;
  remainingUsers: number;
  isOwnerPromoAvailable: boolean;
  isUserPromoAvailable: boolean;
  isExpired: boolean;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  formattedCountdown: string;
}

export function getStoredPromoConfig(): PromoConfig {
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(DEFAULT_PROMO_CONFIG));
      return DEFAULT_PROMO_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      isEnabled: parsed.isEnabled !== undefined ? parsed.isEnabled : true,
      maxOwners: Number(parsed.maxOwners) || 100,
      maxUsers: Number(parsed.maxUsers) || 100,
      durationMonths: Number(parsed.durationMonths) || 3,
      startDate: parsed.startDate || DEFAULT_PROMO_CONFIG.startDate,
      endDate: parsed.endDate || DEFAULT_PROMO_CONFIG.endDate,
    };
  } catch (err) {
    console.warn('Error reading promo config:', err);
    return DEFAULT_PROMO_CONFIG;
  }
}

export function savePromoConfig(config: PromoConfig): void {
  try {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving promo config:', err);
  }
}

export function getStoredCarPromoConfig(): PromoConfig {
  try {
    const raw = localStorage.getItem(CAR_PROMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CAR_PROMO_STORAGE_KEY, JSON.stringify(DEFAULT_CAR_PROMO_CONFIG));
      return DEFAULT_CAR_PROMO_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      isEnabled: parsed.isEnabled !== undefined ? parsed.isEnabled : true,
      maxOwners: Number(parsed.maxOwners) || 50,
      maxUsers: Number(parsed.maxUsers) || 50,
      durationMonths: Number(parsed.durationMonths) || 3,
      startDate: parsed.startDate || DEFAULT_CAR_PROMO_CONFIG.startDate,
      endDate: parsed.endDate || DEFAULT_CAR_PROMO_CONFIG.endDate,
    };
  } catch (err) {
    console.warn('Error reading car promo config:', err);
    return DEFAULT_CAR_PROMO_CONFIG;
  }
}

export function saveCarPromoConfig(config: PromoConfig): void {
  try {
    localStorage.setItem(CAR_PROMO_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving car promo config:', err);
  }
}

export function calculatePromoStats(
  properties: Property[] = [],
  unlockRequests: UnlockRequest[] = [],
  configInput?: PromoConfig,
  category: 'home' | 'car' = 'home'
): PromoStats {
  const config =
    configInput || (category === 'car' ? getStoredCarPromoConfig() : getStoredPromoConfig());

  // Count unique owners or listings registered under the free promo
  const promoProperties = properties.filter((p) => {
    if (!p.isPromoFree) return false;
    if (category === 'car') return p.category === 'car';
    return !p.category || p.category === 'home';
  });
  const claimedOwners = promoProperties.length;
  const remainingOwners = Math.max(0, config.maxOwners - claimedOwners);

  // Count requests under the free promo
  const promoRequests = unlockRequests.filter((r) => {
    if (!r.isPromoFree) return false;
    const isCarReq =
      r.packageTierId === 'tier_car_promo' ||
      r.transactionRef?.includes('CAR-PROMO') ||
      (r as any).category === 'car';
    if (category === 'car') return isCarReq;
    return !isCarReq;
  });
  const claimedUsers = promoRequests.length;
  const remainingUsers = Math.max(0, config.maxUsers - claimedUsers);

  // Live countdown calculation
  const now = Date.now();
  const end = new Date(config.endDate).getTime();
  const diffMs = Math.max(0, end - now);

  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);

  const isExpired = diffMs <= 0;
  const isOwnerPromoAvailable = config.isEnabled && !isExpired && remainingOwners > 0;
  const isUserPromoAvailable = config.isEnabled && !isExpired && remainingUsers > 0;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedCountdown = `${daysLeft}d : ${pad(hoursLeft)}h : ${pad(minutesLeft)}m : ${pad(secondsLeft)}s`;

  return {
    isEnabled: config.isEnabled,
    maxOwners: config.maxOwners,
    maxUsers: config.maxUsers,
    claimedOwners,
    remainingOwners,
    claimedUsers,
    remainingUsers,
    isOwnerPromoAvailable,
    isUserPromoAvailable,
    isExpired,
    daysLeft,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    formattedCountdown,
  };
}

export function calculateCarPromoStats(
  properties: Property[] = [],
  unlockRequests: UnlockRequest[] = [],
  configInput?: PromoConfig
): PromoStats {
  return calculatePromoStats(properties, unlockRequests, configInput, 'car');
}

/**
 * Checks if a property owner has already used their 1-time promo free listing.
 * 1-time use only for promo; next time ask money for owner!
 */
export function hasOwnerUsedPromo(
  ownerPhone: string,
  properties: Property[] = [],
  category: 'home' | 'car' = 'home'
): boolean {
  const clean = (ownerPhone || '').trim().replace(/[\s-]/g, '');
  if (!clean) return false;
  return properties.some((p) => {
    if (!p.isPromoFree) return false;
    const isCar = p.category === 'car';
    if (category === 'car' && !isCar) return false;
    if (category === 'home' && isCar) return false;
    return (p.ownerPhone || '').replace(/[\s-]/g, '') === clean;
  });
}

export const hasOwnerUsedCarPromo = (ownerPhone: string, properties: Property[] = []) =>
  hasOwnerUsedPromo(ownerPhone, properties, 'car');

/**
 * Checks if a user has already used/claimed their 1-time promo (5 free homes or 5 free cars).
 * 1-time use only for promo; next time ask money & screenshot for user!
 */
export function hasUserUsedPromo(
  userPhone: string,
  users: UserAccount[] = [],
  unlockRequests: UnlockRequest[] = [],
  category: 'home' | 'car' = 'home'
): boolean {
  const clean = (userPhone || '').trim().replace(/[\s-]/g, '');
  if (!clean) return false;

  // 1. Check user account flag or packages
  const matchedUser = users.find((u) => (u.phone || '').replace(/[\s-]/g, '') === clean);
  if (matchedUser) {
    if (category === 'car') {
      if (matchedUser.hasUsedCarPromo) return true;
      if (matchedUser.packages?.some((p) => p.isPromo && (p.tierId === 'tier_car_promo' || p.category === 'car'))) {
        return true;
      }
    } else {
      if (matchedUser.hasUsedPromo) return true;
      if (matchedUser.packages?.some((p) => p.isPromo && p.tierId !== 'tier_car_promo' && p.category !== 'car')) {
        return true;
      }
    }
  }

  // 2. Check unlock requests for this phone marked as promo
  const matchedRequest = unlockRequests.find((r) => {
    if (!r.isPromoFree) return false;
    if ((r.buyerPhone || '').replace(/[\s-]/g, '') !== clean) return false;
    const isCarReq =
      r.packageTierId === 'tier_car_promo' ||
      r.transactionRef?.includes('CAR-PROMO') ||
      (r as any).category === 'car';
    if (category === 'car') return isCarReq;
    return !isCarReq;
  });
  if (matchedRequest) return true;

  // 3. Check localStorage flag if applicable
  try {
    const key = category === 'car' ? `car_promo_claimed_${clean}` : `promo_claimed_${clean}`;
    const rawClaimed = localStorage.getItem(key);
    if (rawClaimed === 'true') return true;
  } catch {
    // ignore storage errors
  }

  return false;
}

export const hasUserUsedCarPromo = (
  userPhone: string,
  users: UserAccount[] = [],
  unlockRequests: UnlockRequest[] = []
) => hasUserUsedPromo(userPhone, users, unlockRequests, 'car');

/**
 * Validates if owner qualifies for the 1-time 0 ETB listing promo
 */
export function isOwnerEligibleForPromo(
  ownerPhone: string,
  properties: Property[] = [],
  stats?: PromoStats,
  category: 'home' | 'car' = 'home'
): boolean {
  const activeStats = stats || calculatePromoStats(properties, [], undefined, category);
  if (!activeStats.isOwnerPromoAvailable) return false;
  if (!ownerPhone || ownerPhone.trim().length < 9) return false;
  return !hasOwnerUsedPromo(ownerPhone, properties, category);
}

export const isOwnerEligibleForCarPromo = (
  ownerPhone: string,
  properties: Property[] = [],
  stats?: PromoStats
) => isOwnerEligibleForPromo(ownerPhone, properties, stats, 'car');

/**
 * Validates if user qualifies for the 1-time free promo (5 homes or 5 cars)
 */
export function isUserEligibleForPromo(
  userPhone: string,
  users: UserAccount[] = [],
  unlockRequests: UnlockRequest[] = [],
  stats?: PromoStats,
  category: 'home' | 'car' = 'home'
): boolean {
  const activeStats = stats || calculatePromoStats([], unlockRequests, undefined, category);
  if (!activeStats.isUserPromoAvailable) return false;
  if (!userPhone || userPhone.trim().length < 9) return false;
  return !hasUserUsedPromo(userPhone, users, unlockRequests, category);
}

export const isUserEligibleForCarPromo = (
  userPhone: string,
  users: UserAccount[] = [],
  unlockRequests: UnlockRequest[] = [],
  stats?: PromoStats
) => isUserEligibleForPromo(userPhone, users, unlockRequests, stats, 'car');
