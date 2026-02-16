import React, { useState } from 'react';
import { X, Bot } from 'lucide-react';

const FloatingPanelUI: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-80 sm:w-64 max-h-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
      <div className="bg-slate-900 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Bot size={16} /> Thesis Assistant
        </div>
        <button onClick={() => setVisible(false)} className="text-slate-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="p-3 sm:p-4 text-xs text-slate-600 overflow-y-auto max-h-24">
        <p>I noticed you're reading about AI in Healthcare. Would you like to generate a literature matrix for this topic?</p>
      </div>
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
        <button className="text-xs font-bold text-slate-600 hover:text-slate-700 px-2 py-1 rounded transition-colors">Cancel</button>
        <button className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded transition-colors">Generate</button>
      </div>
    </div>
  );
};

export default FloatingPanelUI;