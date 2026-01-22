export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  visible: boolean;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
  visible: boolean;
}

export interface LanguageItem {
  id: string;
  name: string;
  fluency: string; // "Native", "Fluent", "Intermediate", "Beginner"
  visible: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link?: string;
  techStack: string[]; // e.g. ["React", "Node.js"]
  visible: boolean;
}

export interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  date: string; // Issue Date
  url?: string;
  visible: boolean;
}

export interface ActivityItem { // Hobbies, Volunteering, etc.
  id: string;
  name: string;
  description: string;
  visible: boolean;
}

export interface ResumeBasics {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  photo?: string;
}

export interface ResumeData {
  basics: ResumeBasics;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: { id: string; name: string; level: number }[];
  certificates: CertificateItem[];
  activities: ActivityItem[];
  languages: LanguageItem[];
  projects: ProjectItem[];
}

export interface ResumeMetadata {
  template: string;
  colors: {
    primary: string;
    text: string;
    background: string;
  };
  layout?: {
      main: SectionType[];
      sidebar: SectionType[];
  };
  compactMode?: boolean; // For single-page optimization
}

export interface Resume {
  id: string;
  userId: string;
  name: string;
  updatedAt: Date;
  data: ResumeData;
  metadata: ResumeMetadata;
  thumbnail?: string;
  isCommunity?: boolean; // New: If true, it's a published community template
  originalAuthor?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  isCommunity: boolean;
  author: string;
  tags: string[]; // e.g. "ATS-Friendly", "Creative", "Minimal"
  config: {
      layout: 'single-column' | 'two-column-left' | 'two-column-right';
      style: 'modern' | 'classic' | 'minimal' | 'bold';
  }
}

export interface ATSAnalysis {
    score: number;
    marketAverage: number; // Comparison score
    keywordsFound: string[];
    missingKeywords: string[];
    issues: { severity: 'high' | 'medium' | 'low', message: string }[];
    summary: string;
}

export type SectionType = 'basics' | 'summary' | 'experience' | 'education' | 'skills' | 'design' | 'certificates' | 'activities' | 'languages' | 'projects';