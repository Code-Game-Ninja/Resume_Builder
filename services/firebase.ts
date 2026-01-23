import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { Resume, User, Template, ATSAnalysis, ResumeData } from '../types';

// Firebase configuration
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// --- Authentication Service ---

export const authService = {
  // Email/Password Sign Up
  async signUp(email: string, password: string, name: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email || email,
      name: name,
      avatar: userCredential.user.photoURL || undefined
    };
    
    // Store user in Firestore (filter out undefined values)
    const userData: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: serverTimestamp()
    };
    if (user.avatar) {
      userData.avatar = user.avatar;
    }
    
    await setDoc(doc(db, 'users', user.id), userData);
    
    return user;
  },

  // Email/Password Sign In
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUser(userCredential.user);
  },

  // Google Sign In
  async signInWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = this.mapFirebaseUser(userCredential.user);
    
    // Store/update user in Firestore (filter out undefined values)
    const userData: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      updatedAt: serverTimestamp()
    };
    if (user.avatar) {
      userData.avatar = user.avatar;
    }
    
    await setDoc(doc(db, 'users', user.id), userData, { merge: true });
    
    return user;
  },

  // GitHub Sign In
  async signInWithGithub(): Promise<User> {
    const userCredential = await signInWithPopup(auth, githubProvider);
    const user = this.mapFirebaseUser(userCredential.user);
    
    // Store/update user in Firestore (filter out undefined values)
    const userData: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      updatedAt: serverTimestamp()
    };
    if (user.avatar) {
      userData.avatar = user.avatar;
    }
    
    await setDoc(doc(db, 'users', user.id), userData, { merge: true });
    
    return user;
  },

  // Sign Out
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  // Update user profile
  async updateUserProfile(userId: string, data: { name?: string }): Promise<void> {
    if (auth.currentUser && data.name) {
      await updateProfile(auth.currentUser, { displayName: data.name });
    }
    
    const updateData: any = { updatedAt: serverTimestamp() };
    if (data.name) updateData.name = data.name;
    
    await updateDoc(doc(db, 'users', userId), updateData);
  },

  // Auth state listener
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(this.mapFirebaseUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  },

  // Map Firebase user to our User type
  mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'User',
      avatar: firebaseUser.photoURL || undefined
    };
  }
};

// --- Storage Service ---

