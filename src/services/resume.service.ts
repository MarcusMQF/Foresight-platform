import { Resume, ParsedResume } from '../types/resume.types';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { supabase } from '../lib/supabase';

export class ResumeService {
  async uploadResume(file: File, userId: string): Promise<Resume> {
    try {
      // Upload file to Supabase storage
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create initial resume record
      const resume: Partial<Resume> = {
        userId,
        originalFileName: file.name,
        fileUrl: fileData.path,
        fileType: file.type,
        uploadedAt: new Date(),
        status: 'pending'
      };

      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert(resume)
        .select()
        .single();

      if (dbError) throw dbError;

      // Start parsing process
      this.parseResume(resumeData);

      return resumeData;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  }

  private async parseResume(resume: Resume) {
    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('resumes')
        .download(resume.fileUrl);

      if (downloadError) throw downloadError;

      // Convert Blob to ArrayBuffer
      const arrayBuffer = await fileData.arrayBuffer();

      // Parse based on file type
      let parsedContent: string;
      if (resume.fileType === 'application/pdf') {
        const pdfData = await pdf(arrayBuffer);
        parsedContent = pdfData.text;
      } else if (resume.fileType.includes('word')) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        parsedContent = result.value;
      } else {
        throw new Error('Unsupported file type');
      }

      // Extract information using NLP (simplified version)
      const parsedData = await this.extractInformation(parsedContent);

      // Update resume record with parsed data
      const { error: updateError } = await supabase
        .from('resumes')
        .update({
          parsedData,
          status: 'parsed'
        })
        .eq('id', resume.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error parsing resume:', error);
      // Update resume status to failed
      await supabase
        .from('resumes')
        .update({
          status: 'failed'
        })
        .eq('id', resume.id);
    }
  }

  private async extractInformation(content: string): Promise<ParsedResume> {
    // This is a simplified version. In a real implementation,
    // you would use more sophisticated NLP techniques
    return {
      personalInfo: this.extractPersonalInfo(content),
      skills: this.extractSkills(content),
      workExperience: this.extractWorkExperience(content),
      education: this.extractEducation(content),
      certifications: this.extractCertifications(content)
    };
  }

  private extractPersonalInfo(content: string): ParsedResume['personalInfo'] {
    // Basic regex patterns for personal information
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/;
    const linkedInRegex = /linkedin\.com\/in\/[\w-]+/;

    return {
      fullName: this.extractFullName(content),
      email: (content.match(emailRegex) || [''])[0],
      phone: (content.match(phoneRegex) || [''])[0],
      location: this.extractLocation(content),
      linkedIn: (content.match(linkedInRegex) || [''])[0],
      portfolio: this.extractPortfolio(content)
    };
  }

  private extractFullName(content: string): string {
    // This is a simplified implementation
    // In a real-world scenario, you would use NLP for name entity recognition
    const firstLine = content.split('\n')[0].trim();
    return firstLine.length > 50 ? '' : firstLine;
  }

  private extractLocation(content: string): string {
    // Simplified location extraction
    // In a real implementation, you would use a location database/API
    const locationRegex = /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/;
    return (content.match(locationRegex) || [''])[0];
  }

  private extractPortfolio(content: string): string {
    // Basic portfolio URL extraction
    const portfolioRegex = /(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?\/?[\w-]+/;
    const urls = content.match(portfolioRegex) || [];
    return urls.find(url => !url.includes('linkedin.com')) || '';
  }

  private extractSkills(content: string): ParsedResume['skills'] {
    // Common skill keywords (expand this list based on your needs)
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++',
      'React', 'Angular', 'Vue', 'Node.js', 'Express',
      'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure',
      'Docker', 'Kubernetes', 'CI/CD', 'Git'
    ];

    const skills: ParsedResume['skills'] = [];
    const contentLower = content.toLowerCase();

    skillKeywords.forEach(skill => {
      if (contentLower.includes(skill.toLowerCase())) {
        skills.push({
          name: skill,
          category: this.categorizeSkill(skill)
        });
      }
    });

    return skills;
  }

  private categorizeSkill(skill: string): string {
    // Basic skill categorization
    const categories: { [key: string]: string[] } = {
      'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++'],
      'Frontend': ['React', 'Angular', 'Vue', 'HTML', 'CSS'],
      'Backend': ['Node.js', 'Express', 'Django', 'Spring'],
      'Database': ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL'],
      'Cloud': ['AWS', 'Azure', 'GCP'],
      'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'Git']
    };

    for (const [category, skills] of Object.entries(categories)) {
      if (skills.includes(skill)) {
        return category;
      }
    }

