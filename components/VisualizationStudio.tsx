import React, { useState } from 'react';
import { 
  Image as ImageIcon, Video, Sparkles, Download, 
  RefreshCw, AlertCircle, Info, Lock, CheckCircle2
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';

export const VisualizationStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setResultUrl(null);
    setIsLoading(true);
    setStatus('Initializing AI engines...');

    try {
      if (activeTab === 'image') {
        const url = await GeminiService.generateImage(prompt);
        setResultUrl(url);
      } else {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          const proceed = window.confirm("Cinematic video (Veo) requires a paid API key. Proceed to selection?");
          if (proceed) {
             await (window as any).aistudio.openSelectKey();
          } else {
             setIsLoading(false);
             return;
          }
        }
        
        const url = await GeminiService.generateVideo(prompt, (s) => setStatus(s));
        if (url) setResultUrl(url);
        else alert("Synthesis failed. Check your billing limits.");
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        alert("API Key selection reset. Please select again.");
        await (window as any).aistudio.openSelectKey();
      } else {
        alert("Unexpected synthesis error.");
      }
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2 flex items-center gap-3 justify-center md:justify-start">
            <Sparkles className="text-blue-500" size={36} /> Visualization Studio
          </h1>
          <p className="text-lg text-slate-500 max-w-lg font-medium">
            Generate cinematic figures and research animations for high-impact presentations.
          </p>
        </div>
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm shrink-0">
           <button 
             onClick={() => { setActiveTab('image'); setResultUrl(null); }}
             className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
           >
             <ImageIcon size={18}/> Figures
           </button>
           <button 
             onClick={() => { setActiveTab('video'); setResultUrl(null); }}
             className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'video' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
           >
             <Video size={18}/> Animations
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Input */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Visualization Brief</label>
                <textarea 
                  className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none text-slate-800 placeholder:text-slate-400 font-serif leading-relaxed text-sm"
                  placeholder={activeTab === 'image' 
                    ? "E.g. A high-fidelity diagram of a molecular structure, bioluminescent gradients, academic white background..." 
                    : "E.g. A rotating 3D model of a complex data cluster, glowing sky blue nodes, deep depth of field..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={22} />}
                {isLoading ? (status || 'Rendering...') : `Generate Masterpiece`}
              </button>
           </div>

           <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-4 shadow-sm">
              <Info className="text-blue-600 shrink-0" size={24} />
              <div className="space-y-1">
                 <h4 className="text-sm font-bold text-blue-900">Academic Citation</h4>
                 <p className="text-xs text-blue-700 leading-relaxed font-medium">
                   All generated media should be explicitly cited as "AI-Generated Concept Visualization" in formal manuscripts.
                 </p>
              </div>
           </div>
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-8">
           {!resultUrl && !isLoading ? (
             <div className="aspect-video bg-white rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 group hover:border-blue-300 transition-all duration-500 hover:bg-blue-50/30">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-5 transition-all group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl group-hover:text-blue-600">
                   {activeTab === 'image' ? <ImageIcon size={36} /> : <Video size={36} />}
                </div>
                <p className="font-bold text-sm tracking-tight">Your AI visualization will appear here</p>
                <p className="text-xs mt-1 text-slate-400">Describe your concept in the brief section to start.</p>
             </div>
           ) : isLoading ? (
             <div className="aspect-video bg-slate-900 rounded-[32px] flex flex-col items-center justify-center text-white relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-indigo-900/40"></div>
                <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8 relative z-10"></div>
                <p className="text-2xl font-serif italic animate-pulse z-10 text-blue-100">{status || 'Synthesizing pixels...'}</p>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] mt-6 text-slate-400 z-10 opacity-60">Engine: ScholarSync Veo-3.1</p>
             </div>
           ) : (
             <div className="space-y-6 animate-scale-in">
                <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative group p-3">
                   <div className="rounded-[32px] overflow-hidden bg-slate-50 border border-slate-100">
                     {activeTab === 'image' ? (
                       <img src={resultUrl!} className="w-full h-auto object-contain" alt="Visualization" />
                     ) : (
                       <video src={resultUrl!} className="w-full h-auto" controls autoPlay loop />
                     )}
                   </div>
                   
                   <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                     <a 
                       href={resultUrl!} 
                       download={`scholar-visual-${Date.now()}`}
                       className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl hover:bg-white text-slate-900 transition-all active:scale-90"
                     >
                       <Download size={24} />
                     </a>
                   </div>
                </div>
                <div className="flex justify-between items-center px-4">
                   <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <CheckCircle2 size={14} className="text-emerald-500" /> High-Resolution Output (1080p)
                   </div>
                   <button 
                     onClick={() => setResultUrl(null)}
                     className="text-blue-600 hover:text-blue-700 font-black text-xs flex items-center gap-2 group"
                   >
                     <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" /> New Iteration
                   </button>
                </div>
             </div>
           )}

           {activeTab === 'video' && !resultUrl && !isLoading && (
              <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 shadow-sm animate-fade-in">
                 <Lock className="text-amber-600 shrink-0" size={24} />
                 <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Veo generation uses premium API units. We recommend reviewing the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-bold hover:text-amber-900">pricing guide</a> for large projects.
                 </p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};