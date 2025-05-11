import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqrlgqwmmmjsivzrpfsm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcmxncXdtbW1qc2l2enJwZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5Njg3NDIsImV4cCI6MjA2MjU0NDc0Mn0.rpnp4cQHshlrvk8NaHhDCXmg-zW9EXdqorM_63QC_Ms';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
  public: {
    Tables: {
      resumes: {
        Row: {
          id: string;
          user_id: string;
          original_file_name: string;
          file_url: string;
          file_type: string;
          uploaded_at: string;
          parsed_data: any;
          status: 'pending' | 'parsed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resumes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['resumes']['Insert']>;
      };
    };
  };
}; 