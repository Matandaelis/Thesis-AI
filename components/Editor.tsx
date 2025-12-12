
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
  ArrowRight, ArrowLeft, ChevronDown, Type,
  Share2, ArrowDown, AlignCenter, AlignRight, Underline as UnderlineIcon, Highlighter,
  Strikethrough, Code, Image as ImageIcon, FileText, Settings, Link as LinkIcon,
  ListOrdered, ShieldCheck, AlertTriangle, Video, MicOff, Send,
  Table as TableIcon, Columns, Rows, Scissors, Palette, Undo, Redo, Layout, GraduationCap,
  Menu, PanelLeft, PanelRight
} from 'lucide-react';
import { Document, AISuggestion, University, ChatMessage, ResearchResponse, Reference, ChartData, LibraryItem, ValidationReport, ValidationIssue } from '../types';
import { GeminiService } from '../services/geminiService';
import { CitationService } from '../services/citationService';
import { PHRASE_BANK } from '../lib/constants';
import { VivaMode } from './VivaMode';

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

interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isActive: boolean;
}

export const Editor: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack, libraryItems, onAddToLibrary }) => {
  // --- STATE MANAGEMENT ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'write' | 'review' | 'research' | 'chat' | 'thesaurus' | 'sections' | 'viva'>('write'); // Desktop Tab Logic
  const [mobileTab, setMobileTab] = useState<'editor' | 'structure' | 'tools'>('editor'); // Mobile View Logic
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  
  // AI Features State
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [reviewMode, setReviewMode] = useState<'suggestions' | 'critique' | 'validation'>('suggestions');
  const [critiqueText, setCritiqueText] = useState('');
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Content State
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const wordTarget = 5000;
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  
  // Search & Find
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Collaboration (Simulated)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: 'u1', name: 'Dr. Kimani', color: '#ef4444', avatar: 'https://i.pravatar.cc/150?u=a', isActive: true },
    { id: 'u2', name: 'Sarah', color: '#f59e0b', avatar: 'https://i.pravatar.cc/150?u=b', isActive: true }
  ]);

  // Modals & Popups
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [citationFields, setCitationFields] = useState({ author: '', year: '', title: '', source: '' });
  const [citationResult, setCitationResult] = useState('');
  const [isGeneratingCitation, setIsGeneratingCitation] = useState(false);
  
  // Voice Mode
  const [isVivaModeOpen, setIsVivaModeOpen] = useState(false);

  // --- TIPTAP EDITOR INIT ---
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
      Highlight.configure({ multicolor: true }),
      Typography,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      FontFamily,
    ],
    content: thesisDoc.content,
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      setCharCount(editor.storage.characterCount.characters());
      
      // Outline Generation
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
      // Only update outline if changed to avoid unnecessary re-renders
      if (JSON.stringify(newOutline) !== JSON.stringify(outline)) {
          setOutline(newOutline);
      }
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm md:prose-lg max-w-none focus:outline-none min-h-[50vh] md:min-h-[100vh] outline-none academic-paper-content px-1',
        },
    },
  });

  // Apply University Standards on Load
  useEffect(() => {
    if (editor && university) {
        // Font settings handled via style prop on container
    }
  }, [editor, university]);

  // Auto-Save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editor) {
          onSave({ ...thesisDoc, content: editor.getHTML(), lastModified: new Date() });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [editor?.getHTML(), thesisDoc, onSave]);

  // --- EDITOR ACTION HANDLERS ---

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run();
  
  const setAlign = (align: 'left' | 'center' | 'right' | 'justify') => editor?.chain().focus().setTextAlign(align).run();
  const toggleHeading = (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  
  const insertImage = () => {
      const url = window.prompt('Enter image URL');
      if (url) {
          editor?.chain().focus().setImage({ src: url }).run();
      }
  };

  const insertLink = () => {
      const previousUrl = editor?.getAttributes('link').href;
      const url = window.prompt('URL', previousUrl);
      if (url === null) return;
      if (url === '') {
          editor?.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
      }
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
      editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const setFontFamily = (font: string) => {
      editor?.chain().focus().setFontFamily(font).run();
  };

  const undo = () => editor?.chain().focus().undo().run();
  const redo = () => editor?.chain().focus().redo().run();

  const handleFindReplace = () => {
      if (!findText || !editor) return;
      alert("Find & Replace requires a specialized Tiptap extension. Highlighting matches instead.");
  };

  const handleAnalyze = async () => {
    if (!editor) return;
    setIsAnalyzing(true);
    setReviewMode('suggestions');
    setActiveTab('review');
    // Switch to Tools tab on mobile
    if (window.innerWidth < 768) setMobileTab('tools');
    
    try {
      const results = await GeminiService.analyzeText(editor.getText(), university);
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

  if (!editor) {
    return <div className="flex h-full items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-teal-600"/></div>;
  }

  // --- REUSABLE CONTENT RENDERERS ---

  const renderStructureContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase">Document Map</span>
            <button onClick={() => setIsStructureOpen(false)} className="hidden md:block"><X size={14} className="text-slate-400"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
            {outline.length === 0 ? <p className="text-xs text-slate-400 p-2 italic">Add headings to see structure.</p> : (
                outline.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => {
                            // Basic scroll logic (approximation)
                            // In real app, use Tiptap Node selections
                            setMobileTab('editor'); // Switch back to editor on mobile
                        }}
                        className={`block w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 truncate ${item.level === 1 ? 'font-bold text-slate-800' : 'pl-4 text-slate-600'}`}
                    >
                        {item.text}
                    </button>
                ))
            )}
        </div>
    </div>
  );

  const renderToolsContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0">
            <button onClick={() => setActiveTab('review')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'review' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Review</button>
            <button onClick={() => setActiveTab('research')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'research' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Research</button>
            <button onClick={() => setActiveTab('viva')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'viva' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'}`}>Viva</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {activeTab === 'review' && (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg border border-slate-200">
                        <button 
                        onClick={() => setReviewMode('suggestions')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded ${reviewMode === 'suggestions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
                        >
                        Basics
                        </button>
                        <button 
                        onClick={() => setReviewMode('validation')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded ${reviewMode === 'validation' ? 'bg-teal-50 text-teal-700' : 'text-slate-500'}`}
                        >
                        Validation
                        </button>
                    </div>

                    {reviewMode === 'suggestions' && (
                    <>
                        {/* University Standards Card */}
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 text-xs">
                            <div className="flex items-center gap-2 font-bold text-indigo-800 mb-2">
                                <GraduationCap size={14} /> 
                                {university?.name || "Standard Config"}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-indigo-700">
                                <div>
                                    <span className="block text-[10px] text-indigo-400 uppercase font-bold">Citation</span>
                                    {university?.standards.citationStyle || "APA 7th"}
                                </div>
                                <div>
                                    <span className="block text-[10px] text-indigo-400 uppercase font-bold">Font</span>
                                    {university?.standards.font || "Times New Roman"}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                            <div className="text-3xl font-bold text-slate-800 mb-1">92</div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Overall Score</div>
                        </div>
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-sm flex items-center justify-center gap-2">
                            {isAnalyzing ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>} Run Audit
                        </button>
                        
                        {suggestions.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 rounded uppercase">{item.type}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-through mb-1">{item.originalText}</p>
                                <p className="text-sm font-medium text-green-700 mb-2">{item.suggestion}</p>
                                <p className="text-xs text-slate-400 italic">"{item.explanation}"</p>
                            </div>
                        ))}
                    </>
                    )}

                    {reviewMode === 'validation' && (
                    <>
                        <button 
                            onClick={handleValidate}
                            disabled={isValidating}
                            className="w-full py-2 bg-teal-600 text-white rounded font-bold text-sm flex items-center justify-center gap-2"
                        >
                            {isValidating ? <RefreshCw className="animate-spin" size={14}/> : <ShieldCheck size={14}/>} Deep Validate
                        </button>

                        {validationReport && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Fact', score: validationReport.factScore },
                                        { label: 'Integrity', score: validationReport.integrityScore },
                                        { label: 'Quality', score: validationReport.qualityScore },
                                    ].map((m, i) => (
                                        <div key={i} className="text-center p-2 bg-white rounded border border-slate-200">
                                            <div className={`text-xl font-bold ${m.score > 80 ? 'text-green-600' : 'text-orange-500'}`}>{m.score}</div>
                                            <div className="text-[9px] uppercase text-slate-400 font-bold">{m.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600">
                                    <span className="font-bold text-slate-800">Summary: </span>{validationReport.summary}
                                </div>
                                
                                {validationReport.issues.map((issue: ValidationIssue) => (
                                    <div key={issue.id} className={`p-3 rounded border bg-white ${issue.severity === 'high' ? 'border-red-200' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${issue.category === 'fact' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{issue.category}</span>
                                            <span className={`text-[9px] font-bold ${issue.severity === 'high' ? 'text-red-600' : 'text-slate-400'}`}>{issue.severity}</span>
                                        </div>
                                        <p className="font-bold text-xs text-slate-800 mb-1">{issue.issue}</p>
                                        <p className="text-xs text-slate-500 italic mb-2">"{issue.text}"</p>
                                        <div className="flex items-center gap-1 text-xs text-teal-700 font-medium">
                                            <Check size={10} /> {issue.recommendation}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                    )}
                </div>
            )}
            
            {activeTab === 'research' && (
                <div className="text-center text-slate-400 py-10">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-sm">Search library or web sources.</p>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="text-center text-slate-400 py-10">
                    <Bot size={32} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-sm">Ask your AI supervisor.</p>
                </div>
            )}

            {activeTab === 'viva' && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="p-4 bg-teal-100 rounded-full text-teal-600">
                        <Mic size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Viva Defense Practice</h3>
                        <p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-2">
                            Simulate your thesis defense with a real-time AI voice interviewer.
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsVivaModeOpen(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Video size={18} /> Start Session
                    </button>
                </div>
            )}
        </div>
    </div>
  );

  // --- RENDER ---
  return (
    <div className={`fixed inset-0 bg-slate-100 flex flex-col z-50 transition-all duration-300 ${isFocusMode ? 'p-0' : ''}`}>
      
      {/* 1. MAIN TOOLBAR (Sticky Top) */}
      {!isFocusMode && (
        <div className="bg-white border-b border-slate-200 shadow-sm z-30 flex flex-col shrink-0 sticky top-0">
            {/* Row 1: File Actions & Meta */}
            <div className="flex items-center justify-between px-3 md:px-4 h-12 border-b border-slate-100">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium shrink-0">
                        <ArrowLeft size={18}/> <span className="hidden md:inline">Back</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200 shrink-0"></div>
                    <input 
                        className="font-serif font-bold text-base md:text-lg text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400 truncate min-w-0 flex-1"
                        defaultValue={thesisDoc.title}
                        onBlur={(e) => onSave({ ...thesisDoc, title: e.target.value })} 
                    />
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded hidden md:inline-block shrink-0">
                        {wordCount} words
                    </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-2 mr-2 hidden md:flex">
                        {collaborators.map(c => (
                            <img key={c.id} src={c.avatar} className="w-6 h-6 rounded-full border border-white" title={c.name} />
                        ))}
                    </div>
                    <button onClick={() => setIsFocusMode(true)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden md:block" title="Focus Mode"><Maximize2 size={16}/></button>
                    <button onClick={() => onSave({...thesisDoc, content: editor.getHTML()})} className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Save size={14}/><span className="hidden md:inline">Save</span></button>
                </div>
            </div>

            {/* Row 2: Formatting Ribbon (Horizontally Scrollable) */}
            <div className="flex items-center px-2 py-1 gap-1 overflow-x-auto no-scrollbar bg-slate-50/50 w-full">
                {/* History */}
                <div className="flex items-center gap-0.5 border-r border-slate-300 pr-2 mr-2 shrink-0">
                    <button onClick={undo} disabled={!editor.can().undo()} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30"><Undo size={16}/></button>
                    <button onClick={redo} disabled={!editor.can().redo()} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-30"><Redo size={16}/></button>
                </div>

                {/* Typography */}
                <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-2 shrink-0">
                    <select 
                        className="bg-transparent text-sm border border-slate-200 rounded px-1 md:px-2 py-1 w-24 md:w-32 focus:outline-none focus:border-teal-500 cursor-pointer text-xs md:text-sm"
                        onChange={(e) => setFontFamily(e.target.value)}
                        value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
                    >
                        <option value="Inter">Inter</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Arial">Arial</option>
                        <option value="Calibri">Calibri</option>
                        <option value="Georgia">Georgia</option>
                    </select>
                    
                    <button onClick={toggleBold} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-black' : 'text-slate-600'}`}><Bold size={16}/></button>
                    <button onClick={toggleItalic} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-black' : 'text-slate-600'}`}><Italic size={16}/></button>
                    <button onClick={toggleUnderline} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('underline') ? 'bg-slate-200 text-black' : 'text-slate-600'}`}><UnderlineIcon size={16}/></button>
                    <button onClick={toggleHighlight} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('highlight') ? 'bg-yellow-200 text-black' : 'text-slate-600'}`}><Highlighter size={16}/></button>
                </div>

                {/* Paragraph */}
                <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-2 shrink-0">
                    <button onClick={() => setAlign('left')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : ''}`}><AlignLeft size={16}/></button>
                    <button onClick={() => setAlign('center')} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : ''}`}><AlignCenter size={16}/></button>
                    
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button onClick={toggleBulletList} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}><List size={16}/></button>
                    <button onClick={toggleOrderedList} className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-200' : ''}`}><ListOrdered size={16}/></button>
                </div>

                {/* Insert */}
                <div className="flex items-center gap-1 border-r border-slate-300 pr-2 mr-2 shrink-0">
                    <button onClick={insertImage} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Insert Image"><ImageIcon size={16}/></button>
                    <button onClick={insertLink} className={`p-1.5 hover:bg-slate-200 rounded ${editor.isActive('link') ? 'bg-teal-100 text-teal-700' : 'text-slate-600'}`} title="Insert Link"><LinkIcon size={16}/></button>
                    <button onClick={insertTable} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Insert Table"><TableIcon size={16}/></button>
                    <button onClick={() => setCitationModalOpen(true)} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Add Citation"><Quote size={16}/></button>
                </div>

                {/* AI & Tools (Desktop) */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    <button onClick={() => { setActiveTab('review'); handleAnalyze(); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-xs font-bold">
                        <Sparkles size={14}/> AI Check
                    </button>
                    <button onClick={() => setShowFindReplace(!showFindReplace)} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Search size={16}/></button>
                </div>
            </div>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left Sidebar: Structure (Desktop Only) */}
          {!isFocusMode && isStructureOpen && (
              <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
                  {renderStructureContent()}
              </div>
          )}

          {/* Center Area: Responsive */}
          <div className="flex-1 overflow-y-auto bg-slate-100 p-0 md:p-8 flex justify-center scroll-smooth relative">
              
              {/* Desktop Find Widget */}
              {showFindReplace && (
                  <div className="absolute top-4 right-8 z-30 bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-72 animate-fade-in-down">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-bold text-slate-700">Find & Replace</h4>
                          <button onClick={() => setShowFindReplace(false)}><X size={14} className="text-slate-400"/></button>
                      </div>
                      <input className="w-full border border-slate-200 rounded px-2 py-1 text-xs mb-2" placeholder="Find..." value={findText} onChange={e => setFindText(e.target.value)} />
                      <div className="flex gap-2">
                          <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1 rounded">Find Next</button>
                      </div>
                  </div>
              )}

              {/* === Mobile View Logic === */}
              <div className="w-full h-full md:w-auto md:h-auto">
                  {/* Editor View (Always Rendered on Desktop, Conditional on Mobile) */}
                  <div 
                    className={`
                        bg-white transition-all duration-300 
                        ${mobileTab === 'editor' ? 'block' : 'hidden md:block'} 
                        ${isFocusMode ? 'scale-105 my-0 shadow-none' : 'md:my-4 md:shadow-xl'}
                        w-full min-h-full p-4 md:min-h-[29.7cm] md:w-[21cm] md:p-[2.54cm]
                    `}
                    style={{
                        fontFamily: university?.standards?.font || 'Times New Roman',
                        lineHeight: university?.standards?.spacing === 'Double' ? '2.0' : university?.standards?.spacing === '1.5' ? '1.5' : '1.5',
                        fontSize: `${university?.standards?.size || 12}pt`
                    }}
                  >
                      <EditorContent editor={editor} />
                  </div>

                  {/* Mobile Outline View */}
                  {mobileTab === 'structure' && (
                      <div className="md:hidden w-full h-full bg-white p-4">
                          <h2 className="text-lg font-bold text-slate-800 mb-4">Structure</h2>
                          {renderStructureContent()}
                      </div>
                  )}

                  {/* Mobile Tools View */}
                  {mobileTab === 'tools' && (
                      <div className="md:hidden w-full h-full bg-white flex flex-col">
                          {renderToolsContent()}
                      </div>
                  )}
              </div>
          </div>

          {/* Right Sidebar: AI & Tools (Desktop Only) */}
          {!isFocusMode && (
              <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 hidden md:flex">
                  {renderToolsContent()}
              </div>
          )}
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      {!isFocusMode && (
          <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 z-40">
              <button 
                onClick={() => setMobileTab('editor')}
                className={`flex flex-col items-center justify-center w-full h-full ${mobileTab === 'editor' ? 'text-teal-600' : 'text-slate-400'}`}
              >
                  <Pen size={20} />
                  <span className="text-[10px] font-bold mt-0.5">Editor</span>
              </button>
              <button 
                onClick={() => setMobileTab('structure')}
                className={`flex flex-col items-center justify-center w-full h-full ${mobileTab === 'structure' ? 'text-teal-600' : 'text-slate-400'}`}
              >
                  <PanelLeft size={20} />
                  <span className="text-[10px] font-bold mt-0.5">Outline</span>
              </button>
              <button 
                onClick={() => setMobileTab('tools')}
                className={`flex flex-col items-center justify-center w-full h-full ${mobileTab === 'tools' ? 'text-teal-600' : 'text-slate-400'}`}
              >
                  <PanelRight size={20} />
                  <span className="text-[10px] font-bold mt-0.5">Tools</span>
              </button>
          </div>
      )}

      {/* 4. FOOTER STATS (Hidden on Mobile if not in Editor mode or optional) */}
      {!isFocusMode && mobileTab === 'editor' && (
          <div className="h-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-4 text-[9px] md:text-[10px] text-slate-500 font-medium z-20 shrink-0">
              <div className="flex gap-4">
                  <span>{wordCount}w</span>
                  <span>{charCount}c</span>
                  <span className="hidden md:inline">{Math.ceil(wordCount / 200)} min read</span>
              </div>
              <div>
                  <span>Saved: {thesisDoc.lastModified.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
          </div>
      )}

      {/* Citation Modal */}
      {citationModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg text-slate-800">Generate Citation</h3>
                 <button onClick={() => setCitationModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="space-y-4 mb-6">
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Author" value={citationFields.author} onChange={(e) => setCitationFields({...citationFields, author: e.target.value})} />
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Year" value={citationFields.year} onChange={(e) => setCitationFields({...citationFields, year: e.target.value})} />
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Title" value={citationFields.title} onChange={(e) => setCitationFields({...citationFields, title: e.target.value})} />
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Source" value={citationFields.source} onChange={(e) => setCitationFields({...citationFields, source: e.target.value})} />
              </div>
              {citationResult && <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 text-sm italic">{citationResult}</div>}
              <div className="flex gap-3">
                  {!citationResult ? (
                      <button onClick={handleGenerateCitation} disabled={isGeneratingCitation} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                          {isGeneratingCitation ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Generate
                      </button>
                  ) : (
                      <button onClick={insertCitation} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold">Insert Citation</button>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* Viva Mode Overlay */}
      {isVivaModeOpen && (
          <VivaMode 
            onClose={() => setIsVivaModeOpen(false)} 
            contextText={editor?.getText()} 
          />
      )}

    </div>
  );
};
