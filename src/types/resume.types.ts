export interface Resume {
  id: string;
  userId: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
  parsedData: ParsedResume;
  status: 'pending' | 'parsed' | 'failed';
}

export interface ParsedResume {
  personalInfo: PersonalInfo;
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  portfolio?: string;
}

export interface Skill {
  name: string;
  category?: string;
  yearsOfExperience?: number;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isCurrentRole: boolean;
  description: string;
  achievements: string[];
  location?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
} 