from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Dict, Any, Optional
from app.services.enhanced_text_extraction import EnhancedTextExtractionService
from app.services.qwen_processing import QwenProcessingService
from app.services.distilbert_extraction import DistilBERTExtractionService
from app.services.scoring_service import ScoringService
from app.services.supabase_storage import SupabaseStorageService
import json
import time
import os
import logging

router = APIRouter()
text_extraction_service = EnhancedTextExtractionService()
qwen_service = QwenProcessingService()
distilbert_service = DistilBERTExtractionService()
scoring_service = ScoringService()
storage_service = SupabaseStorageService()
logger = logging.getLogger(__name__)

@router.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    folder_id: str = Form(...),
    user_id: str = Form(...),
    file_id: Optional[str] = Form(None),
    use_distilbert: bool = Form(False),
    weights: Optional[str] = Form(None),
    store_results: bool = Form(True),
    enable_fallback_extraction: bool = Form(True)
) -> Dict[str, Any]:
    """
    Analyze a single resume against a job description and store results in Supabase
    
    Args:
        resume: The resume file (PDF)
        job_description: The job description text
        folder_id: Folder ID for organization
        user_id: User ID for ownership
        file_id: File ID if the file is already stored in Supabase
        use_distilbert: Whether to use DistilBERT for name/email extraction
        weights: JSON string of weights for different aspects (skills, experience, etc.)
        store_results: Whether to store results in Supabase
        enable_fallback_extraction: Whether to attempt fallback extraction methods for problematic PDFs
        
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
        success, resume_text, metadata = text_extraction_service.extract_text_from_upload(
            content, 
            resume.filename,
            enable_fallback=enable_fallback_extraction
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to extract text from resume: {resume_text}")
        
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
        
        # Step 4: Store results in Supabase if requested
        storage_result = {
            "success": False,
            "message": "Results not stored (storage disabled)"
        }
        
        if store_results:
            try:
                # 4.1 Store or update job description
                job_desc_success, job_desc_message, job_desc_data = await storage_service.store_job_description(
                    job_description, folder_id, user_id
                )
                
                if not job_desc_success:
                    storage_result = {
                        "success": False,
                        "message": f"Failed to store job description: {job_desc_message}"
                    }
                else:
                    # 4.2 Store analysis result
                    job_description_id = job_desc_data["id"]
                    
                    # If file_id is not provided, use the resume filename as a fallback identifier
                    file_identifier = file_id if file_id else resume.filename
                    
                    analysis_success, analysis_message, analysis_data = await storage_service.store_analysis_result(
                        file_identifier, job_description_id, folder_id, user_id, analysis_result
                    )
                    
                    if analysis_success:
                        storage_result = {
                            "success": True,
                            "message": analysis_message,
                            "result_id": analysis_data["id"] if analysis_data else None
                        }
                    else:
                        storage_result = {
                            "success": False,
                            "message": f"Failed to store analysis result: {analysis_message}"
                        }
            except Exception as storage_e:
                logger.error(f"Error in storage operation: {str(storage_e)}")
                storage_result = {
                    "success": False,
                    "message": f"Storage error: {str(storage_e)}"
                }
        
        # Add storage result to the response
        analysis_result["storage"] = storage_result
        
        return analysis_result
    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@router.post("/analyze-batch")
async def analyze_batch(
    resumes: List[UploadFile] = File(...),
    job_description: str = Form(...),
    folder_id: str = Form(...),
    user_id: str = Form(...),
    file_ids: Optional[str] = Form(None),
    use_distilbert: bool = Form(False),
    weights: Optional[str] = Form(None),
    store_results: bool = Form(True),
    enable_fallback_extraction: bool = Form(True)
) -> Dict[str, Any]:
    """
    Analyze multiple resumes against a job description and store results in Supabase
    
    Args:
        resumes: List of resume files (PDF)
        job_description: The job description text
        folder_id: Folder ID for organization
        user_id: User ID for ownership
        file_ids: JSON string with mapping of filenames to file IDs in Supabase
        use_distilbert: Whether to use DistilBERT for name/email extraction
        weights: JSON string of weights for different aspects
        store_results: Whether to store results in Supabase
        
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
    
    # Parse file IDs if provided
    file_id_map = {}
    if file_ids:
        try:
            file_id_map = json.loads(file_ids)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid file_ids format. Must be a valid JSON object.")
    
    # Store job description if storing results
    job_description_id = None
    if store_results:
        try:
            job_desc_success, job_desc_message, job_desc_data = await storage_service.store_job_description(
                job_description, folder_id, user_id
            )
            
            if job_desc_success and job_desc_data:
                job_description_id = job_desc_data["id"]
            else:
                logger.warning(f"Failed to store job description: {job_desc_message}")
        except Exception as e:
            logger.error(f"Error storing job description: {str(e)}")
    
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
            success, resume_text, metadata = text_extraction_service.extract_text_from_upload(
                content,
                resume.filename,
                enable_fallback=enable_fallback_extraction
            )
            
            if not success:
                logger.warning(f"Failed to extract text from {resume.filename}: {resume_text}")
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
            
            # Add detailed analysis explanation if available
            if "analysis" in score_result:
                analysis_result["analysis"] = score_result["analysis"]
            
            # Step 4: Store results in Supabase if requested
            storage_result = {
                "success": False,
                "message": "Results not stored (storage disabled)"
            }
            
            if store_results and job_description_id:
                try:
                    # Get file ID if available
                    file_id = file_id_map.get(resume.filename, resume.filename)
                    
                    # Store analysis result
                    analysis_success, analysis_message, analysis_data = await storage_service.store_analysis_result(
                        file_id, job_description_id, folder_id, user_id, analysis_result
                    )
                    
                    if analysis_success:
                        storage_result = {
                            "success": True,
                            "message": analysis_message,
                            "result_id": analysis_data["id"] if analysis_data else None
                        }
                    else:
                        storage_result = {
                            "success": False,
                            "message": f"Failed to store analysis result: {analysis_message}"
                        }
                except Exception as storage_e:
                    logger.error(f"Error storing analysis result for {resume.filename}: {str(storage_e)}")
                    storage_result = {
                        "success": False,
                        "message": f"Storage error: {str(storage_e)}"
                    }
            
            # Add storage result to the analysis
            analysis_result["storage"] = storage_result
            
            results.append(analysis_result)
        except Exception as e:
            # Log the error but continue processing other files
            logger.error(f"Error processing {resume.filename}: {str(e)}")
            # Add minimal error result to not break frontend expectations
            results.append({
                "filename": resume.filename,
                "error": str(e),
                "score": 0,
                "matchedKeywords": [],
                "missingKeywords": [],
                "storage": {"success": False, "message": f"Processing error: {str(e)}"}
            })
    
    # Sort results by score (highest first)
    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    
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

