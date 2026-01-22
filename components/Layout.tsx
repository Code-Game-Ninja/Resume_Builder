import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import PillNav from './PillNav';
import { gsap } from 'gsap';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Templates', href: '/templates' },
  { label: 'ATS Checker', href: '/ats-checker' },
];

// User dropdown menu component
const UserMenu = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const signOut = useStore((state) => state.signOut);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownRef.current) {
      if (isOpen) {
        gsap.fromTo(dropdownRef.current, 
          { opacity: 0, y: -10, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
        );
      }
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
          ) : (
            <UserIcon size={14} className="text-white" />
          )}
        </div>
        <span className="text-sm font-medium text-white hidden lg:block max-w-[100px] truncate">
          {user.name || 'User'}
        </span>
        <ChevronDown size={14} className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50"
        >
          <div className="p-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-white/50 truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => { setIsOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-xl transition-colors mb-1"
            >
              <UserIcon size={14} />
              Profile & Settings
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded-xl transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();

  // Don't show navbar on login page
  if (location.pathname === '/login') return <>{children}</>;

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-gray-100 overflow-hidden flex flex-col">
      {/* PillNav - with primary color hover transition */}
      <PillNav
        items={navItems}
        logo={
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/30">
            R
          </div>
        }
        baseColor="#ef4444"
        pillColor="#1a1a1a"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#ffffff"
        initialLoadAnimation={true}
        rightContent={<UserMenu />}
      />

      {/* Main Content - Full height */}
      <main className="flex-1 overflow-auto pt-16">
        <div className="h-full w-full relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/10 via-transparent to-transparent pointer-events-none" />
          {children}
        </div>
      </main>
    </div>
  );
};