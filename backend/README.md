# Resume Analysis Backend

This is the backend service for the Resume ATS Checker application. It provides APIs for extracting text from resumes (PDF and DOCX) and analyzing them against job descriptions.

## API Endpoints

- `POST /api/analyze`: Analyze a single resume against a job description
- `POST /api/analyze-batch`: Analyze multiple resumes against a job description

## Features

- Text extraction from PDF and DOCX files
- Resume analysis against job descriptions
- Keyword matching and scoring
- Recommendations for resume improvement

# Resume ATS Testing Tool

This tool allows you to test the AI-powered resume analysis capabilities in a local environment.

## Setup

1. Make sure you have all the required Python dependencies installed:
   ```
   pip install -r requirements.txt
   ```

2. Ensure your resume file is in PDF format

## Basic Usage

To analyze a resume against a job description:

```bash
python test_ai_processing.py path/to/resume.pdf path/to/job_description.txt
```

## Using Custom Metric Weights

You can customize the importance of different evaluation aspects by specifying weights:

### Command Line Arguments

```bash
python test_ai_processing.py path/to/resume.pdf path/to/job_description.txt \
  --skills_weight 0.5 \
  --experience_weight 0.3 \
  --achievements_weight 0.1 \
  --education_weight 0.05 \
  --cultural_fit_weight 0.05
```

### Using a JSON Configuration File

Create a JSON file with your custom weights:

```json
{
  "skills": 0.5,
  "experience": 0.3,
  "achievements": 0.1,
  "education": 0.05,
  "culturalFit": 0.05
}
```

Then use it with:

```bash
python test_ai_processing.py path/to/resume.pdf path/to/job_description.txt \
  --weights_json path/to/weights.json
```

A sample weights file is provided at `sample_weights.json`.

## Additional Options

- `--use_distilbert`: Use DistilBERT for name/email extraction (more accurate but slower)
- `--output results.json`: Save detailed analysis results to a JSON file

## Example

```bash
python test_ai_processing.py ../samples/Marcus_Resume.pdf ../job_description.txt \
  --weights_json sample_weights.json \
  --output analysis_results.json
```

This will analyze Marcus's resume against the job description, using custom weights from the JSON file, and save the detailed results to analysis_results.json.

## Weight Categories Explained

- **skills** (default: 0.4): How well the candidate's skills match the job requirements
- **experience** (default: 0.3): Relevance and depth of work experience
- **achievements** (default: 0.2): Notable accomplishments and awards
- **education** (default: 0.05): Academic qualifications and educational background
- **culturalFit** (default: 0.05): How well the candidate may fit with company culture 