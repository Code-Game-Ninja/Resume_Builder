import React from 'react';
import { useStore } from '../store';
import { X, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Search } from 'lucide-react';
import { Button } from './UIComponents';

interface ATSModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ATSModal: React.FC<ATSModalProps> = ({ isOpen, onClose }) => {
    const { atsAnalysis, isLoading } = useStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Search className="text-primary-500" /> ATS Analyzer
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400">Scanning your resume against industry standards...</p>
                        </div>
                    ) : atsAnalysis ? (
                        <div className="space-y-8">
                            {/* Score Section */}
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-white/5 p-6 rounded-xl border border-gray-800">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="#333" strokeWidth="12" />
                                        <circle 
                                            cx="64" cy="64" r="56" fill="transparent" stroke={atsAnalysis.score > 80 ? '#22c55e' : atsAnalysis.score > 60 ? '#eab308' : '#ef4444'} strokeWidth="12" 
                                            strokeDasharray={351} 
                                            strokeDashoffset={351 - (351 * atsAnalysis.score) / 100}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-3xl font-bold text-white">{atsAnalysis.score}</span>
                                        <span className="text-xs text-gray-500 uppercase">Score</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-lg font-semibold text-white">{atsAnalysis.summary}</h3>
                                    
                                    {/* Market Comparison */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Your Score</span>
                                            <span className="text-white font-medium">{atsAnalysis.score}/100</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Market Average</span>
                                            <span className="text-gray-300 font-medium">{atsAnalysis.marketAverage}/100</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
                                            <div className="h-full bg-primary-600 relative" style={{ width: `${atsAnalysis.score}%` }}></div>
                                            <div className="h-4 w-1 bg-white absolute top-0" style={{ left: `${atsAnalysis.marketAverage}%`, opacity: 0.5 }} title="Market Average"></div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-primary-400">
                                            <TrendingUp size={12} />
                                            <span>{atsAnalysis.score >= atsAnalysis.marketAverage ? 'You are above market average!' : 'Below market average. Improve to compete.'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Issues List */}
                            <div>
                                <h4 className="font-semibold text-white mb-4">Improvements Needed</h4>
                                <div className="space-y-3">
                                    {atsAnalysis.issues.map((issue, idx) => (
                                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                                            issue.severity === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                                            issue.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' :
                                            'bg-blue-500/10 border-blue-500/20 text-blue-200'
                                        }`}>
                                            {issue.severity === 'high' ? <AlertCircle className="shrink-0 text-red-500" size={18} /> : 
                                             issue.severity === 'medium' ? <AlertTriangle className="shrink-0 text-yellow-500" size={18} /> :
                                             <CheckCircle className="shrink-0 text-blue-500" size={18} />}
                                            <span className="text-sm">{issue.message}</span>
                                        </div>
                                    ))}
                                    {atsAnalysis.issues.length === 0 && (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 flex items-center gap-2">
                                            <CheckCircle size={18} /> No critical issues found. Great job!
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Keywords */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-400 text-sm uppercase mb-3">Keywords Found</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {atsAnalysis.keywordsFound.map(k => (
                                            <span key={k} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-md border border-green-500/20">{k}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-400 text-sm uppercase mb-3">Missing Keywords (Suggested)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {atsAnalysis.missingKeywords.map(k => (
                                            <span key={k} className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md border border-gray-700">{k}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-10 text-gray-500">Analysis failed. Please try again.</div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex justify-end">
                    <Button onClick={onClose}>Close Report</Button>
                </div>
            </div>
        </div>
    );
};