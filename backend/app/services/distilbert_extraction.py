import re
import logging
***REMOVED***
from typing import Dict, List, Any, Optional, Tuple
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from transformers import DistilBertTokenizer, DistilBertForTokenClassification
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DistilBERTExtractionService:
    """Service for extracting name and email from resume text using DistilBERT"""
    
    def __init__(self, model_name: str = "distilbert-base-uncased"):
        """
        Initialize the DistilBERT extraction service
        
        Args:
            model_name: Name of the DistilBERT model to use
        """
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.sentence_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"DistilBERTExtractionService initialized with model: {model_name}, using device: {self.device}")
    
    def _load_models(self):
        """Load the DistilBERT models if not already loaded"""
        if self.tokenizer is None or self.model is None:
            try:
                logger.info(f"Loading DistilBERT tokenizer: {self.model_name}")
                self.tokenizer = DistilBertTokenizer.from_pretrained(self.model_name)
                
                logger.info(f"Loading SentenceTransformer model")
                self.sentence_model = SentenceTransformer('distilbert-base-nli-mean-tokens')
                
                logger.info("Successfully loaded DistilBERT models")
            except Exception as e:
                logger.error(f"Error loading DistilBERT models: {str(e)}")
                raise
    
    def extract_name_and_email(self, text: str) -> Dict[str, str]:
        """
        Extract name and email from resume text using intelligent heuristics
        
        Args:
            text: Resume text
            
        Returns:
            Dictionary with name and email
        """
        logger.info("Extracting name and email from resume text")
        
        # First try extracting using regex pattern (best precision)
        name = self._extract_name_regex(text)
        
        # If regex fails, try location-based heuristics
        if not name:
            name = self._extract_name_by_position(text)
        
        # If still no name found, try NLP-based extraction as last resort
        if not name:
            name = self._extract_name_distilbert(text)
        
        # Extract email using regex
        email = self._extract_email_regex(text)
        
        return {
            "name": name,
            "email": email
        }
    
    def _extract_name_regex(self, text: str) -> str:
        """Extract name using regex patterns with higher precision"""
        # First 500 characters often contain the header/name
        first_part = text[:500]
        
        # Patterns for finding names using position and format clues
        name_patterns = [
            # Name on its own line at the start (most resumes begin this way)
            r"^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*$",
            r"^\s*([A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)?)\s*$",  # ALL CAPS NAME
            
            # Name with labeled indicator
            r"(?:Name|Full Name)[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
            
            # Name with contact info nearby (common resume pattern)
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*[\n\r](?:[^\n\r]{0,60}@|[^\n\r]{0,60}\+\d)",
            
            # Name in context of introduction
            r"(?:I am|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})"
        ]
        
        for pattern in name_patterns:
            matches = re.finditer(pattern, first_part, re.MULTILINE)
            for match in matches:
                candidate = match.group(1).strip()
                
                # Validate format: only words with capitals, 2-4 words
                words = candidate.split()
                if (2 <= len(words) <= 4 and 
                    all(word[0].isupper() for word in words) and
                    all(len(word) >= 2 for word in words)):
                    
                    # Filter out common non-name headers
                    excluded_words = ["RESUME", "CURRICULUM", "VITAE", "SUMMARY", "EXPERIENCE", 
                                     "PROFESSIONAL", "PROFILE", "EDUCATION", "SOFTWARE"]
                    
                    if not any(excluded in candidate.upper() for excluded in excluded_words):
                        return candidate
        
        return ""
    
    def _extract_name_by_position(self, text: str) -> str:
        """Extract name based on typical position in resume"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Names are typically in the first few lines
        for line in lines[:5]:
            # Skip if line is too long to be a name
            if len(line) > 40:
                continue
            
            # Skip if line contains @ or http (likely contact info/website)
            if '@' in line or 'http' in line:
                continue
            
            # Check if line looks like a name format (2-4 words, capitalized)
            words = line.split()
            if (2 <= len(words) <= 4 and 
                all(word[0].isupper() for word in words if len(word) > 1) and
                all(len(word) >= 2 for word in words)):
                
                # Skip common header words
                excluded_words = ["RESUME", "CURRICULUM", "VITAE", "SUMMARY", "EXPERIENCE", 
                                 "PROFESSIONAL", "PROFILE", "EDUCATION", "SOFTWARE"]
                
                if not any(excluded in line.upper() for excluded in excluded_words):
                    return line
        
        return ""
    
    def _extract_email_regex(self, text: str) -> str:
        """Extract email using regex pattern"""
        email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
        match = re.search(email_pattern, text)
        
        if match:
            return match.group(0)
        
        return ""
    
    def _extract_name_distilbert(self, text: str) -> str:
        """Extract name using DistilBERT embeddings and heuristics"""
        try:
            self._load_models()
            
            # Split text into lines
            lines = [line.strip() for line in text[:1000].split('\n') if line.strip()]
            
            # Filter out lines that are too long or too short
            candidate_lines = [line for line in lines if 2 < len(line.split()) < 10]
            
            if not candidate_lines:
                return ""
            
            # Create embeddings for common name patterns
            name_examples = [
                "John Smith",
                "Jane Doe",
                "Robert Johnson",
                "Emily Williams",
                "Michael Brown"
            ]
            
            # Get embeddings for name examples
            name_embeddings = self.sentence_model.encode(name_examples)
            avg_name_embedding = torch.tensor(name_embeddings).mean(dim=0).numpy()
            
            # Get embeddings for candidate lines
            candidate_embeddings = self.sentence_model.encode(candidate_lines)
            
            # Calculate cosine similarity
            from sklearn.metrics.pairwise import cosine_similarity
            similarities = cosine_similarity([avg_name_embedding], candidate_embeddings)[0]
            
            # Get the most similar line
            most_similar_idx = similarities.argmax()
            most_similar_line = candidate_lines[most_similar_idx]
            
            # Extract the name from the line
            # Heuristic: Take first 2-3 words if they start with capital letters
            words = most_similar_line.split()
            name_words = []
            
            for word in words[:3]:  # Consider up to first 3 words
                if word[0].isupper() and len(word) > 1:
                    name_words.append(word)
                else:
                    break
            
            if name_words:
                return " ".join(name_words)
            
            return ""
            
        except Exception as e:
            logger.error(f"Error extracting name with DistilBERT: {str(e)}")
            return ""
    
    def fine_tune_for_name_extraction(self, training_data: List[Dict[str, str]]):
        """
        Fine-tune DistilBERT for name extraction
        
        Args:
            training_data: List of dictionaries with 'text' and 'name' keys
        """
        logger.info("Fine-tuning DistilBERT for name extraction")
        
        # This is a placeholder for the fine-tuning code
        # In a real implementation, you would:
        # 1. Prepare the training data
        # 2. Set up a token classification task
        # 3. Fine-tune the model
        # 4. Save the fine-tuned model
        
        logger.info("Fine-tuning not implemented yet - this is a placeholder")
        
        # Example implementation outline:
        """
        # Load pre-trained model
        model = DistilBertForTokenClassification.from_pretrained(
            self.model_name,
            num_labels=2  # B-NAME and O (outside)
        )
        
        # Prepare training data
        # ...
        
        # Train the model
        # ...
        
        # Save the model
        model.save_pretrained("./fine_tuned_distilbert_name")
        """
        
        pass 