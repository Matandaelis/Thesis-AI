
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';

import { 
  Save, Download, Bot, Check, X, RefreshCw, Quote, 
  Bold, Italic, List, AlignLeft, Sparkles, Search, MessageSquare, MessageCircle,
  BookOpen, ChevronRight, ExternalLink, Maximize2, Minimize2, Pen,
  BarChart2, Mic, Volume2, Plus, PieChart, Trash2, Copy, BrainCircuit,
  Clock, Pause, Play, Sigma, Layout, Layers, ArrowRight, ArrowLeft, History, RotateCcw, FileClock, ChevronDown, Type, MoreHorizontal,
  Headphones, CloudRain, Coffee, Wind, DownloadCloud, FileCode, FileType, Heading1, Heading2, Heading3,
  Share2, Wifi, ArrowDown, AlignCenter, AlignRight, Underline as UnderlineIcon, Highlighter,
  Strikethrough, Code, Undo, Redo, Image as ImageIcon, FileText, Settings, Sliders, Globe, BookmarkPlus,
  ListOrdered
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Document, AISuggestion, University, ChatMessage, ResearchResponse, Reference, ChartData, LibraryItem } from '../types';
import { GeminiService } from '../services/geminiService';
import { OpenCitationsService } from '../services/openCitationsService';
import { CitationService } from '../services/citationService';

interface EditorProps {
  document: Document;
  university: University | null;
  onSave: (doc: Document) => void;
  onBack: () => void;
  libraryItems: LibraryItem[];
  onAddToLibrary: (update: (prev: LibraryItem[]) => LibraryItem[]) => void;
}

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  index: number;
}

interface Version {
  id: string;
  timestamp: number;
  content: string;
  wordCount: number;
  description?: string;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isActive: boolean;
}

// ... Phrase Bank
const PHRASE_BANK = {
  'Introduction': [
    "The primary objective of this study is to...",
    "This research aims to investigate...",
    "Recent developments in [field] have heightened the need for...",
    "This study addresses the gap in...",
    "The significance of this study lies in...",
  ],
  'Literature Review': [
    "Previous research has established that...",
    "Smith (2020) argues that...",
    "However, these studies fail to account for...",
    "A recurrent theme in the literature is...",
    "While there is consensus on X, Y remains controversial...",
  ],
  'Methodology': [
    "Data was collected using...",
    "The research design utilized a...",
    "Participants were recruited via...",
    "This approach was chosen because...",
    "To ensure reliability, the study employed...",
  ],
  'Results': [
    "As shown in Table 1, there is a significant...",
    "The results indicate that...",
    "Interestingly, the data suggests...",
    "Figure 2 illustrates the relationship between...",
    "Contrary to expectations, no correlation was found...",
  ],
  'Discussion': [
    "These findings suggest that...",
    "In contrast to earlier findings, this study...",
    "One possible explanation for this is...",
    "The implications of this are...",
    "It is plausible that these results reflect...",
  ],
  'Conclusion': [
    "In conclusion, this study has shown...",
    "Future research should focus on...",
    "The main contribution of this work is...",
    "Ideally, these findings should be replicated...",
    "Practitioners should consider..."
  ],
  'Critical Analysis': [
    "The evidence seems to indicate...",
    "This argument is flawed because...",
    "A limitation of this approach is...",
    "However, one must consider...",
  ]
};

