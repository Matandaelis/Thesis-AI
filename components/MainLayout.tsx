import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, Search } from 'lucide-react';
import { View } from '../types';
import { ACTIVE_BRAND } from '../lib/brand';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onChangeView: (view: View) => void;
  apiStatus: 'checking' | 'connected' | 'error';
}

const VIEW_LABELS: Partial<Record<View, string>> = {
  [View.DASHBOARD]: 'Dashboard',
  [View.DOCUMENTS]: 'My Projects',
  [View.RESEARCH]: 'Research Library',
  [View.WEB_RESEARCH]: 'Web Research',
  [View.VISUALIZATION]: 'Visual Studio',
  [View.TOOLKIT]: 'Scholar Toolkit',
  [View.ANALYTICS]: 'Analytics',
  [View.MARKETPLACE]: 'Marketplace',
  [View.SETTINGS]: 'Settings',
  [View.HELP]: 'Help Center',
  [View.TEMPLATES]: 'Templates',
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onChangeView, apiStatus }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const BrandLogo = ACTIVE_BRAND.logo;

  if (currentView === View.EDITOR || currentView === View.LANDING) {
    return <>{children}</>;
  }

  const pageTitle = VIEW_LABELS[currentView] ?? 'ScholarSync';

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { onChangeView(view); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        apiStatus={apiStatus}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full min-w-0">
        <header className="flex items-center justify-between px-4 md:px-6 py-3.5 bg-white border-b border-slate-200 shadow-sm z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="bg-blue-600 p-1 rounded-lg text-white">
                <BrandLogo size={16} />
              </div>
              <span className="font-bold font-serif text-slate-800">{ACTIVE_BRAND.name}</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-slate-900 leading-none">{pageTitle}</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">ScholarSync Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl px-3 py-2 cursor-pointer border border-slate-200">
              <Search size={14} className="text-slate-400" />
              <span className="text-sm text-slate-400 font-medium w-32">Quick search...</span>
              <kbd className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono shadow-sm">⌘K</kbd>
            </div>
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
              apiStatus === 'connected' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : apiStatus === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
              }`} />
              {apiStatus === 'connected' ? 'AI Connected' : apiStatus === 'error' ? 'AI Offline' : 'Connecting…'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative w-full bg-slate-100 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
