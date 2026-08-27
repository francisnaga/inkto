-- ==============================================================================
-- INKTO — SUPABASE ROW LEVEL SECURITY (RLS) & SCHEMA SETUP
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Ensure required columns exist on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for `users` Table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
  OR auth.uid()::text = id::text
);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email')
  OR auth.uid()::text = id::text
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (
  email = (auth.jwt() ->> 'email')
  OR auth.uid()::text = id::text
);

-- Allow service role full access (bypasses RLS by default, but explicit for clarity)
DROP POLICY IF EXISTS "Service role has full access to users" ON users;
CREATE POLICY "Service role has full access to users"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. RLS Policies for `documents` Table
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
WITH CHECK (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents"
ON documents FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
USING (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Service role has full access to documents" ON documents;
CREATE POLICY "Service role has full access to documents"
ON documents FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. RLS Policies for `user_templates` Table
DROP POLICY IF EXISTS "Users can view their own templates" ON user_templates;
CREATE POLICY "Users can view their own templates"
ON user_templates FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Users can insert their own templates" ON user_templates;
CREATE POLICY "Users can insert their own templates"
ON user_templates FOR INSERT
WITH CHECK (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Users can delete their own templates" ON user_templates;
CREATE POLICY "Users can delete their own templates"
ON user_templates FOR DELETE
USING (
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Service role has full access to user_templates" ON user_templates;
CREATE POLICY "Service role has full access to user_templates"
ON user_templates FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Storage Bucket setup for Scans (`inkto-images`)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inkto-images', 'inkto-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view scan images" ON storage.objects;
CREATE POLICY "Public can view scan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'inkto-images');

DROP POLICY IF EXISTS "Users can upload scan images" ON storage.objects;
CREATE POLICY "Users can upload scan images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inkto-images');

DROP POLICY IF EXISTS "Users can delete scan images" ON storage.objects;
CREATE POLICY "Users can delete scan images"
ON storage.objects FOR DELETE
USING (bucket_id = 'inkto-images');
