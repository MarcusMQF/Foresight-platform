-- Schema for ATS Storage Implementation

-- Table for storing job descriptions per folder
CREATE TABLE IF NOT EXISTS public.job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "userId" TEXT NOT NULL
);

-- Index for faster lookup by folder
CREATE INDEX IF NOT EXISTS idx_job_descriptions_folder_id ON public.job_descriptions(folder_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON public.job_descriptions("userId");

-- Table for storing analysis results
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  job_description_id UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievement_bonus NUMERIC(5,2) DEFAULT 0,
  aspect_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  hr_data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "userId" TEXT NOT NULL
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_analysis_results_file_id ON public.analysis_results(file_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_job_description_id ON public.analysis_results(job_description_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON public.analysis_results("userId");

-- Drop existing functions before recreating them
DROP FUNCTION IF EXISTS public.get_latest_job_description(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_analyzed_files_in_folder(UUID, TEXT);
DROP FUNCTION IF EXISTS public.store_job_description(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_folder_analysis_results(UUID, TEXT);

-- Helper function to get the latest job description for a folder
CREATE OR REPLACE FUNCTION public.get_latest_job_description(p_folder_id UUID, p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  description TEXT,
  folder_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  "userId" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT jd.id, jd.description, jd.folder_id, jd.created_at, jd."userId"
  FROM public.job_descriptions jd
  WHERE jd.folder_id = p_folder_id
  AND jd."userId" = p_user_id
  ORDER BY jd.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get all analyzed files for a folder
CREATE OR REPLACE FUNCTION public.get_analyzed_files_in_folder(p_folder_id UUID, p_user_id TEXT)
RETURNS TABLE (
  file_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ar.file_id
  FROM public.analysis_results ar
  JOIN public.job_descriptions jd ON ar.job_description_id = jd.id
  WHERE jd.folder_id = p_folder_id
  AND ar."userId" = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all analysis results for a folder
CREATE OR REPLACE FUNCTION public.get_folder_analysis_results(p_folder_id UUID, p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  job_description_id UUID,
  match_score NUMERIC(5,2),
  strengths JSONB,
  weaknesses JSONB,
  achievement_bonus NUMERIC(5,2),
  aspect_scores JSONB,
  hr_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  "userId" TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.file_id,
    ar.job_description_id,
    ar.match_score,
    ar.strengths,
    ar.weaknesses,
    ar.achievement_bonus,
    ar.aspect_scores,
    ar.hr_data,
    ar.created_at,
    ar.updated_at,
    ar."userId"
  FROM public.analysis_results ar
  JOIN public.job_descriptions jd ON ar.job_description_id = jd.id
  WHERE jd.folder_id = p_folder_id
  AND ar."userId" = p_user_id
  ORDER BY ar.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to store or update job description for a folder
CREATE OR REPLACE FUNCTION public.store_job_description(
  p_description TEXT,
  p_folder_id UUID,
  p_user_id TEXT
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Check if a job description already exists for this folder
  SELECT id INTO v_job_id
  FROM public.job_descriptions
  WHERE folder_id = p_folder_id AND "userId" = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_job_id IS NULL THEN
    -- Create new job description
    INSERT INTO public.job_descriptions (description, folder_id, "userId")
    VALUES (p_description, p_folder_id, p_user_id)
    RETURNING id INTO v_job_id;
  ELSE
    -- Update existing job description
    UPDATE public.job_descriptions
    SET description = p_description, updated_at = NOW()
    WHERE id = v_job_id;
  END IF;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for job_descriptions
CREATE POLICY job_descriptions_select_policy ON public.job_descriptions 
  FOR SELECT USING (true);

CREATE POLICY job_descriptions_insert_policy ON public.job_descriptions 
  FOR INSERT WITH CHECK (true);

CREATE POLICY job_descriptions_update_policy ON public.job_descriptions 
  FOR UPDATE USING (true);

CREATE POLICY job_descriptions_delete_policy ON public.job_descriptions 
  FOR DELETE USING (true);

-- RLS for analysis_results
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis_results
CREATE POLICY analysis_results_select_policy ON public.analysis_results 
  FOR SELECT USING (true);

CREATE POLICY analysis_results_insert_policy ON public.analysis_results 
  FOR INSERT WITH CHECK (true);

CREATE POLICY analysis_results_update_policy ON public.analysis_results 
  FOR UPDATE USING (true);

CREATE POLICY analysis_results_delete_policy ON public.analysis_results 
  FOR DELETE USING (true);

-- View for files with their analysis results (if any)
CREATE OR REPLACE VIEW public.files_with_analysis AS
SELECT 
  f.id as file_id,
  f.name as file_name,
  f."folderId" as folder_id,
  f."userId" as user_id,
  ar.id as analysis_id,
  ar.match_score,
  ar.strengths,
  ar.weaknesses,
  ar.achievement_bonus,
  ar.aspect_scores,
  ar.hr_data,
  ar.created_at as analyzed_at
FROM 
  public.files f
LEFT JOIN 
  public.analysis_results ar ON f.id = ar.file_id; 