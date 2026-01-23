import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PenTool, ArrowRight, X, Loader2, Briefcase, GraduationCap } from 'lucide-react';
import { Button, Input } from './UIComponents';

interface AIOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: AIParams) => Promise<void>;
}

export interface AIParams {
    jobTitle: string;
    experienceLevel: string;
    skills: string; // Comma separated
}

export const AIOnboardingModal: React.FC<AIOnboardingModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [step, setStep] = useState<'choice' | 'form' | 'generating'>('choice');
    const [formData, setFormData] = useState<AIParams>({ jobTitle: '', experienceLevel: 'Mid-Level', skills: '' });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setStep('generating');
        await onGenerate(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-900/10 to-transparent">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-purple-400" /> Resume Wizard
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 'choice' && (
                            <motion.div 
                                key="choice"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="grid md:grid-cols-2 gap-6"
                            >
                                <button 
                                    onClick={() => setStep('form')}
                                    className="group relative p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20 transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Sparkles className="text-purple-400" size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Build with AI</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Enter your target role and let our AI create a tailored resume for you in seconds.
                                    </p>
                                    <div className="flex items-center text-purple-400 text-sm font-medium">
                                        Start AI Generation <ArrowRight size={14} className="ml-1" />
                                    </div>
                                </button>

                                <button 
                                    onClick={onClose}
                                    className="group relative p-6 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-600 hover:bg-white/10 transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <PenTool className="text-gray-300" size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Build from Scratch</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Start with a clean slate and manually enter your details section by section.
                                    </p>
                                    <div className="flex items-center text-gray-300 text-sm font-medium">
                                        Start Manual Edit <ArrowRight size={14} className="ml-1" />
                                    </div>
                                </button>
                            </motion.div>
                        )}

                        {step === 'form' && (
                            <motion.div 
                                key="form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300 mb-1 block">Target Job Title</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={formData.jobTitle}
                                                onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                                                placeholder="e.g. Senior Product Designer"
                                                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-300 mb-1 block">Experience Level</label>
                                            <select 
                                                value={formData.experienceLevel}
                                                onChange={e => setFormData({...formData, experienceLevel: e.target.value})}
                                                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none appearance-none"
                                            >
                                                <option>Entry Level</option>
                                                <option>Mid-Level</option>
                                                <option>Senior</option>
                                                <option>Executive</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-300 mb-1 block">Key Skills</label>
                                            <input 
                                                type="text" 
                                                value={formData.skills}
                                                onChange={e => setFormData({...formData, skills: e.target.value})}
                                                placeholder="e.g. React, Node, Design"
                                                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="ghost" onClick={() => setStep('choice')}>Back</Button>
                                    <Button 
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" 
                                        onClick={handleSubmit}
                                        disabled={!formData.jobTitle}
                                    >
                                        <Sparkles size={16} className="mr-2" /> Generate Profile
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'generating' && (
                            <motion.div 
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center text-center space-y-4 py-8"
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto text-purple-400 animate-pulse" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Crafting your resume...</h3>
                                    <p className="text-sm text-gray-400">writing summary, skills, and experience for {formData.jobTitle}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
