
import React, { useState, useEffect } from 'react';
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
  Save, Bold, Italic, List, AlignLeft, Sparkles, Search, 
  BookOpen, Mic, Video, ArrowLeft, AlignCenter, Underline as UnderlineIcon,
  Highlighter, Undo, Redo, PanelLeft, PanelRight, ShieldCheck
} from 'lucide-react';
import { Document, University } from '../types';
import { VivaMode } from './VivaMode';

interface EditorProps {
  document: Document;
  university: University | null;
  onSave: (doc: Document) => void;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'review' | 'research' | 'viva'>('review');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [outline, setOutline] = useState<{ id: string, text: string, level: number }[]>([]);

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
      const json = editor.getJSON();
      const newOutline: any[] = [];
      const traverse = (node: any) => {
        if (node.type === 'heading') {
          newOutline.push({ id: Math.random().toString(), text: node.content?.[0]?.text || 'Untitled', level: node.attrs?.level || 1 });
        } else if (node.content) node.content.forEach(traverse);
      };
      if (json.content) json.content.forEach(traverse);
      setOutline(newOutline);
    },
    editorProps: { attributes: { class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[70vh]' } },
  });

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editor) onSave({ ...thesisDoc, content: editor.getHTML(), lastModified: new Date() });
    }, 5000);
    return () => clearTimeout(timer);
  }, [editor?.getHTML()]);

  if (!editor) return null;

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col z-50 h-screen w-screen overflow-hidden">
      {/* Dynamic Header */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Project</span>
            <h1 className="font-serif font-bold text-sm text-slate-800 truncate max-w-[200px] md:max-w-[400px]">
              {thesisDoc.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
             <button onClick={() => setIsOutlineOpen(!isOutlineOpen)} className={`p-1.5 rounded ${isOutlineOpen ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <PanelLeft size={16} />
             </button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded ${isSidebarOpen ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <PanelRight size={16} />
             </button>
          </div>
          <button onClick={() => onSave({ ...thesisDoc, content: editor.getHTML() })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
            <Save size={14}/> Save
          </button>
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Outline */}
        <aside className={`${isOutlineOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col overflow-hidden`}>
           <div className="p-4 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Structure</h3>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {outline.map((item) => (
                <button key={item.id} className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-slate-100 truncate ${item.level === 1 ? 'font-bold text-slate-800' : 'pl-6 text-slate-500'}`}>
                  {item.text}
                </button>
              ))}
              {outline.length === 0 && <p className="text-[10px] text-slate-400 italic p-4">Add headings to see your outline.</p>}
           </div>
           <div className="p-4 border-t border-slate-100 text-center">
              <span className="text-[10px] font-mono text-slate-400">{wordCount} words</span>
           </div>
        </aside>

        {/* Center: The Paper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-100/50 custom-scrollbar flex justify-center">
          <div className="bg-white w-full max-w-[850px] min-h-[1100px] shadow-2xl border border-slate-200 p-[20mm] md:p-[25mm] rounded-sm animate-fade-in relative">
            
            {/* Context Toolbar */}
            <div className="sticky top-0 mb-8 pb-4 border-b border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar bg-white z-10">
               <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900"><Undo size={16}/></button>
               <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900"><Redo size={16}/></button>
               <div className="w-px h-4 bg-slate-200 mx-1"></div>
               <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}><Bold size={16}/></button>
               <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}><Italic size={16}/></button>
               <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}><UnderlineIcon size={16}/></button>
               <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-1.5 rounded ${editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500'}`}><Highlighter size={16}/></button>
               <div className="w-px h-4 bg-slate-200 mx-1"></div>
               <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}><List size={16}/></button>
               <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}><AlignCenter size={16}/></button>
               <div className="flex-1"></div>
               <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100 uppercase tracking-tighter">
                  {university?.standards.citationStyle || 'APA'} Standards
               </div>
            </div>

            <EditorContent editor={editor} />
          </div>
        </main>

        {/* Right: Tools */}
        <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-l border-slate-200 transition-all duration-300 flex flex-col overflow-hidden`}>
           <div className="flex border-b border-slate-100 shrink-0">
              {(['review', 'research', 'viva'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'review' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
                     <h4 className="font-serif font-bold text-lg mb-2 flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-400" /> AI Scholar Co-pilot
                     </h4>
                     <p className="text-xs text-slate-400 leading-relaxed mb-4">I've scanned your current draft. You have some weak arguments in the methodology section.</p>
                     <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
                        <ShieldCheck size={14}/> Run Integrity Audit
                     </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                     <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Suggestions</h5>
                     <div className="space-y-2">
                        <div className="p-2 bg-white rounded border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer">
                           <span className="font-bold text-blue-600">Style:</span> Convert passive voice in Chapter 1 to active.
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200 text-[11px] hover:border-blue-300 transition-colors cursor-pointer">
                           <span className="font-bold text-blue-600">Citation:</span> Source <em>Smith (2022)</em> is missing from references.
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'research' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="relative">
                      <input className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Search citations..." />
                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14}/>
                   </div>
                   <div className="text-center py-12 text-slate-400">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-50"/>
                      <p className="text-xs font-medium">Connect Zotero or Mendeley in Settings to sync your library here.</p>
                   </div>
                </div>
              )}

              {activeTab === 'viva' && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-fade-in">
                   <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                      <Video size={32} />
                   </div>
                   <div className="space-y-2">
                      <h4 className="font-bold text-slate-800">Viva Voice Training</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Simulate a high-stakes oral defense with your AI supervisor. Practice answering tough questions in real-time.</p>
                   </div>
                   <button onClick={() => setIsVivaOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                      <Mic size={16} /> Enter Viva Room
                   </button>
                </div>
              )}
           </div>
        </aside>
      </div>

      {isVivaOpen && <VivaMode onClose={() => setIsVivaOpen(false)} contextText={editor.getText()} />}
    </div>
  );
};