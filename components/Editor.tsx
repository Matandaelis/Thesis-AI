
import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';

import { 
  Save, Download, Bot, Check, X, RefreshCw, Quote, 
  Bold, Italic, List, AlignLeft, Sparkles, Search, 
  BookOpen, Maximize2, Pen,
  Mic, Volume2, Plus, Trash2, Copy, BrainCircuit,
  ArrowRight, ArrowLeft, ChevronDown, ChevronRight, Type,
  Share2, ArrowDown, AlignCenter, AlignRight, Underline as UnderlineIcon, Highlighter,
  Strikethrough, Code, Image as ImageIcon, FileText, Settings, Link as LinkIcon,
  ListOrdered, ShieldCheck, AlertTriangle, Video, MicOff, Send,
  Table as TableIcon, Columns, Rows, Scissors, Palette, Undo, Redo, Layout, GraduationCap,
  Menu, PanelLeft, PanelRight, ChevronUp, ZoomIn, ZoomOut, MessageSquare, HelpCircle, CheckCircle2, User, MoreVertical
} from 'lucide-react';
import { Document, AISuggestion, University, ChatMessage, ResearchResponse, Reference, ChartData, LibraryItem, ValidationReport, ValidationIssue, Annotation } from '../types';
import { GeminiService } from '../services/geminiService';
import { CitationService } from '../services/citationService';
import { dbService } from '../services/dbService';
import { PHRASE_BANK } from '../lib/constants';
import { VivaMode } from './VivaMode';

interface EditorProps {
  // Thesis Writing Props
  document?: Document;
  university?: University | null;
  onSave?: (doc: Document) => void;
  libraryItems?: LibraryItem[];
  onAddToLibrary?: (update: (prev: LibraryItem[]) => LibraryItem[]) => void;

  // Paper Annotation Props
  paper?: LibraryItem;

  // Common Props
  onBack: () => void;
}

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  index: number;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isActive: boolean;
}

