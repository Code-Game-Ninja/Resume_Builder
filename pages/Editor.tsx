import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { resumeService, storageService } from '../services/firebase';
import { Button, Input } from '../components/UIComponents';
import { ATSModal } from '../components/ATSModal';
import { AIOnboardingModal, AIParams } from '../components/AIOnboardingModal';
import { Reorder, useDragControls } from 'framer-motion';
import { 
  ArrowLeft, Save, Download, Share2, 
  User, Briefcase, GraduationCap, Wrench, FileText, ChevronDown, Plus, Trash2, GripVertical,
  CheckCircle, Globe, MapPin, Phone, Mail, Link as LinkIcon, Sparkles, Loader2, Wand2, Camera, Layout, Award, Heart, FolderGit2
} from 'lucide-react';
import { SectionType, Resume, ExperienceItem, EducationItem, CertificateItem, ActivityItem, LanguageItem, ProjectItem } from '../types';
import { cn } from '../components/UIComponents';

declare const html2pdf: any;

// --- Helper Components for Editor ---

const SectionItem: React.FC<{ title: string; subtitle?: string; dates?: string; onDelete: () => void; onClick: () => void }> = ({ 
    title, subtitle, dates, onDelete, onClick 
}) => (
    <div className="group flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-transparent hover:border-gray-700 cursor-pointer transition-all">
        <GripVertical className="text-gray-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
        <div className="flex-1 min-w-0" onClick={onClick}>
            <h4 className="font-medium text-white truncate">{title || '(Untitled)'}</h4>
            {(subtitle || dates) && (
                <div className="text-xs text-gray-400 truncate">
                    {subtitle} {subtitle && dates && '•'} {dates}
                </div>
            )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={16} />
        </button>
    </div>
);

// --- Editor Form Components ---
const BasicsEditor = ({ data, onChange, onPhotoUpload, uploadingPhoto, showPhoto = true }: { 
    data: any, 
    onChange: (e: any) => void,
    onPhotoUpload: (file: File) => Promise<void>,
    uploadingPhoto: boolean,
    showPhoto?: boolean
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onPhotoUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    return (
        <div className="space-y-4 animate-slide-up">
            <div className="flex gap-4">
                {showPhoto && (
                    <>
                        <div 
                            className="h-24 w-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center shrink-0 cursor-pointer hover:border-primary-500 transition-colors overflow-hidden relative group"
                            onClick={handlePhotoClick}
                        >
                            {data.photo ? (
                                <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-gray-500" />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploadingPhoto ? (
                                    <Loader2 size={20} className="text-white animate-spin" />
                                ) : (
                                    <Camera size={20} className="text-white" />
                                )}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                        />
                    </>
                )}
                <div className="flex-1 space-y-4">
                    <Input label="Full Name" name="name" value={data.name} onChange={onChange} />
                    <Input label="Headline" name="headline" value={data.headline} onChange={onChange} />
                </div>
            </div>
            <p className="text-xs text-gray-500">Click the photo to upload (JPG, PNG, WebP - max 2MB)</p>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Email" name="email" value={data.email} onChange={onChange} />
                <Input label="Phone" name="phone" value={data.phone} onChange={onChange} />
            </div>
            <Input label="Location" name="location" value={data.location} onChange={onChange} />
            <Input label="Website" name="website" value={data.website} onChange={onChange} />
        </div>
    );
};

const ListSectionEditor = <T extends { id: string }>({ 
    items, 
    renderItem, 
    renderEditor, 
    onAdd, 
    onDelete, 
    onUpdate,
    onGenerateAI
}: { 
    items: T[], 
    renderItem: (item: T) => { title: string, subtitle?: string, dates?: string },
    renderEditor: (item: T, onChange: (field: string, val: any) => void) => React.ReactNode,
    onAdd: () => void,
    onDelete: (id: string) => void,
    onUpdate: (id: string, data: T) => void,
    onGenerateAI?: (id: string) => Promise<void>
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    const activeItem = items.find(i => i.id === editingId);

    if (activeItem) {
        return (
            <div className="animate-slide-up">
                <button onClick={() => setEditingId(null)} className="flex items-center text-sm text-gray-400 hover:text-white mb-4">
                    <ArrowLeft size={14} className="mr-1" /> Back to list
                </button>
                {renderEditor(activeItem, (field, val) => onUpdate(activeItem.id, { ...activeItem, [field]: val }))}
                <div className="flex gap-2 mt-6">
                    {onGenerateAI && (
                        <Button 
                            variant="secondary" 
                            className="flex-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
                            onClick={async () => {
                                setGenerating(true);
                                await onGenerateAI(activeItem.id);
                                setGenerating(false);
                            }}
                            disabled={generating}
                        >
                            {generating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
                            {generating ? 'Generating...' : 'AI Generate'}
                        </Button>
                    )}
                    <Button className="flex-1" onClick={() => setEditingId(null)}>Done</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-slide-up">
            {items.map(item => {
                const info = renderItem(item);
                return (
                    <SectionItem 
                        key={item.id}
                        title={info.title}
                        subtitle={info.subtitle}
                        dates={info.dates}
                        onDelete={() => onDelete(item.id)}
                        onClick={() => setEditingId(item.id)}
                    />
                );
            })}
            <Button variant="outline" className="w-full border-dashed" onClick={() => {
                onAdd();
            }}>
                <Plus size={16} className="mr-2" /> Add Item
            </Button>
        </div>
    );
};

// --- PREVIEW RENDERERS ---

const DraggableSection = ({ 
    item, 
    children, 
    isDraggable = true 
}: { 
    item: string, 
    children: React.ReactNode, 
    isDraggable?: boolean,
    key?: string
}) => {
    const controls = useDragControls();

    if (!isDraggable) return <>{children}</>;

    return (
        <Reorder.Item value={item} dragListener={false} dragControls={controls} className="relative group/drag">
            <div className="absolute -left-6 top-0 bottom-0 flex items-center justify-center opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-50">
                <div 
                    className="p-1.5 rounded-md bg-gray-200/50 hover:bg-gray-300 text-gray-500 backdrop-blur-sm"
                    onPointerDown={(e) => controls.start(e)}
                >
                    <GripVertical size={14} />
                </div>
            </div>
            {children}
        </Reorder.Item>
    );
};

// A utility to render contact icons safely
const ContactLine = ({ icon: Icon, value }: { icon: any, value: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-1.5 text-inherit">
            <Icon size={12} className="shrink-0 opacity-70" />
            <span>{value}</span>
        </div>
    );
};

const DocumentPreview = ({ 
    data, 
    template, 
    layout, 
    colors,
    font,
    onReorder,
    compactMode = false
}: { 
    data: Resume['data'], 
    template: string,
    layout?: { main: SectionType[], sidebar: SectionType[] },
    colors: { primary: string, text: string, background: string },
    font?: string,
    onReorder: (main: SectionType[], sidebar: SectionType[]) => void,
    compactMode?: boolean
}) => {
    
    // Default layouts if none provided
    const defaultLayout = {
        main: ['summary', 'experience', 'education', 'skills', 'certificates', 'activities', 'languages', 'projects'] as SectionType[],
        sidebar: [] as SectionType[]
    };

    const twoColumnLeftDefault = {
        main: ['summary', 'experience', 'projects', 'certificates'] as SectionType[],
        sidebar: ['education', 'skills', 'languages', 'activities'] as SectionType[]
    };

    const twoColumnRightDefault = {
        main: ['summary', 'experience', 'projects', 'certificates'] as SectionType[],
        sidebar: ['skills', 'education', 'languages', 'activities'] as SectionType[]
    };

    // --- Styles Definitions ---
    const styles = {
        // ONYX: Minimal, standard, highly readable
        onyx: {
            container: "font-sans bg-white text-gray-900",
            header: "border-b-2 border-[var(--primary)] pb-6 mb-6",
            name: "text-4xl font-bold uppercase tracking-tight text-[var(--primary)]",
            headline: "text-xl text-gray-600 mt-1 font-light",
            sectionTitle: "text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-1 mb-4 text-[var(--primary)] opacity-80",
            contactRow: "flex flex-wrap gap-4 mt-4 text-sm text-gray-600",
            layout: "single"
        },
        // AZURILL: Two column, left sidebar blue
        azurill: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[32%] bg-slate-50 p-8 h-full border-r border-slate-200 text-slate-700 pt-12",
            main: "flex-1 p-8 pt-12 text-slate-800",
            name: "text-3xl font-bold text-slate-900 leading-tight mb-2",
            headline: "text-lg text-[var(--primary)] font-medium mb-6",
            sectionTitleSidebar: "text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 mt-8 border-b-2 border-[var(--primary)] pb-1",
            sectionTitleMain: "text-xl font-bold text-[var(--primary)] mb-4 flex items-center gap-2",
            layout: "two-left"
        },
        // BRONZOR: Serif, classic, warm background
        bronzor: {
            container: "font-serif bg-[#fdfbf7] text-[#2c2420]",
            header: "text-center border-b border-double border-[var(--primary)] pb-6 mb-8",
            name: "text-4xl font-serif font-bold text-[#4a3b32]",
            headline: "text-lg italic text-[var(--primary)] mt-2",
            sectionTitle: "text-center text-lg font-bold uppercase tracking-widest text-[#4a3b32] mb-6 border-b border-[#e5e0d8] pb-2",
            contactRow: "flex justify-center gap-6 mt-4 text-sm text-[#5d4d44]",
            layout: "single"
        },
        // GENGAR: Modern, dark sidebar, high contrast
        gengar: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[35%] bg-[var(--primary)] text-white p-8 h-full pt-16",
            main: "flex-1 p-10 pt-16 text-gray-800",
            name: "text-3xl font-bold text-white mb-2",
            headline: "text-white/80 text-lg mb-8",
            sectionTitleSidebar: "text-sm font-bold uppercase tracking-wider text-white/90 mb-4 mt-8 border-b border-white/20 pb-1",
            sectionTitleMain: "text-2xl font-bold text-[var(--primary)] mb-6 border-l-4 border-[var(--primary)] pl-3 uppercase tracking-tight",
            layout: "two-left"
        },
        // GLALIE: Technical, mono-styled, code-like
        glalie: {
            container: "font-mono text-sm bg-white text-gray-800",
            header: "mb-8 p-6 bg-gray-50 border-b border-gray-200",
            name: "text-2xl font-bold text-black",
            headline: "text-[var(--primary)] font-medium",
            sectionTitle: "text-sm font-bold bg-gray-100 p-1 pl-2 mb-4 border-l-4 border-[var(--primary)]",
            contactRow: "grid grid-cols-2 gap-2 mt-4 text-xs",
            layout: "single"
        },
        // KAKUNA: Robust, thick borders, yellow/orange accents
        kakuna: {
            container: "font-sans bg-white text-gray-900 border-l-[12px] border-[var(--primary)]",
            header: "pl-8 pt-8 pb-8 mb-4 border-b border-gray-100",
            name: "text-5xl font-extrabold tracking-tighter text-gray-900",
            headline: "text-xl font-medium text-[var(--primary)] mt-2",
            sectionTitle: "text-xl font-bold text-gray-900 mb-4 mt-6 inline-block bg-[var(--primary-light)] px-3 py-1 -rotate-1", // Will need --primary-light
            contactRow: "flex flex-col gap-1 mt-4 text-sm font-medium text-gray-500",
            layout: "single"
        },
        // CHIKORITA: Two col right, fresh green
        chikorita: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[30%] bg-[var(--primary-light)] p-6 h-full border-l border-[var(--primary)]/20 text-gray-900 pt-10 order-2",
            main: "flex-1 p-8 pt-10 text-gray-800 order-1",
            name: "text-3xl font-bold text-[var(--primary)]",
            headline: "text-lg text-[var(--primary)] opacity-80 mb-6",
            sectionTitleSidebar: "text-xs font-bold uppercase text-[var(--primary)] mb-3 mt-6",
            sectionTitleMain: "text-lg font-bold text-gray-900 mb-4 border-b border-[var(--primary)]/30 pb-2",
            layout: "two-right"
        },
        // DITTO: Bold, grid-like, boxy
        ditto: {
            container: "font-sans bg-white text-black",
            header: "bg-[var(--primary)] text-white p-8 mb-8",
            name: "text-4xl font-bold",
            headline: "text-white/80 text-lg",
            sectionTitle: "text-xl font-black uppercase mb-4 border-b-4 border-[var(--primary)] inline-block",
            contactRow: "flex flex-wrap gap-6 mt-4 text-sm text-white/70",
            layout: "single"
        },
        // LAPRAS: Elegant, centered, blue serif
        lapras: {
            container: "font-serif bg-white text-slate-800",
            header: "text-center pb-8 mb-8",
            name: "text-4xl text-slate-900 tracking-wide",
            headline: "text-lg text-[var(--primary)] italic mt-2",
            sectionTitle: "text-center text-sm font-bold uppercase tracking-[0.2em] text-[var(--primary)] mb-6 mt-8",
            contactRow: "flex justify-center gap-4 mt-6 text-sm text-slate-500 font-sans",
            layout: "single"
        },
        // LEAFISH: Organic, left sidebar green
        leafish: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[28%] bg-[var(--primary)] text-white p-6 h-full pt-10",
            main: "flex-1 p-8 pt-10 text-gray-800",
            name: "text-2xl font-bold text-white mb-1",
            headline: "text-sm text-white/80 mb-6",
            sectionTitleSidebar: "text-xs font-bold uppercase tracking-widest text-white/90 mb-3 mt-8",
            sectionTitleMain: "text-xl text-[var(--primary)] mb-4 font-light border-b border-[var(--primary)]/20 pb-2 uppercase tracking-wide",
            layout: "two-left"
        },
        // PIKACHU: Friendly, energetic, yellow accents
        pikachu: {
            container: "font-sans bg-[#fffbea] text-gray-800",
            header: "p-8 pb-4 border-b-4 border-[var(--primary)]",
            name: "text-4xl font-extrabold text-[var(--primary)] tracking-tight",
            headline: "text-lg font-medium text-gray-600 mt-1",
            sectionTitle: "text-lg font-bold text-gray-900 mb-4 border-l-4 border-[var(--primary)] pl-3",
            contactRow: "flex flex-wrap gap-4 mt-4 text-sm font-medium text-gray-500",
            layout: "single"
        },
        // MEWTWO: Futuristic, minimal, purple
        mewtwo: {
            container: "font-sans bg-white text-gray-900",
            header: "text-center pt-10 pb-6",
            name: "text-5xl font-thin tracking-[0.1em] text-[var(--primary)] uppercase",
            headline: "text-sm tracking-[0.2em] text-gray-400 mt-2 uppercase",
            sectionTitle: "text-center text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 mt-8 relative after:content-[''] after:block after:w-8 after:h-0.5 after:bg-[var(--primary)] after:mx-auto after:mt-2",
            contactRow: "flex justify-center gap-6 mt-6 text-xs tracking-widest text-gray-400 uppercase",
            layout: "single"
        },
        // EEVEE: Adaptable, natural, soft
        eevee: {
            container: "font-serif bg-[#fdfdfd] text-gray-800 flex h-full",
            sidebar: "w-[30%] bg-[#f5f5f0] p-8 h-full pt-12 border-r border-[#e0e0e0]",
            main: "flex-1 p-10 pt-12",
            name: "text-3xl font-bold text-[#5d5a56] mb-1 font-sans",
            headline: "text-base italic text-[var(--primary)] mb-6",
            sectionTitleSidebar: "text-sm font-bold uppercase text-[#8a8580] mb-4 mt-8",
            sectionTitleMain: "text-xl font-medium text-[#5d5a56] mb-4 border-b border-[#e0e0e0] pb-2 font-sans",
            layout: "two-left"
        },
        // CHARIZARD: Bold, executive, strong
        charizard: {
            container: "font-sans bg-white text-black",
            header: "bg-gray-900 text-white p-10 mb-8 border-b-4 border-[var(--primary)]",
            name: "text-5xl font-black uppercase tracking-tighter",
            headline: "text-xl font-light text-[var(--primary)] mt-2",
            sectionTitle: "text-2xl font-black uppercase text-gray-900 mb-4 border-b-2 border-black pb-1",
            contactRow: "flex flex-wrap gap-6 mt-6 text-sm text-gray-400",
            layout: "single"
        },
        // SQUIRTLE: Cool, structured, blue
        squirtle: {
            container: "font-sans bg-white text-slate-800 flex h-full",
            sidebar: "w-[26%] bg-[var(--primary)] text-white p-6 h-full order-2",
            main: "flex-1 p-8 pt-10 order-1",
            name: "text-3xl font-bold text-slate-900",
            headline: "text-lg text-slate-500 font-medium mb-8",
            sectionTitleSidebar: "text-xs font-bold uppercase tracking-wider text-white/50 mb-3 mt-8 border-b border-white/20 pb-1",
            sectionTitleMain: "text-xl font-bold text-[var(--primary)] mb-4 uppercase tracking-tight flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-200",
            layout: "two-right"
        },
        // BULBASAUR: Organic, fresh, green
        bulbasaur: {
            container: "font-sans bg-[#faffe6] text-green-900 flex h-full",
            sidebar: "w-[33%] bg-[#e6fffa] p-8 h-full border-r border-green-100/50 pt-10",
            main: "flex-1 p-8 pt-10",
            name: "text-3xl font-bold text-[var(--primary)] mb-1",
            headline: "text-base text-green-700/80 mb-6 font-medium",
            sectionTitleSidebar: "text-sm font-bold uppercase text-teal-700 mb-3 mt-6 bg-teal-100/50 inline-block px-2 py-1 rounded",
            sectionTitleMain: "text-xl font-bold text-[var(--primary)] mb-4 border-b-2 border-[var(--primary)]/20 pb-2 inline-block pr-8",
            layout: "two-left"
        }
    };

    const t: any = styles[template as keyof typeof styles] || styles.onyx;

    // Determine current layout based on type and stored preference
    let activeMain = layout?.main || [];
    let activeSidebar = layout?.sidebar || [];

    // Fallback if no layout stored
    if (activeMain.length === 0 && activeSidebar.length === 0) {
        if (t.layout === 'single') {
            activeMain = defaultLayout.main;
        } else if (t.layout === 'two-left') {
            activeMain = twoColumnLeftDefault.main;
            activeSidebar = twoColumnLeftDefault.sidebar;
        } else if (t.layout === 'two-right') {
            activeMain = twoColumnRightDefault.main;
            activeSidebar = twoColumnRightDefault.sidebar;
        }
    }

    // MIGRATION: Ensure new sections are present in old layouts
    const requiredSections: SectionType[] = ['activities', 'languages', 'projects', 'certificates'];
    const existingSections = new Set([...activeMain, ...activeSidebar]);
    const missingSections = requiredSections.filter(s => !existingSections.has(s));
    
    if (missingSections.length > 0) {
        // Add missing sections to appropriate column
        if (t.layout === 'single' || activeSidebar.length === 0) {
            // Single column: add to main
            activeMain = [...activeMain, ...missingSections];
        } else {
            // Two-column: add to sidebar
            activeSidebar = [...activeSidebar, ...missingSections];
        }
    }

    // --- Content Renderers ---

    const ContactDetails = ({ className }: { className?: string }) => (
        <div className={cn(t.contactRow, className)}>
            <ContactLine icon={Mail} value={data.basics.email} />
            <ContactLine icon={Phone} value={data.basics.phone} />
            <ContactLine icon={MapPin} value={data.basics.location} />
            <ContactLine icon={LinkIcon} value={data.basics.website} />
        </div>
    );

    const SkillsList = ({ vertical = false }: { vertical?: boolean }) => (
        <div className={cn("flex flex-wrap gap-2", vertical && "flex-col gap-1 items-start")}>
            {data.skills.map(skill => (
                <span key={skill.id} className={cn(
                    "text-sm",
                    template === 'glalie' ? "font-mono" : "",
                    template === 'kakuna' ? "bg-[var(--primary-light)] px-2 py-0.5 rounded border border-[var(--primary)] text-gray-900" : "",
                    template === 'gengar' ? "text-white/90 bg-white/10 px-2 py-1 rounded" : "",
                    template === 'leafish' ? "text-white/90 bg-white/10 px-2 py-1 rounded" : "",
                    !['kakuna', 'gengar', 'leafish'].includes(template) && "bg-gray-100 px-2 py-1 rounded text-gray-700"
                )} style={!['kakuna', 'gengar', 'leafish'].includes(template) ? { color: 'var(--text)', backgroundColor: 'color-mix(in srgb, var(--primary), white 90%)' } : {}}>
                    {skill.name} {skill.level > 3 && '★'}
                </span>
            ))}
        </div>
    );

    const EducationList = () => (
        <div className={compactMode ? "space-y-2" : "space-y-4"}>
            {data.education.filter(e => e.visible).map(edu => (
                <div key={edu.id}>
                    <div className={cn("font-bold", template === 'gengar' ? "text-white" : "text-gray-900")}>
                        {edu.school}
                    </div>
                    <div className={cn("text-sm", template === 'gengar' ? "text-purple-200" : "text-gray-600")}>
                        {edu.degree} in {edu.field}
                    </div>
                    <div className={cn("text-xs mt-0.5", template === 'gengar' ? "text-purple-300" : "text-gray-400")}>
                        {edu.startDate} - {edu.endDate}
                    </div>
                </div>
            ))}
        </div>
    );

    const ExperienceList = () => {
        return (
            <div className={compactMode ? "space-y-4" : "space-y-6"}>
                {data.experience.filter(e => e.visible).map(exp => (
                    <div key={exp.id}>
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-md">{exp.position}</h4>
                            <span className="text-sm opacity-70 whitespace-nowrap">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <div className={cn("text-sm font-semibold opacity-80 flex items-center gap-2", compactMode ? "mb-1" : "mb-2")}>
                            {exp.company} 
                            {exp.location && <span className="text-xs font-normal opacity-60">• {exp.location}</span>}
                        </div>
                        <p className={cn("text-sm opacity-90 leading-relaxed whitespace-pre-wrap", compactMode && "leading-normal")}>{exp.description}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderSection = (type: SectionType, region: 'main' | 'sidebar' = 'main') => {
        const titleStyle = region === 'sidebar' && t.sectionTitleSidebar ? t.sectionTitleSidebar : (region === 'main' && t.sectionTitleMain ? t.sectionTitleMain : t.sectionTitle);
        
        const mbSection = compactMode ? "mb-3" : "mb-6";
        const mbSectionSidebar = compactMode ? "mb-4" : "mb-8";

        switch(type) {
            case 'summary':
                if (!data.basics.summary) return null;
                const summaryTitle = region === 'sidebar' ? 'Profile' : (template === 'azurill' || template === 'chikorita' ? 'Professional Summary' : 'Profile');
                return (
                    <div className={`${mbSection} group/section relative`}>
                        <h3 className={titleStyle}>{summaryTitle}</h3>
                        <p className={cn("text-sm leading-relaxed opacity-90", compactMode && "text-xs leading-normal")}>{data.basics.summary}</p>
                    </div>
                );
            case 'experience':
                if (data.experience.length === 0) return null;
                 const expTitle = region === 'sidebar' ? 'Experience' : (template === 'chikorita' ? 'Work Experience' : 'Experience');
                return (
                    <div className={`${mbSection} group/section relative`}>
                        <h3 className={titleStyle}>{expTitle}</h3>
                        <ExperienceList />
                    </div>
                );
            case 'education':
                if (data.education.length === 0) return null;
                return (
                    <div className={region === 'sidebar' ? `${mbSectionSidebar} group/section relative` : `${mbSection} group/section relative`}>
                        <h3 className={titleStyle}>Education</h3>
                        <EducationList />
                    </div>
                );
            case 'skills':
                if (data.skills.length === 0) return null;
                return (
                    <div className={region === 'sidebar' ? `${mbSectionSidebar} group/section relative` : `bg-transparent ${mbSection} group/section relative`}>
                        <h3 className={titleStyle}>Skills</h3>
                        <SkillsList vertical={region === 'sidebar'} />
                    </div>
                );
            case 'certificates':
                if (!data.certificates || data.certificates.length === 0) return null;
                return (
                    <div className={region === 'sidebar' ? `${mbSectionSidebar} group/section relative` : `${mbSection} group/section relative`}>
                        <h3 className={titleStyle}>Certifications</h3>
                        <div className={cn("space-y-3", compactMode && "space-y-1.5")}>
                            {data.certificates.filter(c => c.visible).map(cert => (
                                <div key={cert.id} className="text-sm">
                                    <div className="font-bold text-inherit">{cert.name}</div>
                                    <div className="opacity-80">{cert.issuer} • {cert.date}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
                return (
                    <div className={region === 'sidebar' ? "mb-8 group/section relative" : "mb-6 group/section relative"}>
                        <h3 className={titleStyle}>Interests</h3>
                        <div className="space-y-3">
                            {data.activities.filter(a => a.visible).map(act => (
                                <div key={act.id} className="text-sm">
                                    <div className="font-bold text-inherit">{act.name}</div>
                                    <p className="opacity-80 leading-relaxed text-xs mt-0.5">{act.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'languages':
                if (!data.languages || data.languages.length === 0) return null;
                return (
                    <div className={region === 'sidebar' ? "mb-8 group/section relative" : "mb-6 group/section relative"}>
                        <h3 className={titleStyle}>Languages</h3>
                        <div className="space-y-2">
                            {data.languages.filter(l => l.visible).map(lang => (
                                <div key={lang.id} className="flex justify-between items-center text-sm">
                                    <span className="font-bold">{lang.name}</span>
                                    <span className="opacity-75 text-xs">{lang.fluency}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'projects':
                if (!data.projects || data.projects.length === 0) return null;
                return (
                    <div className={region === 'sidebar' ? "mb-8 group/section relative" : "mb-6 group/section relative"}>
                        <h3 className={titleStyle}>Projects</h3>
                        <div className="space-y-4">
                            {data.projects.filter(p => p.visible).map(proj => (
                                <div key={proj.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-sm">{proj.name}</h4>
                                        {proj.link && (
                                            <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs opacity-70 hover:opacity-100 hover:underline flex items-center gap-1">
                                                <LinkIcon size={10} /> Link
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap mb-2">{proj.description}</p>
                                    {proj.techStack && proj.techStack.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {proj.techStack.map((tech, idx) => (
                                                <span key={idx} className="text-[10px] bg-gray-500/10 px-1.5 py-0.5 rounded border border-gray-500/20 opacity-80">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    // --- Layouts ---

    // 1. Single Column Layout
    if (t.layout === 'single') {
        const sections = activeMain.length > 0 ? activeMain : defaultLayout.main;
        
        return (
            <div id="resume-preview" className={cn("w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl origin-top", t.container)} style={{ '--primary': colors.primary, '--text': colors.text, '--background': colors.background, '--primary-light': 'color-mix(in srgb, var(--primary), white 90%)', fontFamily: font || 'inherit' } as React.CSSProperties}>
                <div className={t.header}>
                    <div className="flex items-center gap-6">
                        {data.basics.photo && (
                            <img 
                                src={data.basics.photo} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shrink-0"
                            />
                        )}
                        <div className={data.basics.photo ? '' : 'text-center w-full'}>
                            <h1 className={t.name}>{data.basics.name}</h1>
                            <p className={t.headline}>{data.basics.headline}</p>
                            {!data.basics.photo && <ContactDetails />}
                        </div>
                    </div>
                    {data.basics.photo && <ContactDetails className="mt-4" />}
                </div>

                <Reorder.Group axis="y" values={sections} onReorder={(newOrder) => onReorder(newOrder, [])}>
                    {sections.map(section => (
                         <DraggableSection key={section} item={section}>
                             {renderSection(section, 'main')}
                         </DraggableSection>
                    ))}
                </Reorder.Group>

                {/* Page Break Guide */}
                <div className="absolute top-[297mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-30 pointer-events-none print:hidden z-50">
                     <span className="absolute right-2 bottom-1 text-[10px] text-red-400 font-mono">End of Page 1</span>
                </div>
            </div>
        );
    }

    // 2. Two Column Left Sidebar
    if (t.layout === 'two-left') {
        const sidebarSections = activeSidebar.length > 0 ? activeSidebar : twoColumnLeftDefault.sidebar;
        const mainSections = activeMain.length > 0 ? activeMain : twoColumnLeftDefault.main;

        return (
            <div id="resume-preview" className={cn("w-[210mm] min-h-[297mm] shadow-2xl origin-top", t.container)} style={{ '--primary': colors.primary, '--text': colors.text, '--background': colors.background, '--primary-light': 'color-mix(in srgb, var(--primary), white 90%)' } as React.CSSProperties}>
                {/* Sidebar */}
                <div className={t.sidebar}>
                    {(template === 'gengar' || template === 'leafish') && (
                        <div className="mb-8">
                                <div className="w-20 h-20 rounded-full bg-white/10 mb-4 overflow-hidden">
                                    {data.basics.photo ? (
                                        <img src={data.basics.photo} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-4 text-white/50" />
                                    )}
                                </div>
                                <h1 className={t.name}>{data.basics.name}</h1>
                                <p className={t.headline}>{data.basics.headline}</p>
                                <div className="flex flex-col gap-2 text-sm opacity-80 mt-4">
                                <ContactLine icon={Mail} value={data.basics.email} />
                                <ContactLine icon={Phone} value={data.basics.phone} />
                                <ContactLine icon={MapPin} value={data.basics.location} />
                                <ContactLine icon={LinkIcon} value={data.basics.website} />
                                </div>
                        </div>
                    )}

                    <Reorder.Group axis="y" values={sidebarSections} onReorder={(newOrder) => onReorder(mainSections, newOrder)}>
                        {sidebarSections.map(section => (
                            <DraggableSection key={section} item={section}>
                                {renderSection(section, 'sidebar')}
                            </DraggableSection>
                        ))}
                    </Reorder.Group>
                </div>

                {/* Main Content */}
                <div className={t.main}>
                        {template === 'azurill' && (
                        <div className="mb-8 border-b border-gray-100 pb-8">
                            <div className="flex items-center gap-6">
                                {data.basics.photo && (
                                    <img 
                                        src={data.basics.photo} 
                                        alt="Profile" 
                                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-200 shrink-0"
                                    />
                                )}
                                <div>
                                    <h1 className={t.name}>{data.basics.name}</h1>
                                    <p className={t.headline}>{data.basics.headline}</p>
                                </div>
                            </div>
                            <ContactDetails className="mt-4" />
                        </div>
                        )}

                        <Reorder.Group axis="y" values={mainSections} onReorder={(newOrder) => onReorder(newOrder, sidebarSections)}>
                            {mainSections.map(section => (
                                <DraggableSection key={section} item={section}>
                                    {renderSection(section, 'main')}
                                </DraggableSection>
                            ))}
                        </Reorder.Group>
                </div>

                {/* Page Break Guide */}
                <div className="absolute top-[297mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-30 pointer-events-none print:hidden z-50">
                     <span className="absolute right-2 bottom-1 text-[10px] text-red-400 font-mono">End of Page 1</span>
                </div>
            </div>
        );
    }

    // 3. Two Column Right Sidebar (Chikorita)
    if (t.layout === 'two-right') {
        const sidebarSections = activeSidebar.length > 0 ? activeSidebar : twoColumnRightDefault.sidebar;
        const mainSections = activeMain.length > 0 ? activeMain : twoColumnRightDefault.main;

         return (
            <div id="resume-preview" className={cn("w-[210mm] min-h-[297mm] shadow-2xl origin-top", t.container)} style={{ '--primary': colors.primary, '--text': colors.text, '--background': colors.background, '--primary-light': 'color-mix(in srgb, var(--primary), white 90%)' } as React.CSSProperties}>
                {/* Main Content (Left) */}
                <div className={t.main}>
                     <div className="mb-8">
                        <div className="flex items-center gap-6">
                            {data.basics.photo && (
                                <img 
                                    src={data.basics.photo} 
                                    alt="Profile" 
                                    className="w-20 h-20 rounded-full object-cover border-2 border-teal-200 shrink-0"
                                />
                            )}
                            <div>
                                <h1 className={t.name}>{data.basics.name}</h1>
                                <p className={t.headline}>{data.basics.headline}</p>
                            </div>
                        </div>
                        <ContactDetails className="mt-4" />
                     </div>

                     <Reorder.Group axis="y" values={mainSections} onReorder={(newOrder) => onReorder(newOrder, sidebarSections)}>
                        {mainSections.map(section => (
                            <DraggableSection key={section} item={section}>
                                {renderSection(section, 'main')}
                            </DraggableSection>
                        ))}
                    </Reorder.Group>
                </div>

                {/* Sidebar (Right) */}
                <div className={t.sidebar}>
                    <Reorder.Group axis="y" values={sidebarSections} onReorder={(newOrder) => onReorder(mainSections, newOrder)}>
                        {sidebarSections.map(section => (
                            <DraggableSection key={section} item={section}>
                                {renderSection(section, 'sidebar')}
                            </DraggableSection>
                        ))}
                    </Reorder.Group>
                </div>

                {/* Page Break Guide */}
                <div className="absolute top-[297mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-30 pointer-events-none print:hidden z-50">
                     <span className="absolute right-2 bottom-1 text-[10px] text-red-400 font-mono">End of Page 1</span>
                </div>
            </div>
        );
    }

    return null;
};

export const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
      currentResume, setCurrentResume, updateCurrentResumeData, updateCurrentResumeMetadata, updateSectionOrder, saveCurrentResume, 
      setLoading, publishTemplate, runATSAnalysis, generateSummaryWithAI, generateExperienceWithAI,
      suggestSkillsWithAI, isLoading, user, atsAnalysis, templates
  } = useStore();
  const [activeSection, setActiveSection] = useState<SectionType>('basics');
  const [zoom, setZoom] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [showATS, setShowATS] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === 'true') {
        setShowOnboarding(true);
    } else if (params.get('ats') === 'true') {
        setShowATS(true);
    }
  }, [location]);

  // Auto-run ATS Analysis when modal opens via param/import
  useEffect(() => {
    if (showATS && currentResume && !atsAnalysis) {
        runATSAnalysis();
    }
  }, [showATS, currentResume]);

  useEffect(() => {
    const loadResume = async () => {
      if (!id) return;
      setLoading(true);
      const resume = await resumeService.getResume(id);
      if (resume) setCurrentResume(resume);
      setLoading(false);
    };
    loadResume();
  }, [id]);

  const handleSave = async () => {
      setIsSaving(true);
      await saveCurrentResume();
      setTimeout(() => setIsSaving(false), 500);
  };

  const handleGenerateSummary = async () => {
      setGeneratingAI(true);
      await generateSummaryWithAI();
      setGeneratingAI(false);
  };

  const handleSuggestSkills = async () => {
      setGeneratingAI(true);
      const skills = await suggestSkillsWithAI();
      setSuggestedSkills(skills);
      setGeneratingAI(false);
  };

  const handleFullAIGenerate = async (params: AIParams) => {
      if (!currentResume) return;

      // 1. Update Headline
      updateCurrentResumeData('basics', { ...currentResume.data.basics, headline: params.jobTitle, summary: `Experienced ${params.jobTitle} with a proven track record...` }); // Temporary placeholder before AI
      
      // 2. Generate Summary
      await generateSummaryWithAI();

      // 3. Generate Skills
      const skills = await suggestSkillsWithAI();
      const newSkills = skills.slice(0, 8).map(name => ({ id: Date.now().toString() + Math.random(), name, level: 3 }));
      updateCurrentResumeData('skills', newSkills);

      // 4. Add Dummy Experience to Generate Content
      const expId = Date.now().toString();
      const dummyExp: ExperienceItem = {
          id: expId,
          position: params.jobTitle,
          company: 'Example Company',
          startDate: '2022',
          endDate: 'Present',
          location: 'Remote',
          description: '',
          visible: true
      };
      
      const currentExp = currentResume.data.experience || [];
      updateCurrentResumeData('experience', [dummyExp, ...currentExp]);
      
      // Generate description for this experience
      // Note: We need to wait for state update in a real app, but here we might need to directly call API or use store method if available. 
      // Since generateExperienceWithAI uses activeItem logic in previous implementation, we might need to improve store or just add the item for now.
      // For this MVP, we'll leave the experience added. User can click "AI Generate" on it.
  };

  const handlePublish = async () => {
      if(!currentResume) return;
      if(confirm('Publish this resume design as a community template?')) {
          await publishTemplate(currentResume.id);
          alert('Template published to Community tab!');
      }
  };

  const handleCheckATS = async () => {
      setShowATS(true);
      await runATSAnalysis();
  };

  const handleExportPDF = () => {
    const element = document.getElementById('resume-preview');
    if(!element) return;
    
    // Improved PDF options for better rendering
    const opt = {
      margin: 0,
      filename: `${currentResume?.name || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!currentResume) return <div className="p-10 text-center text-white">Loading...</div>;

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateCurrentResumeData('basics', { ...currentResume.data.basics, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user || !currentResume) return;
    setUploadingPhoto(true);
    try {
      const photoUrl = await storageService.uploadResumeImage(user.id, currentResume.id, file);
      updateCurrentResumeData('basics', { ...currentResume.data.basics, photo: photoUrl });
    } catch (error: any) {
      alert(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // List Handlers
  const addItem = (section: 'experience' | 'education' | 'skills' | 'certificates' | 'activities' | 'languages' | 'projects', item: any) => {
      const items = (currentResume.data[section] || []) as any[];
      updateCurrentResumeData(section, [...items, { ...item, id: Date.now().toString() }]);
  };
  const updateItem = (section: 'experience' | 'education' | 'skills' | 'certificates' | 'activities' | 'languages' | 'projects', id: string, data: any) => {
      const items = (currentResume.data[section] || []) as any[];
      updateCurrentResumeData(section, items.map(i => i.id === id ? data : i));
  };
  const deleteItem = (section: 'experience' | 'education' | 'skills' | 'certificates' | 'activities' | 'languages' | 'projects', id: string) => {
      const items = (currentResume.data[section] || []) as any[];
      updateCurrentResumeData(section, items.filter(i => i.id !== id));
  };

  const sections = [
      { id: 'basics', icon: User, label: 'Basics' },
      { id: 'summary', icon: FileText, label: 'Summary' },
      { id: 'experience', icon: Briefcase, label: 'Experience' },
      { id: 'education', icon: GraduationCap, label: 'Education' },
      { id: 'skills', icon: Wrench, label: 'Skills' },
      { id: 'certificates', icon: Award, label: 'Certificates' },
      { id: 'languages', icon: Globe, label: 'Languages' },
      { id: 'projects', icon: FolderGit2, label: 'Projects' },
      { id: 'activities', icon: Heart, label: 'Hobbies' },
      { id: 'design', icon: Layout, label: 'Design' },
  ];

  return (
    <div className="flex h-full bg-[#0a0a0a] overflow-hidden">
      <ATSModal isOpen={showATS} onClose={() => setShowATS(false)} />
      <AIOnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onGenerate={handleFullAIGenerate}
      />
      
      {/* 1. Editor Sidebar */}
      <div className="w-20 border-r border-gray-800 flex flex-col items-center py-6 gap-6 bg-[#0f0f0f] z-20">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all mb-4">
            <ArrowLeft size={20} />
        </button>
        
        {sections.map((section) => (
            <button
                key={section.id}
                onClick={() => setActiveSection(section.id as SectionType)}
                className={`p-3 rounded-xl transition-all group relative ${activeSection === section.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}
            >
                <section.icon size={24} />
                <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                    {section.label}
                </span>
            </button>
        ))}
      </div>

      {/* 2. Editor Panel */}
      <div className="w-[450px] bg-[#111111] border-r border-gray-800 flex flex-col animate-fade-in z-10 shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white capitalize">{activeSection}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {activeSection === 'basics' && (
                <BasicsEditor 
                    data={currentResume.data.basics} 
                    onChange={handleBasicChange} 
                    onPhotoUpload={handlePhotoUpload} 
                    uploadingPhoto={uploadingPhoto} 
                    showPhoto={templates.find(t => t.id === currentResume.metadata.template)?.config.hasPhoto ?? true}
                />
            )}
            {activeSection === 'summary' && (
                 <div className="space-y-4 animate-slide-up">
                    <p className="text-sm text-gray-400 mb-2">Write a short professional summary to highlight your key achievements.</p>
                     <textarea 
                        name="summary" 
                        rows={10}
                        value={currentResume.data.basics.summary} 
                        onChange={handleBasicChange}
                        placeholder="e.g. Passionate software engineer with 5 years of experience..."
                        className="w-full rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none resize-none"
                    />
                    <Button 
                        variant="secondary" 
                        className="w-full bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
                        onClick={handleGenerateSummary}
                        disabled={generatingAI}
                    >
                        {generatingAI ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Wand2 size={16} className="mr-2" />}
                        {generatingAI ? 'Generating...' : 'Generate with AI'}
                    </Button>
                 </div>
            )}
            {activeSection === 'experience' && (
                <ListSectionEditor<ExperienceItem>
                    items={currentResume.data.experience}
                    renderItem={(item) => ({ title: item.position, subtitle: item.company, dates: `${item.startDate} - ${item.endDate}` })}
                    onAdd={() => addItem('experience', { position: 'New Position', company: 'Company', startDate: '2023', endDate: 'Present', description: '', visible: true })}
                    onDelete={(id) => deleteItem('experience', id)}
                    onUpdate={(id, data) => updateItem('experience', id, data)}
                    onGenerateAI={generateExperienceWithAI}
                    renderEditor={(item, handleChange) => (
                        <div className="space-y-4">
                            <Input label="Position" value={item.position} onChange={e => handleChange('position', e.target.value)} />
                            <Input label="Company" value={item.company} onChange={e => handleChange('company', e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Start Date" value={item.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                                <Input label="End Date" value={item.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                            </div>
                            <Input label="Location" value={item.location} onChange={e => handleChange('location', e.target.value)} />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
                                <textarea rows={5} value={item.description} onChange={e => handleChange('description', e.target.value)} className="w-full rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none resize-none" />
                            </div>
                        </div>
                    )}
                />
            )}
            {activeSection === 'education' && (
                <ListSectionEditor<EducationItem>
                    items={currentResume.data.education}
                    renderItem={(item) => ({ title: item.school, subtitle: item.degree, dates: `${item.startDate} - ${item.endDate}` })}
                    onAdd={() => addItem('education', { school: 'New School', degree: 'Degree', field: 'Field', startDate: '2020', endDate: '2024', description: '', visible: true })}
                    onDelete={(id) => deleteItem('education', id)}
                    onUpdate={(id, data) => updateItem('education', id, data)}
                    renderEditor={(item, handleChange) => (
                        <div className="space-y-4">
                            <Input label="School" value={item.school} onChange={e => handleChange('school', e.target.value)} />
                            <Input label="Degree" value={item.degree} onChange={e => handleChange('degree', e.target.value)} />
                            <Input label="Field of Study" value={item.field} onChange={e => handleChange('field', e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Start Date" value={item.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                                <Input label="End Date" value={item.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                            </div>
                        </div>
                    )}
                />
            )}
            {activeSection === 'certificates' && (
                <ListSectionEditor<CertificateItem>
                    items={currentResume.data.certificates || []}
                    renderItem={(item) => ({ title: item.name, subtitle: item.issuer, dates: item.date })}
                    onAdd={() => addItem('certificates', { name: 'Certificate Name', issuer: 'Issuer', date: '2024', url: '', visible: true })}
                    onDelete={(id) => deleteItem('certificates', id)}
                    onUpdate={(id, data) => updateItem('certificates', id, data)}
                    renderEditor={(item, handleChange) => (
                        <div className="space-y-4">
                            <Input label="Certificate Name" value={item.name} onChange={e => handleChange('name', e.target.value)} />
                            <Input label="Issuing Organization" value={item.issuer} onChange={e => handleChange('issuer', e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Issue Date" value={item.date} onChange={e => handleChange('date', e.target.value)} />
                                <Input label="Certificate URL (Optional)" value={item.url} onChange={e => handleChange('url', e.target.value)} />
                            </div>
                        </div>
                    )}
                />
            )}
            {activeSection === 'activities' && (
                <ListSectionEditor<ActivityItem>
                    items={currentResume.data.activities || []}
                    renderItem={(item) => ({ title: item.name, subtitle: item.description })}
                    onAdd={() => addItem('activities', { name: 'Activity/Hobby', description: 'Description...', visible: true })}
                    onDelete={(id) => deleteItem('activities', id)}
                    onUpdate={(id, data) => updateItem('activities', id, data)}
                    renderEditor={(item, handleChange) => (
                        <div className="space-y-4">
                            <Input label="Activity / Hobby" value={item.name} onChange={e => handleChange('name', e.target.value)} />
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
                                <textarea rows={3} value={item.description} onChange={e => handleChange('description', e.target.value)} className="w-full rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none resize-none" />
                            </div>
                        </div>
                    )}
                />
            )}
            {activeSection === 'languages' && (
                <ListSectionEditor<LanguageItem>
                    items={currentResume.data.languages || []}
                    renderItem={(item) => ({ title: item.name, subtitle: item.fluency })}
                    onAdd={() => addItem('languages', { name: 'Language', fluency: 'Native', visible: true })}
                    onDelete={(id) => deleteItem('languages', id)}
                    onUpdate={(id, data) => updateItem('languages', id, data)}
                    renderEditor={(item, handleChange) => (
                        <div className="space-y-4">
                            <Input label="Language" value={item.name} onChange={e => handleChange('name', e.target.value)} />
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Fluency</label>
                                <select 
                                    value={item.fluency} 
                                    onChange={e => handleChange('fluency', e.target.value)}
                                    className="w-full rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none"
                                >
                                    <option value="Native">Native</option>
                                    <option value="Fluent">Fluent</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Beginner">Beginner</option>
                                </select>
                            </div>
                        </div>
                    )}
                />
            )}
            {activeSection === 'projects' && (
                <ListSectionEditor<ProjectItem>
                    items={currentResume.data.projects || []}
                    renderItem={(item) => ({ title: item.name, subtitle: item.description?.substring(0, 30) + (item.description?.length > 30 ? '...' : '') })}
                    onAdd={() => addItem('projects', { name: 'Project Name', description: 'Brief description...', techStack: [], visible: true })}
                    onDelete={(id) => deleteItem('projects', id)}
                    onUpdate={(id, data) => updateItem('projects', id, data)}
                    renderEditor={(item, handleChange) => (
                        <div className="space-y-4">
                            <Input label="Project Name" value={item.name} onChange={e => handleChange('name', e.target.value)} />
                            <Input label="Link (Optional)" value={item.link || ''} onChange={e => handleChange('link', e.target.value)} />
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Tech Stack (Comma separated)</label>
                                <input 
                                    type="text" 
                                    value={item.techStack?.join(', ') || ''} 
                                    onChange={e => handleChange('techStack', e.target.value.split(',').map((s: string) => s.trim()))}
                                    className="w-full rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none"
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
                                <textarea rows={3} value={item.description} onChange={e => handleChange('description', e.target.value)} className="w-full rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none resize-none" />
                            </div>
                        </div>
                    )}
                />
            )}
            {activeSection === 'skills' && (
                <div className="space-y-4 animate-slide-up">
                    <div className="flex flex-wrap gap-2 mb-4">
                         {currentResume.data.skills.map(skill => (
                             <div key={skill.id} className="group flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-gray-800">
                                 <span className="text-sm text-white">{skill.name}</span>
                                 <button onClick={() => deleteItem('skills', skill.id)} className="text-gray-500 hover:text-red-400">
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         ))}
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-gray-800">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Add Skill</h4>
                        <div className="flex gap-2">
                             <Input 
                                id="new-skill-input"
                                placeholder="e.g. React" 
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        const target = e.target as HTMLInputElement;
                                        if(target.value) {
                                            addItem('skills', { name: target.value, level: 3 });
                                            target.value = '';
                                        }
                                    }
                                }}
                             />
                             <Button onClick={() => {
                                 const el = document.getElementById('new-skill-input') as HTMLInputElement;
                                 if(el && el.value) {
                                     addItem('skills', { name: el.value, level: 3 });
                                     el.value = '';
                                 }
                             }}>Add</Button>
                        </div>
                    </div>
                    
                    {/* AI Skill Suggestions */}
                    <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                <Sparkles size={14} /> AI Suggestions
                            </h4>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-purple-400 hover:bg-purple-500/10"
                                onClick={handleSuggestSkills}
                                disabled={generatingAI}
                            >
                                {generatingAI ? <Loader2 size={14} className="animate-spin" /> : 'Suggest Skills'}
                            </Button>
                        </div>
                        {suggestedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {suggestedSkills.map((skill, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            addItem('skills', { name: skill, level: 3 });
                                            setSuggestedSkills(prev => prev.filter(s => s !== skill));
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-500/20 transition-colors"
                                    >
                                        <Plus size={12} /> {skill}
                                    </button>
                                ))}
                            </div>
                        )}
                        {suggestedSkills.length === 0 && (
                            <p className="text-xs text-gray-500">Click "Suggest Skills" to get AI-powered skill recommendations based on your role.</p>
                        )}
                    </div>
                </div>
            )}
            {activeSection === 'design' && (
                <div className="space-y-8 animate-slide-up">
                    {/* 1. Template Selection */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Layout Template</h3>
                        <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'onyx', name: 'Onyx', color: 'bg-white' },
                            { id: 'azurill', name: 'Azurill', color: 'bg-slate-100' },
                            { id: 'bronzor', name: 'Bronzor', color: 'bg-[#fdfbf7]' },
                            { id: 'gengar', name: 'Gengar', color: 'bg-[#1e1b4b]' },
                            { id: 'glalie', name: 'Glalie', color: 'bg-gray-50' },
                            { id: 'kakuna', name: 'Kakuna', color: 'bg-yellow-50' },
                            { id: 'chikorita', name: 'Chikorita', color: 'bg-emerald-50' },
                            { id: 'ditto', name: 'Ditto', color: 'bg-black' },
                            { id: 'lapras', name: 'Lapras', color: 'bg-blue-50' },
                            { id: 'leafish', name: 'Leafish', color: 'bg-green-900' }
                        ].map((template) => (
                            <div 
                                key={template.id}
                                onClick={() => updateCurrentResumeMetadata({ template: template.id })}
                                className={cn(
                                    "cursor-pointer rounded-lg border p-2 transition-all flex items-center gap-2 hover:bg-white/5",
                                    currentResume.metadata.template === template.id 
                                        ? "border-primary-500 bg-primary-500/10" 
                                        : "border-gray-800"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border border-white/20", template.color)} />
                                <span className={cn("text-xs font-medium capitalize", currentResume.metadata.template === template.id ? "text-primary-400" : "text-gray-400")}>
                                    {template.name}
                                </span>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* 2. Color Scheme */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-300">Accent Color</h3>
                            <input 
                                type="color" 
                                value={currentResume.metadata.colors.primary}
                                onChange={(e) => updateCurrentResumeMetadata({ colors: { ...currentResume.metadata.colors, primary: e.target.value } })}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['#1a1a1a', '#2563eb', '#7c3aed', '#0d9488', '#dc2626', '#ea580c', '#059669', '#db2777'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => updateCurrentResumeMetadata({ colors: { ...currentResume.metadata.colors, primary: color } })}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        currentResume.metadata.colors.primary === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 3. Typography */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Typography</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { name: 'Inter', family: '"Inter", sans-serif' },
                                { name: 'Roboto', family: '"Roboto", sans-serif' },
                                { name: 'Open Sans', family: '"Open Sans", sans-serif' },
                                { name: 'Merriweather', family: '"Merriweather", serif' },
                                { name: 'Playfair Display', family: '"Playfair Display", serif' },
                                { name: 'Lato', family: '"Lato", sans-serif' },
                                { name: 'Fira Code', family: '"Fira Code", monospace' }
                            ].map(font => (
                                <button
                                    key={font.name}
                                    onClick={() => updateCurrentResumeMetadata({ font: font.family })}
                                    className={cn(
                                        "flex justify-between items-center px-4 py-3 rounded-lg border transition-all text-sm",
                                        currentResume.metadata.font === font.family 
                                            ? "border-primary-500 bg-primary-500/10 text-primary-400" 
                                            : "border-gray-800 bg-white/5 text-gray-400 hover:border-gray-600"
                                    )}
                                    style={{ fontFamily: font.family }}
                                >
                                    <span>{font.name}</span>
                                    {currentResume.metadata.font === font.family && <CheckCircle size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#0f0f0f]">
             <Button className="w-full" onClick={handleSave} isLoading={isSaving}>
                 <Save size={16} className="mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
             </Button>
        </div>
      </div>

      {/* 3. Live Preview */}
      <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="h-16 border-b border-gray-800 bg-[#111111]/80 backdrop-blur-md flex justify-between items-center px-6 z-20">
            <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">Template: <span className="text-white font-medium capitalize">{currentResume.metadata.template}</span></div>
            </div>
            <div className="flex items-center gap-3">
                 <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>-</Button>
                 <span className="text-sm w-12 text-center text-gray-300">{Math.round(zoom * 100)}%</span>
                 <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>+</Button>
                 <div className="w-px h-6 bg-gray-700 mx-2" />
                 
                 <Button variant="secondary" size="sm" onClick={handleCheckATS} className="text-green-500 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50">
                     <CheckCircle size={16} className="mr-2" /> Check ATS
                 </Button>

                 <Button variant="secondary" size="sm" onClick={handlePublish}>
                     <Globe size={16} className="mr-2" /> Publish
                 </Button>

                 <Button variant="primary" size="sm" onClick={handleExportPDF}>
                     <Download size={16} className="mr-2" /> Export PDF
                 </Button>
            </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 overflow-auto p-12 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
             <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                 <DocumentPreview 
                    data={currentResume.data} 
                    template={currentResume.metadata.template} 
                    layout={currentResume.metadata.layout}
                    colors={currentResume.metadata.colors}
                    font={currentResume.metadata.font}
                    onReorder={updateSectionOrder}
                    compactMode={currentResume.metadata.compactMode}
                 />
             </div>
        </div>
      </div>
    </div>
  );
};