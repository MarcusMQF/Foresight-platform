# HR Data and Candidate Information Integration Guide

This guide explains how to integrate HR assessment data and candidate information into the resume analysis system.

## Database Updates

The system has been updated to store two new types of data:

1. **HR Data** - Contains HR analysis, assessment, and recommendations
2. **Candidate Information** - Contains parsed details about the candidate from their resume

Both are stored as JSONB columns in the `analysis_results` table:
- `hr_data`: Stores HR-related assessments and recommendations
- `candidate_info`: Stores structured information extracted from the resume

## Data Structure

### HR Data Format

The `hr_data` JSONB column contains the following structure:

```json
{
  "hrAnalysis": {
    "overall": "String assessment of overall candidacy",
    "technical": "String assessment of technical skills",
    "cultural": "String assessment of cultural fit",
    "experience": "String assessment of relevant experience"
  },
  "hrAssessment": {
    "status": "qualified|partially_qualified|not_qualified",
    "rating": 1-5 numeric rating,
    "strengths": ["Array of strengths as strings"],
    "weaknesses": ["Array of weaknesses as strings"]
  },
  "hrRecommendations": [
    "Array of recommendations as strings"
  ]
}
```

### Candidate Information Format

The `candidate_info` JSONB column contains the following structure:

```json
{
  "name": "Candidate's full name",
  "email": "Contact email",
  "phone": "Contact phone number",
  "location": "Candidate's location",
  "skills": ["Array of skills extracted from resume"],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "period": "Employment period",
      "description": "Job description"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "Educational institution",
      "year": "Graduation year"
    }
  ]
}
```

## Frontend Integration

The system automatically generates and displays both HR data and candidate information in the Resume Details view:

1. **HR Assessment Panel**: Shows analysis, assessment status, strengths, weaknesses, and recommendations
2. **Candidate Information Panel**: Shows extracted candidate details like contact info, skills, experience, and education

## Programmatic Usage

### Storing Data

To programmatically store HR data and candidate information:

```javascript
const { data, error } = await supabase
  .from('analysis_results')
  .update({
    hr_data: hrDataObject,
    candidate_info: candidateInfoObject
  })
  .eq('id', analysisResultId);
```

### Retrieving Data

To retrieve HR data and candidate information:

```javascript
const { data, error } = await supabase
  .from('analysis_results')
  .select('id, hr_data, candidate_info')
  .eq('id', analysisResultId)
  .single();

// Access the data
const hrData = data.hr_data;
const candidateInfo = data.candidate_info;
```

## Automatic Generation

The system automatically generates HR data and candidate information during resume analysis. If any data is missing, it will:

1. Generate the missing data using AI-powered analysis
2. Store the generated data in the database
3. Display the data in the UI

## API Integration

When integrating with the analysis API, you can include both HR data and candidate information in your response:

```json
{
  "score": 85.5,
  "matchedKeywords": ["Array of matched keywords"],
  "missingKeywords": ["Array of missing keywords"],
  "hrData": { /* HR data object as described above */ },
  "candidateInfo": { /* Candidate info object as described above */ }
}
```

The system will store both types of data appropriately in the database.

## Testing

You can use the provided `test-hr-data.js` script to test storing and retrieving both HR data and candidate information. 