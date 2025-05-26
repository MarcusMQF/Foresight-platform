# Update Supabase Schema for HR Data Storage

Follow these steps to update your Supabase database schema to support HR data storage:

1. Log in to your Supabase dashboard at https://app.supabase.io/
2. Select your project
3. Navigate to the "SQL Editor" tab in the left sidebar
4. Create a new query by clicking the "New Query" button
5. Copy and paste the following SQL code into the editor:

```sql
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
```

6. Click the "Run" button to execute the SQL
7. Verify the changes by checking the Table Editor for the `analysis_results` table to confirm the new `hr_data` and `candidate_info` columns exist

## Restart your application

After applying these schema changes, you should:

1. Restart your backend server if running locally
2. Reload your frontend application to ensure it picks up the changes

Your application should now be able to store and retrieve both HR data and candidate information in the database.