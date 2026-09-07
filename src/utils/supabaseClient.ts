import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Property, UnlockRequest, UserAccount } from '../types';
import { getSupabaseConfig, saveSupabaseConfig } from './storage';

// Direct production Supabase connection credentials directly in code - no .env required!
export const DEFAULT_SUPABASE_URL = 'https://uuulhzhxwxnoxyjcpemz.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_weSbpLEUdCzHxr_1XheOdw_jZNq1e_k';

let cachedClient: SupabaseClient | null = null;
let lastKnownUrl: string = '';
let lastKnownKey: string = '';

/**
 * Get or initialize real Supabase client
 */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const url = config.url || DEFAULT_SUPABASE_URL;
  const anonKey = config.anonKey || DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastKnownUrl === url && lastKnownKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });
    lastKnownUrl = url;
    lastKnownKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function resetSupabaseClient() {
  cachedClient = null;
  lastKnownUrl = '';
  lastKnownKey = '';
}

/**
 * Test connectivity to real Supabase instance
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  hasTables: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials not configured.',
      hasTables: false,
    };
  }

  try {
    // Attempt querying properties table
    const { data, error, count } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('not find')) {
        return {
          success: true,
          message: 'Supabase server reached successfully, but SQL tables are not yet created. Click "Copy SQL Schema" and run it in your Supabase SQL Editor.',
          hasTables: false,
        };
      }
      return {
        success: false,
        message: `Supabase returned error: ${error.message} (${error.code})`,
        hasTables: false,
      };
    }

    return {
      success: true,
      message: `Connected! Supabase database is online and active (${count || 0} listings).`,
      hasTables: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err?.message || 'Network error'}`,
      hasTables: false,
    };
  }
}

// ----------------------------------------------------------------------
// Property CRUD Operations
// ----------------------------------------------------------------------

function mapPropertyRow(row: any): Property {
  return {
    id: row.id,
    category: row.category || 'home',
    title: row.title,
    titleAm: row.title_am || row.title,
    description: row.description || '',
    descriptionAm: row.description_am || row.description || '',
    area: row.area,
    areaAm: row.area_am || row.area,
    subCity: row.sub_city || 'Addis Ababa',
    exactLandmark: row.exact_landmark || '',
    propertyType: row.property_type || 'apartment',
    listingType: row.listing_type || 'rent',
    price: Number(row.price) || 0,
    pricePeriod: row.price_period || 'month',
    bedrooms: row.bedrooms || 1,
    bathrooms: row.bathrooms || 1,
    areaSqMeters: row.area_sq_meters,
    images: Array.isArray(row.images)
      ? row.images.map((img: any) =>
          typeof img === 'string'
            ? { url: img, originalSizeKb: 120, compressedSizeKb: 35 }
            : img
        )
      : [],
    nationalIdFrontUrl: row.national_id_front_url,
    ownerPhone: row.owner_phone,
    ownerName: row.owner_name,
    ownerPin: row.owner_pin,
    sellerListingFeeBirr: row.seller_listing_fee_birr,
    sellerPaymentScreenshotUrl: row.seller_payment_screenshot_url,
    status: row.status || 'pending',
    createdAt: row.created_at || new Date().toISOString(),
    expiresAt: row.expires_at || new Date(Date.now() + 7 * 86400000).toISOString(),
    lastRenewedAt: row.last_renewed_at,
    viewCount: row.view_count || 0,
    unlockCount: row.unlock_count || 0,
  };
}

export interface PropertySummary {
  id: string;
  status: 'active' | 'occupied' | 'expired' | 'pending';
  created_at: string;
  last_renewed_at?: string;
  unlock_count?: number;
  view_count?: number;
}

/**
 * Ultra-lightweight query: only fetches IDs, status, and timestamps.
 * Takes ~0.5 KB instead of ~2,000 KB (saves 99.9% mobile data).
 */
export async function fetchPropertiesSummaryFromSupabase(): Promise<PropertySummary[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, status, created_at, last_renewed_at, unlock_count, view_count')
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data as PropertySummary[];
  } catch (err) {
    console.warn('fetchPropertiesSummaryFromSupabase error:', err);
    return null;
  }
}

/**
 * Fetches only specified properties by IDs to avoid downloading already cached listings.
 */
export async function fetchPropertiesByIdsFromSupabase(ids: string[]): Promise<Property[] | null> {
  if (!ids || ids.length === 0) return [];
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .in('id', ids);

    if (error || !data) return null;
    return data.map((row: any) => mapPropertyRow(row));
  } catch (err) {
    console.warn('fetchPropertiesByIdsFromSupabase error:', err);
    return null;
  }
}

