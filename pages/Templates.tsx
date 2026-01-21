import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/UIComponents';
import { Globe, Layout, Search, Sparkles, Filter } from 'lucide-react';

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
        return Array.from(tags);
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
        <div className="w-full min-h-full">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="max-w-3xl animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-primary-900/30 text-primary-400 text-xs font-bold uppercase tracking-wider border border-primary-500/20">
                                Professional Designs
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
                            Craft your story with <span className="text-primary-500">perfect templates</span>
                        </h1>
                        <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-2xl">
                            Choose from our collection of ATS-optimized layouts designed to get you hired at top companies.
                        </p>
                        
                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors"
                                placeholder="Search templates (e.g. 'Minimal', 'Creative')..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-800 pb-6">
                    {/* Tabs */}
                    <div className="flex space-x-1 bg-white/5 p-1 rounded-lg self-start">
                        <button
                            onClick={() => setTab('system')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                tab === 'system'
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Layout size={16} className="mr-2" />
                            Official
                        </button>
                        <button
                            onClick={() => setTab('community')}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                tab === 'community'
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Globe size={16} className="mr-2" />
                            Community
                        </button>
                    </div>

                    {/* Filter Tags (Scrollable on mobile) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <Filter size={16} className="text-gray-500 shrink-0 mr-1" />
                        <button 
                            onClick={() => setSelectedTag(null)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                selectedTag === null 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
                            }`}
                        >
                            All
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    selectedTag === tag
                                    ? 'bg-primary-600/20 text-primary-400 border-primary-500/50'
                                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
                    {filteredTemplates.map(template => (
                        <div key={template.id} className="group relative flex flex-col bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-primary-900/10 transition-all duration-300 hover:-translate-y-1">
                            {/* Thumbnail */}
                            <div className="aspect-[210/297] bg-gray-800 relative overflow-hidden">
                                <img 
                                    src={template.thumbnail} 
                                    alt={template.name} 
                                    className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-8 p-4">
                                    <p className="text-white text-sm font-medium mb-4 text-center line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        {template.description}
                                    </p>
                                    <Button 
                                        onClick={() => handleUseTemplate(template.id)}
                                        className="w-full shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                                    >
                                        <Sparkles size={16} className="mr-2" /> Use Template
                                    </Button>
                                </div>
                                {template.isCommunity && (
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider shadow-lg">
                                        Community
                                    </div>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="p-4 border-t border-gray-800 bg-[#151515]">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors">{template.name}</h3>
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {template.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-gray-800">
                                            {tag}
                                        </span>
                                    ))}
                                    {template.tags.length > 3 && (
                                        <span className="text-[10px] text-gray-500 px-1 py-0.5">+</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredTemplates.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
                        <p className="text-gray-400 max-w-md">
                            We couldn't find any templates matching your criteria. Try adjusting your search or filters.
                        </p>
                        <Button 
                            variant="secondary" 
                            className="mt-6"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedTag(null);
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};