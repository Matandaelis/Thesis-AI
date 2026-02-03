
import React, { useState } from 'react';
import { University } from '../types';
import { ArrowRight, X, Check, Info, Settings, Type, AlignJustify, Book, Search } from 'lucide-react';
import { KENYAN_UNIVERSITIES } from '../lib/constants';

interface TemplatesProps {
  onSelect: (u: University) => void;
}

export const Templates: React.FC<TemplatesProps> = ({ onSelect }) => {
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
        onSelect({
            id: `custom-${Date.now()}`,
            name: customConfig.name,
            logo: 'https://picsum.photos/100/100?grayscale',
            standards: customConfig.standards
        });
        setIsCustomizing(false);
    }
  };

  const filteredUniversities = KENYAN_UNIVERSITIES.filter(uni => 
    uni.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto relative animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Select your University</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          We automatically configure margins, fonts, citation styles, and document structure to match your institution's specific guidelines.
        </p>
        <div className="max-w-md mx-auto relative">
            <input type="text" placeholder="Search your university..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => setIsCustomizing(true)} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors group min-h-[280px]">
          <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
             <Settings size={32} className="text-slate-400 group-hover:text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-600 group-hover:text-blue-700">Custom Institution</h3>
          <p className="text-xs text-center text-slate-500 mt-2">Manually configure font, spacing & styles</p>
          <button className="mt-6 w-full py-2 bg-transparent border border-slate-300 text-slate-500 font-medium rounded-lg group-hover:border-blue-500 group-hover:text-blue-600 transition-colors">Configure</button>
        </div>

        {filteredUniversities.map((uni) => (
          <div key={uni.id} onClick={() => setSelectedUni(uni)} className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-500 transition-all cursor-pointer p-6 flex flex-col items-center group">
            <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden border-2 border-white shadow-sm">
              <img src={uni.logo} alt={uni.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-2 group-hover:text-blue-700 leading-tight h-10 flex items-center">{uni.name}</h3>
            <div className="w-full mt-2 space-y-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between"><span>Font:</span> <span className="font-semibold text-slate-700">{uni.standards.font}</span></div>
              <div className="flex justify-between"><span>Size:</span> <span className="font-semibold text-slate-700">{uni.standards.size}pt</span></div>
              <div className="flex justify-between"><span>Spacing:</span> <span className="font-semibold text-slate-700">{uni.standards.spacing}</span></div>
              <div className="flex justify-between"><span>Style:</span> <span className="font-semibold text-slate-700">{uni.standards.citationStyle}</span></div>
            </div>
            <button className="mt-4 w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-colors flex items-center justify-center space-x-2 text-sm">
              <span>Select Template</span><ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {selectedUni && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative transform transition-all scale-100">
              <button onClick={() => setSelectedUni(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"><X size={20} /></button>
              <div className="flex flex-col items-center mb-6">
                 <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden border-4 border-slate-50 shadow-md"><img src={selectedUni.logo} alt={selectedUni.name} className="w-full h-full object-cover" /></div>
                 <h2 className="text-xl font-bold text-slate-900 text-center">{selectedUni.name}</h2>
                 <p className="text-sm text-slate-500 mt-1">Confirm Academic Standards</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-5 space-y-4 mb-6 border border-slate-100">
                  <div className="flex items-start gap-2 mb-2"><Info size={16} className="text-blue-600 mt-0.5" /><h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Template Configuration</h3></div>
                  <div className="divide-y divide-slate-200/50">
                      <div className="flex justify-between items-center py-2 text-sm"><div className="flex items-center gap-2 text-slate-600"><Type size={14} /> <span>Font Family</span></div><span className="font-bold text-slate-800 font-mono">{selectedUni.standards.font}</span></div>
                      <div className="flex justify-between items-center py-2 text-sm"><div className="flex items-center gap-2 text-slate-600"><Type size={14} /> <span>Font Size</span></div><span className="font-bold text-slate-800 font-mono">{selectedUni.standards.size}pt</span></div>
                      <div className="flex justify-between items-center py-2 text-sm"><div className="flex items-center gap-2 text-slate-600"><AlignJustify size={14} /> <span>Line Spacing</span></div><span className="font-bold text-slate-800 font-mono">{selectedUni.standards.spacing}</span></div>
                      <div className="flex justify-between items-center py-2 text-sm"><div className="flex items-center gap-2 text-slate-600"><Book size={14} /> <span>Citation Style</span></div><span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">{selectedUni.standards.citationStyle}</span></div>
                  </div>
              </div>
              <div className="flex gap-3">
                  <button onClick={() => setSelectedUni(null)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">Cancel</button>
                  <button onClick={handleConfirm} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"><Check size={18} /> Apply & Create</button>
              </div>
           </div>
        </div>
      )}

      {isCustomizing && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
              <button onClick={() => setIsCustomizing(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"><X size={20} /></button>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Custom Institution</h2>
              <div className="space-y-4 mt-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Institution Name</label><input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Oxford University" value={customConfig.name} onChange={(e) => setCustomConfig({...customConfig, name: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Font Family</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none" value={customConfig.standards?.font} onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, font: e.target.value}})}><option value="Times New Roman">Times New Roman</option><option value="Arial">Arial</option></select></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Font Size</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none" value={customConfig.standards?.size} onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, size: e.target.value}})}><option value="12">12pt</option><option value="11">11pt</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Line Spacing</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none" value={customConfig.standards?.spacing} onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, spacing: e.target.value}})}><option value="Double">Double</option><option value="1.5">1.5</option></select></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Citation Style</label><select className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none" value={customConfig.standards?.citationStyle} onChange={(e) => setCustomConfig({...customConfig, standards: {...customConfig.standards!, citationStyle: e.target.value}})}><option value="APA 7th">APA 7th</option><option value="MLA 9">MLA 9</option></select></div>
                  </div>
              </div>
              <div className="mt-8 flex gap-3">
                  <button onClick={() => setIsCustomizing(false)} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200">Cancel</button>
                  <button onClick={handleCustomSubmit} disabled={!customConfig.name} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"><Check size={18} /> Save & Apply</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