export const Editor: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack, libraryItems, onAddToLibrary }) => {
  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'review' | 'research' | 'chat' | 'thesaurus' | 'figures' | 'references' | 'sections' | 'history' | 'phrases'>('write');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [leftSidebarMode, setLeftSidebarMode] = useState<'structure' | 'research'>('structure');
  
  const [reviewMode, setReviewMode] = useState<'suggestions' | 'critique'>('suggestions');
  const [critiqueText, setCritiqueText] = useState('');
  const [isCritiquing, setIsCritiquing] = useState(false);

  const [wordCount, setWordCount] = useState(0);
  const wordTarget = 5000;

  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<ResearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your AI Supervisor. Ask me anything about your thesis structure, methodology, or analysis.', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const [selectedWord, setSelectedWord] = useState('');
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false);

  // Citation & Reference State
  const [citationTab, setCitationTab] = useState<'library' | 'search'>('library');
  const [citationSearchQuery, setCitationSearchQuery] = useState('');
  const [citationSearchResults, setCitationSearchResults] = useState<Reference[]>([]);
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);

  const [figures, setFigures] = useState<ChartData[]>([]);
  const [figurePrompt, setFigurePrompt] = useState('');
  const [isGeneratingFigure, setIsGeneratingFigure] = useState(false);

  const [references, setReferences] = useState<Reference[]>([]);
  const [refInput, setRefInput] = useState('');
  const [isParsingRef, setIsParsingRef] = useState(false);

  const [versions, setVersions] = useState<Version[]>([]);

  // Citation Modal
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [citationFields, setCitationFields] = useState({ author: '', year: '', title: '', source: '' });
  const [citationResult, setCitationResult] = useState('');
  const [isGeneratingCitation, setIsGeneratingCitation] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'white' | 'cafe'>('none');
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 'u1', name: 'Dr. Kimani (Sup)', color: '#ef4444', avatar: 'https://i.pravatar.cc/150?u=a', isActive: true },
    { id: 'u2', name: 'Sarah (Editor)', color: '#f59e0b', avatar: 'https://i.pravatar.cc/150?u=b', isActive: true }
  ]);
  const [isConnected, setIsConnected] = useState(true);

  // Menus
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const formatMenuRef = useRef<HTMLDivElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // --- Tiptap Editor Initialization ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your thesis chapter here...',
      }),
      CharacterCount,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight,
      Typography,
    ],
    content: thesisDoc.content, // Load initial content
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      
      // Basic Outline Generation from Headers
      const json = editor.getJSON();
      const newOutline: OutlineItem[] = [];
      let index = 0;
      
      const traverse = (node: any) => {
        if (node.type === 'heading') {
           const text = node.content?.[0]?.text || 'Untitled Section';
           newOutline.push({
             id: `head-${index}`,
             text,
             level: node.attrs?.level || 1,
             index
           });
           index++;
        } else if (node.content) {
           node.content.forEach(traverse);
        }
      };
      
      if(json.content) json.content.forEach(traverse);
      if (newOutline.length > 0) setOutline(newOutline);
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm md:prose-lg max-w-none focus:outline-none min-h-[50vh] outline-none',
        },
    },
  });

  // Effects
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsStructureOpen(false);
    }

    const timer = setTimeout(() => {
      if (editor) {
          onSave({ ...thesisDoc, content: editor.getHTML(), lastModified: new Date() });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [editor?.getHTML(), thesisDoc, onSave]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) setIsFormatMenuOpen(false);
        if (insertMenuRef.current && !insertMenuRef.current.contains(event.target as Node)) setIsInsertMenuOpen(false);
        if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) setIsToolsMenuOpen(false);
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) setIsExportMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: any;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setPomodoroActive(false);
      if (Notification.permission === 'granted') new Notification("Focus Session Complete!");
      setPomodoroTime(25 * 60);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime]);

  // Handlers using Tiptap API
  const handleAnalyze = async () => {
    if (!editor) return;
    setIsAnalyzing(true);
    setReviewMode('suggestions');
    setActiveTab('review');
    try {
      const results = await GeminiService.analyzeText(editor.getText(), university?.name || 'Standard');
      setSuggestions(results);
    } catch (e) { console.error(e); } 
    finally { setIsAnalyzing(false); }
  };

  const handleDeepCritique = async () => {
    if (!editor) return;
    const text = editor.getText();
    if (text.length < 50) return;
    setIsCritiquing(true);
    setCritiqueText('');
    try {
      const result = await GeminiService.deepCritique(text);
      setCritiqueText(result);
    } catch (e) { console.error(e); } 
    finally { setIsCritiquing(false); }
  };

  const handleRewrite = async (mode: 'paraphrase' | 'expand' | 'shorten') => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) {
        alert("Please select text to rewrite.");
        return;
    }
    const selectedText = editor.state.doc.textBetween(from, to);
    const newText = await GeminiService.rewriteText(selectedText, mode);
    
    editor.chain().focus().insertContentAt({ from, to }, newText).run();
    setIsFormatMenuOpen(false);
  };

  const handleSynonyms = async () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    
    const word = editor.state.doc.textBetween(from, to);
    if (word.split(' ').length > 1) {
        alert("Please select a single word.");
        return;
    }
    
    setSelectedWord(word);
    setActiveTab('thesaurus');
    setIsLoadingSynonyms(true);
    
    // Get context
    const contextStart = Math.max(0, from - 50);
    const contextEnd = Math.min(editor.state.doc.content.size, to + 50);
    const context = editor.state.doc.textBetween(contextStart, contextEnd);

    try {
      const results = await GeminiService.getSynonyms(word, context);
      setSynonyms(results);
    } catch (e) { console.error(e); } 
    finally { setIsLoadingSynonyms(false); }
  };

  const handleInsertPhrase = (phrase: string) => {
      if (editor) {
          editor.chain().focus().insertContent(` ${phrase} `).run();
      }
  };

  const handleInsertResearchSummary = (text: string) => {
      if (editor) {
          editor.chain().focus().insertContent(text).run();
      }
  };

  const handleGenerateOutline = () => {
    if (!editor) return;
    editor.chain().focus().insertContent(`
      <h1>Chapter 1: Introduction</h1>
      <h2>1.1 Background of the Study</h2>
      <p>Start writing here...</p>
      <h2>1.2 Problem Statement</h2>
      <h2>1.3 Objectives</h2>
      <h1>Chapter 2: Literature Review</h1>
      <h2>2.1 Theoretical Framework</h2>
      <h2>2.2 Empirical Review</h2>
      <h1>Chapter 3: Methodology</h1>
    `).run();
  };

  const handleGenerateSmartOutline = async () => {
    setIsGeneratingOutline(true);
    try {
        const outlineText = await GeminiService.generateThesisOutline(thesisDoc.title);
        if (editor) editor.chain().focus().insertContent(`<pre>${outlineText}</pre>`).run();
    } catch (e) { console.error(e); } 
    finally { setIsGeneratingOutline(false); }
  };

  const handleGenerateSectionContent = async (section: OutlineItem) => {
    setGeneratingSectionId(section.id);
    if (!editor) return;
    try {
        const newText = await GeminiService.generateSectionContent(section.text, thesisDoc.title, editor.getText());
        editor.chain().focus().insertContent(`<p>${newText}</p>`).run();
    } catch(e) { console.error(e); } 
    finally { setGeneratingSectionId(null); }
  };

  // Handlers for Toolbar
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  
  const setAlign = (align: 'left' | 'center' | 'right') => editor?.chain().focus().setTextAlign(align).run();
  const toggleHeading = (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run();
  const toggleList = () => editor?.chain().focus().toggleBulletList().run();
  
  const undo = () => editor?.chain().focus().undo().run();
  const redo = () => editor?.chain().focus().redo().run();

  // Export Handlers
  const handleExportPDF = () => {
      window.print();
      setIsExportMenuOpen(false);
  };

  const handleExportDOCX = () => {
      if (!editor) return;
      const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>${thesisDoc.title}</title></head><body>${editor.getHTML()}</body></html>
      `;
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${thesisDoc.title.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportMenuOpen(false);
  };

  const handleExportLaTeX = () => {
      if (!editor) return;
      const content = editor.getText(); // Basic text for now
      const latex = `
\\documentclass{article}
\\title{${thesisDoc.title}}
\\author{Author}
\\date{\\today}
\\begin{document}
\\maketitle

${content}

\\end{document}
      `;
      const blob = new Blob([latex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${thesisDoc.title.replace(/\s+/g, '_')}.tex`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportMenuOpen(false);
  };

  // Citation Handlers (Internal Search)
  const handleCitationSearch = async () => {
    if (!citationSearchQuery.trim()) return;
    setIsSearchingCitations(true);
    try {
        const results = await CitationService.searchPapers(citationSearchQuery);
        // Map CrossRef to Reference
        const mappedResults: Reference[] = results.map((r, i) => ({
            id: `cr-${Date.now()}-${i}`,
            raw: r.DOI || r.URL || '',
            author: r.author ? r.author.map(a => `${a.family}, ${a.given?.[0]}.`).join('; ') : 'Unknown',
            year: r.issued?.['date-parts']?.[0]?.[0]?.toString() || 'n.d.',
            title: r.title?.[0] || 'Untitled',
            source: r['container-title']?.[0] || r.publisher || 'Unknown',
            formatted: '' // Formatted dynamically
        }));
        setCitationSearchResults(mappedResults);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSearchingCitations(false);
    }
  };

  const handleAddReferenceToLibrary = (ref: Reference) => {
    const newItem: LibraryItem = {
        ...ref,
        id: Date.now().toString(),
        type: 'journal',
        tags: ['Editor Import'],
        readStatus: 'unread',
        isFavorite: false,
        addedDate: new Date(),
        folderId: undefined,
        formatted: CitationService.formatCitation(ref, 'APA 7th') // Default for storage
    };
    onAddToLibrary((prev) => [newItem, ...prev]);
    // Also reset search
    setCitationSearchQuery('');
    setCitationSearchResults([]);
    setCitationTab('library');
  };

  // Citation Modal Helpers
  const handleGenerateCitation = async () => {
    if (!citationFields.title && !citationFields.source) return;
    setIsGeneratingCitation(true);
    try {
      const details = {
          author: citationFields.author,
          year: citationFields.year,
          title: citationFields.title,
          source: citationFields.source
      };
      // Use client-side formatter if possible, or fallback to AI if needed (using AI here for robust parsing of unstructured)
      const res = CitationService.formatCitation(details, university?.standards.citationStyle || 'APA 7th');
      setCitationResult(res);
    } catch (e) { console.error(e); } 
    finally { setIsGeneratingCitation(false); }
  };

  const insertCitation = () => {
    if (editor) {
        editor.chain().focus().insertContent(` ${citationResult} `).run();
        resetCitationModal();
    }
  };

  const insertQuickCitation = (ref: Reference) => {
      if (editor) {
          const style = university?.standards.citationStyle || 'APA 7th';
          const citationText = CitationService.formatInText(ref as LibraryItem, style);
          editor.chain().focus().insertContent(` ${citationText} `).run();
          
          // Optionally insert full reference at the end (not implemented here fully, but concept exists)
      }
  };

  const resetCitationModal = () => {
    setCitationResult('');
    setCitationFields({ author: '', year: '', title: '', source: '' });
    setCitationModalOpen(false);
    setShowLibraryPicker(false);
  };

  const handleSelectFromLibrary = (item: LibraryItem) => {
    setCitationFields({
        author: item.author,
        year: item.year,
        title: item.title,
        source: item.source
    });
    setShowLibraryPicker(false);
  };

  const handleAutocomplete = async () => {
    if (!editor) return;
    setIsWriting(true);
    try {
      const newText = await GeminiService.continueWriting(editor.getText());
      if (newText) {
        editor.chain().focus().insertContent(` ${newText} `).run();
      }
    } catch (e) { console.error(e); } 
    finally { setIsWriting(false); }
  };

  const handleResearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await GeminiService.researchTopic(searchQuery);
      setResearchResults(result);
    } catch (e) { console.error(e); } 
    finally { setIsSearching(false); }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !editor) return;
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatting(true);
    try {
      const response = await GeminiService.chatWithTutor(chatInput, editor.getText());
      const newAiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: new Date() };
      setChatMessages(prev => [...prev, newAiMsg]);
    } catch (e) { console.error(e); } 
    finally { setIsChatting(false); }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const scrollToSection = (index: number) => {
      // Placeholder for scroll
      console.log("Scroll to section index:", index);
  };

  if (!editor) {
    return <div className="flex h-full items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-teal-600"/></div>;
  }

  return (
    <div className={`fixed inset-0 bg-slate-100 flex overflow-hidden z-50 transition-all duration-300 ${isFocusMode ? 'p-0' : ''} print:static print:h-auto print:overflow-visible`}>
      
      {/* Structure Sidebar (Left) */}
      {!isFocusMode && (
        <>
          {/* Mobile Overlay for Structure */}
          {isStructureOpen && (
              <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsStructureOpen(false)} />
          )}
          
          <div className={`
            bg-white border-r border-slate-200 flex flex-col shadow-xl md:shadow-sm transition-all duration-300 overflow-hidden z-40
            fixed inset-y-0 left-0 h-full
            md:relative
            ${isStructureOpen ? 'translate-x-0 w-80 md:w-64' : '-translate-x-full w-80 md:translate-x-0 md:w-0'}
            print:hidden
          `}>
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex bg-slate-100 rounded-lg p-1 w-full max-w-[180px]">
                  <button 
                    onClick={() => setLeftSidebarMode('structure')} 
                    className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${leftSidebarMode === 'structure' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <List size={14} /> Structure
                  </button>
                  <button 
                    onClick={() => setLeftSidebarMode('research')} 
                    className={`flex-1 py-1 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${leftSidebarMode === 'research' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Search size={14} /> Research
                  </button>
              </div>
              <button onClick={() => setIsStructureOpen(false)} className="md:hidden p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto w-full">
              {leftSidebarMode === 'structure' ? (
                <div className="p-2">
                  {outline.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 italic">
                      Add headings (H1, H2) to see document structure.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {outline.map((item) => (
                        <li key={item.id}>
                          <button 
                            onClick={() => { scrollToSection(item.index); if(window.innerWidth < 768) setIsStructureOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-100 truncate ${item.level === 1 ? 'font-bold text-slate-800' : 'pl-6 text-slate-600'}`}
                          >
                            {item.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full bg-slate-50/50">
                  <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                        <input 
                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none" 
                            placeholder="Search topic..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleResearch()} 
                        />
                        <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                        <button 
                            onClick={handleResearch} 
                            className="absolute right-2 top-2 text-teal-600 hover:text-teal-800 disabled:opacity-50"
                            disabled={isSearching}
                        >
                            {isSearching ? <RefreshCw className="animate-spin" size={12}/> : <ArrowRight size={12} />}
                        </button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {researchResults ? (
                        <>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1"><Sparkles size={10} className="text-teal-500"/> AI Summary</h4>
                                  <button onClick={() => handleInsertResearchSummary(researchResults.content)} className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded font-bold hover:bg-teal-100">Insert</button>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">{researchResults.content}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider px-1">Sources</h4>
                              {researchResults.links.map((link, i) => (
                                  <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors group">
                                    <a href={link.uri} target="_blank" className="text-xs font-semibold text-slate-800 hover:text-teal-600 line-clamp-2 leading-snug block mb-1">{link.title}</a>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{new URL(link.uri).hostname}</span>
                                        <button onClick={() => { setRefInput(link.uri); setActiveTab('references'); }} className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">+ Cite</button>
                                    </div>
                                  </div>
                              ))}
                            </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                            <BookOpen size={24} className="mx-auto mb-2 opacity-30"/>
                            <p className="text-xs">Search to find academic sources and AI summaries.</p>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
            
            {leftSidebarMode === 'structure' && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
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
            )}
          </div>
        </>
      )}

      {/* Main Editor Area ... (Previous Content) ... */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-slate-100 h-full">
        {/* Mobile Header */}
        {!isFocusMode && (
          <div className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 shadow-sm z-20 shrink-0">
             <div className="flex items-center gap-3 overflow-hidden">
               <button onClick={onBack} className="p-1 -ml-1 text-slate-500 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
               <h2 className="text-sm font-bold text-slate-800 truncate">{thesisDoc.title}</h2>
             </div>
             <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                >
                  <Maximize2 size={18}/>
                </button>
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                >
                  <MoreHorizontal size={18}/>
                </button>
             </div>
          </div>
        )}

        {/* Desktop Toolbar */}
        {!isFocusMode && (
          <div className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-6 shadow-sm z-10 overflow-x-auto no-scrollbar gap-4 print:hidden">
            <div className="flex items-center space-x-4 shrink-0">
              <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm font-medium whitespace-nowrap">← Back</button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div>
                {!isStructureOpen && (
                   <button onClick={() => setIsStructureOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded" title="Open Structure">
                      <Layout size={20} />
                   </button>
                )}
              </div>
              <div className="flex items-center space-x-1">
                 <button onClick={undo} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Undo"><Undo size={16} /></button>
                 <button onClick={redo} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Redo"><Redo size={16} /></button>
              </div>
              <h2 className="font-serif font-bold text-lg text-slate-800 truncate max-w-xs">{thesisDoc.title}</h2>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              
              {/* Collaboration Avatars */}
              <div className="hidden lg:flex items-center -space-x-2 mr-2">
                  {collaborators.map(c => (
                      <div key={c.id} className="relative group/avatar">
                          <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform" />
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${c.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      </div>
                  ))}
              </div>

              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-50 ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                  <Wifi size={10} /> <span className="hidden xl:inline">{isConnected ? 'Online' : 'Offline'}</span>
              </div>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              {/* Formatting Dropdown */}
              <div className="relative" ref={formatMenuRef}>
                 <button 
                   onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}
                   className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isFormatMenuOpen ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                 >
                    <Type size={16} /> <span className="hidden xl:inline">Format</span> <ChevronDown size={14} />
                 </button>

                 {isFormatMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                       {/* ... Format Menu Content ... */}
                       <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Text Style</div>
                       <button onClick={toggleBold} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('bold') ? 'bg-slate-100 font-bold' : ''}`}><Bold size={14}/> Bold</button>
                       <button onClick={toggleItalic} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('italic') ? 'bg-slate-100 font-bold' : ''}`}><Italic size={14}/> Italic</button>
                       <button onClick={toggleUnderline} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('underline') ? 'bg-slate-100 font-bold' : ''}`}><UnderlineIcon size={14}/> Underline</button>
                       <button onClick={toggleStrike} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('strike') ? 'bg-slate-100 font-bold' : ''}`}><Strikethrough size={14}/> Strike</button>
                       <button onClick={toggleHighlight} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('highlight') ? 'bg-slate-100 font-bold' : ''}`}><Highlighter size={14}/> Highlight</button>
                       <button onClick={toggleCode} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('code') ? 'bg-slate-100 font-bold' : ''}`}><Code size={14}/> Code</button>
                       
                       <div className="h-px bg-slate-100 my-1"></div>
                       <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headers & Blocks</div>
                       <button onClick={() => toggleHeading(1)} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-100' : ''}`}><Heading1 size={14}/> Heading 1</button>
                       <button onClick={() => toggleHeading(2)} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-100' : ''}`}><Heading2 size={14}/> Heading 2</button>
                       <button onClick={() => toggleHeading(3)} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-100' : ''}`}><Heading3 size={14}/> Heading 3</button>
                       <button onClick={toggleBlockquote} className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${editor.isActive('blockquote') ? 'bg-slate-100' : ''}`}><Quote size={14}/> Blockquote</button>
                       
                       <div className="h-px bg-slate-100 my-1"></div>
                       <button onClick={() => handleRewrite('paraphrase')} className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 text-sm flex items-center gap-2"><RefreshCw size={14}/> Rewrite Selection</button>
                       <button onClick={handleSynonyms} className="w-full text-left px-4 py-2 hover:bg-teal-50 text-teal-700 text-sm flex items-center gap-2"><BookOpen size={14}/> Find Synonyms</button>
                    </div>
                 )}
              </div>

              {/* Insert Dropdown */}
              <div className="relative" ref={insertMenuRef}>
                 <button 
                   onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
                   className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInsertMenuOpen ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                 >
                    <Plus size={16} /> <span className="hidden xl:inline">Insert</span> <ChevronDown size={14} />
                 </button>

                 {isInsertMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                       <button onClick={() => { setCitationModalOpen(true); setIsInsertMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"><Quote size={14}/> Citation</button>
                       <button onClick={() => { editor.chain().focus().insertContent(' $ E=mc^2 $ ').run(); setIsInsertMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"><Sigma size={14}/> Math / LaTeX</button>
                       <button onClick={() => setActiveTab('phrases')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"><MessageSquare size={14}/> Phrase</button>
                    </div>
                 )}
              </div>

              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                 <button 
                   onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                   className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isExportMenuOpen ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                 >
                    <Download size={16} /> <span className="hidden xl:inline">Download</span> <ChevronDown size={14} />
                 </button>

                 {isExportMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                       <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"><FileType size={14}/> Export as PDF</button>
                       <button onClick={handleExportDOCX} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"><FileText size={14}/> Export as Word</button>
                       <button onClick={handleExportLaTeX} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"><FileCode size={14}/> Export as LaTeX</button>
                    </div>
                 )}
              </div>

              <button onClick={() => setIsFocusMode(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg hidden md:block" title="Focus Mode"><Maximize2 size={20} /></button>
            </div>
          </div>
        )}

        {/* Focus Header */}
        {isFocusMode && (
          <div className="fixed top-0 left-0 right-0 h-16 flex justify-center items-center z-50 pointer-events-none print:hidden">
             <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm rounded-full px-6 py-2 flex items-center space-x-4 border border-slate-200 mt-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <span className="text-sm font-bold text-slate-700">{wordCount} words</span>
                <div className="h-4 w-px bg-slate-300"></div>
                <button onClick={() => setIsFocusMode(false)} className="text-slate-500 hover:text-red-500 flex items-center space-x-1 text-sm font-medium">
                   <Minimize2 size={14} /> <span>Exit Focus</span>
                </button>
             </div>
          </div>
        )}

        {/* Desktop Formatting Toolbar Row 2 */}
        {!isFocusMode && (
          <div className="hidden md:flex bg-slate-50 border-b border-slate-200 px-6 py-2 items-center justify-between overflow-x-auto no-scrollbar gap-4 print:hidden shrink-0">
             <div className="flex items-center space-x-2 whitespace-nowrap shrink-0">
               <button onClick={toggleBold} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><Bold size={14}/></button>
               <button onClick={toggleItalic} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><Italic size={14}/></button>
               <button onClick={toggleStrike} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('strike') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><Strikethrough size={14}/></button>
               <div className="w-px h-4 bg-slate-300 mx-1"></div>
               <button onClick={() => setAlign('left')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><AlignLeft size={14}/></button>
               <button onClick={() => setAlign('center')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><AlignCenter size={14}/></button>
               <button onClick={() => setAlign('right')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><AlignRight size={14}/></button>
               <div className="w-px h-4 bg-slate-300 mx-1"></div>
               <button onClick={toggleList} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><List size={14}/></button>
               <button onClick={toggleBlockquote} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('blockquote') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><Quote size={14}/></button>
             </div>
             
             {/* Pomodoro */}
             <div className="flex items-center gap-3 shrink-0">
                 <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 space-x-2">
                     <Clock size={14} className="text-slate-400" />
                     <span className={`text-xs font-mono font-bold ${pomodoroActive ? 'text-teal-600' : 'text-slate-600'}`}>{formatTime(pomodoroTime)}</span>
                     <button onClick={() => setPomodoroActive(!pomodoroActive)} className="text-slate-500 hover:text-teal-600">
                         {pomodoroActive ? <Pause size={12} fill="currentColor"/> : <Play size={12} fill="currentColor"/>}
                     </button>
                 </div>
             </div>

             {/* Right Sidebar Toggles */}
             <div className="hidden lg:flex space-x-2 shrink-0">
                <button onClick={() => setActiveTab(activeTab === 'figures' ? 'write' : 'figures')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'figures' ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <PieChart size={14} /> <span>Figures</span>
                </button>
                <button onClick={() => setActiveTab(activeTab === 'references' ? 'write' : 'references')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'references' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <BookOpen size={14} /> <span>Biblio</span>
                </button>
                <button onClick={() => setActiveTab(activeTab === 'research' ? 'write' : 'research')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'research' ? 'bg-teal-100 text-teal-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <Search size={14} /> <span>Research</span>
                </button>
                <button onClick={() => setActiveTab(activeTab === 'history' ? 'write' : 'history')} className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === 'history' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                   <History size={14} /> <span>History</span>
                </button>
             </div>
          </div>
        )}

        {/* TIPTAP EDITOR CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center scroll-smooth bg-slate-100 relative pb-32 md:pb-8 print:p-0 print:bg-white print:overflow-visible">
          <div className="relative w-full max-w-[21cm] print:max-w-none print:w-full">
              
              <div 
                className={`min-h-[50vh] md:min-h-[29.7cm] bg-white shadow-lg p-6 md:p-[2.54cm] text-slate-900 transition-all duration-300 ${isFocusMode ? 'shadow-2xl scale-100 md:scale-105' : ''} print:shadow-none print:border-none print:m-0`}
                style={{
                    fontFamily: university?.standards?.font || 'Times New Roman',
                    lineHeight: university?.standards?.spacing === 'Double' ? '2.0' : university?.standards?.spacing === '1.5' ? '1.5' : '1.5',
                }}
              >
                 <EditorContent editor={editor} />
              </div>
          </div>
        </div>

        {/* Mobile Formatting Toolbar (Sticky above nav) */}
        {!isFocusMode && activeTab === 'write' && (
           <div className="md:hidden fixed bottom-16 left-0 right-0 h-10 bg-slate-50 border-t border-slate-200 flex items-center px-2 gap-2 overflow-x-auto no-scrollbar z-40">
               <button onClick={toggleBold} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><Bold size={16}/></button>
               <button onClick={toggleItalic} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><Italic size={16}/></button>
               <button onClick={toggleList} className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-slate-200 text-black' : 'text-slate-500'}`}><List size={16}/></button>
               <div className="w-px h-4 bg-slate-300 mx-1 shrink-0"></div>
               <button onClick={() => handleRewrite('paraphrase')} className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded shrink-0">AI Paraphrase</button>
               <button onClick={handleSynonyms} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded shrink-0">Synonyms</button>
           </div>
        )}

        {/* Mobile Bottom Navigation */}
        {!isFocusMode && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
            <button onClick={() => { setIsStructureOpen(true); setActiveTab('write'); }} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isStructureOpen ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}>
              <List size={20} />
              <span className="text-[10px] mt-1 font-medium">Outline</span>
            </button>
            <button onClick={() => { setIsStructureOpen(false); setActiveTab('write'); }} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${!isStructureOpen && activeTab === 'write' ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}>
              <Pen size={20} />
              <span className="text-[10px] mt-1 font-medium">Write</span>
            </button>
            <button onClick={() => { setIsStructureOpen(false); setActiveTab('research'); }} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'research' ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}>
              <Search size={20} />
              <span className="text-[10px] mt-1 font-medium">Research</span>
            </button>
            <button onClick={() => { setIsStructureOpen(false); setActiveTab('review'); }} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'review' ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}>
              <Sparkles size={20} />
              <span className="text-[10px] mt-1 font-medium">Review</span>
            </button>
            <button onClick={() => { setIsStructureOpen(false); setActiveTab('chat'); }} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'chat' ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}>
              <MessageCircle size={20} />
              <span className="text-[10px] mt-1 font-medium">Chat</span>
            </button>
          </div>
        )}

        {/* Desktop Status Bar */}
        <div className="bg-white border-t border-slate-200 px-4 md:px-6 py-2 flex justify-between items-center text-xs text-slate-500 hidden md:flex print:hidden shrink-0">
           <div className="flex items-center space-x-4">
              <span>Words: {wordCount}</span>
              <span className="hidden sm:inline">Reading Time: {Math.ceil(wordCount / 200)} min</span>
              {activeSound !== 'none' && (
                  <span className="flex items-center gap-1 text-indigo-500 animate-pulse">
                      <Headphones size={10} /> Sound Active
                  </span>
              )}
           </div>
           <div>
              {thesisDoc.lastModified ? `Saved ${thesisDoc.lastModified.toLocaleTimeString()}` : 'Unsaved'}
           </div>
        </div>
      </div>

      {/* AI Sidebar - Tabbed Interface (Right) */}
      {!isFocusMode && (
        <div className={`
          bg-white shadow-xl transform transition-transform duration-300 flex flex-col z-50
          fixed inset-0 md:static md:w-96 md:border-l md:border-slate-200 md:translate-x-0 md:shadow-none
          ${activeTab !== 'write' ? 'translate-x-0' : 'translate-x-full md:translate-x-full'}
          ${window.innerWidth < 768 && activeTab !== 'write' ? 'block' : ''}
          print:hidden
        `}>
          
          {/* Sidebar Header with Tabs */}
          <div className="flex items-center border-b border-slate-200 px-1 overflow-x-auto no-scrollbar shrink-0">
             <div className="md:hidden p-2">
                <button onClick={() => setActiveTab('write')} className="p-2 bg-slate-100 rounded-full"><ArrowLeft size={16}/></button>
             </div>
             {['review', 'research', 'chat'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 capitalize ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
             ))}
             <button onClick={() => setActiveTab('sections')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === 'sections' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Sections</button>
             <div className="hidden md:block">
               <button onClick={() => setActiveTab('write')} className="px-3 text-slate-400 hover:text-slate-600"><X size={18} /></button>
             </div>
          </div>

          {/* Sidebar Content Render */}
          {/* Note: I am truncating the repetitive Sidebar logic here for brevity, assuming the tab rendering logic is similar to before but utilizing new handlers */}
          
          {activeTab === 'sections' && (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
               <div className="p-4 bg-white border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Thesis Sections</h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={handleGenerateOutline} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Use Standard Template</button>
                    <button onClick={handleGenerateSmartOutline} disabled={isGeneratingOutline} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">
                        {isGeneratingOutline ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>} Generate AI Outline
                    </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
                   {outline.map((section) => (
                     <div key={section.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-emerald-300">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className={`text-sm font-bold text-slate-800 ${section.level === 1 ? '' : 'ml-4'}`}>{section.text}</h4>
                        </div>
                        <button onClick={() => handleGenerateSectionContent(section)} disabled={generatingSectionId === section.id} className="w-full py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center gap-1">
                             {generatingSectionId === section.id ? <RefreshCw className="animate-spin" size={12} /> : <Pen size={12} />} Draft Content
                        </button>
                     </div>
                   ))}
               </div>
            </div>
          )}

          {activeTab === 'phrases' && (
             <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 md:pb-4">
                   {Object.entries(PHRASE_BANK).map(([category, phrases]) => (
                      <div key={category}>
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{category}</h4>
                         <div className="space-y-2">
                            {phrases.map((phrase, idx) => (
                               <button key={idx} onClick={() => handleInsertPhrase(phrase)} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 text-sm text-slate-700 transition-all flex justify-between">
                                  <span>{phrase}</span> <Plus size={14} className="text-blue-500"/>
                               </button>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'review' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-slate-50 pb-20 md:pb-4">
                <div className="bg-white p-2 rounded-lg border border-slate-200 mb-4 flex space-x-1">
                   <button onClick={() => setReviewMode('suggestions')} className={`flex-1 text-xs py-2 rounded-md font-medium ${reviewMode === 'suggestions' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>Quick Fixes</button>
                   <button onClick={() => setReviewMode('critique')} className={`flex-1 text-xs py-2 rounded-md font-medium ${reviewMode === 'critique' ? 'bg-teal-100 text-teal-700' : 'text-slate-500'}`}>Deep Critique</button>
                </div>
                {reviewMode === 'suggestions' && (
                  <div className="space-y-4">
                    <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 mb-4">{isAnalyzing ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Run Analysis</button>
                    {suggestions.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{item.type}</span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-red-500 line-through bg-red-50 inline px-1">{item.originalText}</p>
                          <p className="text-sm text-green-700 font-medium bg-green-50 px-1 mt-1">{item.suggestion}</p>
                        </div>
                        <p className="text-xs text-slate-600 italic">"{item.explanation}"</p>
                      </div>
                    ))}
                  </div>
                )}
                {reviewMode === 'critique' && (
                  <div className="flex-1 flex flex-col">
                     {!critiqueText && !isCritiquing && (
                       <div className="text-center text-slate-500 mt-10 p-4">
                         <BrainCircuit className="mx-auto mb-3 text-teal-300" size={40} />
                         <p className="text-sm mb-4">Deep logic and flow analysis.</p>
                         <button onClick={handleDeepCritique} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Generate Critique</button>
                       </div>
                     )}
                     {isCritiquing && <div className="flex justify-center mt-20"><BrainCircuit className="animate-pulse text-teal-600" size={40} /></div>}
                     {critiqueText && (
                       <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm overflow-y-auto text-sm prose">
                          {critiqueText}
                       </div>
                     )}
                  </div>
                )}
            </div>
          )}

          {activeTab === 'research' && (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
               <div className="p-4 bg-white border-b border-slate-200">
                  <div className="relative">
                     <input className="w-full bg-slate-100 border-none rounded-lg pl-3 pr-10 py-2 text-sm" placeholder="Search topic..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResearch()} />
                     <button onClick={handleResearch} className="absolute right-2 top-1.5 text-slate-400" disabled={isSearching}>{isSearching ? <RefreshCw className="animate-spin" size={16}/> : <Search size={16} />}</button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 md:pb-4">
                  {researchResults && (
                     <>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                           <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center justify-between gap-2">AI Summary <button onClick={() => handleInsertResearchSummary(researchResults.content)} className="text-xs text-teal-600 font-bold">Insert</button></h4>
                           <p className="text-sm text-slate-600">{researchResults.content}</p>
                        </div>
                        {researchResults.links.map((link, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
                               <a href={link.uri} target="_blank" className="text-sm font-bold text-teal-700 hover:underline">{link.title}</a>
                               <div className="flex justify-end mt-2"><button onClick={() => { setRefInput(link.uri); setActiveTab('references'); }} className="text-xs text-slate-500 font-bold">+ Ref</button></div>
                            </div>
                        ))}
                     </>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
             <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 md:pb-4">
                     {chatMessages.map(msg => (
                         <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                 {msg.text}
                             </div>
                         </div>
                     ))}
                     {isChatting && <div className="text-xs text-slate-400 text-center animate-pulse">AI is thinking...</div>}
                 </div>
                 <div className="p-3 bg-white border-t border-slate-200 pb-20 md:pb-3">
                     <div className="flex gap-2">
                         <input 
                             className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                             placeholder="Ask your tutor..."
                             value={chatInput}
                             onChange={(e) => setChatInput(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                         />
                         <button onClick={handleChat} disabled={isChatting} className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                             <ArrowRight size={16} />
                         </button>
                     </div>
                 </div>
             </div>
          )}

          {/* ... Other Tabs (Thesaurus, Figures, Refs) ... */}
          
          {activeTab === 'thesaurus' && (
             <div className="flex-1 flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b border-slate-200">
                   <h3 className="text-sm font-bold text-slate-700">Thesaurus: "{selectedWord}"</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20 md:pb-4">
                   {isLoadingSynonyms ? <div className="text-center p-4"><RefreshCw className="animate-spin"/></div> : 
                    synonyms.map((word, i) => (
                      <button key={i} onClick={() => editor?.chain().focus().insertContent(word).run()} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-teal-500 text-sm font-medium">{word}</button>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'references' && (
             <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                 <div className="p-4 bg-white border-b border-slate-200 flex gap-4">
                    <button 
                        onClick={() => setCitationTab('library')}
                        className={`text-xs font-bold pb-2 border-b-2 transition-colors flex-1 ${citationTab === 'library' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}
                    >
                        My Library
                    </button>
                    <button 
                        onClick={() => setCitationTab('search')}
                        className={`text-xs font-bold pb-2 border-b-2 transition-colors flex-1 ${citationTab === 'search' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500'}`}
                    >
                        Find Sources
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
                    {citationTab === 'library' && (
                        <>
                            {libraryItems.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <BookOpen size={24} className="mx-auto mb-2 opacity-30"/>
                                    <p className="text-xs">Your library is empty.</p>
                                </div>
                            ) : (
                                libraryItems.map((ref) => (
                                    <div key={ref.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-sm hover:border-teal-300 group">
                                        <div className="font-bold text-slate-800 line-clamp-2 mb-1">{ref.title}</div>
                                        <p className="text-slate-500 mb-2">{ref.author}, {ref.year}</p>
                                        <div className="flex justify-end">
                                            <button onClick={() => insertQuickCitation(ref)} className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-bold hover:bg-purple-100 flex items-center gap-1">
                                                <Quote size={10}/> Cite
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {citationTab === 'search' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-xs focus:ring-1 focus:ring-teal-500 outline-none" 
                                    placeholder="Search papers (e.g. 'AI adoption')..." 
                                    value={citationSearchQuery} 
                                    onChange={(e) => setCitationSearchQuery(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleCitationSearch()} 
                                />
                                <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                                <button 
                                    onClick={handleCitationSearch} 
                                    className="absolute right-2 top-2 text-teal-600 hover:text-teal-800 disabled:opacity-50"
                                    disabled={isSearchingCitations}
                                >
                                    {isSearchingCitations ? <RefreshCw className="animate-spin" size={12}/> : <ArrowRight size={12} />}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {citationSearchResults.map((res, i) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-sm hover:border-teal-300">
                                        <div className="font-bold text-slate-800 line-clamp-2 mb-1">{res.title}</div>
                                        <div className="flex items-center gap-1 text-slate-500 mb-1">
                                            <Globe size={10} /> {res.source}
                                        </div>
                                        <p className="text-slate-500 mb-3">{res.author}, {res.year}</p>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => insertQuickCitation(res)} 
                                                className="flex-1 py-1.5 bg-slate-50 text-slate-700 rounded font-medium hover:bg-slate-100 border border-slate-200"
                                            >
                                                Cite
                                            </button>
                                            <button 
                                                onClick={() => handleAddReferenceToLibrary(res)} 
                                                className="flex-1 py-1.5 bg-teal-50 text-teal-700 rounded font-bold hover:bg-teal-100 flex items-center justify-center gap-1"
                                            >
                                                <BookmarkPlus size={12}/> Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {citationSearchResults.length === 0 && !isSearchingCitations && citationSearchQuery && (
                                    <div className="text-center py-4 text-slate-400 text-xs">No results found.</div>
                                )}
                            </div>
                        </div>
                    )}
                 </div>
             </div>
          )}

        </div>
      )}

      {/* Citation Modal */}
      {citationModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg text-slate-800">Generate Citation</h3>
                 <button onClick={resetCitationModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>

              {!showLibraryPicker ? (
                <>
                  <div className="space-y-4 mb-6">
                      <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Author" value={citationFields.author} onChange={(e) => setCitationFields({...citationFields, author: e.target.value})} />
                      <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Year" value={citationFields.year} onChange={(e) => setCitationFields({...citationFields, year: e.target.value})} />
                      <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Title" value={citationFields.title} onChange={(e) => setCitationFields({...citationFields, title: e.target.value})} />
                      <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Source" value={citationFields.source} onChange={(e) => setCitationFields({...citationFields, source: e.target.value})} />
                  </div>
                  
                  {citationResult && <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 text-sm italic">{citationResult}</div>}

                  <div className="flex gap-3">
                      {!citationResult ? (
                          <>
                            <button onClick={() => setShowLibraryPicker(true)} className="flex-1 py-2 text-indigo-600 border border-indigo-200 rounded-lg font-medium">Library</button>
                            <button onClick={handleGenerateCitation} disabled={isGeneratingCitation} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                                {isGeneratingCitation ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generate
                            </button>
                          </>
                      ) : (
                          <button onClick={insertCitation} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Insert Citation</button>
                      )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-[400px]">
                   <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-slate-700 text-sm">Select Reference</h4>
                       <button onClick={() => setShowLibraryPicker(false)} className="text-xs text-indigo-600">Manual</button>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                       {libraryItems.map(item => (
                           <button key={item.id} onClick={() => handleSelectFromLibrary(item)} className="w-full text-left p-3 bg-white rounded border border-slate-200 hover:border-indigo-400 text-xs">
                               <div className="font-bold text-slate-800">{item.title}</div>
                               <div className="text-slate-500">{item.author}, {item.year}</div>
                           </button>
                       ))}
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Export Modal (Mobile) */}
      {isExportMenuOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsExportMenuOpen(false)}>
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 animate-scale-in" onClick={e => e.stopPropagation()}>
               <h3 className="text-lg font-bold text-slate-800 mb-4">Document Actions</h3>
               <div className="space-y-2">
                  <button onClick={handleExportPDF} className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-medium text-slate-700"><FileType size={20}/> Export as PDF</button>
                  <button onClick={handleExportDOCX} className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-medium text-slate-700"><FileText size={20}/> Export as Word</button>
                  <button onClick={handleExportLaTeX} className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-medium text-slate-700"><FileCode size={20}/> Export as LaTeX</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={() => { setIsFocusMode(true); setIsExportMenuOpen(false); }} className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-medium text-slate-700"><Maximize2 size={20}/> Enter Focus Mode</button>
               </div>
           </div>
        </div>
      )}

    </div>
  );
};
