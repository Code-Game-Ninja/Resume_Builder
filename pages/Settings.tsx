import React, { useState, useRef, useEffect } from 'react';
import { 
    User, Shield, Bell, Moon, LogOut, Camera, Loader2, Settings as SettingsIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button, Input, Card } from '../components/UIComponents';

export const Settings = () => {
    const { user, updateAvatar, updateProfile, isLoading, error, signOut } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState(user?.name || '');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Sync name if user changes
    useEffect(() => { if(user) setName(user.name); }, [user]);

    const handleLogout = async () => { await signOut(); navigate('/login'); };
    const handleAvatarClick = () => fileInputRef.current?.click();
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError(null);
        try { await updateAvatar(file); } 
        catch (err: any) { setUploadError(err.message); }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try { await updateProfile(name.trim()); } 
        catch (err: any) { setUploadError(err.message); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    ];

    return (
        <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto pt-8 px-4 gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 shrink-0 space-y-2">
                <h1 className="text-2xl font-bold text-white mb-6 px-4">Settings</h1>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
                
                <div className="pt-8 mt-8 border-t border-white/10 px-4">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={18} /> Log Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-[500px] border-l border-white/5 pl-8 pb-20">
                <div className="max-w-3xl animate-fade-in">
                    <h2 className="text-2xl font-bold text-white mb-2">{tabs.find(t => t.id === activeTab)?.label}</h2>
                    <p className="text-gray-400 mb-8">Manage your account settings and preferences.</p>

                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <Card className="bg-[#1a1a1a]/50 border-white/5">
                                <div className="flex items-center gap-6 mb-8">
                                    <div 
                                        className="relative h-24 w-24 rounded-full bg-gray-800 overflow-hidden cursor-pointer group ring-4 ring-black"
                                        onClick={handleAvatarClick}
                                    >
                                        {user?.avatar ? ( <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> ) : 
                                        ( <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">{user?.name?.charAt(0)?.toUpperCase()}</div> )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <Button variant="outline" size="sm" onClick={handleAvatarClick}>Change Avatar</Button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        <p className="text-xs text-gray-500 mt-2">Max 5MB • JPG, PNG, WEBP</p>
                                        {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
                                    </div>
                                </div>
                                <div className="max-w-md space-y-4">
                                    <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />
                                    <Input label="Email" value={user?.email || ''} disabled />
                                    <Button onClick={handleSaveProfile} disabled={saving} className="mt-2">
                                        {saving ? 'Saving...' : 'Save Profile'}
                                    </Button>
                                    {error && <p className="text-sm text-red-500">{error}</p>}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                         <Card className="bg-[#1a1a1a]/50 border-white/5 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Moon size={20} /></div>
                                    <div><h4 className="text-white font-medium">Dark Mode</h4><p className="text-xs text-gray-500">System default</p></div>
                                </div>
                                <div className="px-3 py-1 bg-primary-600/20 text-primary-400 text-xs font-bold rounded-full border border-primary-500/20">Active</div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Bell size={20} /></div>
                                    <div><h4 className="text-white font-medium">Notifications</h4><p className="text-xs text-gray-500">Enable email alerts</p></div>
                                </div>
                                <div className="h-5 w-9 bg-gray-700 rounded-full relative"><div className="absolute left-1 top-1 h-3 w-3 bg-gray-500 rounded-full"></div></div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};