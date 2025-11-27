
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, ShoppingBag, Settings, BookOpen, 
  Library, Calendar, BarChart2, Users, GraduationCap, ChevronRight,
  Layers, PenTool, Database, Briefcase, X
} from 'lucide-react';
import { View } from '../types';

interface NavItem {
  id?: View;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Research Suite', 'Scholar Tools']);

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
        { id: View.EDITOR, label: 'My Documents', icon: FileText },
        { id: View.CALENDAR, label: 'Deadlines', icon: Calendar },
      ]
    },
    {
      title: 'Scholar Tools',
      items: [
         { id: View.TOOLKIT, label: 'Toolkit (New)', icon: PenTool },
         { 
          label: 'Research Suite', 
          icon: Library,
          subItems: [
             { id: View.RESEARCH, label: 'Library', icon: BookOpen },
             { id: View.ANALYTICS, label: 'Analytics', icon: BarChart2 },
             { id: View.TEMPLATES, label: 'Templates', icon: Layers },
          ]
        },
        { 
          label: 'Community & Help', 
          icon: Users,
          subItems: [
             { id: View.MARKETPLACE, label: 'Expert Help', icon: ShoppingBag },
             { id: View.COMMUNITY, label: 'Student Hub', icon: Users },
          ]
        },
      ]
    },
    {
      title: 'System',
      items: [
        { id: View.SETTINGS, label: 'Settings', icon: Settings },
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
        fixed md:relative z-50 h-full w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-500 p-2 rounded-lg text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <span className="text-xl font-bold font-serif tracking-tight text-white block">ThesisAI</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest">Scholar</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isExpanded = expandedGroups.includes(item.label);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = !hasSubItems && currentView === item.id;
                  
                  // Check if any child is active to highlight parent
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                          isActive 
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-900/20' 
                            : isChildActive 
                              ? 'text-white bg-slate-800/50'
                              : 'hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon size={18} className={`${isActive || isChildActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                          <span className="font-medium text-sm">{item.label}</span>
                        </div>
                        {hasSubItems && (
                          <div className="text-slate-500">
                             <ChevronRight 
                               size={14} 
                               className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                             />
                          </div>
                        )}
                      </button>

                      {/* Sub Items */}
                      {hasSubItems && isExpanded && (
                         <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1 animate-fade-in-down">
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
                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                      isSubActive 
                                        ? 'text-teal-400 bg-slate-800/50 font-medium' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                                    }`}
                                  >
                                    <SubIcon size={16} className={`${isSubActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
                                    <span className="text-xs">{sub.label}</span>
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
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-slate-400 uppercase font-bold">Credits</p>
              <span className="text-xs font-mono text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">PRO</span>
            </div>
            
            <div className="flex items-end space-x-1 mb-2">
              <span className="text-2xl font-bold text-white">450</span>
              <span className="text-xs text-slate-400 mb-1">/ 2000 AI Tokens</span>
            </div>

            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full" style={{ width: '22%' }}></div>
            </div>
            <button className="w-full mt-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