@router.get("/job-description/{folder_id}")
async def get_job_description(folder_id: str) -> Dict[str, Any]:
    """
    Get the job description for a specific folder
    
    Args:
        folder_id: Folder ID
        
    Returns:
        Job description data or error message
    """
    success, message, job_description = await storage_service.get_job_description(folder_id)
    
    if success:
        return {
            "success": True,
            "job_description": job_description
        }
    else:
        return {
            "success": False,
            "message": message
        }

@router.get("/analysis-results/{folder_id}")
async def get_analysis_results(folder_id: str) -> Dict[str, Any]:
    """
    Get all analysis results for a specific folder
    
    Args:
        folder_id: Folder ID
        
    Returns:
        List of analysis results or error message
    """
    success, message, results = await storage_service.get_analysis_results(folder_id)
    
    if success:
        return {
            "success": True,
            "message": message,
            "results": results
        }
    else:
        return {
            "success": False,
            "message": message,
            "results": []
        }

@router.get("/analysis-result/{result_id}")
async def get_analysis_result(result_id: str) -> Dict[str, Any]:
    """
    Get a specific analysis result
    
    Args:
        result_id: Analysis result ID
        
    Returns:
        Analysis result data or error message
    """
    success, message, result = await storage_service.get_analysis_result(result_id)
    
    if success:
        return {
            "success": True,
            "result": result
        }
    else:
        return {
            "success": False,
            "message": message
        }

@router.delete("/analysis-result/{result_id}")
async def delete_analysis_result(result_id: str) -> Dict[str, Any]:
    """
    Delete a specific analysis result
    
    Args:
        result_id: Analysis result ID
        
    Returns:
        Success message or error message
    """
    success, message = await storage_service.delete_analysis_result(result_id)
    
    return {
        "success": success,
        "message": message
    }

@router.post("/test-extraction")
async def test_extraction(
    resume: UploadFile = File(...),
    enable_fallback_extraction: bool = Form(True)
) -> Dict[str, Any]:
    """
    Test text extraction from a resume file without performing analysis
    
    Args:
        resume: The resume file (PDF)
        enable_fallback_extraction: Whether to attempt fallback extraction methods
        
    Returns:
        Extraction result with status, text sample, and metadata
    """
    # Validate file type
    file_ext = os.path.splitext(resume.filename)[1].lower()
    if file_ext != '.pdf':
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Read file content
        content = await resume.read()
        
        # Extract text using enhanced extraction service
        success, text_or_error, metadata = text_extraction_service.extract_text_from_upload(
            content, 
            resume.filename,
            enable_fallback=enable_fallback_extraction
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to extract text: {text_or_error}")
        
        # For successful extraction, return a sample of the text and full metadata
        text_sample = text_or_error[:1000] + "..." if len(text_or_error) > 1000 else text_or_error
        
        return {
            "success": True,
            "filename": resume.filename,
            "text_sample": text_sample,
            "text_length": len(text_or_error),
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing extraction: {str(e)}") 