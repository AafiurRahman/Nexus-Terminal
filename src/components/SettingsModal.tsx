import { X, Moon, Sun, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

export function SettingsModal({ 
  isOpen, 
  onClose,
  layoutFormat,
  setLayoutFormat
}: { 
  isOpen: boolean, 
  onClose: () => void,
  layoutFormat: 'default' | 'grid' | 'minimal',
  setLayoutFormat: (fmt: 'default' | 'grid' | 'minimal') => void
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial document state
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [isOpen]);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]">
      <div 
        className="w-[350px] h-full border-l border-border-subtle bg-bg-panel shadow-2xl flex flex-col overflow-y-auto animate-[slideInRight_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle bg-bg-base/50 shrink-0">
          <h2 className="text-sm font-bold tracking-widest text-text-primary uppercase">System Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 flex flex-col gap-8 flex-1">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-text-primary">Interface Theme</span>
              <span className="text-xs text-text-muted">Toggle between dark and light mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bg-panel ${
                isDark ? 'bg-blue-600' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                } flex items-center justify-center`}
              >
                {isDark ? <Moon className="w-3 h-3 text-blue-600" /> : <Sun className="w-3 h-3 text-yellow-500" />}
              </span>
            </button>
          </div>

          <div className="border-t border-border-subtle hover:border-transparent transition-colors"></div>
          
          {/* Layout Format Selection */}
          <div className="flex flex-col gap-3">
             <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-text-primary">Layout Format</span>
                <span className="text-xs text-text-muted">Select structural arrangement</span>
             </div>
             
             <div className="flex flex-col gap-2 mt-2">
               {(['default', 'grid', 'minimal'] as const).map(fmt => (
                 <label key={fmt} className={`flex items-center p-3 border rounded cursor-pointer transition-all ${layoutFormat === fmt ? 'border-blue-500 bg-blue-500/10' : 'border-border-subtle bg-bg-base/50 hover:border-border-subtle hover:bg-bg-base'}`}>
                   <input 
                     type="radio" 
                     name="layout" 
                     value={fmt} 
                     checked={layoutFormat === fmt} 
                     onChange={() => setLayoutFormat(fmt)}
                     className="hidden" 
                   />
                   <div className={`w-3 h-3 rounded-full border mr-3 flex items-center justify-center ${layoutFormat === fmt ? 'border-blue-400' : 'border-text-muted'}`}>
                     {layoutFormat === fmt && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                   </div>
                   <span className="text-sm capitalize text-text-primary">{fmt}</span>
                 </label>
               ))}
             </div>
          </div>

          <div className="border-t border-border-subtle flex-1"></div>

          {/* Account/Logout */}
           <div className="flex flex-col gap-3 shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-text-primary">Session Management</span>
              <span className="text-xs text-text-muted truncate">Signed in as {auth.currentUser?.email || 'Unknown User'}</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center justify-center w-full gap-2 px-3 py-2 mt-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded text-xs font-bold uppercase transition-all"
            >
              <LogOut className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
