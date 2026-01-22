import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/UIComponents';
import { Plus, Eye, MoreVertical, Search, Clock, Trash2, Copy, Sparkles, LayoutTemplate, FileText, ArrowRight, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import gsap from 'gsap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const BentoCard = ({ children, className, delay = 0 }: BentoCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: delay, ease: "power3.out" }
    );
  }, [delay]);

  return (
    <div ref={cardRef} className={cn("bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl hover:bg-[#1a1a1a]/80 transition-colors duration-300", className)}>
      {children}
    </div>
  );
};

interface ResumeCardProps {
  resume: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPublish: (id: string) => void;
  index: number;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onEdit, onDelete, onDuplicate, onPublish, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.4 + (index * 0.1), ease: "back.out(1.2)" }
    );
  }, [index]);

  return (
    <div 
      ref={cardRef}
      className="group relative flex flex-col h-full bg-[#151515] hover:bg-[#1c1c1c] border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 cursor-pointer"
      onClick={() => onEdit(resume.id)}
    >
      {/* Visual Preview */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0f0f0f]">
        {resume.thumbnail ? (
          <img src={resume.thumbnail} alt={resume.name} className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100" />
        ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 gap-3">
                 <FileText size={48} className="opacity-20" />
                 <span className="text-sm font-medium opacity-40">No Preview</span>
             </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent opacity-80" />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] bg-black/40">
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(resume.id); }}
                className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
                title="Edit Resume"
            >
                <Sparkles size={20} />
            </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col justify-end relative z-10">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg text-white/90 truncate pr-2 flex-1 group-hover:text-primary-400 transition-colors">{resume.name}</h3>
          
          <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 outline-none">
                        <MoreVertical size={18} />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-[180px] bg-[#1a1a1a]/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenu.Item 
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-primary-500 hover:text-white rounded-lg cursor-pointer outline-none transition-colors"
                            onClick={() => onEdit(resume.id)}
                        >
                            <Eye size={16} /> Open Editor
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer outline-none transition-colors"
                            onClick={() => onDuplicate(resume.id)}
                        >
                            <Copy size={16} /> Duplicate
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer outline-none transition-colors"
                            onClick={() => onPublish(resume.id)}
                        >
                            <Globe size={16} /> Publish
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-white/10 my-1.5" />
                        <DropdownMenu.Item 
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg cursor-pointer outline-none transition-colors"
                            onClick={() => onDelete(resume.id)}
                        >
                            <Trash2 size={16} /> Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Clock size={12} />
          <span>Last edited {formatDistanceToNow(new Date(resume.updatedAt))} ago</span>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { resumes, fetchResumes, createResume, deleteResume, duplicateResume, publishTemplate, user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchResumes();
    
    // Time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleCreateNew = async () => {
    const id = await createResume('Untitled Resume');
    navigate(`/editor/${id}`);
  };
  
  const filteredResumes = resumes.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.data.basics.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      
      {/* --- Bento Grid Header Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* 1. Welcome Tile */}
        <BentoCard className="md:col-span-2 relative p-8 flex flex-col justify-between min-h-[220px] group" delay={0.1}>
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                <Sparkles size={120} className="text-primary-500 blur-2xl" />
            </div>
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    {greeting}, {user?.name?.split(' ')[0] || 'Creator'}
                </h1>
                <p className="text-lg text-gray-400 max-w-md">
                    Ready to craft your next career milestone? You have <span className="text-white font-semibold">{resumes.length}</span> resumes.
                </p>
            </div>
            <div className="mt-6 flex gap-4">
                 <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
                    <Clock size={14} className="text-primary-400" />
                    <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                 </div>
            </div>
        </BentoCard>

        {/* 2. Quick Action Tile */}
        <BentoCard className="relative p-8 flex flex-col justify-center items-center text-center cursor-pointer group bg-gradient-to-br from-primary-900/40 to-[#1a1a1a] hover:from-primary-900/60" delay={0.2}>
            <div onClick={handleCreateNew} className="absolute inset-0 z-10" />
            <div className="w-20 h-20 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30 group-hover:scale-110 transition-transform duration-300">
                <Plus size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create New</h2>
            <p className="text-sm text-gray-400">Start from scratch or pick a template</p>
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="text-white" />
            </div>
        </BentoCard>
      </div>

      {/* --- Main Content Section --- */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8 px-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutTemplate className="text-gray-500" /> 
            Your Resumes
        </h2>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search your documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 shadow-inner"
            />
        </div>
      </div>

      {/* Resume Grid */}
      {filteredResumes.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Search size={64} className="mb-4 text-gray-600" />
              <p className="text-xl text-gray-400">No resumes found for "{searchQuery}"</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">

            {filteredResumes.map((resume, index) => (
            <ResumeCard 
                key={resume.id} 
                index={index}
                resume={resume} 
                onEdit={(id) => navigate(`/editor/${id}`)}
                onDelete={deleteResume}
                onDuplicate={duplicateResume}
                onPublish={publishTemplate}
            />
            ))}
        </div>
      )}
    </div>
  );
};