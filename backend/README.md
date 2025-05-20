# Resume ATS Checker Backend

This is the backend service for the Resume ATS Checker application. It provides APIs for extracting text from resumes (PDF and DOCX) and analyzing them against job descriptions.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Download the SpaCy model:
   ```
   python -m spacy download en_core_web_sm
   ```

## Running the Server

Start the FastAPI server:
```
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## API Endpoints

- `POST /api/analyze`: Analyze a single resume against a job description
- `POST /api/analyze-batch`: Analyze multiple resumes against a job description

## Features

- Text extraction from PDF and DOCX files
- Resume analysis against job descriptions
- Keyword matching and scoring
- Recommendations for resume improvement 