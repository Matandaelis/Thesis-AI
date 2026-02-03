import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Folder, Star, FileText, 
  Trash2, BookOpen, X, Tag, Menu,
  Activity, Library, Loader2, PenTool
} from 'lucide-react';
import { LibraryItem, LibraryFolder } from '../types';
import { ChatWithPaper } from './ChatWithPaper';

interface ResearchLibraryProps {
  items: LibraryItem[];
  setItems: any;
  folders: LibraryFolder[];
  setFolders: any;
  onOpenEditor?: (paper: LibraryItem) => void;
}

export const ResearchLibrary: React.FC<ResearchLibraryProps> = ({ items, setItems, folders, setFolders, onOpenEditor }) => {
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewingMetrics, setViewingMetrics] = useState<LibraryItem | null>(null);
  
  const filteredItems = items.filter(item => {
      if (activeFolder === 'all') return true;
      if (activeFolder === 'favorites') return item.isFavorite;
      if (activeFolder === 'reading') return item.readStatus === 'reading';
      return item.folderId === activeFolder;
  }).filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-full animate-fade-in bg-slate-50 relative overflow-hidden">
      {/* Sidebar Library */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 md:relative md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
           <h2 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-2"><Library className="text-blue-600" size={20} /> My Repository</h2>
           <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-slate-400"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
           <div className="space-y-1.5">
              <button onClick={() => setActiveFolder('all')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFolder === 'all' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Folder size={18} /> All Sources</div>
                 <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{items.length}</span>
              </button>
              <button onClick={() => setActiveFolder('favorites')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFolder === 'favorites' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                 <div className="flex items-center gap-3"><Star size={18} /> Starred Works</div>
              </button>
           </div>
           <div>
              <div className="flex justify-between items-center mb-3 px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collections</span>
                <button className="text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-colors"><Plus size={14}/></button>
              </div>
              <div className="space-y-1">
                {folders.map(f => (
                    <button key={f.id} onClick={() => setActiveFolder(f.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeFolder === f.id ? 'bg-slate-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3"><Folder size={16} className="text-slate-400"/> {f.name}</div>
                    </button>
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <div className="bg-white border-b border-slate-200 p-4 shrink-0 z-10 shadow-sm flex items-center gap-4">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-slate-500 p-2 hover:bg-slate-50 rounded-lg"><Menu size={24} /></button>
            <div className="relative flex-1 max-w-xl group">
                <input type="text" placeholder="Filter references by title or author..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0">
               <Plus size={18} /> <span className="hidden sm:inline">Import Paper</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/50 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <Library size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-sm">No references found</p>
                  <p className="text-xs mt-1">Try changing your search or collection filter.</p>
              </div>
            ) : filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group active:scale-[0.99]">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.pdfUrl ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {item.pdfUrl ? <FileText size={24} /> : <BookOpen size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate group-hover:text-blue-700 transition-colors" title={item.title}>{item.title}</h3>
                                <p className="text-sm text-slate-500 font-medium">
                                  <span className="text-slate-900">{item.author}</span> • {item.year} • <span className="italic">{item.source}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <span className="text-[10px] font-black tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase">{item.type}</span>
                                    {item.tags.map(tag => <span key={tag} className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100"><Tag size={10} /> {tag}</span>)}
                                </div>
                            </div>
                        </div>
                        <button className={`p-2.5 rounded-xl transition-all ${item.isFavorite ? 'text-amber-500 bg-amber-50 shadow-sm' : 'text-slate-300 hover:bg-slate-50'}`}>
                           <Star size={20} fill={item.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6">
                        <button onClick={() => setViewingMetrics(item)} className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors"><Activity size={14} /> Quick Analysis</button>
                        {onOpenEditor && <button onClick={() => onOpenEditor(item)} className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors"><PenTool size={14} /> Open Context</button>}
                        <div className="flex-1"></div>
                        {item.pdfUrl && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">Full text synced</span>}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {viewingMetrics && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col border border-white/20">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur shrink-0">
                 <div className="flex items-center gap-3">
                    <Activity className="text-blue-600" size={22} />
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">ScholarSync Insight</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Paper Assistant</p>
                    </div>
                 </div>
                 <button onClick={() => setViewingMetrics(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-0 bg-slate-50 custom-scrollbar">
                 <ChatWithPaper paper={viewingMetrics} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};