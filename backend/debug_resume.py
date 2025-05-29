import sys
import re
from app.services.enhanced_text_extraction import EnhancedTextExtractionService

def main():
    # Check if resume path is provided
    if len(sys.argv) < 2:
        print("Usage: python debug_resume.py <path_to_resume_pdf>")
        sys.exit(1)
    
    resume_path = sys.argv[1]
    
    # Validate resume file
    if not os.path.exists(resume_path):
        print(f"Error: Resume file '{resume_path}' does not exist.")
        sys.exit(1)
    
    if not resume_path.lower().endswith('.pdf'):
        print(f"Error: File '{resume_path}' is not a PDF file.")
        sys.exit(1)
    
    print(f"Debugging resume extraction for: {resume_path}")
    print("-" * 50)
    
    # Extract text from resume
    extraction_service = EnhancedTextExtractionService()
    success, resume_text, metadata = extraction_service.extract_text_from_pdf(resume_path)
    
    if not success:
        print(f"Failed to extract text: {resume_text}")
        sys.exit(1)
    
    # Print metadata
    print(f"Extraction metadata: {metadata}")
    print("-" * 50)
    
    # Print full extracted text
    print("FULL EXTRACTED TEXT:")
    print("=" * 50)
    print(resume_text)
    print("=" * 50)
    
    # Analyze sections by looking for common section headers
    print("\nSECTION ANALYSIS:")
    print("-" * 50)
    
    # Split into lines for analysis
    lines = resume_text.split('\n')
    for i, line in enumerate(lines):
        # Look for potential section headers (all caps, short lines)
        if line.isupper() and len(line) < 30 and len(line) > 3:
            print(f"Potential section header at line {i+1}: '{line}'")
            
            # Print the next few lines for context
            context_lines = min(3, len(lines) - i - 1)
            for j in range(1, context_lines + 1):
                print(f"  Line {i+1+j}: {lines[i+j]}")
    
    # Look for education-related keywords
    print("\nEDUCATION KEYWORDS:")
    print("-" * 50)
    education_keywords = [
        "university", "college", "school", "degree", "bachelor", "master", 
        "phd", "graduate", "undergraduate", "student", "gpa", "major"
    ]
    
    for keyword in education_keywords:
        if keyword in resume_text.lower():
            # Find the context where this keyword appears
            start = max(0, resume_text.lower().find(keyword) - 50)
            end = min(len(resume_text), resume_text.lower().find(keyword) + len(keyword) + 50)
            context = resume_text[start:end]
            print(f"Found '{keyword}' in context: '...{context}...'")
    
    # Look for achievement-related keywords
    print("\nACHIEVEMENT KEYWORDS:")
    print("-" * 50)
    achievement_keywords = [
        "award", "honor", "recognition", "scholarship", "achievement", 
        "accomplished", "won", "winner", "certificate", "prize"
    ]
    
    for keyword in achievement_keywords:
        if keyword in resume_text.lower():
            # Find the context where this keyword appears
            start = max(0, resume_text.lower().find(keyword) - 50)
            end = min(len(resume_text), resume_text.lower().find(keyword) + len(keyword) + 50)
            context = resume_text[start:end]
            print(f"Found '{keyword}' in context: '...{context}...'")
    
    # Search for education sections by pattern
    print("\nEDUCATION PATTERN MATCHING:")
    print("-" * 50)
    education_patterns = [
        r'EDUCATION',
        r'ACADEMIC BACKGROUND',
        r'(?:University|College|Institute)\s+of',
        r'(?:Bachelors|Masters|PhD|Degree|Major|Study)',
        r'(?:GPA|Grade[s]? Point Average)\s*:?\s*[\d\.]+',
        r'Graduated'
    ]
    for pattern in education_patterns:
        matches = re.finditer(pattern, resume_text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 50)
            end = min(len(resume_text), match.end() + 50)
            context = resume_text[start:end]
            print(f"Found education pattern '{pattern}' in: '...{context}...'")
    
    # Check for common Malaysian university names
    print("\nMALAYSIAN EDUCATION REFERENCES:")
    print("-" * 50)
    malaysian_edu = [
        "Universiti", "University Malaysia", "UiTM", "UKM", "UM", "USM", "UPM", "UTM",
        "Taylor's", "Sunway", "INTI", "HELP", "APU", "MMU", "UTP", "UTAR"
    ]
    for school in malaysian_edu:
        if school in resume_text:
            start = max(0, resume_text.find(school) - 50)
            end = min(len(resume_text), resume_text.find(school) + len(school) + 50)
            context = resume_text[start:end]
            print(f"Found Malaysian education reference '{school}' in: '...{context}...'")
    
    # Also check for extracurricular activities that might contain achievements
    print("\nEXTRACURRICULAR ACTIVITIES (may contain achievements):")
    print("-" * 50)
    if "EXTRACURRICULAR" in resume_text or "ACTIVITIES" in resume_text:
        match = re.search(r'EXTRACURRICULAR(?:\s+ACTIVITIES)?.*?\n(.*?)(?:\n\s*\n|\n[A-Z\s]{5,}|\Z)', 
                         resume_text, re.DOTALL | re.IGNORECASE)
        if match:
            print(f"Found extracurricular section content: \n{match.group(1)}")

if __name__ == "__main__":
    main() 