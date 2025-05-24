***REMOVED***
import tempfile
import logging
from typing import Optional, Dict, Any, Tuple
from pdfminer.high_level import extract_text
from pdfminer.pdfparser import PDFSyntaxError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnhancedTextExtractionService:
    """Enhanced service for extracting text from PDF files with robust error handling"""
    
    def extract_text_from_pdf(self, file_path: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Extract text from a PDF file with robust error handling
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Extracted text or error message (str)
            - Metadata dictionary (Dict) or None if extraction failed
        """
        logger.info(f"Extracting text from PDF: {os.path.basename(file_path)}")
        
        try:
            # Get file size for logging
            file_size = os.path.getsize(file_path) / (1024 * 1024)  # Convert to MB
            logger.info(f"File size: {file_size:.2f} MB")
            
            # Check if file is too large (over 50MB)
            if file_size > 50:
                logger.warning(f"File is very large ({file_size:.2f} MB), extraction may take longer")
            
            # Extract text using pdfminer.six
            text = extract_text(file_path)
            
            # Check if text was successfully extracted
            if not text or len(text.strip()) == 0:
                logger.warning(f"No text extracted from {os.path.basename(file_path)}")
                return False, "No text could be extracted from the PDF file", None
            
            # Create metadata
            metadata = {
                "file_name": os.path.basename(file_path),
                "file_size_mb": file_size,
                "text_length": len(text),
                "pages": self._estimate_page_count(text)
            }
            
            logger.info(f"Successfully extracted {len(text)} characters from {os.path.basename(file_path)}")
            return True, text, metadata
            
        except PDFSyntaxError as e:
            error_msg = f"PDF syntax error: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, None
        except PermissionError:
            error_msg = "Permission denied when accessing the file"
            logger.error(error_msg)
            return False, error_msg, None
        except Exception as e:
            error_msg = f"Error extracting text from PDF: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, None
    
    def extract_text_from_upload(self, file_content: bytes, filename: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Extract text from uploaded PDF file content
        
        Args:
            file_content: Binary content of the uploaded file
            filename: Original filename
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Extracted text or error message (str)
            - Metadata dictionary (Dict) or None if extraction failed
        """
        logger.info(f"Processing uploaded file: {filename}")
        
        # Check file extension
        if not filename.lower().endswith('.pdf'):
            error_msg = f"Unsupported file format: {os.path.splitext(filename)[1]}. Only PDF files are supported."
            logger.error(error_msg)
            return False, error_msg, None
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            try:
                # Write content to temporary file
                temp_file.write(file_content)
                temp_file_path = temp_file.name
                
                # Extract text from the temporary file
                success, text_or_error, metadata = self.extract_text_from_pdf(temp_file_path)
                
                # If successful, add original filename to metadata
                if success and metadata:
                    metadata["original_filename"] = filename
                
                return success, text_or_error, metadata
                
            except Exception as e:
                error_msg = f"Error processing uploaded file: {str(e)}"
                logger.error(error_msg)
                return False, error_msg, None
            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
    
    def _estimate_page_count(self, text: str) -> int:
        """
        Estimate the number of pages in the PDF based on text content
        This is a rough estimate as pdfminer.six extract_text doesn't provide page info directly
        
        Args:
            text: Extracted text
            
        Returns:
            Estimated page count
        """
        # Rough estimate: average 3000 characters per page
        # This is just an approximation and may not be accurate
        chars_per_page = 3000
        return max(1, round(len(text) / chars_per_page)) 