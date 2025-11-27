
import React, { useState } from 'react';
import { 
  PenTool, BookOpen, Briefcase, Database, Type, FileText, 
  Globe, Clock, Table, CheckSquare, Sparkles, Presentation,
  RefreshCw, X, Copy, Terminal, Link
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';

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

  // --- Handlers for Active Tools ---
  
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

  const tools: Tool[] = [
    // --- Writing Tools ---
    { id: 't1', name: 'Abstract Generator', description: 'Create a concise summary of your work.', icon: FileText, category: 'Writing', status: 'Coming Soon' },
    { id: 't2', name: 'Title Perfector', description: 'Generate catchy & academic titles.', icon: Type, category: 'Writing', status: 'Coming Soon' },
    { id: 't3', name: 'Passive Voice Fixer', description: 'Convert passive sentences to active.', icon: PenTool, category: 'Writing', status: 'Coming Soon' },
    { id: 't4', name: 'Transition Word Suggester', description: 'Improve flow between paragraphs.', icon: Link, category: 'Writing', status: 'Coming Soon' },
    { id: 't5', name: 'Readability Scorer', description: 'Flesch-Kincaid analysis.', icon: Eye, category: 'Writing', status: 'Coming Soon' },
    { id: 't6', name: 'Plagiarism Checker', description: 'Simulated check for originality.', icon: CheckSquare, category: 'Writing', status: 'Coming Soon' },
    { id: 't7', name: 'Paraphrasing Tool', description: 'Rewrite sentences to avoid plagiarism.', icon: RefreshCw, category: 'Writing', status: 'Coming Soon' },
    { id: 't8', name: 'LaTeX Equation Builder', description: 'Convert math to LaTeX code.', icon: Terminal, category: 'Writing', status: 'Coming Soon' },
    { id: 't9', name: 'Argument Logic Scorer', description: 'Evaluate the strength of your claims.', icon: Sparkles, category: 'Writing', status: 'Coming Soon' },
    { id: 't10', name: 'Thesis Statement Generator', description: 'Craft a strong central argument.', icon: PenTool, category: 'Writing', status: 'Coming Soon' },

    // --- Research Tools ---
    { id: 't11', name: 'Literature Matrix', description: 'Generate a comparison table for sources.', icon: Table, category: 'Research', status: 'Active', action: () => { setActiveTool('t11'); setOutput(''); } },
    { id: 't12', name: 'Methodology Builder', description: 'Step-by-step research design.', icon: Database, category: 'Research', status: 'Coming Soon' },
    { id: 't13', name: 'Reference Manager', description: 'Organize your bibliography.', icon: BookOpen, category: 'Research', status: 'Coming Soon' },
    { id: 't14', name: 'Survey Generator', description: 'Create questions for data collection.', icon: CheckSquare, category: 'Research', status: 'Coming Soon' },
    { id: 't15', name: 'Ethics Checklist', description: 'Ensure IRB compliance.', icon: CheckSquare, category: 'Research', status: 'Coming Soon' },
    { id: 't16', name: 'PDF Chat', description: 'Upload a paper and ask questions.', icon: FileText, category: 'Research', status: 'Coming Soon' },
    { id: 't17', name: 'Keyword Extractor', description: 'SEO for your publication.', icon: Globe, category: 'Research', status: 'Coming Soon' },
    { id: 't18', name: 'Citation Graph', description: 'Visualize paper connections.', icon: Globe, category: 'Research', status: 'Coming Soon' },
    
    // --- Career & Output ---
    { id: 't19', name: 'Grant Proposal Writer', description: 'Turn thesis into funding requests.', icon: Briefcase, category: 'Career', status: 'Active', action: () => { setActiveTool('t19'); setOutput(''); } },
    { id: 't20', name: 'Thesis-to-Slides', description: 'Generate a defense presentation.', icon: Presentation, category: 'Career', status: 'Active', action: () => { setActiveTool('t20'); setOutput(''); } },
    { id: 't21', name: 'Journal Matcher', description: 'Find the right home for your paper.', icon: BookOpen, category: 'Career', status: 'Active', action: () => { setActiveTool('t21'); setOutput(''); } },
    { id: 't22', name: 'Conference Finder', description: 'Match topic to CFPs.', icon: Globe, category: 'Career', status: 'Coming Soon' },
    { id: 't23', name: 'CV Builder', description: 'Extract skills from your thesis.', icon: FileText, category: 'Career', status: 'Coming Soon' },
    { id: 't24', name: 'Peer Review Swap', description: 'Connect with reviewers.', icon: Users, category: 'Career', status: 'Coming Soon' },
    
    // --- Data & Utility ---
    { id: 't25', name: 'Pomodoro Timer', description: 'Focus timer for writing sprints.', icon: Clock, category: 'Data', status: 'Coming Soon' }, // Implemented in Editor
    { id: 't26', name: 'Data Mock-up', description: 'Generate dummy data for proposals.', icon: Database, category: 'Data', status: 'Coming Soon' },
    { id: 't27', name: 'Statistical Test Selector', description: 'Which test should I use?', icon: Calculator, category: 'Data', status: 'Coming Soon' },
    { id: 't28', name: 'Sample Size Calculator', description: 'Determine N for your study.', icon: Calculator, category: 'Data', status: 'Coming Soon' },
    { id: 't29', name: 'Qualitative Codebook', description: 'Start your thematic analysis.', icon: Tag, category: 'Data', status: 'Coming Soon' },
    { id: 't30', name: 'Word Cloud Gen', description: 'Visualize frequent terms.', icon: Cloud, category: 'Data', status: 'Coming Soon' },
  ];
  
  // Lucide icon imports were missing specific ones, using generic fallbacks for simplicity in this large list
  // Note: Imported icons are limited in the import statement above. 

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Scholar's Toolkit</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          30+ specialized tools designed to accelerate every stage of your research journey, from ideation to publication.
        </p>
      </div>

      {['Writing', 'Research', 'Career', 'Data'].map((cat) => (
        <div key={cat} className="mb-10">
           <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{cat} Tools</h3>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                 <Sparkles className="text-teal-500" size={20} />
                 {tools.find(t => t.id === activeTool)?.name}
              </h2>
              <button onClick={() => { setActiveTool(null); setOutput(''); setInput(''); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
               {!output ? (
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      {activeTool === 't11' ? 'Enter your research topic:' : 
                       activeTool === 't19' ? 'Paste your thesis abstract:' :
                       activeTool === 't20' ? 'Paste your chapter content:' :
                       'Enter abstract keywords:'}
                    </label>
                    <textarea 
                      className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none text-sm"
                      placeholder="Type or paste text here..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    <button 
                      onClick={
                        activeTool === 't11' ? handleLitMatrix :
                        activeTool === 't19' ? handleGrantProposal :
                        activeTool === 't20' ? handleSlides :
                        handleJournalMatch
                      }
                      disabled={isLoading || !input}
                      className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" /> : <Sparkles size={18} />}
                      <span>Generate</span>
                    </button>
                 </div>
               ) : (
                 <div className="prose prose-sm max-w-none">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono text-xs md:text-sm text-slate-700">
                      {output}
                    </div>
                 </div>
               )}
            </div>
            
            {output && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                <button onClick={() => { setOutput(''); }} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm">Start Over</button>
                <button onClick={() => { navigator.clipboard.writeText(output); alert('Copied!'); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm flex items-center gap-2">
                   <Copy size={16} /> Copy Result
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Imports for icons used in the array that weren't in the top import
import { Users, Eye, Calculator, Tag, Cloud } from 'lucide-react';
