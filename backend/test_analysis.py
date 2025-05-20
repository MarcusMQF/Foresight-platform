***REMOVED***
import sys
import argparse
from app.services.text_extraction import TextExtractionService
from app.services.nlp_analysis import NLPAnalysisService

def main():
    parser = argparse.ArgumentParser(description='Test NLP analysis of resume against job description')
    parser.add_argument('resume_path', help='Path to the resume file (PDF or DOCX)')
    parser.add_argument('job_description_path', help='Path to the job description text file')
    args = parser.parse_args()
    
    resume_path = args.resume_path
    job_description_path = args.job_description_path
    
    # Validate resume file
    if not os.path.exists(resume_path):
        print(f"Error: Resume file '{resume_path}' does not exist.")
        sys.exit(1)
    
    resume_ext = os.path.splitext(resume_path)[1].lower()
    if resume_ext not in ['.pdf', '.docx']:
        print(f"Error: Unsupported resume format '{resume_ext}'. Only PDF and DOCX are supported.")
        sys.exit(1)
    
    # Validate job description file
    if not os.path.exists(job_description_path):
        print(f"Error: Job description file '{job_description_path}' does not exist.")
        sys.exit(1)
    
    # Initialize services
    extraction_service = TextExtractionService()
    nlp_service = NLPAnalysisService()
    
    try:
        # Extract text from resume
        print(f"Extracting text from resume '{resume_path}'...")
        resume_text = extraction_service.extract_text(resume_path)
        
        if not resume_text:
            print("Failed to extract text from the resume.")
            sys.exit(1)
        
        print(f"Successfully extracted {len(resume_text)} characters from resume.")
        
        # Read job description
        print(f"Reading job description from '{job_description_path}'...")
        with open(job_description_path, 'r', encoding='utf-8') as f:
            job_description = f.read()
        
        print(f"Successfully read {len(job_description)} characters from job description.")
        
        # Analyze resume against job description
        print("\nAnalyzing resume against job description...")
        analysis_result = nlp_service.analyze_resume(resume_text, job_description)
        
        # Display results
        print("\n" + "=" * 50)
        print("ANALYSIS RESULTS")
        print("=" * 50)
        
        print(f"\nMatch Score: {analysis_result['score']}%")
        
        print("\nExact Matched Keywords:")
        for keyword in analysis_result['matchedKeywords']:
            print(f"  ✓ {keyword}")
        
        if 'similarKeywords' in analysis_result and analysis_result['similarKeywords']:
            print("\nSemantically Similar Keywords:")
            for keyword in analysis_result['similarKeywords']:
                print(f"  ≈ {keyword}")
        
        print("\nMissing Keywords:")
        for keyword in analysis_result['missingKeywords']:
            print(f"  ✗ {keyword}")
        
        print("\nRecommendations:")
        for i, recommendation in enumerate(analysis_result['recommendations'], 1):
            print(f"  {i}. {recommendation}")
        
        print("\n" + "=" * 50)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 