# AI Resume Analysis Integration Guide

This guide explains how to integrate the AI resume analysis functionality with your UI for analyzing files stored in your database.

## Overview

The integration allows users to select files from the UI and analyze them against a job description. The analysis results are then displayed in the UI and stored in the database for future reference.

## Getting Started

### 1. Start the Backend API

First, start the backend API server that handles the resume analysis:

```bash
cd backend
python start_api.py
```

This will start the server at http://localhost:8000 by default.

### 2. Select Files for Analysis

In your UI, users can select one or multiple files that are already stored in the database. Each file should have:
- A unique file ID (UUID)
- A file name
- Be associated with a folder

### 3. Provide a Job Description

Users should be able to enter or edit a job description in the UI. The job description is used to analyze the resume and calculate a match score.

### 4. Start the Analysis

When a user clicks the "Analyze" button:

1. The UI collects the selected file IDs
2. The job description is sent to the backend
3. The backend processes each file and returns the results
4. The results are displayed in the UI and stored in the database

## Technical Details

### Backend API Endpoints

The backend provides two main endpoints for resume analysis:

1. **Analyze from File Upload**:
   ```
   POST /api/analyze
   ```
   This endpoint accepts a direct file upload.

2. **Analyze from Storage**:
   ```
   POST /api/analyze-from-storage
   ```
   This endpoint accepts file IDs for files already stored in the database.

### Using the Storage-based Endpoint

To analyze files that are already stored in the database:

```javascript
// Example code
const fileIds = selectedFiles.map(file => file.id);
const response = await resumeAnalysisService.analyzeFilesFromStorage(
  fileIds,
  jobDescription,
  folderId,
  userId,
  weights
);
```

### Response Format

The API returns an analysis result for each file, containing:

- Match score (percentage)
- Matched keywords
- Missing keywords
- Aspect scores (skills, experience, achievements, education, cultural fit)
- Candidate information (name, email, etc.)
- Recommendations for improvement

### Error Handling

The integration includes robust error handling:

1. If the API is not available, the UI falls back to mock data
2. Connection errors are reported to the user
3. File processing errors are logged and reported
4. Database storage errors are handled gracefully

## Performance Optimizations

The implementation includes several performance optimizations:

1. **Batch Processing**:
   - Multiple files can be analyzed in a single API call
   - Progress is tracked and displayed to the user

2. **Fallback Extraction**:
   - Alternative PDF extraction methods are used if the primary method fails
   - This improves compatibility with various PDF formats

3. **Caching**:
   - Job descriptions are cached for each folder
   - Analysis results are stored in the database to avoid re-analysis

## Troubleshooting

If you encounter issues:

1. **500 Internal Server Errors**:
   - Check the backend console for detailed error messages
   - Ensure the database connection is working
   - Verify that file IDs are valid

2. **File Processing Failures**:
   - Check that the files are valid PDFs
   - Try enabling fallback extraction
   - Verify that the files are accessible in storage

3. **Connection Issues**:
   - Verify the backend API is running
   - Check network connectivity
   - Ensure the API URL is correctly configured in the frontend

## Next Steps

After integrating the AI analysis:

1. Implement sorting and filtering of analysis results
2. Add comparison views for multiple resumes
3. Create detailed candidate profiles with analysis insights
4. Implement PDF annotation and highlighting of key matches 