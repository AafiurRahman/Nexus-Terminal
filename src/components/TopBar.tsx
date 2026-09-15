import { ArrowRightLeft, Bell, Database, Globe, LineChart, Search, Settings, User } from "lucide-react";
import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { SettingsModal } from "./SettingsModal";

export function TopBar({ 
  onSearch,
  layoutFormat,
  setLayoutFormat
}: { 
  onSearch?: (sym: string) => void;
  layoutFormat: 'default' | 'grid' | 'minimal';
  setLayoutFormat: (fmt: 'default' | 'grid' | 'minimal') => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim().toUpperCase());
      searchQuery && setSearchQuery('');
    }
  };

  return (
    <>
    <div className="h-12 border-b border-border-subtle bg-bg-panel flex items-center px-4 justify-between select-none shrink-0 z-10 w-full relative">
      <div className="flex items-center gap-6">
        <div className="text-blue-400 font-bold tracking-tighter text-sm flex items-center gap-2 uppercase">
          <div className="w-6 h-6 bg-blue-600 text-text-primary rounded-sm flex items-center justify-center font-bold text-[14px]">Δ</div>
          ARBAnalytics
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center bg-bg-base border border-border-subtle rounded px-3 py-1 w-96 transition-colors focus-within:border-gray-400">
          <Search className="w-3 h-3 text-text-muted mr-2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets, news, functions..." 
            className="bg-transparent border-none text-[11px] text-text-primary w-full focus:outline-none font-mono placeholder:opacity-50"
          />
        </form>
      </div>

      <div className="flex items-center gap-4 text-text-muted">
        <div className="flex gap-1 items-center mr-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-[10px] font-mono text-green-500 uppercase">{auth.currentUser?.email || 'Secure-Link Active'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="hover:text-text-primary transition-colors"><Database className="w-4 h-4" /></button>
          <button className="hover:text-text-primary transition-colors"><LineChart className="w-4 h-4" /></button>
          <button className="hover:text-text-primary transition-colors"><ArrowRightLeft className="w-4 h-4" /></button>
          <button className="hover:text-text-primary transition-colors"><Bell className="w-4 h-4" /></button>
          <button onClick={() => setIsSettingsOpen(true)} className="hover:text-text-primary transition-colors"><Settings className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
    <SettingsModal 
       isOpen={isSettingsOpen} 
       onClose={() => setIsSettingsOpen(false)} 
       layoutFormat={layoutFormat}
       setLayoutFormat={setLayoutFormat}
    />
    </>
  );
}
