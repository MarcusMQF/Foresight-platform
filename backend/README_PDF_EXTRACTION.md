# PDF Extraction in Resume Analysis

This document provides information about how the system handles PDF extraction for resume analysis.

## PDF Extraction Methods

The system uses multiple extraction methods to handle different PDF formats:

1. **Primary Method**: `pdfminer.six` - Used as the primary extraction method for most PDF files
2. **Fallback Methods**:
   - **PyMuPDF (fitz)** - Used when pdfminer fails to extract text properly
   - **pdftotext CLI tool** - Used as a last resort if both of the above methods fail

## Error Handling

PDFs can be complex and may have various issues:
- Protected/encrypted PDFs
- Scanned documents without OCR
- Corrupted PDF structure
- Non-standard PDF formats
- PDF files with unusual layouts

The system implements a robust fallback mechanism to handle these issues:

1. First attempts extraction with the primary method
2. If that fails, automatically falls back to alternative methods
3. Returns extraction status information to the frontend
4. Provides specific error messages when no extraction method works

## Frontend Integration

The frontend handles PDF extraction issues by:
1. Displaying appropriate error messages for completely failed extractions
2. Warning users when fallback methods were used (text quality may be reduced)
3. Showing recommendations to provide better quality PDFs when needed

## Improving PDF Extraction Results

For best results:
- Use digital PDFs (not scanned)
- Ensure PDFs are not password protected
- Use standard PDF formats
- For scanned documents, apply OCR before uploading

## Adding New Extraction Methods

To add a new extraction method:
1. Implement the method in `enhanced_text_extraction.py` in the `_try_fallback_extraction` method
2. Add any required dependencies to `requirements.txt`
3. Ensure proper error handling and logging 