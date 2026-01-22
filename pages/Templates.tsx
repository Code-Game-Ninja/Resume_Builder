import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/UIComponents';
import { Globe, Layout, Search, Sparkles, Filter, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const TemplateCard = ({ template, onUse, index }: { template: any, onUse: (id: string) => void, index: number }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.2 + (index * 0.05), ease: "power3.out" }
        );
    }, [index]);

    return (
        <div ref={cardRef} className="group relative flex flex-col bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:bg-[#1a1a1a]/60 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 cursor-pointer">
            {/* Thumbnail */}
            <div className="relative aspect-[3/4] overflow-hidden bg-[#111]">
                <img 
                    src={template.thumbnail} 
                    alt={template.name} 
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                
                {/* Floating "Use Template" Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 p-4">
                    <Button 
                        onClick={() => onUse(template.id)}
                        className="bg-white text-black hover:bg-gray-100 border-none px-6 py-2.5 rounded-full font-medium text-sm shadow-xl transform scale-95 group-hover:scale-100 transition-all duration-300 flex items-center gap-2"
                    >
                         Use Template <ChevronRight size={14} className="opacity-60" />
                    </Button>
                </div>

                {template.isCommunity && (
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-[10px] px-3 py-1.5 rounded-full uppercase font-bold tracking-wider shadow-lg">
                        Community
                    </div>
                )}
            </div>
            
            {/* Info */}
            <div className="p-5 border-t border-white/5 bg-[#1a1a1a]/30">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{template.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{template.description}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                    {template.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/5 font-medium">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Templates = () => {
    const { templates, fetchTemplates, createResume } = useStore();
    const [tab, setTab] = useState<'system' | 'community'>('system');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        templates.forEach(t => t.tags.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [templates]);

    const filteredTemplates = templates.filter(t => {
        const matchesTab = tab === 'system' ? !t.isCommunity : t.isCommunity;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag ? t.tags.includes(selectedTag) : true;
        
        return matchesTab && matchesSearch && matchesTag;
    });

    const handleUseTemplate = async (templateId: string) => {
        const id = await createResume('New Resume', templateId);
        navigate(`/editor/${id}`);
    };

    return (
        <div className="w-full min-h-screen pb-20">
            {/* --- Hero Section --- */}
            <div className="max-w-7xl mx-auto px-6 pt-24 pb-12 text-center relative">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider mb-6">
                        Professional Designs
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                        Templates that <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">get you hired.</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Curated collection of ATS-optimized layouts designed by industry experts.
                    </p>
                </motion.div>
            </div>

            {/* --- Controls Section (Sticky Glass Bar) --- */}
            <div className="sticky top-6 z-40 max-w-4xl mx-auto px-4 mb-12">
                <div className="bg-[#121212]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-4 ring-1 ring-white/5">
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* Segmented Control */}
                        <div className="flex bg-black/50 rounded-xl p-1 w-full md:w-auto shrink-0 relative overflow-hidden">
                            {/* Active Pill Indicator */}
                            <motion.div 
                                className="absolute inset-y-1 bg-[#2a2a2a] rounded-lg shadow-sm z-0"
                                layoutId="activeTab"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                style={{
                                    width: '50%',
                                    left: tab === 'system' ? '4px' : '50%' // Fallback, though layoutId handles mostly
                                }}
                            />
                            <button
                                onClick={() => setTab('system')}
                                className={cn("relative z-10 flex-1 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2", tab === 'system' ? "text-white" : "text-gray-400 hover:text-white")}
                            >
                                <Layout size={15} /> Official
                            </button>
                            <button
                                onClick={() => setTab('community')}
                                className={cn("relative z-10 flex-1 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2", tab === 'community' ? "text-white" : "text-gray-400 hover:text-white")}
                            >
                                <Globe size={15} /> Community
                            </button>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden md:block" />

                        {/* Search */}
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/30 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 text-sm py-2.5 pl-10 transition-all"
                            />
                        </div>
                    </div>
                
                    {/* Horizontal Filter Scroll */}
                    <div className="relative w-full border-t border-white/5 pt-3">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-hide mask-fade-sides">
                            <Filter size={14} className="text-gray-500 shrink-0 mr-2" />
                            <button 
                                onClick={() => setSelectedTag(null)}
                                className={cn("whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200", 
                                    selectedTag === null ? "bg-white text-black border-white" : "bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-200"
                                )}
                            >
                                All
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={cn("whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200",
                                        selectedTag === tag ? "bg-primary-500/20 text-primary-400 border-primary-500/30" : "bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-200"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Grid Section --- */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode='popLayout'>
                        {filteredTemplates.map((template, index) => (
                            <motion.div 
                                layout 
                                key={template.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <TemplateCard 
                                    template={template} 
                                    onUse={handleUseTemplate}
                                    index={index}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                
                {filteredTemplates.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-0 animate-fade-in-delayed fill-mode-forwards">
                        <div className="w-20 h-20 bg-[#1a1a1a] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/5">
                            <Search className="text-gray-600" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No templates found</h3>
                        <p className="text-gray-400 max-w-md mb-8">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <Button 
                            variant="secondary" 
                            onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                            className="bg-white/10 hover:bg-white/20 text-white border-transparent"
                        >
                            Clear View
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};