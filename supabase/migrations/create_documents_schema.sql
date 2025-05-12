-- Create folders table
CREATE OR REPLACE FUNCTION public.create_folders_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'folders') THEN
    CREATE TABLE public.folders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      files INTEGER DEFAULT 0,
      "userId" TEXT NOT NULL
    );

    -- Add RLS policies
    ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

    -- Policy for selecting records
    CREATE POLICY select_folders ON public.folders FOR SELECT USING (true);

    -- Policy for inserting records
    CREATE POLICY insert_folders ON public.folders FOR INSERT WITH CHECK (true);

    -- Policy for updating records
    CREATE POLICY update_folders ON public.folders FOR UPDATE USING (true);

    -- Policy for deleting records
    CREATE POLICY delete_folders ON public.folders FOR DELETE USING (true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create files table
CREATE OR REPLACE FUNCTION public.create_files_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'files') THEN
    CREATE TABLE public.files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      "folderId" UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
      size INTEGER NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "userId" TEXT NOT NULL
    );

    -- Add RLS policies
    ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

    -- Policy for selecting records
    CREATE POLICY select_files ON public.files FOR SELECT USING (true);

    -- Policy for inserting records
    CREATE POLICY insert_files ON public.files FOR INSERT WITH CHECK (true);

    -- Policy for updating records
    CREATE POLICY update_files ON public.files FOR UPDATE USING (true);

    -- Policy for deleting records
    CREATE POLICY delete_files ON public.files FOR DELETE USING (true);
    
    -- Create indexes
    CREATE INDEX files_folder_id_idx ON public.files("folderId");
    CREATE INDEX files_user_id_idx ON public.files("userId");
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create procedures for folder file count management
CREATE OR REPLACE FUNCTION public.create_folder_procedures()
RETURNS void AS $$
BEGIN
  -- Function to increment folder file count
  CREATE OR REPLACE FUNCTION public.increment_folder_file_count(folder_id UUID)
  RETURNS void AS $$
  BEGIN
    UPDATE public.folders
    SET files = files + 1
    WHERE id = folder_id;
  END;
  $$ LANGUAGE plpgsql;

  -- Function to decrement folder file count
  CREATE OR REPLACE FUNCTION public.decrement_folder_file_count(folder_id UUID)
  RETURNS void AS $$
  BEGIN
    UPDATE public.folders
    SET files = GREATEST(0, files - 1)
    WHERE id = folder_id;
  END;
  $$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql; 