import React from 'react';
import { 
  LayoutDashboard, FileText, Settings, BookOpen, 
  BarChart2, Sparkles, HelpCircle, X, LogOut, Globe, 
  Image as ImageIcon, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { View } from '../types';
import { ACTIVE_BRAND } from '../lib/brand';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  apiStatus: 'checking' | 'connected' | 'error';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onChangeView, isOpen, onClose, apiStatus, isCollapsed, onToggleCollapse 
}) => {
  const BrandLogo = ACTIVE_BRAND.logo;

  const sections = [
    {
      title: 'Overview',
      items: [
        { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { id: View.DOCUMENTS, label: 'My Projects', icon: FileText },
      ]
    },
    {
      title: 'Research',
      items: [
        { id: View.TOOLKIT, label: 'Scholar Toolkit', icon: Sparkles },
        { id: View.WEB_RESEARCH, label: 'Web Research', icon: Globe },
        { id: View.VISUALIZATION, label: 'Visual Studio', icon: ImageIcon },
        { id: View.RESEARCH, label: 'Library', icon: BookOpen },
        { id: View.ANALYTICS, label: 'Analytics', icon: BarChart2 },
      ]
    },
    {
      title: 'Support',
      items: [
        { id: View.SETTINGS, label: 'Settings', icon: Settings },
        { id: View.HELP, label: 'Help Center', icon: HelpCircle },
      ]
    }
  ];

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-64';

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed md:relative z-50 h-full ${sidebarWidth} bg-slate-900 text-slate-400 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-xl shadow-black/20 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="h-16 flex items-center px-4 gap-3 shrink-0 border-b border-slate-800">
          <div className="bg-blue-500 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30 shrink-0">
            <BrandLogo size={20} />
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold font-serif text-white tracking-tight truncate">{ACTIVE_BRAND.name}</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-5 space-y-6 custom-scrollbar-dark">
          {sections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-3">{section.title}</h3>
              )}
              {isCollapsed && <div className="h-px bg-slate-800 mx-2 mb-3" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.label}
                      onClick={() => onChangeView(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 rounded-xl text-sm transition-all duration-150 group relative
                        ${isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                        ${active 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <item.icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                      {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3 shrink-0 space-y-2">
          {!isCollapsed ? (
            <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50">
              <div className="relative shrink-0">
                <img src="https://i.pravatar.cc/100?img=11" className="w-8 h-8 rounded-full" alt="User" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-slate-900 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Edwin O.</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Zap size={9} className="text-amber-400" fill="currentColor" />
                  <p className="text-[10px] text-amber-400 font-semibold">Premium Scholar</p>
                </div>
              </div>
              <button className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-700">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <img src="https://i.pravatar.cc/100?img=11" className="w-8 h-8 rounded-full" alt="User" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-slate-900 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center justify-center gap-2 p-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all text-xs font-medium"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>

          <button onClick={onClose} className="md:hidden w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
};
