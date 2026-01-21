import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { resumeService, storageService } from '../services/firebase';
import { Button, Input } from '../components/UIComponents';
import { ATSModal } from '../components/ATSModal';
import { 
  ArrowLeft, Save, Download, Share2, 
  User, Briefcase, GraduationCap, Wrench, FileText, ChevronDown, Plus, Trash2, GripVertical,
  CheckCircle, Globe, MapPin, Phone, Mail, Link as LinkIcon, Sparkles, Loader2, Wand2, Camera
} from 'lucide-react';
import { SectionType, Resume, ExperienceItem, EducationItem } from '../types';
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
const BasicsEditor = ({ data, onChange, onPhotoUpload, uploadingPhoto }: { 
    data: any, 
    onChange: (e: any) => void,
    onPhotoUpload: (file: File) => Promise<void>,
    uploadingPhoto: boolean 
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

const DocumentPreview = ({ data, template }: { data: Resume['data'], template: string }) => {
    
    // --- Styles Definitions ---
    const styles = {
        // ONYX: Minimal, standard, highly readable
        onyx: {
            container: "font-sans bg-white text-gray-900",
            header: "border-b-2 border-gray-900 pb-6 mb-6",
            name: "text-4xl font-bold uppercase tracking-tight",
            headline: "text-xl text-gray-600 mt-1 font-light",
            sectionTitle: "text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-1 mb-4 text-gray-500",
            contactRow: "flex flex-wrap gap-4 mt-4 text-sm text-gray-600",
            layout: "single"
        },
        // AZURILL: Two column, left sidebar blue
        azurill: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[32%] bg-slate-100 p-8 h-full border-r border-slate-200 text-slate-700 pt-12",
            main: "flex-1 p-8 pt-12 text-slate-800",
            name: "text-3xl font-bold text-slate-900 leading-tight mb-2",
            headline: "text-lg text-blue-600 font-medium mb-6",
            sectionTitleSidebar: "text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 mt-8 border-b-2 border-blue-200 pb-1",
            sectionTitleMain: "text-xl font-bold text-slate-900 mb-4 flex items-center gap-2",
            layout: "two-left"
        },
        // BRONZOR: Serif, classic, warm background
        bronzor: {
            container: "font-serif bg-[#fdfbf7] text-[#2c2420]",
            header: "text-center border-b border-double border-[#8c7b75] pb-6 mb-8",
            name: "text-4xl font-serif font-bold text-[#4a3b32]",
            headline: "text-lg italic text-[#8c7b75] mt-2",
            sectionTitle: "text-center text-lg font-bold uppercase tracking-widest text-[#4a3b32] mb-6 border-b border-[#e5e0d8] pb-2",
            contactRow: "flex justify-center gap-6 mt-4 text-sm text-[#5d4d44]",
            layout: "single"
        },
        // GENGAR: Modern, dark sidebar, high contrast
        gengar: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[35%] bg-[#1e1b4b] text-white p-8 h-full pt-16",
            main: "flex-1 p-10 pt-16 text-gray-800",
            name: "text-3xl font-bold text-white mb-2",
            headline: "text-purple-200 text-lg mb-8",
            sectionTitleSidebar: "text-sm font-bold uppercase tracking-wider text-purple-200 mb-4 mt-8 border-b border-purple-800 pb-1",
            sectionTitleMain: "text-2xl font-bold text-[#1e1b4b] mb-6 border-l-4 border-[#1e1b4b] pl-3 uppercase tracking-tight",
            layout: "two-left"
        },
        // GLALIE: Technical, mono-styled, code-like
        glalie: {
            container: "font-mono text-sm bg-white text-gray-800",
            header: "mb-8 p-6 bg-gray-50 border-b border-gray-200",
            name: "text-2xl font-bold text-black",
            headline: "text-gray-500",
            sectionTitle: "text-sm font-bold bg-gray-100 p-1 pl-2 mb-4 border-l-4 border-gray-400",
            contactRow: "grid grid-cols-2 gap-2 mt-4 text-xs",
            layout: "single"
        },
        // KAKUNA: Robust, thick borders, yellow/orange accents
        kakuna: {
            container: "font-sans bg-white text-gray-900 border-l-[12px] border-yellow-500",
            header: "pl-8 pt-8 pb-8 mb-4 border-b border-gray-100",
            name: "text-5xl font-extrabold tracking-tighter text-gray-900",
            headline: "text-xl font-medium text-yellow-600 mt-2",
            sectionTitle: "text-xl font-bold text-gray-900 mb-4 mt-6 inline-block bg-yellow-100 px-3 py-1 -rotate-1",
            contactRow: "flex flex-col gap-1 mt-4 text-sm font-medium text-gray-500",
            layout: "single"
        },
        // CHIKORITA: Two col right, fresh green
        chikorita: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[30%] bg-emerald-50 p-6 h-full border-l border-emerald-100 text-emerald-900 pt-10 order-2",
            main: "flex-1 p-8 pt-10 text-gray-800 order-1",
            name: "text-3xl font-bold text-emerald-800",
            headline: "text-lg text-emerald-600 mb-6",
            sectionTitleSidebar: "text-xs font-bold uppercase text-emerald-700 mb-3 mt-6",
            sectionTitleMain: "text-lg font-bold text-emerald-900 mb-4 border-b border-emerald-100 pb-2",
            layout: "two-right"
        },
        // DITTO: Bold, grid-like, boxy
        ditto: {
            container: "font-sans bg-white text-black",
            header: "bg-black text-white p-8 mb-8",
            name: "text-4xl font-bold",
            headline: "text-gray-300 text-lg",
            sectionTitle: "text-xl font-black uppercase mb-4 border-b-4 border-black inline-block",
            contactRow: "flex flex-wrap gap-6 mt-4 text-sm text-gray-400",
            layout: "single"
        },
        // LAPRAS: Elegant, centered, blue serif
        lapras: {
            container: "font-serif bg-white text-slate-800",
            header: "text-center pb-8 mb-8",
            name: "text-4xl text-slate-900 tracking-wide",
            headline: "text-lg text-blue-800 italic mt-2",
            sectionTitle: "text-center text-sm font-bold uppercase tracking-[0.2em] text-blue-900 mb-6 mt-8",
            contactRow: "flex justify-center gap-4 mt-6 text-sm text-slate-500 font-sans",
            layout: "single"
        },
        // LEAFISH: Organic, left sidebar green
        leafish: {
            container: "font-sans bg-white flex h-full",
            sidebar: "w-[28%] bg-green-900 text-green-50 p-6 h-full pt-10",
            main: "flex-1 p-8 pt-10 text-gray-800",
            name: "text-2xl font-bold text-green-100 mb-1",
            headline: "text-sm text-green-300 mb-6",
            sectionTitleSidebar: "text-xs font-bold uppercase tracking-widest text-green-400 mb-3 mt-8",
            sectionTitleMain: "text-xl text-green-800 mb-4 font-light border-b border-green-100 pb-2 uppercase tracking-wide",
            layout: "two-left"
        }
    };

    const t: any = styles[template as keyof typeof styles] || styles.onyx;

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
                    template === 'kakuna' ? "bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200" : "",
                    template === 'gengar' ? "text-purple-100 bg-white/10 px-2 py-1 rounded" : "",
                    template === 'leafish' ? "text-green-50" : "",
                    !['kakuna', 'gengar', 'leafish'].includes(template) && "bg-gray-100 px-2 py-1 rounded text-gray-700"
                )}>
                    {skill.name} {skill.level > 3 && '★'}
                </span>
            ))}
        </div>
    );

    const EducationList = () => (
        <div className="space-y-4">
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

    const ExperienceList = () => (
        <div className="space-y-6">
            {data.experience.filter(e => e.visible).map(exp => (
                <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-md">{exp.position}</h4>
                        <span className="text-sm opacity-70 whitespace-nowrap">{exp.startDate} - {exp.endDate}</span>
                    </div>
                    <div className="text-sm font-semibold opacity-80 mb-2 flex items-center gap-2">
                        {exp.company} 
                        {exp.location && <span className="text-xs font-normal opacity-60">• {exp.location}</span>}
                    </div>
                    <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                </div>
            ))}
        </div>
    );

    // --- Layouts ---

    // 1. Single Column Layout (Onyx, Bronzor, Glalie, Kakuna, Ditto, Lapras)
    if (t.layout === 'single') {
        return (
            <div id="resume-preview" className={cn("w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl origin-top", t.container)}>
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

                {data.basics.summary && (
                    <div className="mb-6">
                        <h3 className={t.sectionTitle}>Profile</h3>
                        <p className="text-sm leading-relaxed opacity-90">{data.basics.summary}</p>
                    </div>
                )}

                {data.experience.length > 0 && (
                    <div className="mb-6">
                        <h3 className={t.sectionTitle}>Experience</h3>
                        <ExperienceList />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                     {data.education.length > 0 && (
                        <div>
                            <h3 className={t.sectionTitle}>Education</h3>
                            <EducationList />
                        </div>
                     )}
                     {data.skills.length > 0 && (
                        <div>
                            <h3 className={t.sectionTitle}>Skills</h3>
                            <SkillsList />
                        </div>
                     )}
                </div>
            </div>
        );
    }

    // 2. Two Column Left Sidebar (Azurill, Gengar, Leafish)
    if (t.layout === 'two-left') {
        return (
            <div id="resume-preview" className={cn("w-[210mm] min-h-[297mm] shadow-2xl origin-top", t.container)}>
                {/* Sidebar */}
                <div className={t.sidebar}>
                    {/* Name/Contact in Sidebar for Gengar/Leafish styles, or top? 
                        Design Choice: Gengar/Leafish put name in sidebar. Azurill puts name in main. 
                    */}
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

                    {/* Sidebar Sections */}
                    {data.education.length > 0 && (
                        <div className="mb-8">
                            <h3 className={t.sectionTitleSidebar}>Education</h3>
                            <EducationList />
                        </div>
                    )}

                    {data.skills.length > 0 && (
                        <div className="mb-8">
                            <h3 className={t.sectionTitleSidebar}>Skills</h3>
                            <SkillsList vertical={true} />
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className={t.main}>
                     {/* Azurill Header is in Main */}
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

                     {data.basics.summary && (
                        <div className="mb-8">
                            <h3 className={template === 'azurill' ? t.sectionTitleMain : t.sectionTitleMain.replace('text-2xl', 'text-xl')}>Profile</h3>
                            <p className="text-sm leading-relaxed opacity-90">{data.basics.summary}</p>
                        </div>
                     )}

                     {data.experience.length > 0 && (
                        <div>
                            <h3 className={t.sectionTitleMain}>Experience</h3>
                            <ExperienceList />
                        </div>
                     )}
                </div>
            </div>
        );
    }

    // 3. Two Column Right Sidebar (Chikorita)
    if (t.layout === 'two-right') {
         return (
            <div id="resume-preview" className={cn("w-[210mm] min-h-[297mm] shadow-2xl origin-top", t.container)}>
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

                     {data.basics.summary && (
                        <div className="mb-8">
                            <h3 className={t.sectionTitleMain}>Professional Summary</h3>
                            <p className="text-sm leading-relaxed opacity-90">{data.basics.summary}</p>
                        </div>
                     )}

                     {data.experience.length > 0 && (
                        <div>
                            <h3 className={t.sectionTitleMain}>Work Experience</h3>
                            <ExperienceList />
                        </div>
                     )}
                </div>

                {/* Sidebar (Right) */}
                <div className={t.sidebar}>
                    {data.skills.length > 0 && (
                        <div className="mb-8">
                            <h3 className={t.sectionTitleSidebar}>Skills</h3>
                            <SkillsList vertical={true} />
                        </div>
                    )}

                    {data.education.length > 0 && (
                        <div className="mb-8">
                            <h3 className={t.sectionTitleSidebar}>Education</h3>
                            <EducationList />
                        </div>
                    )}
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
      currentResume, setCurrentResume, updateCurrentResumeData, saveCurrentResume, 
      setLoading, publishTemplate, runATSAnalysis, generateSummaryWithAI, generateExperienceWithAI,
      suggestSkillsWithAI, isLoading, user
  } = useStore();
  const [activeSection, setActiveSection] = useState<SectionType>('basics');
  const [zoom, setZoom] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [showATS, setShowATS] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
  const addItem = (section: 'experience' | 'education' | 'skills', item: any) => {
      const items = currentResume.data[section] as any[];
      updateCurrentResumeData(section, [...items, { ...item, id: Date.now().toString() }]);
  };
  const updateItem = (section: 'experience' | 'education' | 'skills', id: string, data: any) => {
      const items = currentResume.data[section] as any[];
      updateCurrentResumeData(section, items.map(i => i.id === id ? data : i));
  };
  const deleteItem = (section: 'experience' | 'education' | 'skills', id: string) => {
      const items = currentResume.data[section] as any[];
      updateCurrentResumeData(section, items.filter(i => i.id !== id));
  };

  const sections = [
      { id: 'basics', icon: User, label: 'Basics' },
      { id: 'summary', icon: FileText, label: 'Summary' },
      { id: 'experience', icon: Briefcase, label: 'Experience' },
      { id: 'education', icon: GraduationCap, label: 'Education' },
      { id: 'skills', icon: Wrench, label: 'Skills' },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <ATSModal isOpen={showATS} onClose={() => setShowATS(false)} />
      
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
            {activeSection === 'basics' && <BasicsEditor data={currentResume.data.basics} onChange={handleBasicChange} onPhotoUpload={handlePhotoUpload} uploadingPhoto={uploadingPhoto} />}
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
                 <DocumentPreview data={currentResume.data} template={currentResume.metadata.template} />
             </div>
        </div>
      </div>
    </div>
  );
};