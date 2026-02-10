import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

const SidebarUI: React.FC = () => {
  return (
    <div className="p-4 text-slate-700 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 text-teal-700 font-bold">
        <Sparkles size={18} />
        <span>ThesisAI Companion</span>
      </div>
      
      <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200">
        <h4 className="text-sm font-semibold mb-2">Quick Actions</h4>
        <button className="w-full text-left px-3 py-2 text-sm bg-white border border-slate-200 rounded hover:bg-teal-50 hover:border-teal-200 transition-colors mb-2 flex items-center gap-2">
          <BookOpen size={14} /> Summarize Selection
        </button>
        <button className="w-full text-left px-3 py-2 text-sm bg-white border border-slate-200 rounded hover:bg-teal-50 hover:border-teal-200 transition-colors flex items-center gap-2">
          <Sparkles size={14} /> Find Similar Papers
        </button>
      </div>
    </div>
  );
};

export default SidebarUI;