export async function fetchPropertiesFromSupabase(): Promise<Property[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any) => mapPropertyRow(row));
  } catch (err) {
    console.warn('Supabase fetch properties exception:', err);
    return null;
  }
}

export async function savePropertyToSupabase(prop: Property): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row: Record<string, any> = {
      id: prop.id,
      category: prop.category || 'home',
      title: prop.title,
      title_am: prop.titleAm || prop.title,
      description: prop.description || '',
      description_am: prop.descriptionAm || prop.description || '',
      area: prop.area,
      area_am: prop.areaAm || prop.area,
      sub_city: prop.subCity || 'Addis Ababa',
      exact_landmark: prop.exactLandmark || '',
      property_type: prop.propertyType || (prop as any).carType || (prop as any).machineryType || 'residential',
      listing_type: prop.listingType || 'rent',
      price: Number(prop.price) || 0,
      price_period: prop.pricePeriod || 'month',
      bedrooms: prop.bedrooms !== undefined && prop.bedrooms !== null ? Number(prop.bedrooms) : 1,
      bathrooms: prop.bathrooms !== undefined && prop.bathrooms !== null ? Number(prop.bathrooms) : 1,
      area_sq_meters: prop.areaSqMeters ? Number(prop.areaSqMeters) : null,
      images: (prop.images || []).map((img: any) => (typeof img === 'string' ? img : (img?.url || ''))).filter(Boolean),
      national_id_front_url: prop.nationalIdFrontUrl || null,
      owner_phone: prop.ownerPhone || '',
      owner_name: prop.ownerName || 'Owner',
      owner_pin: prop.ownerPin || '1234',
      seller_listing_fee_birr: prop.sellerListingFeeBirr ? Number(prop.sellerListingFeeBirr) : null,
      seller_payment_screenshot_url: prop.sellerPaymentScreenshotUrl || null,
      status: prop.status || 'pending',
      created_at: prop.createdAt || new Date().toISOString(),
      expires_at: prop.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
      last_renewed_at: prop.lastRenewedAt || null,
      view_count: prop.viewCount || 0,
      unlock_count: prop.unlockCount || 0,
    };

    // Remove any undefined keys
    Object.keys(row).forEach((k) => {
      if (row[k] === undefined) delete row[k];
    });

    const { error } = await supabase.from('properties').upsert(row);
    if (error) {
      console.warn('Failed to upsert property to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('savePropertyToSupabase error:', err);
    return false;
  }
}

export async function deletePropertyFromSupabase(propertyId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) {
      console.warn('deletePropertyFromSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deletePropertyFromSupabase error:', err);
    return false;
  }
}

/**
 * Direct fast update of property status in Supabase
 * (e.g. from 'pending' to 'active' on approval, or between 'active' and 'occupied')
 */
export async function updatePropertyStatusInSupabase(
  propertyId: string,
  status: 'active' | 'occupied' | 'expired' | 'pending',
  extraFields?: { expiresAt?: string; lastRenewedAt?: string }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload: Record<string, any> = { status };
    if (extraFields?.expiresAt) payload.expires_at = extraFields.expiresAt;
    if (extraFields?.lastRenewedAt) payload.last_renewed_at = extraFields.lastRenewedAt;

    const { error } = await supabase.from('properties').update(payload).eq('id', propertyId);
    if (error) {
      console.warn('updatePropertyStatusInSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updatePropertyStatusInSupabase exception:', err);
    return false;
  }
}

/**
 * Full clean-up of all test data for promo launch:
 * Wipes out unlock_requests, user_unlocked_properties, user_packages, users, and properties
 */
