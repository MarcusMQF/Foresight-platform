import { supabase } from '../lib/supabase';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export class FileValidationService {
  // Default validation options
  private defaultOptions: FileValidationOptions = {
    maxSizeInMB: 5, // 5MB default max size
    allowedTypes: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ]
  };

  /**
   * Validate a file based on size and type
   */
  validateFile(file: File, options?: FileValidationOptions): ValidationResult {
    const opts = { ...this.defaultOptions, ...options };
    
    // Check file size
    if (opts.maxSizeInMB && file.size > opts.maxSizeInMB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds the maximum limit of ${opts.maxSizeInMB}MB`
      };
    }
    
    // Check file type if allowedTypes is provided
    if (opts.allowedTypes && opts.allowedTypes.length > 0) {
      // If it's an unknown type, check by extension
      if (!file.type || file.type === 'application/octet-stream') {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'zip'];
        
        if (!extension || !validExtensions.includes(extension)) {
          return {
            valid: false,
            error: 'File type not allowed. Please upload a supported file type.'
          };
        }
      } 
      // Otherwise check by MIME type
      else if (!opts.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: 'File type not allowed. Please upload a supported file type.'
        };
      }
    }
    
    return { valid: true };
  }

  /**
   * Check if a file with the same name already exists in the folder
   */
  async checkForDuplicateFileName(fileName: string, folderId: string): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id')
        .eq('folderId', folderId)
        .eq('name', fileName)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        throw error;
      }
      
      if (data) {
        return {
          valid: false,
          error: `A file with the name "${fileName}" already exists in this folder.`
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error checking for duplicate file name:', error);
      // Don't block upload on error checking for duplicates
      return { valid: true };
    }
  }

  /**
   * Check if a file with similar content already exists in the folder
   * This is a simplified implementation that compares file size and name (minus extension)
   * For a more accurate content-based duplicate detection, you would need to implement
   * file fingerprinting or hashing, which is beyond the scope of this example
   */
  async checkForSimilarContent(file: File, folderId: string): Promise<ValidationResult> {
    try {
      // Get the file name without extension
      const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
      
      // Get all files in the folder
      const { data, error } = await supabase
        .from('files')
        .select('name, size')
        .eq('folderId', folderId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Look for files with similar size (within 5% difference) and similar name
        const similarFiles = data.filter(existingFile => {
          // Get existing file name without extension
          const existingNameWithoutExt = existingFile.name.split('.').slice(0, -1).join('.');
          
          // Check if sizes are within 5% of each other
          const sizeDifference = Math.abs(existingFile.size - file.size) / Math.max(existingFile.size, file.size);
          
          // Check for name similarity (basic implementation)
          const nameSimilarity = this.calculateNameSimilarity(nameWithoutExtension, existingNameWithoutExt);
          
          return sizeDifference < 0.05 && nameSimilarity > 0.7;
        });
        
        if (similarFiles.length > 0) {
          return {
            valid: false,
            error: `This file appears to be similar to "${similarFiles[0].name}" already in this folder.`
          };
        }
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error checking for similar content:', error);
      // Don't block upload on error checking for similar content
      return { valid: true };
    }
  }
  
  /**
   * Calculate similarity between two strings (simple implementation)
   * Returns a value between 0 (completely different) and 1 (identical)
   */
  private calculateNameSimilarity(str1: string, str2: string): number {
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // If either string is empty, return 0
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // If strings are identical, return 1
    if (s1 === s2) return 1;
    
    // Simple implementation: check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const longerLength = Math.max(s1.length, s2.length);
      const shorterLength = Math.min(s1.length, s2.length);
      return shorterLength / longerLength;
    }
    
    // Otherwise return a low similarity
    return 0.1;
  }
} 