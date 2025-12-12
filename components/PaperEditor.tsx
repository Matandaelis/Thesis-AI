
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ZoomIn, ZoomOut, Highlighter, MessageSquare, 
  HelpCircle, MoreVertical, Search, ChevronRight, ChevronLeft,
  Share2, Download, Trash2, CheckCircle2, User, Sparkles, X, Plus
} from 'lucide-react';
import { LibraryItem, Annotation } from '../types';
import { GeminiService } from '../services/geminiService';
import { dbService } from '../services/dbService';

interface PaperEditorProps {
  paper: LibraryItem;
  onBack: () => void;
}

export const PaperEditor: React.FC<PaperEditorProps> = ({ paper, onBack }) => {
  // State
  const [scale, setScale] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'cursor' | 'highlight' | 'comment' | 'question'>('cursor');
  const [selectedText, setSelectedText] = useState<{ text: string, x: number, y: number } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'annotations' | 'ai'>('annotations');
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);

  // Load Annotations
  useEffect(() => {
    const loadAnnotations = async () => {
        const data = await dbService.getAnnotations(paper.id);
        setAnnotations(data);
    };
    loadAnnotations();
  }, [paper.id]);

  // Handle Text Selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Relative to viewer container if needed, but absolute is easier for popup
        if (viewerRef.current) {
            const viewerRect = viewerRef.current.getBoundingClientRect();
            setSelectedText({
                text: selection.toString(),
                x: rect.left - viewerRect.left + (rect.width / 2),
                y: rect.top - viewerRect.top
            });
        }
    } else {
        setSelectedText(null);
    }
  };

  const createAnnotation = async (type: Annotation['type'], color?: 'yellow'|'green'|'blue'|'red', content = '') => {
    if (!selectedText) return;

    const newAnnotation: Annotation = {
        id: crypto.randomUUID(),
        paperId: paper.id,
        userId: 'current-user',
        type,
        color,
        content: content || selectedText.text,
        position: {
            page: 1, // Mock page logic for text view
            quote: selectedText.text,
            x: selectedText.x,
            y: selectedText.y
        },
        createdAt: new Date(),
        status: 'active'
    };

    setAnnotations(prev => [newAnnotation, ...prev]);
    await dbService.saveAnnotation(newAnnotation);
    setSelectedText(null);
    
    // If it's a comment/question, switch tab to edit it
    if (type === 'comment' || type === 'question') {
        setSidebarTab('annotations');
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
      setAnnotations(prev => prev.filter(a => a.id !== id));
      await dbService.deleteAnnotation(id);
  };

  const handleAiAsk = async () => {
      if (!aiInput.trim()) return;
      setIsAiLoading(true);
      const userMsg = { role: 'user' as const, text: aiInput };
      setAiChatHistory(prev => [...prev, userMsg]);
      setAiInput('');

      // Context aware prompt
      const context = `Currently reading paper: "${paper.title}". Context from paper: ${paper.fullText ? paper.fullText.substring(0, 5000) : "No full text available"}`;
      
      try {
          const response = await GeminiService.chatWithTutor(userMsg.text, context);
          setAiChatHistory(prev => [...prev, { role: 'model', text: response }]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAiLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen">
      
      {/* 1. Header Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
                <h1 className="font-bold text-slate-800 text-sm truncate max-w-xs md:max-w-md">{paper.title}</h1>
                <span className="text-[10px] text-slate-500">{paper.author} • {paper.year}</span>
            </div>
         </div>

         {/* Center Tools */}
         <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTool('cursor')}
                className={`p-1.5 rounded ${activeTool === 'cursor' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                title="Select Text"
            >
                <span className="font-serif text-sm px-1">I</span>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button 
                onClick={() => setActiveTool('highlight')}
                className={`p-1.5 rounded ${activeTool === 'highlight' ? 'bg-white shadow text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Highlighter"
            >
                <Highlighter size={16} />
            </button>
            <button 
                onClick={() => setActiveTool('comment')}
                className={`p-1.5 rounded ${activeTool === 'comment' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Add Comment"
            >
                <MessageSquare size={16} />
            </button>
            <button 
                onClick={() => setActiveTool('question')}
                className={`p-1.5 rounded ${activeTool === 'question' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Flag Question"
            >
                <HelpCircle size={16} />
            </button>
         </div>

         {/* Right Actions */}
         <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-1.5 hover:bg-white rounded"><ZoomOut size={14}/></button>
                <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-1.5 hover:bg-white rounded"><ZoomIn size={14}/></button>
            </div>
            <button className="p-2 text-slate-500 hover:text-teal-600 hidden sm:block"><Share2 size={18}/></button>
            <button className="p-2 text-slate-500 hover:text-teal-600 hidden sm:block"><Download size={18}/></button>
         </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Document Viewer */}
          <div className="flex-1 bg-slate-200 overflow-auto relative flex justify-center p-8 custom-scrollbar" onMouseUp={handleMouseUp}>
              <div 
                ref={viewerRef}
                className="bg-white shadow-2xl transition-transform origin-top"
                style={{ 
                    width: '800px', 
                    minHeight: '1100px', 
                    transform: `scale(${scale})`,
                    padding: '3rem 4rem'
                }}
              >
                  {/* Simulated Paper Content */}
                  <div className="prose prose-slate max-w-none font-serif text-justify selection:bg-teal-100 selection:text-teal-900">
                      <h1 className="text-3xl font-bold mb-4">{paper.title}</h1>
                      <div className="text-sm text-slate-600 mb-8 pb-4 border-b border-slate-100">
                          <p><strong>Authors:</strong> {paper.author}</p>
                          <p><strong>Published:</strong> {paper.source}, {paper.year}</p>
                          <p><strong>DOI:</strong> 10.1038/nature.2024.12345</p>
                      </div>

                      <h2 className="text-xl font-bold mb-2">Abstract</h2>
                      <p className="mb-6">{paper.notes || "This is a simulated abstract. In a real application, the PDF content would be rendered here via a library like pdf.js or converted to HTML. For this demo, we simulate the document structure to demonstrate the annotation capabilities."}</p>

                      <h2 className="text-xl font-bold mb-2">1. Introduction</h2>
                      <p className="mb-4">
                          Recent advancements in generative AI have transformed academic workflows. 
                          The integration of Large Language Models (LLMs) into research processes offers unprecedented efficiency gains.
                          However, concerns regarding hallucination and citation integrity remain prevalent (Smith et al., 2023).
                      </p>
                      <p className="mb-4">
                          This study investigates the efficacy of RAG (Retrieval-Augmented Generation) systems in mitigating these risks.
                          We propose a novel framework, "ThesisAI", which anchors generation in verifiable academic sources.
                      </p>

                      <h2 className="text-xl font-bold mb-2">2. Methodology</h2>
                      <p className="mb-4">
                          We conducted a comparative analysis of three leading AI models: GPT-4, Claude 3, and Gemini 1.5 Pro.
                          Each model was tasked with synthesizing a literature review from a fixed set of 50 PDFs.
                          Evaluation metrics included:
                      </p>
                      <ul className="list-disc pl-5 mb-4">
                          <li>Factual Accuracy</li>
                          <li>Citation Correctness</li>
                          <li>Argumentative Coherence</li>
                      </ul>

                      {paper.fullText && (
                          <div className="whitespace-pre-wrap mt-8 pt-8 border-t border-slate-200 text-slate-700">
                              {paper.fullText}
                          </div>
                      )}
                  </div>
              </div>

              {/* Context Menu / Tooltip */}
              {selectedText && (
                  <div 
                    className="absolute bg-slate-900 text-white rounded-lg shadow-xl p-1.5 flex gap-1 z-50 animate-scale-in"
                    style={{ 
                        top: (selectedText.y * scale) - 50, // simple approximation
                        left: (selectedText.x * scale)
                    }}
                  >
                      <button onClick={() => createAnnotation('highlight', 'yellow')} className="p-1.5 hover:bg-slate-700 rounded text-yellow-400"><Highlighter size={16}/></button>
                      <button onClick={() => createAnnotation('highlight', 'green')} className="p-1.5 hover:bg-slate-700 rounded text-green-400"><Highlighter size={16}/></button>
                      <button onClick={() => createAnnotation('comment')} className="p-1.5 hover:bg-slate-700 rounded text-blue-400"><MessageSquare size={16}/></button>
                      <button onClick={() => createAnnotation('question')} className="p-1.5 hover:bg-slate-700 rounded text-rose-400"><HelpCircle size={16}/></button>
                      <div className="w-px h-6 bg-slate-700 mx-1"></div>
                      <button onClick={() => { setAiInput(`Explain this: "${selectedText.text}"`); setSidebarTab('ai'); setSelectedText(null); }} className="p-1.5 hover:bg-slate-700 rounded text-teal-400 flex items-center gap-1">
                          <Sparkles size={14} /> <span className="text-xs font-bold">Ask AI</span>
                      </button>
                  </div>
              )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 md:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 shadow-xl">
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                  <button 
                    onClick={() => setSidebarTab('annotations')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${sidebarTab === 'annotations' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    Annotations <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">{annotations.length}</span>
                  </button>
                  <button 
                    onClick={() => setSidebarTab('ai')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${sidebarTab === 'ai' ? 'border-indigo-600 text-indigo-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    Assistant
                  </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                  {sidebarTab === 'annotations' ? (
                      <div className="space-y-4">
                          {annotations.length === 0 && (
                              <div className="text-center py-10 text-slate-400">
                                  <Highlighter size={32} className="mx-auto mb-2 opacity-50"/>
                                  <p className="text-sm">Select text to add notes.</p>
                              </div>
                          )}
                          {annotations.map(ann => (
                              <div key={ann.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${
                                              ann.type === 'highlight' ? (ann.color === 'yellow' ? 'bg-yellow-400' : ann.color === 'green' ? 'bg-green-400' : 'bg-blue-400') :
                                              ann.type === 'question' ? 'bg-rose-500' : 'bg-indigo-500'
                                          }`}></div>
                                          <span className="text-xs font-bold text-slate-500 uppercase">{ann.type}</span>
                                          <span className="text-[10px] text-slate-400">{ann.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                      <button onClick={() => handleDeleteAnnotation(ann.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                                  
                                  {ann.position.quote && (
                                      <blockquote className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 mb-2 line-clamp-3">
                                          "{ann.position.quote}"
                                      </blockquote>
                                  )}
                                  
                                  {ann.type !== 'highlight' && (
                                      <div className="text-sm text-slate-800 font-medium">
                                          {ann.content}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col h-full">
                          <div className="flex-1 space-y-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800">
                                  <p className="font-bold flex items-center gap-2 mb-1"><Sparkles size={14}/> Research Assistant</p>
                                  I can summarize sections, explain jargon, or suggest related papers.
                              </div>
                              {aiChatHistory.map((msg, i) => (
                                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                                          msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                                      }`}>
                                          {msg.text}
                                      </div>
                                  </div>
                              ))}
                              {isAiLoading && (
                                  <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                  </div>
                              )}
                          </div>
                          
                          <div className="relative">
                              <input 
                                className="w-full border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ask about this paper..."
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                              />
                              <button 
                                onClick={handleAiAsk}
                                className="absolute right-2 top-2 p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              >
                                  <ChevronRight size={16} />
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
