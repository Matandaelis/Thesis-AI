import React from 'react';

const DrawerUI: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-white p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 mb-3 sm:mb-4">Research Notes</h2>
      <textarea 
        className="flex-1 w-full min-h-[200px] border border-slate-200 rounded-lg p-3 sm:p-4 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm leading-relaxed placeholder-slate-400" 
        placeholder="Draft your thoughts here..."
        aria-label="Research notes textarea"
      />
      <div className="mt-3 sm:mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Discard
        </button>
        <button className="bg-teal-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 active:bg-teal-800 transition-colors">
          Save to Thesis
        </button>
      </div>
    </div>
  );
};

export default DrawerUI;