CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.file_uploads TO anon;
GRANT SELECT, INSERT ON public.file_uploads TO authenticated;
GRANT ALL ON public.file_uploads TO service_role;

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view file metadata"
  ON public.file_uploads FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can add file metadata"
  ON public.file_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read apa-files objects"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'apa-files');

CREATE POLICY "Anyone can upload apa-files objects"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'apa-files');