export const storageService = {
  // Upload profile avatar
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP.');
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }
    
    const fileExtension = file.name.split('.').pop();
    const storageRef = ref(storage, `avatars/${userId}/profile.${fileExtension}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user profile in Firebase Auth
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    }
    
    // Update user document in Firestore
    await updateDoc(doc(db, 'users', userId), {
      avatar: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    return downloadURL;
  },
  
  // Delete profile avatar
  async deleteAvatar(userId: string): Promise<void> {
    try {
      // Try to delete the file (might not exist)
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      for (const ext of extensions) {
        try {
          const storageRef = ref(storage, `avatars/${userId}/profile.${ext}`);
          await deleteObject(storageRef);
        } catch (e) {
          // File doesn't exist, continue
        }
      }
    } catch (e) {
      console.error('Error deleting avatar:', e);
    }
    
    // Update user profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: '' });
    }
    
    // Update Firestore
    await updateDoc(doc(db, 'users', userId), {
      avatar: null,
      updatedAt: serverTimestamp()
    });
  },
  
  // Upload resume-related file (e.g., profile photo in resume)
  async uploadResumeImage(userId: string, resumeId: string, file: File): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP.');
    }
    
    const maxSize = 2 * 1024 * 1024; // 2MB for resume images
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 2MB.');
    }
    
    const fileExtension = file.name.split('.').pop();
    const storageRef = ref(storage, `resumes/${userId}/${resumeId}/photo.${fileExtension}`);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};

// --- Resume Service (Firestore) ---

export const resumeService = {
  // Get all resumes for current user
  async getResumes(userId: string): Promise<Resume[]> {
    const q = query(
      collection(db, 'resumes'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Resume[];
  },

  // Get single resume
  async getResume(resumeId: string): Promise<Resume | null> {
    const docRef = doc(db, 'resumes', resumeId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      ...snapshot.data(),
      id: snapshot.id,
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
    } as Resume;
  },

  // Create new resume
  async createResume(userId: string, name: string, templateId: string = 'onyx', initialColor?: string): Promise<Resume> {
    const resumeRef = doc(collection(db, 'resumes'));
    
    const newResumeData = {
      userId,
      name,
      updatedAt: serverTimestamp(),
      data: {
        basics: {
          name: '',
          headline: '',
          email: '',
          phone: '',
          location: '',
          website: '',
          summary: ''
        },
        experience: [],
        education: [],
        skills: []
      },
      metadata: {
        template: templateId,
        colors: {
          primary: initialColor || '#dc2626',
          text: '#000000',
          background: '#ffffff'
        }
      }
    };

    await setDoc(resumeRef, newResumeData);
    
    return {
      ...newResumeData,
      id: resumeRef.id,
      updatedAt: new Date()
    } as Resume;
  },

  // Update resume
  async updateResume(resumeId: string, updates: Partial<Resume>): Promise<void> {
    const docRef = doc(db, 'resumes', resumeId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete resume
  async deleteResume(resumeId: string): Promise<void> {
    await deleteDoc(doc(db, 'resumes', resumeId));
  },

  // Duplicate resume
  async duplicateResume(userId: string, resumeId: string): Promise<Resume> {
    const original = await this.getResume(resumeId);
    if (!original) throw new Error('Resume not found');

    const resumeRef = doc(collection(db, 'resumes'));
    const copy = {
      ...original,
      name: `${original.name} (Copy)`,
      userId,
      updatedAt: serverTimestamp()
    };
    delete (copy as any).id;

    await setDoc(resumeRef, copy);
    
    return {
      ...copy,
      id: resumeRef.id,
      updatedAt: new Date()
    };
  }
};

// --- Templates Service (Firestore) ---

// Default ATS-friendly templates with diverse styles
const DEFAULT_TEMPLATES: Template[] = [
  // === PROFESSIONAL / NO PHOTO ===
  { id: 'onyx', name: 'Onyx', description: 'Standard ATS-optimized single column layout. Clean and professional.', thumbnail: 'https://placehold.co/210x297/1a1a1a/white?text=Onyx', isCommunity: false, author: 'System', tags: ['ATS-Friendly', 'Minimal', 'No Photo'], config: { layout: 'single-column', style: 'minimal', hasPhoto: false } },
  { id: 'bronzor', name: 'Bronzor', description: 'Professional serif typography for executives and senior roles.', thumbnail: 'https://placehold.co/210x297/78350f/white?text=Bronzor', isCommunity: false, author: 'System', tags: ['Executive', 'Classic', 'No Photo'], config: { layout: 'single-column', style: 'classic', hasPhoto: false } },
  { id: 'kakuna', name: 'Kakuna', description: 'Tough, reliable, no-nonsense format. Perfect for traditional industries.', thumbnail: 'https://placehold.co/210x297/ca8a04/white?text=Kakuna', isCommunity: false, author: 'System', tags: ['ATS-Friendly', 'Simple', 'No Photo'], config: { layout: 'single-column', style: 'minimal', hasPhoto: false } },
  
  // === MODERN / WITH PHOTO ===
  { id: 'azurill', name: 'Azurill', description: 'Modern layout with photo and blue accents. High readability.', thumbnail: 'https://placehold.co/210x297/3b82f6/white?text=Azurill', isCommunity: false, author: 'System', tags: ['Modern', 'With Photo', 'Creative'], config: { layout: 'two-column-left', style: 'modern', hasPhoto: true } },
  { id: 'chikorita', name: 'Chikorita', description: 'Nature-inspired green with photo sidebar. Fresh and balanced.', thumbnail: 'https://placehold.co/210x297/15803d/white?text=Chikorita', isCommunity: false, author: 'System', tags: ['Creative', 'With Photo', 'Soft'], config: { layout: 'two-column-right', style: 'modern', hasPhoto: true } },
  { id: 'gengar', name: 'Gengar', description: 'Bold headers with high contrast. Photo included for impact.', thumbnail: 'https://placehold.co/210x297/581c87/white?text=Gengar', isCommunity: false, author: 'System', tags: ['Bold', 'With Photo', 'High Contrast'], config: { layout: 'two-column-left', style: 'bold', hasPhoto: true } },
  
  // === TECHNICAL / STRUCTURED ===
  { id: 'glalie', name: 'Glalie', description: 'Ice cool tones, extremely structured. Ideal for developers and engineers.', thumbnail: 'https://placehold.co/210x297/0ea5e9/white?text=Glalie', isCommunity: false, author: 'System', tags: ['Technical', 'Structured', 'No Photo'], config: { layout: 'single-column', style: 'modern', hasPhoto: false } },
  { id: 'ditto', name: 'Ditto', description: 'Adaptable layout for any content length. Tech-focused design.', thumbnail: 'https://placehold.co/210x297/9333ea/white?text=Ditto', isCommunity: false, author: 'System', tags: ['Versatile', 'Technical', 'No Photo'], config: { layout: 'single-column', style: 'bold', hasPhoto: false } },
  
  // === ELEGANT / EXECUTIVE ===
  { id: 'lapras', name: 'Lapras', description: 'Elegant flow with ample whitespace. Executive presence.', thumbnail: 'https://placehold.co/210x297/2563eb/white?text=Lapras', isCommunity: false, author: 'System', tags: ['Elegant', 'Executive', 'With Photo'], config: { layout: 'two-column-right', style: 'classic', hasPhoto: true } },
  { id: 'leafish', name: 'Leafish', description: 'Organic layout for creative professionals. Unique styling.', thumbnail: 'https://placehold.co/210x297/166534/white?text=Leafish', isCommunity: false, author: 'System', tags: ['Creative', 'Unique', 'With Photo'], config: { layout: 'two-column-left', style: 'minimal', hasPhoto: true } },
  
  // === NEW PREMIUM TEMPLATES ===
  { id: 'pikachu', name: 'Pikachu', description: 'Energetic yellow accents. Fun yet professional for startups.', thumbnail: 'https://placehold.co/210x297/eab308/black?text=Pikachu', isCommunity: false, author: 'System', tags: ['Startup', 'Modern', 'No Photo'], config: { layout: 'single-column', style: 'modern', hasPhoto: false } },
  { id: 'mewtwo', name: 'Mewtwo', description: 'Premium executive template with elegant purple tones.', thumbnail: 'https://placehold.co/210x297/7c3aed/white?text=Mewtwo', isCommunity: false, author: 'System', tags: ['Executive', 'Premium', 'With Photo'], config: { layout: 'two-column-left', style: 'bold', hasPhoto: true } },
  { id: 'eevee', name: 'Eevee', description: 'Versatile warm tones. Adapts to any industry beautifully.', thumbnail: 'https://placehold.co/210x297/d97706/white?text=Eevee', isCommunity: false, author: 'System', tags: ['Versatile', 'Warm', 'No Photo'], config: { layout: 'single-column', style: 'classic', hasPhoto: false } },
  { id: 'charizard', name: 'Charizard', description: 'Bold red-orange gradients. For leaders who stand out.', thumbnail: 'https://placehold.co/210x297/dc2626/white?text=Charizard', isCommunity: false, author: 'System', tags: ['Bold', 'Leadership', 'With Photo'], config: { layout: 'two-column-right', style: 'bold', hasPhoto: true } },
  { id: 'squirtle', name: 'Squirtle', description: 'Cool blue professional design. Perfect for corporate roles.', thumbnail: 'https://placehold.co/210x297/0284c7/white?text=Squirtle', isCommunity: false, author: 'System', tags: ['Corporate', 'Professional', 'No Photo'], config: { layout: 'single-column', style: 'minimal', hasPhoto: false } },
  { id: 'bulbasaur', name: 'Bulbasaur', description: 'Fresh green with sidebar. Great for sustainability roles.', thumbnail: 'https://placehold.co/210x297/16a34a/white?text=Bulbasaur', isCommunity: false, author: 'System', tags: ['Fresh', 'Modern', 'With Photo'], config: { layout: 'two-column-left', style: 'modern', hasPhoto: true } },
];

// Fake placeholder data for published templates (privacy protection)
const FAKE_RESUME_DATA = {
  basics: {
    name: 'Alex Johnson',
    headline: 'Senior Software Engineer',
    email: 'alex.johnson@example.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    website: 'linkedin.com/in/alexjohnson',
    summary: 'Experienced software engineer with 8+ years building scalable web applications. Expert in React, Node.js, and cloud architecture. Passionate about clean code and mentoring junior developers.'
  },
  experience: [
    { id: 'exp_1', company: 'Tech Corp Inc.', position: 'Senior Software Engineer', location: 'San Francisco, CA', startDate: '2020-01', endDate: 'Present', description: '• Led development of microservices architecture serving 10M+ users\n• Reduced API response time by 40% through optimization\n• Mentored team of 5 junior developers', visible: true },
    { id: 'exp_2', company: 'StartUp Labs', position: 'Full Stack Developer', location: 'New York, NY', startDate: '2017-06', endDate: '2019-12', description: '• Built customer-facing React applications from scratch\n• Implemented CI/CD pipelines reducing deployment time by 60%\n• Collaborated with product team on feature roadmap', visible: true }
  ],
  education: [
    { id: 'edu_1', school: 'University of Technology', degree: 'Bachelor of Science', field: 'Computer Science', startDate: '2013', endDate: '2017', description: 'Graduated with Honors', visible: true }
  ],
  skills: [
    { id: 'sk_1', name: 'React', level: 5 },
    { id: 'sk_2', name: 'Node.js', level: 5 },
    { id: 'sk_3', name: 'TypeScript', level: 4 },
    { id: 'sk_4', name: 'AWS', level: 4 },
    { id: 'sk_5', name: 'Python', level: 3 }
  ],
  certificates: [],
  projects: [],
  languages: [],
  activities: []
};

export const templateService = {
  // Get all templates (system + community)
  async getTemplates(): Promise<Template[]> {
    // Get community templates from Firestore
    const q = query(collection(db, 'templates'), where('isCommunity', '==', true));
    const snapshot = await getDocs(q);
    const communityTemplates = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Template[];

    return [...DEFAULT_TEMPLATES, ...communityTemplates];
  },

  // Publish a resume as community template (with privacy protection)
  async publishTemplate(resume: Resume, authorName: string): Promise<Template> {
    const templateRef = doc(collection(db, 'templates'));
    
    // Create template with FAKE data for privacy
    const newTemplate: Template = {
      id: templateRef.id,
      name: `${resume.name}`,
      description: `Community template by ${authorName}. Layout and design only - sample data shown.`,
      thumbnail: resume.thumbnail || 'https://placehold.co/210x297/333/white?text=Community',
      isCommunity: true,
      author: authorName,
      tags: ['Community', 'Custom'],
      config: resume.metadata?.template ? 
        { layout: 'single-column', style: 'modern' } : 
        { layout: 'single-column', style: 'modern' },
      // Store fake data for preview, not the user's real data
      previewData: FAKE_RESUME_DATA
    };

    await setDoc(templateRef, newTemplate);
    return newTemplate;
  }
};

// --- ATS Analysis Service ---

export const atsService = {
  analyzeResume(resume: Resume): ATSAnalysis {
    const data = resume.data;
    const issues: { severity: 'high' | 'medium' | 'low'; message: string }[] = [];
    let score = 100;

    // 1. Content Length Check
    const wordCount = JSON.stringify(data).split(' ').length;
    if (wordCount < 150) {
      score -= 20;
      issues.push({ severity: 'high', message: 'Resume is too short. ATS algorithms prefer at least 300-400 words.' });
    }

    // 2. Contact Info Check
    if (!data.basics.email) {
      score -= 15;
      issues.push({ severity: 'high', message: 'Missing email address. This is critical for ATS.' });
    }
    if (!data.basics.phone) {
      score -= 10;
      issues.push({ severity: 'medium', message: 'Missing phone number.' });
    }

    // 3. Section Checks
    if (data.experience.length === 0) {
      score -= 20;
      issues.push({ severity: 'high', message: 'No work experience listed.' });
    }
    if (data.skills.length < 5) {
      score -= 10;
      issues.push({ severity: 'medium', message: 'List at least 5 key skills to match job descriptions.' });
    }
    if (!data.basics.summary || data.basics.summary.length < 50) {
      score -= 10;
      issues.push({ severity: 'medium', message: 'Add a professional summary (50+ words recommended).' });
    }
    if (data.education.length === 0) {
      score -= 5;
      issues.push({ severity: 'low', message: 'Consider adding education details.' });
    }

    // Extract keywords found
    const keywordsFound = data.skills.map(s => s.name).slice(0, 5);
    
    return {
      score: Math.max(0, score),
      marketAverage: 72,
      keywordsFound,
      missingKeywords: ['Agile', 'Leadership', 'Strategic Planning', 'Data Analysis'].filter(
        k => !data.skills.some(s => s.name.toLowerCase().includes(k.toLowerCase()))
      ),
      issues,
      summary: score > 80 
        ? 'Excellent! Your resume is highly optimized for ATS.' 
        : score > 60 
        ? 'Good start! A few improvements will help you pass automated filters.'
        : 'Needs improvement to pass automated filters.'
    };
  }
};
