import sys
import argparse

# Add the parent directory to the Python path so we can import the app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.services.enhanced_text_extraction import EnhancedTextExtractionService

def main():
    parser = argparse.ArgumentParser(description='Test enhanced PDF text extraction')
    parser.add_argument('file_path', help='Path to the PDF file')
    args = parser.parse_args()
    
    file_path = args.file_path
    
    # Validate file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.")
        sys.exit(1)
    
    # Validate file is PDF
    if not file_path.lower().endswith('.pdf'):
        print(f"Error: File '{file_path}' is not a PDF file.")
        sys.exit(1)
    
    # Initialize the enhanced text extraction service
    extraction_service = EnhancedTextExtractionService()
    
    print(f"\n{'='*50}")
    print(f"Testing Enhanced Text Extraction on: {os.path.basename(file_path)}")
    print(f"{'='*50}\n")
    
    # Extract text from the PDF
    success, text_or_error, metadata = extraction_service.extract_text_from_pdf(file_path)
    
    if success:
        print(f"✅ Text extraction successful!")
        
        # Print metadata
        print("\nMetadata:")
        print(f"  File name: {metadata['file_name']}")
        print(f"  File size: {metadata['file_size_mb']:.2f} MB")
        print(f"  Text length: {metadata['text_length']} characters")
        print(f"  Estimated pages: {metadata['pages']}")
        
        # Print sample of extracted text
        print("\nExtracted Text Sample (first 500 characters):")
        print("-" * 50)
        print(text_or_error[:500] + ("..." if len(text_or_error) > 500 else ""))
        print("-" * 50)
        
        # Print character count by line
        lines = text_or_error.split('\n')
        print(f"\nFound {len(lines)} lines of text")
        print(f"Average characters per line: {sum(len(line) for line in lines) / max(1, len(lines)):.1f}")
        
    else:
        print(f"❌ Text extraction failed: {text_or_error}")
    
    print(f"\n{'='*50}\n")

if __name__ == "__main__":
    main() 