# PDF Text Extraction Testing

This project includes an enhanced text extraction service for PDF files. Follow these instructions to test the service with your own PDF files.

## Prerequisites

Make sure you have the following dependencies installed:

```bash
pip install pdfminer.six python-dotenv
```

## Testing with Your Own PDF Files

### Option 1: Using the Simple Test Script

1. Save a PDF file (preferably a resume) that you want to test with.

2. Run the test script with the path to your PDF file:

```bash
python test_pdf_extraction.py path/to/your/resume.pdf
```

For example:
```bash
python test_pdf_extraction.py samples/resume_example.pdf
```

3. The script will display:
   - Success/failure status
   - Metadata about the PDF
   - A sample of the extracted text
   - Line and character statistics

### Option 2: Using the FastAPI Server

1. Start the FastAPI server:

```bash
cd backend
python run_server.py
```

2. Open your web browser and navigate to http://localhost:8000/docs

3. Use the Swagger UI to test the `/api/analyze` endpoint:
   - Click on the "Try it out" button
   - Upload a PDF file
   - Enter a job description
   - Click "Execute"

## Troubleshooting

If you encounter any issues:

1. Make sure the PDF file exists and is accessible
2. Check that the PDF is not password-protected or encrypted
3. Verify that pdfminer.six is properly installed
4. Look for error messages in the console output

## Next Steps

After successfully extracting text from PDF files, the next step in the pipeline is to implement AI processing with Qwen to extract structured data from the resume text. 