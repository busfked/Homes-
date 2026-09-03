-- ==============================================================================
-- BET DELALA (ቤት ደላላ) SUPABASE DATABASE SCHEMA
-- Features:
--  1. Dedicated "Add Home" for Property Owners (Listing fee + 7-day auto-expiry)
--  2. Range Unlock Pricing:
--     - Up to 10,000 ETB rent   -> 150 ETB (Unlocks 5 homes in this range)
--     - Up to 25,000 ETB rent   -> 250 ETB (Unlocks 5 homes in this range)
--     - Up to 50,000 ETB rent   -> 350 ETB (Unlocks 5 homes in this range)
--     - Above 50,000 ETB / Sale -> 500 ETB (Unlocks 5 homes in this range)
--  3. Finder User Accounts with Phone & 4-digit PIN authentication
--  4. Payment Screenshot Approval & Credit Tracking
-- ==============================================================================

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Buyers / Finders)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'User',
    pin TEXT NOT NULL DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);

-- 3. PROPERTIES TABLE (Owner Listings)
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_am TEXT,
    description TEXT,
    description_am TEXT,
    price NUMERIC NOT NULL,
    price_period TEXT NOT NULL DEFAULT 'month', -- 'month' or 'total'
    listing_type TEXT NOT NULL DEFAULT 'rent',  -- 'rent' or 'sale'
    category TEXT NOT NULL DEFAULT 'apartment', -- 'apartment', 'villa', 'condominium', 'commercial'
    property_type TEXT NOT NULL DEFAULT 'residential',
    city TEXT NOT NULL DEFAULT 'Addis Ababa',
    subcity TEXT,
    area TEXT NOT NULL,
    exact_landmark TEXT,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    size_sqm NUMERIC,
    images TEXT[] NOT NULL DEFAULT '{}',
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_pin TEXT NOT NULL DEFAULT '1234',
    national_id_front_url TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_approval', 'occupied', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_owner_phone ON public.properties (owner_phone);

-- 4. USER UNLOCKED DIRECT PROPERTIES
-- Keeps record of which direct properties each user phone has unlocked
CREATE TABLE IF NOT EXISTS public.user_unlocked_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT NOT NULL,
    property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_phone, property_id)
);

CREATE INDEX IF NOT EXISTS idx_user_unlocked_phone ON public.user_unlocked_properties (user_phone);

-- 5. USER PACKAGES (5-Home Range Unlocks)
-- When user pays 150/250/350/500 ETB, they get 5 unlocks in that specific range
CREATE TABLE IF NOT EXISTS public.user_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT NOT NULL,
    tier_id TEXT NOT NULL, -- 'tier_10k', 'tier_25k', 'tier_50k', 'tier_unlimited'
    tier_name TEXT NOT NULL,
    max_price NUMERIC NOT NULL,
    remaining_unlocks INTEGER NOT NULL DEFAULT 5,
    total_purchased INTEGER NOT NULL DEFAULT 5,
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_packages_phone ON public.user_packages (user_phone);

-- 6. UNLOCK REQUESTS TABLE (Admin Verification Queue)
CREATE TABLE IF NOT EXISTS public.unlock_requests (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'single_unlock', -- 'single_unlock', 'package_purchase', 'owner_listing_fee'
    request_type TEXT NOT NULL DEFAULT 'single_unlock',
    property_id TEXT,
    property_title TEXT,
    property_area TEXT,
    package_tier_id TEXT,
    package_tier_name TEXT,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'telebirr', -- 'telebirr', 'cbe', 'boa'
    transaction_ref TEXT NOT NULL,
    screenshot_url TEXT,
    screenshot_size_kb INTEGER,
    amount_birr NUMERIC NOT NULL,
    remaining_unlocks INTEGER DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON public.unlock_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_phone ON public.unlock_requests (buyer_phone);

-- 7. PLATFORM SETTINGS & BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    telebirr_account TEXT NOT NULL DEFAULT '0911223344',
    telebirr_name TEXT NOT NULL DEFAULT 'Bet Delala Official',
    cbe_account TEXT NOT NULL DEFAULT '1000123456789',
    cbe_name TEXT NOT NULL DEFAULT 'Bet Delala Official',
    boa_account TEXT NOT NULL DEFAULT '987654321',
    boa_name TEXT NOT NULL DEFAULT 'Bet Delala Official',
    owner_listing_fee NUMERIC NOT NULL DEFAULT 150,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default payment settings if table is empty
INSERT INTO public.payment_settings (id, telebirr_account, telebirr_name, cbe_account, cbe_name, boa_account, boa_name, owner_listing_fee)
VALUES (1, '0911223344', 'Bet Delala Official', '1000123456789', 'Bet Delala Official', '987654321', 'Bet Delala Official', 150)
ON CONFLICT (id) DO NOTHING;

-- 8. REPORTED BROKERS & BANNED PHONES (Safety against unauthorized brokers)
CREATE TABLE IF NOT EXISTS public.reported_brokers (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    property_title TEXT NOT NULL,
    reported_phone TEXT NOT NULL,
    reported_by_phone TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banned_phones (
    phone TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    banned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocked_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_phones ENABLE ROW LEVEL SECURITY;

-- Allow public read of active properties (masking owner phone in app until unlocked)
CREATE POLICY "Public read active properties" ON public.properties
    FOR SELECT USING (true);

-- Allow owners to insert new properties
CREATE POLICY "Public insert properties" ON public.properties
    FOR INSERT WITH CHECK (true);

-- Allow property update (for owners with PIN or admin)
CREATE POLICY "Public update properties" ON public.properties
    FOR UPDATE USING (true);

-- Allow user authentication and account creation
CREATE POLICY "Public user operations" ON public.users
    FOR ALL USING (true);

-- Allow unlock operations
CREATE POLICY "Public unlock operations" ON public.user_unlocked_properties
    FOR ALL USING (true);

-- Allow package operations
CREATE POLICY "Public package operations" ON public.user_packages
    FOR ALL USING (true);

-- Allow unlock requests submission & reading
CREATE POLICY "Public request operations" ON public.unlock_requests
    FOR ALL USING (true);

-- Allow reading payment settings
CREATE POLICY "Public settings read" ON public.payment_settings
    FOR SELECT USING (true);

CREATE POLICY "Public settings update" ON public.payment_settings
    FOR ALL USING (true);

-- Allow broker reports
CREATE POLICY "Public broker reports" ON public.reported_brokers
    FOR ALL USING (true);

CREATE POLICY "Public banned phones read" ON public.banned_phones
    FOR ALL USING (true);

-- 10. SAFE IDEMPOTENT COLUMN ADDITIONS (Guarantees 100% app compatibility)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unlocked_property_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sub_city TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_am TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_sq_meters NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seller_listing_fee_birr NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seller_payment_screenshot_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS unlock_count INTEGER DEFAULT 0;
ALTER TABLE public.unlock_requests ADD COLUMN IF NOT EXISTS admin_note TEXT;
