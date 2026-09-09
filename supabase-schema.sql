-- ==============================================================================
-- BET DELALA (ቤት ደላላ) SUPABASE DATABASE SCHEMA (100% IDEMPOTENT & RERUN-SAFE)
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

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Buyers / Finders)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'User',
    pin TEXT NOT NULL DEFAULT '1234',
    unlocked_property_ids JSONB DEFAULT '[]'::jsonb,
    packages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);

-- 3. PROPERTIES TABLE (Owner Listings)
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY,
    category TEXT DEFAULT 'home',
    title TEXT NOT NULL,
    title_am TEXT,
    description TEXT,
    description_am TEXT,
    price NUMERIC NOT NULL,
    price_period TEXT NOT NULL DEFAULT 'month',
    listing_type TEXT NOT NULL DEFAULT 'rent',
    category_type TEXT DEFAULT 'apartment',
    property_type TEXT DEFAULT 'residential',
    city TEXT NOT NULL DEFAULT 'Addis Ababa',
    sub_city TEXT DEFAULT 'Addis Ababa',
    subcity TEXT,
    area TEXT NOT NULL,
    area_am TEXT,
    exact_landmark TEXT,
    bedrooms INTEGER NOT NULL DEFAULT 1,
    bathrooms INTEGER NOT NULL DEFAULT 1,
    size_sqm NUMERIC,
    area_sq_meters NUMERIC,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_pin TEXT NOT NULL DEFAULT '1234',
    national_id_front_url TEXT,
    seller_listing_fee_birr NUMERIC,
    seller_payment_screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    last_renewed_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    unlock_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_owner_phone ON public.properties (owner_phone);

-- 4. USER UNLOCKED DIRECT PROPERTIES
CREATE TABLE IF NOT EXISTS public.user_unlocked_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT NOT NULL,
    property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_phone, property_id)
);

CREATE INDEX IF NOT EXISTS idx_user_unlocked_phone ON public.user_unlocked_properties (user_phone);

-- 5. USER PACKAGES (5-Home Range Unlocks)
CREATE TABLE IF NOT EXISTS public.user_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT NOT NULL,
    tier_id TEXT NOT NULL,
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
    type TEXT NOT NULL DEFAULT 'single_unlock',
    request_type TEXT NOT NULL DEFAULT 'single_unlock',
    property_id TEXT,
    property_title TEXT,
    property_area TEXT,
    package_tier_id TEXT,
    package_tier_name TEXT,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'telebirr',
    transaction_ref TEXT,
    screenshot_url TEXT NOT NULL,
    screenshot_size_kb NUMERIC,
    amount_birr NUMERIC NOT NULL DEFAULT 150,
    remaining_unlocks INTEGER DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON public.unlock_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_phone ON public.unlock_requests (buyer_phone);

-- 7. PLATFORM SETTINGS & BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    telebirr_account TEXT NOT NULL DEFAULT '0991154337',
    telebirr_name TEXT NOT NULL DEFAULT 'BetDelala (0991154337)',
    cbe_account TEXT NOT NULL DEFAULT '1000131638128',
    cbe_name TEXT NOT NULL DEFAULT 'BetDelala (CBE)',
    boa_account TEXT NOT NULL DEFAULT '61648817',
    boa_name TEXT NOT NULL DEFAULT 'BetDelala (Abyssinia)',
    owner_listing_fee NUMERIC NOT NULL DEFAULT 150,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

INSERT INTO public.payment_settings (id, telebirr_account, telebirr_name, cbe_account, cbe_name, boa_account, boa_name, owner_listing_fee)
VALUES (1, '0991154337', 'BetDelala (0991154337)', '1000131638128', 'BetDelala (CBE)', '61648817', 'BetDelala (Abyssinia)', 150)
ON CONFLICT (id) DO NOTHING;

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

