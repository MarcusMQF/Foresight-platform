from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Dict, Any, Optional
from app.services.enhanced_text_extraction import EnhancedTextExtractionService
from app.services.qwen_processing import QwenProcessingService
from app.services.distilbert_extraction import DistilBERTExtractionService
from app.services.scoring_service import ScoringService
***REMOVED***
import json
import time

router = APIRouter()
text_extraction_service = EnhancedTextExtractionService()
qwen_service = QwenProcessingService()
distilbert_service = DistilBERTExtractionService()
scoring_service = ScoringService()

@router.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    use_distilbert: bool = Form(False),
    weights: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Analyze a single resume against a job description
    
    Args:
        resume: The resume file (PDF)
        job_description: The job description text
        use_distilbert: Whether to use DistilBERT for name/email extraction
        weights: JSON string of weights for different aspects (skills, experience, etc.)
        
    Returns:
        Analysis result with score, matched keywords, etc.
    """
    # Validate file type
    file_ext = os.path.splitext(resume.filename)[1].lower()
    if file_ext != '.pdf':
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Parse weights if provided
    weight_dict = None
    if weights:
        try:
            weight_dict = json.loads(weights)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid weights format. Must be a valid JSON object.")
    
    try:
        # Read file content
        content = await resume.read()
        
        # Step 1: Extract text from resume using enhanced extraction service
        success, resume_text, metadata = text_extraction_service.extract_text_from_upload(content, resume.filename)
        
        if not success:
            raise HTTPException(status_code=422, detail=f"Failed to extract text from resume: {resume_text}")
        
        # Step 2: AI Processing - Extract candidate information
        candidate_info = {}
        processing_method = "DistilBERT + Qwen" if use_distilbert else "Qwen"
        processing_start = time.time()
        
        if use_distilbert:
            # Use DistilBERT for name/email extraction
            distilbert_info = distilbert_service.extract_name_and_email(resume_text)
            
            # Use Qwen for other information
            candidate_info = qwen_service.extract_candidate_info(resume_text)
            
            # Only update with DistilBERT results if they were found
            if distilbert_info["name"]:
                candidate_info["name"] = distilbert_info["name"]
            if distilbert_info["email"]:
                candidate_info["email"] = distilbert_info["email"]
        else:
            # Use Qwen for all information extraction
            candidate_info = qwen_service.extract_candidate_info(resume_text)
        
        processing_time = time.time() - processing_start
        
        # Step 3: Calculate match score
        scoring_start = time.time()
        score_result = scoring_service.calculate_match_score(candidate_info, job_description, weight_dict)
        scoring_time = time.time() - scoring_start
        
        # Calculate most common skills in job description (for context)
        job_keywords = qwen_service._extract_keywords_regex(job_description)
        
        # Prepare response with more detailed information
        analysis_result = {
            "filename": resume.filename,
            "metadata": metadata,
            "processingInfo": {
                "method": processing_method,
                "processingTimeSeconds": round(processing_time, 2),
                "scoringTimeSeconds": round(scoring_time, 2),
                "totalTimeSeconds": round(processing_time + scoring_time, 2)
            },
            "candidateInfo": candidate_info,
            "jobAnalysis": {
                "keywordCount": len(job_keywords),
                "topKeywords": job_keywords[:10] if len(job_keywords) > 10 else job_keywords
            },
            "score": score_result["score"],
            "matchedKeywords": score_result["matchedKeywords"],
            "missingKeywords": score_result["missingKeywords"],
            "aspectScores": score_result["aspectScores"],
            "achievementBonus": score_result["achievementBonus"],
            "recommendations": score_result["recommendations"]
        }
        
        # Add detailed analysis explanation if available
        if "analysis" in score_result:
            analysis_result["analysis"] = score_result["analysis"]
        
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@router.post("/analyze-batch")
async def analyze_batch(
    resumes: List[UploadFile] = File(...),
    job_description: str = Form(...),
    use_distilbert: bool = Form(False),
    weights: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Analyze multiple resumes against a job description
    
    Args:
        resumes: List of resume files (PDF)
        job_description: The job description text
        use_distilbert: Whether to use DistilBERT for name/email extraction
        weights: JSON string of weights for different aspects
        
    Returns:
        Analysis results for each resume
    """
    if not resumes:
        raise HTTPException(status_code=400, detail="No resume files provided")
    
    # Parse weights if provided
    weight_dict = None
    if weights:
        try:
            weight_dict = json.loads(weights)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid weights format. Must be a valid JSON object.")
    
    results = []
    
    for resume in resumes:
        # Validate file type
        file_ext = os.path.splitext(resume.filename)[1].lower()
        if file_ext != '.pdf':
            continue  # Skip non-PDF files
        
        try:
            # Read file content
            content = await resume.read()
            
            # Step 1: Extract text from resume
            success, resume_text, metadata = text_extraction_service.extract_text_from_upload(content, resume.filename)
            
            if not success:
                continue  # Skip files that couldn't be processed
            
            # Step 2: AI Processing - Extract candidate information
            candidate_info = {}
            
            if use_distilbert:
                # Use DistilBERT for name/email extraction
                distilbert_info = distilbert_service.extract_name_and_email(resume_text)
                
                # Use Qwen for other information
                candidate_info = qwen_service.extract_candidate_info(resume_text)
                
                # Only update with DistilBERT results if they were found
                if distilbert_info["name"]:
                    candidate_info["name"] = distilbert_info["name"]
                if distilbert_info["email"]:
                    candidate_info["email"] = distilbert_info["email"]
            else:
                # Use Qwen for all information extraction
                candidate_info = qwen_service.extract_candidate_info(resume_text)
            
            # Step 3: Calculate match score
            score_result = scoring_service.calculate_match_score(candidate_info, job_description, weight_dict)
            
            # Combine results
            analysis_result = {
                "filename": resume.filename,
                "metadata": metadata,
                "candidateInfo": candidate_info,
                "score": score_result["score"],
                "matchedKeywords": score_result["matchedKeywords"],
                "missingKeywords": score_result["missingKeywords"],
                "aspectScores": score_result["aspectScores"],
                "achievementBonus": score_result["achievementBonus"],
                "recommendations": score_result["recommendations"]
            }
            
            results.append(analysis_result)
        except Exception as e:
            # Log the error but continue processing other files
            print(f"Error processing {resume.filename}: {e}")
    
    # Sort results by score (highest first)
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {"results": results}

@router.get("/weights/default")
async def get_default_weights() -> Dict[str, float]:
    """
    Get the default weights for different aspects of the match
    
    Returns:
        Dictionary with default weights
    """
    return {
        "skills": 0.4,
        "experience": 0.3,
        "achievements": 0.2,
        "education": 0.05,
        "culturalFit": 0.05
    } 