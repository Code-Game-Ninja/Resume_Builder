import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Button, Input, Card } from '../components/UIComponents';
import { User, Shield, Bell, Moon, LogOut, Camera, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
    const { user, setUser, updateAvatar, updateProfile, isLoading, error, signOut } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState(user?.name || '');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadError(null);
        try {
            await updateAvatar(file);
        } catch (err: any) {
            setUploadError(err.message);
        }
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await updateProfile(name.trim());
        } catch (err: any) {
            setUploadError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-full">
            <h1 className="text-3xl font-bold text-white mb-8 animate-fade-in">Settings</h1>

            <div className="space-y-6 animate-slide-up">
                {/* Profile Section */}
                <Card>
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
                        <div className="p-2 bg-primary-600/20 rounded-lg text-primary-500">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
                            <p className="text-sm text-gray-400">Manage your public profile and account details.</p>
                        </div>
                    </div>
                    
                    {(uploadError || error) && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {uploadError || error}
                        </div>
                    )}
                    
                    <div className="space-y-4 max-w-md">
                        <div className="flex items-center gap-4 mb-4">
                            <div 
                                className="relative h-20 w-20 rounded-full bg-gray-700 overflow-hidden cursor-pointer group"
                                onClick={handleAvatarClick}
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isLoading ? (
                                        <Loader2 size={24} className="text-white animate-spin" />
                                    ) : (
                                        <Camera size={24} className="text-white" />
                                    )}
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                            />
                            <div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleAvatarClick}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Uploading...' : 'Change Avatar'}
                                </Button>
                                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF or WebP. Max 5MB.</p>
                            </div>
                        </div>
                        <Input 
                            label="Display Name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input label="Email Address" defaultValue={user?.email} disabled />
                        <Button 
                            className="mt-2" 
                            onClick={handleSaveProfile}
                            disabled={saving || !name.trim() || name === user?.name}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </Card>

                {/* Preferences */}
                <Card>
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
                        <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Preferences</h2>
                            <p className="text-sm text-gray-400">Customize your workspace experience.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Moon size={20} className="text-gray-400" />
                                <div>
                                    <h4 className="text-sm font-medium text-white">Dark Mode</h4>
                                    <p className="text-xs text-gray-500">Always on for this theme</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-5" checked readOnly/>
                                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-primary-600 cursor-pointer"></label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-gray-400" />
                                <div>
                                    <h4 className="text-sm font-medium text-white">Email Notifications</h4>
                                    <p className="text-xs text-gray-500">Receive weekly digests</p>
                                </div>
                            </div>
                             <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                <div className="block overflow-hidden h-5 rounded-full bg-gray-700 cursor-pointer"></div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Danger Zone */}
                <div className="p-6 rounded-2xl border border-red-900/30 bg-red-900/5">
                     <h3 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h3>
                     <div className="flex items-center justify-between">
                         <p className="text-sm text-gray-400">Permanently delete your account and all data.</p>
                         <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={handleLogout}>
                             <LogOut size={16} className="mr-2" /> Log Out / Delete
                         </Button>
                     </div>
                </div>
            </div>
        </div>
    );
};