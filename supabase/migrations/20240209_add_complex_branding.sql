-- Add logo_url column to complexes table
ALTER TABLE public.complexes 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for complex logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('complex-logos', 'complex-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage
-- Allow public read access to complex logos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'complex-logos' );

-- Allow authenticated users to upload logos (we'll restrict by folder/user later if needed, 
-- but for now allow auth users to upload as part of registration)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'complex-logos' );

-- Allow users to update their own logos
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'complex-logos' AND auth.uid() = owner );

-- Allow users to delete their own logos
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'complex-logos' AND auth.uid() = owner );
