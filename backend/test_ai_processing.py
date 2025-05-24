***REMOVED***
import sys
import argparse
import json

# Add the parent directory to the Python path so we can import the app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.enhanced_text_extraction import EnhancedTextExtractionService
from backend.app.services.qwen_processing import QwenProcessingService
from backend.app.services.distilbert_extraction import DistilBERTExtractionService
from backend.app.services.scoring_service import ScoringService

def main():
    parser = argparse.ArgumentParser(description='Test AI processing pipeline for resume analysis')
    parser.add_argument('resume_path', help='Path to the resume PDF file')
    parser.add_argument('job_description_path', help='Path to the job description text file')
    parser.add_argument('--use_distilbert', action='store_true', help='Use DistilBERT for name/email extraction')
    parser.add_argument('--output', help='Path to save the output JSON')
    args = parser.parse_args()
    
    resume_path = args.resume_path
    job_description_path = args.job_description_path
    use_distilbert = args.use_distilbert
    output_path = args.output
    
    # Validate files exist
    if not os.path.exists(resume_path):
        print(f"Error: Resume file '{resume_path}' does not exist.")
        sys.exit(1)
    
    if not os.path.exists(job_description_path):
        print(f"Error: Job description file '{job_description_path}' does not exist.")
        sys.exit(1)
    
    # Validate resume is PDF
    if not resume_path.lower().endswith('.pdf'):
        print(f"Error: Resume file '{resume_path}' is not a PDF file.")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"Testing AI Processing Pipeline")
    print(f"{'='*60}")
    print(f"Resume: {os.path.basename(resume_path)}")
    print(f"Job Description: {os.path.basename(job_description_path)}")
    print(f"Using DistilBERT: {use_distilbert}")
    print(f"{'='*60}\n")
    
    try:
        # Step 1: Text Extraction
        print("Step 1: Text Extraction")
        extraction_service = EnhancedTextExtractionService()
        success, resume_text, metadata = extraction_service.extract_text_from_pdf(resume_path)
        
        if not success:
            print(f"❌ Text extraction failed: {resume_text}")
            sys.exit(1)
        
        print(f"✅ Text extraction successful: {len(resume_text)} characters extracted")
        print(f"   Metadata: {json.dumps(metadata, indent=2)}")
        
        # Read job description
        with open(job_description_path, 'r', encoding='utf-8') as f:
            job_description = f.read()
        
        print(f"✅ Job description loaded: {len(job_description)} characters")
        
        # Step 2: AI Processing
        print("\nStep 2: AI Processing")
        
        # Use either Qwen or DistilBERT for name/email extraction
        candidate_info = {}
        
        if use_distilbert:
            print("   Using DistilBERT for name/email extraction")
            distilbert_service = DistilBERTExtractionService()
            distilbert_info = distilbert_service.extract_name_and_email(resume_text)
            
            print(f"   DistilBERT extraction results: name='{distilbert_info.get('name', '')}', email='{distilbert_info.get('email', '')}'")
            
            # Process with Qwen for other information
            qwen_service = QwenProcessingService()
            candidate_info = qwen_service.extract_candidate_info(resume_text)
            
            # Update with DistilBERT results if they were found
            if distilbert_info.get("name"):
                candidate_info["name"] = distilbert_info["name"]
                print(f"   Updated name to: {candidate_info['name']}")
            if distilbert_info.get("email"):
                candidate_info["email"] = distilbert_info["email"]
        else:
            print("   Using Qwen for all information extraction")
            qwen_service = QwenProcessingService()
            candidate_info = qwen_service.extract_candidate_info(resume_text)
        
        print(f"✅ Candidate information extracted:")
        print(f"   Name: {candidate_info.get('name', 'Not found')}")
        print(f"   Email: {candidate_info.get('email', 'Not found')}")
        print(f"   Sections found: {list(candidate_info.get('sections', {}).keys())}")
        print(f"   Keywords found: {len(candidate_info.get('keywords', []))}")
        
        # Step 3: Scoring
        print("\nStep 3: Scoring")
        scoring_service = ScoringService()
        
        # Define weights (can be customized)
        weights = {
            "skills": 0.4,
            "experience": 0.3,
            "achievements": 0.2,
            "education": 0.05,
            "culturalFit": 0.05
        }
        
        score_result = scoring_service.calculate_match_score(candidate_info, job_description, weights)
        
        print(f"✅ Match score: {score_result['score']}%")
        print(f"   Aspect scores:")
        for aspect, score in score_result["aspectScores"].items():
            print(f"     - {aspect}: {score:.1f}%")
        
        print(f"   Achievement bonus: +{score_result['achievementBonus']}")
        
        print(f"\n   Matched keywords ({len(score_result['matchedKeywords'])}):")
        for keyword in score_result['matchedKeywords'][:5]:
            print(f"     ✓ {keyword}")
        if len(score_result['matchedKeywords']) > 5:
            print(f"     ... and {len(score_result['matchedKeywords']) - 5} more")
        
        print(f"\n   Missing keywords ({len(score_result['missingKeywords'])}):")
        for keyword in score_result['missingKeywords'][:5]:
            print(f"     ✗ {keyword}")
        if len(score_result['missingKeywords']) > 5:
            print(f"     ... and {len(score_result['missingKeywords']) - 5} more")
        
        print(f"\n   Recommendations:")
        for i, recommendation in enumerate(score_result['recommendations'], 1):
            print(f"     {i}. {recommendation}")
        
        # Print detailed analysis if available
        if 'analysis' in score_result:
            print(f"\n   Detailed Analysis:")
            print(f"     {score_result['analysis']}")
        
        # Save output if requested
        if output_path:
            output_data = {
                "resume_file": os.path.basename(resume_path),
                "job_description_file": os.path.basename(job_description_path),
                "metadata": metadata,
                "candidate_info": candidate_info,
                "score_result": score_result
            }
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2)
            
            print(f"\n✅ Output saved to {output_path}")
        
        print(f"\n{'='*60}")
        print(f"AI Processing Pipeline Test Complete")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 