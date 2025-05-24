# Enhanced Text Extraction Service

This is an enhanced version of the text extraction service for the Resume ATS Checker application. It provides robust error handling, detailed logging, and metadata extraction for PDF files.

## Features

- PDF text extraction with detailed error handling
- Metadata extraction (file size, page count estimation, etc.)
- Comprehensive logging
- Support for large files
- Performance optimization

## Testing the Enhanced Text Extraction

### Prerequisites

Make sure you have the required dependencies installed:

```bash
pip install pdfminer.six python-dotenv
```

### Running the Test Script

1. Place a sample PDF resume in the project directory or use an existing one.

2. Run the test script with the path to your PDF file:

```bash
# From the project root directory
python backend/test_enhanced_extraction.py path/to/your/resume.pdf
```

For example:

```bash
python backend/test_enhanced_extraction.py samples/resume_sample.pdf
```

3. The script will display:
   - Success/failure status
   - Metadata about the PDF
   - A sample of the extracted text
   - Line and character statistics

### Testing with the API

You can also test the enhanced extraction through the API:

1. Start the FastAPI server:

```bash
cd backend
python run_server.py
```

2. Use a tool like curl, Postman, or the FastAPI Swagger UI (available at http://localhost:8000/docs) to send a POST request to `/api/analyze` with a PDF file and job description.

## Integration with the Resume Analysis Pipeline

The enhanced text extraction service is integrated into the resume analysis pipeline:

1. Text Extraction (PDF only)
2. NLP Analysis (keywords, scoring)
3. Results Storage

## Error Handling

The service handles various error scenarios:
- Malformed PDF files
- Permission issues
- Empty or unreadable PDFs
- Large file handling

## Next Steps

After text extraction, the next step in the pipeline is AI processing with Qwen to extract structured data from the resume text. 