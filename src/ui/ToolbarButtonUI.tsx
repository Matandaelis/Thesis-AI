import React from 'react';
import { GraduationCap } from 'lucide-react';

const ToolbarButtonUI: React.FC = () => {
  return (
    <button 
      className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-600 hover:text-teal-600"
      title="Open ThesisAI Toolkit"
      onClick={() => console.log('ThesisAI Toolkit Activated')}
    >
      <GraduationCap size={18} />
    </button>
  );
};

export default ToolbarButtonUI;
