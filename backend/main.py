from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import tempfile
import shutil
from pydantic import BaseModel
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import docx
from pdfminer.high_level import extract_text
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Resume ATS Analyzer")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("Loaded spaCy model successfully")
except OSError:
    logger.warning("spaCy model not found. Downloading...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")
    logger.info("Downloaded and loaded spaCy model successfully")

# Define response model
class AnalysisResult(BaseModel):
    score: int
    matchedKeywords: List[str]
    missingKeywords: List[str]
    recommendations: List[str]
    filename: str

# Helper functions for text extraction
def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file"""
    try:
        text = extract_text(file_path)
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file"""
    try:
        doc = docx.Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}")
        return ""

def extract_text_from_file(file_path: str) -> str:
    """Extract text from a file based on its extension"""
    if file_path.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif file_path.lower().endswith('.docx'):
        return extract_text_from_docx(file_path)
    else:
        logger.warning(f"Unsupported file format: {file_path}")
        return ""

# Helper functions for NLP analysis
def extract_keywords(text: str) -> List[str]:
    """Extract important keywords from text using spaCy"""
    doc = nlp(text.lower())
    
    # Extract nouns, proper nouns, and compound nouns
    keywords = []
    for chunk in doc.noun_chunks:
        keywords.append(chunk.text)
    
    # Add named entities
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "GPE", "SKILL", "LANGUAGE"]:
            keywords.append(ent.text)
    
    # Add technical skills and job-related terms
    skill_pattern = r'\b(?:python|java|javascript|react|node\.js|sql|aws|docker|kubernetes|machine learning|ai|data science|agile|scrum|project management)\b'
    skills = re.findall(skill_pattern, text.lower())
    keywords.extend(skills)
    
    # Clean and deduplicate keywords
    cleaned_keywords = []
    for keyword in keywords:
        keyword = keyword.strip().lower()
        if keyword and len(keyword) > 1 and keyword not in cleaned_keywords:
            cleaned_keywords.append(keyword)
    
    return cleaned_keywords

def calculate_match_score(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Calculate match score and extract matched/missing keywords"""
    # Extract keywords
    resume_keywords = extract_keywords(resume_text)
    job_keywords = extract_keywords(job_description)
    
    # Calculate TF-IDF similarity
    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        similarity_score = int(similarity * 100)  # Convert to percentage
    except:
        similarity_score = 0
    
    # Find matched and missing keywords
    matched_keywords = [kw for kw in resume_keywords if any(job_kw in kw or kw in job_kw for job_kw in job_keywords)]
    missing_keywords = [kw for kw in job_keywords if not any(kw in resume_kw or resume_kw in kw for resume_kw in resume_keywords)]
    
    # Generate recommendations based on missing keywords
    recommendations = []
    if missing_keywords:
        recommendations.append(f"Add these missing keywords to your resume: {', '.join(missing_keywords[:3])}")
    
    if similarity_score < 70:
        recommendations.append("Use more specific language that matches the job description")
    
    if len(resume_keywords) < 10:
        recommendations.append("Include more detailed skills and experiences in your resume")
    
    return {
        "score": similarity_score,
        "matchedKeywords": matched_keywords[:10],  # Limit to top 10
        "missingKeywords": missing_keywords[:10],  # Limit to top 10
        "recommendations": recommendations
    }

def analyze_resume(resume_text: str, job_description: str, filename: str) -> AnalysisResult:
    """Analyze a resume against a job description"""
    # Calculate match score and extract keywords
    analysis = calculate_match_score(resume_text, job_description)
    
    # Create and return result
    return AnalysisResult(
        score=analysis["score"],
        matchedKeywords=analysis["matchedKeywords"],
        missingKeywords=analysis["missingKeywords"],
        recommendations=analysis["recommendations"],
        filename=filename
    )

@app.get("/")
def read_root():
    return {"message": "Resume ATS Analyzer API is running"}

@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_single_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Analyze a single resume against a job description"""
    # Create a temporary directory to store the uploaded file
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save the uploaded file to the temporary directory
        file_path = os.path.join(temp_dir, resume.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(resume.file, buffer)
        
        # Extract text from the file
        resume_text = extract_text_from_file(file_path)
        if not resume_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the resume")
        
        # Analyze the resume
        result = analyze_resume(resume_text, job_description, resume.filename)
        return result

@app.post("/api/analyze-batch", response_model=Dict[str, List[AnalysisResult]])
async def analyze_multiple_resumes(
    resumes: List[UploadFile] = File(...),
    job_description: str = Form(...)
):
    """Analyze multiple resumes against a job description"""
    results = []
    
    # Create a temporary directory to store the uploaded files
    with tempfile.TemporaryDirectory() as temp_dir:
        for resume in resumes:
            # Save the uploaded file to the temporary directory
            file_path = os.path.join(temp_dir, resume.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(resume.file, buffer)
            
            # Extract text from the file
            resume_text = extract_text_from_file(file_path)
            if not resume_text:
                logger.warning(f"Could not extract text from {resume.filename}")
                continue
            
            # Analyze the resume
            result = analyze_resume(resume_text, job_description, resume.filename)
            results.append(result)
    
    return {"results": results}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 