import sys
import json
from app.services.qwen_processing import QwenProcessingService
from app.services.scoring_service import ScoringService

def main():
    # Initialize the services
    qwen_service = QwenProcessingService()
    scoring_service = ScoringService()
    
    # Path to the test files
    pdf_path = "../samples/TanZhenYu.pdf"
    job_desc_path = "../job_description.txt"
    
    # Check if the files exist
    if not os.path.exists(pdf_path):
        print(f"Error: Resume file '{pdf_path}' does not exist.")
        sys.exit(1)
    
    if not os.path.exists(job_desc_path):
        print(f"Error: Job description file '{job_desc_path}' does not exist.")
        sys.exit(1)
    
    try:
        # Read the job description
        with open(job_desc_path, 'r', encoding='utf-8') as f:
            job_description = f.read()
        
        print(f"Testing NLP/AI processing functionality")
        print("-" * 60)
        
        # Test sample text (we're not extracting from PDF directly to isolate NLP issues)
        sample_text = """
        JOHN DOE
        Software Engineer

        EXPERIENCE:
        Senior Developer, ABC Tech (2018-Present)
        - Developed web applications using React, Node.js and TypeScript
        - Led a team of 5 engineers to deliver projects on time
        - Implemented CI/CD pipelines using GitHub Actions
        
        Junior Developer, XYZ Inc (2015-2018)
        - Built REST APIs using Python and Flask
        - Collaborated with UX designers to implement responsive interfaces
        
        EDUCATION:
        BS Computer Science, University of Technology (2015)
        
        SKILLS:
        JavaScript, TypeScript, React, Node.js, Python, Git, AWS, Docker
        """
        
        print("Testing candidate info extraction...")
        try:
            candidate_info = qwen_service.extract_candidate_info(sample_text)
            print(f"Extraction successful!")
            print(f"Name: {candidate_info.get('name', 'Not found')}")
            print(f"Email: {candidate_info.get('email', 'Not found')}")
            print(f"Sections found: {list(candidate_info.get('sections', {}).keys())}")
            print(f"Skills found: {candidate_info.get('skills', [])[:5]}")
        except Exception as e:
            print(f"Extraction failed: {e}")
        
        print("-" * 60)
        
        print("Testing job description analysis...")
        try:
            job_analysis = qwen_service.analyze_job_description(job_description)
            print(f"Analysis successful!")
            print(f"Title: {job_analysis.get('title', 'Not detected')}")
            print(f"Experience required: {job_analysis.get('experience_required', 'Not specified')}")
            print(f"Skills: {job_analysis.get('technical_skills', [])[:5]}")
        except Exception as e:
            print(f"Analysis failed: {e}")
        
        print("-" * 60)
        
        print("Testing scoring functionality...")
        try:
            # Custom weights for testing
            weights = {
                "skills": 0.4,
                "experience": 0.3,
                "achievements": 0.2,
                "education": 0.05,
                "culturalFit": 0.05
            }
            
            score_result = scoring_service.calculate_match_score(candidate_info, job_description, weights)
            print(f"Scoring successful!")
            print(f"Match score: {score_result['score']}%")
            print(f"Aspect scores: {json.dumps(score_result['aspectScores'], indent=2)}")
            print(f"Matched keywords: {score_result['matchedKeywords'][:3]}")
            print(f"Missing keywords: {score_result['missingKeywords'][:3]}")
        except Exception as e:
            print(f"Scoring failed: {e}")

    except Exception as e:
        print(f"Error in main test process: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 