-- Function to make a bucket public
CREATE OR REPLACE FUNCTION make_bucket_public(bucket_name TEXT)
RETURNS void AS $$
BEGIN
  -- Update the bucket to be public
  UPDATE storage.buckets
  SET public = true
  WHERE id = bucket_name;
END;
$$ LANGUAGE plpgsql;

-- Function to set up storage policies
CREATE OR REPLACE FUNCTION setup_storage_policies()
RETURNS void AS $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

  -- Create new storage policies with permissive rules
  CREATE POLICY "Allow public upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

  CREATE POLICY "Allow public select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

  CREATE POLICY "Allow public delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');
END;
$$ LANGUAGE plpgsql; 