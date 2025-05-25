***REMOVED***
import tempfile
import logging
import subprocess
import platform
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
    
    def extract_text_from_pdf(self, file_path: str, enable_fallback: bool = True) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Extract text from a PDF file with robust error handling
        
        Args:
            file_path: Path to the PDF file
            enable_fallback: Whether to try fallback methods if primary extraction fails
            
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
                logger.warning(f"No text extracted from {os.path.basename(file_path)} with primary method")
                
                # Try fallback if enabled
                if enable_fallback:
                    return self._try_fallback_extraction(file_path, file_size)
                
                return False, "No text could be extracted from the PDF file", None
            
            # Create metadata
            metadata = {
                "file_name": os.path.basename(file_path),
                "file_size_mb": file_size,
                "text_length": len(text),
                "pages": self._estimate_page_count(text),
                "extraction_method": "pdfminer",
                "extraction_status": "success"
            }
            
            logger.info(f"Successfully extracted {len(text)} characters from {os.path.basename(file_path)}")
            return True, text, metadata
            
        except PDFSyntaxError as e:
            error_msg = f"PDF syntax error: {str(e)}"
            logger.error(error_msg)
            
            # Try fallback if enabled
            if enable_fallback:
                logger.info("Attempting fallback extraction methods...")
                return self._try_fallback_extraction(file_path, os.path.getsize(file_path) / (1024 * 1024))
            
            return False, error_msg, None
        except PermissionError:
            error_msg = "Permission denied when accessing the file"
            logger.error(error_msg)
            return False, error_msg, None
        except Exception as e:
            error_msg = f"Error extracting text from PDF: {str(e)}"
            logger.error(error_msg)
            
            # Try fallback if enabled
            if enable_fallback:
                logger.info("Attempting fallback extraction methods due to exception...")
                return self._try_fallback_extraction(file_path, os.path.getsize(file_path) / (1024 * 1024))
            
            return False, error_msg, None
    
    def _try_fallback_extraction(self, file_path: str, file_size: float) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Attempt alternative text extraction methods when primary method fails
        
        Args:
            file_path: Path to the PDF file
            file_size: File size in MB
            
        Returns:
            Tuple containing:
            - Success flag (bool)
            - Extracted text or error message (str)
            - Metadata dictionary (Dict) or None if extraction failed
        """
        text = ""
        method_used = ""
        
        # Try Fallback Method 1: PyMuPDF (if available)
        try:
            import fitz  # PyMuPDF
            logger.info("Trying fallback extraction with PyMuPDF...")
            
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
            
            if text and len(text.strip()) > 0:
                method_used = "pymupdf"
                logger.info(f"Successfully extracted {len(text)} characters with PyMuPDF")
            else:
                logger.warning("PyMuPDF extraction returned empty text")
                text = ""
        except ImportError:
            logger.warning("PyMuPDF not available, skipping this fallback method")
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed: {str(e)}")
            text = ""
        
        # Try Fallback Method 2: pdftotext command line tool (if available)
        if not text:
            try:
                # Check if pdftotext is available
                check_cmd = "where pdftotext" if platform.system() == "Windows" else "which pdftotext"
                subprocess.check_output(check_cmd, shell=True)
                
                logger.info("Trying fallback extraction with pdftotext command line tool...")
                
                # Create a temporary file for the text output
                with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as temp_file:
                    temp_output_path = temp_file.name
                
                # Run pdftotext command
                cmd = f"pdftotext -layout \"{file_path}\" \"{temp_output_path}\""
                subprocess.run(cmd, shell=True, check=True)
                
                # Read the extracted text
                with open(temp_output_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
                
                # Clean up
                os.unlink(temp_output_path)
                
                if text and len(text.strip()) > 0:
                    method_used = "pdftotext"
                    logger.info(f"Successfully extracted {len(text)} characters with pdftotext")
                else:
                    logger.warning("pdftotext extraction returned empty text")
                    text = ""
            except (subprocess.SubprocessError, FileNotFoundError):
                logger.warning("pdftotext command line tool not available or failed")
                text = ""
            except Exception as e:
                logger.warning(f"pdftotext extraction failed: {str(e)}")
                text = ""
        
        # If we have text from any method, return success
        if text and len(text.strip()) > 0:
            # Create metadata
            metadata = {
                "file_name": os.path.basename(file_path),
                "file_size_mb": file_size,
                "text_length": len(text),
                "pages": self._estimate_page_count(text),
                "extraction_method": method_used,
                "extraction_status": "fallback"
            }
            
            return True, text, metadata
        
        # All fallback methods failed
        return False, "Failed to extract text using all available methods", None
    
    def extract_text_from_upload(self, file_content: bytes, filename: str, enable_fallback: bool = True) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Extract text from uploaded PDF file content
        
        Args:
            file_content: Binary content of the uploaded file
            filename: Original filename
            enable_fallback: Whether to try fallback methods if primary extraction fails
            
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
                success, text_or_error, metadata = self.extract_text_from_pdf(temp_file_path, enable_fallback)
                
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