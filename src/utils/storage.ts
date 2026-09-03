import { Property, UnlockRequest, PaymentSettings, ReportedBroker, UserAccount, UserCreditPackage, PackageTierId } from '../types';
import { SAMPLE_PROPERTIES, SAMPLE_UNLOCK_REQUESTS, DEFAULT_SETTINGS } from '../data/sampleListings';
import { PRICE_TIERS } from './pricing';

const STORAGE_KEYS = {
  PROPERTIES: 'betdelala_properties_v3',
  UNLOCK_REQUESTS: 'betdelala_unlock_requests_v3',
  SETTINGS: 'betdelala_settings_v3',
  USER_PHONE: 'betdelala_current_user_phone',
  LOGGED_IN_USER: 'betdelala_active_user_session',
  ALL_USERS: 'betdelala_user_accounts_v1',
  SUPABASE_CONFIG: 'betdelala_supabase_config',
  BANNED_PHONES: 'betdelala_banned_phones_v2',
  REPORTED_BROKERS: 'betdelala_reported_brokers_v2',
  OWNER_PROFILES: 'betdelala_owner_profiles_v1',
};

// Owner Profile Interface for remembered owners
export interface StoredOwnerProfile {
  phone: string;
  name: string;
  pin: string;
  nationalIdFrontUrl?: string;
  lastUsedAt: string;
}
export type OwnerProfile = StoredOwnerProfile;

export function getStoredOwnerProfiles(): StoredOwnerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OWNER_PROFILES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveOwnerProfile(
  phone: string,
  profile: { name: string; pin: string; nationalIdFrontUrl?: string }
): void {
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  if (!cleanPhone) return;

  const existing = getStoredOwnerProfiles();
  const filtered = existing.filter(
    (p) => p.phone.replace(/[\s-]/g, '') !== cleanPhone
  );

  const updated: StoredOwnerProfile = {
    phone: cleanPhone,
    name: profile.name.trim(),
    pin: profile.pin.trim(),
    nationalIdFrontUrl: profile.nationalIdFrontUrl,
    lastUsedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.OWNER_PROFILES, JSON.stringify([updated, ...filtered]));
}

export function getStoredOwnerProfile(phone: string): StoredOwnerProfile | null {
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  if (!cleanPhone) return null;

  // 1. Check owner profiles cache
  const profiles = getStoredOwnerProfiles();
  const match = profiles.find((p) => p.phone.replace(/[\s-]/g, '') === cleanPhone);
  if (match) return match;

  // 2. Fallback check stored properties
  const properties = getStoredProperties();
  const propMatch = properties.find(
    (p) => p.ownerPhone && p.ownerPhone.replace(/[\s-]/g, '') === cleanPhone
  );
  if (propMatch) {
    const fallbackProfile: StoredOwnerProfile = {
      phone: cleanPhone,
      name: propMatch.ownerName || 'Owner',
      pin: propMatch.ownerPin || '1234',
      nationalIdFrontUrl: propMatch.nationalIdFrontUrl,
      lastUsedAt: propMatch.createdAt,
    };
    saveOwnerProfile(cleanPhone, fallbackProfile);
    return fallbackProfile;
  }

  return null;
}

// No default banned phones or reported brokers - fresh real platform state
const DEFAULT_BANNED_PHONES: string[] = [];
const DEFAULT_REPORTED_BROKERS: ReportedBroker[] = [];

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

export function getStoredBannedPhones(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BANNED_PHONES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BANNED_PHONES, JSON.stringify(DEFAULT_BANNED_PHONES));
      return DEFAULT_BANNED_PHONES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BANNED_PHONES;
  }
}

export function saveBannedPhones(phones: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BANNED_PHONES, JSON.stringify(phones));
  } catch (err) {
    console.error('Error saving banned phones:', err);
  }
}

export function isPhoneBanned(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s-]/g, '').toLowerCase();
  const banned = getStoredBannedPhones();
  return banned.some(b => b.replace(/[\s-]/g, '').toLowerCase() === clean);
}

export function banPhoneNumber(phone: string): string[] {
  const clean = phone.trim();
  const list = getStoredBannedPhones();
  if (!list.includes(clean)) {
    const updated = [clean, ...list];
    saveBannedPhones(updated);
    return updated;
  }
  return list;
}

