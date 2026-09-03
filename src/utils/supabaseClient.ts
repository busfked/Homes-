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

    return data.map((row: any) => ({
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
    }));
  } catch (err) {
    console.warn('Supabase fetch properties exception:', err);
    return null;
  }
}

export async function savePropertyToSupabase(prop: Property): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row = {
      id: prop.id,
      category: prop.category || 'home',
      title: prop.title,
      title_am: prop.titleAm,
      description: prop.description,
      description_am: prop.descriptionAm,
      area: prop.area,
      area_am: prop.areaAm,
      sub_city: prop.subCity,
      exact_landmark: prop.exactLandmark,
      property_type: prop.propertyType,
      listing_type: prop.listingType,
      price: prop.price,
      price_period: prop.pricePeriod,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area_sq_meters: prop.areaSqMeters,
      images: (prop.images || []).map((img: any) => (typeof img === 'string' ? img : img.url)),
      national_id_front_url: prop.nationalIdFrontUrl,
      owner_phone: prop.ownerPhone,
      owner_name: prop.ownerName,
      owner_pin: prop.ownerPin,
      seller_listing_fee_birr: prop.sellerListingFeeBirr,
      seller_payment_screenshot_url: prop.sellerPaymentScreenshotUrl,
      status: prop.status,
      created_at: prop.createdAt,
      expires_at: prop.expiresAt,
      last_renewed_at: prop.lastRenewedAt,
      view_count: prop.viewCount || 0,
      unlock_count: prop.unlockCount || 0,
    };

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

// ----------------------------------------------------------------------
// Unlock Requests CRUD Operations
// ----------------------------------------------------------------------

export async function fetchUnlockRequestsFromSupabase(): Promise<UnlockRequest[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('unlock_requests')
      .select('*')
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
      screenshotUrl: row.screenshot_url,
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

export async function saveUnlockRequestToSupabase(req: UnlockRequest): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row = {
      id: req.id,
      request_type: req.requestType || req.type || 'single_unlock',
      property_id: req.propertyId || null,
      property_title: req.propertyTitle || '',
      property_area: req.propertyArea || '',
      package_tier_id: req.packageTierId || null,
      package_tier_name: req.packageTierName || null,
      buyer_name: req.buyerName,
      buyer_phone: req.buyerPhone,
      payment_method: req.paymentMethod,
      transaction_ref: req.transactionRef,
      screenshot_url: req.screenshotUrl,
      screenshot_size_kb: req.screenshotSizeKb,
      status: req.status,
      amount_birr: req.amountBirr,
      remaining_unlocks: req.remainingUnlocks || 5,
      created_at: req.createdAt,
      approved_at: req.approvedAt || null,
      admin_note: req.adminNote || null,
    };

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
