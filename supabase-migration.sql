-- Migration for Inkto V2

-- 1. Create or update the users table to handle plans and subscription
CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    subscription_status TEXT DEFAULT 'free',
    plan_expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Add 'email' column to the 'documents' table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='documents' AND column_name='email') THEN
        ALTER TABLE public.documents ADD COLUMN email TEXT;
        -- Create an index on email for faster lookups in history
        CREATE INDEX idx_documents_email ON public.documents(email);
    END IF;
END $$;

-- 3. Create or update auth_tokens table for OTP login
CREATE TABLE IF NOT EXISTS public.auth_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    type TEXT,
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Optional: Clean up old magic-link tokens or handle legacy
-- ALTER TABLE public.auth_tokens ADD COLUMN IF NOT EXISTS type TEXT;

-- Create an index for faster auth lookups
CREATE INDEX IF NOT EXISTS idx_auth_tokens_email ON public.auth_tokens(email);
