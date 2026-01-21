import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/UIComponents';
import { Plus, Eye, MoreVertical, Search, Clock, Trash2, Copy, Sparkles, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ResumeCardProps {
  resume: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onEdit, onDelete, onDuplicate }) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-dark-card border border-dark-border shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-gray-700 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
      onClick={() => onEdit(resume.id)}
    >
      {/* Thumbnail Area */}
      <div className="aspect-[210/297] bg-gray-800 relative overflow-hidden">
        {resume.thumbnail ? (
          <img src={resume.thumbnail} alt={resume.name} className="w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
        ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-700 bg-[#151515]">
                 <span className="text-sm">No Preview</span>
             </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[2px] bg-black/20">
          <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); onEdit(resume.id); }}>
            Edit
          </Button>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-4 bg-[#151515] flex-1 flex flex-col justify-end">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-white truncate pr-2 flex-1" title={resume.name}>{resume.name}</h3>
          
          <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 outline-none">
                        <MoreVertical size={16} />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-[160px] bg-[#1a1a1a] rounded-lg border border-gray-800 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <DropdownMenu.Item 
                            className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-md cursor-pointer outline-none"
                            onClick={() => onEdit(resume.id)}
                        >
                            <Eye size={14} /> Open
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                            className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-md cursor-pointer outline-none"
                            onClick={() => onDuplicate(resume.id)}
                        >
                            <Copy size={14} /> Duplicate
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-gray-800 my-1" />
                        <DropdownMenu.Item 
                            className="flex items-center gap-2 px-2 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md cursor-pointer outline-none"
                            onClick={() => onDelete(resume.id)}
                        >
                            <Trash2 size={14} /> Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} />
          <span>Updated {formatDistanceToNow(new Date(resume.updatedAt))} ago</span>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { resumes, fetchResumes, createResume, deleteResume, duplicateResume, setLoading } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResumes();
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
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Manage your resumes and cover letters.</p>
        </div>
        <div className="flex gap-4">
            <Button onClick={handleCreateNew} size="lg" className="shadow-primary-600/20">
                <Plus className="mr-2" size={20} />
                New Resume
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
                type="text" 
                placeholder="Search resumes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-card border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all"
            />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-slide-up">
        {/* Create New Card (Visual shortcut) */}
        <button 
            onClick={handleCreateNew}
            className="group relative aspect-[210/297] rounded-2xl border-2 border-dashed border-gray-800 hover:border-primary-500/50 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-primary-400 h-full"
        >
            <div className="h-16 w-16 rounded-full bg-gray-800 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
                <Plus size={32} />
            </div>
            <span className="font-medium">Create New Resume</span>
        </button>

        {filteredResumes.map((resume) => (
          <ResumeCard 
            key={resume.id} 
            resume={resume} 
            onEdit={(id) => navigate(`/editor/${id}`)}
            onDelete={deleteResume}
            onDuplicate={duplicateResume}
          />
        ))}
      </div>
    </div>
  );
};