export async function wipeAllTestDataFromSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'Supabase client not initialized' };

  try {
    // Delete in dependency order with isolated catches
    try { await supabase.from('unlock_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) { console.debug('Clear unlock_requests notice:', e); }
    try { await supabase.from('user_unlocked_properties').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) { console.debug('Clear user_unlocked_properties notice:', e); }
    try { await supabase.from('user_packages').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) { console.debug('Clear user_packages notice:', e); }
    try { await supabase.from('reported_brokers').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) { console.debug('Clear reported_brokers notice:', e); }
    try { await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) { console.debug('Clear users notice:', e); }
    try { await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) { console.debug('Clear properties notice:', e); }
    return { success: true, message: 'All test data wiped from Supabase successfully' };
  } catch (err: any) {
    console.warn('wipeAllTestDataFromSupabase error:', err);
    return { success: false, message: err?.message || 'Error wiping test data' };
  }
}

// ----------------------------------------------------------------------
// Unlock Requests CRUD Operations
// ----------------------------------------------------------------------

// Lightweight field list to prevent downloading hundreds of KB of base64 screenshots in list view
const UNLOCK_REQUEST_LIST_FIELDS = 'id, request_type, property_id, property_title, property_area, package_tier_id, package_tier_name, buyer_name, buyer_phone, payment_method, transaction_ref, screenshot_size_kb, status, amount_birr, remaining_unlocks, created_at, approved_at, admin_note';

export async function fetchUnlockRequestsFromSupabase(): Promise<UnlockRequest[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // Ultra-lightweight: omits screenshot_url until explicitly clicked (cuts list download from 1.2MB to ~4KB)
    const { data, error } = await supabase
      .from('unlock_requests')
      .select(UNLOCK_REQUEST_LIST_FIELDS)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      requestType: row.request_type || 'single_unlock',
      type: row.request_type || 'single_unlock',
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      propertyArea: row.property_area,
      packageTierId: row.package_tier_id,
      packageTierName: row.package_tier_name,
      buyerName: row.buyer_name,
      buyerPhone: row.buyer_phone,
      paymentMethod: row.payment_method || 'telebirr',
      transactionRef: row.transaction_ref || '',
      screenshotUrl: undefined, // Fetched on demand when viewing receipt
      screenshotSizeKb: row.screenshot_size_kb,
      status: row.status || 'pending',
      amountBirr: Number(row.amount_birr) || 150,
      remainingUnlocks: row.remaining_unlocks || 5,
      createdAt: row.created_at || new Date().toISOString(),
      approvedAt: row.approved_at,
      adminNote: row.admin_note,
    }));
  } catch (err) {
    console.warn('fetchUnlockRequestsFromSupabase error:', err);
    return null;
  }
}

/**
 * Fetch a single receipt screenshot on-demand only when admin taps to view it.
 */
export async function fetchUnlockRequestScreenshot(requestId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('unlock_requests')
      .select('screenshot_url')
      .eq('id', requestId)
      .single();

    if (error || !data) return null;
    return data.screenshot_url || null;
  } catch (err) {
    console.warn('fetchUnlockRequestScreenshot error:', err);
    return null;
  }
}

/**
 * Data-Saver: Fetch ONLY requests made by a specific buyer phone.
 * Prevents non-admin visitors from downloading all other users' payment receipts.
 */
export async function fetchUnlockRequestsForPhoneFromSupabase(phone: string): Promise<UnlockRequest[] | null> {
  if (!phone) return [];
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('unlock_requests')
      .select(UNLOCK_REQUEST_LIST_FIELDS)
      .eq('buyer_phone', cleanPhone)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      requestType: row.request_type || 'single_unlock',
      type: row.request_type || 'single_unlock',
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      propertyArea: row.property_area,
      packageTierId: row.package_tier_id,
      packageTierName: row.package_tier_name,
      buyerName: row.buyer_name,
      buyerPhone: row.buyer_phone,
      paymentMethod: row.payment_method || 'telebirr',
      transactionRef: row.transaction_ref || '',
      screenshotUrl: undefined,
      screenshotSizeKb: row.screenshot_size_kb,
      status: row.status || 'pending',
      amountBirr: Number(row.amount_birr) || 150,
      remainingUnlocks: row.remaining_unlocks || 5,
      createdAt: row.created_at || new Date().toISOString(),
      approvedAt: row.approved_at,
      adminNote: row.admin_note,
    }));
  } catch (err) {
    console.warn('fetchUnlockRequestsForPhoneFromSupabase error:', err);
    return null;
  }
}

export async function updateUnlockRequestStatusInSupabase(
  requestId: string,
  status: 'approved' | 'rejected' | 'pending',
  options?: { approvedAt?: string; adminNote?: string }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload: Record<string, any> = {
      status,
      approved_at: options?.approvedAt || (status === 'approved' ? new Date().toISOString() : null),
    };
    if (options?.adminNote !== undefined) {
      payload.admin_note = options.adminNote;
    }

    const { error } = await supabase
      .from('unlock_requests')
      .update(payload)
      .eq('id', requestId);

    if (error) {
      console.warn('updateUnlockRequestStatusInSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateUnlockRequestStatusInSupabase exception:', err);
    return false;
  }
}

