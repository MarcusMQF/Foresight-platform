***REMOVED***
import logging
import json
import re
import uuid
from typing import Dict, List, Any, Optional, Tuple
from supabase import create_client, Client
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        self.supabase_url = os.getenv("SUPABASE_URL", "[SUPABASE_URL_REMOVED]")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")
        
        # Print credentials for debugging (only show masked key)
        print(f"Supabase URL: {self.supabase_url}")
        if self.supabase_key:
            masked_key = self.supabase_key[:10] + "..." + self.supabase_key[-10:] if len(self.supabase_key) > 20 else "***masked***"
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
    
    def is_connected(self) -> bool:
        """Check if connected to Supabase"""
        connected = self.supabase_client is not None and not self._use_mock
        print(f"Supabase connection status: {connected}")
        return connected
    
    def _is_valid_uuid(self, val: str) -> bool:
        """Check if a string is a valid UUID"""
        try:
            uuid.UUID(str(val))
            return True
        except ValueError:
            return False
    
    # Mock data storage for when Supabase isn't available
    _mock_job_descriptions = {}
    _mock_analysis_results = {}
    
    async def store_job_description(self, description: str, folder_id: str, user_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Store a job description in Supabase
        
        Args:
            description: Job description text
            folder_id: Folder ID
            user_id: User ID
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Message (str)
            - Data (Dict) or None if operation failed
        """
        # If folder_id is not a valid UUID, generate one
        if not self._is_valid_uuid(folder_id):
            logger.warning(f"Invalid UUID format for folder_id: {folder_id}, using a generated UUID")
            folder_id = str(uuid4())
        
        if self._use_mock:
            # Use mock implementation
            try:
                job_id = str(uuid4())
                timestamp = datetime.now().isoformat()
                
                job_desc = {
                    "id": job_id,
                    "description": description,
                    "folder_id": folder_id,
                    "userId": user_id,
                    "created_at": timestamp
                }
                
                # Store in memory
                if folder_id not in self._mock_job_descriptions:
                    self._mock_job_descriptions[folder_id] = []
                
                self._mock_job_descriptions[folder_id].append(job_desc)
                
                logger.info(f'Mock storage: Job description stored with ID {job_id}')
                return True, 'Job description stored successfully', job_desc
            except Exception as e:
                logger.error(f'Mock storage error: {str(e)}')
                return False, f'Error storing job description: {str(e)}', None
        
        try:
            # Add timestamp
            timestamp = datetime.now().isoformat()
            
            # Create data object
            data = {
                'description': description,
                'folder_id': folder_id,
                'userId': user_id,
                'created_at': timestamp
            }
            
            # Insert into Supabase
            result = await self.supabase_client.table('job_descriptions').insert(data).execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f'Job description stored with ID {result.data[0]["id"]}')
                return True, 'Job description stored successfully', result.data[0]
            else:
                logger.error('No data returned from Supabase after storing job description')
                return False, 'No data returned from database', None
        except Exception as e:
            logger.error(f'Error storing job description in Supabase: {str(e)}')
            # If we encounter an error, switch to mock mode for this request
            self._use_mock = True
            logger.warning('Temporarily switching to mock mode due to error')
            return await self.store_job_description(description, folder_id, user_id)
    
    async def get_job_description(self, folder_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Get the most recent job description for a folder
        
        Args:
            folder_id: Folder ID
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Message (str)
            - Job description data (Dict) or None if operation failed
        """
        # If folder_id is not a valid UUID and we're not in mock mode, use mock mode
        if not self._is_valid_uuid(folder_id) and not self._use_mock:
            logger.warning(f"Invalid UUID format for folder_id: {folder_id}, using mock mode")
            return True, 'Using mock mode due to invalid UUID', {"id": str(uuid4()), "description": "Sample job description for testing.", "folder_id": folder_id, "created_at": datetime.now().isoformat()}
        
        if self._use_mock:
            # Use mock implementation
            try:
                if folder_id in self._mock_job_descriptions and self._mock_job_descriptions[folder_id]:
                    # Sort by created_at and get the most recent
                    sorted_descriptions = sorted(
                        self._mock_job_descriptions[folder_id], 
                        key=lambda x: x.get("created_at", ""), 
                        reverse=True
                    )
                    
                    logger.info(f'Mock storage: Retrieved job description for folder {folder_id}')
                    return True, 'Job description retrieved successfully', sorted_descriptions[0]
                else:
                    # Create a mock job description if none exists
                    mock_job = {
                        "id": str(uuid4()),
                        "description": "This is a sample job description generated by the mock service.",
                        "folder_id": folder_id,
                        "userId": "mock_user",
                        "created_at": datetime.now().isoformat()
                    }
                    
                    if folder_id not in self._mock_job_descriptions:
                        self._mock_job_descriptions[folder_id] = []
                    
                    self._mock_job_descriptions[folder_id].append(mock_job)
                    
                    logger.info(f'Mock storage: Created and retrieved mock job description for folder {folder_id}')
                    return True, 'Mock job description generated', mock_job
            except Exception as e:
                logger.error(f'Mock storage error: {str(e)}')
                return False, f'Error retrieving job description: {str(e)}', None
        
        if not self.is_connected():
            return False, "Not connected to Supabase", None
        
        try:
            result = self.supabase_client.table("job_descriptions").select("*").eq("folder_id", folder_id).execute()
            
            if result.data:
                # Sort by created_at and get the most recent
                sorted_data = sorted(result.data, key=lambda x: x.get("created_at", ""), reverse=True)
                
                logger.info(f'Retrieved job description for folder {folder_id}')
                return True, 'Job description retrieved successfully', sorted_data[0]
            else:
                logger.info(f'No job description found for folder {folder_id}')
                return False, 'No job description found for this folder', None
        except Exception as e:
            error_msg = f'Error retrieving job description: {str(e)}'
            logger.error(error_msg)
            
            # Switch to mock mode for this request
            logger.warning('Temporarily switching to mock mode due to error')
            self._use_mock = True
            return await self.get_job_description(folder_id)
    
    # Analysis Results Methods
    
    async def store_analysis_result(self, 
                                  file_id: str, 
                                  job_description_id: str, 
                                  folder_id: str,
                                  user_id: str,
                                  analysis_result: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Store an analysis result in Supabase
        
        Args:
            file_id: File ID
            job_description_id: Job description ID
            folder_id: Folder ID
            user_id: User ID
            analysis_result: Analysis result data
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Message (str)
            - Analysis result data (Dict) or None if operation failed
        """
        if self._use_mock:
            # Use mock implementation
            try:
                result_id = str(uuid4())
                timestamp = datetime.now().isoformat()
                
                # Create a data object
                stored_result = {
                    "id": result_id,
                    "file_id": file_id,
                    "job_description_id": job_description_id,
                    "folder_id": folder_id,
                    "userId": user_id,
                    "match_score": analysis_result.get("score", 0),
                    "strengths": analysis_result.get("matchedKeywords", []),
                    "weaknesses": analysis_result.get("missingKeywords", []),
                    "recommendations": analysis_result.get("recommendations", []),
                    "aspect_scores": analysis_result.get("aspectScores", {}),
                    "achievement_bonus": analysis_result.get("achievementBonus", 0),
                    "created_at": timestamp,
                    "filename": analysis_result.get("filename", "")
                }
                
                # Store in memory
                key = f"{folder_id}_{file_id}"
                self._mock_analysis_results[key] = stored_result
                
                logger.info(f'Mock storage: Analysis result stored with ID {result_id}')
                return True, 'Analysis result stored successfully', stored_result
            except Exception as e:
                logger.error(f'Mock storage error: {str(e)}')
                return False, f'Error storing analysis result: {str(e)}', None
        
        if not self.is_connected():
            return False, "Not connected to Supabase", None
        
        try:
            # Check if an analysis result already exists for this file
            existing = self.supabase_client.table("analysis_results").select("*").eq("file_id", file_id).execute()
            
            # Extract the necessary data from the analysis result
            data_to_store = {
                "file_id": file_id,
                "job_description_id": job_description_id,
                "folder_id": folder_id,
                "userId": user_id,
                "match_score": analysis_result.get("score", 0),
                "strengths": analysis_result.get("matchedKeywords", []),
                "weaknesses": analysis_result.get("missingKeywords", []),
                "recommendations": analysis_result.get("recommendations", []),
                "aspect_scores": analysis_result.get("aspectScores", {}),
                "achievement_bonus": analysis_result.get("achievementBonus", 0)
            }
            
            if existing.data:
                # Update existing analysis result
                result_id = existing.data[0]["id"]
                result = self.supabase_client.table("analysis_results").update(data_to_store).eq("id", result_id).execute()
                
                logger.info(f"Updated analysis result for file {file_id}")
                return True, "Analysis result updated successfully", result.data[0]
            else:
                # Create new analysis result
                result_id = str(uuid4())
                data_to_store["id"] = result_id
                result = self.supabase_client.table("analysis_results").insert(data_to_store).execute()
                
                logger.info(f"Created new analysis result for file {file_id}")
                return True, "Analysis result created successfully", result.data[0]
                
        except Exception as e:
            error_msg = f"Error storing analysis result: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, None
    
    async def get_analysis_results(self, folder_id: str) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all analysis results for a folder
        
        Args:
            folder_id: Folder ID
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Message (str)
            - List of analysis results (List[Dict]) or empty list if operation failed
        """
        if self._use_mock:
            # Use mock implementation
            try:
                # Filter results for this folder
                folder_results = [
                    result for key, result in self._mock_analysis_results.items() 
                    if key.startswith(f"{folder_id}_")
                ]
                
                logger.info(f'Mock storage: Retrieved {len(folder_results)} analysis results for folder {folder_id}')
                return True, f'Retrieved {len(folder_results)} analysis results', folder_results
            except Exception as e:
                logger.error(f'Mock storage error: {str(e)}')
                return False, f'Error retrieving analysis results: {str(e)}', []
        
        if not self.is_connected():
            return False, "Not connected to Supabase", []
        
        try:
            # Join with files table to get file names
            result = self.supabase_client.table("analysis_results").select(
                "*, files!inner(name, size, type, created_at)"
            ).eq("folder_id", folder_id).execute()
            
            if result.data:
                logger.info(f'Retrieved {len(result.data)} analysis results for folder {folder_id}')
                return True, f'Retrieved {len(result.data)} analysis results', result.data
            else:
                logger.info(f'No analysis results found for folder {folder_id}')
                return True, 'No analysis results found for this folder', []
        except Exception as e:
            error_msg = f'Error retrieving analysis results: {str(e)}'
            logger.error(error_msg)
            return False, error_msg, []
    
    async def get_analysis_result(self, result_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Get a specific analysis result
        
        Args:
            result_id: Analysis result ID
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Message (str)
            - Analysis result data (Dict) or None if operation failed
        """
        if self._use_mock:
            # Use mock implementation
            try:
                # Search in all results
                for result in self._mock_analysis_results.values():
                    if result.get("id") == result_id:
                        logger.info(f'Mock storage: Retrieved analysis result {result_id}')
                        return True, 'Analysis result retrieved successfully', result
                
                logger.info(f'Mock storage: Analysis result {result_id} not found')
                return False, 'Analysis result not found', None
            except Exception as e:
                logger.error(f'Mock storage error: {str(e)}')
                return False, f'Error retrieving analysis result: {str(e)}', None
        
        if not self.is_connected():
            return False, "Not connected to Supabase", None
        
        try:
            result = self.supabase_client.table("analysis_results").select(
                "*, files!inner(name, size, type, created_at)"
            ).eq("id", result_id).execute()
            
            if result.data:
                logger.info(f'Retrieved analysis result {result_id}')
                return True, 'Analysis result retrieved successfully', result.data[0]
            else:
                logger.info(f'Analysis result {result_id} not found')
                return False, 'Analysis result not found', None
        except Exception as e:
            error_msg = f'Error retrieving analysis result: {str(e)}'
            logger.error(error_msg)
            return False, error_msg, None
    
    async def delete_analysis_result(self, result_id: str) -> Tuple[bool, str]:
        """
        Delete a specific analysis result
        
        Args:
            result_id: Analysis result ID
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Message (str)
        """
        if self._use_mock:
            # Use mock implementation
            try:
                # Find and remove the result
                for key, result in list(self._mock_analysis_results.items()):
                    if result.get("id") == result_id:
                        del self._mock_analysis_results[key]
                        logger.info(f'Mock storage: Deleted analysis result {result_id}')
                        return True, 'Analysis result deleted successfully'
                
                logger.info(f'Mock storage: Analysis result {result_id} not found for deletion')
                return False, 'Analysis result not found'
            except Exception as e:
                logger.error(f'Mock storage error: {str(e)}')
                return False, f'Error deleting analysis result: {str(e)}'
        
        if not self.is_connected():
            return False, "Not connected to Supabase"
        
        try:
            self.supabase_client.table("analysis_results").delete().eq("id", result_id).execute()
            
            logger.info(f"Deleted analysis result {result_id}")
            return True, "Analysis result deleted successfully"
        except Exception as e:
            error_msg = f"Error deleting analysis result: {str(e)}"
            logger.error(error_msg)
            return False, error_msg 