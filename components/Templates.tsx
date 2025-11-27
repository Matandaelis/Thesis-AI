import React from 'react';
import { University } from '../types';
import { School, ArrowRight } from 'lucide-react';

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
  return (
    <div className="p-8 max-w-6xl mx-auto">
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
            onClick={() => onSelect(uni)}
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
    </div>
  );
};