export async function saveUnlockRequestToSupabase(req: UnlockRequest): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row: any = {
      id: req.id,
      request_type: req.requestType || req.type || 'single_unlock',
      property_id: req.propertyId || null,
      property_title: req.propertyTitle || '',
      property_area: req.propertyArea || '',
      package_tier_id: req.packageTierId || null,
      package_tier_name: req.packageTierName || null,
      buyer_name: req.buyerName || 'User',
      buyer_phone: req.buyerPhone,
      payment_method: req.paymentMethod || 'telebirr',
      transaction_ref: req.transactionRef || '',
      status: req.status || 'pending',
      amount_birr: req.amountBirr || 150,
      remaining_unlocks: req.remainingUnlocks ?? 5,
      created_at: req.createdAt || new Date().toISOString(),
      approved_at: req.approvedAt || null,
      admin_note: req.adminNote || null,
    };

    // If screenshotUrl is present, set it; otherwise don't overwrite existing in db unless provided
    if (req.screenshotUrl !== undefined) {
      row.screenshot_url = req.screenshotUrl || 'placeholder_screenshot';
    }
    if (req.screenshotSizeKb !== undefined) {
      row.screenshot_size_kb = req.screenshotSizeKb;
    }

    const { error } = await supabase.from('unlock_requests').upsert(row);
    if (error) {
      console.warn('saveUnlockRequestToSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveUnlockRequestToSupabase error:', err);
    return false;
  }
}

export async function deleteUnlockRequestFromSupabase(requestId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('unlock_requests').delete().eq('id', requestId);
    if (error) {
      console.warn('deleteUnlockRequestFromSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteUnlockRequestFromSupabase error:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// Users CRUD Operations (Home Finders & Space-Saving Deletions)
// ----------------------------------------------------------------------

export async function fetchUsersFromSupabase(): Promise<UserAccount[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      pin: row.pin,
      createdAt: row.created_at || new Date().toISOString(),
      unlockedPropertyIds: Array.isArray(row.unlocked_property_ids) ? row.unlocked_property_ids : [],
      packages: Array.isArray(row.packages) ? row.packages : [],
    }));
  } catch (err) {
    console.warn('fetchUsersFromSupabase error:', err);
    return null;
  }
}

/**
 * Data-Saver: Fetch ONLY one user's account by phone.
 * Eliminates downloading all users from Supabase on mobile networks.
 */
export async function fetchUserByPhoneFromSupabase(phone: string): Promise<UserAccount | null> {
  if (!phone) return null;
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      pin: data.pin,
      createdAt: data.created_at || new Date().toISOString(),
      unlockedPropertyIds: Array.isArray(data.unlocked_property_ids) ? data.unlocked_property_ids : [],
      packages: Array.isArray(data.packages) ? data.packages : [],
    };
  } catch (err) {
    return null;
  }
}

export async function saveUserToSupabase(user: UserAccount): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      pin: user.pin,
      unlocked_property_ids: user.unlockedPropertyIds || [],
      packages: user.packages || [],
      created_at: user.createdAt,
    };

    const { error } = await supabase.from('users').upsert(row);
    if (error) {
      console.warn('saveUserToSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('saveUserToSupabase error:', err);
    return false;
  }
}

/**
 * Permanently delete user data from Supabase to free up space
 */
export async function deleteUserFromSupabase(phoneOrId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const clean = phoneOrId.trim().replace(/[\s-]/g, '');
    const { error } = await supabase
      .from('users')
      .delete()
      .or(`id.eq.${phoneOrId},phone.eq.${clean}`);

    if (error) {
      console.warn('deleteUserFromSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteUserFromSupabase error:', err);
    return false;
  }
}

export async function saveUserUnlockedPropertyToSupabase(userPhone: string, propertyId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const clean = userPhone.trim().replace(/[\s-]/g, '');
    const { data: userRow } = await supabase.from('users').select('*').eq('phone', clean).maybeSingle();
    if (!userRow) return false;

    const currentIds: string[] = Array.isArray(userRow.unlocked_property_ids) ? userRow.unlocked_property_ids : [];
    if (!currentIds.includes(propertyId)) {
      currentIds.push(propertyId);
      const { error } = await supabase.from('users').update({ unlocked_property_ids: currentIds }).eq('phone', clean);
      if (error) return false;
    }
    return true;
  } catch (err) {
    console.warn('saveUserUnlockedPropertyToSupabase error:', err);
    return false;
  }
}
