import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import * as StarterKitPkg from '@tiptap/starter-kit';
import * as PlaceholderPkg from '@tiptap/extension-placeholder';
import * as CharacterCountPkg from '@tiptap/extension-character-count';
import * as TextAlignPkg from '@tiptap/extension-text-align';
import * as UnderlinePkg from '@tiptap/extension-underline';
import * as HighlightPkg from '@tiptap/extension-highlight';
import * as TypographyPkg from '@tiptap/extension-typography';
import * as ImagePkg from '@tiptap/extension-image';
import * as LinkPkg from '@tiptap/extension-link';

const StarterKit = StarterKitPkg.StarterKit || StarterKitPkg.default;
const Placeholder = PlaceholderPkg.Placeholder || PlaceholderPkg.default;
const CharacterCount = CharacterCountPkg.CharacterCount || CharacterCountPkg.default;
const TextAlign = TextAlignPkg.TextAlign || TextAlignPkg.default;
const Underline = UnderlinePkg.Underline || UnderlinePkg.default;
const Highlight = HighlightPkg.Highlight || HighlightPkg.default;
const Typography = TypographyPkg.Typography || TypographyPkg.default;
const Image = ImagePkg.Image || ImagePkg.default;
const Link = LinkPkg.Link || LinkPkg.default;

import {
  Save, Bold, Italic, AlignCenter, AlignLeft, AlignRight,
  Sparkles, BookOpen, Mic, Video, ArrowLeft,
  Underline as UnderlineIcon, Highlighter, Undo, Redo,
  ShieldCheck, Search, PanelLeft, PanelRight, X,
  ChevronDown, Type, List as ListIcon, ListOrdered,
  Clock, CheckCircle2, Loader2, Hash, Link as LinkIcon,
  Quote, Code, Minus, Maximize2, Minimize2,
  MessageSquare, Send, AlertCircle, TrendingUp, Star,
  ChevronRight, CornerDownLeft, Wand2
} from 'lucide-react';
import { Document, University, ValidationReport } from '../types';
import { VivaMode } from './VivaMode';
import { GeminiService } from '../services/geminiService';

interface EditorProps {
  document: Document;
  university: University | null;
  onSave: (doc: Document) => void;
  onBack: () => void;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';
type MobilePanel = null | 'outline' | 'tools';
type ToolTab = 'review' | 'chat' | 'viva';

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
];

