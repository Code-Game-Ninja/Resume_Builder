import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { LayoutDashboard, FileText, Settings, LogOut, User as UserIcon, Plus } from 'lucide-react';

// Simple utility function for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary-600/10 text-primary-400 shadow-inner" 
        : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
    )}
  >
    <Icon size={20} className={cn(active ? "text-primary-400" : "text-gray-500 group-hover:text-gray-300")} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);
  const signOut = useStore((state) => state.signOut);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (location.pathname === '/login') return <>{children}</>;

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-[#0f0f0f]/50 backdrop-blur-xl flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
            R
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Resumify</span>
        </div>

        <div className="space-y-2 flex-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={location.pathname === '/'} 
            onClick={() => navigate('/')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Templates" 
            active={location.pathname === '/templates'} 
            onClick={() => navigate('/templates')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={location.pathname === '/settings'} 
            onClick={() => navigate('/settings')} 
          />
        </div>

        {/* User Profile */}
        <div className="mt-auto border-t border-gray-800 pt-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
               {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'Sign in'}</p>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <LogOut size={16} className="text-gray-500 hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/10 via-transparent to-transparent pointer-events-none" />
        {children}
      </main>
    </div>
  );
};