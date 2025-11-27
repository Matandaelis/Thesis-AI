
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Download, Bot, Check, X, RefreshCw, Quote, 
  Bold, Italic, List, AlignLeft, Sparkles, Search, MessageSquare, 
  BookOpen, ChevronRight, ExternalLink, Scissors, Maximize2, Minimize2, Pen,
  Eye, EyeOff, BarChart2, Book, FileText, Target, Mic, Volume2, Plus, PieChart, Trash2, Copy, BrainCircuit,
  Clock, Pause, Play, Sigma, Menu, Layout
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RePieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Document, AISuggestion, University, ChatMessage, ResearchResponse, Reference, ChartData } from '../types';
import { GeminiService } from '../services/geminiService';

interface EditorProps {
  document: Document;
  university: University | null;
  onSave: (doc: Document) => void;
  onBack: () => void;
}

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  index: number;
}

export const Editor: React.FC<EditorProps> = ({ document, university, onSave, onBack }) => {
  const [content, setContent] = useState(document.content);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'review' | 'research' | 'chat' | 'thesaurus' | 'figures' | 'references'>('write');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isStructureOpen, setIsStructureOpen] = useState(true); // Control left sidebar
  
  // Review Mode: 'suggestions' (Flash) or 'critique' (Pro Thinking)
  const [reviewMode, setReviewMode] = useState<'suggestions' | 'critique'>('suggestions');
  const [critiqueText, setCritiqueText] = useState('');
  const [isCritiquing, setIsCritiquing] = useState(false);

  // Stats
  const [wordCount, setWordCount] = useState(0);
  const wordTarget = 5000;

  // Outline
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  // Research State
  const [searchQuery, setSearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<ResearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your AI Supervisor. Ask me anything about your thesis structure, methodology, or analysis.', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Thesaurus State
  const [selectedWord, setSelectedWord] = useState('');
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false);

  // Figures State
  const [figures, setFigures] = useState<ChartData[]>([]);
  const [figurePrompt, setFigurePrompt] = useState('');
  const [isGeneratingFigure, setIsGeneratingFigure] = useState(false);

  // References State
  const [references, setReferences] = useState<Reference[]>([]);
  const [refInput, setRefInput] = useState('');
  const [isParsingRef, setIsParsingRef] = useState(false);

  // Citation Modal State
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [citationFields, setCitationFields] = useState({ author: '', year: '', title: '', source: '' });
  const [citationResult, setCitationResult] = useState('');
  const [isGeneratingCitation, setIsGeneratingCitation] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Pomodoro State
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 mins

  // Text Selection
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);

  // Styles
  const editorStyle = {
    fontFamily: university?.standards.font || 'Times New Roman',
    fontSize: university?.standards.size ? `${university.standards.size}pt` : '12pt',
    lineHeight: university?.standards.spacing === 'Double' ? '2.0' : university?.standards.spacing === '1.5' ? '1.5' : '1.5',
  };

  // Effects
  useEffect(() => {
    // Auto-close structure on mobile
    if (window.innerWidth < 768) {
      setIsStructureOpen(false);
    }

    const timer = setTimeout(() => {
      onSave({ ...document, content, lastModified: new Date() });
    }, 5000);

    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);

    const lines = content.split('\n');
    const newOutline: OutlineItem[] = [];
    let currentIndex = 0;
    lines.forEach((line) => {
      const match = line.match(/^(Chapter \d+|[0-9]+\.[0-9]+|[A-Z][A-Z\s]+$)/);
      if (match && line.length < 100) {
        newOutline.push({
          id: `line-${currentIndex}`,
          text: line,
          level: line.startsWith('Chapter') ? 1 : 2,
          index: currentIndex
        });
      }
      currentIndex += line.length + 1;
    });
    setOutline(newOutline);

    return () => clearTimeout(timer);
  }, [content, document, onSave]);
  
  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: any;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setPomodoroActive(false);
      if (Notification.permission === 'granted') {
          new Notification("Focus Session Complete!");
      } else {
          alert("Focus session complete! Take a break.");
      }
      setPomodoroTime(25 * 60);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime]);

  // AI Handlers
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setReviewMode('suggestions');
    setActiveTab('review');
    try {
      const results = await GeminiService.analyzeText(content, university?.name || 'Standard');
      setSuggestions(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeepCritique = async () => {
    if (!content || content.length < 50) return;
    setIsCritiquing(true);
    setCritiqueText('');
    try {
      const result = await GeminiService.deepCritique(content);
      setCritiqueText(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleResearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await GeminiService.researchTopic(searchQuery);
      setResearchResults(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatting(true);
    try {
      const response = await GeminiService.chatWithTutor(chatInput, content);
      const newAiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: new Date() };
      setChatMessages(prev => [...prev, newAiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatting(false);
    }
  };

  const handleRewrite = async (mode: 'paraphrase' | 'expand' | 'shorten') => {
    if (!textareaRef.current || !selectionRange || selectionRange.start === selectionRange.end) {
      alert("Please select some text to rewrite.");
      return;
    }
    const selectedText = content.substring(selectionRange.start, selectionRange.end);
    const newText = await GeminiService.rewriteText(selectedText, mode);
    const newContent = content.substring(0, selectionRange.start) + newText + content.substring(selectionRange.end);
    setContent(newContent);
  };

  const handleAutocomplete = async () => {
    setIsWriting(true);
    try {
      const newText = await GeminiService.continueWriting(content);
      if (newText) {
        setContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + newText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsWriting(false);
    }
  };

  const handleSynonyms = async () => {
    if (!textareaRef.current || !selectionRange || selectionRange.start === selectionRange.end) return;
    const word = content.substring(selectionRange.start, selectionRange.end);
    if (word.split(' ').length > 1) {
      alert("Please select a single word.");
      return;
    }
    setSelectedWord(word);
    setActiveTab('thesaurus');
    setIsLoadingSynonyms(true);
    try {
      const results = await GeminiService.getSynonyms(word, content.substring(Math.max(0, selectionRange.start - 50), Math.min(content.length, selectionRange.end + 50)));
      setSynonyms(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSynonyms(false);
    }
  };

  const handleGenerateFigure = async () => {
    if (!figurePrompt) return;
    setIsGeneratingFigure(true);
    try {
      const result = await GeminiService.generateChartData(figurePrompt);
      if (result) {
        setFigures(prev => [...prev, result]);
        setFigurePrompt('');
      }
    } catch (e) { console.error(e); } 
    finally { setIsGeneratingFigure(false); }
  };

  const handleAddReference = async () => {
    if (!refInput) return;
    setIsParsingRef(true);
    try {
      const result = await GeminiService.parseReference(refInput);
      if (result) {
        setReferences(prev => [...prev, result]);
        setRefInput('');
      }
    } catch (e) { console.error(e); }
    finally { setIsParsingRef(false); }
  };

  // Citation Handlers
  const handleGenerateCitation = async () => {
    if (!citationFields.title && !citationFields.source) return;
    setIsGeneratingCitation(true);
    try {
      const details = `Author: ${citationFields.author}, Year: ${citationFields.year}, Title: ${citationFields.title}, Source: ${citationFields.source}`;
      const res = await GeminiService.generateCitation(details);
      setCitationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCitation(false);
    }
  };

  const insertCitation = () => {
    const textToInsert = ` ${citationResult}`;
    if (selectionRange) {
        const newContent = content.substring(0, selectionRange.end) + textToInsert + content.substring(selectionRange.end);
        setContent(newContent);
    } else {
        setContent(prev => prev + textToInsert);
    }
    resetCitationModal();
  };

  const clearCitationForm = () => {
      setCitationFields({ author: '', year: '', title: '', source: '' });
      setCitationResult('');
  };

  const resetCitationModal = () => {
    setCitationResult('');
    setCitationFields({ author: '', year: '', title: '', source: '' });
    setCitationModalOpen(false);
  };
  
  const insertLatex = () => {
      setContent(prev => prev + " $ E = mc^2 $ ");
  };

  // Browser API Handlers
  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleDictation = () => {
    if (isListening) {
      // Logic handled via UI toggle in simple implementation
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Simple sentence mode
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
           const transcript = event.results[0][0].transcript;
           setContent(prev => prev + ' ' + transcript);
        };
        recognition.start();
      } else {
        alert("Browser does not support Speech Recognition");
      }
    }
  };

  // Utils
  const replaceWord = (newWord: string) => {
    if (selectionRange) {
      const newContent = content.substring(0, selectionRange.start) + newWord + content.substring(selectionRange.end);
      setContent(newContent);
      setActiveTab('write');
    }
  };

  const handleSelect = () => {
    if (textareaRef.current) {
      setSelectionRange({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      });
    }
  };

  const scrollToSection = (index: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index);
      // Rough scrolling simulation
      const lineHeight = 24; 
      const lines = content.substring(0, index).split('\n').length;
      textareaRef.current.scrollTop = lines * lineHeight;
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copied!");
  };

  // Render formatted critique
  const renderCritique = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimLine = line.trim();
      if (!trimLine) return <br key={i} />;
      if (trimLine.startsWith('**') || trimLine.startsWith('##')) {
        return <h4 key={i} className="font-bold text-teal-800 mt-3 mb-1">{trimLine.replace(/^[\*#]+/, '').replace(/[\*#]+$/, '')}</h4>;
      }
      if (trimLine.startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc text-slate-700 text-sm mb-1">{trimLine.substring(2)}</li>
      }
      return <p key={i} className="text-slate-700 text-sm mb-2 leading-relaxed">{line}</p>;
    });
  };

  // Render Charts Helper
  const renderChart = (fig: ChartData) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    
    if (fig.type === 'bar') {
      return (
        <BarChart data={fig.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={fig.xKey} hide />
          <YAxis />
          <ReTooltip />
          <Legend />
          {fig.dataKeys.map((key, i) => <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />)}
        </BarChart>
      );
    }
    if (fig.type === 'line') {
      return (
        <LineChart data={fig.data}>
           <CartesianGrid strokeDasharray="3 3" />
           <XAxis dataKey={fig.xKey} hide />
           <YAxis />
           <ReTooltip />
           <Legend />
           {fig.dataKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} />)}
        </LineChart>
      );
    }
    if (fig.type === 'pie') {
        return (
            <RePieChart>
                <Pie data={fig.data} dataKey={fig.dataKeys[0]} nameKey={fig.xKey} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                    {fig.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <ReTooltip />
            </RePieChart>
        )
    }
    return null;
  };
  
  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`fixed inset-0 bg-slate-100 flex overflow-hidden z-50 transition-all duration-300 ${isFocusMode ? 'p-0' : ''}`}>
      
      {/* Structure Sidebar (Left) */}
      {!isFocusMode && (
        <div className={`${isStructureOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center whitespace-nowrap">
              <List size={14} className="mr-2" /> Structure
            </h3>
            <button onClick={() => setIsStructureOpen(false)} className="md:hidden p-1 text-slate-400">
               <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 w-64">
            {outline.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 italic">
                Add headings (e.g. "Chapter 1", "1.0 Introduction") to see your document structure here.
              </p>
            ) : (
              <ul className="space-y-1">
                {outline.map((item) => (
                  <li key={item.id}>
                    <button 
                      onClick={() => scrollToSection(item.index)}
                      className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-100 truncate ${item.level === 1 ? 'font-bold text-slate-800' : 'pl-6 text-slate-600'}`}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 w-64">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Progress</span>
              <span>{Math.round((wordCount / wordTarget) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full">
              <div 
                className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (wordCount / wordTarget) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">{wordCount} / {wordTarget} words</p>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-slate-100">
        
        {/* Toolbar */}
        {!isFocusMode && (
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center space-x-4 shrink-0">
              <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm font-medium whitespace-nowrap">← Back</button>
              <div className="h-6 w-px bg-slate-200"></div>
              {!isStructureOpen && (
                 <button onClick={() => setIsStructureOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded" title="Open Structure">
                    <Layout size={20} />
                 </button>
              )}
              <h2 className="font-serif font-bold text-lg text-slate-800 truncate max-w-[150px] md:max-w-xs">{document.title}</h2>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <div className="hidden md:flex bg-slate-100 rounded-lg p-1 mr-2">
                  <button onClick={() => handleRewrite('paraphrase')} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Paraphrase</button>
                  <button onClick={() => handleRewrite('expand')} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Expand</button>
                  <button onClick={() => setCitationModalOpen(true)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all">Citation</button>
              </div>

              {/* Mobile rewrite dropdown could go here, for now keeping icons */}
              <button onClick={() => setCitationModalOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Citation"><Quote size={20} /></button>

              <button onClick={handleReadAloud} className={`p-2 rounded-lg tooltip ${isSpeaking ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`} title="Read Aloud">
                  <Volume2 size={20} />
              </button>
              <button onClick={handleDictation} className={`hidden sm:block p-2 rounded-lg tooltip ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-600 hover:bg-slate-100'}`} title="Dictation">
                  <Mic size={20} />
              </button>
              <button onClick={insertLatex} className="hidden sm:block p-2 text-slate-600 hover:bg-slate-100 rounded-lg tooltip" title="Insert Math"><Sigma size={20} /></button>

              <button onClick={handleAutocomplete} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg tooltip border border-indigo-200 ml-2" title="Continue Writing" disabled={isWriting}>
                {isWriting ? <RefreshCw className="animate-spin" size={20} /> : <Pen size={20} />}
              </button>
              <button onClick={handleSynonyms} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg tooltip" title="Thesaurus"><Book size={20} /></button>
              
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              
              <button className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap" onClick={() => setActiveTab('research')}>
                <Search size={18} />
                <span className="hidden md:inline">Research</span>
              </button>
              <button className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap" onClick={handleAnalyze} disabled={isAnalyzing}>
                <Sparkles size={18} />
                <span className="hidden md:inline">Review</span>
              </button>

              <button onClick={() => setIsFocusMode(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Focus Mode"><Maximize2 size={20} /></button>
            </div>
          </div>
        )}

        {/* Focus Mode Header */}
        {isFocusMode && (
          <div className="fixed top-0 left-0 right-0 h-16 flex justify-center items-center z-50 pointer-events-none">
             <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm rounded-full px-6 py-2 flex items-center space-x-4 border border-slate-200 mt-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm font-bold text-slate-700">{wordCount} words</span>
                <div className="h-4 w-px bg-slate-300"></div>
                <button onClick={() => setIsFocusMode(false)} className="text-slate-500 hover:text-red-500 flex items-center space-x-1 text-sm font-medium">
                   <Minimize2 size={14} /> <span>Exit Focus</span>
                </button>
             </div>
          </div>
        )}

        {/* Sub-toolbar (Formatting) - Hidden in Focus Mode */}
        {!isFocusMode && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
             <div className="flex items-center space-x-4 whitespace-nowrap shrink-0">
               <span className="text-xs text-slate-500 font-mono hidden sm:inline">{university?.name || 'Standard'}: {editorStyle.fontFamily}, {editorStyle.fontSize}</span>
             </div>
             
             {/* Pomodoro Timer */}
             <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 space-x-2 shrink-0">
                 <Clock size={14} className="text-slate-400" />
                 <span className={`text-xs font-mono font-bold ${pomodoroActive ? 'text-teal-600' : 'text-slate-600'}`}>{formatTime(pomodoroTime)}</span>
                 <button onClick={() => setPomodoroActive(!pomodoroActive)} className="text-slate-500 hover:text-teal-600">
                     {pomodoroActive ? <Pause size={12} fill="currentColor"/> : <Play size={12} fill="currentColor"/>}
                 </button>
             </div>

             <div className="flex space-x-2 shrink-0">
                <button onClick={() => setActiveTab(activeTab === 'figures' ? 'write' : 'figures')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'figures' ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <PieChart size={14} /> <span>Figures</span>
                </button>
                <button onClick={() => setActiveTab(activeTab === 'references' ? 'write' : 'references')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'references' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <BookOpen size={14} /> <span>Biblio</span>
                </button>
                <button onClick={() => setActiveTab(activeTab === 'research' ? 'write' : 'research')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'research' ? 'bg-teal-100 text-teal-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <Search size={14} /> <span>Research</span>
                </button>
                <button onClick={() => setActiveTab(activeTab === 'chat' ? 'write' : 'chat')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <MessageSquare size={14} /> <span>Chat</span>
                </button>
             </div>
          </div>
        )}

        {/* Typing Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center scroll-smooth bg-slate-100">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleSelect}
            style={editorStyle}
            className={`w-full max-w-[21cm] min-h-[50vh] md:min-h-[29.7cm] bg-white shadow-lg p-4 md:p-[2.54cm] text-slate-900 resize-none focus:outline-none selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-300 ${isFocusMode ? 'shadow-2xl scale-100 md:scale-105' : ''}`}
            placeholder="Start typing your thesis chapter here..."
          />
        </div>

        {/* Status Bar */}
        <div className="bg-white border-t border-slate-200 px-4 md:px-6 py-2 flex justify-between items-center text-xs text-slate-500">
           <div className="flex items-center space-x-4">
              <span>Words: {wordCount}</span>
              <span className="hidden sm:inline">Reading Time: {Math.ceil(wordCount / 200)} min</span>
           </div>
           <div>
              {document.lastModified ? `Saved ${document.lastModified.toLocaleTimeString()}` : 'Unsaved'}
           </div>
        </div>
      </div>

      {/* AI Sidebar - Tabbed Interface (Right) - Hidden in Focus Mode */}
      {!isFocusMode && (
        <div className={`w-full md:w-96 bg-white border-l border-slate-200 shadow-xl transform transition-all duration-300 flex flex-col absolute right-0 top-0 bottom-0 z-20 ${activeTab !== 'write' ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Sidebar Header with Tabs */}
          <div className="flex items-center border-b border-slate-200 px-1 overflow-x-auto no-scrollbar">
             {['review', 'research', 'chat'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 capitalize ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
             ))}
             <button onClick={() => setActiveTab('figures')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === 'figures' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Figures</button>
             <button onClick={() => setActiveTab('references')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === 'references' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Biblio</button>
             
             <button onClick={() => setActiveTab('write')} className="px-3 text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          {/* Tab Content: Review */}
          {activeTab === 'review' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-slate-50">
                <div className="bg-white p-2 rounded-lg border border-slate-200 mb-4 flex space-x-1">
                   <button 
                     onClick={() => setReviewMode('suggestions')}
                     className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${reviewMode === 'suggestions' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                   >
                     Quick Fixes
                   </button>
                   <button 
                     onClick={() => setReviewMode('critique')}
                     className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors flex items-center justify-center space-x-1 ${reviewMode === 'critique' ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                   >
                     <BrainCircuit size={14} /> <span>Deep Critique</span>
                   </button>
                </div>

                {reviewMode === 'suggestions' && (
                  <div className="space-y-4">
                    {suggestions.length === 0 && !isAnalyzing && (
                      <div className="text-center text-slate-500 mt-10">
                        <Sparkles className="mx-auto mb-2 text-indigo-300" size={40} />
                        <p className="text-sm">Click "Review" in the toolbar to analyze your writing.</p>
                      </div>
                    )}
                    {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                          <RefreshCw className="animate-spin text-indigo-600" size={32} />
                          <p className="text-sm text-slate-500">Analyzing document...</p>
                      </div>
                    )}
                    {suggestions.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${item.type === 'grammar' ? 'bg-red-100 text-red-700' : item.type === 'citation' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'}`}>
                            {item.type}
                          </span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-red-500 line-through bg-red-50 inline px-1">{item.originalText}</p>
                          <div className="my-1 flex justify-center text-slate-300">↓</div>
                          <p className="text-sm text-green-700 font-medium bg-green-50 px-1">{item.suggestion}</p>
                        </div>
                        <p className="text-xs text-slate-600 italic mb-3">"{item.explanation}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {reviewMode === 'critique' && (
                  <div className="flex-1 flex flex-col">
                     {!critiqueText && !isCritiquing && (
                       <div className="text-center text-slate-500 mt-10 p-4">
                         <BrainCircuit className="mx-auto mb-3 text-teal-300" size={40} />
                         <h3 className="text-slate-800 font-bold mb-2">Deep Thinking Mode</h3>
                         <p className="text-sm mb-4">Uses advanced reasoning to critique your logic, flow, and argumentation. Takes ~30s.</p>
                         <button 
                           onClick={handleDeepCritique}
                           className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
                         >
                           Generate Critique
                         </button>
                       </div>
                     )}
                     {isCritiquing && (
                       <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                          <BrainCircuit className="animate-pulse text-teal-600" size={40} />
                          <p className="text-sm text-slate-500">Thinking deeply about your thesis...</p>
                       </div>
                     )}
                     {critiqueText && (
                       <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm overflow-y-auto">
                         <div className="prose prose-sm prose-teal">
                            <h4 className="text-teal-800 font-bold mb-2 flex items-center gap-2"><Bot size={16}/> Supervisor's Critique</h4>
                            <div className="text-slate-700 text-sm">
                               {renderCritique(critiqueText)}
                            </div>
                         </div>
                         <button onClick={handleDeepCritique} className="mt-4 text-xs text-teal-600 underline text-center w-full">Regenerate</button>
                       </div>
                     )}
                  </div>
                )}
            </div>
          )}

          {/* ... Other Tabs ... */}
          
          {/* Tab Content: Research */}
          {activeTab === 'research' && (
            <div className="flex-1 flex flex-col bg-slate-50">
               <div className="p-4 bg-white border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Academic Research</h3>
                  <div className="relative">
                     <input 
                        className="w-full bg-slate-100 border-none rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                        placeholder="Search topic..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                     />
                     <button 
                        onClick={handleResearch} 
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-teal-600"
                        disabled={isSearching}
                     >
                        {isSearching ? <RefreshCw className="animate-spin" size={16}/> : <Search size={16} />}
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {researchResults && (
                     <>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                           <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                              <Sparkles size={14} className="text-teal-500"/> AI Summary
                           </h4>
                           <p className="text-sm text-slate-600 leading-relaxed">{researchResults.content}</p>
                        </div>
                        
                        {researchResults.links.length > 0 && (
                           <div>
                              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 mt-2">Sources</h4>
                              <div className="space-y-2">
                                 {researchResults.links.map((link, i) => (
                                    <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="block bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all group">
                                       <div className="flex items-start justify-between">
                                          <span className="text-sm font-medium text-teal-700 group-hover:underline line-clamp-2">{link.title}</span>
                                          <ExternalLink size={12} className="text-slate-400 flex-shrink-0 mt-1" />
                                       </div>
                                       <span className="text-xs text-slate-400 mt-1 block truncate">{link.uri}</span>
                                    </a>
                                 ))}
                              </div>
                           </div>
                        )}
                     </>
                  )}
                  {!researchResults && !isSearching && (
                     <div className="text-center text-slate-400 mt-10 p-4">
                        <Search className="mx-auto mb-2 opacity-50" size={32} />
                        <p className="text-sm">Enter a topic to search academic sources.</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* Tab Content: Figures (Generative UI) */}
          {activeTab === 'figures' && (
             <div className="flex-1 flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">AI Chart Generator</h3>
                    <textarea 
                        className="w-full bg-slate-100 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={3}
                        placeholder="Describe a chart e.g., 'Bar chart of Kenya's Coffee Exports 2018-2022: 45k, 48k, 52k, 50k, 55k tons'"
                        value={figurePrompt}
                        onChange={(e) => setFigurePrompt(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerateFigure}
                        disabled={isGeneratingFigure}
                        className="w-full mt-2 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {isGeneratingFigure ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        <span>Generate Figure</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {figures.map((fig) => (
                        <div key={fig.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-1 text-center text-sm">{fig.title}</h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                   {renderChart(fig) as any}
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-2 text-center">{fig.description}</p>
                            <div className="mt-3 flex justify-end space-x-2">
                                <button onClick={() => setFigures(prev => prev.filter(f => f.id !== fig.id))} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Copy Data"><Copy size={14} /></button>
                            </div>
                        </div>
                    ))}
                    {figures.length === 0 && !isGeneratingFigure && <p className="text-center text-slate-400 text-sm mt-10 italic">No figures yet. Describe data to visualize it.</p>}
                </div>
             </div>
          )}

          {/* Tab Content: References (Bibliography Manager) */}
          {activeTab === 'references' && (
             <div className="flex-1 flex flex-col bg-slate-50">
                 <div className="p-4 bg-white border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Reference Manager</h3>
                    <div className="flex space-x-2">
                        <input 
                            type="text"
                            className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                            placeholder="Paste DOI, URL or title..."
                            value={refInput}
                            onChange={(e) => setRefInput(e.target.value)}
                        />
                        <button 
                            onClick={handleAddReference}
                            disabled={isParsingRef}
                            className="bg-purple-600 text-white px-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                     {references.map((ref) => (
                         <div key={ref.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs hover:border-purple-300 transition-colors">
                             <div className="font-bold text-slate-800 mb-1">{ref.title}</div>
                             <div className="text-slate-600 mb-1">{ref.author} • {ref.year}</div>
                             <div className="text-slate-400 italic mb-2 truncate">{ref.source}</div>
                             <div className="bg-purple-50 p-2 rounded text-slate-700 font-serif border border-purple-100">
                                 {ref.formatted}
                             </div>
                             <div className="mt-2 flex justify-end space-x-2">
                                 <button onClick={() => copyToClipboard(ref.formatted)} className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 font-medium">
                                     <Copy size={12} /> <span>Copy</span>
                                 </button>
                                 <button onClick={() => setReferences(prev => prev.filter(r => r.id !== ref.id))} className="text-slate-400 hover:text-red-500">
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         </div>
                     ))}
                     {references.length === 0 && <p className="text-center text-slate-400 text-sm mt-10 italic">Add sources to build your bibliography.</p>}
                 </div>
                 {references.length > 0 && (
                     <div className="p-4 border-t border-slate-200 bg-white">
                         <button onClick={() => copyToClipboard(references.map(r => r.formatted).join('\n'))} className="w-full py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                             Copy Full Bibliography
                         </button>
                     </div>
                 )}
             </div>
          )}

          {/* Tab Content: Thesaurus */}
          {activeTab === 'thesaurus' && (
             <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-2">Synonyms for "{selectedWord}"</h3>
                {isLoadingSynonyms ? (
                   <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-indigo-600" /></div>
                ) : (
                   <div className="space-y-2">
                      {synonyms.length > 0 ? synonyms.map((word, i) => (
                         <button key={i} onClick={() => replaceWord(word)} className="w-full text-left p-3 bg-white border border-slate-200 rounded hover:border-indigo-500 hover:text-indigo-700 text-sm font-medium transition-colors">
                            {word}
                         </button>
                      )) : <p className="text-slate-500 text-sm">No synonyms found.</p>}
                   </div>
                )}
             </div>
          )}

          {/* Tab Content: Chat (Reused logic) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col bg-slate-50">
               <div className="flex-1 flex flex-col">
                   <div className="flex-1 overflow-y-auto p-4 space-y-2">{chatMessages.map(m => <div key={m.id} className={`p-2 rounded text-xs ${m.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-white'}`}>{m.text}</div>)}
                   {isChatting && <div className="p-2 rounded text-xs bg-white text-slate-500 italic flex items-center gap-1"><BrainCircuit size={12} className="animate-pulse"/> Thinking...</div>}
                   </div>
                   <div className="p-2"><input className="w-full p-2 rounded" placeholder="Ask Supervisor..." onKeyDown={(e: any) => e.key === 'Enter' && handleChat()} onChange={(e) => setChatInput(e.target.value)} value={chatInput} /></div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Citation Modal */}
      {citationModalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-[500px]">
            <h3 className="text-xl font-bold mb-4 font-serif">Citation Generator</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Author(s)</label>
                    <input 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Smith, J. & Doe, A."
                      value={citationFields.author}
                      onChange={(e) => setCitationFields({...citationFields, author: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                    <input 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. 2023"
                      value={citationFields.year}
                      onChange={(e) => setCitationFields({...citationFields, year: e.target.value})}
                    />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. The Impact of AI on Education"
                  value={citationFields.title}
                  onChange={(e) => setCitationFields({...citationFields, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source (Journal, Publisher, URL)</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Journal of EdTech or https://..."
                  value={citationFields.source}
                  onChange={(e) => setCitationFields({...citationFields, source: e.target.value})}
                />
              </div>
              
              {citationResult && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                  <p className="text-xs text-slate-500 uppercase mb-1">APA 7th Edition Result:</p>
                  <p className="text-sm font-serif select-all">{citationResult}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button 
                  onClick={clearCitationForm}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm mr-auto"
                >
                  Clear
                </button>
                <button 
                  onClick={resetCitationModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                {!citationResult ? (
                  <button 
                    onClick={handleGenerateCitation}
                    disabled={isGeneratingCitation}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                  >
                    {isGeneratingCitation && <RefreshCw size={14} className="animate-spin" />}
                    <span>Generate</span>
                  </button>
                ) : (
                  <>
                     <button 
                        onClick={() => copyToClipboard(citationResult)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center justify-center space-x-2"
                     >
                        <Copy size={16} /> <span>Copy</span>
                     </button>
                     <button 
                        onClick={insertCitation}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                     >
                        Insert
                     </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