export function unbanPhoneNumber(phone: string): string[] {
  const clean = phone.trim();
  const list = getStoredBannedPhones();
  const updated = list.filter(p => p !== clean);
  saveBannedPhones(updated);
  return updated;
}

export function getStoredReportedBrokers(): ReportedBroker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTED_BROKERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REPORTED_BROKERS, JSON.stringify(DEFAULT_REPORTED_BROKERS));
      return DEFAULT_REPORTED_BROKERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REPORTED_BROKERS;
  }
}

export function saveReportedBrokers(reports: ReportedBroker[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTED_BROKERS, JSON.stringify(reports));
  } catch (err) {
    console.error('Error saving reported brokers:', err);
  }
}

export function addReportedBroker(report: ReportedBroker): void {
  const current = getStoredReportedBrokers();
  const updated = [report, ...current];
  saveReportedBrokers(updated);
}

// -------------------------------------------------------------
// USER ACCOUNTS & SESSION MANAGEMENT
// -------------------------------------------------------------

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

export function getActiveUserSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Refresh user data from all users list in case credits/unlocks updated
    const allUsers = getStoredUsers();
    const found = allUsers.find(u => u.phone === user.phone);
    return found || user;
  } catch {
    return null;
  }
}

export function saveActiveUserSession(user: UserAccount | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(user));
      saveUserPhone(user.phone);
    }
  } catch (err) {
    console.error('Error saving active user session:', err);
  }
}

export function clearActiveUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
  } catch (err) {
    console.error('Error clearing active user session:', err);
  }
}

export function loginUserAccount(phone: string, pin: string): { success: boolean; message: string; user?: UserAccount } {
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  const allUsers = getStoredUsers();
  const found = allUsers.find(u => u.phone.replace(/[\s-]/g, '') === cleanPhone);

  if (!found) {
    return { success: false, message: 'No account found with this phone number. Please register.' };
  }

  if (found.pin && found.pin !== pin.trim()) {
    return { success: false, message: 'Invalid PIN / password. Please try again.' };
  }

  saveActiveUserSession(found);
  return { success: true, message: 'Logged in successfully!', user: found };
}

export function registerUserAccount(name: string, phone: string, pin: string): { success: boolean; message: string; user?: UserAccount } {
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  const cleanName = name.trim() || 'User';
  const cleanPin = pin.trim() || '1234';

  const allUsers = getStoredUsers();
  const existing = allUsers.find(u => u.phone.replace(/[\s-]/g, '') === cleanPhone);

  if (existing) {
    // If already exists, log in
    const updated = { ...existing, name: cleanName, pin: cleanPin };
    const updatedList = allUsers.map(u => u.id === existing.id ? updated : u);
    saveUsers(updatedList);
    saveActiveUserSession(updated);
    return { success: true, message: 'Account updated and logged in!', user: updated };
  }

  const newUser: UserAccount = {
    id: `usr-${Date.now().toString(36)}`,
    name: cleanName,
    phone: cleanPhone,
    pin: cleanPin,
    createdAt: new Date().toISOString(),
    unlockedPropertyIds: [],
    packages: [],
  };

  saveUsers([newUser, ...allUsers]);
  saveActiveUserSession(newUser);
  return { success: true, message: 'Account registered successfully!', user: newUser };
}

export function loginOrRegisterUser(name: string, phone: string, pin: string): UserAccount {
  const res = registerUserAccount(name, phone, pin);
  return res.user!;
}

/**
 * Delete a user account permanently (frees storage / supabase quota)
 */
export function deleteUserAccount(userIdOrPhone: string): boolean {
  const clean = userIdOrPhone.trim().replace(/[\s-]/g, '');
  if (!clean) return false;

  const allUsers = getStoredUsers();
  const filtered = allUsers.filter(
    (u) => u.id !== userIdOrPhone && u.phone.replace(/[\s-]/g, '') !== clean
  );

  saveUsers(filtered);

  // Clear active session if logged in as this user
  const activeUser = getActiveUserSession();
  if (
    activeUser &&
    (activeUser.id === userIdOrPhone || activeUser.phone.replace(/[\s-]/g, '') === clean)
  ) {
    clearActiveUserSession();
  }

  return true;
}

/**
 * Clean inactive users who have 0 remaining credits and 0 unlocked houses
 */
