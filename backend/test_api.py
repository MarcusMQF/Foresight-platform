#!/usr/bin/env python3
"""
Resume Analysis API Test Script

This script tests the resume analysis API endpoints by sending real requests
with a resume PDF file and job description, along with custom weights.

Usage:
  python test_api.py path/to/resume.pdf path/to/job_description.txt [--weights-file weights.json]

Options:
  --weights-file  Path to a JSON file containing custom aspect weights
"""

***REMOVED***
import sys
import json
import argparse
import httpx
import asyncio
from typing import Dict, Any, Optional

# API Settings
API_BASE_URL = "http://localhost:8001/api"
TIMEOUT = 60.0  # seconds

async def test_extraction_endpoint(pdf_path: str) -> Dict[str, Any]:
    """Test the PDF extraction endpoint"""
    print(f"\n=== Testing PDF Extraction API ===")
    
    # Check if file exists
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return {"success": False, "error": "File not found"}
    
    # Read the PDF file
    with open(pdf_path, "rb") as f:
        file_content = f.read()
    
    # Create form data
    files = {"resume": (os.path.basename(pdf_path), file_content, "application/pdf")}
    data = {"enable_fallback_extraction": "true"}
    
    # Send request
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            print(f"Sending request to {API_BASE_URL}/test-extraction")
            response = await client.post(
                f"{API_BASE_URL}/test-extraction",
                files=files,
                data=data
            )
        
        # Check response
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Extraction completed. Status code: {response.status_code}")
            print(f"  - Text length: {result.get('text_length', 'N/A')}")
            if result.get('metadata'):
                print(f"  - Extraction method: {result['metadata'].get('extraction_method', 'N/A')}")
                print(f"  - Status: {result['metadata'].get('extraction_status', 'N/A')}")
            
            if result.get('text_sample'):
                preview = result['text_sample']
                print(f"\nText preview:")
                print("-" * 80)
                print(preview[:200] + "..." if len(preview) > 200 else preview)
                print("-" * 80)
            
            return result
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"Response: {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e)}

async def test_analysis_endpoint(
    pdf_path: str, 
    job_description_path: str, 
    weights_file: Optional[str] = None
) -> Dict[str, Any]:
    """Test the resume analysis endpoint with weights"""
    print(f"\n=== Testing Resume Analysis API ===")
    
    # Check if files exist
    if not os.path.exists(pdf_path):
        print(f"Error: Resume file not found: {pdf_path}")
        return {"success": False, "error": "Resume file not found"}
    
    if not os.path.exists(job_description_path):
        print(f"Error: Job description file not found: {job_description_path}")
        return {"success": False, "error": "Job description file not found"}
    
    # Read the PDF file
    with open(pdf_path, "rb") as f:
        resume_content = f.read()
    
    # Read the job description
    with open(job_description_path, "r", encoding="utf-8") as f:
        job_description = f.read()
    
    # Read weights if provided
    weights_json = None
    if weights_file and os.path.exists(weights_file):
        try:
            with open(weights_file, "r") as f:
                weights_json = json.dumps(json.load(f))
            print(f"Using custom weights from {weights_file}")
        except json.JSONDecodeError:
            print(f"Warning: Invalid JSON in weights file. Using default weights.")
        except Exception as e:
            print(f"Warning: Error reading weights file: {e}. Using default weights.")
    
    # Create form data
    files = {"resume": (os.path.basename(pdf_path), resume_content, "application/pdf")}
    data = {
        "job_description": job_description,
        "folder_id": "test_folder",
        "user_id": "test_user",
        "use_distilbert": "true",
        "enable_fallback_extraction": "true",
        "store_results": "false"  # Don't store in database for testing
    }
    
    # Add weights if available
    if weights_json:
        data["weights"] = weights_json
    
    # Send request
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            print(f"Sending request to {API_BASE_URL}/analyze")
            print(f"  - Resume: {os.path.basename(pdf_path)}")
            print(f"  - Job description length: {len(job_description)} characters")
            response = await client.post(
                f"{API_BASE_URL}/analyze",
                files=files,
                data=data
            )
        
        # Check response
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Analysis completed. Status code: {response.status_code}")
            
            # Print candidate information
            if result.get('candidateInfo'):
                candidate_info = result['candidateInfo']
                print("\nCandidate Information:")
                print(f"  - Name: {candidate_info.get('name', 'N/A')}")
                print(f"  - Email: {candidate_info.get('email', 'N/A')}")
            
            print(f"  - Match score: {result.get('score', 'N/A')}")
            print(f"  - Extraction method: {result.get('metadata', {}).get('extraction_method', 'N/A')}")
            
            # Print aspect scores if available
            if result.get('aspectScores'):
                print("\nAspect Scores:")
                for aspect, score in result['aspectScores'].items():
                    print(f"  - {aspect}: {score}")
            
            # Print matched keywords
            if result.get('matchedKeywords'):
                print(f"\nMatched Keywords ({len(result['matchedKeywords'])}):")
                for keyword in result['matchedKeywords'][:10]:  # Show first 10
                    print(f"  - {keyword}")
                if len(result['matchedKeywords']) > 10:
                    print(f"  - ... and {len(result['matchedKeywords']) - 10} more")
            
            # Print missing keywords
            if result.get('missingKeywords'):
                print(f"\nMissing Keywords ({len(result['missingKeywords'])}):")
                for keyword in result['missingKeywords'][:10]:  # Show first 10
                    print(f"  - {keyword}")
                if len(result['missingKeywords']) > 10:
                    print(f"  - ... and {len(result['missingKeywords']) - 10} more")
            
            # Print HR analysis and recommendations
            if result.get('analysis'):
                print(f"\nHR Analysis:")
                print(f"  {result['analysis']}")
            
            # Print recommendations
            if result.get('recommendations'):
                print(f"\nHR Recommendations:")
                for i, rec in enumerate(result['recommendations'], 1):
                    print(f"  {i}. {rec}")
            
            return result
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"Response: {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e)}

async def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Test resume analysis API")
    parser.add_argument("resume", help="Path to the resume PDF file")
    parser.add_argument("job_description", help="Path to the job description text file")
    parser.add_argument("--weights-file", help="Path to a JSON file with custom weights")
    args = parser.parse_args()
    
    # Test extraction endpoint
    extraction_result = await test_extraction_endpoint(args.resume)
    
    # Test analysis endpoint
    analysis_result = await test_analysis_endpoint(
        args.resume, 
        args.job_description,
        args.weights_file
    )
    
    # Print final summary
    print("\n=== API Test Summary ===")
    print(f"Extraction API: {'✅ Success' if extraction_result.get('success') else '❌ Failed'}")
    print(f"Analysis API: {'✅ Success' if analysis_result.get('score') is not None else '❌ Failed'}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    asyncio.run(main()) 