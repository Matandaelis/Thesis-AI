import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, Settings, BookOpen, 
  Calendar, BarChart2, GraduationCap, ChevronRight,
  Sparkles, HelpCircle, X, Search, LogOut, Globe, Image as ImageIcon
} from 'lucide-react';
import { View } from '../types';
import { ACTIVE_BRAND } from '../lib/brand';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  apiStatus: 'checking' | 'connected' | 'error';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, apiStatus }) => {
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

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/20 z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed md:relative z-50 h-full w-64 bg-white text-slate-600 flex flex-col border-r border-slate-200 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 gap-3 shrink-0 border-b border-slate-50">
          <div className={`bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-600/20`}>
            <BrandLogo size={20} />
          </div>
          <span className="text-lg font-bold font-serif text-slate-900 tracking-tight">{ACTIVE_BRAND.name}</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-7">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onChangeView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${currentView === item.id ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <item.icon size={18} className={currentView === item.id ? `text-blue-600` : 'text-slate-400'} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-slate-200 shadow-sm">
             <div className="relative">
                <img src="https://i.pravatar.cc/100?img=11" className="w-8 h-8 rounded-full" alt="User" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">Edwin O.</p>
                <p className="text-[10px] text-slate-500 font-medium">Premium Scholar</p>
             </div>
             <button className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
};