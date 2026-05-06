-- Buat ekstensi UUID jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: users
CREATE TABLE "public"."users" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "username" text NOT NULL UNIQUE,
    "pin" text NOT NULL,
    "role" text NOT NULL
);

-- 2. Table: products
CREATE TABLE "public"."products" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "category" text NOT NULL,
    "price" numeric NOT NULL,
    "stock" integer NOT NULL
);

-- 3. Table: customers
CREATE TABLE "public"."customers" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "phone" text NOT NULL,
    "total_spent" numeric NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "created_by_role" text NOT NULL
);

-- 4. Table: orders
CREATE TABLE "public"."orders" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "receipt_number" text NOT NULL,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "user_name" text NOT NULL,
    "total_amount" numeric NOT NULL,
    "discount" numeric NOT NULL,
    "items" jsonb NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "buyer_name" text,
    "buyer_phone" text,
    "customer_id" uuid REFERENCES "public"."customers"("id") ON DELETE SET NULL
);

-- Aktifkan Row Level Security (RLS) di semua tabel
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

-- Karena aplikasi menggunakan autentikasi PIN kustom (tanpa Supabase Auth standar),
-- kita perlu membuat RLS policy yang mengizinkan akses ke tabel bagi public/anon.
-- Di aplikasi production yang sesungguhnya disarankan menggunakan auth.uid() 
-- jika beralih ke Supabase Authentication.

-- Policy untuk tabel users
CREATE POLICY "Allow public select on users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON "public"."users" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON "public"."users" FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on users" ON "public"."users" FOR DELETE USING (true);

-- Policy untuk tabel products
CREATE POLICY "Allow public select on products" ON "public"."products" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON "public"."products" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON "public"."products" FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON "public"."products" FOR DELETE USING (true);

-- Policy untuk tabel customers
CREATE POLICY "Allow public select on customers" ON "public"."customers" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customers" ON "public"."customers" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customers" ON "public"."customers" FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on customers" ON "public"."customers" FOR DELETE USING (true);

-- Policy untuk tabel orders
CREATE POLICY "Allow public select on orders" ON "public"."orders" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON "public"."orders" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON "public"."orders" FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on orders" ON "public"."orders" FOR DELETE USING (true);

-- 5. Table: contact_links
CREATE TABLE "public"."contact_links" (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "icon" text NOT NULL,
    "url" text NOT NULL,
    "color" text NOT NULL,
    "order" integer NOT NULL DEFAULT 0
);

ALTER TABLE "public"."contact_links" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on contact_links" ON "public"."contact_links" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on contact_links" ON "public"."contact_links" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on contact_links" ON "public"."contact_links" FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on contact_links" ON "public"."contact_links" FOR DELETE USING (true);