// ==========================================
// SUB-COMPONENT: Paper Annotator (Reading Mode)
// ==========================================
const PaperAnnotator: React.FC<{ paper: LibraryItem, onBack: () => void }> = ({ paper, onBack }) => {
  const [scale, setScale] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'cursor' | 'highlight' | 'comment' | 'question'>('cursor');
  const [selectedText, setSelectedText] = useState<{ text: string, x: number, y: number } | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'annotations' | 'ai'>('annotations');
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAnnotations = async () => {
        const data = await dbService.getAnnotations(paper.id);
        setAnnotations(data);
    };
    loadAnnotations();
  }, [paper.id]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
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
        position: { page: 1, quote: selectedText.text, x: selectedText.x, y: selectedText.y },
        createdAt: new Date(),
        status: 'active'
    };
    setAnnotations(prev => [newAnnotation, ...prev]);
    await dbService.saveAnnotation(newAnnotation);
    setSelectedText(null);
    if (type === 'comment' || type === 'question') setSidebarTab('annotations');
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
      const context = `Currently reading paper: "${paper.title}". Context from paper: ${paper.fullText ? paper.fullText.substring(0, 5000) : "No full text available"}`;
      try {
          const response = await GeminiService.chatWithTutor(userMsg.text, context);
          setAiChatHistory(prev => [...prev, { role: 'model', text: response }]);
      } catch (e) { console.error(e); } 
      finally { setIsAiLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-screen w-screen">
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
            <div className="flex flex-col">
                <h1 className="font-bold text-slate-800 text-sm truncate max-w-xs md:max-w-md">{paper.title}</h1>
                <span className="text-[10px] text-slate-500">{paper.author} • {paper.year}</span>
            </div>
         </div>
         <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTool('cursor')} className={`p-1.5 rounded ${activeTool === 'cursor' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}><span className="font-serif text-sm px-1">I</span></button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button onClick={() => setActiveTool('highlight')} className={`p-1.5 rounded ${activeTool === 'highlight' ? 'bg-white shadow text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}><Highlighter size={16} /></button>
            <button onClick={() => setActiveTool('comment')} className={`p-1.5 rounded ${activeTool === 'comment' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><MessageSquare size={16} /></button>
            <button onClick={() => setActiveTool('question')} className={`p-1.5 rounded ${activeTool === 'question' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}><HelpCircle size={16} /></button>
         </div>
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
      <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-slate-200 overflow-auto relative flex justify-center p-8 custom-scrollbar" onMouseUp={handleMouseUp}>
              <div ref={viewerRef} className="bg-white shadow-2xl transition-transform origin-top" style={{ width: '800px', minHeight: '1100px', transform: `scale(${scale})`, padding: '3rem 4rem' }}>
                  <div className="prose prose-slate max-w-none font-serif text-justify selection:bg-teal-100 selection:text-teal-900">
                      <h1 className="text-3xl font-bold mb-4">{paper.title}</h1>
                      <div className="text-sm text-slate-600 mb-8 pb-4 border-b border-slate-100">
                          <p><strong>Authors:</strong> {paper.author}</p>
                          <p><strong>Published:</strong> {paper.source}, {paper.year}</p>
                          <p><strong>DOI:</strong> 10.1038/nature.2024.12345</p>
                      </div>
                      <h2 className="text-xl font-bold mb-2">Abstract</h2>
                      <p className="mb-6">{paper.notes || "This is a simulated abstract for annotation demo."}</p>
                      <h2 className="text-xl font-bold mb-2">1. Introduction</h2>
                      <p className="mb-4">Recent advancements in generative AI have transformed academic workflows. The integration of Large Language Models (LLMs) into research processes offers unprecedented efficiency gains.</p>
                      {paper.fullText && <div className="whitespace-pre-wrap mt-8 pt-8 border-t border-slate-200 text-slate-700">{paper.fullText}</div>}
                  </div>
              </div>
              {selectedText && (
                  <div className="absolute bg-slate-900 text-white rounded-lg shadow-xl p-1.5 flex gap-1 z-50 animate-scale-in" style={{ top: (selectedText.y * scale) - 50, left: (selectedText.x * scale) }}>
                      <button onClick={() => createAnnotation('highlight', 'yellow')} className="p-1.5 hover:bg-slate-700 rounded text-yellow-400"><Highlighter size={16}/></button>
                      <button onClick={() => createAnnotation('highlight', 'green')} className="p-1.5 hover:bg-slate-700 rounded text-green-400"><Highlighter size={16}/></button>
                      <button onClick={() => createAnnotation('comment')} className="p-1.5 hover:bg-slate-700 rounded text-blue-400"><MessageSquare size={16}/></button>
                      <button onClick={() => createAnnotation('question')} className="p-1.5 hover:bg-slate-700 rounded text-rose-400"><HelpCircle size={16}/></button>
                      <div className="w-px h-6 bg-slate-700 mx-1"></div>
                      <button onClick={() => { setAiInput(`Explain this: "${selectedText.text}"`); setSidebarTab('ai'); setSelectedText(null); }} className="p-1.5 hover:bg-slate-700 rounded text-teal-400 flex items-center gap-1"><Sparkles size={14} /> <span className="text-xs font-bold">Ask AI</span></button>
                  </div>
              )}
          </div>
          <div className="w-80 md:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 z-30 shadow-xl">
              <div className="flex border-b border-slate-200">
                  <button onClick={() => setSidebarTab('annotations')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${sidebarTab === 'annotations' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Annotations <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">{annotations.length}</span></button>
                  <button onClick={() => setSidebarTab('ai')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${sidebarTab === 'ai' ? 'border-indigo-600 text-indigo-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Assistant</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                  {sidebarTab === 'annotations' ? (
                      <div className="space-y-4">
                          {annotations.length === 0 && <div className="text-center py-10 text-slate-400"><Highlighter size={32} className="mx-auto mb-2 opacity-50"/><p className="text-sm">Select text to add notes.</p></div>}
                          {annotations.map(ann => (
                              <div key={ann.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${ann.type === 'highlight' ? (ann.color === 'yellow' ? 'bg-yellow-400' : ann.color === 'green' ? 'bg-green-400' : 'bg-blue-400') : ann.type === 'question' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                                          <span className="text-xs font-bold text-slate-500 uppercase">{ann.type}</span>
                                          <span className="text-[10px] text-slate-400">{ann.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                      <button onClick={() => handleDeleteAnnotation(ann.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                  </div>
                                  {ann.position.quote && <blockquote className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 mb-2 line-clamp-3">"{ann.position.quote}"</blockquote>}
                                  {ann.type !== 'highlight' && <div className="text-sm text-slate-800 font-medium">{ann.content}</div>}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col h-full">
                          <div className="flex-1 space-y-4 mb-4">
                              <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800"><p className="font-bold flex items-center gap-2 mb-1"><Sparkles size={14}/> Research Assistant</p>I can summarize sections, explain jargon, or suggest related papers.</div>
                              {aiChatHistory.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>{msg.text}</div></div>))}
                              {isAiLoading && <div className="flex items-center gap-2 text-xs text-slate-400 pl-2"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div></div>}
                          </div>
                          <div className="relative">
                              <input className="w-full border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ask about this paper..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} />
                              <button onClick={handleAiAsk} className="absolute right-2 top-2 p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><ChevronRight size={16} /></button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Thesis Writer (Writing Mode)
// ==========================================
const ThesisWriter: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack, libraryItems, onAddToLibrary }) => {
  if (!thesisDoc) return null;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'review' | 'research' | 'chat' | 'thesaurus' | 'sections' | 'viva'>('write');
  const [mobileTab, setMobileTab] = useState<'editor' | 'structure' | 'tools'>('editor');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [reviewMode, setReviewMode] = useState<'suggestions' | 'critique' | 'validation'>('suggestions');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 'u1', name: 'Dr. Kimani', color: '#ef4444', avatar: 'https://i.pravatar.cc/150?u=a', isActive: true },
    { id: 'u2', name: 'Sarah', color: '#f59e0b', avatar: 'https://i.pravatar.cc/150?u=b', isActive: true }
  ]);
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [citationFields, setCitationFields] = useState({ author: '', year: '', title: '', source: '' });
  const [citationResult, setCitationResult] = useState('');
  const [isGeneratingCitation, setIsGeneratingCitation] = useState(false);
  const [isVivaModeOpen, setIsVivaModeOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing your thesis chapter here...' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      Image,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      TextStyle, Color, FontFamily,
    ],
    content: thesisDoc.content,
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      setCharCount(editor.storage.characterCount.characters());
      const json = editor.getJSON();
      const newOutline: OutlineItem[] = [];
      let index = 0;
      const traverse = (node: any) => {
        if (node.type === 'heading') {
           const text = node.content?.[0]?.text || 'Untitled Section';
           newOutline.push({ id: `head-${index}`, text, level: node.attrs?.level || 1, index });
           index++;
        } else if (node.content) {
           node.content.forEach(traverse);
        }
      };
      if(json.content) json.content.forEach(traverse);
      if (JSON.stringify(newOutline) !== JSON.stringify(outline)) setOutline(newOutline);
    },
    editorProps: { attributes: { class: 'prose prose-sm md:prose-lg max-w-none focus:outline-none min-h-[50vh] md:min-h-[100vh] outline-none academic-paper-content px-1' } },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editor && onSave) onSave({ ...thesisDoc, content: editor.getHTML(), lastModified: new Date() });
    }, 5000);
    return () => clearTimeout(timer);
  }, [editor?.getHTML(), thesisDoc, onSave]);

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run();
  const setAlign = (align: 'left' | 'center' | 'right' | 'justify') => editor?.chain().focus().setTextAlign(align).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const insertImage = () => { const url = window.prompt('Enter image URL'); if (url) editor?.chain().focus().setImage({ src: url }).run(); };
  const insertLink = () => {
      const previousUrl = editor?.getAttributes('link').href;
      const url = window.prompt('URL', previousUrl);
      if (url === null) return;
      if (url === '') { editor?.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const insertTable = () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  const setFontFamily = (font: string) => editor?.chain().focus().setFontFamily(font).run();
  const undo = () => editor?.chain().focus().undo().run();
  const redo = () => editor?.chain().focus().redo().run();

  const handleAnalyze = async () => {
    if (!editor) return;
    setIsAnalyzing(true);
    setReviewMode('suggestions');
    setActiveTab('review');
    if (window.innerWidth < 768) setMobileTab('tools');
    try {
      const results = await GeminiService.analyzeText(editor.getText(), university || null);
      setSuggestions(results);
    } catch (e) { console.error(e); } 
    finally { setIsAnalyzing(false); }
  };

  const handleValidate = async () => {
    if (!editor) return;
    setIsValidating(true);
    setReviewMode('validation');
    setActiveTab('review');
    if (window.innerWidth < 768) setMobileTab('tools');
    try {
      const report = await GeminiService.validateResearch(editor.getText());
      setValidationReport(report);
    } catch (e) { console.error(e); }
    finally { setIsValidating(false); }
  };

  const handleGenerateCitation = async () => {
    if (!citationFields.title) return;
    setIsGeneratingCitation(true);
    try {
      const res = CitationService.formatCitation(citationFields, university?.standards.citationStyle || 'APA 7th');
      setCitationResult(res);
    } catch (e) { console.error(e); } 
    finally { setIsGeneratingCitation(false); }
  };

  const insertCitation = () => {
    if (editor) {
        editor.chain().focus().insertContent(` ${citationResult} `).run();
        setCitationModalOpen(false);
    }
  };

  if (!editor) return <div className="flex h-full items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-teal-600"/></div>;

  const renderStructureContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase">Document Map</span>
            <button onClick={() => setIsStructureOpen(false)} className="hidden md:block"><X size={14} className="text-slate-400"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
            {outline.length === 0 ? <p className="text-xs text-slate-400 p-2 italic">Add headings to see structure.</p> : (
                outline.map(item => (
                    <button key={item.id} onClick={() => setMobileTab('editor')} className={`block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 truncate ${item.level === 1 ? 'font-bold text-slate-800' : 'pl-4 text-slate-600'}`}>{item.text}</button>
                ))
            )}
        </div>
    </div>
  );

  const renderToolsContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="flex border-b border-slate-200 shrink-0">
            <button onClick={() => setActiveTab('review')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'review' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Review</button>
            <button onClick={() => setActiveTab('research')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'research' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Research</button>
            <button onClick={() => setActiveTab('viva')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'viva' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Viva</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {activeTab === 'review' && (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg border border-slate-200">
                        <button onClick={() => setReviewMode('suggestions')} className={`flex-1 py-1.5 text-xs font-bold rounded ${reviewMode === 'suggestions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>Basics</button>
                        <button onClick={() => setReviewMode('validation')} className={`flex-1 py-1.5 text-xs font-bold rounded ${reviewMode === 'validation' ? 'bg-teal-50 text-teal-700' : 'text-slate-500'}`}>Validation</button>
                    </div>
                    {reviewMode === 'suggestions' && (
                    <>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 text-xs">
                            <div className="flex items-center gap-2 font-bold text-indigo-800 mb-2"><GraduationCap size={14} /> {university?.name || "Standard Config"}</div>
                            <div className="grid grid-cols-2 gap-2 text-indigo-700"><div><span className="block text-[10px] text-indigo-400 uppercase font-bold">Citation</span>{university?.standards.citationStyle || "APA 7th"}</div><div><span className="block text-[10px] text-indigo-400 uppercase font-bold">Font</span>{university?.standards.font || "Times New Roman"}</div></div>
                        </div>
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-sm flex items-center justify-center gap-2">{isAnalyzing ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>} Run Audit</button>
                        {suggestions.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 rounded uppercase">{item.type}</span></div>
                                <p className="text-xs text-slate-500 line-through mb-1">{item.originalText}</p>
                                <p className="text-sm font-medium text-green-700 mb-2">{item.suggestion}</p>
                                <p className="text-xs text-slate-400 italic">"{item.explanation}"</p>
                            </div>
                        ))}
                    </>
                    )}
                    {reviewMode === 'validation' && (
                    <>
                        <button onClick={handleValidate} disabled={isValidating} className="w-full py-2 bg-teal-600 text-white rounded font-bold text-sm flex items-center justify-center gap-2">{isValidating ? <RefreshCw className="animate-spin" size={14}/> : <ShieldCheck size={14}/>} Deep Validate</button>
                        {validationReport && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-3 gap-2">{[{ label: 'Fact', score: validationReport.factScore }, { label: 'Integrity', score: validationReport.integrityScore }, { label: 'Quality', score: validationReport.qualityScore }].map((m, i) => (<div key={i} className="text-center p-2 bg-white rounded border border-slate-200"><div className={`text-xl font-bold ${m.score > 80 ? 'text-green-600' : 'text-orange-500'}`}>{m.score}</div><div className="text-[9px] uppercase text-slate-400 font-bold">{m.label}</div></div>))}</div>
                                <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600"><span className="font-bold text-slate-800">Summary: </span>{validationReport.summary}</div>
                                {validationReport.issues.map((issue: ValidationIssue) => (<div key={issue.id} className={`p-3 rounded border bg-white ${issue.severity === 'high' ? 'border-red-200' : 'border-slate-200'}`}><div className="flex justify-between items-start mb-1"><span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${issue.category === 'fact' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{issue.category}</span><span className={`text-[9px] font-bold ${issue.severity === 'high' ? 'text-red-600' : 'text-slate-400'}`}>{issue.severity}</span></div><p className="font-bold text-xs text-slate-800 mb-1">{issue.issue}</p><p className="text-xs text-slate-500 italic mb-2">"{issue.text}"</p><div className="flex items-center gap-1 text-xs text-teal-700 font-medium"><Check size={10} /> {issue.recommendation}</div></div>))}
                            </div>
                        )}
                    </>
                    )}
                </div>
            )}
            {activeTab === 'research' && <div className="text-center text-slate-400 py-10"><BookOpen size={32} className="mx-auto mb-2 opacity-50"/><p className="text-sm">Search library or web sources.</p></div>}
            {activeTab === 'chat' && <div className="text-center text-slate-400 py-10"><Bot size={32} className="mx-auto mb-2 opacity-50"/><p className="text-sm">Ask your AI supervisor.</p></div>}
            {activeTab === 'viva' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="p-4 bg-teal-100 rounded-full text-teal-600"><Mic size={32} /></div>
                    <div><h3 className="text-lg font-bold text-slate-800">Viva Defense Practice</h3><p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-2">Simulate your thesis defense with a real-time AI voice interviewer.</p></div>
                    <button onClick={() => setIsVivaModeOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"><Video size={18} /> Start Session</button>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 bg-slate-100 flex flex-col z-50 transition-all duration-300 ${isFocusMode ? 'p-0' : ''}`}>
      {!isFocusMode && (
        <div className="bg-white border-b border-slate-200 shadow-sm z-30 flex flex-col shrink-0 sticky top-0">
            <div className="flex items-center justify-between px-3 md:px-4 h-12 border-b border-slate-100">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium shrink-0"><ArrowLeft size={18}/> <span className="hidden md:inline">Back</span></button>
                    <div className="h-4 w-px bg-slate-200 shrink-0"></div>
                    <input className="font-serif font-bold text-base md:text-lg text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400 truncate min-w-0 flex-1" defaultValue={thesisDoc.title} onBlur={(e) => onSave && onSave({ ...thesisDoc, title: e.target.value })} />
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded hidden md:inline-block shrink-0">{wordCount} words</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-2 mr-2 hidden md:flex">{collaborators.map(c => (<img key={c.id} src={c.avatar} className="w-6 h-6 rounded-full border border-white" title={c.name} />))}</div>
                    <button onClick={() => setIsMobileToolbarOpen(!isMobileToolbarOpen)} className={`p-1.5 rounded md:hidden transition-colors ${isMobileToolbarOpen ? 'bg-slate-100 text-teal-600' : 'text-slate-500'}`} title="Toggle Formatting"><Type size={18} /></button>
                    <button onClick={() => setIsFocusMode(true)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden md:block" title="Focus Mode"><Maximize2 size={16}/></button>
                    <button onClick={() => onSave && onSave({...thesisDoc, content: editor.getHTML()})} className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Save size={14}/><span className="hidden md:inline">Save</span></button>
                </div>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-slate-50/50 w-full border-b border-slate-200 ${isMobileToolbarOpen ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 border-none'} md:max-h-12 md:opacity-100`}>
                <div className="flex items-center px-2 py-1 gap-1 overflow-x-auto no-scrollbar w-full h-full">
                    <div className="flex items-center gap-0.5 border-r border-slate-300 pr-2 mr-2 shrink-0">
                        <button onClick={undo} disabled={!editor.can().undo()} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30"><Undo size={16}/></button>
                        <button onClick={redo} disabled={!editor.can().redo()} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30"><Redo size={16}/></button>
                    </div>
                    <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-2 shrink-0">
                        <select className="bg-transparent text-sm border border-slate-200 rounded px-1 md:px-2 py-1 w-24 md:w-32 focus:outline-none focus:border-teal-500 cursor-pointer text-xs md:text-sm" onChange={(e) => setFontFamily(e.target.value)} value={editor.getAttributes('textStyle').fontFamily || 'Inter'}><option value="Inter">Inter</option><option value="Times New Roman">Times</option><option value="Arial">Arial</option><option value="Calibri">Calibri</option><option value="Georgia">Georgia</option></select>
                        <button onClick={toggleBold} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-black' : 'text-slate-600'}`}><Bold size={16}/></button>
                        <button onClick={toggleItalic} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-black' : 'text-slate-600'}`}><Italic size={16}/></button>
                        <button onClick={toggleUnderline} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('underline') ? 'bg-slate-200 text-black' : 'text-slate-600'}`}><UnderlineIcon size={16}/></button>
                        <button onClick={toggleHighlight} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('highlight') ? 'bg-yellow-200 text-black' : 'text-slate-600'}`}><Highlighter size={16}/></button>
                    </div>
                    <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-2 shrink-0">
                        <button onClick={() => setAlign('left')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}`}><AlignLeft size={16}/></button>
                        <button onClick={() => setAlign('center')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}`}><AlignCenter size={16}/></button>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        <button onClick={toggleBulletList} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}><List size={16}/></button>
                        <button onClick={toggleOrderedList} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-200' : ''}`}><ListOrdered size={16}/></button>
                    </div>
                    <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-2 shrink-0">
                        <button onClick={insertImage} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Insert Image"><ImageIcon size={16}/></button>
                        <button onClick={insertLink} className={`p-1.5 hover:bg-slate-200 rounded ${editor.isActive('link') ? 'bg-teal-100 text-teal-700' : 'text-slate-600'}`} title="Insert Link"><LinkIcon size={16}/></button>
                        <button onClick={insertTable} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Insert Table"><TableIcon size={16}/></button>
                        <button onClick={() => setCitationModalOpen(true)} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Add Citation"><Quote size={16}/></button>
                    </div>
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                        <button onClick={() => { setActiveTab('review'); handleAnalyze(); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-xs font-bold"><Sparkles size={14}/> AI Check</button>
                        <button onClick={() => setShowFindReplace(!showFindReplace)} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Search size={16}/></button>
                    </div>
                </div>
            </div>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden relative">
          {!isFocusMode && isStructureOpen && <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">{renderStructureContent()}</div>}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-0 md:p-8 flex justify-center scroll-smooth relative">
              {showFindReplace && (
                  <div className="absolute top-4 right-8 z-30 bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-72 animate-fade-in-down">
                      <div className="flex justify-between items-center mb-2"><h4 className="text-xs font-bold text-slate-700">Find & Replace</h4><button onClick={() => setShowFindReplace(false)}><X size={14} className="text-slate-400"/></button></div>
                      <input className="w-full border border-slate-200 rounded px-2 py-1 text-xs mb-2" placeholder="Find..." value={findText} onChange={e => setFindText(e.target.value)} />
                      <div className="flex gap-2"><button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1 rounded">Find Next</button></div>
                  </div>
              )}
              <div className="w-full h-full md:w-auto md:h-auto">
                  <div className={`bg-white transition-all duration-300 ${mobileTab === 'editor' ? 'block' : 'hidden md:block'} ${isFocusMode ? 'scale-105 my-0 shadow-none' : 'md:my-4 md:shadow-xl'} w-full min-h-full p-4 md:min-h-[29.7cm] md:w-[21cm] md:p-[2.54cm]`} style={{ fontFamily: university?.standards?.font || 'Times New Roman', lineHeight: university?.standards?.spacing === 'Double' ? '2.0' : university?.standards?.spacing === '1.5' ? '1.5' : '1.5', fontSize: `${university?.standards?.size || 12}pt` }}>
                      <EditorContent editor={editor} />
                  </div>
                  {mobileTab === 'structure' && <div className="md:hidden w-full h-full bg-white p-4"><h2 className="text-lg font-bold text-slate-800 mb-4">Structure</h2>{renderStructureContent()}</div>}
                  {mobileTab === 'tools' && <div className="md:hidden w-full h-full bg-white flex flex-col">{renderToolsContent()}</div>}
              </div>
          </div>
          {!isFocusMode && <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 hidden md:flex">{renderToolsContent()}</div>}
      </div>
      {!isFocusMode && (
          <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 z-40">
              <button onClick={() => setMobileTab('editor')} className={`flex flex-col items-center justify-center w-full h-full ${mobileTab === 'editor' ? 'text-teal-600' : 'text-slate-400'}`}><Pen size={20} /><span className="text-[10px] font-bold mt-0.5">Editor</span></button>
              <button onClick={() => setMobileTab('structure')} className={`flex flex-col items-center justify-center w-full h-full ${mobileTab === 'structure' ? 'text-teal-600' : 'text-slate-400'}`}><PanelLeft size={20} /><span className="text-[10px] font-bold mt-0.5">Outline</span></button>
              <button onClick={() => setMobileTab('tools')} className={`flex flex-col items-center justify-center w-full h-full ${mobileTab === 'tools' ? 'text-teal-600' : 'text-slate-400'}`}><PanelRight size={20} /><span className="text-[10px] font-bold mt-0.5">Tools</span></button>
          </div>
      )}
      {!isFocusMode && mobileTab === 'editor' && (
          <div className="h-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-4 text-[9px] md:text-[10px] text-slate-500 font-medium z-20 shrink-0">
              <div className="flex gap-4"><span>{wordCount}w</span><span>{charCount}c</span><span className="hidden md:inline">{Math.ceil(wordCount / 200)} min read</span></div>
              <div><span>Saved: {thesisDoc.lastModified.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
          </div>
      )}
      {citationModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800">Generate Citation</h3><button onClick={() => setCitationModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
              <div className="space-y-4 mb-6">
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Author" value={citationFields.author} onChange={(e) => setCitationFields({...citationFields, author: e.target.value})} />
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Year" value={citationFields.year} onChange={(e) => setCitationFields({...citationFields, year: e.target.value})} />
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Title" value={citationFields.title} onChange={(e) => setCitationFields({...citationFields, title: e.target.value})} />
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Source" value={citationFields.source} onChange={(e) => setCitationFields({...citationFields, source: e.target.value})} />
              </div>
              {citationResult && <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 text-sm italic">{citationResult}</div>}
              <div className="flex gap-3">
                  {!citationResult ? (<button onClick={handleGenerateCitation} disabled={isGeneratingCitation} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">{isGeneratingCitation ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generate</button>) : (<button onClick={insertCitation} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold">Insert Citation</button>)}
              </div>
           </div>
        </div>
      )}
      {isVivaModeOpen && <VivaMode onClose={() => setIsVivaModeOpen(false)} contextText={editor?.getText()} />}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT: Editor Dispatcher
// ==========================================
export const Editor: React.FC<EditorProps> = (props) => {
  if (props.paper) {
    return <PaperAnnotator paper={props.paper} onBack={props.onBack} />;
  }
  return <ThesisWriter {...props} />;
};
