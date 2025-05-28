/**
 * Script to update Supabase storage policies
 * 
 * Run with: node scripts/update-supabase-policies.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://xqrlgqwmmmjsivzrpfsm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';

if (!supabaseAnonKey) {
  console.error('Error: SUPABASE_KEY environment variable is not set');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Using Supabase Key: ${supabaseAnonKey.substring(0, 10)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 10)}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    console.log('Updating Supabase storage policies...');
    
    // Read SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, '../sql/storage-policies.sql'), 'utf8');
    
    // Split SQL commands by semicolon
    const sqlCommands = sqlContent.split(';').filter(cmd => cmd.trim().length > 0);
    
    // Execute each SQL command
    for (const cmd of sqlCommands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: cmd });
        if (error) {
          console.error('Error executing SQL:', error);
        }
      } catch (err) {
        console.error('Error with command:', cmd);
        console.error('Error details:', err);
      }
    }
    
    // Update bucket to be public directly
    try {
      const { data, error } = await supabase
        .from('storage.buckets')
        .update({ public: true })
        .eq('id', 'documents');
        
      if (error) {
        console.error('Error updating bucket visibility:', error);
      } else {
        console.log('Successfully updated bucket visibility');
      }
    } catch (updateError) {
      console.error('Error updating bucket:', updateError);
    }
    
    console.log('Storage policies update complete');
    
    // Try to create the functions directly
    try {
      console.log('Creating make_bucket_public function...');
      await supabase.rpc('make_bucket_public', { bucket_name: 'documents' });
      console.log('Function executed successfully');
    } catch (functionError) {
      console.log('Could not run make_bucket_public function:', functionError.message);
    }
    
    try {
      console.log('Creating setup_storage_policies function...');
      await supabase.rpc('setup_storage_policies');
      console.log('Function executed successfully');
    } catch (functionError) {
      console.log('Could not run setup_storage_policies function:', functionError.message);
    }
    
  } catch (error) {
    console.error('Error updating Supabase policies:', error);
  }
}

main().catch(console.error); 