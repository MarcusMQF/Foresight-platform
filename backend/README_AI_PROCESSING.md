# AI Processing Pipeline for Resume Analysis

This document explains how to use the AI processing pipeline for resume analysis in the ATS Checker application.

## Overview

The AI processing pipeline consists of three main components:

1. **Text Extraction**: Extract text from PDF files using pdfminer.six
2. **AI Processing**: Process the text using Qwen and DistilBERT models to extract structured information
3. **Scoring**: Calculate match scores between resumes and job descriptions

## Prerequisites

Make sure you have the required dependencies installed:

```bash
pip install -r requirements.txt
```

You'll also need to download the SpaCy model:

```bash
python -m spacy download en_core_web_sm
```

## Models Used

### Qwen

We use Qwen for general text understanding and extraction. The default model is `Qwen/Qwen1.5-7B-Chat`, but you can change it in the `QwenProcessingService` class.

### DistilBERT

We use DistilBERT for name/email extraction and semantic similarity calculations. The default model is `distilbert-base-uncased`, but you can change it in the `DistilBERTExtractionService` class.

## Testing the AI Processing Pipeline

You can test the AI processing pipeline using the `test_ai_processing.py` script:

```bash
python test_ai_processing.py path/to/resume.pdf path/to/job_description.txt
```

Options:
- `--use_distilbert`: Use DistilBERT for name/email extraction (default: False)
- `--output`: Path to save the output JSON (optional)

Example:
```bash
python test_ai_processing.py samples/resume_example.pdf backend/sample_job_description.txt --use_distilbert --output results.json
```

## API Endpoints

The AI processing pipeline is exposed through the following API endpoints:

### Analyze a Single Resume

```
POST /api/analyze
```

Parameters:
- `resume`: The resume file (PDF)
- `job_description`: The job description text
- `use_distilbert`: Whether to use DistilBERT for name/email extraction (default: False)
- `weights`: JSON string of weights for different aspects (optional)

### Analyze Multiple Resumes

```
POST /api/analyze-batch
```

Parameters:
- `resumes`: List of resume files (PDF)
- `job_description`: The job description text
- `use_distilbert`: Whether to use DistilBERT for name/email extraction (default: False)
- `weights`: JSON string of weights for different aspects (optional)

### Get Default Weights

```
GET /api/weights/default
```

Returns the default weights for different aspects of the match.

## Customizing Weights

You can customize the weights for different aspects of the match by providing a JSON string:

```json
{
  "skills": 0.4,
  "experience": 0.3,
  "achievements": 0.2,
  "education": 0.05,
  "culturalFit": 0.05
}
```

## Fine-tuning DistilBERT

To improve name and email extraction, you can fine-tune DistilBERT with your own dataset. This is a placeholder in the current implementation, but you can implement it by:

1. Collecting a dataset of resume texts with labeled names and emails
2. Implementing the `fine_tune_for_name_extraction` method in the `DistilBERTExtractionService` class
3. Training the model on your dataset
4. Saving the fine-tuned model

## Next Steps

After implementing the AI processing pipeline, the next step is to integrate it with the Supabase database to store the analysis results and job descriptions.

## Recent Improvements

We've made several enhancements to the AI processing pipeline:

### 1. Improved Name Extraction
- Enhanced name extraction algorithms using intelligent pattern recognition
- Multiple detection strategies (regex patterns, position-based heuristics, NLP-based)
- Better filtering to avoid confusing headers or titles with names

### 2. Enhanced Scoring Algorithm
- Recalibrated scoring to provide more balanced and encouraging results
- Added minimum thresholds so scores aren't unnecessarily low
- Implemented skill-based boosting for key matches
- Better weighting system that rewards partial matches

### 3. Detailed Results
- Added comprehensive analysis explanation in plain language
- Included processing time metrics for performance monitoring
- Enhanced job description analysis with top keywords
- Structured recommendations for resume improvement

### 4. Performance Optimization
- Switched to lightweight models that run faster without reducing accuracy
- Implemented multi-stage extraction that tries faster methods first
- Better section detection with improved pattern recognition
- More efficient keyword extraction algorithms

### 5. Error Handling & Resilience
- Multiple fallback mechanisms when primary extraction fails
- Better validation of extracted data
- Comprehensive edge case handling 