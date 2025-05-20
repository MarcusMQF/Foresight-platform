# Resume ATS Checker Backend

This is the backend for the Resume ATS Checker application. It provides API endpoints to analyze resumes against job descriptions for ATS compatibility.

## Features

- Text extraction from PDF and DOCX files
- Keyword extraction using spaCy NLP
- Semantic similarity calculation between resumes and job descriptions
- Recommendations generation for resume improvement
- Support for both single and batch resume analysis

## Setup

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Install the required dependencies:

```bash
pip install fastapi uvicorn python-multipart pdf2text python-docx spacy scikit-learn
```

2. Download the spaCy language model:

```bash
python -m spacy download en_core_web_md
```

### Running the Server

To start the API server, run:

```bash
python run_api.py
```

The server will be available at http://localhost:8000, and the API documentation can be accessed at http://localhost:8000/docs.

## API Endpoints

- `POST /api/analyze`: Analyze a single resume against a job description
- `POST /api/analyze-batch`: Analyze multiple resumes against a job description

## Integrating with Frontend

The frontend communicates with this backend through the ResumeAnalysisService, which sends requests to these API endpoints.

## Development

For development, the server runs with auto-reload enabled, so any changes to the code will automatically restart the server. 