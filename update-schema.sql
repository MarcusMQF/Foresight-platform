-- Step 1: Update existing analysis_results table to add the new columns
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS hr_data JSONB DEFAULT NULL;
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS candidate_info JSONB DEFAULT NULL;

-- Step 2: Update the files_with_analysis view (drop first, then recreate)
DROP VIEW IF EXISTS public.files_with_analysis;

CREATE VIEW public.files_with_analysis AS
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
  ar.candidate_info,
  ar.created_at as analyzed_at
FROM 
  public.files f
LEFT JOIN 
  public.analysis_results ar ON f.id = ar.file_id;

-- Step 3: Only if previous steps succeed, update the function
-- First check if function exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'get_folder_analysis_results'
  ) THEN
    DROP FUNCTION public.get_folder_analysis_results(UUID, TEXT);
  END IF;
END $$;

-- Recreate the function with hr_data and candidate_info included
CREATE FUNCTION public.get_folder_analysis_results(p_folder_id UUID, p_user_id TEXT)
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
  candidate_info JSONB,
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
    ar.candidate_info,
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