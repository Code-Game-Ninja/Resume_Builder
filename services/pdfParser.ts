import { ResumeData } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

/**
 * Convert File to base64 for Gemini API
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Import resume from PDF using Gemini AI's native PDF reading
 * Gemini 2.0 can process PDF files directly
 */
export async function importResumeFromPDF(file: File): Promise<Partial<ResumeData>> {
    if (!API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Determine MIME type
    const mimeType = file.type || 'application/pdf';

    const prompt = `You are a resume parser. Extract ALL information from this resume PDF and return ONLY valid JSON.

Extract and return in this exact JSON format:
{
    "basics": {
        "name": "Full name exactly as shown",
        "headline": "Professional title/headline",
        "email": "email@example.com",
        "phone": "phone number",
        "location": "City, State/Country",
        "website": "website or LinkedIn URL",
        "summary": "Professional summary paragraph"
    },
    "experience": [
        {
            "id": "exp_1",
            "company": "Company Name",
            "position": "Job Title",
            "location": "Location",
            "startDate": "Start date",
            "endDate": "End date or Present",
            "description": "Full job description with all bullet points",
            "visible": true
        }
    ],
    "education": [
        {
            "id": "edu_1",
            "school": "School Name",
            "degree": "Degree Type",
            "field": "Field of Study",
            "startDate": "Start year",
            "endDate": "End year",
            "description": "",
            "visible": true
        }
    ],
    "skills": [
        { "id": "sk_1", "name": "Skill Name", "level": 3 }
    ],
    "certificates": [
        { "id": "cert_1", "name": "Certificate Name", "issuer": "Issuer", "date": "", "visible": true }
    ],
    "projects": [
        { "id": "proj_1", "name": "Project Name", "description": "Full description with technology used", "visible": true }
    ],
    "languages": [],
    "activities": []
}

CRITICAL RULES:
- Extract ALL information found in the resume - do not skip anything
- Keep EXACT text as shown in the resume
- For skills, list ALL skills mentioned anywhere
- For experience, include ALL bullet points/descriptions
- For projects, include ALL details and technologies
- Generate unique IDs for each item (exp_1, exp_2, etc.)
- If a field is not found, use empty string or empty array
- Return ONLY valid JSON, no markdown code blocks`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        let jsonText = response.text().trim();
        
        // Clean up markdown code blocks if present
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }
        
        const parsed = JSON.parse(jsonText);
        
        // Ensure IDs are unique
        const now = Date.now();
        if (parsed.experience) {
            parsed.experience = parsed.experience.map((e: any, i: number) => ({
                ...e,
                id: `exp_${now}_${i}`,
                visible: true
            }));
        }
        if (parsed.education) {
            parsed.education = parsed.education.map((e: any, i: number) => ({
                ...e,
                id: `edu_${now}_${i}`,
                visible: true
            }));
        }
        if (parsed.skills) {
            parsed.skills = parsed.skills.map((s: any, i: number) => ({
                id: `sk_${now}_${i}`,
                name: s.name,
                level: s.level || 3
            }));
        }
        if (parsed.certificates) {
            parsed.certificates = parsed.certificates.map((c: any, i: number) => ({
                ...c,
                id: `cert_${now}_${i}`,
                visible: true
            }));
        }
        if (parsed.projects) {
            parsed.projects = parsed.projects.map((p: any, i: number) => ({
                ...p,
                id: `proj_${now}_${i}`,
                visible: true,
                techStack: p.techStack || []
            }));
        }
        
        return parsed;
    } catch (e) {
        console.error('AI PDF parsing failed:', e);
        throw e;
    }
}
