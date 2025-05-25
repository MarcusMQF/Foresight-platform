***REMOVED***
import sys
import json
import requests

def main():
    # Set API URL
    api_url = "http://localhost:8000/api"
    
    # Check if API is running
    try:
        response = requests.get(api_url + "/weights/default")
        if response.status_code == 200:
            print(f"✅ API is running, got default weights: {response.json()}")
        else:
            print(f"❌ API error: {response.status_code} - {response.text}")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the API. Make sure the server is running on http://localhost:8000")
        sys.exit(1)
    
    # Path to test files
    pdf_path = "../samples/TanZhenYu.pdf"
    job_desc_path = "../job_description.txt"
    
    # Check if files exist
    if not os.path.exists(pdf_path):
        print(f"❌ Error: Resume file '{pdf_path}' does not exist.")
        sys.exit(1)
    
    if not os.path.exists(job_desc_path):
        print(f"❌ Error: Job description file '{job_desc_path}' does not exist.")
        sys.exit(1)
    
    # Read job description
    try:
        with open(job_desc_path, 'r', encoding='utf-8') as f:
            job_description = f.read()
        print(f"✅ Job description loaded, length: {len(job_description)} characters")
    except Exception as e:
        print(f"❌ Failed to read job description: {e}")
        sys.exit(1)
    
    # Create test data
    try:
        # Prepare form data
        form_data = {
            'job_description': job_description,
            'folder_id': 'test_folder_id',
            'user_id': 'test_user_id',
            'use_distilbert': 'false',
            'store_results': 'false',
            'enable_fallback_extraction': 'true'
        }
        
        # Prepare file
        files = {
            'resume': ('TanZhenYu.pdf', open(pdf_path, 'rb'), 'application/pdf')
        }
        
        print(f"🔄 Sending request to {api_url}/analyze...")
        response = requests.post(
            f"{api_url}/analyze", 
            data=form_data,
            files=files,
            timeout=60  # 60 second timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Analysis successful!")
            print(f"   Score: {result.get('score', 'N/A')}")
            print(f"   Matched keywords: {result.get('matchedKeywords', [])[:3]}")
            print(f"   Missing keywords: {result.get('missingKeywords', [])[:3]}")
            print(f"   Extraction method: {result.get('metadata', {}).get('extraction_method', 'N/A')}")
            print(f"   Extraction status: {result.get('metadata', {}).get('extraction_status', 'N/A')}")
        else:
            print(f"❌ Analysis failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error sending request: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Close file
        files['resume'][1].close()

if __name__ == "__main__":
    main() 