export function cleanInactiveUsers(): { kept: UserAccount[]; removedCount: number } {
  const allUsers = getStoredUsers();
  const kept = allUsers.filter((u) => {
    const totalCredits = (u.packages || []).reduce(
      (sum, p) => sum + (p.remainingUnlocks || 0),
      0
    );
    const unlockedCount = (u.unlockedPropertyIds || []).length;
    // Keep user if they have active credits or have unlocked properties
    return totalCredits > 0 || unlockedCount > 0;
  });

  const removedCount = allUsers.length - kept.length;
  saveUsers(kept);
  return { kept, removedCount };
}

export function unlockPropertyWithCredit(
  userIdOrPhone: string,
  propertyId: string,
  propertyPrice: number,
  listingType?: string
): { success: boolean; message: string; updatedUser?: UserAccount } {
  const allUsers = getStoredUsers();
  const clean = userIdOrPhone.trim().replace(/[\s-]/g, '');
  const user = allUsers.find(u => u.id === userIdOrPhone || u.phone.replace(/[\s-]/g, '') === clean);

  if (!user) {
    return { success: false, message: 'User not found. Please log in first.' };
  }

  return deductUserCreditAndUnlock(user.phone, propertyId, propertyPrice, listingType);
}

/**
 * Checks if a specific property is unlocked for the given user account
 */
export function isPropertyUnlockedForUser(propertyId: string, user: UserAccount | null): boolean {
  if (!user || !propertyId) return false;
  return user.unlockedPropertyIds.includes(propertyId);
}

/**
 * Checks if user has an active credit package that can unlock a house of this price
 */
export function getEligiblePackageForPrice(user: UserAccount, price: number, listingType?: string): UserCreditPackage | null {
  if (!user || !user.packages || user.packages.length === 0) return null;

  for (const pkg of user.packages) {
    if (pkg.remainingUnlocks > 0) {
      if (listingType === 'sale' && pkg.tierId === 'tier_unlimited') {
        return pkg;
      }
      if (price <= pkg.maxPrice) {
        return pkg;
      }
    }
  }
  return null;
}

/**
 * Deduct 1 credit from user package and unlock the property
 */
export function deductUserCreditAndUnlock(
  userPhoneOrId: string,
  propertyId: string,
  propertyPrice: number,
  listingType?: string
): { success: boolean; message: string; updatedUser?: UserAccount } {
  const allUsers = getStoredUsers();
  const cleanPhone = userPhoneOrId.replace(/[\s-]/g, '');
  const userIdx = allUsers.findIndex(
    u => u.phone.replace(/[\s-]/g, '') === cleanPhone || u.id === userPhoneOrId
  );

  if (userIdx < 0) {
    return { success: false, message: 'User not found. Please log in.' };
  }

  const user = allUsers[userIdx];
  if (user.unlockedPropertyIds.includes(propertyId)) {
    return { success: true, message: 'Already unlocked.', updatedUser: user };
  }

  // Find eligible package (must have remaining unlocks and cover this price or be unlimited)
  const pkgIdx = user.packages.findIndex(p => {
    if (p.remainingUnlocks <= 0) return false;
    if (p.tierId === 'tier_unlimited') return true;
    if (listingType === 'sale') return false;
    return propertyPrice <= p.maxPrice;
  });

  if (pkgIdx < 0) {
    return {
      success: false,
      message: 'No active credit package available for this price range. Please unlock to get a 5-house package.',
    };
  }

  // Deduct 1 unlock
  const updatedPackages = [...user.packages];
  updatedPackages[pkgIdx] = {
    ...updatedPackages[pkgIdx],
    remainingUnlocks: Math.max(0, updatedPackages[pkgIdx].remainingUnlocks - 1),
  };

  const updatedUser: UserAccount = {
    ...user,
    unlockedPropertyIds: [...user.unlockedPropertyIds, propertyId],
    packages: updatedPackages,
  };

  allUsers[userIdx] = updatedUser;
  saveUsers(allUsers);
  saveActiveUserSession(updatedUser);

  return {
    success: true,
    message: `Unlocked successfully! ${updatedPackages[pkgIdx].remainingUnlocks} unlocks remaining in your package.`,
    updatedUser,
  };
}

/**
 * Credit a package with 5 unlocks to a user phone upon admin approval
 */
