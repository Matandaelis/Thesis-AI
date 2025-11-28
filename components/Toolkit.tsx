
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  PenTool, BookOpen, Briefcase, Database, Type, FileText, 
  Globe, Clock, Table, CheckSquare, Sparkles, Presentation,
  RefreshCw, X, Copy, Terminal, Link, Microscope, Users, Eye, Calculator, Tag, Cloud,
  GitGraph, ArrowUpRight, Calendar
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { OpenCitationsService } from '../services/openCitationsService';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'Writing' | 'Research' | 'Career' | 'Data';
  status: 'Active' | 'Coming Soon';
  action?: () => void;
}

export const Toolkit: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Rich Citation Data State
  const [citationData, setCitationData] = useState<{
      metadata: any;
      counts: { incoming: number, outgoing: number };
      recentCitations: any[];
      chartData: any[];
  } | null>(null);

  // --- Handlers for Active Tools ---
  
  const handleGenericTool = async (toolId: string) => {
      if (!input) return;
      setIsLoading(true);
      const res = await GeminiService.runGenericTool(toolId, input);
      setOutput(res);
      setIsLoading(false);
  };

  const handleGrantProposal = async () => {
    if (!input) return;
    setIsLoading(true);
    const res = await GeminiService.generateGrantProposal(input);
    setOutput(res);
    setIsLoading(false);
  };

  const handleSlides = async () => {
    if (!input) return;
    setIsLoading(true);
    const res = await GeminiService.generateSlidesOutline(input);
    setOutput(res);
    setIsLoading(false);
  };

  const handleJournalMatch = async () => {
    if (!input) return;
    setIsLoading(true);
    const res = await GeminiService.matchJournals(input);
    setOutput(res);
    setIsLoading(false);
  };

  const handleLitMatrix = async () => {
    if (!input) return;
    setIsLoading(true);
    const res = await GeminiService.generateLiteratureMatrix(input);
    setOutput(res);
    setIsLoading(false);
  };

  const handleScientificCheck = async () => {
    if (!input) return;
    setIsLoading(true);
    const res = await GeminiService.checkScientificPaper(input);
    setOutput(res);
    setIsLoading(false);
  };

  const handleCitationGraph = async () => {
     if (!input) return;
     setIsLoading(true);
     setCitationData(null);
     
     try {
         // Parallel fetch for speed
         const [metadata, incoming, outgoing, recentList] = await Promise.all([
             OpenCitationsService.getMetadata(input),
             OpenCitationsService.getCitationCount(input),
             OpenCitationsService.getReferenceCount(input),
             OpenCitationsService.getIncomingCitations(input, 100) // fetch up to 100 for graph
         ]);

         if (!metadata && incoming === 0 && outgoing === 0) {
             setOutput("Error: Could not find paper data with this DOI. Ensure it is correct (e.g. 10.1186/...)");
             setIsLoading(false);
             return;
         }

         // Process Chart Data (Citations per year)
         const yearMap: Record<string, number> = {};
         recentList.forEach((item: any) => {
             if (item.creation) {
                 const year = item.creation.split('-')[0];
                 yearMap[year] = (yearMap[year] || 0) + 1;
             }
         });

         const chartData = Object.keys(yearMap).sort().map(year => ({
             year,
             citations: yearMap[year]
         }));

         setCitationData({
             metadata: metadata || { title: 'Unknown Title', venue: 'Unknown Venue', pub_date: 'n.d.' },
             counts: { incoming, outgoing },
             recentCitations: recentList.slice(0, 5),
             chartData
         });
         
         setOutput("Data loaded."); // Fallback/Flag
     } catch (e) {
         setOutput("Error fetching citation graph data.");
         console.error(e);
     }
     setIsLoading(false);
  };

  const openTool = (id: string) => {
      setActiveTool(id);
      setOutput('');
      setInput('');
      setCitationData(null);
  };

  const tools: Tool[] = [
    // --- Writing Tools ---
    { id: 't31', name: 'Scientific Paper Checker', description: 'Audit structure, acronyms, and formatting.', icon: Microscope, category: 'Writing', status: 'Active', action: () => openTool('t31') },
    { id: 't1', name: 'Abstract Generator', description: 'Create a concise summary of your work.', icon: FileText, category: 'Writing', status: 'Active', action: () => openTool('t1') },
    { id: 't2', name: 'Title Perfector', description: 'Generate catchy & academic titles.', icon: Type, category: 'Writing', status: 'Active', action: () => openTool('t2') },
    { id: 't3', name: 'Passive Voice Fixer', description: 'Convert passive sentences to active.', icon: PenTool, category: 'Writing', status: 'Active', action: () => openTool('t3') },
    { id: 't4', name: 'Transition Word Suggester', description: 'Improve flow between paragraphs.', icon: Link, category: 'Writing', status: 'Active', action: () => openTool('t4') },
    { id: 't5', name: 'Readability Scorer', description: 'Flesch-Kincaid analysis.', icon: Eye, category: 'Writing', status: 'Active', action: () => openTool('t5') },
    { id: 't6', name: 'Originality Improver', description: 'Reduce cliches and academic tropes.', icon: CheckSquare, category: 'Writing', status: 'Active', action: () => openTool('t6') },
    { id: 't7', name: 'Paraphrasing Tool', description: 'Rewrite sentences to avoid plagiarism.', icon: RefreshCw, category: 'Writing', status: 'Active', action: () => openTool('t7') },
    { id: 't8', name: 'LaTeX Equation Builder', description: 'Convert math to LaTeX code.', icon: Terminal, category: 'Writing', status: 'Active', action: () => openTool('t8') },
    { id: 't9', name: 'Argument Logic Scorer', description: 'Evaluate the strength of your claims.', icon: Sparkles, category: 'Writing', status: 'Active', action: () => openTool('t9') },
    { id: 't10', name: 'Thesis Statement Generator', description: 'Craft a strong central argument.', icon: PenTool, category: 'Writing', status: 'Active', action: () => openTool('t10') },

    // --- Research Tools ---
    { id: 't18', name: 'Citation Metrics', description: 'Get citation counts and graphs via DOI.', icon: GitGraph, category: 'Research', status: 'Active', action: () => openTool('t18') },
    { id: 't11', name: 'Literature Matrix', description: 'Generate a comparison table for sources.', icon: Table, category: 'Research', status: 'Active', action: () => openTool('t11') },
    { id: 't12', name: 'Methodology Builder', description: 'Step-by-step research design.', icon: Database, category: 'Research', status: 'Active', action: () => openTool('t12') },
    { id: 't13', name: 'Reference Formatter', description: 'Format raw refs to APA 7th.', icon: BookOpen, category: 'Research', status: 'Active', action: () => openTool('t13') },
    { id: 't14', name: 'Survey Generator', description: 'Create questions for data collection.', icon: CheckSquare, category: 'Research', status: 'Active', action: () => openTool('t14') },
    { id: 't15', name: 'Ethics Checklist', description: 'Ensure IRB compliance.', icon: CheckSquare, category: 'Research', status: 'Active', action: () => openTool('t15') },
    { id: 't16', name: 'Research Assistant Chat', description: 'Ask general research questions.', icon: FileText, category: 'Research', status: 'Active', action: () => openTool('t16') },
    { id: 't17', name: 'Keyword Extractor', description: 'SEO for your publication.', icon: Globe, category: 'Research', status: 'Active', action: () => openTool('t17') },
    
    // --- Career & Output ---
    { id: 't19', name: 'Grant Proposal Writer', description: 'Turn thesis into funding requests.', icon: Briefcase, category: 'Career', status: 'Active', action: () => openTool('t19') },
    { id: 't20', name: 'Thesis-to-Slides', description: 'Generate a defense presentation.', icon: Presentation, category: 'Career', status: 'Active', action: () => openTool('t20') },
    { id: 't21', name: 'Journal Matcher', description: 'Find the right home for your paper.', icon: BookOpen, category: 'Career', status: 'Active', action: () => openTool('t21') },
    { id: 't22', name: 'Conference Finder', description: 'Find events for your topic.', icon: Globe, category: 'Career', status: 'Active', action: () => openTool('t22') },
    { id: 't23', name: 'CV Builder', description: 'Extract skills from your thesis.', icon: FileText, category: 'Career', status: 'Active', action: () => openTool('t23') },
    
    // --- Data & Utility ---
    { id: 't26', name: 'Data Mock-up', description: 'Generate dummy data for proposals.', icon: Database, category: 'Data', status: 'Active', action: () => openTool('t26') },
    { id: 't27', name: 'Statistical Test Selector', description: 'Which test should I use?', icon: Calculator, category: 'Data', status: 'Active', action: () => openTool('t27') },
    { id: 't29', name: 'Qualitative Codebook', description: 'Start your thematic analysis.', icon: Tag, category: 'Data', status: 'Active', action: () => openTool('t29') },
    
    // --- Placeholders/Coming Soon (Complex UI) ---
    { id: 't24', name: 'Peer Review Swap', description: 'Connect with reviewers.', icon: Users, category: 'Career', status: 'Coming Soon' },
    { id: 't25', name: 'Pomodoro Timer', description: 'Focus timer for writing sprints.', icon: Clock, category: 'Data', status: 'Coming Soon' },
    { id: 't28', name: 'Sample Size Calculator', description: 'Determine N for your study.', icon: Calculator, category: 'Data', status: 'Coming Soon' },
    { id: 't30', name: 'Word Cloud Gen', description: 'Visualize frequent terms.', icon: Cloud, category: 'Data', status: 'Coming Soon' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2 md:mb-4">Scholar's Toolkit</h1>
        <p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto">
          30+ specialized tools designed to accelerate every stage of your research journey, from ideation to publication.
        </p>
      </div>

      {['Writing', 'Research', 'Career', 'Data'].map((cat) => (
        <div key={cat} className="mb-8 md:mb-10">
           <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{cat} Tools</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {tools.filter(t => t.category === cat).map(tool => (
               <div 
                 key={tool.id} 
                 onClick={tool.action}
                 className={`p-4 rounded-xl border transition-all ${tool.status === 'Active' ? 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer' : 'bg-slate-50 border-slate-100 opacity-70 cursor-not-allowed'}`}
               >
                 <div className="flex justify-between items-start mb-3">
                   <div className={`p-2 rounded-lg ${tool.status === 'Active' ? 'bg-teal-50 text-teal-600' : 'bg-slate-200 text-slate-400'}`}>
                     <tool.icon size={20} />
                   </div>
                   {tool.status === 'Active' ? (
                     <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">READY</span>
                   ) : (
                     <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">SOON</span>
                   )}
                 </div>
                 <h4 className="font-bold text-slate-800 text-sm mb-1">{tool.name}</h4>
                 <p className="text-xs text-slate-500">{tool.description}</p>
               </div>
             ))}
           </div>
        </div>
      ))}

      {/* Active Tool Modal */}
      {activeTool && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-scale-in">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                 <Sparkles className="text-teal-500" size={20} />
                 {tools.find(t => t.id === activeTool)?.name}
              </h2>
              <button onClick={() => { setActiveTool(null); setOutput(''); setInput(''); setCitationData(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-4 md:p-6 flex-1 overflow-y-auto">
               {!output && !citationData ? (
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      {activeTool === 't11' ? 'Enter your research topic:' : 
                       activeTool === 't19' ? 'Paste your thesis abstract:' :
                       activeTool === 't20' ? 'Paste your chapter content:' :
                       activeTool === 't31' ? 'Paste full paper text for auditing:' :
                       activeTool === 't18' ? 'Enter Paper DOI (e.g. 10.1186/1756-8722-6-59):' :
                       activeTool === 't22' ? 'Enter topic (e.g., "AI in Healthcare"):' :
                       activeTool === 't26' ? 'Describe dataset (e.g. "Patient recovery times"):' :
                       activeTool === 't13' ? 'Paste raw references:' :
                       'Enter text or topic:'}
                    </label>
                    <textarea 
                      className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none text-sm"
                      placeholder="Type or paste text here..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        // Routing to specific complex handlers or the generic one
                        if (activeTool === 't11') handleLitMatrix();
                        else if (activeTool === 't18') handleCitationGraph();
                        else if (activeTool === 't19') handleGrantProposal();
                        else if (activeTool === 't20') handleSlides();
                        else if (activeTool === 't31') handleScientificCheck();
                        else if (activeTool === 't21') handleJournalMatch();
                        else handleGenericTool(activeTool);
                      }}
                      disabled={isLoading || !input}
                      className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />}
                      <span>Generate</span>
                    </button>
                 </div>
               ) : activeTool === 't18' && citationData ? (
                 <div className="space-y-6 animate-fade-in">
                    {/* Header */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-800 leading-tight mb-2">{citationData.metadata.title || "Unknown Title"}</h3>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                           <BookOpen size={14} className="text-teal-600"/>
                           {citationData.metadata.venue || "Unknown Source"}
                           <span className="text-slate-400">•</span>
                           <Calendar size={14} className="text-teal-600"/>
                           {citationData.metadata.pub_date || "n.d."}
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citations</span>
                                <ArrowUpRight size={16} className="text-teal-500"/>
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{citationData.counts.incoming}</span>
                            <p className="text-xs text-slate-400 mt-1">Incoming</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">References</span>
                                <BookOpen size={16} className="text-indigo-500"/>
                            </div>
                            <span className="text-3xl font-bold text-slate-900">{citationData.counts.outgoing}</span>
                            <p className="text-xs text-slate-400 mt-1">Outgoing</p>
                        </div>
                    </div>

                    {/* Chart */}
                    {citationData.chartData.length > 0 && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm mb-4">Citations Over Time</h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={citationData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="year" tick={{fontSize: 10}} />
                                        <YAxis tick={{fontSize: 10}} />
                                        <ReTooltip />
                                        <Bar dataKey="citations" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Recent Citations List */}
                    {citationData.recentCitations.length > 0 && (
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-3">Recent Citing Works</h4>
                            <div className="space-y-2">
                                {citationData.recentCitations.map((item: any, i: number) => (
                                    <div key={i} className="text-xs p-3 bg-white border border-slate-100 rounded-lg flex justify-between items-center">
                                        <span className="font-mono text-slate-600 truncate flex-1">{item.citing.split(' ')[0]}</span>
                                        <span className="text-slate-400 ml-2 whitespace-nowrap">{item.creation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
               ) : (
                 <div className="prose prose-sm max-w-none">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono text-xs md:text-sm text-slate-700 overflow-x-auto">
                      {output}
                    </div>
                 </div>
               )}
            </div>
            
            {(output || citationData) && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                <button onClick={() => { setOutput(''); setCitationData(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm">Start Over</button>
                {output && (
                    <button onClick={() => { navigator.clipboard.writeText(output); alert('Copied!'); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm flex items-center gap-2">
                        <Copy size={16} /> Copy Result
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
