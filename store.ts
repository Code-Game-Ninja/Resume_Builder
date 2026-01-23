import { create } from 'zustand';
import { Resume, User, Template, ATSAnalysis, AdvancedATSAnalysis, SectionType } from './types';
import { authService, resumeService, templateService, atsService, storageService } from './services/firebase';
import { aiService } from './services/ai';

interface AppState {
  user: User | null;
  resumes: Resume[];
  templates: Template[];
  currentResume: Resume | null;
  atsAnalysis: ATSAnalysis | null;
  advancedAtsAnalysis: AdvancedATSAnalysis | null;
  jobDescription: string;
  isLoading: boolean;
  authInitialized: boolean;
  error: string | null;
  
  // Auth actions
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  
  // Resume actions
  setResumes: (resumes: Resume[]) => void;
  setCurrentResume: (resume: Resume | null) => void;
  fetchResumes: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createResume: (name: string, templateId?: string, initialColor?: string) => Promise<string>;
  deleteResume: (id: string) => Promise<void>;
  duplicateResume: (id: string) => Promise<void>;
  saveCurrentResume: () => Promise<void>;
  publishTemplate: (resumeId: string) => Promise<void>;
  runATSAnalysis: () => Promise<void>;
  runAdvancedATSAnalysis: (jobDesc?: string) => Promise<void>;
  setJobDescription: (desc: string) => void;
  optimizeResumeWithAI: () => Promise<void>;
  