export function creditPackageToUserPhone(
  userPhone: string,
  tierId: PackageTierId,
  creditsToGrant: number = 5,
  customMaxPrice?: number,
  customTierName?: string
): { success: boolean; updatedUser?: UserAccount } {
  const allUsers = getStoredUsers();
  const cleanPhone = userPhone.replace(/[\s-]/g, '');
  let userIdx = allUsers.findIndex(u => u.phone.replace(/[\s-]/g, '') === cleanPhone);

  const matchedTier = PRICE_TIERS.find(t => t.id === tierId);
  const maxPrice = customMaxPrice || matchedTier?.maxPrice || 999999999;
  const tierName = customTierName || matchedTier?.nameEn || '5-House Package';

  const newPackage: UserCreditPackage = {
    tierId: tierId || 'tier_unlimited',
    tierName: tierName,
    maxPrice: maxPrice,
    remainingUnlocks: creditsToGrant,
    totalPurchased: creditsToGrant,
    purchasedAt: new Date().toISOString(),
  };

  let updatedUser: UserAccount;

  if (userIdx >= 0) {
    const user = allUsers[userIdx];
    updatedUser = {
      ...user,
      packages: [newPackage, ...(user.packages || [])],
    };
    allUsers[userIdx] = updatedUser;
  } else {
    // Create user profile for this phone
    updatedUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: 'User',
      phone: cleanPhone,
      pin: '1234',
      createdAt: new Date().toISOString(),
      unlockedPropertyIds: [],
      packages: [newPackage],
    };
    allUsers.unshift(updatedUser);
  }

  saveUsers(allUsers);

  // If currently active session is this user, refresh it
  const activeSession = getActiveUserSession();
  if (activeSession && activeSession.phone.replace(/[\s-]/g, '') === cleanPhone) {
    saveActiveUserSession(updatedUser);
  }

  return { success: true, updatedUser };
}

/**
 * Direct single property unlock credit to a user upon admin approval
 */
export function creditSinglePropertyUnlockToUser(
  userPhone: string,
  propertyId: string
): { success: boolean; updatedUser?: UserAccount } {
  const allUsers = getStoredUsers();
  const cleanPhone = userPhone.replace(/[\s-]/g, '');
  let userIdx = allUsers.findIndex(u => u.phone.replace(/[\s-]/g, '') === cleanPhone);

  let updatedUser: UserAccount;

  if (userIdx >= 0) {
    const user = allUsers[userIdx];
    if (!user.unlockedPropertyIds.includes(propertyId)) {
      updatedUser = {
        ...user,
        unlockedPropertyIds: [...user.unlockedPropertyIds, propertyId],
      };
      allUsers[userIdx] = updatedUser;
      saveUsers(allUsers);
    } else {
      updatedUser = user;
    }
  } else {
    updatedUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: 'User',
      phone: cleanPhone,
      pin: '1234',
      createdAt: new Date().toISOString(),
      unlockedPropertyIds: [propertyId],
      packages: [],
    };
    allUsers.unshift(updatedUser);
    saveUsers(allUsers);
  }

  const activeSession = getActiveUserSession();
  if (activeSession && activeSession.phone.replace(/[\s-]/g, '') === cleanPhone) {
    saveActiveUserSession(updatedUser);
  }

  return { success: true, updatedUser };
}

// -------------------------------------------------------------
// PROPERTIES & LISTINGS
// -------------------------------------------------------------

export function getStoredProperties(): Property[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify([]));
      return [];
    }
    const parsed: Property[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    
    // Auto-update expiry status on load
    const now = Date.now();
    return parsed.map((p) => {
      const expiry = new Date(p.expiresAt).getTime();
      if (now > expiry && p.status === 'active') {
        return { ...p, status: 'expired' as const };
      }
      return p;
    });
  } catch (err) {
    console.error('Error loading stored properties:', err);
    return [];
  }
}

export function saveProperties(properties: Property[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  } catch (err) {
    console.error('Error saving properties:', err);
  }
}

export function getStoredUnlockRequests(): UnlockRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNLOCK_REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_REQUESTS, JSON.stringify([]));
      return [];
    }
    const parsed: UnlockRequest[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading unlock requests:', err);
    return [];
  }
}

export function saveUnlockRequests(requests: UnlockRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UNLOCK_REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Error saving unlock requests:', err);
  }
}

