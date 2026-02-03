import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { View } from '../types';
import { ACTIVE_BRAND } from '../lib/brand';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onChangeView: (view: View) => void;
  apiStatus: 'checking' | 'connected' | 'error';
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onChangeView, apiStatus }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const BrandLogo = ACTIVE_BRAND.logo;

  if (currentView === View.EDITOR || currentView === View.LANDING) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => { onChangeView(view); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        apiStatus={apiStatus}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-30 shrink-0">
           <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <BrandLogo size={20} />
              </div>
              <span className="font-bold font-serif text-lg text-slate-800">{ACTIVE_BRAND.name}</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-2 rounded-md hover:bg-slate-100">
              <Menu size={24} />
           </button>
        </header>

        <main className="flex-1 overflow-auto relative w-full bg-slate-50/50 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};