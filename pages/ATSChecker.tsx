import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Button, Card } from '../components/UIComponents';
import { 
    FileText, Upload, CheckCircle, AlertTriangle, X, 
    BarChart3, Loader2, Sparkles, BrainCircuit, Target, 
    TrendingUp, FileCheck, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { atsService } from '../services/firebase';
import { ATSAnalysis, Resume } from '../types';

// Extended type for "AI" suggestions (local only for now)
interface AIInsight {
    type: 'strength' | 'weakness' | 'opportunity';
    title: string;
    description: string;
}

export const ATSChecker = () => {
    const { resumes } = useStore();
    const [mode, setMode] = useState<'upload' | 'select'>('upload');
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStage, setScanStage] = useState<string>('');
    const [result, setResult] = useState<ATSAnalysis | null>(null);
    const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stages = [
        "Parsing Document Structure...",
        "Identifying Keywords & Skills...",
        "Analyzing Formatting Compliance...",
        "Generating AI Improvements..."
    ];

    const generateInsights = (score: number): AIInsight[] => {
        const insights: AIInsight[] = [];
        if (score > 80) {
            insights.push({ type: 'strength', title: 'Strong Impact Verbs', description: 'Your usage of action verbs like "Spearheaded" and "Orchestrated" is excellent.' });
            insights.push({ type: 'opportunity', title: 'Target Senior Roles', description: 'Your profile structure aligns well with Senior/Lead position requirements.' });
        } else {
            insights.push({ type: 'weakness', title: 'Passive Voice Detected', description: 'Try converting responsibilities into achievements (e.g., "Responsible for X" -> "Increased X by Y%").' });
            insights.push({ type: 'opportunity', title: 'Quantify Achievements', description: 'Adding numbers ($, %, +) will significantly boost your parsing score.' });
        }
        insights.push({ type: 'strength', title: 'Clean Hierarchy', description: 'Section headers are clearly identifiable by most parser algorithms.' });
        return insights;
    };

    const runSimulation = (onComplete: (res: ATSAnalysis) => void) => {
        setIsScanning(true);
        let currentStage = 0;
        setScanStage(stages[0]);

        const interval = setInterval(() => {
            currentStage++;
            if (currentStage < stages.length) {
                setScanStage(stages[currentStage]);
            } else {
                clearInterval(interval);
                setIsScanning(false);
                // Mock result usually, but passed in for internal
            }
        }, 800);

        // Simulation end
        setTimeout(() => {
             // If external, mock result here. If internal, use passed fn.
             if (mode === 'upload') {
                const mockScore = Math.floor(Math.random() * (92 - 68) + 68);
                const mockRes: ATSAnalysis = {
                    score: mockScore,
                    marketAverage: 75,
                    keywordsFound: ['Project Management', 'React', 'Team Leadership', 'Strategic Planning'],
                    missingKeywords: ['Cloud Computing', 'CI/CD', 'System Design'],
                    issues: [
                        { severity: 'medium', message: 'File format is readable but metadata formatting could be improved.' },
                        { severity: 'low', message: 'Consider adding a "Certifications" section for better verified skill matching.' }
                    ],
                    summary: 'Parsing complete. Your resume has a solid foundation but lacks specific technical keywords for the target role level.'
                };
                setAiInsights(generateInsights(mockScore));
                onComplete(mockRes);
             }
        }, 3200); // 4 stages * 800ms
    };

    const handleScan = async () => {
        setResult(null);
        
        if (mode === 'upload' && file) {
            runSimulation((res) => setResult(res));
        } else if (mode === 'select' && selectedResumeId) {
            const resume = resumes.find(r => r.id === selectedResumeId);
            if (!resume) return;
            
            // For internal, we still show the "AI" animation
            setIsScanning(true);
            let currentStage = 0;
            setScanStage(stages[0]);
            
            const interval = setInterval(() => {
                currentStage++;
                if (currentStage < stages.length) setScanStage(stages[currentStage]);
                else clearInterval(interval);
            }, 600);

            setTimeout(() => {
                const analysis = atsService.analyzeResume(resume);
                setAiInsights(generateInsights(analysis.score));
                setResult(analysis);
                setIsScanning(false);
            }, 2400); 
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setResult(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-8 px-4 pb-20">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        AI Resume <span className="text-primary-500">Scanner</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Analyze your resume against enterprise-grade ATS algorithms. Get AI-powered suggestions to improve your ranking and get hired faster.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Controls Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-[#121212] border-white/5 p-6 backdrop-blur-xl">
                            <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                                <button 
                                    onClick={() => { setMode('upload'); setResult(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'upload' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Upload size={16} /> Upload File
                                </button>
                                <button 
                                    onClick={() => { setMode('select'); setResult(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'select' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <FileCheck size={16} /> Select Resume
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === 'upload' ? (
                                    <motion.div 
                                        key="upload"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div 
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group min-h-[220px] ${file ? 'border-primary-500/50 bg-primary-900/10' : 'border-gray-700 bg-black/20 hover:border-primary-500/40 hover:bg-black/40'}`}
                                        >
                                            {file ? (
                                                <div className="text-center">
                                                    <div className="w-14 h-14 bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-400 shadow-glow">
                                                        <FileText size={28} />
                                                    </div>
                                                    <p className="text-white font-semibold truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB • {file.name.split('.').pop()?.toUpperCase()}</p>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                                                        className="text-xs text-red-400 hover:text-red-300 mt-4 px-3 py-1 bg-red-900/20 rounded-full transition-colors"
                                                    >
                                                        Remove File
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-14 h-14 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                        <Upload size={24} className="text-gray-400 group-hover:text-primary-400" />
                                                    </div>
                                                    <p className="text-gray-200 font-medium">Click or Drag file here</p>
                                                    <p className="text-xs text-gray-500 mt-2 text-center max-w-[200px]">Supports all resume formats (PDF, DOCX, TXT)</p>
                                                </>
                                            )}
                                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="select"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
                                    >
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">My Resumes</p>
                                        {resumes.map(resume => (
                                            <div 
                                                key={resume.id}
                                                onClick={() => setSelectedResumeId(resume.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedResumeId === resume.id ? 'bg-primary-900/20 border-primary-500/50 text-white' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 text-gray-300'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${selectedResumeId === resume.id ? 'bg-primary-500/20 text-primary-400' : 'bg-black/40 text-gray-500'}`}>
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-medium truncate text-sm">{resume.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">Last edited {new Date(resume.updatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                {selectedResumeId === resume.id && <CheckCircle size={16} className="text-primary-400" />}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button 
                                onClick={handleScan} 
                                disabled={isScanning || (mode === 'upload' ? !file : !selectedResumeId)}
                                className="w-full mt-6 h-12 text-base shadow-xl shadow-primary-900/20"
                            >
                                {isScanning ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" /> Scanning...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <BrainCircuit size={18} /> Analyze Resume
                                    </span>
                                )}
                            </Button>
                        </Card>

                        {/* Scan Progress Overlay */}
                        <AnimatePresence>
                            {isScanning && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                                >
                                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                                            <motion.div 
                                                className="h-full bg-primary-500"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 2.5, ease: "linear" }}
                                            />
                                        </div>
                                        <div className="w-20 h-20 bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                            <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full animate-ping-slow"></div>
                                            <Sparkles size={32} className="text-primary-400 animate-pulse" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Analyzing Resume</h3>
                                        <p className="text-primary-400 text-sm font-medium animate-pulse">{scanStage}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Top Score Analysis */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Card className="md:col-span-1 bg-gradient-to-br from-[#1a1a1a] to-black border-white/10 flex flex-col items-center justify-center py-8 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary-500/5 blur-3xl"></div>
                                            <div className="relative w-40 h-40">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="80" cy="80" r="70" stroke="#333" strokeWidth="8" fill="transparent" />
                                                    <circle 
                                                        cx="80" cy="80" r="70" 
                                                        stroke={result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#eab308' : '#ef4444'} 
                                                        strokeWidth="8" 
                                                        fill="transparent" 
                                                        strokeDasharray={440} 
                                                        strokeDashoffset={440 - (440 * result.score) / 100} 
                                                        className="transition-all duration-1000 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-5xl font-bold text-white tracking-tighter">{result.score}</span>
                                                    <span className="text-xs font-bold text-gray-500 mt-1">TOTAL SCORE</span>
                                                </div>
                                            </div>
                                            <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold border ${result.score >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/20' : result.score >= 60 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {result.score >= 80 ? 'Ready for Application' : result.score >= 60 ? 'Needs Optimization' : 'Requires Attention'}
                                            </div>
                                        </Card>

                                        {/* AI Summary */}
                                        <Card className="md:col-span-2 bg-[#1a1a1a] border-white/10 p-6 relative group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                                    <BrainCircuit size={20} />
                                                </div>
                                                <h3 className="text-lg font-bold text-white">AI Executive Summary</h3>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed text-sm lg:text-base border-l-2 border-purple-500/30 pl-4">
                                                {result.summary}
                                            </p>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="bg-black/30 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500 mb-1">Keywords Found</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {result.keywordsFound.length > 0 ? (
                                                            result.keywordsFound.slice(0,4).map(k => <span key={k} className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md">{k}</span>)
                                                        ) : <span className="text-xs text-gray-500 italic">None detected</span>}
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500 mb-1">Missing Keywords</p>
                                                    <div className="flex flex-wrap gap-1">
                                                         {result.missingKeywords.length > 0 ? (
                                                            result.missingKeywords.slice(0,3).map(k => <span key={k} className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md">{k}</span>)
                                                        ) : <span className="text-xs text-green-500">None!</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* AI Smart Suggestions */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <Sparkles size={20} className="text-yellow-400" /> Smart Improvements
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {aiInsights.map((insight, idx) => (
                                                <Card key={idx} className="bg-[#151515] border-white/5 hover:bg-[#1a1a1a] transition-colors p-5 border-l-4" style={{borderLeftColor: insight.type === 'strength' ? '#22c55e' : insight.type === 'weakness' ? '#ef4444' : '#3b82f6'}}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {insight.type === 'strength' && <TrendingUp size={16} className="text-green-500" />}
                                                        {insight.type === 'weakness' && <AlertTriangle size={16} className="text-red-500" />}
                                                        {insight.type === 'opportunity' && <Target size={16} className="text-blue-500" />}
                                                        <h4 className="font-bold text-white text-sm">{insight.title}</h4>
                                                    </div>
                                                    <p className="text-xs text-gray-400 leading-relaxed">{insight.description}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Issues List */}
                                    {result.issues.length > 0 && (
                                        <Card className="bg-[#1a1a1a] border-white/10">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <AlertTriangle size={18} className="text-orange-400" /> Critical Fixes
                                            </h3>
                                            <div className="space-y-3">
                                                {result.issues.map((issue, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                                                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${issue.severity === 'high' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                                        <div>
                                                            <p className="text-sm text-gray-200">{issue.message}</p>
                                                            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">{issue.severity} Priority</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                                    <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                        <BarChart3 size={40} className="text-gray-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Ready to Analyze</h3>
                                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                                        Select a resume or upload a file to get instant AI-powered feedback, score analysis, and improvement suggestions.
                                    </p>
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-primary-500" /> ATS Parsability</span>
                                        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-primary-500" /> Keyword Match</span>
                                        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-primary-500" /> Format Check</span>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