  // State Updaters
  updateCurrentResumeData: (section: keyof Resume['data'], data: any) => void;
  updateCurrentResumeMetadata: (data: Partial<Resume['metadata']>) => void;
  updateSectionOrder: (main: SectionType[], sidebar: SectionType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // AI Actions
  generateSummaryWithAI: (targetRole?: string) => Promise<void>;
  generateExperienceWithAI: (expId: string) => Promise<void>;
  suggestSkillsWithAI: () => Promise<string[]>;
  improveTextWithAI: (text: string, context: 'summary' | 'experience' | 'education') => Promise<string>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  resumes: [],
  templates: [],
  currentResume: null,
  atsAnalysis: null,
  advancedAtsAnalysis: null,
  jobDescription: '',
  isLoading: false,
  authInitialized: false,
  error: null,

  setUser: (user) => set({ user }),
  setResumes: (resumes) => set({ resumes }),
  setCurrentResume: (resume) => set({ currentResume: resume, atsAnalysis: null, advancedAtsAnalysis: null }),
  setJobDescription: (desc) => set({ jobDescription: desc }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // --- Auth Actions ---
  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(email, password);
      set({ user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(email, password, name);
      set({ user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signInWithGoogle();
      set({ user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signInWithGithub: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signInWithGithub();
      set({ user, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, resumes: [], currentResume: null });
  },

  updateAvatar: async (file: File) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');
    
    set({ isLoading: true, error: null });
    try {
      const avatarUrl = await storageService.uploadAvatar(user.id, file);
      set({ 
        user: { ...user, avatar: avatarUrl },
        isLoading: false 
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateProfile: async (name: string) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');
    
    set({ isLoading: true, error: null });
    try {
      await authService.updateUserProfile(user.id, { name });
      set({ 
        user: { ...user, name },
        isLoading: false 
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  // --- Resume Actions ---
  fetchResumes: async () => {
    const { user } = get();
    if (!user) return;
    
    set({ isLoading: true });
    try {
      const resumes = await resumeService.getResumes(user.id);
      set({ resumes });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTemplates: async () => {
    set({ isLoading: true });
    try {
      const templates = await templateService.getTemplates();
      set({ templates });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  createResume: async (name, templateId, initialColor) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated');
    
    set({ isLoading: true });
    try {
      const newResume = await resumeService.createResume(user.id, name, templateId, initialColor);
      set((state) => ({ 
        resumes: [newResume, ...state.resumes], 
        isLoading: false 
      }));
      return newResume.id;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteResume: async (id) => {
    await resumeService.deleteResume(id);
    set((state) => ({ resumes: state.resumes.filter(r => r.id !== id) }));
  },

  duplicateResume: async (id) => {
    const { user } = get();
    if (!user) return;
    
    set({ isLoading: true });
    try {
      const copy = await resumeService.duplicateResume(user.id, id);
      set((state) => ({ resumes: [copy, ...state.resumes], isLoading: false }));
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentResume: async () => {
    const { currentResume } = get();
    if (!currentResume) return;
    
    await resumeService.updateResume(currentResume.id, currentResume);
    set((state) => ({
      resumes: state.resumes.map(r => 
        r.id === currentResume.id ? { ...currentResume, updatedAt: new Date() } : r
      )
    }));
  },

  publishTemplate: async (resumeId) => {
    const { user, resumes } = get();
    const resumeToPublish = resumes.find(r => r.id === resumeId);
    
    if (!user || !resumeToPublish) return;
    
    set({ isLoading: true });
    try {
      await templateService.publishTemplate(resumeToPublish, user.name);
      const templates = await templateService.getTemplates();
      set({ templates });
    } finally {
      set({ isLoading: false });
    }
  },

  runATSAnalysis: async () => {
    const { currentResume } = get();
    if (!currentResume) return;
    
    set({ isLoading: true });
    try {
      const result = atsService.analyzeResume(currentResume);
      set({ atsAnalysis: result });
    } finally {
      set({ isLoading: false });
    }
  },

  runAdvancedATSAnalysis: async (jobDesc) => {
    const { currentResume, jobDescription } = get();
    if (!currentResume) return;
    
    set({ isLoading: true, advancedAtsAnalysis: null });
    try {
      const result = await aiService.analyzeATSAdvanced(currentResume.data, jobDesc || jobDescription);
      set({ advancedAtsAnalysis: result });
    } catch (e) {
      console.error('Advanced ATS analysis failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  optimizeResumeWithAI: async () => {
    const { currentResume } = get();
    if (!currentResume) return;
    
    set({ isLoading: true });
    try {
      const optimizedData = await aiService.generateOptimizedResume(
        currentResume.data,
        currentResume.data.basics.headline
      );
      
      set((state) => ({
        currentResume: state.currentResume ? {
          ...state.currentResume,
          data: optimizedData,
          updatedAt: new Date()
        } : null,
        advancedAtsAnalysis: null, // Clear analysis so user can re-run
        isLoading: false
      }));
    } catch (e) {
      console.error('AI optimization failed:', e);
      set({ isLoading: false });
    }
  },

  updateCurrentResumeData: (section, data) =>
    set((state) => {
      if (!state.currentResume) return {};
      return {
        currentResume: {
          ...state.currentResume,
          data: {
            ...state.currentResume.data,
            [section]: data,
          },
          updatedAt: new Date(),
        },
      };
    }),
    
  updateCurrentResumeMetadata: (data) => 
    set((state) => {
      if (!state.currentResume) return {};
      return {
        currentResume: {
          ...state.currentResume,
          metadata: { ...state.currentResume.metadata, ...data },
          updatedAt: new Date(),
        }
      };
    }),

  updateSectionOrder: (main: SectionType[], sidebar: SectionType[]) =>
    set((state) => {
        if (!state.currentResume) return {};
        return {
            currentResume: {
                ...state.currentResume,
                metadata: {
                    ...state.currentResume.metadata,
                    layout: { main, sidebar }
                },
                updatedAt: new Date()
            }
        };
    }),

  // --- AI Actions ---
  generateSummaryWithAI: async (targetRole) => {
    const { currentResume } = get();
    if (!currentResume) return;
    
    set({ isLoading: true });
    try {
      const summary = await aiService.generateSummary(currentResume.data, targetRole);
      set((state) => ({
        currentResume: state.currentResume ? {
          ...state.currentResume,
          data: {
            ...state.currentResume.data,
            basics: {
              ...state.currentResume.data.basics,
              summary
            }
          }
        } : null,
        isLoading: false
      }));
    } catch (e) {
      console.error('AI generation failed:', e);
      set({ isLoading: false });
    }
  },

  generateExperienceWithAI: async (expId) => {
    const { currentResume } = get();
    if (!currentResume) return;
    
    const experience = currentResume.data.experience.find(e => e.id === expId);
    if (!experience) return;
    
    set({ isLoading: true });
    try {
      const description = await aiService.generateExperienceDescription(
        experience.position,
        experience.company
      );
      
      set((state) => ({
        currentResume: state.currentResume ? {
          ...state.currentResume,
          data: {
            ...state.currentResume.data,
            experience: state.currentResume.data.experience.map(e => 
              e.id === expId ? { ...e, description } : e
            )
          }
        } : null,
        isLoading: false
      }));
    } catch (e) {
      console.error('AI generation failed:', e);
      set({ isLoading: false });
    }
  },

  suggestSkillsWithAI: async () => {
    const { currentResume } = get();
    if (!currentResume) return [];
    
    try {
      const currentSkills = currentResume.data.skills.map(s => s.name);
      const suggestions = await aiService.suggestSkills(
        currentResume.data.basics.headline || 'Professional',
        currentSkills
      );
      return suggestions;
    } catch (e) {
      console.error('AI suggestion failed:', e);
      return [];
    }
  },

  improveTextWithAI: async (text, context) => {
    try {
      return await aiService.improveText(text, context);
    } catch (e) {
      console.error('AI improvement failed:', e);
      return text;
    }
  }
}));

// Initialize auth state listener
authService.onAuthStateChange((user) => {
  useStore.setState({ user, authInitialized: true });
  if (user) {
    useStore.getState().fetchResumes();
  }
});