export const Editor: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('review');
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Link popover
  const [linkPopover, setLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // AI bubble
  const [aiBubbleLoading, setAiBubbleLoading] = useState<'improve' | 'explain' | 'continue' | null>(null);
  const [explainResult, setExplainResult] = useState<string | null>(null);

  // AI Review / Validation
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationReport | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Word goal
  const [wordGoal] = useState(5000);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start drafting your masterpiece…' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: thesisDoc.content,
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      setCharCount(editor.storage.characterCount.characters());
      setSaveStatus('unsaved');
      const json = editor.getJSON();
      const newOutline: { id: string; text: string; level: number }[] = [];
      const traverse = (node: any) => {
        if (node.type === 'heading') {
          newOutline.push({ id: Math.random().toString(), text: node.content?.[0]?.text || 'Untitled', level: node.attrs?.level || 1 });
        } else if (node.content) node.content.forEach(traverse);
      };
      if (json.content) json.content.forEach(traverse);
      setOutline(newOutline);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-base md:prose-lg max-w-none focus:outline-none min-h-[60vh] md:min-h-[70vh]',
      },
    },
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    setSaveStatus('saving');
    onSave({ ...thesisDoc, content: editor.getHTML(), lastModified: new Date() });
    setTimeout(() => setSaveStatus('saved'), 800);
  }, [editor, thesisDoc, onSave]);

  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = setTimeout(handleSave, 5000);
    return () => clearTimeout(timer);
  }, [saveStatus, handleSave]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // ── Helpers ──────────────────────────────────────────
  const getActiveHeading = () => {
    if (!editor) return 'Paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Paragraph';
  };

  const applyHeading = (value: string) => {
    if (!editor) return;
    if (value === 'paragraph') editor.chain().focus().setParagraph().run();
    else if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
    setHeadingOpen(false);
  };

  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl) { editor.chain().focus().unsetLink().run(); }
    else { editor.chain().focus().setLink({ href: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}` }).run(); }
    setLinkPopover(false);
    setLinkUrl('');
  };

  const handleAiBubble = async (action: 'improve' | 'explain' | 'continue') => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (!text.trim()) return;
    setAiBubbleLoading(action);
    setExplainResult(null);
    try {
      const result = await GeminiService.rewriteForEditor(action, text);
      if (action === 'improve') {
        editor.chain().focus().deleteSelection().insertContent(result).run();
      } else if (action === 'continue') {
        editor.chain().focus().setTextSelection(to).insertContent(' ' + result).run();
      } else {
        setExplainResult(result);
      }
    } catch { /* silent */ } finally {
      setAiBubbleLoading(null);
    }
  };

  const runAudit = async () => {
    if (!editor || isValidating) return;
    setIsValidating(true);
    setValidation(null);
    try {
      const text = editor.getText();
      if (text.trim().length < 50) {
        setValidation({ factScore: 0, integrityScore: 0, qualityScore: 0, summary: 'Please add more content before running an audit.', issues: [] });
        return;
      }
      const report = await GeminiService.validateResearch(text);
      setValidation(report);
    } catch {
      setValidation({ factScore: 0, integrityScore: 0, qualityScore: 0, summary: 'Audit failed. Please check your API key.', issues: [] });
    } finally {
      setIsValidating(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading || !editor) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const reply = await GeminiService.chatWithDocument(msg, editor.getText(), chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'model', text: 'Unable to respond right now. Please check your connection.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!editor) return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  // ── Sub-components ────────────────────────────────────
  const Divider = () => <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />;

  const ToolBtn = ({
    onClick, active, children, title, className = ''
  }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string; className?: string }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-lg transition-all shrink-0 ${active ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'} ${className}`}
    >
      {children}
    </button>
  );

  const FormattingToolbar = () => (
    <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto no-scrollbar">
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (⌘Z)"><Undo size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (⌘⇧Z)"><Redo size={14} /></ToolBtn>
      <Divider />

      {/* Heading picker */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onMouseDown={e => { e.preventDefault(); setHeadingOpen(h => !h); }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all whitespace-nowrap"
        >
          <Type size={13} className="shrink-0" />
          <span className="hidden sm:inline">{getActiveHeading()}</span>
          <ChevronDown size={11} />
        </button>
        {headingOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
            {HEADING_OPTIONS.map(opt => (
              <button key={opt.value} onMouseDown={e => { e.preventDefault(); applyHeading(opt.value); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium ${getActiveHeading() === opt.label ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)"><Bold size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)"><Italic size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)"><UnderlineIcon size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter size={14} className={editor.isActive('highlight') ? 'text-yellow-500' : ''} />
      </ToolBtn>
      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><Code size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider line"><Minus size={14} /></ToolBtn>
      <Divider />

      {/* Link */}
      <div className="relative shrink-0">
        <ToolBtn onClick={() => { setLinkUrl(editor.getAttributes('link').href || ''); setLinkPopover(p => !p); }} active={editor.isActive('link')} title="Insert link">
          <LinkIcon size={14} />
        </ToolBtn>
        {linkPopover && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 flex gap-2" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkPopover(false); }}
              className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-400"
            />
            <button onMouseDown={e => { e.preventDefault(); applyLink(); }} className="bg-blue-600 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
              <CornerDownLeft size={13} />
            </button>
          </div>
        )}
      </div>
      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><ListIcon size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={14} /></ToolBtn>
      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align centre"><AlignCenter size={14} /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight size={14} /></ToolBtn>

      <div className="ml-auto shrink-0 flex items-center gap-2">
        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-100 uppercase tracking-tight whitespace-nowrap hidden sm:block">
          {university?.standards.citationStyle || 'APA'}
        </span>
        <ToolBtn onClick={() => setIsFocusMode(f => !f)} title={isFocusMode ? 'Exit focus mode' : 'Focus mode'}>
          {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </ToolBtn>
      </div>
    </div>
  );

  const OutlinePanel = ({ onClose }: { onClose?: () => void }) => {
    const pct = Math.min(100, Math.round((wordCount / wordGoal) * 100));
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outline</h3>
          {onClose && <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors"><X size={14} /></button>}
        </div>

        {/* Word goal ring */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
              <circle cx="24" cy="24" r="20" stroke="#2563eb" strokeWidth="4" fill="transparent"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * pct) / 100}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-700">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">{wordCount.toLocaleString()} <span className="font-normal text-slate-400">/ {wordGoal.toLocaleString()}</span></p>
            <p className="text-[10px] text-slate-400 font-medium">words toward goal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {outline.length === 0 ? (
            <div className="p-4 text-center">
              <Hash size={22} className="text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 leading-relaxed">Add headings to see structure here.</p>
            </div>
          ) : outline.map(item => (
            <button key={item.id}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-blue-50 hover:text-blue-700 truncate transition-colors ${item.level === 1 ? 'font-bold text-slate-800' : item.level === 2 ? 'pl-5 font-semibold text-slate-600' : 'pl-7 text-slate-400'}`}>
              {item.level === 1 ? '' : item.level === 2 ? '↳ ' : '  ↳ '}{item.text}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 shrink-0">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} chars</span>
          </div>
        </div>
      </div>
    );
  };

  const ScoreRing = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90">
          <circle cx="28" cy="28" r="22" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
          <circle cx="28" cy="28" r="22" stroke={color} strokeWidth="5" fill="transparent"
            strokeDasharray={138.2}
            strokeDashoffset={138.2 - (138.2 * value) / 100}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-slate-800">{value}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 font-medium text-center leading-tight">{label}</p>
    </div>
  );

  const ToolsPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-slate-100 shrink-0">
        {(['review', 'chat', 'viva'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}>
            {tab === 'chat' ? 'Chat' : tab === 'review' ? 'Review' : 'Viva'}
          </button>
        ))}
        {onClose && <button onClick={onClose} className="p-2 mr-1 rounded hover:bg-slate-100 text-slate-400 shrink-0 transition-colors"><X size={14} /></button>}
      </div>

      {/* ── Review tab ── */}
      {activeTab === 'review' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar animate-fade-in">
          <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/15 rounded-full blur-2xl" />
            <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
              <ShieldCheck size={15} className="text-blue-400" /> Integrity Audit
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">AI checks your draft for factual accuracy, academic tone, and citation completeness.</p>
            <button
              onClick={runAudit}
              disabled={isValidating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              {isValidating ? <><Loader2 size={13} className="animate-spin" /> Auditing…</> : <><Sparkles size={13} /> Run Audit</>}
            </button>
          </div>

          {isValidating && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center space-y-2">
              <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
              <p className="text-xs text-blue-600 font-medium">Analysing your document…</p>
            </div>
          )}

          {validation && !isValidating && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-around py-2">
                <ScoreRing value={validation.factScore} label="Factual" color="#10b981" />
                <ScoreRing value={validation.integrityScore} label="Integrity" color="#3b82f6" />
                <ScoreRing value={validation.qualityScore} label="Quality" color="#8b5cf6" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[11px] text-slate-600 leading-relaxed">{validation.summary}</p>
              </div>
              {validation.issues.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issues Found</h5>
                  {validation.issues.slice(0, 5).map(issue => (
                    <div key={issue.id} className={`p-3 rounded-xl border text-[11px] ${issue.severity === 'high' ? 'bg-rose-50 border-rose-200' : issue.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`font-bold mb-1 capitalize ${issue.severity === 'high' ? 'text-rose-700' : issue.severity === 'medium' ? 'text-amber-700' : 'text-slate-600'}`}>
                        {issue.category} · {issue.severity}
                      </p>
                      <p className="text-slate-600 leading-relaxed">{issue.issue}</p>
                      {issue.recommendation && <p className="text-slate-400 mt-1 italic leading-relaxed">{issue.recommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!validation && !isValidating && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={11} /> Quick Tips</h5>
              <div className="space-y-2">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer leading-relaxed">
                  <span className="font-bold text-blue-600">Style:</span> Use active voice where possible for stronger claims.
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer leading-relaxed">
                  <span className="font-bold text-blue-600">Structure:</span> Each paragraph should open with a topic sentence.
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer leading-relaxed">
                  <span className="font-bold text-amber-600">Citation:</span> Verify all in-text citations have reference entries.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Chat tab ── */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
          {chatMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <MessageSquare size={22} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Chat with your document</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Ask your AI supervisor anything about your content.</p>
              </div>
              <div className="space-y-2 w-full">
                {['Summarise my argument', 'Find weak points in methodology', 'Suggest missing citations'].map(q => (
                  <button key={q} onClick={() => setChatInput(q)}
                    className="w-full text-left px-3 py-2 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl transition-all font-medium text-slate-600">
                    {q} <ChevronRight size={12} className="inline" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.length > 0 && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-400 px-3 py-2.5 rounded-xl rounded-bl-sm text-xs flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <div className="p-3 border-t border-slate-100 shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Ask about your document…"
                rows={1}
                className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 resize-none outline-none leading-relaxed"
              />
              <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0">
                <Send size={12} />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* ── Viva tab ── */}
      {activeTab === 'viva' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
            <Video size={28} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Viva Voce Training</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">Simulate a high-stakes oral defense with your AI supervisor using live voice.</p>
          </div>
          <div className="w-full space-y-2">
            <button onClick={() => setIsVivaOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              <Mic size={15} /> Start Defense Session
            </button>
            <p className="text-[10px] text-slate-400">Requires a Gemini API key. Use headphones.</p>
          </div>
        </div>
      )}
    </div>
  );

  // ── Explain result overlay ─────────────────────────────
  const ExplainOverlay = () => (
    explainResult ? (
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-72 bg-slate-900 text-white rounded-xl p-4 shadow-2xl animate-fade-in border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1"><BookOpen size={10} /> Explanation</span>
          <button onClick={() => setExplainResult(null)} className="text-slate-500 hover:text-white"><X size={14} /></button>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">{explainResult}</p>
      </div>
    ) : null
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 flex flex-col z-50 h-[100dvh] w-screen overflow-hidden transition-colors duration-500 ${isFocusMode ? 'bg-stone-50' : 'bg-slate-100'}`}
      onClick={() => { setHeadingOpen(false); setLinkPopover(false); }}
    >
      {/* ─── Header ─── */}
      {!isFocusMode && (
        <header className="bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-4 shrink-0 shadow-sm z-50 gap-2" style={{ height: '52px' }}>
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none hidden sm:block">Editing</p>
              <h1 className="font-serif font-bold text-sm text-slate-800 truncate max-w-[130px] sm:max-w-[240px] md:max-w-[380px] leading-tight">{thesisDoc.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Save status */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg transition-all ${saveStatus === 'saved' ? 'text-emerald-600 bg-emerald-50' : saveStatus === 'saving' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100'}`}>
              {saveStatus === 'saved' && <><CheckCircle2 size={11} /> Saved</>}
              {saveStatus === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
              {saveStatus === 'unsaved' && <><Clock size={11} /> Unsaved</>}
            </div>

            {/* Desktop panel toggles */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button onClick={() => setIsOutlineOpen(o => !o)} title="Toggle outline"
                className={`p-1.5 rounded transition-all ${isOutlineOpen ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
                <PanelLeft size={14} />
              </button>
              <button onClick={() => setIsToolsOpen(o => !o)} title="Toggle AI tools"
                className={`p-1.5 rounded transition-all ${isToolsOpen ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>
                <PanelRight size={14} />
              </button>
            </div>

            <button onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
              <Save size={13} /><span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </header>
      )}

      {/* ─── Formatting Toolbar ─── */}
      <div className={`bg-white border-b border-slate-200 shrink-0 z-40 transition-opacity duration-300 ${isFocusMode ? 'opacity-0 hover:opacity-100' : ''}`}>
        <FormattingToolbar />
      </div>

      {/* ─── 3-pane layout ─── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left: Outline */}
        <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden shrink-0 ${isOutlineOpen && !isFocusMode ? 'w-56' : 'w-0'}`}>
          <OutlinePanel />
        </aside>

        {/* Center: Paper */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar transition-colors duration-500 ${isFocusMode ? 'bg-stone-50' : 'bg-slate-100'}`}
          onClick={() => { setHeadingOpen(false); setLinkPopover(false); }}>

          {/* TipTap Bubble Menu */}
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 150, placement: 'top' }}
            shouldShow={({ editor }) => {
              const { from, to } = editor.state.selection;
              return from !== to && !editor.isActive('image');
            }}
          >
            <div className="flex items-center bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden divide-x divide-slate-700">
              <div className="flex items-center p-1 gap-0.5">
                {[
                  { label: <Bold size={13}/>, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Bold' },
                  { label: <Italic size={13}/>, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italic' },
                  { label: <UnderlineIcon size={13}/>, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: 'Underline' },
                  { label: <Highlighter size={13}/>, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight'), title: 'Highlight' },
                  { label: <LinkIcon size={13}/>, action: () => { setLinkUrl(editor.getAttributes('link').href || ''); setLinkPopover(p => !p); }, active: editor.isActive('link'), title: 'Link' },
                ].map((btn, i) => (
                  <button key={i} title={btn.title}
                    onMouseDown={e => { e.preventDefault(); btn.action(); }}
                    className={`p-1.5 rounded-lg transition-all ${btn.active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                    {btn.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center p-1 gap-0.5">
                {[
                  { label: 'Improve', icon: <Wand2 size={12}/>, action: 'improve' as const },
                  { label: 'Explain', icon: <BookOpen size={12}/>, action: 'explain' as const },
                  { label: 'Continue', icon: <ChevronRight size={12}/>, action: 'continue' as const },
                ].map(btn => (
                  <button key={btn.action}
                    onMouseDown={e => { e.preventDefault(); handleAiBubble(btn.action); }}
                    disabled={!!aiBubbleLoading}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-blue-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {aiBubbleLoading === btn.action ? <Loader2 size={11} className="animate-spin" /> : btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </BubbleMenu>

          <div className={`flex justify-center px-3 py-4 md:px-8 md:py-10 min-h-full transition-all duration-500 ${isFocusMode ? 'md:py-16' : ''}`}>
            <div className={`bg-white w-full shadow-xl border border-slate-200/80 rounded-sm relative transition-all duration-500 ${isFocusMode ? 'max-w-[680px] shadow-2xl' : 'max-w-[780px]'}`}>
              <div className="px-5 py-8 sm:px-10 sm:py-10 md:px-16 md:py-14">
                <EditorContent editor={editor} />
              </div>
              <div className="border-t border-slate-100 px-5 sm:px-10 md:px-16 py-3 flex justify-between text-[10px] font-mono text-slate-300">
                <span>{university?.standards.citationStyle || 'APA 7th'} · {university?.name || 'Default Standards'}</span>
                <span>{wordCount.toLocaleString()} words</span>
              </div>
            </div>
          </div>

          <ExplainOverlay />
        </main>

        {/* Right: Tools */}
        <aside className={`hidden md:flex flex-col bg-white border-l border-slate-200 transition-all duration-300 overflow-hidden shrink-0 ${isToolsOpen && !isFocusMode ? 'w-[300px]' : 'w-0'}`}>
          <ToolsPanel />
        </aside>
      </div>

      {/* ─── Focus mode exit hint ─── */}
      {isFocusMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button onClick={() => setIsFocusMode(false)}
            className="flex items-center gap-2 bg-slate-900/80 text-white text-xs font-medium px-4 py-2 rounded-full backdrop-blur-sm border border-slate-700 hover:bg-slate-800 transition-all">
            <Minimize2 size={12} /> Exit Focus Mode
          </button>
        </div>
      )}

      {/* ─── Mobile bottom action bar ─── */}
      {!isFocusMode && (
        <div className="md:hidden bg-white border-t border-slate-200 shrink-0 z-40 safe-bottom">
          <div className="flex items-center justify-around px-4 py-2">
            <button onClick={() => setMobilePanel(mobilePanel === 'outline' ? null : 'outline')}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${mobilePanel === 'outline' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
              <PanelLeft size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Outline</span>
            </button>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">{wordCount.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">words</p>
            </div>
            <button onClick={() => setMobilePanel(mobilePanel === 'tools' ? null : 'tools')}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${mobilePanel === 'tools' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
              <Sparkles size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">AI Tools</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Mobile bottom sheet ─── */}
      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobilePanel(null)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[75vh] animate-slide-up">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden">
              {mobilePanel === 'outline' && <OutlinePanel onClose={() => setMobilePanel(null)} />}
              {mobilePanel === 'tools' && <ToolsPanel onClose={() => setMobilePanel(null)} />}
            </div>
          </div>
        </div>
      )}

      {isVivaOpen && <VivaMode onClose={() => setIsVivaOpen(false)} contextText={editor.getText()} />}
    </div>
  );
};
