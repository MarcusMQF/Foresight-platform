import os
import logging
import json
import re
import uuid
from typing import Dict, List, Any, Optional, Tuple
from supabase import create_client, Client
from uuid import uuid4
from datetime import datetime

# Environment loading
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded environment variables from .env file")
except Exception as e:
    print(f"Warning: Could not load .env file: {str(e)}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SupabaseStorageService:
    """Service for storing and retrieving data from Supabase"""
    
    def __init__(self):
        """Initialize the Supabase client"""
        # Get Supabase URL and key from environment variables
        self.supabase_url = os.getenv("SUPABASE_URL", "https://xqrlgqwmmmjsivzrpfsm.supabase.co")
        self.supabase_key = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcmxncXdtbW1qc2l2enJwZnNtIiwicm9sZSI6ImFub24iLCJpYVQiOjE3NDY5Njg3NDIsImV4cCI6MjA2MjU0NDc0Mn0.rpnp4cQHshlrvk8NaHhDCXmg-zW9EXdqorM_63QC_Ms")
        
        # Print credentials for debugging (only show masked key)
        print(f"Supabase URL: {self.supabase_url}")
        if self.supabase_key:
            masked_key = self.supabase_key[:5] + "..." + self.supabase_key[-5:] if len(self.supabase_key) > 10 else "***masked***"
            print(f"Supabase Key: {masked_key}")
        else:
            print("Supabase Key: Not set")
        
        self.supabase_client = None
        self._use_mock = False  # Default to not using mock
        
        if not self.supabase_url or not self.supabase_key:
            logger.warning('Supabase URL or key not found or empty')
            logger.warning('Using mock storage implementation instead')
            self._use_mock = True
        else:
            try:
                print("Attempting to create Supabase client...")
                self.supabase_client = create_client(self.supabase_url, self.supabase_key)
                print("Supabase client successfully created!")
                logger.info('Supabase client initialized successfully')
            except Exception as e:
                print(f"ERROR creating Supabase client: {str(e)}")
                logger.error(f'Error initializing Supabase client: {str(e)}')
                logger.error(f'Exception type: {type(e).__name__}')
                logger.warning('Using mock storage implementation instead')
                self._use_mock = True
        
        print(f"Using mock implementation: {self._use_mock}")
    
    async def store_job_description(self, job_description: str, folder_id: str, user_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Store job description in Supabase
        
        Args:
            job_description: Job description text
            folder_id: Folder ID for organization
            user_id: User ID for ownership
            
        Returns:
            Tuple of (success, message, data)
        """
        logger.info(f'Storing job description for folder: {folder_id}')
        
        try:
            if self._use_mock:
                logger.info('Using mock implementation for storing job description')
                # Generate a mock ID
                job_id = str(uuid4())
                return True, "Job description stored successfully (mock)", {"id": job_id}
            
            # First check if a job description already exists for this folder
            job_desc_query = self.supabase_client.table('job_descriptions').select('*').eq('folder_id', folder_id).execute()
            
            if job_desc_query.data and len(job_desc_query.data) > 0:
                # Update existing job description
                job_id = job_desc_query.data[0]['id']
                update_result = self.supabase_client.table('job_descriptions').update({
                    'description': job_description,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', job_id).execute()
                
                return True, "Job description updated successfully", {"id": job_id}
            else:
                # Create new job description
                job_desc = {
                    'id': str(uuid4()),
                    'folder_id': folder_id,
                    'user_id': user_id,
                    'description': job_description,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                insert_result = self.supabase_client.table('job_descriptions').insert(job_desc).execute()
                
                return True, "Job description created successfully", job_desc
                
        except Exception as e:
            logger.error(f'Error storing job description: {str(e)}')
            return False, f"Error storing job description: {str(e)}", None
    
    async def store_analysis_result(self, 
                                  file_id: str, 
                                  job_description_id: str,
                                  folder_id: str,
                                  user_id: str,
                                  analysis_result: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Store analysis result in Supabase
        
        Args:
            file_id: File ID or filename
            job_description_id: Job description ID
            folder_id: Folder ID for organization
            user_id: User ID for ownership
            analysis_result: Analysis result data
            
        Returns:
            Tuple of (success, message, data)
        """
        logger.info(f'Storing analysis result for file: {file_id}')
        
        try:
            if self._use_mock:
                logger.info('Using mock implementation for storing analysis result')
                # Generate a mock ID
                result_id = str(uuid4())
                return True, "Analysis result stored successfully (mock)", {"id": result_id}
            
            # Prepare analysis result data
            result_data = {
                'id': str(uuid4()),
                'file_id': file_id,
                'job_description_id': job_description_id,
                'folder_id': folder_id,
                'user_id': user_id,
                'score': analysis_result.get('score', 0),
                'metadata': json.dumps(analysis_result.get('metadata', {})),
                'matched_keywords': json.dumps(analysis_result.get('matchedKeywords', [])),
                'missing_keywords': json.dumps(analysis_result.get('missingKeywords', [])),
                'aspect_scores': json.dumps(analysis_result.get('aspectScores', {})),
                'achievement_bonus': analysis_result.get('achievementBonus', 0),
                'recommendations': json.dumps(analysis_result.get('recommendations', [])),
                'analysis_text': analysis_result.get('analysis', ''),
                'candidate_info': json.dumps(analysis_result.get('candidateInfo', {})),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # First check if an analysis result already exists for this file and job description
            query_result = self.supabase_client.table('analysis_results').select('*').eq('file_id', file_id).eq('job_description_id', job_description_id).execute()
            
            if query_result.data and len(query_result.data) > 0:
                # Update existing analysis result
                existing_id = query_result.data[0]['id']
                result_data['id'] = existing_id
                
                update_result = self.supabase_client.table('analysis_results').update(result_data).eq('id', existing_id).execute()
                
                return True, "Analysis result updated successfully", result_data
            else:
                # Create new analysis result
                insert_result = self.supabase_client.table('analysis_results').insert(result_data).execute()
                
                return True, "Analysis result created successfully", result_data
                
        except Exception as e:
            logger.error(f'Error storing analysis result: {str(e)}')
            return False, f"Error storing analysis result: {str(e)}", None
    
    async def get_job_description(self, folder_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Get job description from Supabase
        
        Args:
            folder_id: Folder ID
            
        Returns:
            Tuple of (success, message, data)
        """
        logger.info(f'Getting job description for folder: {folder_id}')
        
        try:
            if self._use_mock:
                logger.info('Using mock implementation for getting job description')
                # Return mock job description
                return True, "Job description retrieved successfully (mock)", {
                    "id": str(uuid4()),
                    "folder_id": folder_id,
                    "description": "Mock job description for testing",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            
            # Query job description
            query_result = self.supabase_client.table('job_descriptions').select('*').eq('folder_id', folder_id).execute()
            
            if query_result.data and len(query_result.data) > 0:
                return True, "Job description retrieved successfully", query_result.data[0]
            else:
                return False, "No job description found for this folder", None
                
        except Exception as e:
            logger.error(f'Error getting job description: {str(e)}')
            return False, f"Error getting job description: {str(e)}", None
    
    async def get_analysis_results(self, folder_id: str) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all analysis results for a folder
        
        Args:
            folder_id: Folder ID
            
        Returns:
            Tuple of (success, message, data)
        """
        logger.info(f'Getting analysis results for folder: {folder_id}')
        
        try:
            if self._use_mock:
                logger.info('Using mock implementation for getting analysis results')
                # Return mock analysis results
                return True, "Analysis results retrieved successfully (mock)", [{
                    "id": str(uuid4()),
                    "folder_id": folder_id,
                    "score": 75,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }]
            
            # Query analysis results
            query_result = self.supabase_client.table('analysis_results').select('*').eq('folder_id', folder_id).execute()
            
            if query_result.data and len(query_result.data) > 0:
                # Parse JSON fields
                results = []
                for result in query_result.data:
                    parsed_result = result.copy()
                    for field in ['metadata', 'matched_keywords', 'missing_keywords', 'aspect_scores', 'recommendations', 'candidate_info']:
                        if field in parsed_result and parsed_result[field]:
                            try:
                                parsed_result[field] = json.loads(parsed_result[field])
                            except:
                                parsed_result[field] = {}
                    results.append(parsed_result)
                
                return True, f"Retrieved {len(results)} analysis results", results
            else:
                return True, "No analysis results found for this folder", []
                
        except Exception as e:
            logger.error(f'Error getting analysis results: {str(e)}')
            return False, f"Error getting analysis results: {str(e)}", []
    
    async def get_analysis_result(self, result_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Get a specific analysis result
        
        Args:
            result_id: Analysis result ID
            
        Returns:
            Tuple of (success, message, data)
        """
        logger.info(f'Getting analysis result: {result_id}')
        
        try:
            if self._use_mock:
                logger.info('Using mock implementation for getting analysis result')
                # Return mock analysis result
                return True, "Analysis result retrieved successfully (mock)", {
                    "id": result_id,
                    "score": 75,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            
            # Query analysis result
            query_result = self.supabase_client.table('analysis_results').select('*').eq('id', result_id).execute()
            
            if query_result.data and len(query_result.data) > 0:
                # Parse JSON fields
                result = query_result.data[0].copy()
                for field in ['metadata', 'matched_keywords', 'missing_keywords', 'aspect_scores', 'recommendations', 'candidate_info']:
                    if field in result and result[field]:
                        try:
                            result[field] = json.loads(result[field])
                        except:
                            result[field] = {}
                
                return True, "Analysis result retrieved successfully", result
            else:
                return False, "No analysis result found with this ID", None
                
        except Exception as e:
            logger.error(f'Error getting analysis result: {str(e)}')
            return False, f"Error getting analysis result: {str(e)}", None
    
    async def delete_analysis_result(self, result_id: str) -> Tuple[bool, str]:
        """
        Delete a specific analysis result
        
        Args:
            result_id: Analysis result ID
            
        Returns:
            Tuple of (success, message)
        """
        logger.info(f'Deleting analysis result: {result_id}')
        
        try:
            if self._use_mock:
                logger.info('Using mock implementation for deleting analysis result')
                return True, "Analysis result deleted successfully (mock)"
            
            # Delete analysis result
            delete_result = self.supabase_client.table('analysis_results').delete().eq('id', result_id).execute()
            
            return True, "Analysis result deleted successfully"
                
        except Exception as e:
            logger.error(f'Error deleting analysis result: {str(e)}')
            return False, f"Error deleting analysis result: {str(e)}"