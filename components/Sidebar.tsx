import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, ShoppingBag, Settings, BookOpen, 
  Library, Calendar, BarChart2, Users, GraduationCap, ChevronRight,
  Layers, PenTool, CreditCard, Sparkles, HelpCircle, X, Search,
  ChevronDown, PlusCircle, LogOut, Sun, Moon, Briefcase, Target, BrainCircuit
} from 'lucide-react';
import { View } from '../types';

interface NavItem {
  id?: View;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  badge?: string;
  isExternal?: boolean;
}

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  apiStatus?: 'checking' | 'connected' | 'error';
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, apiStatus = 'connected' }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['My Projects', 'Research Suite']);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label) 
        : [...prev, label]
    );
  };

  const navSections: { title: string, items: NavItem[] }[] = [
    {
      title: 'Main',
      items: [
        { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { 
            label: 'My Projects', 
            icon: FileText,
            subItems: [
                { id: View.DOCUMENTS, label: 'All Documents', icon: FileText },
                { id: View.CALENDAR, label: 'Timeline & Tasks', icon: Calendar },
            ]
        },
      ]
    },
    {
      title: 'Academic Suite',
      items: [
        { 
          label: 'Research Engine', 
          icon: Sparkles,
          subItems: [
             { id: View.TOOLKIT, label: 'Scholar Toolkit', icon: PenTool },
             { id: View.RESEARCH, label: 'References Library', icon: BookOpen },
             { id: View.SYNTHESIS, label: 'Lit. Synthesis', icon: BrainCircuit, badge: 'New' },
             { id: View.JOURNAL_MATCHER, label: 'Journal Matcher', icon: Target },
             { id: View.ANALYTICS, label: 'Writing Analytics', icon: BarChart2 },
          ]
        },
        { 
          label: 'Campus & Market', 
          icon: Library,
          subItems: [
             { id: View.TEMPLATES, label: 'University Templates', icon: Layers },
             { id: View.MARKETPLACE, label: 'Expert Marketplace', icon: ShoppingBag, badge: 'Hot' },
             { id: View.COMMUNITY, label: 'Scholar Community', icon: Users, badge: 'Beta' },
          ]
        }
      ]
    },
    {
      title: 'Settings',
      items: [
        { id: View.PRICING, label: 'Subscription', icon: CreditCard },
        { 
            label: 'System',
            icon: Settings,
            subItems: [
                { id: View.SETTINGS, label: 'Preferences', icon: Settings },
                { id: View.HELP, label: 'Help & Support', icon: HelpCircle },
            ]
        }
      ]
    }
  ];

  // Auto-expand group if active child
  useEffect(() => {
    navSections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems && item.subItems.some(sub => sub.id === currentView)) {
          setExpandedGroups(prev => Array.from(new Set([...prev, item.label])));
        }
      });
    });
  }, [currentView]);

  // Filter items based on search
  const filterItems = (items: NavItem[]): NavItem[] => {
    if (!searchTerm) return items;
    return items.reduce((acc: NavItem[], item) => {
      const matches = item.label.toLowerCase().includes(searchTerm.toLowerCase());
      const subMatches = item.subItems ? filterItems(item.subItems) : [];
      
      if (matches || subMatches.length > 0) {
        acc.push({
          ...item,
          subItems: subMatches.length > 0 ? subMatches : item.subItems,
          // Force expand if searching
        });
        if (!expandedGroups.includes(item.label) && item.subItems) {
            setExpandedGroups(prev => [...prev, item.label]);
        }
      }
      return acc;
    }, []);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed md:relative z-50 h-full w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800 bg-slate-900">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onChangeView(View.DASHBOARD)}>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-lg text-white shadow-lg shadow-teal-900/50">
              <GraduationCap size={24} />
            </div>
            <div>
              <span className="text-xl font-bold font-serif tracking-tight text-white block">ThesisAI</span>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Scholar Edition</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Jump to..." 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6 custom-scrollbar">
          {navSections.map((section, idx) => {
             const filtered = filterItems(section.items);
             if (filtered.length === 0) return null;

             return (
                <div key={idx} className="animate-fade-in">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
                    {section.title}
                    <div className="h-px bg-slate-800 flex-1"></div>
                </h3>
                <div className="space-y-0.5">
                    {filtered.map((item) => {
                    const Icon = item.icon;
                    const isExpanded = expandedGroups.includes(item.label);
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isActive = !hasSubItems && currentView === item.id;
                    const isChildActive = hasSubItems && item.subItems?.some(sub => sub.id === currentView);

                    return (
                        <div key={item.label}>
                        <button
                            onClick={() => {
                            if (hasSubItems) {
                                toggleGroup(item.label);
                            } else if (item.id) {
                                onChangeView(item.id);
                                if (window.innerWidth < 768) onClose();
                            }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                            isActive 
                                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/20' 
                                : isChildActive 
                                ? 'text-white'
                                : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
                            }`}
                        >
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r"></div>}
                            
                            <div className="flex items-center space-x-3 flex-1">
                            <Icon size={18} className={`${isActive || isChildActive ? 'text-white' : 'text-slate-500 group-hover:text-teal-400'} transition-colors`} />
                            <span className={`text-sm ${isActive || isChildActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                            {item.badge && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isActive ? 'bg-teal-500 text-white' : 'bg-teal-900/50 text-teal-200 border border-teal-800'}`}>
                                    {item.badge}
                                </span>
                            )}
                            </div>
                            {hasSubItems && (
                            <div className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-slate-300' : ''}`}>
                                <ChevronRight size={14} />
                            </div>
                            )}
                        </button>

                        {/* Sub Items */}
                        {hasSubItems && isExpanded && (
                            <div className="mt-1 ml-3 pl-3 border-l border-slate-700/50 space-y-0.5 animate-fade-in-down">
                                {item.subItems?.map(sub => {
                                const SubIcon = sub.icon;
                                const isSubActive = currentView === sub.id;
                                return (
                                    <button
                                        key={sub.label}
                                        onClick={() => {
                                        if (sub.id) {
                                            onChangeView(sub.id);
                                            if (window.innerWidth < 768) onClose();
                                        }
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                                        isSubActive 
                                            ? 'text-teal-400 bg-slate-800/80 font-medium' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                        <div className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-teal-400' : 'bg-slate-600 group-hover:bg-slate-400'}`}></div>
                                        <span className="text-xs">{sub.label}</span>
                                        </div>
                                        {sub.badge && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isSubActive ? 'bg-teal-900 text-teal-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                                                {sub.badge}
                                            </span>
                                        )}
                                    </button>
                                )
                                })}
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>
                </div>
            )
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm space-y-3">
          
          {/* Theme & Logout */}
          <div className="flex items-center justify-between px-1">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
             >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
             </button>
             <button className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors">
                <LogOut size={16} />
             </button>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3">
             <div className="relative">
                <img 
                    src="https://i.pravatar.cc/150?img=11" 
                    alt="User" 
                    className="w-9 h-9 rounded-full border border-slate-600"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-slate-800 rounded-full transition-colors ${
                    apiStatus === 'connected' ? 'bg-green-500' : 
                    apiStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                }`} title={apiStatus === 'connected' ? 'AI Connected' : apiStatus === 'error' ? 'AI Error' : 'Connecting...'}></div>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Edwin O.</p>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 px-1.5 rounded font-medium border border-teal-500/20">PRO Plan</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};