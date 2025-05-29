import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from transformers import AutoTokenizer, pipeline
import torch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class QwenProcessingService:
    """Service for processing resume text using lightweight NLP models and regex patterns for speed"""
    
    def __init__(self, model_name: str = "distilbert-base-uncased"):
        """
        Initialize the processing service with a lightweight model for faster performance
        
        Args:
            model_name: Name of the model to use (default: distilbert-base-uncased which is fast and lightweight)
        """
        self.model_name = model_name
        self.text_classifier = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"ProcessingService initialized with model: {model_name}, using device: {self.device}")
    
    def _initialize_classifier(self):
        """Initialize the text classifier for section classification if needed"""
        if self.text_classifier is None:
            try:
                # Load a lightweight classifier pipeline for text classification
                # This is much faster than the full model and only used when regex fails
                self.text_classifier = pipeline(
                    "text-classification",
                    model=self.model_name,
                    device=0 if self.device == "cuda" else -1
                )
                return True
            except Exception as e:
                logger.error(f"Error initializing text classifier: {str(e)}")
                return False
        return True
    
    def extract_candidate_info(self, resume_text: str) -> Dict[str, Any]:
        """
        Extract key information from resume text using Qwen direct regex extraction,
        which is faster and more reliable for standard information
        
        Args:
            resume_text: Full text extracted from resume
            
        Returns:
            Dictionary with candidate information
        """
        logger.info("Extracting candidate information from resume text")
        
        # Use regex patterns for fast extraction of basic information
        name = self.extract_name(resume_text)
        email = self._extract_email_regex(resume_text)
        location = self._extract_location_regex(resume_text)
        
        # Extract resume sections using pattern matching
        sections = self._extract_sections_regex(resume_text)
        
        # Normalize section names for consistency
        normalized_sections = {}
        for section_name, content in sections.items():
            # Convert section names to standard format
            norm_name = section_name.lower().strip()
            
            # Map commonly misdetected sections
            if "techn" in norm_name and "skill" in norm_name:
                norm_name = "technical skills"
            elif "project" in norm_name:
                norm_name = "academic projects"
            elif any(term in norm_name for term in ["extra", "curricular", "activ"]):
                norm_name = "extracurricular"
            
            normalized_sections[norm_name] = content
        
        # Use the normalized sections
        sections = normalized_sections
        
        # Explicitly check for important sections that might be missed
        section_headers = {
            'education': ['EDUCATION', 'ACADEMIC BACKGROUND', 'ACADEMIC HISTORY', 'EDUCATIONAL QUALIFICATIONS'],
            'achievements': ['ACHIEVEMENTS', 'AWARDS', 'HONORS', 'ACCOMPLISHMENTS'],
            'technical skills': ['TECHNICAL SKILLS', 'SKILLS', 'TECHNOLOGIES', 'TECHNICAL EXPERTISE'],
            'academic projects': ['ACADEMIC PROJECTS', 'PROJECTS', 'PROJECT EXPERIENCE'],
            'extracurricular': ['EXTRACURRICULAR', 'ACTIVITIES', 'EXTRACURRICULAR ACTIVITIES']
        }
        
        # Look for each section directly in the text
        for section_key, header_options in section_headers.items():
            if section_key not in sections:
                for header in header_options:
                    # Use a more robust pattern that allows for different formatting
                    pattern = r'(?:^|\n)\s*' + re.escape(header) + r'\s*(?:\n|\r\n)(.*?)(?=\n\s*[A-Z][A-Z\s]+\s*(?:\n|\r\n)|\Z)'
                    match = re.search(pattern, resume_text, re.DOTALL | re.IGNORECASE)
                    if match:
                        sections[section_key] = match.group(1).strip()
                        break
        
        # Special handling for education section
        if 'education' not in sections:
            # Look for education keywords
            edu_indicators = [
                "Bachelor Degree", "University of Malaya", "UM", "UTM",
                "Universiti Teknologi Malaysia", "CGPA", "Foundation"
            ]
            for indicator in edu_indicators:
                if indicator in resume_text:
                    # Capture a block around this education indicator
                    idx = resume_text.find(indicator)
                    start = max(0, resume_text.rfind('\n\n', 0, idx))
                    end = resume_text.find('\n\n', idx)
                    if end == -1:
                        end = len(resume_text)
                    
                    edu_text = resume_text[start:end].strip()
                    sections['education'] = edu_text
                    break
        
        # Special handling for achievements section
        if 'achievements' not in sections:
            # Look for achievement keywords
            achievement_indicators = [
                "Runner Up", "Hackathon", "Winner", "Won", "1st", "2nd", "Award"
            ]
            for indicator in achievement_indicators:
                if indicator in resume_text:
                    # Capture a block around this achievement indicator
                    idx = resume_text.find(indicator)
                    start = max(0, resume_text.rfind('\n\n', 0, idx))
                    end = resume_text.find('\n\n', idx)
                    if end == -1:
                        end = len(resume_text)
                    
                    achievement_text = resume_text[start:end].strip()
                    sections['achievements'] = achievement_text
                    break
        
        # Add explicit handling for key sections when they're not detected
        # Look for specific section headers that might have been missed
        if 'technical skills' not in sections:
            # Check if there's a "TECHNICAL SKILLS" section header
            if re.search(r'\b(?:TECHNICAL\s+SKILLS|TECH\s+SKILLS)\b', resume_text.upper()):
                # Extract content following this header
                match = re.search(r'\b(?:TECHNICAL\s+SKILLS|TECH\s+SKILLS)\b.*?\n(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)', 
                                 resume_text, re.DOTALL | re.IGNORECASE)
                if match:
                    sections['technical skills'] = match.group(1).strip()
        
        if 'academic projects' not in sections:
            # Check if there's an "ACADEMIC PROJECTS" section header
            if re.search(r'\b(?:ACADEMIC\s+PROJECTS|PROJECTS|PROJECT\s+EXPERIENCE)\b', resume_text.upper()):
                # Extract content following this header
                match = re.search(r'\b(?:ACADEMIC\s+PROJECTS|PROJECTS|PROJECT\s+EXPERIENCE)\b.*?\n(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)', 
                                 resume_text, re.DOTALL | re.IGNORECASE)
                if match:
                    sections['academic projects'] = match.group(1).strip()
        
        if 'extracurricular' not in sections:
            # Check if there's an "EXTRACURRICULAR" section header
            if re.search(r'\b(?:EXTRACURRICULAR|EXTRA-?CURRICULAR|ACTIVITIES)\b', resume_text.upper()):
                # Extract content following this header
                match = re.search(r'\b(?:EXTRACURRICULAR|EXTRA-?CURRICULAR|ACTIVITIES)\b.*?\n(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)', 
                                 resume_text, re.DOTALL | re.IGNORECASE)
                if match:
                    sections['extracurricular'] = match.group(1).strip()
        
        # Extra checks for OCR errors in section headers
        for line in resume_text.split('\n'):
            line_upper = line.upper().strip()
            
            # Look for common OCR errors in section headers
            # Check for Æ or similar characters that might indicate OCR errors
            if re.search(r'(?:TECHN|TECH).*(?:SKILL)', line_upper.replace('Æ', 'E').replace('Å', 'S')):
                # Extract content following this header by finding the line number and getting text until next section
                line_idx = resume_text.split('\n').index(line)
                content_lines = []
                for i in range(line_idx + 1, len(resume_text.split('\n'))):
                    if i >= len(resume_text.split('\n')):
                        break
                    content_line = resume_text.split('\n')[i]
                    if re.match(r'^[A-Z][A-Z\s]+$', content_line.strip()):
                        break
                    content_lines.append(content_line)
                
                if content_lines:
                    sections['technical skills'] = '\n'.join(content_lines).strip()
        
        # Direct extraction of skills and keywords for faster processing
        keywords = self._extract_keywords_regex(resume_text)
        
        # Use distilbert embedding extraction only if needed
        education = ""
        if "education" in sections:
            education = sections["education"]
        
        # If we still don't have sections detected, try more aggressively to identify them
        if len(sections) < 3:
            # Look for content patterns that indicate sections without headers
            lines = resume_text.split('\n')
            current_section = None
            
            for line in lines:
                line_upper = line.upper().strip()
                
                # Look for section headers without formatting
                if "TECHNICAL SKILLS" in line_upper or "TECH SKILLS" in line_upper:
                    current_section = "technical skills"
                    sections[current_section] = ""
                    continue
                
                if "ACADEMIC PROJECTS" in line_upper or "PROJECTS" in line_upper:
                    current_section = "academic projects"
                    sections[current_section] = ""
                    continue
                    
                if "EXTRACURRICULAR" in line_upper or "ACTIVITIES" in line_upper:
                    current_section = "extracurricular"
                    sections[current_section] = ""
                    continue
                    
                # Append content to current section
                if current_section and line.strip():
                    sections[current_section] += line + "\n"
        
        # Create candidate information dictionary
        candidate_info = {
            "name": name,
            "email": email,
            "location": location,
            "sections": sections,
            "keywords": keywords,
            "education": education
        }
        
        logger.info(f"Extracted candidate info: name={name}, email={email}, location={location}, sections={list(sections.keys())}, keywords={len(keywords)}")
        
        return candidate_info
    
    def extract_name(self, text: str) -> str:
        """
        Extract candidate name from resume text using advanced pattern matching 
        and language models for Malaysian multi-ethnic names
        """
        name = ""
        
        # Try multiple strategies for name extraction, starting with the most reliable methods
        
        # Strategy 1: Look for well-structured formats
        structure_patterns = [
            # Format at top of document: NAME line by itself in uppercase/title case
            r"^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})\s*$",
            
            # Format with "Name: [Name]" or similar
            r"(?:name|full name|candidate)\s*(?::|;|is|–|-|>|→)\s*([A-Za-z]+(?: [A-Za-z]+){1,5})",
            
            # Format near contact details (phone/email/address)
            r"(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})\s*\n(?:.*?(?:email|phone|address|contact|linkedin))",
        ]
        
        for pattern in structure_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                name_candidate = match.group(1).strip()
                # Verify the name looks legitimate (2-5 words, no weird symbols, appropriate length)
                words = name_candidate.split()
                if 2 <= len(words) <= 5 and len(name_candidate) <= 50:
                    if not any(char in name_candidate for char in "#@/\\&%_=+[]{}()$<>*"):
                        name = name_candidate
                        break
            
            if name:
                break
        
        # Strategy 2: Look for name in context of headers
        if not name:
            # Names in Malaysian resumes are typically at the top and prominently displayed
            # Check just the first part of the resume (first 20 lines max)
            first_section = "\n".join(text.split("\n")[:20])
            
            # Look for capitalized/upper-case lines near the top that could be names
            name_patterns = [
                # All uppercase name
                r"^\s*([A-Z][A-Z\s]+[A-Z])\s*$",
                
                # Name with mixed case, but each word capitalized
                r"^\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})\s*$",
            ]
            
            for pattern in name_patterns:
                matches = re.finditer(pattern, first_section, re.MULTILINE)
                for match in matches:
                    # Potential name
                    name_candidate = match.group(1).strip()
                    
                    # Filter out things that are definitely not names
                    non_name_words = ["resume", "cv", "curriculum", "vitae", "profile", "summary", "application"]
                    if any(word.lower() in name_candidate.lower() for word in non_name_words):
                        continue
                    
                    # Verify length (names are typically 2-30 characters)
                    if 5 <= len(name_candidate) <= 50:
                        name = name_candidate
                        break
                
                if name:
                    break
        
        # Strategy 3: Look for names using ethnic specific patterns
        if not name:
            # Malaysian Chinese pattern: [Given name] [Surname] [Middle names/characters]
            # Example: Marcus Mah Qing Fung - where Mah is surname, Marcus is given name, Qing Fung are Chinese characters
            chinese_pattern = r"\b([A-Z][a-z]+)\s+([A-Z][a-z]{1,4})\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b"
            
            # Malaysian Indian pattern: Often have initial-based elements 
            # Example: R. Kamaleshwaran or Jayaram S/O Murthy
            indian_pattern = r"\b([A-Z]\.)\s+([A-Z][a-z]+)\b|\b([A-Z][a-z]+)\s+([A-Z]/[A-Z])\s+([A-Z][a-z]+)\b"
            
            # Malaysian Malay pattern: Often have bin/binti
            # Example: Ahmad bin Abdullah or Nurul binti Hassan
            malay_pattern = r"\b([A-Z][a-z]+)\s+(?:bin|binti)\s+([A-Z][a-z]+)\b"
            
            ethnic_patterns = [chinese_pattern, indian_pattern, malay_pattern]
            
            for pattern in ethnic_patterns:
                matches = re.finditer(pattern, text, re.MULTILINE)
                for match in matches:
                    if match.groups():
                        # Join the groups that are not None
                        name_parts = [g for g in match.groups() if g]
                        name_candidate = " ".join(name_parts)
                        
                        # Verify it looks like a name
                        if len(name_candidate) >= 5 and not any(char in name_candidate for char in "#@/\\&%_=+[]{}()$<>*"):
                            name = name_candidate
                            break
                
                if name:
                    break
        
        # Strategy 4: Fall back to a more general name pattern if all else fails
        if not name:
            # Look for a name pattern (2-5 capitalized words) at the beginning of the document
            first_100_chars = text[:500]  # Look only at the beginning
            
            # General name pattern: 2-5 consecutive capitalized words
            general_pattern = r"(?:^|\n|\s)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})(?=\s|\n|$)"
            
            matches = re.finditer(general_pattern, first_100_chars)
            for match in matches:
                name_candidate = match.group(1).strip()
                
                # Filter out known headers
                non_name_headers = ["resume", "cv", "curriculum vitae", "summary", "objective"]
                if any(header.lower() == name_candidate.lower() for header in non_name_headers):
                    continue
                
                # Check reasonable name length
                if 5 <= len(name_candidate) <= 50:
                    name = name_candidate
                    break
        
        # Final cleanup and formatting
        if name:
            # Handle all-uppercase or all-lowercase names
            if name.isupper() or name.islower():
                # Convert to title case for better readability
                name = " ".join(word.capitalize() for word in name.split())
        
        # Always return the name in uppercase for consistency
        return name.upper() if name else ""
    
    def _extract_email_regex(self, text: str) -> str:
        """Extract email using regex pattern - fast and reliable"""
        # Updated pattern to better handle the @ symbol and common email domains
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
        match = re.search(email_pattern, text)
        
        if match:
            return match.group(0)
        
        # Fallback for cases where @ might be replaced with special characters or unicode
        # Sometimes OCR or text extraction replaces @ with "Ä" or similar characters
        modified_text = text.replace("Ä", "@").replace("(at)", "@").replace(" at ", "@")
        match = re.search(email_pattern, modified_text)
        if match:
            return match.group(0).replace("Ä", "@")
        
        return ""
    
    def _extract_location_regex(self, text: str) -> str:
        """Extract location information using regex pattern matching"""
        # Look for location in the first few lines (typically in the header)
        header_text = '\n'.join(text.split('\n')[:10])
        
        # Pattern for common location formats
        # Look for city, state, country patterns
        location_patterns = [
            # City, State/Province format
            r'(?:^|\s)([A-Z][a-zA-Z\s]{2,25}),\s*([A-Z][a-zA-Z\s]{2,25})(?:$|\s)',
            
            # City, Country format
            r'(?:^|\s)([A-Z][a-zA-Z\s]{2,25}),\s*([A-Z][a-zA-Z\s]{2,25})(?:$|\s)',
            
            # Common Malaysian cities/states
            r'\b(?:Kuala\s+Lumpur|Selangor|Penang|Johor\s+Bahru|Malacca|Ipoh|Sarawak|Sabah|Perak|Kedah|Negeri\s+Sembilan|Pahang|Terengganu|Kelantan|Perlis|Labuan|Putrajaya|Cyberjaya)\b',
            
            # Address with postal code
            r'(?:[A-Za-z\s]+,\s*)?(\d{5})\s+([A-Z][a-zA-Z\s]+)',
            
            # General location pattern
            r'(?:Address|Location|Based\s+in)(?:\s*:|)\s*([A-Za-z0-9\s,.]+)'
        ]
        
        # Try each pattern
        for pattern in location_patterns:
            match = re.search(pattern, header_text)
            if match:
                if len(match.groups()) > 1:
                    # Multiple groups captured, combine them
                    location = ', '.join(g for g in match.groups() if g)
                else:
                    # Single group or full match
                    location = match.group(0)
                
                # Clean up the location
                location = location.strip()
                location = re.sub(r'^(?:Address|Location|Based\s+in)(?:\s*:|\s+)', '', location)
                location = re.sub(r'^\s*,\s*', '', location)
                
                # If we found a location, return it
                if location:
                    return location
        
        # If no location found in header, look for location keywords in the entire text
        location_keywords = [
            "Kuala Lumpur", "Selangor", "Penang", "Johor", "Malacca", "Ipoh", 
            "Sarawak", "Sabah", "Malaysia", "Cyberjaya", "Putrajaya"
        ]
        
        for keyword in location_keywords:
            if keyword in text:
                # Try to get context around this location
                idx = text.find(keyword)
                start = max(0, text.rfind('\n', 0, idx))
                end = text.find('\n', idx)
                if end == -1:
                    end = min(idx + 100, len(text))
                
                context = text[start:end].strip()
                
                # Extract location from context
                location_match = re.search(r'([A-Za-z\s,]+\b' + re.escape(keyword) + r'\b[A-Za-z\s,]*)', context)
                if location_match:
                    location = location_match.group(1).strip()
                    # Clean up the location
                    location = re.sub(r'^[,\s]+|[,\s]+$', '', location)
                    return location
                
                # If no context match, just return the keyword
                return keyword
        
        # If still no location found, look for postal codes
        postal_match = re.search(r'\b\d{5}\b', text)
        if postal_match:
            # Try to get context around this postal code
            postal_code = postal_match.group(0)
            idx = text.find(postal_code)
            start = max(0, text.rfind('\n', 0, idx))
            end = text.find('\n', idx)
            if end == -1:
                end = min(idx + 100, len(text))
            
            context = text[start:end].strip()
            
            # Clean up the context
            context = re.sub(r'[^A-Za-z0-9\s,]', '', context)
            context = re.sub(r'\s+', ' ', context).strip()
            
            if len(context) < 50:  # Only return if context is reasonably short
                return context
            
            # If context is too long, just return the postal code area
            return f"Area {postal_code}"
        
        # Default return if no location found
        return ""
    
    def _extract_sections_regex(self, text: str) -> Dict[str, str]:
        """Extract different sections from resume text using enhanced pattern matching"""
        sections = {}
        
        # Define common section headers with case-insensitive matching
        # This is comprehensive and handles variations in formatting
        # Added specific Malaysian resume section patterns
        section_patterns = {
            "summary": r"(?:SUMMARY|PROFESSIONAL\s+SUMMARY|PROFILE|OBJECTIVE|ABOUT\s+ME)(?:\s*:|$|\n)",
            "experience": r"(?:EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT|WORK\s+HISTORY|PROFESSIONAL\s+EXPERIENCE)(?:\s*:|$|\n)",
            "education": r"(?:EDUCATION|ACADEMIC\s+BACKGROUND|ACADEMIC\s+HISTORY|EDUCATIONAL\s+BACKGROUND)(?:\s*:|$|\n)",
            "skills": r"(?:SKILLS|SKILL\s+SET|SKILL\s+SUMMARY)(?:\s*:|$|\n)",
            "technical skills": r"(?:TECHNICAL\s+SKILLS|TECHNICAL\s+EXPERTISE|TECH\s+SKILLS|TECHNICAL\s+PROFICIENCIES)(?:\s*:|$|\n)",
            "academic projects": r"(?:ACADEMIC\s+PROJECTS|PERSONAL\s+PROJECTS|UNIVERSITY\s+PROJECTS|COURSE\s+PROJECTS|PROJECTS|PROJECT\s+EXPERIENCE)(?:\s*:|$|\n)",
            "extracurricular": r"(?:EXTRACURRICULAR|EXTRACURRICULAR\s+ACTIVITIES|CO-CURRICULAR|CO\-CURRICULAR\s+ACTIVITIES|ACTIVITIES|ACHIEVEMENTS\s+AND\s+ACTIVITIES)(?:\s*:|$|\n)",
            "certifications": r"(?:CERTIFICATIONS|CERTIFICATES|PROFESSIONAL\s+CERTIFICATIONS|ACCREDITATIONS)(?:\s*:|$|\n)",
            "achievements": r"(?:ACHIEVEMENTS|AWARDS|HONORS|RECOGNITIONS)(?:\s*:|$|\n)",
            "languages": r"(?:LANGUAGES|LANGUAGE\s+PROFICIENCY|LANGUAGE\s+SKILLS)(?:\s*:|$|\n)",
            "interests": r"(?:INTERESTS|HOBBIES|EXTRACURRICULAR\s+ACTIVITIES|ACTIVITIES)(?:\s*:|$|\n)",
            "volunteer": r"(?:VOLUNTEER|VOLUNTEERING|VOLUNTEER\s+EXPERIENCE|COMMUNITY\s+SERVICE)(?:\s*:|$|\n)",
            "references": r"(?:REFERENCES|PROFESSIONAL\s+REFERENCES)(?:\s*:|$|\n)",
            "publications": r"(?:PUBLICATIONS|PAPERS|RESEARCH\s+PAPERS|ARTICLES)(?:\s*:|$|\n)",
            "leadership": r"(?:LEADERSHIP|LEADERSHIP\s+EXPERIENCE|POSITIONS\s+OF\s+RESPONSIBILITY)(?:\s*:|$|\n)",
        }
        
        # Convert text to upper case for easier pattern matching
        text_upper = text.upper()
        
        # Find all section starts and their positions
        section_starts = []
        for section_name, pattern in section_patterns.items():
            for match in re.finditer(pattern, text_upper):
                start_pos = match.start()
                end_pos = match.end()
                header_text = text[start_pos:end_pos]
                section_starts.append((start_pos, section_name, header_text))
        
        # Sort sections by position
        section_starts.sort()
        
        # Extract section content
        for i, (start_pos, section_name, header_text) in enumerate(section_starts):
            # Find end position (next section or end of text)
            if i < len(section_starts) - 1:
                end_pos = section_starts[i + 1][0]
            else:
                end_pos = len(text)
            
            # Extract content (excluding header)
            header_end = start_pos + len(header_text)
            content = text[header_end:end_pos].strip()
            
            # Add to sections, using lowercase section name for consistency
            sections[section_name.lower()] = content
        
        # Special handling for Malaysian resume sections that might be titled differently
        # Map section aliases to standardized names if needed
        section_aliases = {
            "skills": ["technical skills", "tech skills", "skill set"],
            "projects": ["academic projects", "project experience"],
            "activities": ["extracurricular", "extra curricular activities", "co-curricular"],
        }
        
        # Unify section names by aliases
        for standard_name, aliases in section_aliases.items():
            for alias in aliases:
                if alias in sections and standard_name not in sections:
                    # Only rename if the standard name doesn't already exist
                    sections[standard_name] = sections[alias]
        
        # Ensure proper section naming based on content analysis
        if "skills" in sections and "technical skills" not in sections:
            skills_content = sections["skills"].lower()
            if any(tech in skills_content for tech in ["programming", "software", "languages", "python", "java", "react", "flutter"]):
                sections["technical skills"] = sections["skills"]
        
        # If there's an "activities" section that looks like projects
        if "activities" in sections and "academic projects" not in sections:
            activities_content = sections["activities"].lower()
            if any(term in activities_content for term in ["developed", "created", "built", "implemented", "designed"]):
                if any(tech in activities_content for tech in ["app", "application", "website", "system", "project"]):
                    sections["academic projects"] = sections["activities"]
        
        # If there are achievements that look like activities
        if "achievements" in sections and "extracurricular" not in sections:
            achievements_content = sections["achievements"].lower()
            if any(term in achievements_content for term in ["club", "society", "volunteer", "organization", "committee"]):
                sections["extracurricular"] = sections["achievements"]
        
        return sections
    
    def _extract_sections_by_lines(self, text: str) -> Dict[str, str]:
        """Extract sections by analyzing line formats and contexts"""
        sections = {}
        lines = text.split('\n')
        current_section = None
        section_content = []
        
        # Line-based heuristic section detection
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check for potential section headers
            if ((line.isupper() or (line.istitle() and len(line) < 25)) and 
                not re.match(r'^\d', line) and  # Not starting with a number
                i > 3):  # Skip first few lines (likely name/contact info)
                
                # Save previous section if we have one
                if current_section and section_content:
                    sections[current_section.lower()] = '\n'.join(section_content)
                    section_content = []
                
                # Start new section, clean up the header name
                current_section = line.lower().strip(':')
                continue
            
            # Add line to current section content
            if current_section:
                section_content.append(line)
        
        # Save the last section
        if current_section and section_content:
            sections[current_section.lower()] = '\n'.join(section_content)
        
        # Map detected sections to standard names
        standardized = {}
        section_keywords = {
            "summary": ["summary", "profile", "objective", "about me"],
            "experience": ["experience", "work", "employment", "history", "professional"],
            "education": ["education", "academic", "university", "college", "school"],
            "skills": ["skills", "technical", "competencies", "technologies", "expertise"],
            "projects": ["projects", "project", "portfolio"],
            "achievements": ["achievements", "awards", "honors", "accomplishments"],
            "activities": ["activities", "extracurricular", "volunteer", "leadership"],
            "interests": ["interests", "hobbies", "personal"]
        }
        
        for detected, content in sections.items():
            # Skip very short sections (likely detection errors)
            if len(content) < 50:
                continue
                
            # Try to map to standard section name
            mapped = False
            for standard, keywords in section_keywords.items():
                if any(kw in detected for kw in keywords):
                    standardized[standard] = content
                    mapped = True
                    break
            
            # Keep original name if no mapping found
            if not mapped:
                standardized[detected] = content
        
        return standardized
    
    def _extract_keywords_regex(self, text: str) -> List[str]:
        """Extract keywords and skills using comprehensive pattern matching for speed"""
        keywords = set()
        
        # Expanded technical skills patterns (programming languages, frameworks, tools)
        # Added more specific skills from Malaysian tech market and job descriptions
        tech_patterns = [
            # Languages
            r'\b(?:Python|Java|JavaScript|TypeScript|C\+\+|C#|Ruby|PHP|Go|Swift|Kotlin|Dart)\b',
            
            # Frameworks
            r'\b(?:React(?:\.js)?|Angular|Vue|Flutter|Django|Flask|Spring|Express|TensorFlow|PyTorch|Node\.js)\b',
            
            # Databases
            r'\b(?:SQL|MySQL|PostgreSQL|MongoDB|Oracle|SQLite|Redis|Cassandra|DynamoDB|Firebase|Firestore)\b',
            
            # Cloud/DevOps
            r'\b(?:AWS|Azure|GCP|Docker|Kubernetes|CI/CD|Jenkins|Git|GitHub|GitLab|Vercel|Netlify|Heroku)\b',
            
            # Web technologies
            r'\b(?:HTML5?|CSS3?|SASS|LESS|Bootstrap|Tailwind|REST|GraphQL|API|Axios|Fetch|Redux|Next\.js|Vite)\b',
            
            # Mobile development
            r'\b(?:Flutter|React\s+Native|Ionic|Swift|Kotlin|Android|iOS|Xcode|Android\s+Studio|Mobile\s+App)\b',
            
            # Design tools
            r'\b(?:Figma|Adobe\s+XD|Sketch|InVision|Photoshop|Illustrator|UI|UX)\b',
            
            # AI/ML
            r'\b(?:Machine\s+Learning|AI|Artificial\s+Intelligence|NLP|Neural\s+Networks|Deep\s+Learning|Gemini|GPT)\b',
            
            # Soft skills
            r'\b(?:Agile|Scrum|Kanban|Leadership|Communication|Problem[\s-]Solving|Critical\s+Thinking|Teamwork)\b'
        ]
        
        # Extract tech skills
        for pattern in tech_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Preserve original case for technologies like React, JavaScript
                term = match.group(0)
                # Additional post-processing to ensure consistent capitalization for common technologies
                if term.lower() == "javascript":
                    term = "JavaScript"
                elif term.lower() == "typescript":
                    term = "TypeScript"
                elif term.lower() == "postgresql":
                    term = "PostgreSQL"
                elif term.lower() == "react":
                    term = "React"
                elif term.lower() == "flutter":
                    term = "Flutter"
                elif term.lower() == "firebase":
                    term = "Firebase"
                keywords.add(term)
        
        # Check for specific project names or technologies that might not be caught by patterns
        project_keywords = {
            "Talk to Task": ["Voice Assistant", "AI"],
            "TransitGo": ["Mobile App", "Flutter", "Transportation"],
            "StudySync": ["Web App", "React"],
            "Figma": ["UI Design", "Prototyping"],
            "Firebase": ["Cloud", "Database", "Authentication"],
            "Google": ["Maps API", "Cloud Services"],
        }
        
        for project, related_skills in project_keywords.items():
            if re.search(r'\b' + re.escape(project) + r'\b', text, re.IGNORECASE):
                keywords.add(project)
                for skill in related_skills:
                    keywords.add(skill)
        
        # Experience patterns (e.g., "5 years experience")
        exp_patterns = [
            r'(\d+)[\+]?\s*years?\s+(?:of\s+)?experience',
            r'experience\s+(?:of\s+)?(\d+)[\+]?\s*years?',
        ]
        
        for pattern in exp_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                if match.group(1):
                    keywords.add(f"{match.group(1)}+ years experience")
        
        # Education keywords
        edu_keywords = [
            "bachelor", "master", "phd", "doctorate", "degree", "bs", "ms", "ba", "ma",
            "computer science", "engineering", "information technology", "it", "software engineering"
        ]
        
        for keyword in edu_keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text.lower()):
                keywords.add(keyword.title())  # Add with title case
        
        # Soft skills - these can be important for cultural fit
        soft_skills = [
            "leadership", "communication", "teamwork", "problem solving", "critical thinking",
            "time management", "organization", "creativity", "adaptability", "collaboration"
        ]
        
        for skill in soft_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', text.lower()):
                keywords.add(skill.title())  # Add with title case
        
        # Check for job-level terms
        job_levels = ["Junior", "Senior", "Lead", "Manager", "Director", "Intern", "Apprentice"]
        for level in job_levels:
            if re.search(r'\b' + re.escape(level) + r'\b', text, re.IGNORECASE):
                keywords.add(level)
        
        # Return sorted list without duplicates
        return sorted(list(keywords))
    
    def analyze_resume_against_job(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Analyze resume against job description for quick matching
        
        Args:
            resume_text: Extracted text from resume
            job_description: Job description text
            
        Returns:
            Analysis results with matched skills and score
        """
        logger.info("Analyzing resume against job description")
        
        # Extract keywords from resume and job description
        resume_keywords = self._extract_keywords_regex(resume_text)
        job_keywords = self._extract_keywords_regex(job_description)
        
        # Find matching keywords
        matching_skills = []
        for job_kw in job_keywords:
            job_kw_lower = job_kw.lower()
            for resume_kw in resume_keywords:
                resume_kw_lower = resume_kw.lower()
                if (job_kw_lower == resume_kw_lower or 
                    job_kw_lower in resume_kw_lower or 
                    resume_kw_lower in job_kw_lower):
                    matching_skills.append(job_kw)
                    break
        
        # Find missing keywords
        missing_skills = [kw for kw in job_keywords if kw not in matching_skills]
        
        # Calculate match percentage with boost for substantial matches
        match_percentage = (len(matching_skills) / max(1, len(job_keywords))) * 100
        
        # Provide a minimum score of 20% if at least some matches exist
        if matching_skills and match_percentage < 20:
            match_percentage = 20 + (match_percentage * 1.5)
        
        # Generate assessment
        if match_percentage > 80:
            assessment = "The resume strongly matches the job requirements with most key skills present."
        elif match_percentage > 60:
            assessment = "The resume is a good match for this position with many of the required skills."
        elif match_percentage > 40:
            assessment = "The resume has moderate alignment with the job requirements, but some key skills are missing."
        elif match_percentage > 20:
            assessment = "The resume has some relevant skills, but significant gaps exist in meeting job requirements."
        else:
            assessment = "The resume needs significant enhancement to align with the job requirements."
        
        return {
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "assessment": assessment,
            "match_percentage": round(match_percentage, 1)
        }
    
    def analyze_job_description(self, job_description: str) -> Dict[str, Any]:
        """
        Analyze job description to extract important requirements and context
        for better resume matching
        
        Args:
            job_description: The job description text
            
        Returns:
            Dictionary with extracted information from job description
        """
        logger.info("Analyzing job description to extract key requirements")
        
        # Extract key information using regex patterns for speed
        job_info = {}
        
        # Extract job title
        title_patterns = [
            r"(?:Job Title|Position|Role)[\s:]+([^\n]+)",
            r"^([A-Z][A-Za-z\s]+(?:Developer|Engineer|Designer|Manager|Analyst|Specialist|Architect|Consultant))[\s\n]",
            r"([A-Z][A-Za-z\s]+(?:Developer|Engineer|Designer|Manager|Analyst|Specialist|Architect|Consultant))[\s\n]+"
        ]
        
        job_title = ""
        for pattern in title_patterns:
            match = re.search(pattern, job_description)
            if match:
                job_title = match.group(1).strip()
                break
        
        job_info["title"] = job_title
        
        # Extract experience level
        experience_patterns = [
            r"(\d+[\+]?\s*(?:-|to)\s*\d+)\s*years\s+(?:of\s+)?experience",
            r"minimum\s+(?:of\s+)?(\d+[\+]?)\s*years\s+(?:of\s+)?experience",
            r"at\s+least\s+(\d+[\+]?)\s*years\s+(?:of\s+)?experience",
            r"(\d+[\+]?)\s*\+\s*years\s+(?:of\s+)?experience",
            r"experience\s*(?:of|:|\()\s*(\d+[\+]?\s*(?:-|to)\s*\d+)\s*years",
        ]
        
        experience_required = ""
        for pattern in experience_patterns:
            match = re.search(pattern, job_description, re.IGNORECASE)
            if match:
                experience_required = match.group(1).strip()
                break
        
        job_info["experience_required"] = experience_required
        
        # Extract education requirements
        education_patterns = [
            r"(?:Bachelor's|Bachelor|BS|BA|B.S.|B.A.|Master's|Master|MS|MA|M.S.|M.A.|PhD|Ph.D.|Doctorate)(?:\s+degree)?\s+(?:in|of)\s+([^,\n.]+)",
            r"(?:degree|diploma)\s+(?:in|of)\s+([^,\n.]+)",
            r"(?:Education|Qualification)[\s:]+([^\n]+)"
        ]
        
        education_required = ""
        for pattern in education_patterns:
            match = re.search(pattern, job_description, re.IGNORECASE)
            if match:
                education_required = match.group(1).strip()
                break
        
        job_info["education_required"] = education_required
        
        # Extract required technical skills using enhanced patterns
        technical_skills = set()
        tech_patterns = [
            # Programming languages
            r'\b(?:Python|Java|JavaScript|TypeScript|C\+\+|C#|Ruby|PHP|Go|Swift|Kotlin|Dart)\b',
            
            # Frameworks
            r'\b(?:React(?:\.js)?|Angular|Vue|Flutter|Django|Flask|Spring|Express|TensorFlow|PyTorch|Node\.js)\b',
            
            # Databases
            r'\b(?:SQL|MySQL|PostgreSQL|MongoDB|Oracle|SQLite|Redis|Cassandra|DynamoDB|Firebase|Firestore)\b',
            
            # Cloud/DevOps
            r'\b(?:AWS|Azure|GCP|Docker|Kubernetes|CI/CD|Jenkins|Git|GitHub|GitLab|Vercel|Netlify|Heroku)\b',
            
            # Web technologies
            r'\b(?:HTML5?|CSS3?|SASS|LESS|Bootstrap|Tailwind|REST|GraphQL|API|Axios|Fetch|Redux|Next\.js|Vite)\b',
            
            # Mobile development
            r'\b(?:Flutter|React\s+Native|Ionic|Swift|Kotlin|Android|iOS|Xcode|Android\s+Studio|Mobile\s+App)\b',
            
            # Design tools
            r'\b(?:Figma|Adobe\s+XD|Sketch|InVision|Photoshop|Illustrator|UI|UX)\b',
            
            # AI/ML
            r'\b(?:Machine\s+Learning|AI|Artificial\s+Intelligence|NLP|Neural\s+Networks|Deep\s+Learning|Gemini|GPT)\b'
        ]
        
        for pattern in tech_patterns:
            matches = re.finditer(pattern, job_description, re.IGNORECASE)
            for match in matches:
                term = match.group(0)
                # Standardize capitalization for common technologies
                if term.lower() == "javascript":
                    term = "JavaScript"
                elif term.lower() == "typescript":
                    term = "TypeScript"
                elif term.lower() == "postgresql":
                    term = "PostgreSQL"
                technical_skills.add(term)
        
        # Add required skills from common requirement sections
        requirement_section_pattern = r'(?:Requirements|Required Skills|Qualifications|Essential Skills|Must Have|Technical Requirements)[^\n]*(?:\n|:)(.*?)(?:\n\s*\n|\n\s*[A-Z][A-Z\s]+\s*(?::|$)|\Z)'
        match = re.search(requirement_section_pattern, job_description, re.DOTALL | re.IGNORECASE)
        if match:
            requirement_section = match.group(1).strip()
            # Look for bullet points with skills
            for line in requirement_section.split('\n'):
                line = line.strip()
                # Skip empty lines
                if not line:
                    continue
                    
                # Remove bullet points and other markers
                cleaned_line = re.sub(r'^[\s•\-–—*•●➢➤‣◦◆◇]+\s*', '', line)
                
                # Skip lines that are too short
                if len(cleaned_line) < 5:
                    continue
                
                # Check for expertise keywords
                expertise_keywords = ["experience", "expertise", "proficiency", "knowledge", "familiar", "skills"]
                if any(keyword in cleaned_line.lower() for keyword in expertise_keywords):
                    # Extract technologies from this requirement
                    for pattern in tech_patterns:
                        matches = re.finditer(pattern, cleaned_line, re.IGNORECASE)
                        for match in matches:
                            technical_skills.add(match.group(0))
        
        job_info["technical_skills"] = sorted(list(technical_skills))
        
        # Extract soft skills
        soft_skills = set()
        soft_skill_patterns = [
            r'\b(?:teamwork|leadership|communication|problem[\s-]solving|critical\s+thinking|adaptability|time\s+management|creativity|collaboration|flexibility)\b',
            r'\b(?:agile|scrum|kanban|waterfall|team\s+player|self[\s-]motivated|detail[\s-]oriented|organized|analytical)\b'
        ]
        
        for pattern in soft_skill_patterns:
            matches = re.finditer(pattern, job_description, re.IGNORECASE)
            for match in matches:
                soft_skills.add(match.group(0).title())  # Capitalize soft skills
        
        job_info["soft_skills"] = sorted(list(soft_skills))
        
        # Extract company culture keywords
        culture_keywords = set()
        culture_patterns = [
            r'\b(?:culture|environment|values|mission|vision|team|diversity|inclusion|work[-\s]life\s+balance|remote|hybrid|flexible|benefits|perks)\b'
        ]
        
        for pattern in culture_patterns:
            matches = re.finditer(pattern, job_description, re.IGNORECASE)
            for match in matches:
                culture_keywords.add(match.group(0).lower())
        
        # Look for specific company values
        company_values_pattern = r'(?:Our\s+Values|Company\s+Values|We\s+Value|Our\s+Culture)[^\n]*(?:\n|:)(.*?)(?:\n\s*\n|\n\s*[A-Z][A-Z\s]+\s*(?::|$)|\Z)'
        match = re.search(company_values_pattern, job_description, re.DOTALL | re.IGNORECASE)
        if match:
            values_section = match.group(1).strip()
            # Look for bullet points with values
            for line in values_section.split('\n'):
                line = line.strip()
                # Skip empty lines
                if not line:
                    continue
                
                # Remove bullet points and other markers
                cleaned_line = re.sub(r'^[\s•\-–—*•●➢➤‣◦◆◇]+\s*', '', line)
                
                # Skip lines that are too short
                if len(cleaned_line) < 5:
                    continue
                
                # First word is likely a value
                first_word_match = re.match(r'^([A-Za-z]+)', cleaned_line)
                if first_word_match:
                    culture_keywords.add(first_word_match.group(1).lower())
        
        job_info["culture_keywords"] = sorted(list(culture_keywords))
        
        # Extract job level/seniority
        seniority_levels = ["Junior", "Entry", "Mid", "Senior", "Lead", "Principal", "Staff", "Director", "Manager", "Head"]
        job_level = ""
        
        for level in seniority_levels:
            level_pattern = r'\b' + re.escape(level) + r'\b'
            if re.search(level_pattern, job_description, re.IGNORECASE):
                job_level = level
                break
        
        job_info["job_level"] = job_level
        
        # Overall keyword extraction for matching
        job_info["keywords"] = self._extract_keywords_regex(job_description)
        
        return job_info 