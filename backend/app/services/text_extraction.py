***REMOVED***
import tempfile
from typing import Optional

# For PDF extraction
try:
    from pdfminer.high_level import extract_text as pdf_extract_text
except ImportError:
    pdf_extract_text = None

# For DOCX extraction
try:
    import docx
except ImportError:
    docx = None

class TextExtractionService:
    """Service for extracting text from different document formats"""
    
    def extract_text(self, file_path: str) -> Optional[str]:
        """
        Extract text from a file based on its extension
        
        Args:
            file_path: Path to the file
            
        Returns:
            Extracted text or None if extraction failed
        """
        _, file_extension = os.path.splitext(file_path)
        file_extension = file_extension.lower()
        
        if file_extension == '.pdf':
            return self._extract_from_pdf(file_path)
        elif file_extension == '.docx':
            return self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def _extract_from_pdf(self, file_path: str) -> Optional[str]:
        """Extract text from PDF file"""
        if pdf_extract_text is None:
            raise ImportError("pdfminer.six is not installed. Install it with 'pip install pdfminer.six'")
        
        try:
            text = pdf_extract_text(file_path)
            return text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return None
    
    def _extract_from_docx(self, file_path: str) -> Optional[str]:
        """Extract text from DOCX file"""
        if docx is None:
            raise ImportError("python-docx is not installed. Install it with 'pip install python-docx'")
        
        try:
            doc = docx.Document(file_path)
            full_text = []
            
            # Extract text from paragraphs
            for para in doc.paragraphs:
                full_text.append(para.text)
            
            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        full_text.append(cell.text)
            
            return '\n'.join(full_text)
        except Exception as e:
            print(f"Error extracting text from DOCX: {e}")
            return None
    
    async def extract_text_from_upload(self, file_content: bytes, filename: str) -> Optional[str]:
        """
        Extract text from an uploaded file
        
        Args:
            file_content: Binary content of the file
            filename: Name of the file with extension
            
        Returns:
            Extracted text or None if extraction failed
        """
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Extract text from the temporary file
            text = self.extract_text(temp_file_path)
            return text
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path) 