
import React from 'react';

const DrawerUI: React.FC = () => {
  return (
    <div className="h-full p-6 flex flex-col bg-white">
      <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Research Notes</h2>
      <textarea 
        className="flex-1 w-full border border-slate-200 rounded-lg p-4 resize-none focus:ring-2 focus:ring-teal-500 outline-none text-sm leading-relaxed" 
        placeholder="Draft your thoughts here..."
      />
      <div className="mt-4 flex justify-end">
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors">
          Save to Thesis
        </button>
      </div>
    </div>
  );
};

export default DrawerUI;
