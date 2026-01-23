import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResumeData, ExperienceItem, EducationItem, AdvancedATSAnalysis } from '../types';

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
   * Advanced ATS Analysis - AI-Powered comprehensive resume analysis
   */
  async analyzeATSAdvanced(resumeData: ResumeData, jobDescription?: string): Promise<AdvancedATSAnalysis> {
    const model = getModel();
    
    const resumeText = `
Name: ${resumeData.basics.name}
Headline: ${resumeData.basics.headline}
Email: ${resumeData.basics.email}
Phone: ${resumeData.basics.phone}
Location: ${resumeData.basics.location}
Summary: ${resumeData.basics.summary}

EXPERIENCE:
${resumeData.experience.map(e => `${e.position} at ${e.company} (${e.startDate} - ${e.endDate})
${e.description}`).join('\n\n')}

EDUCATION:
${resumeData.education?.map(e => `${e.degree} in ${e.field} from ${e.school} (${e.endDate})`).join('\n') || 'Not specified'}

SKILLS:
${resumeData.skills.map(s => s.name).join(', ')}

CERTIFICATES:
${resumeData.certificates?.map(c => c.name).join(', ') || 'None listed'}

PROJECTS:
${resumeData.projects?.map(p => `${p.name}: ${p.description}`).join('\n') || 'None listed'}
`.trim();

    const resumeJson = JSON.stringify(resumeData, null, 2);

    const prompt = `You are an advanced ATS (Applicant Tracking System) analysis engine used by recruiters.

Your task is to:
1. Analyze resumes exactly like a real ATS would
2. Compare resumes against a given job description
3. Simulate how different popular ATS systems would score the resume
4. Explain scoring decisions clearly and professionally
5. Provide actionable, ATS-safe improvements

You must follow real-world ATS constraints:
- ATS systems do NOT understand graphics, tables, icons, columns, or visual styling
- ATS systems prioritize keyword relevance, section clarity, chronology, and role alignment
- Do NOT inflate scores unrealistically
- Be strict, objective, and recruiter-oriented

IMPORTANT RULES:
- All scores must be labeled as "Estimated / Simulated"
- Do NOT hallucinate skills or experience
- Base all analysis only on provided resume content and job description

RESUME (RAW TEXT):
${resumeText}

RESUME (PARSED STRUCTURE):
${resumeJson}

JOB DESCRIPTION:
${jobDescription || 'General professional role - analyze for broad ATS compatibility'}

TASKS:

1️⃣ ATS COMPATIBILITY ANALYSIS
Evaluate the resume for ATS compatibility using these weighted factors:
- Keyword match (30%)
- Skills relevance (15%)
- Experience relevance (20%)
- Job title alignment (10%)
- Formatting & structure (15%)
- Section clarity & chronology (10%)

2️⃣ RESUME VS JOB DESCRIPTION MATCHING
Identify:
- Missing critical skills
- Weak or generic bullet points
- Overused or irrelevant skills
- Role responsibility mismatches

3️⃣ ATS SYSTEM COMPARATOR (SIMULATED)
Simulate how different ATS-style systems would evaluate this resume:
- Workday-style ATS
- Greenhouse-style ATS
- Lever-style ATS

4️⃣ ACTIONABLE IMPROVEMENTS
Provide:
- Top 5 changes that would improve ATS score fastest
- Bullet point improvement suggestions (show original and improved versions)

5️⃣ FINAL VERDICT
Answer:
- Is this resume likely to pass initial ATS screening? (Yes/Borderline/No)
- What score is realistically needed for shortlisting?
- What is the single biggest weakness blocking selection?

OUTPUT FORMAT (STRICT JSON ONLY - NO MARKDOWN, NO EXPLANATION):
{
  "ats_score": number,
  "score_breakdown": {
    "keywords": number,
    "skills": number,
    "experience": number,
    "job_title": number,
    "formatting": number,
    "sections": number
  },
  "job_match_score": number,
  "missing_keywords": {
    "high_priority": ["array of strings"],
    "medium_priority": ["array of strings"],
    "low_priority": ["array of strings"]
  },
  "bullet_improvements": [
    {
      "original": "string",
      "improved": "string"
    }
  ],
  "ats_comparator": {
    "workday_style": {
      "score": number,
      "risk": "string",
      "notes": "string"
    },
    "greenhouse_style": {
      "score": number,
      "risk": "string",
      "notes": "string"
    },
    "lever_style": {
      "score": number,
      "risk": "string",
      "notes": "string"
    }
  },
  "top_improvements": ["array of 5 strings"],
  "final_verdict": {
    "screening_outcome": "Yes" | "Borderline" | "No",
    "required_score": number,
    "biggest_blocker": "string"
  }
}

Return ONLY valid JSON. No markdown code blocks, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI Response:', text);
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]) as AdvancedATSAnalysis;
  },

  /**
   * Generate an ATS-optimized version of the resume using AI
   * Takes existing resume data and improves it for better ATS scoring
   */
  async generateOptimizedResume(currentData: ResumeData, targetRole?: string): Promise<ResumeData> {
    const model = getModel();
    
    const prompt = `You are an expert resume writer specializing in ATS optimization. 
Take this resume data and create an IMPROVED, ATS-OPTIMIZED version.

CURRENT RESUME DATA:
${JSON.stringify(currentData, null, 2)}

TARGET ROLE: ${targetRole || currentData.basics.headline || 'Professional'}

YOUR TASK:
1. Rewrite the summary to be more impactful and keyword-rich (3-4 sentences)
2. Improve ALL experience bullet points with:
   - Strong action verbs
   - Quantifiable achievements (add realistic metrics)
   - ATS-friendly keywords
   - STAR method format
3. Ensure skills are listed with relevant, searchable terms
4. Keep all original facts but enhance the language and impact

CRITICAL RULES:
- Keep the same person's name, email, phone, basic facts
- Keep all original companies, job titles, schools - just improve descriptions
- Add realistic metrics where they weren't present (e.g., "Improved efficiency by X%")
- Make ALL content ATS-scannable
- Use industry-standard keywords

Return the COMPLETE improved resume in this exact JSON format:
{
  "basics": {
    "name": "keep same",
    "headline": "improved professional title",
    "email": "keep same",
    "phone": "keep same",
    "location": "keep same",
    "website": "keep same",
    "summary": "improved 3-4 sentence summary"
  },
  "experience": [
    {
      "id": "keep same",
      "company": "keep same",
      "position": "keep same",
      "location": "keep same", 
      "startDate": "keep same",
      "endDate": "keep same",
      "description": "IMPROVED bullet points with metrics and action verbs",
      "visible": true
    }
  ],
  "education": [...keep same structure, improve descriptions...],
  "skills": [...optimize skill names for ATS...],
  "certificates": [...keep same...],
  "projects": [...improve descriptions...],
  "languages": [...keep same...],
  "activities": [...keep same...]
}

Return ONLY valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text().trim();
    
    // Clean up markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const improved = JSON.parse(jsonMatch[0]);
    
    // Merge with original to ensure all fields exist
    return {
      basics: { ...currentData.basics, ...improved.basics },
      experience: improved.experience || currentData.experience,
      education: improved.education || currentData.education,
      skills: improved.skills || currentData.skills,
      certificates: improved.certificates || currentData.certificates || [],
      projects: improved.projects || currentData.projects || [],
      languages: improved.languages || currentData.languages || [],
      activities: improved.activities || currentData.activities || []
    };
  },

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!API_KEY;
  }
};
