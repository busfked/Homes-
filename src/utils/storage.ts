import { Property, UnlockRequest, PaymentSettings, ReportedBroker } from '../types';
import { SAMPLE_PROPERTIES, SAMPLE_UNLOCK_REQUESTS, DEFAULT_SETTINGS } from '../data/sampleListings';

const STORAGE_KEYS = {
  PROPERTIES: 'betdelala_properties_v1',
  UNLOCK_REQUESTS: 'betdelala_unlock_requests_v1',
  SETTINGS: 'betdelala_settings_v1',
  USER_PHONE: 'betdelala_current_user_phone',
  SUPABASE_CONFIG: 'betdelala_supabase_config',
  BANNED_PHONES: 'betdelala_banned_phones_v1',
  REPORTED_BROKERS: 'betdelala_reported_brokers_v1',
};

// Initial default sample reported broker & banned phone for demonstration
const DEFAULT_BANNED_PHONES: string[] = ['0911000000'];
const DEFAULT_REPORTED_BROKERS: ReportedBroker[] = [
  {
    id: 'rep-sample-1',
    reporterPhone: '0911223344',
    reporterRole: 'owner',
    reportedPhone: '0911000000',
    propertyId: 'bese-001',
    propertyTitle: 'Luxury 3-Bedroom Apartment in Bole Brass',
    reason: 'broker_middleman_activity',
    reasonText: 'Called pretending to be an outside broker and demanding 10% commission and trying to repost my house on telegram.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'banned',
  }
];

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

export function banPhoneNumber(phone: string): void {
  const clean = phone.trim();
  const list = getStoredBannedPhones();
  if (!list.includes(clean)) {
    const updated = [clean, ...list];
    saveBannedPhones(updated);
  }
}

export function unbanPhoneNumber(phone: string): void {
  const clean = phone.trim();
  const list = getStoredBannedPhones();
  const updated = list.filter(p => p !== clean);
  saveBannedPhones(updated);
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


export function getStoredProperties(): Property[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify([]));
      return [];
    }
    const parsed: Property[] = JSON.parse(raw);
    // Filter out legacy demo items if present so the user gets a 100% clean listing database
    const realProperties = parsed.filter(p => !p.id.startsWith('bese-00'));
    
    // Auto-update expiry status on load
    const now = Date.now();
    return realProperties.map((p) => {
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
    return parsed.filter(r => !r.id.startsWith('req-sample-'));
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
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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

export function getStoredUserPhone(): string {
  return localStorage.getItem(STORAGE_KEYS.USER_PHONE) || '';
}

export function saveUserPhone(phone: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_PHONE, phone);
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
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
  isWarningPeriod: boolean; // Day 5 or 6 (less than 2 days remaining)
} {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, isExpired: true, isWarningPeriod: false };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isWarningPeriod = days <= 2; // When 5th or 6th day arrives

  return { days, hours, isExpired: false, isWarningPeriod };
}

/**
 * Check if a buyer has approved unlock access to a specific property
 */
export function isPropertyUnlockedForBuyer(
  propertyId: string,
  buyerPhone: string,
  requests: UnlockRequest[]
): boolean {
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
  title TEXT NOT NULL,
  title_am TEXT,
  description TEXT,
  description_am TEXT,
  area TEXT NOT NULL,
  area_am TEXT,
  sub_city TEXT,
  exact_landmark TEXT NOT NULL,
  property_type TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  price_period TEXT NOT NULL DEFAULT 'month',
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sq_meters NUMERIC,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_phone TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  last_renewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  unlock_count INTEGER DEFAULT 0
);

-- 2. Create Unlock Requests Table (50 Birr screenshot records)
CREATE TABLE IF NOT EXISTS public.unlock_requests (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_title TEXT NOT NULL,
  property_area TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT,
  screenshot_url TEXT NOT NULL,
  screenshot_size_kb NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_birr NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  admin_note TEXT
);

-- 3. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  telebirr_number TEXT DEFAULT '0911234567',
  telebirr_name TEXT DEFAULT 'BetDelala Brokerage',
  cbe_account TEXT DEFAULT '1000123456789',
  cbe_name TEXT DEFAULT 'BetDelala Real Estate',
  awash_account TEXT DEFAULT '0132087654321',
  awash_name TEXT DEFAULT 'BetDelala Agency',
  fee_amount_birr NUMERIC DEFAULT 50,
  admin_pin TEXT DEFAULT 'admin123',
  auto_delete_days INTEGER DEFAULT 7,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Public Insert Properties" ON public.properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Properties" ON public.properties FOR UPDATE USING (true);
CREATE POLICY "Public Delete Properties" ON public.properties FOR DELETE USING (true);

CREATE POLICY "Public Read Unlock Requests" ON public.unlock_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Unlock Requests" ON public.unlock_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Unlock Requests" ON public.unlock_requests FOR UPDATE USING (true);

CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public Update Settings" ON public.settings FOR UPDATE USING (true);

-- 5. Auto-delete function for listings older than 7 days without renewal
CREATE OR REPLACE FUNCTION delete_expired_listings()
RETURNS void AS $$
BEGIN
  DELETE FROM public.properties 
  WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;
`;
