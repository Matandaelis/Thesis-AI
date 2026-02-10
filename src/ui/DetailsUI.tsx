import React from 'react';

const DetailsUI: React.FC = () => {
  return (
    <div className="p-4 border-t border-slate-200">
      <h4 className="font-bold text-slate-800 text-sm mb-2">AI Analysis</h4>
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Relevance: High</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Citations: 45</span>
      </div>
    </div>
  );
};

export default DetailsUI;
