-- Feature Upgrades for VMS MVP

-- 1. Alter Visitors Table
ALTER TABLE public.visitors 
ADD COLUMN company TEXT,
ADD COLUMN nda_signed BOOLEAN DEFAULT false,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- 2. Create Storage Bucket for Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Anyone can view public logos
CREATE POLICY "Public Logo Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

-- Storage Policy: Admin can insert/update logos
CREATE POLICY "Admin Logo Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin Logo Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin Logo Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-logos'
    AND auth.role() = 'authenticated'
  );
