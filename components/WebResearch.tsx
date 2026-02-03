
import React, { useState } from 'react';
import { Search, Globe, ExternalLink, RefreshCw, BookOpen, Sparkles, AlertCircle, Quote } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { WebResearchResponse } from '../types';

export const WebResearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WebResearchResponse | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const data = await GeminiService.searchWebAcademic(query);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Latest NACOSTI licensing requirements 2024",
    "UoN PhD thesis formatting updates for 2024",
    "Impact of mobile banking in rural Kenya research papers",
    "Current JKUAT graduate student registration deadlines"
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-4 flex items-center justify-center gap-3">
          <Globe className="text-indigo-600" size={32} /> Web Research Assistant
        </h1>
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
          Query the academic web for real-time information, policy updates, and institutional announcements with verified grounding.
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-white rounded-xl shadow-lg border border-zinc-200 p-2">
            <input 
              type="text" 
              className="flex-1 pl-4 pr-4 py-3 bg-transparent outline-none text-zinc-800 placeholder:text-zinc-400"
              placeholder="Ask anything about Kenyan academic policies or research..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="bg-zinc-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => { setQuery(s); }}
              className="text-[10px] md:text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-full border border-zinc-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-bold animate-pulse">Scanning academic portals and web results...</p>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-fade-in-up">
          {/* AI Answer Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> AI Synthesized Result
            </div>
            <div className="prose prose-zinc max-w-none text-zinc-800 leading-relaxed font-serif whitespace-pre-wrap">
              {result.answer}
            </div>
          </div>

          {/* Sources Section */}
          <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Quote size={16} className="text-indigo-600" /> Verified Web Sources
            </h3>
            {result.sources.length === 0 ? (
               <div className="flex items-center gap-2 text-zinc-400 italic text-sm">
                  <AlertCircle size={14} /> No specific links were extracted for this response.
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noreferrer"
                      className="group flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200 hover:border-indigo-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-bold text-zinc-800 truncate group-hover:text-indigo-700">{source.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{source.uri}</p>
                      </div>
                      <ExternalLink size={14} className="text-zinc-300 group-hover:text-indigo-500 shrink-0" />
                    </a>
                  ))}
               </div>
            )}
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="mt-20 text-center border-2 border-dashed border-zinc-200 rounded-3xl p-12 bg-white">
           <BookOpen className="mx-auto mb-4 text-zinc-200" size={64} />
           <h3 className="text-xl font-bold text-zinc-400">Knowledge is at your fingertips</h3>
           <p className="text-zinc-400 text-sm max-w-xs mx-auto mt-2">Enter a research question or topic above to fetch live data from the world wide web.</p>
        </div>
      )}
    </div>
  );
};
