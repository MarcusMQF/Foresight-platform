***REMOVED***
import sys
import asyncio
from app.services.supabase_storage import SupabaseStorageService

async def test_supabase():
    """Test Supabase connection"""
    print("Testing Supabase connection...")
    
    # Initialize service
    supabase_service = SupabaseStorageService()
    
    # Check connection
    is_connected = supabase_service.is_connected()
    print(f"Connection status: {is_connected}")
    
    if not is_connected:
        print("ERROR: Not connected to Supabase. Using mock implementation.")
        print("Possible issues:")
        print("1. Invalid Supabase URL or API key")
        print("2. Network connectivity issues")
        print("3. Missing dependencies")
    else:
        print("SUCCESS: Connected to Supabase successfully!")
    
    # Test getting job description
    print("\nTesting job description retrieval...")
    success, message, job_desc = await supabase_service.get_job_description("test_folder")
    print(f"Success: {success}")
    print(f"Message: {message}")
    print(f"Has data: {job_desc is not None}")
    
    return 0

def main():
    """Run the async test function"""
    return asyncio.run(test_supabase())

if __name__ == "__main__":
    sys.exit(main()) 