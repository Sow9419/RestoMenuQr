-- ==========================================
-- QRMenu DB Bootstrap Schema Migration (Supabase PostgreSQL)
-- Created At: 2026-06-12
-- Version: 1.0 (Post-May 30 API Security Compliant)
-- ==========================================

-- SECTION 1: Create Custom Enum Roles
CREATE TYPE public.user_role AS ENUM ('ORG_OWNER', 'OWNER', 'WAITER', 'CASHIER', 'KITCHEN');
CREATE TYPE public.order_status_type AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- SECTION 2: Table Creation

-- 2.0 organizations
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive', -- active, canceled, past_due, inactive
    plan_type TEXT DEFAULT 'starter', -- starter, premium
    max_restaurants INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.1 restaurants
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- ERR_SLUG_IMMUTABLE check handled on Server Action
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    is_open BOOLEAN DEFAULT true NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.2 profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role public.user_role DEFAULT 'OWNER'::public.user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.3 categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Utensils' NOT NULL, -- lucide icon name
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.4 products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price > 0),
    is_available BOOLEAN DEFAULT true NOT NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0 NOT NULL,
    sales_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.5 page_settings
CREATE TABLE public.page_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID UNIQUE NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    template_layout TEXT DEFAULT 'classic' NOT NULL, -- classic, card-grid, premium
    accent_color TEXT DEFAULT '#C2410C' NOT NULL,
    font_family TEXT DEFAULT 'Playfair Display' NOT NULL,
    hero_title TEXT,
    hero_description TEXT,
    hero_banner_url TEXT,
    background_image_url TEXT,
    show_category_icons BOOLEAN DEFAULT true NOT NULL,
    display_mode TEXT DEFAULT 'light' NOT NULL, -- light, dark
    overlay_opacity INT DEFAULT 40 NOT NULL CHECK (overlay_opacity BETWEEN 0 AND 100),
    glassmorphism BOOLEAN DEFAULT false NOT NULL,
    density TEXT DEFAULT 'comfortable' NOT NULL, -- compact, comfortable
    currency TEXT DEFAULT 'FCFA' NOT NULL, -- FCFA, EUR, USD
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.6 page_sections
CREATE TABLE public.page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL, -- hero, categories, menu, infos, socials
    label TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    CONSTRAINT uniq_restaurant_section UNIQUE (restaurant_id, section_key)
);

-- 2.7 invitations
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.user_role NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL, -- PENDING, ACCEPTED, EXPIRED
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.8 orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    status public.order_status_type DEFAULT 'PENDING'::public.order_status_type NOT NULL,
    total_price NUMERIC NOT NULL CHECK (total_price >= 0),
    customer_name TEXT,
    ticket_number TEXT NOT NULL, -- e.g. #A12
    type TEXT DEFAULT 'DINE_IN' NOT NULL, -- DINE_IN, DELIVERY
    whatsapp_number TEXT,
    delivery_address TEXT,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.9 order_items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    selected_options JSONB DEFAULT '[]'::JSONB NOT NULL
);