export function getStoredSettings(): PaymentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // Guarantee real bank accounts are present
    const updated: PaymentSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      telebirrNumber: parsed.telebirrNumber || '0991154337',
      telebirrName: parsed.telebirrName || 'BetDelala (0991154337)',
      cbeAccount: parsed.cbeAccount || '1000131638128',
      cbeName: parsed.cbeName || 'BetDelala (CBE)',
      boaAccount: parsed.boaAccount || '61648817',
      boaName: parsed.boaName || 'BetDelala (Bank of Abyssinia / አቢሲኒያ)',
      adminPin: parsed.adminPin || 'admin123',
    };
    return updated;
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PaymentSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

export function updateAdminPin(newPin: string): boolean {
  try {
    const currentSettings = getStoredSettings();
    const updated = { ...currentSettings, adminPin: newPin.trim() };
    saveSettings(updated);
    return true;
  } catch (err) {
    console.error('Error updating admin PIN:', err);
    return false;
  }
}

export function getStoredUserPhone(): string {
  return localStorage.getItem(STORAGE_KEYS.USER_PHONE) || '';
}

export function saveUserPhone(phone: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_PHONE, phone);
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch {}

  // Fallback to Vite environment variables (e.g. from Vercel / .env)
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uuulhzhxwxnoxyjcpemz.supabase.co';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_weSbpLEUdCzHxr_1XheOdw_jZNq1e_k';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, isEnabled: true };
  }

  return { url: '', anonKey: '', isEnabled: false };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
}

/**
 * Calculate days remaining for a listing before 7-day auto-expiry
 */
export function getDaysRemaining(expiresAt: string): {
  days: number;
  hours: number;
  isExpired: boolean;
  isWarningPeriod: boolean;
} {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, isExpired: true, isWarningPeriod: false };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isWarningPeriod = days <= 2;

  return { days, hours, isExpired: false, isWarningPeriod };
}

/**
 * Legacy check helper for backwards compatibility
 */
export function isPropertyUnlockedForBuyer(
  propertyId: string,
  buyerPhone: string,
  requests: UnlockRequest[]
): boolean {
  const activeUser = getActiveUserSession();
  if (activeUser && activeUser.unlockedPropertyIds.includes(propertyId)) {
    return true;
  }
  if (!buyerPhone || !propertyId) return false;
  const cleanPhone = buyerPhone.replace(/[\s-]/g, '');
  return requests.some(
    (r) =>
      r.propertyId === propertyId &&
      r.buyerPhone.replace(/[\s-]/g, '') === cleanPhone &&
      r.status === 'approved'
  );
}

/**
 * Auto-clean: Removes expired listings older than 7 days to conserve free tier database quota.
 */
export function cleanupExpiredListings(properties: Property[]): {
  cleanedListings: Property[];
  removedCount: number;
} {
  const now = Date.now();
  const kept = properties.filter((p) => {
    const expiry = new Date(p.expiresAt).getTime();
    return expiry > now;
  });
  const removedCount = properties.length - kept.length;
  return { cleanedListings: kept, removedCount };
}

/**
 * SQL Schema for Supabase Free Tier setup
 */
export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- BETDELALA ETHIOPIAN HOUSE BROKER - SUPABASE FREE TIER SQL
-- Run this in your Supabase SQL Editor (100% Free Tier Compatible)
-- =========================================================

-- 1. Create Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  category TEXT DEFAULT 'home',
  title TEXT NOT NULL,
  title_am TEXT,
  description TEXT,
  description_am TEXT,
  area TEXT NOT NULL,
  area_am TEXT,
  sub_city TEXT,
  exact_landmark TEXT NOT NULL,
  property_type TEXT,
  listing_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  price_period TEXT NOT NULL DEFAULT 'month',
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sq_meters NUMERIC,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  national_id_front_url TEXT,
  owner_phone TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_pin TEXT NOT NULL,
  seller_listing_fee_birr NUMERIC,
  seller_payment_screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  last_renewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  unlock_count INTEGER DEFAULT 0
);

