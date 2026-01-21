import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResumeData, ExperienceItem, EducationItem } from '../types';

// Initialize Gemini AI with API key from environment
const API_KEY = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                '';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI && API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

// Helper to get model
function getModel() {
  const ai = getGenAI();
  if (!ai) throw new Error('Gemini API key not configured');
  return ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export interface AIGeneratedContent {
  text: string;
  suggestions?: string[];
}

export const aiService = {
  /**
   * Generate a professional summary based on user's experience and skills
   */
  async generateSummary(data: ResumeData, targetRole?: string): Promise<string> {
    const model = getModel();
    
    const experienceText = data.experience
      .map(e => `${e.position} at ${e.company}: ${e.description}`)
      .join('\n');
    
    const skillsText = data.skills.map(s => s.name).join(', ');
    
    const prompt = `You are an expert resume writer. Generate a professional summary (3-4 sentences, 50-80 words) for a resume.

Person's Details:
- Name: ${data.basics.name || 'Professional'}
- Current/Target Role: ${targetRole || data.basics.headline || 'Professional'}
- Skills: ${skillsText || 'Various technical and soft skills'}
- Experience: ${experienceText || 'Multiple years of professional experience'}

Requirements:
- Write in first person implied (no "I" at the start)
- Highlight key achievements and expertise
- Be specific and quantifiable where possible
- Make it ATS-friendly with relevant keywords
- Keep it professional and compelling

Return ONLY the summary text, no quotes or extra formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  },

  /**
   * Generate bullet points for work experience
   */
  async generateExperienceDescription(
    position: string,
    company: string,
    industry?: string,
    existingDescription?: string
  ): Promise<string> {
    const model = getModel();
    
    const prompt = `You are an expert resume writer. Generate 3-4 impactful bullet points for a work experience entry.

Position: ${position}
Company: ${company}
Industry: ${industry || 'Technology'}
${existingDescription ? `Current Description: ${existingDescription}` : ''}

Requirements:
- Start each bullet with a strong action verb
- Include metrics and quantifiable achievements where possible
- Use the STAR method (Situation, Task, Action, Result)
- Keep each bullet to 1-2 lines
- Make it ATS-friendly with relevant keywords
- Focus on achievements, not just responsibilities

Format: Return bullet points separated by newlines, starting with "•" character.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  },

  /**
   * Suggest skills based on job role and industry
   */
  async suggestSkills(
    targetRole: string,
    currentSkills: string[],
    industry?: string
  ): Promise<string[]> {
    const model = getModel();
    
    const prompt = `You are a career advisor. Suggest 10 relevant skills for a ${targetRole} position${industry ? ` in the ${industry} industry` : ''}.

Current Skills: ${currentSkills.join(', ') || 'None listed'}

Requirements:
- Include both technical and soft skills
- Prioritize in-demand skills for this role
- Don't repeat skills the person already has
- Include a mix of tools, technologies, and methodologies
- Focus on ATS-friendly keywords

Return ONLY the skill names, one per line, no numbers or bullets.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text()
      .split('\n')
      .map(s => s.trim())
      .filter(s => s && !currentSkills.includes(s))
      .slice(0, 10);
  },

  /**
   * Improve existing text to be more professional
   */
  async improveText(text: string, context: 'summary' | 'experience' | 'education'): Promise<string> {
    const model = getModel();
    
    const contextGuide = {
      summary: 'professional summary that highlights key achievements',
      experience: 'work experience bullet points with metrics and action verbs',
      education: 'education description highlighting relevant coursework and achievements'
    };
    
    const prompt = `You are an expert resume writer. Improve the following text to be more professional and impactful for a ${contextGuide[context]}.

Original Text:
${text}

Requirements:
- Maintain the core meaning and facts
- Use stronger action verbs
- Add specificity and metrics where logical
- Make it more concise if needed
- Ensure it's ATS-friendly

Return ONLY the improved text, no quotes or extra formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  },

  /**
   * Generate a complete resume based on minimal input
   */
  async generateFullResume(input: {
    name: string;
    email: string;
    phone?: string;
    targetRole: string;
    yearsExperience: number;
    industry: string;
    education?: string;
  }): Promise<Partial<ResumeData>> {
    const model = getModel();
    
    const prompt = `You are an expert resume writer. Generate resume content in JSON format for:

Name: ${input.name}
Email: ${input.email}
Target Role: ${input.targetRole}
Years of Experience: ${input.yearsExperience}
Industry: ${input.industry}
Education: ${input.education || 'Bachelor\'s degree'}

Generate realistic, professional content. Return ONLY valid JSON in this exact format:
{
  "basics": {
    "headline": "string - professional title",
    "summary": "string - 3-4 sentence professional summary"
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "location": "string - City, State",
      "startDate": "string - YYYY-MM format",
      "endDate": "string - YYYY-MM or Present",
      "description": "string - 3-4 bullet points with • separator"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "skills": ["string array of 8-12 relevant skills"]
}

Generate ${Math.min(input.yearsExperience / 2, 3)} experience entries showing career progression.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    
    const generated = JSON.parse(jsonMatch[0]);
    
    // Transform to our format
    return {
      basics: {
        name: input.name,
        email: input.email,
        phone: input.phone || '',
        headline: generated.basics.headline,
        summary: generated.basics.summary,
        location: '',
        website: ''
      },
      experience: generated.experience.map((exp: any, idx: number) => ({
        id: `exp_${Date.now()}_${idx}`,
        company: exp.company,
        position: exp.position,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        visible: true
      })),
      education: generated.education.map((edu: any, idx: number) => ({
        id: `edu_${Date.now()}_${idx}`,
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: '',
        visible: true
      })),
      skills: generated.skills.map((name: string, idx: number) => ({
        id: `skill_${Date.now()}_${idx}`,
        name,
        level: 3
      }))
    };
  },

  /**
   * Tailor resume content to a specific job description
   */
  async tailorToJob(resumeData: ResumeData, jobDescription: string): Promise<{
    suggestions: string[];
    missingKeywords: string[];
    optimizedSummary: string;
  }> {
    const model = getModel();
    
    const prompt = `You are an ATS optimization expert. Analyze this resume against the job description and provide optimization suggestions.

RESUME:
Summary: ${resumeData.basics.summary}
Skills: ${resumeData.skills.map(s => s.name).join(', ')}
Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(', ')}

JOB DESCRIPTION:
${jobDescription}

Respond in JSON format:
{
  "suggestions": ["array of 3-5 specific improvements"],
  "missingKeywords": ["array of important keywords from job description not in resume"],
  "optimizedSummary": "rewritten summary tailored to this job"
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    
    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!API_KEY;
  }
};