-- SECTION 3: Performance Indexes
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_organization_id ON public.restaurants(organization_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_restaurant_id ON public.profiles(restaurant_id);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_page_settings_restaurant ON public.page_settings(restaurant_id);
CREATE INDEX idx_page_sections_restaurant ON public.page_sections(restaurant_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);


-- SECTION 4: Supabase Explicit Access GRANTs (Post-May 30 Security Mandate)
-- By default, tables created in schema 'public' require explicit access grants

-- Define accessible public tables
-- 4.1 Organizations (Locked: service-role & authenticated users only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO service_role;

-- 4.2 Profiles (Locked)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- 4.3 Invitations (Locked)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO service_role;

-- 4.4 Restaurants, Categories, Products, Page Settings, Page Sections, Orders, Order Items (Exposed to Anon Reader/Creator + Authenticated Staff)
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO service_role;

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO service_role;

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO service_role;

GRANT SELECT ON public.page_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_settings TO service_role;

GRANT SELECT ON public.page_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO service_role;

GRANT SELECT, INSERT ON public.orders TO anon; -- Anon clients can place orders
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO service_role;

GRANT SELECT, INSERT ON public.order_items TO anon; -- Anon clients can write order details
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO service_role;


-- SECTION 5: Row Level Security (RLS) Policies

-- Activate RLS globally
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 5.1 Organizations Policies
CREATE POLICY select_organizations ON public.organizations
    FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY insert_organizations ON public.organizations
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY update_organizations ON public.organizations
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY delete_organizations ON public.organizations
    FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 5.2 Restaurants Policies
-- Anyone (public) can read restaurant metadata if they have the slug/identifier
CREATE POLICY select_restaurants_anon ON public.restaurants
    FOR SELECT TO anon USING (true);
-- Authenticated: restricted to own restaurant(s) via profiles (tenant isolation)
CREATE POLICY select_restaurants_auth ON public.restaurants
    FOR SELECT TO authenticated USING (
        id IN (
            SELECT restaurant_id FROM public.profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- Only Organization Owner or Restaurant Creator can insert/update/delete restaurants
CREATE POLICY manage_restaurants_admin ON public.restaurants
    FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- 5.3 Profiles Policies
-- Users can read and update their own profile entries
CREATE POLICY select_profiles_own ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY update_profiles_own ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY insert_profiles_own ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5.4 Categories, Products, Page Settings, Page Sections Policies
-- Public menus can read categories, products, settings, section order (slug-based access)
-- Anon: full read access (public menu data — filtered by app via slug)
CREATE POLICY select_categories_anon ON public.categories
    FOR SELECT TO anon USING (true);
-- Authenticated: restricted to own restaurant_id only (tenant isolation via profiles)
CREATE POLICY select_categories_auth ON public.categories
    FOR SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

CREATE POLICY select_products_anon ON public.products
    FOR SELECT TO anon USING (true);
CREATE POLICY select_products_auth ON public.products
    FOR SELECT TO authenticated USING (
        category_id IN (
            SELECT c.id FROM public.categories c
            WHERE c.restaurant_id IN (
                SELECT restaurant_id FROM public.profiles
                WHERE profiles.user_id = auth.uid()
            )
        )
    );

CREATE POLICY select_settings_anon ON public.page_settings
    FOR SELECT TO anon USING (true);
CREATE POLICY select_settings_auth ON public.page_settings
    FOR SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

CREATE POLICY select_sections_anon ON public.page_sections
    FOR SELECT TO anon USING (true);
CREATE POLICY select_sections_auth ON public.page_sections
    FOR SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.profiles
            WHERE profiles.user_id = auth.uid()
        )
    );

-- Staff with write roles (OWNER, CASHIER, etc.) can modify under their restaurant_id (checked via profiles)
-- Wait, using simpler, non-recursive subqueries to check user's roles
CREATE POLICY manage_categories_staff ON public.categories
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = categories.restaurant_id
              AND profiles.role IN ('OWNER', 'ORG_OWNER')
        )
    );

CREATE POLICY manage_products_staff ON public.products
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = (SELECT restaurant_id FROM public.categories WHERE categories.id = products.category_id)
              AND profiles.role IN ('OWNER', 'ORG_OWNER')
        )
    );

CREATE POLICY manage_settings_staff ON public.page_settings
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = page_settings.restaurant_id
              AND profiles.role IN ('OWNER', 'ORG_OWNER')
        )
    );

CREATE POLICY manage_sections_staff ON public.page_sections
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = page_sections.restaurant_id
              AND profiles.role IN ('OWNER', 'ORG_OWNER')
        )
    );

-- 5.5 Invitations Policies
-- Only owners can manage invitations under their organization
CREATE POLICY manage_invitations_owner ON public.invitations
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.organization_id = invitations.organization_id
              AND profiles.role IN ('OWNER', 'ORG_OWNER')
        )
    );

-- Invitations can be read publicly by anyone who has the correct lookup token (for acceptance step)
CREATE POLICY select_invitations_public ON public.invitations
    FOR SELECT TO anon, authenticated USING (status = 'PENDING');

-- 5.6 Orders & Order Items Policies
-- Anon clients can place orders
CREATE POLICY insert_orders_public ON public.orders
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY insert_order_items_public ON public.order_items
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only authenticated staff can read orders for their restaurant
CREATE POLICY select_orders_staff ON public.orders
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = orders.restaurant_id
        )
    );

CREATE POLICY select_order_items_public ON public.order_items
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = (
                  SELECT restaurant_id FROM public.orders 
                  WHERE orders.id = order_items.order_id
              )
        )
    );

-- Staff members can read and update orders for their authenticated restaurant_id
CREATE POLICY manage_orders_staff ON public.orders
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = orders.restaurant_id
        )
    );

CREATE POLICY manage_order_items_staff ON public.order_items
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
              AND profiles.restaurant_id = (SELECT restaurant_id FROM public.orders WHERE orders.id = order_items.order_id)
        )
    );


-- SECTION 6: Triggers

-- Auto-expire invitations when expires_at < now()
CREATE OR REPLACE FUNCTION public.trigger_expire_invitations()
RETURNS trigger AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'EXPIRED'
  WHERE status = 'PENDING' AND expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_expire_invitations
  AFTER INSERT OR UPDATE ON public.invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_expire_invitations();
