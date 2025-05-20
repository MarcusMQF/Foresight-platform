from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Dict, Any
from app.services.text_extraction import TextExtractionService
from app.services.nlp_analysis import NLPAnalysisService
***REMOVED***

router = APIRouter()
text_extraction_service = TextExtractionService()
nlp_analysis_service = NLPAnalysisService()

@router.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
) -> Dict[str, Any]:
    """
    Analyze a single resume against a job description
    
    Args:
        resume: The resume file (PDF or DOCX)
        job_description: The job description text
        
    Returns:
        Analysis result with score, matched keywords, etc.
    """
    # Validate file type
    file_ext = os.path.splitext(resume.filename)[1].lower()
    if file_ext not in ['.pdf', '.docx']:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    try:
        # Read file content
        content = await resume.read()
        
        # Extract text from resume
        resume_text = await text_extraction_service.extract_text_from_upload(content, resume.filename)
        
        if not resume_text:
            raise HTTPException(status_code=422, detail="Failed to extract text from resume")
        
        # Analyze resume against job description
        analysis_result = nlp_analysis_service.analyze_resume(resume_text, job_description)
        
        # Add filename to result
        analysis_result["filename"] = resume.filename
        
        # Add combined keywords (both exact matches and semantically similar)
        combined_keywords = list(set(analysis_result["matchedKeywords"] + analysis_result.get("similarKeywords", [])))
        analysis_result["allMatchedKeywords"] = combined_keywords
        
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@router.post("/analyze-batch")
async def analyze_batch(
    resumes: List[UploadFile] = File(...),
    job_description: str = Form(...)
) -> Dict[str, Any]:
    """
    Analyze multiple resumes against a job description
    
    Args:
        resumes: List of resume files (PDF or DOCX)
        job_description: The job description text
        
    Returns:
        Analysis results for each resume
    """
    if not resumes:
        raise HTTPException(status_code=400, detail="No resume files provided")
    
    results = []
    
    for resume in resumes:
        # Validate file type
        file_ext = os.path.splitext(resume.filename)[1].lower()
        if file_ext not in ['.pdf', '.docx']:
            continue  # Skip unsupported files
        
        try:
            # Read file content
            content = await resume.read()
            
            # Extract text from resume
            resume_text = await text_extraction_service.extract_text_from_upload(content, resume.filename)
            
            if not resume_text:
                continue  # Skip files that couldn't be processed
            
            # Analyze resume against job description
            analysis_result = nlp_analysis_service.analyze_resume(resume_text, job_description)
            
            # Add filename to result
            analysis_result["filename"] = resume.filename
            
            # Add combined keywords (both exact matches and semantically similar)
            combined_keywords = list(set(analysis_result["matchedKeywords"] + analysis_result.get("similarKeywords", [])))
            analysis_result["allMatchedKeywords"] = combined_keywords
            
            results.append(analysis_result)
        except Exception as e:
            print(f"Error processing {resume.filename}: {e}")
            # Continue with other files even if one fails
    
    # Sort results by score (highest first)
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {"results": results} 