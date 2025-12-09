
import React, { useState } from 'react';
import { 
  Search, BookOpen, ExternalLink, RefreshCw, Filter, 
  History, Bookmark, Globe, Target, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Journal } from '../types';

export const JournalMatcher: React.FC = () => {
  const [abstract, setAbstract] = useState('');
  const [results, setResults] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([
    "AI in Healthcare adoption in East Africa",
    "Sustainable supply chain management practices"
  ]);
  const [savedJournals, setSavedJournals] = useState<Journal[]>([]);
  
  // Filter States
  const [filterOpenAccess, setFilterOpenAccess] = useState(false);
  const [filterMinImpact, setFilterMinImpact] = useState(0);

  const handleSearch = async () => {
    if (!abstract.trim()) return;
    setIsLoading(true);
    // Add to history if unique
    if (!history.includes(abstract.substring(0, 50) + "...")) {
       setHistory(prev => [abstract.substring(0, 50) + "...", ...prev.slice(0, 9)]);
    }
    
    try {
      const data = await GeminiService.findJournals(abstract);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = (journal: Journal) => {
    if (savedJournals.some(j => j.name === journal.name)) {
      setSavedJournals(prev => prev.filter(j => j.name !== journal.name));
    } else {
      setSavedJournals(prev => [...prev, journal]);
    }
  };

  const filteredResults = results.filter(j => {
    const impact = parseFloat(j.impactFactor);
    if (filterOpenAccess && !j.openAccess) return false;
    if (filterMinImpact > 0 && !isNaN(impact) && impact < filterMinImpact) return false;
    return true;
  });

  return (
    <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden">
      
      {/* Journal Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-4 border-b border-slate-200">
           <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <Target className="text-indigo-600" size={20} /> Matcher
           </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {/* Filters */}
           <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Filter size={12} /> Preferences
              </h3>
              <div className="space-y-3">
                 <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      checked={filterOpenAccess}
                      onChange={(e) => setFilterOpenAccess(e.target.checked)}
                    />
                    <span>Open Access Only</span>
                 </label>
                 
                 <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                       <span>Min. Impact Factor</span>
                       <span>{filterMinImpact}+</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5"
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      value={filterMinImpact}
                      onChange={(e) => setFilterMinImpact(parseFloat(e.target.value))}
                    />
                 </div>
              </div>
           </div>

           {/* History */}
           <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <History size={12} /> Recent Searches
              </h3>
              <div className="space-y-2">
                 {history.map((item, idx) => (
                    <button 
                      key={idx}
                      className="w-full text-left text-xs text-slate-600 hover:text-indigo-600 truncate py-1.5 px-2 hover:bg-indigo-50 rounded transition-colors"
                      onClick={() => setAbstract(item)} // Basic fill
                    >
                       {item}
                    </button>
                 ))}
              </div>
           </div>

           {/* Saved */}
           {savedJournals.length > 0 && (
             <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <Bookmark size={12} /> Saved Journals
                </h3>
                <div className="space-y-2">
                   {savedJournals.map((j, idx) => (
                      <div key={idx} className="bg-indigo-50 p-2 rounded border border-indigo-100 text-xs">
                         <div className="font-bold text-indigo-900 line-clamp-1">{j.name}</div>
                         <div className="text-indigo-600">IF: {j.impactFactor}</div>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         <div className="p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                   <h1 className="text-3xl font-serif font-bold text-slate-900 mb-3">Find the Perfect Home for Your Research</h1>
                   <p className="text-slate-600">Paste your abstract below. Our AI analyzes scope, impact factor, and acceptance trends to recommend the best journals.</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8">
                   <textarea 
                      className="w-full h-32 p-3 text-sm text-slate-700 border-none resize-none focus:ring-0 placeholder:text-slate-400"
                      placeholder="Paste your abstract here (e.g. 'This study investigates the correlation between...')"
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                   />
                   <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400">{abstract.length} characters</span>
                      <button 
                        onClick={handleSearch}
                        disabled={isLoading || !abstract}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
                      >
                        {isLoading ? <RefreshCw className="animate-spin" size={16}/> : <Search size={16}/>}
                        Find Journals
                      </button>
                   </div>
                </div>

                {/* Results Area */}
                {results.length > 0 && (
                   <div className="space-y-6 animate-fade-in-up">
                      <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-800">Recommended Journals ({filteredResults.length})</h3>
                         <div className="text-xs text-slate-500">Sorted by relevance</div>
                      </div>

                      <div className="grid gap-4">
                         {filteredResults.map((journal, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
                               <div className="flex justify-between items-start mb-3">
                                  <div>
                                     <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{journal.name}</h4>
                                     <p className="text-sm text-slate-500">{journal.publisher}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <div className="flex flex-col items-end">
                                        <span className="text-2xl font-bold text-indigo-600">{journal.matchScore}%</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Match</span>
                                     </div>
                                     <button 
                                       onClick={() => toggleSave(journal)}
                                       className={`p-2 rounded-full hover:bg-slate-100 ${savedJournals.some(j => j.name === journal.name) ? 'text-indigo-600' : 'text-slate-300'}`}
                                     >
                                        <Bookmark size={20} fill={savedJournals.some(j => j.name === journal.name) ? 'currentColor' : 'none'} />
                                     </button>
                                  </div>
                               </div>

                               <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                  "{journal.matchReason}"
                               </p>

                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                  <div>
                                     <span className="block text-xs text-slate-400 font-bold uppercase">Impact Factor</span>
                                     <span className="font-semibold text-slate-800">{journal.impactFactor}</span>
                                  </div>
                                  <div>
                                     <span className="block text-xs text-slate-400 font-bold uppercase">Acceptance</span>
                                     <span className="font-semibold text-slate-800">{journal.acceptanceRate || 'Unknown'}</span>
                                  </div>
                                  <div>
                                     <span className="block text-xs text-slate-400 font-bold uppercase">Open Access</span>
                                     <span className={`font-semibold ${journal.openAccess ? 'text-green-600' : 'text-slate-800'}`}>
                                        {journal.openAccess ? 'Available' : 'Optional/No'}
                                     </span>
                                  </div>
                                  <div>
                                     <span className="block text-xs text-slate-400 font-bold uppercase">Scope</span>
                                     <span className="font-semibold text-slate-800 truncate block" title={journal.scope}>{journal.scope}</span>
                                  </div>
                               </div>

                               {journal.website && (
                                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                                     <a 
                                       href={journal.website} 
                                       target="_blank" 
                                       rel="noreferrer" 
                                       className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                     >
                                        Visit Journal Website <ExternalLink size={12} />
                                     </a>
                                  </div>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                )}
                
                {results.length === 0 && !isLoading && abstract && (
                   <div className="text-center py-12 text-slate-400">
                      <Search className="mx-auto mb-2 opacity-50" size={48} />
                      <p>No journals found yet. Try adjusting your abstract.</p>
                   </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};
