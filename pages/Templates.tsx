import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/UIComponents';
import { Globe, Layout, Search, Sparkles, Filter, ChevronRight, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sample Resume Data for Preview ---
const SAMPLE_DATA = {
    basics: {
        name: 'John Doe',
        headline: 'Software Engineer',
        email: 'john@example.com',
        phone: '+1 234 567 890',
        location: 'San Francisco, CA',
        website: 'johndoe.com',
        summary: 'Experienced software engineer with 5+ years of expertise in building scalable web applications.'
    },
    experience: [
        { id: '1', company: 'TechCorp', position: 'Senior Developer', startDate: '2020', endDate: 'Present', description: 'Led development of core features.', location: 'Remote', visible: true },
        { id: '2', company: 'StartupXYZ', position: 'Full Stack Dev', startDate: '2018', endDate: '2020', description: 'Built microservices architecture.', location: 'NYC', visible: true }
    ],
    education: [
        { id: '1', school: 'MIT', degree: 'B.S.', field: 'Computer Science', startDate: '2014', endDate: '2018', description: '', visible: true }
    ],
    skills: [
        { id: '1', name: 'React', level: 5 },
        { id: '2', name: 'Node.js', level: 4 },
        { id: '3', name: 'TypeScript', level: 5 },
        { id: '4', name: 'Python', level: 4 }
    ],
    certificates: [],
    activities: [],
    languages: [{ id: '1', name: 'English', fluency: 'Native', visible: true }],
    projects: []
};

// --- Color Palettes ---
const COLOR_VARIANTS = [
    { name: 'Onyx', hex: '#1a1a1a', tailwind: 'bg-gray-900', text: 'text-gray-900', border: 'border-gray-900' },
    { name: 'Blue', hex: '#2563eb', tailwind: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600' },
    { name: 'Purple', hex: '#7c3aed', tailwind: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600' },
    { name: 'Teal', hex: '#0d9488', tailwind: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600' },
    { name: 'Red', hex: '#dc2626', tailwind: 'bg-red-600', text: 'text-red-600', border: 'border-red-600' },
];

// --- Mini Template Preview Component ---
const MiniTemplatePreview = ({ templateId, color }: { templateId: string, color: typeof COLOR_VARIANTS[0] }) => {
    // Dynamic styles based on passed color directly where possible, or fallback to class names
    // We use inline styles for colors to be exact 
    const styles: Record<string, any> = {
        onyx: {
            container: "bg-white p-3",
            header: "border-b pb-2 mb-2",
            name: "text-[10px] font-bold uppercase tracking-tight",
            headline: "text-[6px] text-gray-500",
            sectionTitle: "text-[5px] font-bold uppercase border-b pb-0.5 mb-1",
            layout: "single",
            dynamic: {
                headerBorder: { borderColor: color.hex },
                name: { color: color.hex },
                sectionTitle: { color: color.hex, borderColor: `${color.hex}33` } // 20% opacity for border
            }
        },
        azurill: {
            container: "bg-white flex h-full",
            sidebar: "w-[35%] bg-slate-100 p-2",
            main: "flex-1 p-2",
            name: "text-[9px] font-bold",
            headline: "text-[5px]",
            sectionTitle: "text-[5px] font-bold uppercase mb-1 border-b pb-0.5",
            layout: "two-left",
            dynamic: {
                sidebarTitle: { color: color.hex, borderColor: `${color.hex}40` },
                name: { color: '#0f172a' },
                headline: { color: color.hex },
                mainTitle: { color: color.hex, borderColor: `${color.hex}40` }
            }
        },
        bronzor: {
            container: "bg-[#fdfbf7] text-[#2c2420] p-3",
            header: "text-center border-b border-double pb-2 mb-2",
            name: "text-[10px] font-serif font-bold",
            headline: "text-[6px] italic",
            sectionTitle: "text-center text-[5px] font-bold uppercase mb-1",
            layout: "single",
            dynamic: {
                headerBorder: { borderColor: color.hex },
                name: { color: '#2c2420' },
                headline: { color: color.hex },
                sectionTitle: { color: '#2c2420' }
            }
        },
        chikorita: {
            container: "bg-white flex h-full",
            sidebar: "w-[30%] p-2 order-2",
            main: "flex-1 p-2 order-1",
            name: "text-[9px] font-bold",
            headline: "text-[5px]",
            sectionTitle: "text-[5px] font-bold uppercase mb-1",
            layout: "two-right",
            dynamic: {
                sidebar: { backgroundColor: `${color.hex}15` }, // Very light tint
                name: { color: color.hex },
                headline: { color: color.hex },
                sectionTitle: { color: color.hex }
            }
        },
        ditto: {
            container: "bg-white text-black p-0",
            header: "p-2 mb-2",
            name: "text-[10px] font-bold text-white",
            headline: "text-[5px] text-gray-200",
            sectionTitle: "text-[5px] font-black uppercase mb-1 border-b-2 inline-block",
            layout: "single",
            dynamic: {
                header: { backgroundColor: color.hex },
                sectionTitle: { borderColor: color.hex }
            }
        },
        gengar: {
            container: "bg-white flex h-full",
            sidebar: "w-[35%] p-2 text-white",
            main: "flex-1 p-2 text-gray-800",
            name: "text-[9px] font-bold",
            headline: "text-[5px]",
            sectionTitle: "text-[5px] font-bold uppercase mb-1 border-b pb-0.5",
            layout: "two-left",
            dynamic: {
                sidebar: { backgroundColor: color.hex },
                name: { color: '#ffffff' },
                headline: { color: `${color.hex}30` }, // Very light for contrast? No, needs to be visible.
                sidebarTitle: { color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' },
                mainTitle: { color: color.hex, borderColor: color.hex }
            }
        },
        glalie: {
            container: "bg-white text-gray-800 p-2 font-mono",
            header: "bg-gray-50 p-2 mb-2 border-b border-gray-200",
            name: "text-[9px] font-bold text-black",
            headline: "text-[5px] text-gray-500",
            sectionTitle: "text-[5px] font-bold bg-gray-100 p-0.5 mb-1 border-l-2",
            layout: "single",
            dynamic: {
                sectionTitle: { borderLeftColor: color.hex }
            }
        },
        kakuna: {
            container: "bg-white text-gray-900 border-l-4 p-2",
            header: "pb-2 mb-2",
            name: "text-[10px] font-extrabold tracking-tighter",
            headline: "text-[5px]",
            sectionTitle: "text-[5px] font-bold px-1 py-0.5 inline-block mb-1",
            layout: "single",
            dynamic: {
                container: { borderColor: color.hex },
                headline: { color: color.hex },
                sectionTitle: { backgroundColor: `${color.hex}20` }
            }
        },
        lapras: {
            container: "bg-white text-slate-800 p-3 font-serif",
            header: "text-center pb-2 mb-2",
            name: "text-[10px] text-slate-900 tracking-wide",
            headline: "text-[5px] italic",
            sectionTitle: "text-center text-[5px] font-bold uppercase tracking-wider mb-1",
            layout: "single",
            dynamic: {
                headline: { color: color.hex },
                sectionTitle: { color: color.hex }
            }
        },
        leafish: {
            container: "bg-white flex h-full",
            sidebar: "w-[30%] p-2 text-white",
            main: "flex-1 p-2 text-gray-800",
            name: "text-[8px] font-bold text-green-100",
            headline: "text-[5px] text-green-300",
            sectionTitle: "text-[5px] font-bold uppercase mb-1",
            layout: "two-left",
            dynamic: {
                sidebar: { backgroundColor: color.hex },
                sidebarTitle: { color: 'rgba(255,255,255,0.8)' },
                mainTitle: { color: color.hex }
            }
        }
    };

    const t = styles[templateId] || styles.onyx;
    const d = SAMPLE_DATA;
    const dy = t.dynamic || {};

    // Single column layout
    if (t.layout === 'single') {
        return (
            <div className={cn("w-full h-full text-[color:var(--text-color)]", t.container)} style={dy.container}>
                <div className={t.header} style={dy.headerBorder || dy.header}>
                    <div className={t.name} style={dy.name}>{d.basics.name}</div>
                    <div className={t.headline} style={dy.headline}>{d.basics.headline}</div>
                    <div className="flex gap-1 mt-1 text-[4px] text-gray-400">
                        <span>{d.basics.email}</span>
                        <span>•</span>
                        <span>{d.basics.phone}</span>
                    </div>
                </div>
                <div className="px-1">
                    <div className={t.sectionTitle} style={dy.sectionTitle}>Summary</div>
                    <p className="text-[4px] leading-tight mb-2 line-clamp-2">{d.basics.summary}</p>
                    
                    <div className={t.sectionTitle} style={dy.sectionTitle}>Experience</div>
                    {d.experience.slice(0, 1).map(exp => (
                        <div key={exp.id} className="mb-1">
                            <div className="text-[5px] font-bold">{exp.position}</div>
                            <div className="text-[4px] opacity-70">{exp.company} • {exp.startDate}</div>
                        </div>
                    ))}
                    
                    <div className={t.sectionTitle} style={dy.sectionTitle}>Skills</div>
                    <div className="flex flex-wrap gap-0.5">
                        {d.skills.slice(0, 3).map(skill => (
                            <span key={skill.id} className="text-[4px] bg-gray-100 px-1 py-0.5 rounded" style={{ color: color.hex === '#1a1a1a' ? '#000' : color.hex, backgroundColor: `${color.hex}10` }}>{skill.name}</span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Two-column layouts
    return (
        <div className={cn("w-full h-full", t.container)} style={dy.container}>
            <div className={t.sidebar} style={dy.sidebar}>
                <div className={t.name} style={dy.name}>{d.basics.name}</div>
                <div className={t.headline} style={dy.headline}>{d.basics.headline}</div>
                <div className="mt-2">
                    <div className={t.sectionTitle} style={dy.sidebarTitle || dy.sectionTitle}>Contact</div>
                    <div className="text-[4px] space-y-0.5">
                        <div>{d.basics.email}</div>
                        <div>{d.basics.phone}</div>
                    </div>
                </div>
                <div className="mt-2">
                    <div className={t.sectionTitle} style={dy.sidebarTitle || dy.sectionTitle}>Skills</div>
                    <div className="space-y-0.5">
                        {d.skills.slice(0, 3).map(skill => (
                            <div key={skill.id} className="text-[4px]">{skill.name}</div>
                        ))}
                    </div>
                </div>
            </div>
            <div className={t.main}>
                <div className={t.sectionTitle} style={dy.mainTitle || dy.sectionTitle}>Summary</div>
                <p className="text-[4px] leading-tight mb-2 line-clamp-2">{d.basics.summary}</p>
                
                <div className={t.sectionTitle} style={dy.mainTitle || dy.sectionTitle}>Experience</div>
                {d.experience.slice(0, 2).map(exp => (
                    <div key={exp.id} className="mb-1">
                        <div className="text-[5px] font-bold">{exp.position}</div>
                        <div className="text-[4px] opacity-70">{exp.company}</div>
                    </div>
                ))}
                
                <div className={t.sectionTitle} style={dy.mainTitle || dy.sectionTitle}>Education</div>
                <div className="text-[5px] font-bold">{d.education[0].school}</div>
                <div className="text-[4px] opacity-70">{d.education[0].degree} {d.education[0].field}</div>
            </div>
        </div>
    );
};

// --- Components ---

const TemplateCard = ({ template, onUse, index }: { template: any, onUse: (id: string, color?: string) => void, index: number }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [selectedColor, setSelectedColor] = useState(COLOR_VARIANTS[0]);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 30, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.2 + (index * 0.05), ease: "power3.out" }
        );
    }, [index]);

    return (
        <div 
            ref={cardRef} 
            className="group relative flex flex-col bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:bg-[#1a1a1a]/60 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Live Template Preview */}
            <div className="relative aspect-[3/4] overflow-hidden bg-white cursor-pointer" onClick={() => onUse(template.id, selectedColor.hex)}>
                <MiniTemplatePreview templateId={template.id} color={selectedColor} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Floating "Use Template" Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 p-4 pointer-events-none">
                    <Button 
                        onClick={(e) => { e.stopPropagation(); onUse(template.id, selectedColor.hex); }}
                        className="bg-white text-black hover:bg-gray-100 border-none px-6 py-2.5 rounded-full font-medium text-sm shadow-xl transform scale-95 group-hover:scale-100 transition-all duration-300 flex items-center gap-2 pointer-events-auto"
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
            
            {/* Info & Controls */}
            <div className="p-5 border-t border-white/5 bg-[#1a1a1a]/30">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{template.name}</h3>
                        {template.isCommunity && template.author && (
                             <p className="text-xs text-primary-400 mt-0.5 flex items-center gap-1.5 font-medium">
                                 <User size={12} /> {template.author}
                             </p>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{template.description}</p>
                    </div>
                </div>
                
                {/* Color Selection - Always visible or on hover? Always visible is better productivity */}
                <div className="flex items-center gap-2 mt-2">
                    {COLOR_VARIANTS.map((c) => (
                        <button
                            key={c.name}
                            onClick={(e) => { e.stopPropagation(); setSelectedColor(c); }}
                            className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all duration-200", 
                                c.tailwind,
                                selectedColor.name === c.name ? "border-white scale-110 shadow-lg ring-2 ring-white/20" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                            )}
                            title={c.name}
                        />
                    ))}
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

    const handleUseTemplate = async (templateId: string, color?: string) => {
        const id = await createResume('New Resume', templateId, color);
        navigate(`/editor/${id}?onboarding=true`);
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
                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider mb-6 hover:bg-primary-500/20 transition-colors cursor-default">
                        Premium Collection
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                        Choose your <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 animate-gradient-x">Success Story.</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Stand out with professionally designed, ATS-optimized templates. <br/>
                        Select a style, pick a color, and get hired.
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