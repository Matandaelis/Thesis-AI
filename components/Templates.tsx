import React, { useState } from 'react';
import { University } from '../types';
import { School, ArrowRight, X, Check, Info } from 'lucide-react';

interface TemplatesProps {
  onSelect: (u: University) => void;
}

const universities: University[] = [
  {
    id: 'uon',
    name: 'University of Nairobi',
    logo: 'https://picsum.photos/100/100?random=1',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'ku',
    name: 'Kenyatta University',
    logo: 'https://picsum.photos/100/100?random=2',
    standards: { font: 'Arial', size: '11', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  {
    id: 'strath',
    name: 'Strathmore University',
    logo: 'https://picsum.photos/100/100?random=3',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'Harvard' }
  },
  {
    id: 'jkuat',
    name: 'JKUAT',
    logo: 'https://picsum.photos/100/100?random=4',
    standards: { font: 'Calibri', size: '11', spacing: 'Double', citationStyle: 'IEEE' }
  },
];

export const Templates: React.FC<TemplatesProps> = ({ onSelect }) => {
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  const handleConfirm = () => {
    if (selectedUni) {
        onSelect(selectedUni);
        setSelectedUni(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Select your University</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          We automatically configure margins, fonts, citation styles, and document structure to match your institution's specific guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {universities.map((uni) => (
          <div 
            key={uni.id}
            onClick={() => setSelectedUni(uni)}
            className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-teal-500 transition-all cursor-pointer p-6 flex flex-col items-center group"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden border-2 border-white shadow-sm">
              <img src={uni.logo} alt={uni.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-2 group-hover:text-teal-700">{uni.name}</h3>
            
            <div className="w-full mt-4 space-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Font:</span> <span className="font-semibold text-slate-700">{uni.standards.font}</span>
              </div>
              <div className="flex justify-between">
                <span>Spacing:</span> <span className="font-semibold text-slate-700">{uni.standards.spacing}</span>
              </div>
              <div className="flex justify-between">
                <span>Style:</span> <span className="font-semibold text-slate-700">{uni.standards.citationStyle}</span>
              </div>
            </div>

            <button className="mt-6 w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg group-hover:bg-teal-600 group-hover:text-white group-hover:border-transparent transition-colors flex items-center justify-center space-x-2">
              <span>Use Template</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
        
        {/* Custom Option */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors">
          <School className="text-slate-400 mb-4" size={48} />
          <h3 className="font-bold text-slate-600">Other Institution</h3>
          <p className="text-xs text-center text-slate-500 mt-2">Configure manually or upload guidelines</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedUni && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative transform transition-all scale-100">
              <button 
                onClick={() => setSelectedUni(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center mb-6">
                 <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden border-4 border-slate-50 shadow-md">
                    <img src={selectedUni.logo} alt={selectedUni.name} className="w-full h-full object-cover" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 text-center">{selectedUni.name}</h2>
                 <p className="text-sm text-slate-500 mt-1">Confirm Academic Standards</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-5 space-y-4 mb-6 border border-slate-100">
                  <div className="flex items-start gap-2 mb-2">
                      <Info size={16} className="text-teal-600 mt-0.5" />
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Template Configuration</h3>
                  </div>
                  
                  <div className="divide-y divide-slate-200/50">
                      <div className="flex justify-between items-center py-2 text-sm">
                          <span className="text-slate-600">Font Family</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedUni.standards.font}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-sm">
                          <span className="text-slate-600">Font Size</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedUni.standards.size}pt</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-sm">
                          <span className="text-slate-600">Line Spacing</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedUni.standards.spacing}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-sm">
                          <span className="text-slate-600">Citation Style</span>
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-100">{selectedUni.standards.citationStyle}</span>
                      </div>
                  </div>
              </div>

              <p className="text-xs text-slate-500 mb-6 text-center italic">
                 Do you want to apply these standards to your new document? You can manually override them later.
              </p>

              <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedUni(null)}
                    className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all"
                  >
                    <Check size={18} /> Apply & Create
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};