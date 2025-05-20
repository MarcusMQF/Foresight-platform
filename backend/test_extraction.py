***REMOVED***
import sys
import argparse
from app.services.text_extraction import TextExtractionService

def main():
    parser = argparse.ArgumentParser(description='Test text extraction from PDF and DOCX files')
    parser.add_argument('file_path', help='Path to the PDF or DOCX file')
    args = parser.parse_args()
    
    file_path = args.file_path
    
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.")
        sys.exit(1)
    
    _, file_extension = os.path.splitext(file_path)
    file_extension = file_extension.lower()
    
    if file_extension not in ['.pdf', '.docx']:
        print(f"Error: Unsupported file format '{file_extension}'. Only PDF and DOCX are supported.")
        sys.exit(1)
    
    extraction_service = TextExtractionService()
    
    try:
        print(f"Extracting text from '{file_path}'...")
        text = extraction_service.extract_text(file_path)
        
        if text:
            print("\nExtracted text:")
            print("-" * 50)
            print(text[:1000])  # Print first 1000 characters
            if len(text) > 1000:
                print("...")
                print(f"\nTotal text length: {len(text)} characters")
            print("-" * 50)
        else:
            print("Failed to extract text from the file.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 