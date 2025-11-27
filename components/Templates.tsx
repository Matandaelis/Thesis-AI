
import React, { useState } from 'react';
import { University } from '../types';
import { School, ArrowRight, X, Check, Info, Settings, Type, AlignJustify, Book } from 'lucide-react';

interface TemplatesProps {
  onSelect: (u: University) => void;
}

// Pre-defined universities
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
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Custom University State
  const [customConfig, setCustomConfig] = useState<Partial<University>>({
    name: '',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  });

  const handleConfirm = () => {
    if (selectedUni) {
        onSelect(selectedUni);
        setSelectedUni(null);
    }
  };

  const handleCustomSubmit = () => {
    if (customConfig.name && customConfig.standards) {
        const newUni: University = {
            id: `custom-${Date.now()}`,
            name: customConfig.name,
            logo: 'https://picsum.photos/100/100?grayscale',
            standards: customConfig.standards
        };
        onSelect(newUni);
        setIsCustomizing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto relative animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Select your University</h1>
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
        <div 
          onClick={() => setIsCustomizing(true)}
          className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors group"
        >
          <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 flex items-center justify-center group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
             <Settings size={32} className="text-slate-400 group-hover:text-teal-600" />
          </div>
          <h3 className="font-bold text-slate-600 group-hover:text-teal-700">Custom Institution</h3>
          <p className="text-xs text-center text-slate-500 mt-2">Manually configure font, spacing & styles</p>
          <button className="mt-6 w-full py-2 bg-transparent border border-slate-300 text-slate-500 font-medium rounded-lg group-hover:border-teal-500 group-hover:text-teal-600 transition-colors">
              Configure
          </button>
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
                          <div className="flex items-center gap-2 text-slate-600">
                              <Type size={14} /> <span>Font Family</span>
                          </div>
                          <span className="font-bold text-slate-800 font-mono">{selectedUni.standards.font}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                              <Type size={14} /> <span>Font Size</span>
                          </div>
                          <span className="font-bold text-slate-800 font-mono">{selectedUni.standards.size}pt</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                              <AlignJustify size={14} /> <span>Line Spacing</span>
                          </div>
                          <span className="font-bold text-slate-800 font-mono">{selectedUni.standards.spacing}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                              <Book size={14} /> <span>Citation Style</span>
                          </div>
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-100">{selectedUni.standards.citationStyle}</span>
                      </div>
                  </div>
              </div>

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

      {/* Custom University Modal */}
      {isCustomizing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
              <button 
                onClick={() => setIsCustomizing(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">Custom Institution</h2>
              <p className="text-sm text-slate-500 mb-6">Define your document standards manually.</p>

              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Institution Name</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="e.g. Oxford University"
                        value={customConfig.name}
                        onChange={(e) => setCustomConfig({...customConfig, name: e.target.value})}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Font Family</label>
                          <select 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
                             value={customConfig.standards?.font}
                             onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, font: e.target.value}})}
                          >
                             <option value="Times New Roman">Times New Roman</option>
                             <option value="Arial">Arial</option>
                             <option value="Calibri">Calibri</option>
                             <option value="Helvetica">Helvetica</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Font Size</label>
                          <select 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
                             value={customConfig.standards?.size}
                             onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, size: e.target.value}})}
                          >
                             <option value="10">10pt</option>
                             <option value="11">11pt</option>
                             <option value="12">12pt</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Line Spacing</label>
                          <select 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
                             value={customConfig.standards?.spacing}
                             onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, spacing: e.target.value}})}
                          >
                             <option value="1.0">Single (1.0)</option>
                             <option value="1.5">1.5 Lines</option>
                             <option value="Double">Double (2.0)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Citation Style</label>
                          <select 
                             className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
                             value={customConfig.standards?.citationStyle}
                             onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, citationStyle: e.target.value}})}
                          >
                             <option value="APA 7th">APA 7th</option>
                             <option value="Harvard">Harvard</option>
                             <option value="MLA 9">MLA 9</option>
                             <option value="IEEE">IEEE</option>
                             <option value="Chicago">Chicago</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setIsCustomizing(false)}
                    className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCustomSubmit}
                    disabled={!customConfig.name}
                    className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> Save & Apply
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
