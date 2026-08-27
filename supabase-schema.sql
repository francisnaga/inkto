-- CamScanner-grade Document Scanner SQL Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Scanned Document',
    total_pages INT NOT NULL DEFAULT 1,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.document_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    image_url TEXT NOT NULL,
    filter_applied TEXT DEFAULT 'magic_color',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for document_pages
CREATE POLICY "Users can view pages of their documents"
    ON public.document_pages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can insert pages to their documents"
    ON public.document_pages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can update pages of their documents"
    ON public.document_pages FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can delete pages of their documents"
    ON public.document_pages FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

-- Set up storage bucket
insert into storage.buckets (id, name, public)
values ('scanned-docs', 'scanned-docs', false)
on conflict (id) do nothing;

-- Storage policies
CREATE POLICY "Users can upload scanned docs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'scanned-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their scanned docs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'scanned-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their scanned docs"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'scanned-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their scanned docs"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'scanned-docs' AND (auth.uid())::text = (storage.foldername(name))[1]);