    return 'Other';
  }

  private extractWorkExperience(content: string): ParsedResume['workExperience'] {
    // This is a placeholder implementation
    // In a real-world scenario, you would use more sophisticated NLP techniques
    const experiences: ParsedResume['workExperience'] = [];
    
    // Basic regex pattern for date ranges
    const dateRangeRegex = /(\b\d{4}\b)\s*[-–—]\s*(\b(?:\d{4}\b|present|current))/gi;
    const matches = content.match(dateRangeRegex);

    if (matches) {
      matches.forEach(match => {
        const [start, end] = match.split(/[-–—]/).map(d => d.trim());
        const surroundingText = this.getTextAroundMatch(content, match, 200);
        
        experiences.push({
          company: this.extractCompanyFromContext(surroundingText),
          position: this.extractPositionFromContext(surroundingText),
          startDate: new Date(start),
          endDate: end.toLowerCase() === 'present' ? undefined : new Date(end),
          isCurrentRole: end.toLowerCase() === 'present',
          description: surroundingText,
          achievements: this.extractAchievements(surroundingText)
        });
      });
    }

    return experiences;
  }

  private getTextAroundMatch(content: string, match: string, chars: number): string {
    const index = content.indexOf(match);
    const start = Math.max(0, index - chars);
    const end = Math.min(content.length, index + match.length + chars);
    return content.slice(start, end);
  }

  private extractCompanyFromContext(context: string): string {
    // Simplified company extraction
    // In a real implementation, you would use company name database/API
    const lines = context.split('\n');
    return lines.find(line => /inc\.|corp\.|ltd\./i.test(line)) || '';
  }

  private extractPositionFromContext(context: string): string {
    // Simplified position extraction
    const commonTitles = [
      'Engineer', 'Developer', 'Manager', 'Director',
      'Architect', 'Consultant', 'Analyst', 'Designer'
    ];
    
    const titleRegex = new RegExp(commonTitles.join('|'), 'i');
    const match = context.match(titleRegex);
    return match ? match[0] : '';
  }

  private extractAchievements(context: string): string[] {
    // Look for bullet points or numbered lists
    const achievements = context.split(/[•·\-\d+\.]/).map(item => item.trim());
    return achievements.filter(item => item.length > 20);
  }

  private extractEducation(content: string): ParsedResume['education'] {
    // Basic education extraction
    const educationKeywords = ['Bachelor', 'Master', 'PhD', 'BSc', 'MSc', 'MBA'];
    const educationRegex = new RegExp(`(${educationKeywords.join('|')}).*?\\d{4}`, 'gi');
    const matches = content.match(educationRegex) || [];

    return matches.map(match => {
      const surroundingText = this.getTextAroundMatch(content, match, 150);
      const yearMatch = surroundingText.match(/\b\d{4}\b/g) || [];
      
      return {
        institution: this.extractInstitution(surroundingText),
        degree: match.split(' ')[0],
        field: this.extractField(surroundingText),
        startDate: new Date(yearMatch[0] || ''),
        endDate: yearMatch[1] ? new Date(yearMatch[1]) : undefined
      };
    });
  }

  private extractInstitution(context: string): string {
    // Simplified institution extraction
    const universityKeywords = ['University', 'College', 'Institute', 'School'];
    const lines = context.split('\n');
    return lines.find(line => 
      universityKeywords.some(keyword => line.includes(keyword))
    ) || '';
  }

  private extractField(context: string): string {
    // Simplified field extraction
    const commonFields = [
      'Computer Science', 'Engineering', 'Business',
      'Information Technology', 'Data Science'
    ];
    
    return commonFields.find(field => 
      context.toLowerCase().includes(field.toLowerCase())
    ) || '';
  }

  private extractCertifications(content: string): ParsedResume['certifications'] {
    // Basic certification extraction
    const certificationKeywords = [
      'Certified', 'Certificate', 'Certification',
      'AWS', 'Microsoft', 'Google', 'Oracle', 'CompTIA'
    ];
    
    const certRegex = new RegExp(
      `(${certificationKeywords.join('|')})([^.]*?)(\\d{4})`,
      'gi'
    );
    
    const matches = content.match(certRegex) || [];
    
    return matches.map(match => {
      const yearMatch = match.match(/\d{4}/);
      return {
        name: match.split(/\d{4}/)[0].trim(),
        issuer: this.extractCertIssuer(match),
        issueDate: new Date(yearMatch ? yearMatch[0] : ''),
        credentialId: this.extractCredentialId(match)
      };
    });
  }

  private extractCertIssuer(context: string): string {
    const commonIssuers = [
      'AWS', 'Microsoft', 'Google', 'Oracle', 'CompTIA',
      'Cisco', 'IBM', 'PMI', 'ISC2'
    ];
    
    return commonIssuers.find(issuer => 
      context.includes(issuer)
    ) || '';
  }

  private extractCredentialId(context: string): string {
    // Look for common credential ID patterns
    const credentialRegex = /[A-Z0-9]{6,}/;
    const match = context.match(credentialRegex);
    return match ? match[0] : '';
  }

  async getResume(id: string): Promise<Resume | null> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getResumesByUser(userId: string): Promise<Resume[]> {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('userId', userId)
      .order('uploadedAt', { ascending: false });

    if (error) throw error;
    return data;
  }
} 