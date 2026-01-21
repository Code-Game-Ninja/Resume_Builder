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
  async createResume(userId: string, name: string, templateId: string = 'onyx'): Promise<Resume> {
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
          primary: '#dc2626',
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

// Default ATS-friendly templates
const DEFAULT_TEMPLATES: Template[] = [
  { id: 'onyx', name: 'Onyx', description: 'Standard ATS-optimized single column layout.', thumbnail: 'https://placehold.co/210x297/1a1a1a/white?text=Onyx', isCommunity: false, author: 'System', tags: ['ATS-Friendly', 'Minimal'], config: { layout: 'single-column', style: 'minimal' } },
  { id: 'azurill', name: 'Azurill', description: 'Clean layout with blue accents, high readability.', thumbnail: 'https://placehold.co/210x297/3b82f6/white?text=Azurill', isCommunity: false, author: 'System', tags: ['ATS-Friendly', 'Modern'], config: { layout: 'two-column-left', style: 'modern' } },
  { id: 'bronzor', name: 'Bronzor', description: 'Professional serif typography for executives.', thumbnail: 'https://placehold.co/210x297/78350f/white?text=Bronzor', isCommunity: false, author: 'System', tags: ['Executive', 'Classic'], config: { layout: 'single-column', style: 'classic' } },
  { id: 'chikorita', name: 'Chikorita', description: 'Nature-inspired green, balanced spacing.', thumbnail: 'https://placehold.co/210x297/15803d/white?text=Chikorita', isCommunity: false, author: 'System', tags: ['Creative', 'Soft'], config: { layout: 'two-column-right', style: 'modern' } },
  { id: 'ditto', name: 'Ditto', description: 'Adaptable layout that fits any content length.', thumbnail: 'https://placehold.co/210x297/9333ea/white?text=Ditto', isCommunity: false, author: 'System', tags: ['Versatile', 'Modern'], config: { layout: 'single-column', style: 'bold' } },
  { id: 'gengar', name: 'Gengar', description: 'Bold headers with high contrast.', thumbnail: 'https://placehold.co/210x297/581c87/white?text=Gengar', isCommunity: false, author: 'System', tags: ['Bold', 'High Contrast'], config: { layout: 'two-column-left', style: 'bold' } },
  { id: 'glalie', name: 'Glalie', description: 'Ice cool tones, extremely structured data.', thumbnail: 'https://placehold.co/210x297/0ea5e9/white?text=Glalie', isCommunity: false, author: 'System', tags: ['Structured', 'Technical'], config: { layout: 'single-column', style: 'modern' } },
  { id: 'kakuna', name: 'Kakuna', description: 'Tough, reliable, no-nonsense format.', thumbnail: 'https://placehold.co/210x297/ca8a04/white?text=Kakuna', isCommunity: false, author: 'System', tags: ['ATS-Friendly', 'Simple'], config: { layout: 'single-column', style: 'minimal' } },
  { id: 'lapras', name: 'Lapras', description: 'Elegant flow with ample whitespace.', thumbnail: 'https://placehold.co/210x297/2563eb/white?text=Lapras', isCommunity: false, author: 'System', tags: ['Elegant', 'Clean'], config: { layout: 'two-column-right', style: 'classic' } },
  { id: 'leafish', name: 'Leafish', description: 'Organic layout for creative professionals.', thumbnail: 'https://placehold.co/210x297/166534/white?text=Leafish', isCommunity: false, author: 'System', tags: ['Creative', 'Unique'], config: { layout: 'two-column-left', style: 'minimal' } },
];

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

  // Publish a resume as community template
  async publishTemplate(resume: Resume, authorName: string): Promise<Template> {
    const templateRef = doc(collection(db, 'templates'));
    
    const newTemplate: Template = {
      id: templateRef.id,
      name: `${resume.name}`,
      description: `Community template by ${authorName}`,
      thumbnail: resume.thumbnail || 'https://placehold.co/210x297/333/white?text=Community',
      isCommunity: true,
      author: authorName,
      tags: ['Community', 'Custom'],
      config: { layout: 'single-column', style: 'modern' }
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