-- 8. REPORTED BROKERS & BANNED PHONES
CREATE TABLE IF NOT EXISTS public.reported_brokers (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    property_title TEXT,
    reported_phone TEXT NOT NULL,
    reporter_phone TEXT NOT NULL,
    reporter_role TEXT DEFAULT 'finder',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banned_phones (
    phone TEXT PRIMARY KEY,
    reason TEXT,
    banned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CUSTOMER REVIEWS & STAR RATINGS
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    user_role TEXT NOT NULL DEFAULT 'renter_buyer',
    phone TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews (rating DESC);

-- 10. SAFE IDEMPOTENT COLUMN ADDITIONS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unlocked_property_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sub_city TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS subcity TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_am TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS area_sq_meters NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seller_listing_fee_birr NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seller_payment_screenshot_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS unlock_count INTEGER DEFAULT 0;

ALTER TABLE public.unlock_requests ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE public.unlock_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES (DROP IF EXISTS THEN CREATE)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocked_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reported_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Properties Policies
DROP POLICY IF EXISTS "Public read active properties" ON public.properties;
DROP POLICY IF EXISTS "Public Read Properties" ON public.properties;
DROP POLICY IF EXISTS "Public insert properties" ON public.properties;
DROP POLICY IF EXISTS "Public Insert Properties" ON public.properties;
DROP POLICY IF EXISTS "Public update properties" ON public.properties;
DROP POLICY IF EXISTS "Public Update Properties" ON public.properties;
DROP POLICY IF EXISTS "Public delete properties" ON public.properties;
DROP POLICY IF EXISTS "Public Delete Properties" ON public.properties;
CREATE POLICY "Public Read Properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Public Insert Properties" ON public.properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Properties" ON public.properties FOR UPDATE USING (true);
CREATE POLICY "Public Delete Properties" ON public.properties FOR DELETE USING (true);

-- Unlock Requests Policies
DROP POLICY IF EXISTS "Public request operations" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Read Unlock Requests" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Insert Unlock Requests" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Update Unlock Requests" ON public.unlock_requests;
DROP POLICY IF EXISTS "Public Delete Unlock Requests" ON public.unlock_requests;
CREATE POLICY "Public Read Unlock Requests" ON public.unlock_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Unlock Requests" ON public.unlock_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Unlock Requests" ON public.unlock_requests FOR UPDATE USING (true);
CREATE POLICY "Public Delete Unlock Requests" ON public.unlock_requests FOR DELETE USING (true);

-- Users Policies
DROP POLICY IF EXISTS "Public user operations" ON public.users;
DROP POLICY IF EXISTS "Public Read Users" ON public.users;
DROP POLICY IF EXISTS "Public Insert Users" ON public.users;
DROP POLICY IF EXISTS "Public Update Users" ON public.users;
DROP POLICY IF EXISTS "Public Delete Users" ON public.users;
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Insert Users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Public Delete Users" ON public.users FOR DELETE USING (true);

-- Other tables policies
DROP POLICY IF EXISTS "Public unlock operations" ON public.user_unlocked_properties;
CREATE POLICY "Public unlock operations" ON public.user_unlocked_properties FOR ALL USING (true);

DROP POLICY IF EXISTS "Public package operations" ON public.user_packages;
CREATE POLICY "Public package operations" ON public.user_packages FOR ALL USING (true);

DROP POLICY IF EXISTS "Public settings read" ON public.payment_settings;
DROP POLICY IF EXISTS "Public settings update" ON public.payment_settings;
DROP POLICY IF EXISTS "Public payment settings operations" ON public.payment_settings;
CREATE POLICY "Public payment settings operations" ON public.payment_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Settings Operations" ON public.settings;
CREATE POLICY "Public Settings Operations" ON public.settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public broker reports" ON public.reported_brokers;
CREATE POLICY "Public broker reports" ON public.reported_brokers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public banned phones read" ON public.banned_phones;
CREATE POLICY "Public banned phones read" ON public.banned_phones FOR ALL USING (true);

-- Reviews Policies
DROP POLICY IF EXISTS "Public reviews are readable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
DROP POLICY IF EXISTS "Allow update for moderation" ON public.reviews;
DROP POLICY IF EXISTS "Allow deletion of reviews" ON public.reviews;
CREATE POLICY "Public reviews are readable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for moderation" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Allow deletion of reviews" ON public.reviews FOR DELETE USING (true);

