
import React, { useState } from 'react';
import { LibraryItem } from '../types';
import { GeminiService } from '../services/geminiService';
import { 
  CheckSquare, Square, FileText, BrainCircuit, PenTool, 
  ArrowRight, RefreshCw, Copy, Sparkles, AlertCircle
} from 'lucide-react';

interface SynthesisToolProps {
  items: LibraryItem[];
}

export const SynthesisTool: React.FC<SynthesisToolProps> = ({ items }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<'analysis' | 'draft'>('analysis');
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSynthesize = async (targetMode: 'thematic' | 'draft') => {
    if (selectedIds.size < 2) {
        alert("Please select at least 2 papers to synthesize.");
        return;
    }
    
    setIsProcessing(true);
    setMode(targetMode === 'thematic' ? 'analysis' : 'draft');
    
    // Filter selected items
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    
    try {
      const result = await GeminiService.synthesizeLibraryItems(selectedItems, targetMode);
      setOutput(result);
    } catch (e) {
      console.error(e);
      setOutput("Error generating synthesis.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden">
      
      {/* Left Panel: Selection */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
           <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <BrainCircuit className="text-teal-600" size={20} /> Lit. Synthesis
           </h2>
           <p className="text-xs text-slate-500 mt-1">Select papers to analyze collectively.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
           {items.length === 0 ? (
               <div className="p-4 text-center text-slate-400 text-sm italic">Library is empty.</div>
           ) : items.map(item => (
               <div 
                 key={item.id} 
                 onClick={() => toggleSelection(item.id)}
                 className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group ${selectedIds.has(item.id) ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
               >
                  <div className={`mt-0.5 ${selectedIds.has(item.id) ? 'text-teal-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {selectedIds.has(item.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${selectedIds.has(item.id) ? 'text-teal-900' : 'text-slate-700'}`}>{item.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{item.author} • {item.year}</p>
                  </div>
               </div>
           ))}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-medium mb-2">
                <span>Selected: {selectedIds.size}</span>
                {selectedIds.size > 0 && <button onClick={() => setSelectedIds(new Set())} className="text-red-500 hover:underline">Clear</button>}
            </div>
            <button 
                onClick={() => handleSynthesize('thematic')}
                disabled={selectedIds.size < 2 || isProcessing}
                className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
            >
                {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                Thematic Analysis
            </button>
            <button 
                onClick={() => handleSynthesize('draft')}
                disabled={selectedIds.size < 2 || isProcessing}
                className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
            >
                {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <PenTool size={16}/>}
                Draft Review
            </button>
        </div>
      </div>

      {/* Right Panel: Workspace */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
          {/* Output Header */}
          <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${mode === 'analysis' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>Analysis</span>
                  <ArrowRight size={14} className="text-slate-300" />
                  <span className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${mode === 'draft' ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}>Draft Builder</span>
              </div>
              {output && (
                  <button onClick={() => { navigator.clipboard.writeText(output); alert("Copied!"); }} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold">
                      <Copy size={14} /> Copy
                  </button>
              )}
          </div>

          {/* Main Workspace Area */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              {!output && !isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <h3 className="text-lg font-bold text-slate-600 mb-2">Ready to Synthesize</h3>
                      <p className="max-w-md text-center text-sm">Select multiple papers from the sidebar and choose an action to generate insights or draft content.</p>
                  </div>
              ) : isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                      <p className="font-bold text-lg animate-pulse">Synthesizing Research...</p>
                      <p className="text-sm mt-2">This may take a moment for deep analysis.</p>
                  </div>
              ) : (
                  <div className="flex h-full gap-6">
                      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                          <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Output</span>
                              <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">Markdown</span>
                          </div>
                          {mode === 'draft' ? (
                              <textarea 
                                  className="flex-1 w-full p-6 resize-none focus:outline-none text-slate-800 leading-relaxed font-serif"
                                  value={output}
                                  onChange={(e) => setOutput(e.target.value)}
                              />
                          ) : (
                              <div className="flex-1 w-full p-6 overflow-y-auto prose prose-sm max-w-none prose-headings:font-bold prose-h2:text-indigo-800 prose-li:text-slate-700">
                                  {/* Simple markdown rendering by replacing newlines for basic display if no library used, or just raw text area if preferred. Here using generic whitespace-pre-wrap for simplicity */}
                                  <div className="whitespace-pre-wrap font-sans text-sm">{output}</div>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