-- 2. Create Unlock Requests Table (5-House Package & Single Unlock screenshots)
CREATE TABLE IF NOT EXISTS public.unlock_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT DEFAULT 'single_unlock',
  property_id TEXT,
  property_title TEXT,
  property_area TEXT,
  package_tier_id TEXT,
  package_tier_name TEXT,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT,
  screenshot_url TEXT NOT NULL,
  screenshot_size_kb NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_birr NUMERIC NOT NULL DEFAULT 150,
  remaining_unlocks INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  admin_note TEXT
);

-- 3. Create Users / Home Finders Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  unlocked_property_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  packages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  telebirr_number TEXT DEFAULT '0991154337',
  telebirr_name TEXT DEFAULT 'BetDelala (0991154337)',
  cbe_account TEXT DEFAULT '1000131638128',
  cbe_name TEXT DEFAULT 'BetDelala (CBE)',
  awash_account TEXT DEFAULT '0132087654321',
  awash_name TEXT DEFAULT 'BetDelala Agency',
  boa_account TEXT DEFAULT '61648817',
  boa_name TEXT DEFAULT 'BetDelala (Abyssinia)',
  fee_amount_birr NUMERIC DEFAULT 150,
  admin_pin TEXT DEFAULT 'admin123',
  auto_delete_days INTEGER DEFAULT 7,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Reported Brokers & Banned Phones Tables
CREATE TABLE IF NOT EXISTS public.reported_brokers (
  id TEXT PRIMARY KEY,
  property_id TEXT,
  property_title TEXT,
  reported_phone TEXT NOT NULL,
  reporter_phone TEXT NOT NULL,
  reporter_role TEXT NOT NULL,
  reason_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banned_phones (
  phone TEXT PRIMARY KEY,
  reason TEXT,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_phones ENABLE ROW LEVEL SECURITY;

-- Properties Policies
DROP POLICY IF EXISTS "Public Read Properties" ON public.properties;
DROP POLICY IF EXISTS "Public Insert Properties" ON public.properties;
DROP POLICY IF EXISTS "Public Update Properties" ON public.properties;
DROP POLICY IF EXISTS "Public Delete Properties" ON public.properties;
CREATE POLICY "Public Read Properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Public Insert Properties" ON public.properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Properties" ON public.properties FOR UPDATE USING (true);
CREATE POLICY "Public Delete Properties" ON public.properties FOR DELETE USING (true);

-- Unlock Requests Policies
DROP POLICY IF EXISTS "Public Read Unlock Requests" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Insert Unlock Requests" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Update Unlock Requests" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Delete Unlock Requests" ON public.unlock_requests;
CREATE POLICY "Public Read Unlock Requests" ON public.unlock_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Unlock Requests" ON public.unlock_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Unlock Requests" ON public.unlock_requests FOR UPDATE USING (true);
CREATE POLICY "Public Delete Unlock Requests" ON public.unlock_requests FOR DELETE USING (true);

-- Users Policies (Allows user creation, updates, and admin space-saving deletion)
DROP POLICY IF EXISTS "Public Read Users" ON public.users;
DROP POLICY IF EXISTS "Public Insert Users" ON public.users;
DROP POLICY IF EXISTS "Public Update Users" ON public.users;
DROP POLICY IF EXISTS "Public Delete Users" ON public.users;
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Insert Users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Public Delete Users" ON public.users FOR DELETE USING (true);

-- Settings Policies
DROP POLICY IF EXISTS "Public Read Settings" ON public.settings;
DROP POLICY IF EXISTS "Public Update Settings" ON public.settings;
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public Update Settings" ON public.settings FOR UPDATE USING (true);

-- Reported Brokers & Banned Policies
DROP POLICY IF EXISTS "Public Read Reports" ON public.reported_brokers;
DROP POLICY IF EXISTS "Public Insert Reports" ON public.reported_brokers;
DROP POLICY IF EXISTS "Public Update Reports" ON public.reported_brokers;
CREATE POLICY "Public Read Reports" ON public.reported_brokers FOR SELECT USING (true);
CREATE POLICY "Public Insert Reports" ON public.reported_brokers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Reports" ON public.reported_brokers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Read Banned" ON public.banned_phones;
DROP POLICY IF EXISTS "Public Insert Banned" ON public.banned_phones;
CREATE POLICY "Public Read Banned" ON public.banned_phones FOR SELECT USING (true);
CREATE POLICY "Public Insert Banned" ON public.banned_phones FOR INSERT WITH CHECK (true);
`;
