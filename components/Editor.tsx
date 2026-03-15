import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
  Save, Bold, Italic, List, AlignCenter, AlignLeft, AlignRight,
  Sparkles, BookOpen, Mic, Video, ArrowLeft,
  Underline as UnderlineIcon, Highlighter, Undo, Redo,
  ShieldCheck, Search, PanelLeft, PanelRight, X,
  ChevronDown, Type, List as ListIcon, ListOrdered,
  Clock, CheckCircle2, Loader2, Hash
} from 'lucide-react';
import { Document, University } from '../types';
import { VivaMode } from './VivaMode';

interface EditorProps {
  document: Document;
  university: University | null;
  onSave: (doc: Document) => void;
  onBack: () => void;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';
type MobilePanel = null | 'outline' | 'tools';

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
];

export const Editor: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'review' | 'research' | 'viva'>('review');
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start drafting your masterpiece...' }),
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
          newOutline.push({
            id: Math.random().toString(),
            text: node.content?.[0]?.text || 'Untitled',
            level: node.attrs?.level || 1,
          });
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

  // Autosave every 5s of inactivity
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = setTimeout(handleSave, 5000);
    return () => clearTimeout(timer);
  }, [saveStatus, handleSave]);

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

  if (!editor) return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  const SaveIndicator = () => (
    <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
      saveStatus === 'saved' ? 'text-emerald-600 bg-emerald-50' :
      saveStatus === 'saving' ? 'text-amber-600 bg-amber-50' :
      'text-slate-500 bg-slate-100'
    }`}>
      {saveStatus === 'saved' && <><CheckCircle2 size={12} /> Saved</>}
      {saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving…</>}
      {saveStatus === 'unsaved' && <><Clock size={12} /> Unsaved</>}
    </div>
  );

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all shrink-0 ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />;

  const FormattingToolbar = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-0.5 overflow-x-auto no-scrollbar ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={15} /></ToolbarButton>
      <Divider />

      {/* Heading picker */}
      <div className="relative shrink-0">
        <button
          onClick={() => setHeadingOpen(h => !h)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all whitespace-nowrap"
        >
          <Type size={14} /> {getActiveHeading()} <ChevronDown size={12} />
        </button>
        {headingOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            {HEADING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => applyHeading(opt.value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium ${getActiveHeading() === opt.label ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter size={15} className={editor.isActive('highlight') ? 'text-yellow-600' : ''} />
      </ToolbarButton>
      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><ListIcon size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={15} /></ToolbarButton>
      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight size={15} /></ToolbarButton>
      <Divider />

      <div className="ml-auto shrink-0">
        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-100 uppercase tracking-tight whitespace-nowrap">
          {university?.standards.citationStyle || 'APA'}
        </span>
      </div>
    </div>
  );

  const OutlinePanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document Outline</h3>
        {onClose && <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-400"><X size={14} /></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {outline.length === 0 ? (
          <div className="p-4 text-center">
            <Hash size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400 leading-relaxed">Add headings to see your document outline here.</p>
          </div>
        ) : outline.map((item) => (
          <button
            key={item.id}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-blue-50 hover:text-blue-700 truncate transition-colors ${
              item.level === 1 ? 'font-bold text-slate-800' :
              item.level === 2 ? 'pl-5 font-semibold text-slate-600' :
              'pl-7 text-slate-500'
            }`}
          >
            {item.text}
          </button>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>{wordCount.toLocaleString()} words</span>
          <span>{charCount.toLocaleString()} chars</span>
        </div>
      </div>
    </div>
  );

  const ToolsPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-slate-100 shrink-0">
        {(['review', 'research', 'viva'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
        {onClose && <button onClick={onClose} className="p-2 mr-2 rounded hover:bg-slate-100 text-slate-400 shrink-0"><X size={14} /></button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'review' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl" />
              <h4 className="font-serif font-bold text-base mb-1.5 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" /> AI Co-pilot
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">I've scanned your draft. The methodology section has arguments that could be stronger.</p>
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
                <ShieldCheck size={13} /> Run Integrity Audit
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Suggestions</h5>
              <div className="space-y-2">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer leading-relaxed">
                  <span className="font-bold text-blue-600">Style:</span> Convert passive voice in Chapter 1 to active.
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer leading-relaxed">
                  <span className="font-bold text-blue-600">Citation:</span> <em>Smith (2022)</em> is missing from your references.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'research' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <input
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all"
                placeholder="Search citations..."
              />
              <Search className="absolute left-2.5 top-3 text-slate-400" size={14} />
            </div>
            <div className="text-center py-10 text-slate-400">
              <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-xs font-medium leading-relaxed">Connect Zotero or Mendeley in Settings to sync your citation library.</p>
            </div>
          </div>
        )}

        {activeTab === 'viva' && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-5 animate-fade-in min-h-[260px]">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner border border-blue-100">
              <Video size={28} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Viva Voce Training</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Simulate a high-stakes oral defense with your AI supervisor. Practice answering tough questions.</p>
            </div>
            <button
              onClick={() => setIsVivaOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Mic size={15} /> Enter Viva Room
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col z-50 h-[100dvh] w-screen overflow-hidden">

      {/* ─── Header ─── */}
      <header className="h-13 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-4 shrink-0 shadow-sm z-50 gap-2" style={{ height: '52px' }}>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none hidden sm:block">Project</p>
            <h1 className="font-serif font-bold text-sm text-slate-800 truncate max-w-[140px] sm:max-w-[260px] md:max-w-[400px] leading-tight">
              {thesisDoc.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <SaveIndicator />

          {/* Desktop panel toggles */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setIsOutlineOpen(o => !o)}
              title="Toggle outline"
              className={`p-1.5 rounded transition-all ${isOutlineOpen ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <PanelLeft size={15} />
            </button>
            <button
              onClick={() => setIsToolsOpen(o => !o)}
              title="Toggle tools"
              className={`p-1.5 rounded transition-all ${isToolsOpen ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <PanelRight size={15} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </header>

      {/* ─── Formatting Toolbar (desktop: always visible; mobile: compact strip) ─── */}
      <div className="bg-white border-b border-slate-200 shrink-0 z-40">
        <FormattingToolbar />
      </div>

      {/* ─── Main 3-pane layout ─── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left: Outline — desktop only */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden shrink-0 ${isOutlineOpen ? 'w-56' : 'w-0'}`}
        >
          <OutlinePanel />
        </aside>

        {/* Center: The paper */}
        <main
          className="flex-1 overflow-y-auto bg-slate-100 custom-scrollbar"
          onClick={() => setHeadingOpen(false)}
        >
          <div className="flex justify-center px-3 py-4 md:px-8 md:py-10 min-h-full">
            <div className="bg-white w-full max-w-[780px] min-h-[calc(100vh-200px)] shadow-xl border border-slate-200/80 rounded-sm relative">
              {/* Paper inner: tight padding on mobile, generous on desktop */}
              <div className="px-5 py-8 sm:px-10 sm:py-10 md:px-16 md:py-14">
                <EditorContent editor={editor} />
              </div>
              {/* Page footer */}
              <div className="border-t border-slate-100 px-5 sm:px-10 md:px-16 py-3 flex justify-between text-[10px] font-mono text-slate-300">
                <span>{university?.standards.citationStyle || 'APA 7th'} · {university?.name || 'Default Standards'}</span>
                <span>{wordCount.toLocaleString()} words</span>
              </div>
            </div>
          </div>
        </main>

        {/* Right: Tools panel — desktop only */}
        <aside
          className={`hidden md:flex flex-col bg-white border-l border-slate-200 transition-all duration-300 overflow-hidden shrink-0 ${isToolsOpen ? 'w-80' : 'w-0'}`}
        >
          <ToolsPanel />
        </aside>
      </div>

      {/* ─── Mobile bottom action bar ─── */}
      <div className="md:hidden bg-white border-t border-slate-200 shrink-0 z-40 safe-bottom">
        <div className="flex items-center justify-around px-4 py-2">
          <button
            onClick={() => setMobilePanel(mobilePanel === 'outline' ? null : 'outline')}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${mobilePanel === 'outline' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
            <PanelLeft size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Outline</span>
          </button>

          <div className="text-center">
            <p className="text-xs font-bold text-slate-700">{wordCount.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">words</p>
          </div>

          <button
            onClick={() => setMobilePanel(mobilePanel === 'tools' ? null : 'tools')}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${mobilePanel === 'tools' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
          >
            <Sparkles size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">AI Tools</span>
          </button>
        </div>
      </div>

      {/* ─── Mobile bottom sheet ─── */}
      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobilePanel(null)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh] animate-slide-up">
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

      {isVivaOpen && (
        <VivaMode onClose={() => setIsVivaOpen(false)} contextText={editor.getText()} />
      )}
    </div>
  );
};
