import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import numpy as np
from typing import Dict, List, Any, Tuple, Set

class NLPAnalysisService:
    """Service for analyzing resumes against job descriptions using NLP"""
    
    def __init__(self):
        # Load spaCy model with word vectors
        try:
            # Try to load the medium model with word vectors first
            try:
                self.nlp = spacy.load("en_core_web_md")
                self.has_vectors = True
                print("Loaded SpaCy model with word vectors (en_core_web_md)")
            except OSError:
                # Fall back to small model if medium is not available
                self.nlp = spacy.load("en_core_web_sm")
                self.has_vectors = False
                print("Warning: Using SpaCy model without word vectors (en_core_web_sm). For better results, install en_core_web_md with: python -m spacy download en_core_web_md")
        except OSError:
            raise ImportError(
                "SpaCy model not found. "
                "Install it with: python -m spacy download en_core_web_md"
            )
        
        # Initialize TF-IDF vectorizer as backup
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 3),  # Include phrases up to 3 words
            max_df=0.85,         # Ignore terms that appear in more than 85% of documents
            min_df=0.01          # Ignore terms that appear in less than 1% of documents
        )
        
        # Common words to filter out from keywords
        self.common_words = {
            'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
            'when', 'where', 'how', 'all', 'with', 'for', 'that', 'this', 'these',
            'those', 'to', 'of', 'in', 'on', 'by', 'at', 'from', 'up', 'down',
            'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
            'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
            'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
            's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'we', 'our',
            'us', 'you', 'your', 'they', 'their', 'them', 'he', 'him', 'his', 'she',
            'her', 'it', 'its', 'i', 'me', 'my', 'myself', 'yourself', 'himself',
            'herself', 'itself', 'ourselves', 'themselves', 'who', 'whom', 'whose',
            'which', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
            'does', 'did', 'doing', 'would', 'could', 'should', 'shall', 'might',
            'must', 'about', 'against', 'between', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'am', 'is', 'are', 'was', 'were'
        }
        
        # Define important multi-word phrases for skill matching
        self.skill_phrases = [
            "machine learning", "deep learning", "artificial intelligence", "data science",
            "data analysis", "data visualization", "business intelligence", "statistical analysis",
            "natural language processing", "computer vision", "neural networks", "big data",
            "cloud computing", "web development", "mobile development", "software engineering",
            "devops", "ci/cd", "continuous integration", "continuous deployment", "test automation",
            "unit testing", "integration testing", "functional testing", "regression testing",
            "project management", "agile methodology", "scrum", "kanban", "waterfall",
            "front end development", "back end development", "full stack development",
            "database administration", "system administration", "network administration",
            "information security", "cybersecurity", "cloud security", "data security",
            "user experience", "user interface", "responsive design", "mobile first",
            "rest api", "graphql", "microservices", "serverless architecture",
            "version control", "git", "github", "gitlab", "bitbucket",
            "docker", "kubernetes", "containerization", "virtualization",
            "aws", "azure", "gcp", "cloud platforms", "iaas", "paas", "saas",
            "data modeling", "data warehousing", "etl", "data mining", "data engineering",
            "javascript frameworks", "react", "angular", "vue", "node.js", "express",
            "python frameworks", "django", "flask", "fastapi", "pyramid",
            "java frameworks", "spring", "hibernate", "struts", "jsf",
            "database systems", "sql", "nosql", "mysql", "postgresql", "mongodb", "redis",
            "team leadership", "cross functional teams", "stakeholder management",
            "technical documentation", "api documentation", "requirements gathering",
            "problem solving", "critical thinking", "analytical skills", "communication skills"
        ]
    
    def extract_keywords(self, text: str) -> List[str]:
        """
        Extract important keywords from text
        
        Args:
            text: Input text to extract keywords from
            
        Returns:
            List of extracted keywords
        """
        # Process text with spaCy
        doc = self.nlp(text)
        
        # Extract nouns, proper nouns, skills, and other relevant terms
        keywords = []
        
        # Get all noun phrases (potential skills, job titles, etc.)
        for chunk in doc.noun_chunks:
            # Clean up and normalize the noun phrase
            clean_text = self._clean_text(chunk.text)
            if clean_text and len(clean_text.split()) <= 3 and not self._is_common_word(clean_text):
                keywords.append(clean_text)
        
        # Add named entities (organizations, products, etc.)
        for entity in doc.ents:
            if entity.label_ in ["ORG", "PRODUCT", "GPE", "WORK_OF_ART"]:
                clean_text = self._clean_text(entity.text)
                if clean_text and not self._is_common_word(clean_text):
                    keywords.append(clean_text)
        
        # Extract multi-word phrases using spaCy's dependency parsing
        for token in doc:
            if token.dep_ in ["compound", "amod"] and token.head.pos_ in ["NOUN", "PROPN"]:
                phrase = f"{token.text} {token.head.text}"
                clean_phrase = self._clean_text(phrase)
                if clean_phrase and not self._is_common_word(clean_phrase):
                    keywords.append(clean_phrase)
        
        # Add technical terms, programming languages, tools, etc.
        tech_patterns = [
            "python", "java", "javascript", "c\\+\\+", "typescript", "react", 
            "angular", "vue", "node\\.js", "express", "django", "flask", "spring", 
            "docker", "kubernetes", "aws", "azure", "gcp", "sql", "nosql", 
            "mongodb", "postgresql", "mysql", "git", "github", "gitlab", "ci/cd",
            "agile", "scrum", "kanban", "jira", "confluence", "machine learning",
            "deep learning", "ai", "artificial intelligence", "data science",
            "data analysis", "big data", "hadoop", "spark", "tableau", "power bi",
            "excel", "word", "powerpoint", "photoshop", "illustrator", "figma",
            "sketch", "adobe", "ui", "ux", "user interface", "user experience",
            "frontend", "backend", "full stack", "devops", "sre", "security",
            "testing", "qa", "quality assurance", "automation", "rest", "api",
            "graphql", "microservices", "serverless", "cloud", "linux", "unix",
            "windows", "macos", "ios", "android", "mobile", "web", "desktop"
        ]
        
        # Find technical terms in text
        for pattern in tech_patterns:
            matches = re.finditer(r'\b' + pattern + r'\b', text.lower())
            for match in matches:
                keywords.append(match.group(0))
        
        # Check for predefined multi-word phrases
        for phrase in self.skill_phrases:
            if phrase.lower() in text.lower():
                keywords.append(phrase)
        
        # Extract years of experience patterns
        experience_patterns = [
            r'\b(\d+)\+?\s*years?\s+(?:of\s+)?experience\b',
            r'\b(\d+)\+?\s*\+\s*years?\s+(?:of\s+)?experience\b',
            r'\bexperience\s+(?:of\s+)?(\d+)\+?\s*years?\b',
            r'\bexperienced\s+(?:of\s+)?(\d+)\+?\s*years?\b',
        ]
        
        for pattern in experience_patterns:
            matches = re.finditer(pattern, text.lower())
            for match in matches:
                if match.group(1):
                    keywords.append(f"{match.group(1)} years experience")
        
        # Extract education related keywords
        education_keywords = [
            "bachelor", "master", "phd", "doctorate", "degree", "bs", "ms", "ba", "ma",
            "computer science", "engineering", "information technology", "it", "software engineering"
        ]
        
        for keyword in education_keywords:
            if re.search(r'\b' + keyword + r'\b', text.lower()):
                keywords.append(keyword)
        
        # Filter out common words and very short terms
        filtered_keywords = []
        for keyword in keywords:
            if len(keyword) > 1 and not self._is_common_word(keyword):
                filtered_keywords.append(keyword)
        
        # Remove duplicates and sort
        return sorted(list(set(filtered_keywords)))
    
    def _is_common_word(self, word: str) -> bool:
        """Check if a word is a common word that should be filtered out"""
        return word.lower() in self.common_words
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation and special characters
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def calculate_semantic_similarity(self, resume_text: str, job_description: str) -> float:
        """
        Calculate semantic similarity between resume and job description using SpaCy's word vectors
        
        Args:
            resume_text: Extracted text from resume
            job_description: Job description text
            
        Returns:
            Similarity score between 0 and 100
        """
        # Process texts with spaCy
        resume_doc = self.nlp(resume_text[:25000])  # Limit text length to avoid memory issues
        job_doc = self.nlp(job_description[:25000])
        
        # If we have a model with vectors, use document similarity
        if self.has_vectors:
            # Calculate semantic similarity using SpaCy's document similarity
            similarity_score = resume_doc.similarity(job_doc) * 100
        else:
            # Fall back to TF-IDF if no vectors available
            similarity_score = self._calculate_tfidf_similarity(resume_text, job_description)
        
        return similarity_score
    
    def _calculate_tfidf_similarity(self, resume_text: str, job_description: str) -> float:
        """Calculate similarity using TF-IDF and cosine similarity"""
        # Clean texts
        resume_clean = self._clean_text(resume_text)
        job_clean = self._clean_text(job_description)
        
        try:
            # Create TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform([resume_clean, job_clean])
            
            # Calculate cosine similarity
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Convert to percentage (0-100 scale)
            similarity_score = round(cosine_sim * 100)
            return similarity_score
        except:
            # Fallback to keyword matching if TF-IDF fails
            return self._calculate_keyword_similarity(resume_text, job_description)
    
    def calculate_similarity(self, resume_text: str, job_description: str) -> float:
        """
        Calculate overall similarity score between resume and job description
        
        Args:
            resume_text: Extracted text from resume
            job_description: Job description text
            
        Returns:
            Similarity score between 0 and 100
        """
        # Calculate semantic similarity
        semantic_score = self.calculate_semantic_similarity(resume_text, job_description)
        
        # Calculate keyword-based similarity
        resume_keywords = self.extract_keywords(resume_text)
        job_keywords = self.extract_keywords(job_description)
        
        # Find matching keywords
        matched_keywords = self.find_matching_keywords(resume_keywords, job_keywords)
        
        # Find semantically similar keywords (if we have word vectors)
        similar_keywords = []
        if self.has_vectors:
            similar_keywords = self.find_semantically_similar_keywords(resume_keywords, job_keywords)
            # Remove any that are already in matched_keywords
            similar_keywords = [kw for kw in similar_keywords if kw.lower() not in [m.lower() for m in matched_keywords]]
        
        # Calculate keyword match percentage
        if job_keywords:
            # Include both exact matches and semantically similar keywords
            total_matches = len(set(matched_keywords + similar_keywords))
            keyword_match_percentage = min(100, (total_matches / len(job_keywords)) * 100)
        else:
            keyword_match_percentage = 0
        
        # Blend semantic score with keyword match score (60% semantic, 40% keyword match)
        blended_score = (semantic_score * 0.6) + (keyword_match_percentage * 0.4)
        
        # Apply a minimum threshold for resumes with some matching keywords
        if blended_score < 20 and len(matched_keywords) > 0:
            # If there are some matched keywords, ensure a minimum score
            min_score = 20 + (len(matched_keywords) * 2)  # Add 2% per matched keyword
            blended_score = max(min_score, blended_score)
        
        return round(min(100, blended_score))  # Cap at 100
    
    def _calculate_keyword_similarity(self, resume_text: str, job_description: str) -> float:
        """Calculate similarity based on keyword overlap when other methods fail"""
        resume_keywords = self.extract_keywords(resume_text)
        job_keywords = self.extract_keywords(job_description)
        
        if not job_keywords:
            return 0
        
        # Find matching keywords
        matched_keywords = self.find_matching_keywords(resume_keywords, job_keywords)
        
        # Calculate match percentage
        match_percentage = len(matched_keywords) / len(job_keywords) * 100
        
        return round(match_percentage)
    
    def find_matching_keywords(self, resume_keywords: List[str], job_keywords: List[str]) -> List[str]:
        """Find keywords that appear in both resume and job description"""
        resume_set = set(keyword.lower() for keyword in resume_keywords)
        job_set = set(keyword.lower() for keyword in job_keywords)
        
        return sorted(list(resume_set.intersection(job_set)))
    
    def find_semantically_similar_keywords(self, resume_keywords: List[str], job_keywords: List[str], 
                                          threshold: float = 0.75) -> List[str]:
        """
        Find keywords from resume that are semantically similar to job keywords
        
        Args:
            resume_keywords: Keywords extracted from resume
            job_keywords: Keywords extracted from job description
            threshold: Similarity threshold (0-1) for considering keywords as similar
            
        Returns:
            List of semantically similar keywords
        """
        if not self.has_vectors:
            return []  # Return empty list if no word vectors available
        
        similar_keywords = []
        
        # Process each resume keyword
        for resume_kw in resume_keywords:
            # Skip if it's already an exact match
            if resume_kw.lower() in [jk.lower() for jk in job_keywords]:
                continue
                
            # Process with spaCy to get vector
            resume_kw_doc = self.nlp(resume_kw)
            
            # Skip words without vectors
            if not resume_kw_doc.vector_norm:
                continue
            
            # Check similarity against each job keyword
            for job_kw in job_keywords:
                job_kw_doc = self.nlp(job_kw)
                
                # Skip words without vectors
                if not job_kw_doc.vector_norm:
                    continue
                
                # Calculate similarity
                similarity = resume_kw_doc.similarity(job_kw_doc)
                
                # If similarity is above threshold, consider it a match
                if similarity >= threshold:
                    similar_keywords.append(resume_kw)
                    break  # No need to check other job keywords
        
        return similar_keywords
    
    def find_missing_keywords(self, resume_keywords: List[str], job_keywords: List[str]) -> List[str]:
        """Find important keywords from job description that are missing in resume"""
        resume_set = set(keyword.lower() for keyword in resume_keywords)
        job_set = set(keyword.lower() for keyword in job_keywords)
        
        # Find semantically similar keywords
        if self.has_vectors:
            similar_keywords = self.find_semantically_similar_keywords(resume_keywords, job_keywords)
            similar_set = set(keyword.lower() for keyword in similar_keywords)
            
            # Remove both exact matches and semantically similar keywords
            missing_set = job_set - resume_set - similar_set
        else:
            # If no vectors, just use exact matches
            missing_set = job_set - resume_set
        
        # Filter out common words from missing keywords
        missing_keywords = []
        for keyword in missing_set:
            if not self._is_common_word(keyword):
                missing_keywords.append(keyword)
        
        return sorted(missing_keywords)
    
    def generate_recommendations(self, missing_keywords: List[str]) -> List[str]:
        """Generate recommendations based on missing keywords"""
        recommendations = []
        
        # Group related keywords
        skill_groups = self._group_related_keywords(missing_keywords)
        
        # Generate recommendations for each group
        for group_name, keywords in skill_groups.items():
            if len(keywords) > 0:
                if group_name == "technical_skills":
                    recommendations.append(f"Add technical skills like {', '.join(keywords[:3])}" + 
                                         (f" and {len(keywords) - 3} more" if len(keywords) > 3 else ""))
                elif group_name == "soft_skills":
                    recommendations.append(f"Highlight soft skills such as {', '.join(keywords[:3])}" +
                                         (f" and {len(keywords) - 3} more" if len(keywords) > 3 else ""))
                elif group_name == "experience":
                    recommendations.append(f"Include experience with {', '.join(keywords[:3])}" +
                                         (f" and {len(keywords) - 3} more" if len(keywords) > 3 else ""))
                elif group_name == "education":
                    recommendations.append(f"Mention education related to {', '.join(keywords[:3])}" +
                                         (f" and {len(keywords) - 3} more" if len(keywords) > 3 else ""))
        
        # Add general recommendations if few specific ones were generated
        if len(recommendations) < 3:
            recommendations.append("Use more specific achievements with metrics in your experience section")
            recommendations.append("Tailor your resume summary to match the job requirements")
            recommendations.append("Include relevant projects that demonstrate your skills")
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _group_related_keywords(self, keywords: List[str]) -> Dict[str, List[str]]:
        """Group keywords into categories"""
        groups = {
            "technical_skills": [],
            "soft_skills": [],
            "experience": [],
            "education": []
        }
        
        # Define category patterns
        patterns = {
            "technical_skills": [
                "python", "java", "javascript", "typescript", "react", "angular", "vue", 
                "node", "express", "django", "flask", "spring", "docker", "kubernetes",
                "aws", "azure", "gcp", "sql", "nosql", "mongodb", "postgresql", "mysql",
                "git", "github", "gitlab", "ci/cd", "html", "css", "sass", "less",
                "rest", "api", "web", "frontend", "backend", "full stack", "devops"
            ],
            "soft_skills": [
                "communication", "teamwork", "leadership", "problem solving", "critical thinking",
                "time management", "organization", "creativity", "adaptability", "flexibility",
                "interpersonal", "presentation", "public speaking", "writing", "negotiation",
                "conflict resolution", "decision making", "stress management", "collaboration"
            ],
            "experience": [
                "year", "years", "month", "months", "experience", "work", "project", "lead",
                "manager", "director", "supervisor", "coordinator", "specialist", "analyst",
                "developer", "engineer", "architect", "consultant", "administrator"
            ],
            "education": [
                "degree", "bachelor", "master", "phd", "doctorate", "certification", "certificate",
                "course", "training", "workshop", "seminar", "bootcamp", "university", "college",
                "school", "education", "gpa", "grade", "graduate", "undergraduate", "computer science"
            ]
        }
        
        # Categorize each keyword
        for keyword in keywords:
            keyword_lower = keyword.lower()
            assigned = False
            
            for category, category_patterns in patterns.items():
                for pattern in category_patterns:
                    if pattern in keyword_lower:
                        groups[category].append(keyword)
                        assigned = True
                        break
                if assigned:
                    break
            
            # If not assigned to any specific category, put in technical skills as default
            if not assigned:
                groups["technical_skills"].append(keyword)
        
        return groups
    
    def analyze_resume(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Analyze a resume against a job description
        
        Args:
            resume_text: Extracted text from resume
            job_description: Job description text
            
        Returns:
            Analysis result with score, matched keywords, etc.
        """
        # Extract keywords
        resume_keywords = self.extract_keywords(resume_text)
        job_keywords = self.extract_keywords(job_description)
        
        # Calculate similarity score
        score = self.calculate_similarity(resume_text, job_description)
        
        # Find matching and missing keywords
        matched_keywords = self.find_matching_keywords(resume_keywords, job_keywords)
        
        # Find semantically similar keywords (if we have word vectors)
        similar_keywords = []
        if self.has_vectors:
            similar_keywords = self.find_semantically_similar_keywords(resume_keywords, job_keywords)
            # Remove any that are already in matched_keywords
            similar_keywords = [kw for kw in similar_keywords if kw.lower() not in [m.lower() for m in matched_keywords]]
        
        # Find missing keywords
        missing_keywords = self.find_missing_keywords(resume_keywords, job_keywords)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(missing_keywords)
        
        return {
            "score": score,
            "matchedKeywords": matched_keywords,
            "similarKeywords": similar_keywords[:10],  # Limit to top 10 similar keywords
            "missingKeywords": missing_keywords[:10],  # Limit to top 10 missing keywords
            "recommendations": recommendations
        } 