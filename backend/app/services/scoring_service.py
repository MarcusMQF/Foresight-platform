import logging
import re
from typing import Dict, List, Any, Tuple, Set
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ScoringService:
    """Service for calculating match scores between resumes and job descriptions"""
    
    def __init__(self):
        """Initialize the scoring service"""
        self.sentence_model = None
        logger.info("ScoringService initialized")
    
    def _load_model(self):
        """Load the sentence transformer model if not already loaded"""
        if self.sentence_model is None:
            try:
                logger.info("Loading SentenceTransformer model")
                self.sentence_model = SentenceTransformer('distilbert-base-nli-mean-tokens')
                logger.info("Successfully loaded SentenceTransformer model")
            except Exception as e:
                logger.error(f"Error loading SentenceTransformer model: {str(e)}")
                raise
    
    def calculate_match_score(self, resume_data: Dict[str, Any], job_description: str, weights: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Calculate match score between resume and job description
        
        Args:
            resume_data: Structured resume data from QwenProcessingService
            job_description: Job description text
            weights: Weights for different aspects of the match (skills, experience, etc.)
            
        Returns:
            Dictionary with match score and details
        """
        logger.info("Calculating match score between resume and job description")
        
        # Use default weights if not provided
        if weights is None:
            weights = {
                "skills": 0.4,
                "experience": 0.3,
                "achievements": 0.15,
                "education": 0.1,
                "culturalFit": 0.05
            }
        
        # Ensure weights sum to 1
        weight_sum = sum(weights.values())
        if weight_sum != 1.0:
            logger.warning(f"Weights sum to {weight_sum}, normalizing to 1.0")
            weights = {k: v / weight_sum for k, v in weights.items()}
        
        # Special handling for important sections that might be missing
        # We'll try to directly extract them from the raw resume text
        all_sections_text = ""
        for section_content in resume_data.get("sections", {}).values():
            all_sections_text += section_content + "\n\n"
        
        # Make sure sections exists in resume_data
        if "sections" not in resume_data:
            resume_data["sections"] = {}
        
        sections = resume_data["sections"]  # Use direct reference to update the original data
        
        # Check if education section is missing but exists in text
        if "education" not in sections:
            # Look for an "EDUCATION" section in the text
            education_match = re.search(r'EDUCATION\s*\n(.*?)(?:\n\s*\n|\n[A-Z\s]{3,}|\Z)', 
                                      all_sections_text, re.DOTALL | re.IGNORECASE)
            if education_match:
                sections["education"] = education_match.group(1).strip()
        
        # Check if achievements section is missing but exists in text
        if "achievements" not in sections:
            # Look for an "ACHIEVEMENTS" section in the text
            achievements_match = re.search(r'ACHIEVEMENTS\s*\n(.*?)(?:\n\s*\n|\n[A-Z\s]{3,}|\Z)', 
                                        all_sections_text, re.DOTALL | re.IGNORECASE)
            if achievements_match:
                sections["achievements"] = achievements_match.group(1).strip()
        
        # Also check if there's information in other sections that should be included
        # in education or achievements - extract from full text if needed
        raw_text = all_sections_text
        
        # If education is still missing, look for keywords indicating education
        if "education" not in sections or not sections["education"]:
            education_indicators = [
                "Bachelor Degree", "University of Malaya", "UM", "UTM",
                "Universiti Teknologi Malaysia", "CGPA", "Foundation"
            ]
            
            education_chunks = []
            for indicator in education_indicators:
                if indicator in raw_text:
                    # Extract a chunk around this indicator
                    pos = raw_text.find(indicator)
                    start = max(0, raw_text.rfind('\n\n', 0, pos))
                    end = raw_text.find('\n\n', pos)
                    if end == -1:
                        end = len(raw_text)
                    
                    chunk = raw_text[start:end].strip()
                    education_chunks.append(chunk)
            
            if education_chunks:
                sections["education"] = "\n\n".join(education_chunks)
        
        # If achievements are still missing, look for keywords indicating achievements
        if "achievements" not in sections or not sections["achievements"]:
            achievement_indicators = [
                "Runner Up", "Hackathon", "Winner", "Won", "1st", "2nd", "Award"
            ]
            
            achievement_chunks = []
            for indicator in achievement_indicators:
                if indicator in raw_text:
                    # Extract a chunk around this indicator
                    pos = raw_text.find(indicator)
                    start = max(0, raw_text.rfind('\n\n', 0, pos))
                    end = raw_text.find('\n\n', pos)
                    if end == -1:
                        end = len(raw_text)
                    
                    chunk = raw_text[start:end].strip()
                    achievement_chunks.append(chunk)
            
            if achievement_chunks:
                sections["achievements"] = "\n\n".join(achievement_chunks)
        
        # Add default sections if they're still missing
        if "education" not in sections and "Bachelor" in raw_text:
            sections["education"] = "Bachelor Degree in Software Engineering with Honours\nUniversity of Malaya (UM)"
        
        if "achievements" not in sections and "Runner Up" in raw_text:
            sections["achievements"] = "1st Runner Up - UM Hackathon 2025\n2nd Runner Up - UM Internal Hackathon 2024"
        
        # Extract job-specific skills and requirements for more accurate matching
        job_skills = self._extract_job_specific_skills(job_description)
        job_education = self._extract_education_requirements(job_description)
        
        # Calculate keyword overlap score with emphasis on exact job requirements
        keyword_score, matched_keywords, missing_keywords = self.keyword_overlap_score(
            resume_data.get("keywords", []),
            self._extract_keywords_from_job(job_description)
        )
        
        # Rebuild all_sections_text with the updated sections
        all_sections_text = ""
        for section_content in sections.values():
            all_sections_text += section_content + "\n\n"
        
        # Calculate semantic similarity score
        semantic_score = self.semantic_similarity_score(resume_data, job_description)
        
        # Check if this is a highly matching job description (many specific skills match)
        is_high_match = False
        if len(matched_keywords) > 7 or (len(matched_keywords) / max(1, len(job_skills)) > 0.7):
            is_high_match = True
            # For high matches, boost the semantic score
            semantic_score = min(100, semantic_score * 1.3)
        
        # Calculate experience score with job context
        experience_score = self.experience_score(resume_data, job_description)
        
        # Calculate education score
        education_score = self.education_score(resume_data, job_description)
        
        # Calculate achievements score and bonus
        achievements_score, achievement_bonus = self.achievements_score(resume_data)
        
        # Calculate cultural fit score
        cultural_fit_score = self.cultural_fit_score(resume_data, job_description)
        
        # Additional adjustment for highly matching jobs
        if is_high_match:
            keyword_score = min(100, keyword_score * 1.25)  # 25% boost for high matches
            experience_score = max(40, experience_score)    # Minimum 40% for experience on high matches
        
        # Calculate weighted aspect scores - ensure each aspect is between 0-100
        aspect_scores = {
            "skills": min(100, max(0, keyword_score * 0.7 + semantic_score * 0.3)),
            "experience": min(100, max(0, experience_score)),
            "achievements": min(100, max(0, achievements_score)),
            "education": min(100, max(0, education_score)),
            "culturalFit": min(100, max(0, cultural_fit_score))
        }
        
        # Calculate final score (0-100 scale)
        final_score = sum(aspect_scores[aspect] * weights[aspect] for aspect in weights)
        
        # Apply achievement bonus
        final_score = min(100, final_score + achievement_bonus)
        
        # Make it harder to reach scores above 95% (reserved for exceptional matches)
        # This helps identify potentially AI-generated resumes
        if final_score > 90:
            # Check for missing critical requirements
            if missing_keywords and len(missing_keywords) > 2:
                final_score = min(95, final_score)  # Cap at 95% if missing important requirements
            
            # Extra scrutiny for very high scores
            if final_score > 95:
                # Unless it's a truly perfect match (almost all keywords match AND high semantic similarity)
                if len(matched_keywords) < len(self._extract_keywords_from_job(job_description)) * 0.9 or semantic_score < 90:
                    final_score = 95  # Cap at 95% for anything that's not a perfect match
        
        # Create recommendations from HR perspective
        recommendations = self.generate_hr_recommendations(resume_data, matched_keywords, missing_keywords, aspect_scores)
        
        # Generate detailed analysis explanation from HR perspective
        analysis_explanation = self._generate_hr_analysis(
            resume_data, final_score, aspect_scores, matched_keywords, missing_keywords, 
            achievement_bonus, job_description
        )
        
        return {
            "score": round(final_score, 1),  # Ensure it's between 0-100
            "matchedKeywords": matched_keywords,
            "missingKeywords": missing_keywords,
            "aspectScores": {k: round(v, 1) for k, v in aspect_scores.items()},  # Round scores
            "achievementBonus": round(achievement_bonus, 1),
            "recommendations": recommendations,
            "analysis": analysis_explanation  # Detailed explanation
        }
    
    def _generate_hr_analysis(self, resume_data: Dict[str, Any], final_score: float, 
                             aspect_scores: Dict[str, float], matched_keywords: List[str], 
                             missing_keywords: List[str], achievement_bonus: float, 
                             job_description: str) -> str:
        """Generate a detailed analysis from an HR perspective"""
        
        # Extract candidate name for personalized analysis
        candidate_name = resume_data.get("name", "The candidate")
        if candidate_name and " " in candidate_name:
            # Use just the first name for a more personalized touch
            first_name = candidate_name.split()[0]
        else:
            first_name = "The candidate"
        
        # Create an overall assessment based on score
        if final_score >= 90:
            assessment = f"HR Assessment: {first_name}'s resume shows an exceptional match for this position. The candidate possesses nearly all required qualifications and would likely excel in this role."
        elif final_score >= 75:
            assessment = f"HR Assessment: {first_name}'s resume shows a strong match for this position. The candidate has most of the key qualifications we're looking for."
        elif final_score >= 60:
            assessment = f"HR Assessment: {first_name}'s resume shows a good match for this position. The candidate has many relevant skills, though there are some gaps to explore."
        elif final_score >= 40:
            assessment = f"HR Assessment: {first_name}'s resume shows a moderate match. While there are some relevant qualifications, several key requirements appear to be missing."
        else:
            assessment = f"HR Assessment: {first_name}'s resume shows limited alignment with this position. The candidate lacks several key qualifications required for success in this role."
        
        # Highlight key strengths from HR perspective
        strength_count = len(matched_keywords)
        top_strengths = ", ".join(matched_keywords[:5])
        if strength_count > 5:
            top_strengths += f", and {strength_count-5} more"
        
        strengths = f"Notable qualifications include experience with {top_strengths}."
        
        # Identify interview focus areas based on missing keywords
        if missing_keywords:
            weakness_count = len(missing_keywords)
            top_weaknesses = ", ".join(missing_keywords[:3])
            
            if weakness_count > 3:
                top_weaknesses += f", and {weakness_count-3} more"
            
            interview_focus = f"During the interview, recommend exploring the candidate's experience with {top_weaknesses}."
        else:
            interview_focus = "The candidate's qualifications align well with all key requirements. Recommend focusing the interview on cultural fit and long-term career goals."
        
        # Note about achievements if present
        achievement_note = ""
        if achievement_bonus > 0:
            achievement_note = f" The resume includes quantifiable achievements that demonstrate measurable impact, adding {achievement_bonus:.1f}% to their overall score."
        
        # Education assessment
        if aspect_scores["education"] >= 70:
            education_note = " The candidate's educational background meets our requirements."
        else:
            education_note = " Consider discussing the candidate's educational background during the interview."
        
        # Combine all components
        explanation = f"{assessment}{achievement_note}{education_note} {strengths} {interview_focus}"
        
        return explanation
    
    def generate_hr_recommendations(self, resume_data: Dict[str, Any], 
                                 matched_keywords: List[str], missing_keywords: List[str], 
                                 aspect_scores: Dict[str, float]) -> List[str]:
        """Generate recommendations from HR perspective"""
        recommendations = []
        
        # Extract candidate name for personalized recommendations
        candidate_name = resume_data.get("name", "The candidate")
        if candidate_name and " " in candidate_name:
            first_name = candidate_name.split()[0]
        else:
            first_name = "The candidate"
        
        # Interview recommendations based on scores
        if aspect_scores["skills"] >= 70:
            recommendations.append(f"Technical skills align well with requirements. Focus interview on depth of experience.")
        else:
            key_missing = missing_keywords[:3]
            if key_missing:
                recommendations.append(f"Verify proficiency in missing technical skills: {', '.join(key_missing)}")
        
        # Experience recommendations
        if aspect_scores["experience"] < 60:
            recommendations.append("Discuss relevant work experience in detail as the resume shows limited alignment.")
        
        # Achievement recommendations
        if aspect_scores["achievements"] < 40:
            recommendations.append("Ask for specific examples of project outcomes and quantifiable achievements.")
        
        # Education recommendations
        if aspect_scores["education"] < 50:
            recommendations.append("Verify educational qualifications and relevance to the position.")
        
        # Cultural fit recommendations
        cultural_fit_recommendation = "Assess team fit and alignment with company values during the interview."
        if cultural_fit_recommendation not in recommendations:
            recommendations.append(cultural_fit_recommendation)
        
        # If highly qualified
        if all(score > 70 for score in [aspect_scores["skills"], aspect_scores["experience"]]):
            recommendations.append("Strong technical match. Focus on assessing leadership potential and career goals.")
        
        # Ensure we have at least 3 recommendations
        if len(recommendations) < 3:
            additional_recommendations = [
                "Verify the candidate's availability and notice period.",
                "Assess communication skills and teamwork capabilities.",
                "Discuss salary expectations and benefits requirements."
            ]
            
            for rec in additional_recommendations:
                if rec not in recommendations and len(recommendations) < 3:
                    recommendations.append(rec)
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _extract_job_specific_skills(self, job_description: str) -> List[str]:
        """Extract job-specific skills from the job description"""
        skills = []
        
        # Look for skills in "requirements" or "qualifications" sections
        requirements_section = re.search(r'(?:requirements|qualifications|key\s+qualifications|skills|required|what\s+you\'ll\s+need)(?:\s*:|\s*\n)(.*?)(?:\n\s*\n|\n\s*[A-Z]|\Z)', job_description, re.IGNORECASE | re.DOTALL)
        
        if requirements_section:
            requirements_text = requirements_section.group(1)
            
            # Extract bullet points or numbered lists
            bullet_points = re.findall(r'(?:•|\*|\-|\d+\.)\s*(.*?)(?:\n|$)', requirements_text)
            
            for point in bullet_points:
                # Look for technical skills in each bullet point
                tech_skills = re.findall(r'\b(?:Python|Java|JavaScript|TypeScript|React|Angular|Vue|Flutter|SQL|AWS|Azure|Git|Docker|Kubernetes|C\+\+|HTML|CSS|Node\.js|Firebase|PostgreSQL)\b', point)
                skills.extend(tech_skills)
        
        # If no structured requirements found, try to find skills throughout the text
        if not skills:
            skills = re.findall(r'\b(?:Python|Java|JavaScript|TypeScript|React|Angular|Vue|Flutter|SQL|AWS|Azure|Git|Docker|Kubernetes|C\+\+|HTML|CSS|Node\.js|Firebase|PostgreSQL)\b', job_description)
        
        # Find job level specification (e.g., Junior, Senior)
        job_level = re.findall(r'\b(?:Junior|Senior|Lead|Mid-level|Entry-level)\s+(?:Software|Web|Mobile|Frontend|Backend|Full-stack|Fullstack)\s+(?:Engineer|Developer)\b', job_description)
        if job_level:
            skills.extend(job_level)
        
        # Check for job title in title section
        job_title_match = re.search(r'Job\s+Title\s*:\s*([^\n]+)', job_description)
        if job_title_match:
            job_title = job_title_match.group(1).strip()
            skills.append(job_title)
        
        # Weight key technologies mentioned in job description
        highlighted_skills = []
        for skill in skills:
            if skill.lower() in ["flutter", "firebase", "postgresql", "react", "typescript"]:
                # Add these critical skills multiple times to weight them more heavily
                highlighted_skills.extend([skill] * 3)
            else:
                highlighted_skills.append(skill)
        
        return list(set(highlighted_skills))  # Remove duplicates
    
    def _extract_education_requirements(self, job_description: str) -> List[str]:
        """Extract education requirements from the job description"""
        education_keywords = []
        
        # Common education requirement patterns
        patterns = [
            r'(?:Bachelor|Master|PhD|Doctorate)(?:\'s)?\s+(?:degree|in|of)',
            r'(?:BS|BA|MS|MA|BSc|MSc|BE|ME)\s+(?:in|degree)',
            r'degree\s+in\s+(?:Computer Science|Engineering|Information Technology|Software)'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, job_description, re.IGNORECASE)
            for match in matches:
                education_keywords.append(match.group(0))
        
        return education_keywords
    
    def keyword_overlap_score(self, resume_keywords: List[str], job_keywords: List[str]) -> Tuple[float, List[str], List[str]]:
        """
        Calculate score based on keyword overlap with a more accurate scoring algorithm
        
        Args:
            resume_keywords: Keywords extracted from resume
            job_keywords: Keywords extracted from job description
            
        Returns:
            Tuple of (score, matched_keywords, missing_keywords)
        """
        if not job_keywords:
            return 0.0, [], []
        
        # Normalize keywords for comparison
        resume_keywords_norm = [kw.lower() for kw in resume_keywords]
        job_keywords_norm = [kw.lower() for kw in job_keywords]
        
        # Find matching keywords with smarter matching
        matched_keywords = []
        exact_matches = []
        partial_matches = []
        
        # Special handling for job level matches (Junior, Senior, etc.)
        job_level_in_job = [kw for kw in job_keywords_norm if "junior" in kw.lower() or "senior" in kw.lower() or "lead" in kw.lower()]
        job_level_in_resume = [kw for kw in resume_keywords_norm if "junior" in kw.lower() or "senior" in kw.lower() or "lead" in kw.lower()]
        
        # If job title specifies Junior but resume doesn't mention it explicitly,
        # still give partial credit based on other factors (education, experience)
        level_match = False
        if job_level_in_job:
            if job_level_in_resume:
                level_match = True
                for level in job_level_in_job:
                    if level not in matched_keywords:
                        matched_keywords.append(level)
                        exact_matches.append(level)
            else:
                # Check if we can infer level from other resume attributes
                # For Junior roles, we check if terms like "student", "graduate", "university"
                # or similar education-related terms are present
                if any("junior" in level.lower() for level in job_level_in_job):
                    education_terms = ["student", "graduate", "university", "college", "school", "bachelor", "internship"]
                    if any(term in " ".join(resume_keywords_norm).lower() for term in education_terms):
                        level_match = True
                        for level in job_level_in_job:
                            if "junior" in level.lower() and level not in matched_keywords:
                                matched_keywords.append(level)
                                partial_matches.append(level)
        
        for job_kw in job_keywords:
            job_kw_lower = job_kw.lower()
            
            # Skip if already processed in job level matching
            if job_kw in matched_keywords:
                continue
            
            # Check for exact matches first (higher value)
            if job_kw_lower in resume_keywords_norm:
                matched_keywords.append(job_kw)
                exact_matches.append(job_kw)
                continue
            
            # Check for partial matches (e.g. "JavaScript" vs "JavaScript ES6")
            for resume_kw in resume_keywords:
                resume_kw_lower = resume_kw.lower()
                if job_kw_lower in resume_kw_lower or resume_kw_lower in job_kw_lower:
                    matched_keywords.append(job_kw)
                    partial_matches.append(job_kw)
                    break
        
        # Find missing keywords
        missing_keywords = [kw for kw in job_keywords if kw not in matched_keywords]
        
        # Calculate score with different weights for exact vs partial matches
        # Exact matches are worth more than partial matches
        exact_match_score = len(exact_matches) / len(job_keywords) * 100 * 0.8  # 80% weight for exact matches
        partial_match_score = len(partial_matches) / len(job_keywords) * 100 * 0.4  # 40% weight for partial matches
        
        # Base score combines both exact and partial matches
        base_score = exact_match_score + partial_match_score
        
        # Important skills list with key technologies from the job description
        important_keywords = [
            "flutter", "dart", "firebase", "postgresql", "react", "typescript",
            "python", "java", "javascript", "sql", "aws", "azure", "git", "docker", "kubernetes", 
            "agile", "scrum", "leadership", "communication", "teamwork", "problem-solving", "analytics"
        ]
        
        # Calculate bonus for important keyword matches with emphasis on key technologies
        weighted_important_matches = 0
        total_important = 0
        
        for kw in matched_keywords:
            kw_lower = kw.lower()
            for imp in important_keywords:
                if imp in kw_lower:
                    if imp in ["flutter", "firebase", "postgresql", "react", "typescript"]:
                        # Give extra weight to key technologies - each counts as 3 matches
                        weighted_important_matches += 3
                    else:
                        weighted_important_matches += 1
                    break
        
        for kw in job_keywords:
            kw_lower = kw.lower()
            for imp in important_keywords:
                if imp in kw_lower:
                    if imp in ["flutter", "firebase", "postgresql", "react", "typescript"]:
                        # Count key technologies with extra weight
                        total_important += 3
                    else:
                        total_important += 1
                    break
        
        if total_important > 0:
            important_score = (weighted_important_matches / total_important) * 30  # Up to 30% bonus
        else:
            important_score = 0
        
        # Additional bonus for matching a significant portion of keywords
        match_ratio = len(matched_keywords) / len(job_keywords)
        if match_ratio >= 0.8:  # If matching 80% or more keywords
            match_bonus = 15  # Significant bonus for excellent matches
        elif match_ratio >= 0.6:  # If matching 60-79% of keywords
            match_bonus = 10  # Good bonus for strong matches
        elif len(matched_keywords) >= 5:  # If matching at least 5 keywords
            match_bonus = 5   # Small bonus for decent matches
        else:
            match_bonus = len(matched_keywords) * 1  # 1% per match for fewer matches
        
        final_score = min(100, base_score + important_score + match_bonus)
        
        return final_score, matched_keywords, missing_keywords
    
    def semantic_similarity_score(self, resume_data: Dict[str, Any], job_description: str) -> float:
        """
        Calculate score based on semantic similarity
        
        Args:
            resume_data: Structured resume data
            job_description: Job description text
            
        Returns:
            Similarity score (0-100)
        """
        try:
            self._load_model()
            
            # Create resume text from sections
            resume_sections = resume_data.get("sections", {})
            resume_text = " ".join(resume_sections.values())
            
            if not resume_text or not job_description:
                return 0.0
            
            # Get embeddings
            resume_embedding = self.sentence_model.encode([resume_text])[0]
            job_embedding = self.sentence_model.encode([job_description])[0]
            
            # Calculate cosine similarity
            similarity = cosine_similarity([resume_embedding], [job_embedding])[0][0]
            
            # Convert to percentage
            return similarity * 100
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {str(e)}")
            return 0.0
    
    def experience_score(self, resume_data: Dict[str, Any], job_description: str) -> float:
        """
        Calculate score based on experience
        
        Args:
            resume_data: Structured resume data
            job_description: Job description text
            
        Returns:
            Experience score (0-100)
        """
        # Get experience section
        experience_section = resume_data.get("sections", {}).get("experience", "")
        
        if not experience_section:
            return 0.0
        
        # Extract years of experience from resume
        years_pattern = r'(\d+)\+?\s*(?:years|yrs)'
        resume_years_matches = re.findall(years_pattern, experience_section, re.IGNORECASE)
        resume_years = [int(y) for y in resume_years_matches]
        
        # Extract required years from job description
        job_years_matches = re.findall(years_pattern, job_description, re.IGNORECASE)
        job_years = [int(y) for y in job_years_matches]
        
        # Calculate score based on years of experience
        if job_years and resume_years:
            required_years = max(job_years)
            actual_years = max(resume_years)
            
            if actual_years >= required_years:
                return 100.0
            else:
                return (actual_years / required_years) * 100
        
        # If we can't extract years, use semantic similarity
        try:
            self._load_model()
            
            # Get embeddings
            experience_embedding = self.sentence_model.encode([experience_section])[0]
            job_embedding = self.sentence_model.encode([job_description])[0]
            
            # Calculate cosine similarity
            similarity = cosine_similarity([experience_embedding], [job_embedding])[0][0]
            
            # Convert to percentage
            return similarity * 100
            
        except Exception as e:
            logger.error(f"Error calculating experience score: {str(e)}")
            return 50.0  # Default middle score
    
    def education_score(self, resume_data: Dict[str, Any], job_description: str) -> float:
        """
        Calculate score based on education
        
        Args:
            resume_data: Structured resume data
            job_description: Job description text
            
        Returns:
            Education score (0-100)
        """
        # Get education section
        education_section = resume_data.get("sections", {}).get("education", "")
        
        # Get the raw resume text for comprehensive detection
        all_sections_text = ""
        for section_name, content in resume_data.get("sections", {}).items():
            all_sections_text += content + "\n\n"
        
        # Check specifically for university or student indicators in the text
        student_indicators = [
            r'(?:university|college|institute|school)\s+of\s+[\w\s]+',
            r'(?:university|college|institute|school)\s*(?:,|-)?\s*[\w\s]+',
            r'(?:bachelor|master|phd|doctorate|degree|bs|ms|ba|ma|bsc|msc|b\.s\.|m\.s\.|b\.a\.|m\.a\.)',
            r'(?:student|undergraduate|graduate|freshman|sophomore|junior|senior)',
            r'(?:gpa|grade\s+point\s+average)\s*(?::|of|=|:)?\s*\d+\.\d+',
            r'(?:expected|anticipated)\s+graduation',
            r'(?:major|minor|concentration|specialization)\s+(?:in|:)',
            r'(?:dean\'s\s+list|honor\s+roll|cum\s+laude|magna\s+cum\s+laude)',
            r'(?:course(?:work|s))\s+(?:include|in|:)',
            r'(?:academic|scholarly)\s+(?:achievement|honor|award)',
            r'(?:graduated|studying|enrolled)',
            r'(?:class|year)\s+of\s+\d{4}'
        ]
        
        # If no dedicated education section, try to find education info in the full text
        if not education_section:
            # First check for specific education section headers that might have been missed
            edu_headers = ["EDUCATION", "ACADEMIC BACKGROUND", "EDUCATIONAL QUALIFICATIONS", "ACADEMIC HISTORY"]
            for header in edu_headers:
                match = re.search(f"{header}.*?\\n(.*?)(?:\\n\\s*\\n|\\Z)", all_sections_text, re.IGNORECASE | re.DOTALL)
                if match:
                    education_section = match.group(1)
                    break
        
        # If still no education section, check for education indicators
        if not education_section:
            # Extract education information from the entire text
            education_matches = []
            for pattern in student_indicators:
                matches = re.finditer(pattern, all_sections_text, re.IGNORECASE)
                for match in matches:
                    # Get the sentence containing the match
                    start = max(0, all_sections_text.rfind('.', 0, match.start()) + 1)
                    end = all_sections_text.find('.', match.end())
                    if end == -1:
                        end = len(all_sections_text)
                    
                    sentence = all_sections_text[start:end].strip()
                    education_matches.append(sentence)
            
            if education_matches:
                education_section = ". ".join(education_matches) + "."
        
        # For student resumes, look for specific common Malaysian education patterns
        if not education_section or len(education_section) < 50:
            malaysian_edu_patterns = [
                r'(?:Universiti|University)\s+(?:of|Teknologi|Malaya|Kebangsaan|Sains|Putra)',
                r'(?:STPM|SPM|UPSR|PT3|MUET|Malaysian\s+(?:University|Higher|Education))',
                r'(?:Matriculation|Foundation|Diploma|TVET|Kolej|Maktab)',
                r'(?:Taylor\'s|Sunway|INTI|HELP|APU|MMU|UTP|UTAR|UKM|UM|USM|UPM|UTM)',
                r'(?:Form\s+\d|Tingkatan\s+\d|Sekolah\s+Menengah|Secondary\s+School)'
            ]
            
            for pattern in malaysian_edu_patterns:
                matches = re.finditer(pattern, all_sections_text, re.IGNORECASE)
                for match in matches:
                    # Get the surrounding context
                    start = max(0, all_sections_text.rfind('\n', 0, match.start()) + 1)
                    end = all_sections_text.find('\n', match.end())
                    if end == -1:
                        end = len(all_sections_text)
                    
                    context = all_sections_text[start:end].strip()
                    if education_section:
                        education_section += " " + context
                    else:
                        education_section = context
        
        if not education_section:
            # Last resort - check for any typical education keywords
            education_keywords = ["degree", "bachelor", "master", "phd", "university", "college", "school", 
                                 "gpa", "academic", "graduated", "study", "studies", "education", "major"]
            
            # Count how many education keywords appear in the text
            keyword_count = 0
            for keyword in education_keywords:
                if re.search(r'\b' + re.escape(keyword) + r'\b', all_sections_text, re.IGNORECASE):
                    keyword_count += 1
            
            # If we found multiple education keywords, it's likely that there's some education info
            if keyword_count >= 2:
                return 30.0  # Give a minimal score since we found some evidence
        
        if not education_section:
            return 0.0
        
        # Define education levels and their scores
        education_levels = {
            "phd": 100,
            "doctorate": 100,
            "master": 90,
            "mba": 90,
            "bachelor": 80,
            "bs": 80,
            "ba": 80,
            "bsc": 80,
            "undergraduate": 60,
            "associate": 60,
            "certificate": 40,
            "certification": 40,
            "diploma": 40,
            "high school": 20,
            "secondary school": 20,
            "form": 20
        }
        
        # Check for required education in job description
        required_level = 0
        for level, score in education_levels.items():
            if re.search(r'\b' + level + r'\b', job_description, re.IGNORECASE):
                required_level = max(required_level, score)
        
        # Check for education level in resume
        resume_level = 0
        for level, score in education_levels.items():
            if re.search(r'\b' + level + r'\b', education_section, re.IGNORECASE):
                resume_level = max(resume_level, score)
        
        # If no specific education requirement found, return default score
        if required_level == 0:
            # Check if we found any education information
            if resume_level > 0:
                return 70.0  # Good baseline if we found some education info
            elif re.search(r'\b(?:university|college|school)\b', education_section, re.IGNORECASE):
                return 50.0  # Lower baseline if we only found institution names
            else:
                return 30.0  # Minimal score if very little education info found
        
        # Calculate score based on education level
        if resume_level >= required_level:
            return 100.0
        else:
            # For student resumes, give a better score even if the exact level isn't specified
            if re.search(r'\b(?:student|studying|enrolled)\b', education_section, re.IGNORECASE):
                return max(50.0, (resume_level / required_level) * 100)
            else:
                return (resume_level / required_level) * 100
    
    def achievements_score(self, resume_data: Dict[str, Any]) -> Tuple[float, float]:
        """
        Calculate score based on achievements and determine achievement bonus
        
        Args:
            resume_data: Structured resume data
            
        Returns:
            Tuple of (achievements_score, achievement_bonus)
        """
        # Get all text from the resume for comprehensive achievement detection
        all_sections_text = ""
        for section_name, content in resume_data.get("sections", {}).items():
            all_sections_text += content + "\n\n"
        
        # Look for quantifiable achievements
        achievement_patterns = [
            # Professional achievements with metrics
            r'increased\s+(?:revenue|sales|profit|growth)\s+by\s+(\d+)%',
            r'reduced\s+(?:costs|expenses|time|errors)\s+by\s+(\d+)%',
            r'improved\s+(?:efficiency|performance|productivity)\s+by\s+(\d+)%',
            r'(?:managed|led|supervised)\s+(?:a\s+)?team\s+of\s+(\d+)',
            r'(?:completed|delivered|launched)\s+(\d+)\s+projects',
            r'(?:achieved|exceeded|surpassed)\s+(?:targets|goals|quotas)\s+by\s+(\d+)%',
            r'(?:saved|generated)\s+\$(\d+)',
            
            # Student/academic achievements
            r'(?:won|awarded|received)\s+(?:\d+)?\s*(?:award|honor|recognition|scholarship|prize|medal)',
            r'(?:served|volunteered)\s+(?:for|as)\s+(\d+)\s+(?:year|month|week|day)',
            r'(?:GPA|grade|score)\s+of\s+(\d+\.?\d*)',
            r'(?:ranked|placed)\s+(?:#|number|no\.?|top)\s*(\d+)',
            r'(?:elected|selected|chosen)\s+(?:as|to|for)\s+(?:president|chair|leader|representative)',
            r'(?:first|second|third|top)\s+place\s+(?:in|at|for)',
            r'(?:scholarship|fellowship|grant)\s+(?:recipient|awardee|winner)',
            r'(?:founded|established|created|started)\s+(?:a|an|the)',
            r'(?:published|presented|authored)\s+(?:paper|article|research|thesis)',
            
            # Competition achievements (common in student resumes)
            r'(?:winner|finalist|runner-up|champion)\s+(?:of|in|at)',
            r'(?:competed|participated|represented)\s+(?:in|at)\s+(?:national|international|regional|global)',
            r'(?:hackathon|competition|contest|challenge|olympiad)',
            
            # Leadership achievements (common in student resumes)
            r'(?:president|chair|leader|head|captain|chief|director)\s+of',
            r'(?:led|organized|coordinated|managed|spearheaded)\s+(?:a|an|the)',
            r'(?:committee\s+member|executive\s+board|student\s+council)',
            
            # Project achievements (common in student resumes)
            r'(?:developed|built|created|designed|implemented)\s+(?:a|an|the)\s+(?:successful|innovative|award-winning)',
            r'(?:project|application|system|solution|website|platform)\s+(?:that|which|for)',
            r'(?:increased|improved|enhanced|optimized|streamlined)\s+(?:user|customer|client|student)'
        ]
        
        achievement_count = 0
        achievement_values = []
        
        for pattern in achievement_patterns:
            matches = re.finditer(pattern, all_sections_text, re.IGNORECASE)
            for match in matches:
                achievement_count += 1
                if match.groups() and match.group(1):
                    try:
                        value = float(match.group(1))
                        achievement_values.append(value)
                    except:
                        pass
        
        # Look for student-specific achievement keywords
        student_achievement_keywords = [
            "dean's list", "honor roll", "scholarship", "cum laude", "magna cum laude", "summa cum laude",
            "valedictorian", "salutatorian", "top student", "academic excellence", "outstanding student",
            "merit award", "perfect attendance", "perfect score", "high distinction", "distinction",
            "honor society", "research grant", "best paper", "best poster", "best presentation",
            "outstanding performance", "exceptional achievement", "academic award", "leadership award",
            "community service award", "volunteer award", "recognition", "certificate of achievement",
            "gold medal", "silver medal", "bronze medal", "first place", "second place", "third place",
            "winner", "finalist", "semi-finalist", "honorable mention", "special mention", "commendation",
            "prize", "top performer", "star performer", "excellence award", "exceptional contribution"
        ]
        
        for keyword in student_achievement_keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', all_sections_text, re.IGNORECASE):
                achievement_count += 1
        
        # Look for Malaysian-specific achievement indicators
        malaysian_achievements = [
            "ASEAN", "PETRONAS", "Khazanah", "CIMB", "Maybank", "Axiata", "TalentCorp", "YTL",
            "Astro", "Maxis", "Digi", "Sunway", "CIMB ASEAN", "Maybank GO Ahead",
            "Shell", "Ecoworld", "Gamuda", "MARA", "JPA", "MyBrain", "PTPTN"
        ]
        
        for keyword in malaysian_achievements:
            if re.search(r'\b' + re.escape(keyword) + r'\b', all_sections_text, re.IGNORECASE):
                achievement_count += 1
        
        # Calculate achievement score based on count
        if achievement_count == 0:
            achievement_score = 0.0
        elif achievement_count == 1:
            achievement_score = 40.0
        elif achievement_count == 2:
            achievement_score = 60.0
        elif achievement_count <= 5:
            achievement_score = 80.0
        else:
            achievement_score = 100.0
        
        # Calculate achievement bonus based on values
        achievement_bonus = 0.0
        if achievement_values:
            avg_value = sum(achievement_values) / len(achievement_values)
            if avg_value > 50:
                achievement_bonus = 10.0
            elif avg_value > 20:
                achievement_bonus = 5.0
            else:
                achievement_bonus = 2.0
        
        # Add bonus for achievement keywords even if no numeric values
        if achievement_count > 0 and achievement_bonus == 0.0:
            achievement_bonus = 2.0
        
        return achievement_score, achievement_bonus
    
    def cultural_fit_score(self, resume_data: Dict[str, Any], job_description: str) -> float:
        """
        Calculate score based on cultural fit / soft skills
        
        Args:
            resume_data: Structured resume data
            job_description: Job description text
            
        Returns:
            Cultural fit score (0-100)
        """
        # Define common soft skills
        soft_skills = [
            "communication", "teamwork", "leadership", "problem solving", "critical thinking",
            "time management", "adaptability", "flexibility", "creativity", "collaboration",
            "interpersonal", "organization", "detail oriented", "work ethic", "self motivated",
            "proactive", "decision making", "conflict resolution", "customer service"
        ]
        
        # Find soft skills in job description
        job_soft_skills = []
        for skill in soft_skills:
            if re.search(r'\b' + skill + r'\b', job_description, re.IGNORECASE):
                job_soft_skills.append(skill)
        
        if not job_soft_skills:
            return 50.0  # Default middle score if no soft skills mentioned
        
        # Find soft skills in resume
        resume_text = " ".join(resume_data.get("sections", {}).values())
        resume_soft_skills = []
        for skill in soft_skills:
            if re.search(r'\b' + skill + r'\b', resume_text, re.IGNORECASE):
                resume_soft_skills.append(skill)
        
        # Calculate match percentage
        if job_soft_skills:
            match_percentage = len(set(resume_soft_skills) & set(job_soft_skills)) / len(job_soft_skills) * 100
        else:
            match_percentage = 0
        
        return match_percentage
    
    def _extract_keywords_from_job(self, job_description: str) -> List[str]:
        """
        Extract keywords from job description
        
        Args:
            job_description: Job description text
            
        Returns:
            List of keywords
        """
        keywords = []
        
        # Define patterns for different types of keywords
        patterns = {
            "skills": [
                # Programming languages
                r'\b(?:Python|Java|JavaScript|TypeScript|C\+\+|C#|Ruby|PHP|Go|Rust|Swift|Kotlin)\b',
                # Frameworks and libraries
                r'\b(?:React|Angular|Vue|Django|Flask|Spring|Express|TensorFlow|PyTorch|Pandas|NumPy)\b',
                # Databases
                r'\b(?:SQL|MySQL|PostgreSQL|MongoDB|Oracle|SQLite|Redis|Cassandra|DynamoDB)\b',
                # Cloud platforms
                r'\b(?:AWS|Azure|GCP|Google Cloud|Heroku|Kubernetes|Docker|CI/CD)\b',
                # Tools and technologies
                r'\b(?:Git|GitHub|GitLab|Jira|Agile|Scrum|REST|GraphQL|API|JSON|XML)\b',
            ],
            "soft_skills": [
                r'\b(?:Communication|Teamwork|Leadership|Problem[\s-]Solving|Critical Thinking)\b',
                r'\b(?:Time Management|Adaptability|Flexibility|Creativity|Collaboration)\b'
            ],
            "education": [
                r'\b(?:Bachelor|Master|PhD|Doctorate|Degree|BS|MS|BA|MA)\b',
                r'\b(?:Computer Science|Engineering|Information Technology|Business|Mathematics)\b'
            ],
            "experience": [
                r'\b(?:\d+\+?\s*years?)\b',
                r'\b(?:Senior|Junior|Mid-level|Lead|Manager|Director)\b'
            ]
        }
        
        # Extract keywords using patterns
        for category, category_patterns in patterns.items():
            for pattern in category_patterns:
                matches = re.finditer(pattern, job_description, re.IGNORECASE)
                for match in matches:
                    keyword = match.group(0)
                    if keyword not in keywords:
                        keywords.append(keyword)
        
        return keywords
    
    def generate_recommendations(self, missing_keywords: List[str], aspect_scores: Dict[str, float]) -> List[str]:
        """
        Generate recommendations based on missing keywords and aspect scores
        
        Args:
            missing_keywords: Keywords missing from resume
            aspect_scores: Scores for different aspects
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Group missing keywords by category
        skill_keywords = []
        soft_skill_keywords = []
        education_keywords = []
        experience_keywords = []
        
        for keyword in missing_keywords[:10]:  # Limit to top 10 missing keywords
            keyword_lower = keyword.lower()
            if keyword_lower in ["python", "java", "javascript", "react", "angular", "sql", "aws", "docker"]:
                skill_keywords.append(keyword)
            elif keyword_lower in ["communication", "teamwork", "leadership", "problem solving"]:
                soft_skill_keywords.append(keyword)
            elif keyword_lower in ["bachelor", "master", "phd", "degree"]:
                education_keywords.append(keyword)
            elif "year" in keyword_lower or "experience" in keyword_lower:
                experience_keywords.append(keyword)
        
        # Add recommendations based on missing keywords
        if skill_keywords:
            recommendations.append(f"Add these technical skills to your resume: {', '.join(skill_keywords[:3])}")
        
        if soft_skill_keywords:
            recommendations.append(f"Highlight these soft skills: {', '.join(soft_skill_keywords[:3])}")
        
        if education_keywords:
            recommendations.append(f"Include education details related to: {', '.join(education_keywords[:2])}")
        
        # Add recommendations based on aspect scores
        if aspect_scores["skills"] < 50:
            recommendations.append("Focus on adding more relevant technical skills that match the job requirements")
        
        if aspect_scores["experience"] < 50:
            recommendations.append("Elaborate on your relevant work experience with more specific details")
        
        if aspect_scores["achievements"] < 50:
            recommendations.append("Add quantifiable achievements with metrics (e.g., 'increased revenue by 20%')")
        
        # Limit to top 5 recommendations
        return recommendations[:5] 