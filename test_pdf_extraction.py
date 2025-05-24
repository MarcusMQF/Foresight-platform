***REMOVED***
import sys
import argparse

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from backend.app.services.enhanced_text_extraction import EnhancedTextExtractionService

def main():
    parser = argparse.ArgumentParser(description='Test PDF text extraction with the enhanced service')
    parser.add_argument('pdf_file', help='Path to the PDF file to extract text from')
    args = parser.parse_args()
    
    pdf_path = args.pdf_file
    
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' does not exist")
        sys.exit(1)
    
    if not pdf_path.lower().endswith('.pdf'):
        print(f"Error: File '{pdf_path}' is not a PDF file")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"Testing PDF Text Extraction on: {os.path.basename(pdf_path)}")
    print(f"{'='*60}")
    
    # Initialize the enhanced text extraction service
    extraction_service = EnhancedTextExtractionService()
    
    # Extract text from the PDF
    success, text_or_error, metadata = extraction_service.extract_text_from_pdf(pdf_path)
    
    if success:
        print(f"\n✅ Text extraction successful!")
        
        # Print metadata
        print("\nMetadata:")
        print(f"  File name: {metadata['file_name']}")
        print(f"  File size: {metadata['file_size_mb']:.2f} MB")
        print(f"  Text length: {metadata['text_length']} characters")
        print(f"  Estimated pages: {metadata['pages']}")
        
        # Print sample of extracted text
        print("\nExtracted Text Sample (first 300 characters):")
        print("-" * 60)
        print(text_or_error[:300] + ("..." if len(text_or_error) > 300 else ""))
        print("-" * 60)
        
        # Print character count by line
        lines = text_or_error.split('\n')
        print(f"\nFound {len(lines)} lines of text")
        print(f"Average characters per line: {sum(len(line) for line in lines) / max(1, len(lines)):.1f}")
    else:
        print(f"\n❌ Text extraction failed: {text_or_error}")
    
    print(f"\n{'='*60}")

if __name__ == "__main__":
    main() 