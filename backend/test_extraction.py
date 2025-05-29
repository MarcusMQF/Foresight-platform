import sys
from app.services.enhanced_text_extraction import EnhancedTextExtractionService

def main():
    # Initialize the extraction service
    extraction_service = EnhancedTextExtractionService()
    
    # Path to the PDF file
    pdf_path = "../samples/TanZhenYu.pdf"
    
    # Check if the file exists
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' does not exist.")
        sys.exit(1)
    
    print(f"Testing extraction on file: {pdf_path}")
    print("-" * 60)
    
    # Test extraction with primary method
    print("Testing extraction with primary method:")
    success, text_or_error, metadata = extraction_service.extract_text_from_pdf(pdf_path, enable_fallback=False)
    
    if success:
        print(f"Primary extraction successful!")
        print(f"Metadata: {metadata}")
        print(f"Text length: {len(text_or_error)}")
        print(f"First 100 chars: {text_or_error[:100]}...")
    else:
        print(f"Primary extraction failed: {text_or_error}")
    
    print("-" * 60)
    
    # Test extraction with fallback methods
    print("Testing extraction with fallback methods:")
    success, text_or_error, metadata = extraction_service.extract_text_from_pdf(pdf_path, enable_fallback=True)
    
    if success:
        print(f"Extraction successful!")
        print(f"Method used: {metadata.get('extraction_method', 'unknown')}")
        print(f"Status: {metadata.get('extraction_status', 'unknown')}")
        print(f"Metadata: {metadata}")
        print(f"Text length: {len(text_or_error)}")
        print(f"First 100 chars: {text_or_error[:100]}...")
    else:
        print(f"All extraction methods failed: {text_or_error}")

if __name__ == "__main__":
    main() 