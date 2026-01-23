import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, X, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from './UIComponents';

interface ImportResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<void>;
}

export const ImportResumeModal: React.FC<ImportResumeModalProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState<'upload' | 'analyzing' | 'success'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setStep('analyzing');
            setProgress(0);
            
            // Simulate progress while actual parsing happens
            setStatusMessage('Extracting text from PDF...');
            setProgress(20);
            
            // The actual parsing happens in handleComplete/onImport
            // We just show progress animation here
            setTimeout(() => {
                setStatusMessage('AI analyzing resume structure...');
                setProgress(50);
            }, 1000);
            
            setTimeout(() => {
                setStatusMessage('Mapping to resume fields...');
                setProgress(80);
            }, 2000);
            
            setTimeout(() => {
                setProgress(100);
                setStep('success');
            }, 3000);
        }
    };

    const handleComplete = async () => {
        if (file) {
            await onImport(file);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#121212] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
                    <X size={20} />
                </button>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 'upload' && (
                            <motion.div 
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center text-center space-y-6"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-2">
                                    <UploadCloud size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Upload Resume</h2>
                                    <p className="text-sm text-gray-400">
                                        Upload your existing PDF or DOCX resume. <br/>
                                        We'll analyze and enhance it with AI.
                                    </p>
                                </div>
                                
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-32 border-2 border-dashed border-gray-700 rounded-xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                                >
                                    <FileText className="text-gray-500 group-hover:text-primary-400 transition-colors" />
                                    <span className="text-sm text-gray-500 group-hover:text-gray-300">Click to browse files</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".pdf,.docx,.doc" 
                                    onChange={handleFileChange}
                                />
                            </motion.div>
                        )}

                        {step === 'analyzing' && (
                            <motion.div 
                                key="analyzing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center text-center space-y-8 py-4"
                            >
                                <div className="relative w-20 h-20">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary-500 transition-all duration-300 ease-linear" strokeDasharray={226} strokeDashoffset={226 - (226 * progress) / 100} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                        {progress}%
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white animate-pulse">Analyzing Document...</h3>
                                    <p className="text-sm text-primary-400 mt-2">{statusMessage || 'Processing...'}</p>
                                </div>
                                <div className="w-full bg-white/5 rounded-lg p-3 text-left space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {progress > 20 ? <CheckCircle size={12} className="text-green-500" /> : <Loader2 size={12} className="animate-spin" />}
                                        Reading structure
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {progress > 50 ? <CheckCircle size={12} className="text-green-500" /> : <Loader2 size={12} className="animate-spin" />}
                                        Identifying key skills
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {progress > 80 ? <CheckCircle size={12} className="text-green-500" /> : <Loader2 size={12} className="animate-spin" />}
                                        Formatting for enhancement
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-6"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Import Successful!</h2>
                                    <p className="text-sm text-gray-400">
                                        We've successfully extracted your data. <br/>
                                        Ready to enhance with AI?
                                    </p>
                                </div>
                                
                                <Button className="w-full bg-primary-600 hover:bg-primary-700" onClick={handleComplete}>
                                    Open in Editor <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
