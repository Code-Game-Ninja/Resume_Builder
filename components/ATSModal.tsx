import React, { useState } from 'react';
import { useStore } from '../store';
import { X, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Search, ChevronDown, ChevronUp, Sparkles, Target, Zap, Shield, FileText, ArrowRight } from 'lucide-react';
import { Button } from './UIComponents';
import { motion, AnimatePresence } from 'framer-motion';

interface ATSModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScoreRing = ({ score, size = 120, label }: { score: number; size?: number; label?: string }) => {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (circumference * score) / 100;
    const color = score > 80 ? '#22c55e' : score > 60 ? '#eab308' : '#ef4444';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90">
                <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#333" strokeWidth="8" />
                <circle 
                    cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={color} strokeWidth="8" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{score}</span>
                {label && <span className="text-xs text-gray-500 uppercase">{label}</span>}
            </div>
        </div>
    );
};

const BreakdownBar = ({ label, score, weight }: { label: string; score: number; weight: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-sm">
            <span className="text-gray-400">{label} <span className="text-gray-600">({weight})</span></span>
            <span className="text-white font-medium">{score}/100</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full ${score > 80 ? 'bg-green-500' : score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            />
        </div>
    </div>
);

const ATSSystemCard = ({ name, data }: { name: string; data: { score: number; risk: string; notes: string } }) => (
    <div className="bg-white/5 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
            <span className="text-white font-medium">{name}</span>
            <span className={`text-2xl font-bold ${data.score > 70 ? 'text-green-400' : data.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {data.score}
            </span>
        </div>
        <div className="text-xs text-gray-500">
            <span className={`inline-block px-2 py-0.5 rounded-full ${data.risk.toLowerCase().includes('low') ? 'bg-green-500/20 text-green-400' : data.risk.toLowerCase().includes('medium') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                Risk: {data.risk}
            </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{data.notes}</p>
    </div>
);

export const ATSModal: React.FC<ATSModalProps> = ({ isOpen, onClose }) => {
    const { advancedAtsAnalysis, atsAnalysis, isLoading, runAdvancedATSAnalysis, jobDescription, setJobDescription, optimizeResumeWithAI, saveCurrentResume } = useStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'comparator' | 'improvements'>('overview');
    const [showJdInput, setShowJdInput] = useState(!advancedAtsAnalysis);
    const [localJd, setLocalJd] = useState(jobDescription);
    const [isOptimizing, setIsOptimizing] = useState(false);

    if (!isOpen) return null;

    const analysis = advancedAtsAnalysis;

    const handleAnalyze = () => {
        setJobDescription(localJd);
        runAdvancedATSAnalysis(localJd);
        setShowJdInput(false);
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            await optimizeResumeWithAI();
            await saveCurrentResume();
            onClose();
        } catch (e) {
            console.error('Optimization failed:', e);
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-[#0c0c0c] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gradient-to-r from-primary-900/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <Target className="text-primary-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Advanced ATS Analyzer</h2>
                            <p className="text-xs text-gray-500">AI-Powered Resume Analysis (Simulated)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Job Description Input */}
                    {showJdInput && !analysis && (
                        <div className="p-6 border-b border-gray-800 bg-white/5">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Paste Job Description (Optional)
                            </label>
                            <textarea 
                                value={localJd}
                                onChange={(e) => setLocalJd(e.target.value)}
                                placeholder="Paste the job description here for targeted analysis..."
                                className="w-full h-32 bg-black/50 border border-gray-700 rounded-xl p-4 text-white text-sm placeholder-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 outline-none resize-none"
                            />
                            <Button onClick={handleAnalyze} className="mt-4 w-full bg-primary-600 hover:bg-primary-700">
                                <Sparkles size={16} className="mr-2" /> Analyze Resume
                            </Button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto text-primary-400 animate-pulse" size={24} />
                            </div>
                            <p className="text-gray-400">AI is analyzing your resume against ATS systems...</p>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* Tabs */}
                            <div className="flex border-b border-gray-800 px-6 gap-1 bg-black/30">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Target },
                                    { id: 'breakdown', label: 'Score Breakdown', icon: FileText },
                                    { id: 'comparator', label: 'ATS Comparator', icon: Shield },
                                    { id: 'improvements', label: 'Improvements', icon: Zap }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                                            activeTab === tab.id 
                                                ? 'border-primary-500 text-primary-400' 
                                                : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'overview' && (
                                        <motion.div 
                                            key="overview"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            {/* Main Scores */}
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="bg-white/5 border border-gray-800 rounded-2xl p-6 flex items-center gap-6">
                                                    <ScoreRing score={analysis.ats_score} label="ATS Score" />
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-white mb-2">Overall ATS Compatibility</h3>
                                                        <p className="text-sm text-gray-400 mb-3">
                                                            {analysis.ats_score > 80 ? 'Excellent! Your resume is highly optimized.' :
                                                             analysis.ats_score > 60 ? 'Good start. Some improvements recommended.' :
                                                             'Needs work to pass automated filters.'}
                                                        </p>
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                                                            analysis.final_verdict.screening_outcome === 'Yes' ? 'bg-green-500/20 text-green-400' :
                                                            analysis.final_verdict.screening_outcome === 'Borderline' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                            {analysis.final_verdict.screening_outcome === 'Yes' ? <CheckCircle size={12} /> :
                                                             analysis.final_verdict.screening_outcome === 'Borderline' ? <AlertTriangle size={12} /> :
                                                             <AlertCircle size={12} />}
                                                            Likely to Pass: {analysis.final_verdict.screening_outcome}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 border border-gray-800 rounded-2xl p-6 flex items-center gap-6">
                                                    <ScoreRing score={analysis.job_match_score} label="Job Match" />
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-white mb-2">Job Description Match</h3>
                                                        <p className="text-sm text-gray-400 mb-3">
                                                            How well your resume aligns with the target role.
                                                        </p>
                                                        <div className="text-xs text-gray-500">
                                                            Required for shortlist: ~{analysis.final_verdict.required_score}+
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Biggest Blocker */}
                                            {analysis.final_verdict.biggest_blocker && (
                                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                                                    <div>
                                                        <h4 className="text-sm font-medium text-red-300 mb-1">Biggest Blocker</h4>
                                                        <p className="text-sm text-red-200/80">{analysis.final_verdict.biggest_blocker}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI IMPROVEMENT CTA - Show when score is low */}
                                            {analysis.ats_score < 75 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-gradient-to-r from-primary-900/40 to-purple-900/40 border border-primary-500/30 rounded-2xl p-6"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
                                                            <Sparkles className="text-primary-400" size={24} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-white mb-2">Boost Your Score with AI</h3>
                                                            <p className="text-sm text-gray-300 mb-4">
                                                                Let our AI rewrite your resume to be ATS-optimized. We'll keep all your information but enhance the language, add metrics, and use powerful action verbs.
                                                            </p>
                                                            <Button 
                                                                onClick={handleOptimize}
                                                                disabled={isOptimizing || isLoading}
                                                                className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 border-none"
                                                            >
                                                                {isOptimizing ? (
                                                                    <><span className="animate-spin mr-2">⟳</span> Optimizing...</>
                                                                ) : (
                                                                    <><Sparkles size={16} className="mr-2" /> Generate Optimized Resume</>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Missing Keywords */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-gray-300">Missing Keywords</h4>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-red-400 font-medium">High Priority</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {analysis.missing_keywords.high_priority.slice(0, 5).map(k => (
                                                                <span key={k} className="px-2 py-1 bg-red-500/10 text-red-300 text-xs rounded-md border border-red-500/20">{k}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-yellow-400 font-medium">Medium Priority</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {analysis.missing_keywords.medium_priority.slice(0, 5).map(k => (
                                                                <span key={k} className="px-2 py-1 bg-yellow-500/10 text-yellow-300 text-xs rounded-md border border-yellow-500/20">{k}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-xs text-blue-400 font-medium">Low Priority</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {analysis.missing_keywords.low_priority.slice(0, 5).map(k => (
                                                                <span key={k} className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-md border border-blue-500/20">{k}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'breakdown' && (
                                        <motion.div 
                                            key="breakdown"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            <p className="text-sm text-gray-400 mb-4">Detailed breakdown of how your resume scored in each category:</p>
                                            <BreakdownBar label="Keywords" score={analysis.score_breakdown.keywords} weight="30%" />
                                            <BreakdownBar label="Experience Relevance" score={analysis.score_breakdown.experience} weight="20%" />
                                            <BreakdownBar label="Skills" score={analysis.score_breakdown.skills} weight="15%" />
                                            <BreakdownBar label="Formatting & Structure" score={analysis.score_breakdown.formatting} weight="15%" />
                                            <BreakdownBar label="Job Title Alignment" score={analysis.score_breakdown.job_title} weight="10%" />
                                            <BreakdownBar label="Section Clarity" score={analysis.score_breakdown.sections} weight="10%" />
                                        </motion.div>
                                    )}

                                    {activeTab === 'comparator' && (
                                        <motion.div 
                                            key="comparator"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <p className="text-sm text-gray-400 mb-4">Simulated scores from popular ATS platforms:</p>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <ATSSystemCard name="Workday-style" data={analysis.ats_comparator.workday_style} />
                                                <ATSSystemCard name="Greenhouse-style" data={analysis.ats_comparator.greenhouse_style} />
                                                <ATSSystemCard name="Lever-style" data={analysis.ats_comparator.lever_style} />
                                            </div>
                                            <p className="text-xs text-gray-600 mt-4 text-center">* All scores are estimated simulations and may vary from actual ATS systems.</p>
                                        </motion.div>
                                    )}

                                    {activeTab === 'improvements' && (
                                        <motion.div 
                                            key="improvements"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            {/* Top Improvements */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                                    <Zap size={14} className="text-yellow-400" /> Top 5 Improvements
                                                </h4>
                                                <div className="space-y-2">
                                                    {analysis.top_improvements.map((imp, idx) => (
                                                        <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-gray-800">
                                                            <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                                                            <p className="text-sm text-gray-300">{imp}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Bullet Improvements */}
                                            {analysis.bullet_improvements.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-300 mb-3">Bullet Point Rewrites</h4>
                                                    <div className="space-y-4">
                                                        {analysis.bullet_improvements.slice(0, 3).map((bullet, idx) => (
                                                            <div key={idx} className="bg-white/5 rounded-xl p-4 border border-gray-800">
                                                                <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                                                                    <X size={12} /> Original
                                                                </div>
                                                                <p className="text-sm text-gray-400 mb-3 line-through">{bullet.original}</p>
                                                                <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                                                                    <CheckCircle size={12} /> Improved
                                                                </div>
                                                                <p className="text-sm text-green-300">{bullet.improved}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Enter a job description and click Analyze to get started.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-black/50 flex justify-between items-center">
                    {analysis && (
                        <Button variant="ghost" onClick={() => { setShowJdInput(true); }} className="text-gray-400">
                            Re-analyze
                        </Button>
                    )}
                    <Button onClick={onClose} className="ml-auto">Close Report</Button>
                </div>
            </motion.div>
        </div>
    );
};