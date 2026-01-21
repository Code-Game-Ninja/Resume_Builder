# 🎯 Resume Builder with AI

A modern, AI-powered resume builder built with React, TypeScript, Vite, and Firebase. Create professional resumes with AI assistance, multiple templates, and real-time collaboration.

![Resume Builder Preview](https://via.placeholder.com/1200x600/6366f1/ffffff?text=Resume+Builder+Preview)

## ✨ Features

### 🚀 **AI-Powered Content Generation**
- **Smart Summary Generation**: AI creates compelling professional summaries
- **Experience Enhancement**: Automatically improves job descriptions with STAR method
- **Skill Suggestions**: Get personalized skill recommendations based on your role
- **Text Improvement**: Enhance existing content with AI suggestions

### 🎨 **Multiple Professional Templates**
- **Onyx**: Minimal, standard, highly readable
- **Azurill**: Two-column layout with blue sidebar
- **Bronzor**: Serif, classic, warm background
- **Gengar**: Modern, dark sidebar, high contrast
- **Glalie**: Technical, mono-styled, code-like
- **Kakuna**: Creative, colorful design
- **Ditto**: Clean, ATS-friendly
- **Lapras**: Elegant, professional
- **Leafish**: Organic, green-themed

### 🔐 **Authentication & Security**
- **Email/Password Authentication**
- **Google OAuth Integration**
- **GitHub OAuth Integration**
- **Secure Firebase Backend**
- **User Profile Management**

### 📱 **Modern UI/UX**
- **Responsive Design**: Works on all devices
- **Dark Theme**: Easy on the eyes
- **Real-time Preview**: See changes instantly
- **Drag & Drop Interface**
- **Intuitive Navigation**

### ☁️ **Cloud Features**
- **Firebase Firestore**: Real-time database
- **Firebase Storage**: Secure file uploads
- **Firebase Auth**: Secure authentication
- **Cross-device Sync**: Access from anywhere

### 📊 **ATS Optimization**
- **ATS Scoring**: Check resume compatibility
- **Keyword Analysis**: Missing keyword detection
- **Format Optimization**: ATS-friendly layouts

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini API
- **Build Tool**: Vite
- **Deployment**: Firebase Hosting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Google AI Studio account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Code-Game-Ninja/Resume_Builder.git
   cd Resume_Builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys:
   ```env
   # Gemini AI API Key (get from https://aistudio.google.com/app/apikey)
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here

   # Firebase Configuration (get from Firebase Console)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password, Google, GitHub)
   - Enable Firestore Database
   - Enable Storage
   - Deploy security rules:
     ```bash
     firebase login
     firebase init
     firebase deploy --only firestore:rules,storage
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage

### Creating Your First Resume

1. **Sign Up/Login**: Create an account or sign in with Google/GitHub
2. **Choose Template**: Select from 9 professional templates
3. **Add Basic Info**: Fill in your personal details and upload a photo
4. **Build Sections**:
   - **Summary**: Use AI to generate a compelling summary
   - **Experience**: Add jobs with AI-enhanced descriptions
   - **Education**: List your educational background
   - **Skills**: Get AI suggestions for relevant skills
5. **Preview & Export**: See real-time preview and export as PDF

### AI Features

- **Summary Generation**: Click the wand icon to generate a professional summary
- **Experience Enhancement**: Use AI to improve job descriptions
- **Skill Suggestions**: Get personalized skill recommendations
- **Text Improvement**: Enhance existing content

### Template Customization

- **Colors**: Customize primary and text colors
- **Fonts**: Choose from multiple font combinations
- **Layout**: Adjust spacing and alignment
- **Sections**: Show/hide sections as needed

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |
| `VITE_GEMINI_API_KEY` | Same key, exposed to client | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | No |

### Firebase Security Rules

The app includes comprehensive security rules for:
- **Authentication**: User access control
- **Data Validation**: Input sanitization and size limits
- **File Uploads**: Secure avatar and resume photo storage

## 🚀 Deployment

### Firebase Hosting (Recommended)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and initialize**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build and deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Other Platforms

The app can be deployed to:
- **Vercel**: Connect your GitHub repo
- **Netlify**: Drag & drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the AI features
- **Firebase** for the robust backend infrastructure
- **Tailwind CSS** for the beautiful styling system
- **Radix UI** for accessible components

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the documentation
- Join our community discussions

---

**Made with ❤️ using React, TypeScript, and AI**
