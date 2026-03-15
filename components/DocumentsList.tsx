import React, { useState, useEffect, useRef } from 'react';
import { Document } from '../types';
import { FileText, Plus, Clock, MoreVertical, LayoutGrid, List as ListIcon, CheckCircle2, CircleDashed, Circle, Search, Sparkles, RefreshCw, Pen, Trash2, Check, X } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface DocumentsListProps {
  documents: Document[];
  onOpenDocument: (doc: Document) => void;
  onCreateNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ documents, onOpenDocument, onCreateNew, onRename, onDelete }) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(documents);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery) setFilteredDocuments(documents);
  }, [documents, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpenId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocalSearch = (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
          setFilteredDocuments(documents);
          return;
      }
      const lower = query.toLowerCase();
      setFilteredDocuments(documents.filter(d => 
          d.title.toLowerCase().includes(lower) || d.status.toLowerCase().includes(lower)
      ));
  };

  const handleAiSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsAiSearching(true);
      try {
          const docsMetadata = documents.map(d => ({
              id: d.id,
              title: d.title,
              status: d.status,
              lastModified: d.lastModified.toDateString(),
              progress: `${d.progress}%`
          }));
          const matchedIds = await GeminiService.filterDocuments(searchQuery, docsMetadata);
          if (matchedIds?.length > 0) {
              setFilteredDocuments(documents.filter(d => matchedIds.includes(d.id)));
          } else {
              setFilteredDocuments([]);
          }
      } catch (e) {
          handleLocalSearch(searchQuery);
      } finally {
          setIsAiSearching(false);
      }
  };

  const handleStartRename = (doc: Document) => {
      setEditingId(doc.id);
      setEditTitle(doc.title);
      setMenuOpenId(null);
  };

  const handleSaveRename = () => {
      if (editingId && editTitle.trim()) {
          onRename(editingId, editTitle);
          setEditingId(null);
      }
  };

  const drafts = filteredDocuments.filter(d => d.status === 'Draft');
  const reviews = filteredDocuments.filter(d => d.status === 'Review');
  const completed = filteredDocuments.filter(d => d.status === 'Completed');

  const KanbanColumn = ({ title, items, color, icon: Icon }: any) => (
    <div className="flex-1 min-w-[300px] bg-slate-50 rounded-2xl p-5 flex flex-col h-full border border-slate-200">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Icon size={18} className={color} /> {title}
        </h3>
        <span className="bg-white text-slate-500 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">{items.length}</span>
      </div>
      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {items.length === 0 ? (
            <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">No items</div>
        ) : items.map((doc: Document) => (
          <div key={doc.id} onClick={() => onOpenDocument(doc)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group active:scale-[0.98]">
            <h4 className="font-bold text-slate-800 text-sm mb-3 group-hover:text-blue-700 line-clamp-2 leading-tight">{doc.title}</h4>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3">
               <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${doc.progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1"><Clock size={10} /> {doc.lastModified.toLocaleDateString()}</span>
              <span className="text-blue-600">{doc.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Project Repository</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and monitor your active thesis workflows.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full md:w-80 group">
                <input 
                    type="text" 
                    placeholder="Search with AI..." 
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm bg-white shadow-sm"
                    value={searchQuery}
                    onChange={(e) => handleLocalSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                />
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <button onClick={handleAiSearch} disabled={isAiSearching || !searchQuery} className="absolute right-1.5 top-1.5 p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50">
                    {isAiSearching ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={16} />}
                </button>
            </div>
            <div className="flex gap-3">
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={18} /></button>
                    <button onClick={() => setViewMode('board')} className={`p-2 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-slate-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                </div>
                <button onClick={onCreateNew} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap">
                    <Plus size={20} /> New Document
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible min-h-[400px]">
            {filteredDocuments.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center shadow-inner">
                    <FileText size={36} className="text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Plus size={14} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">
                    {searchQuery ? 'No results found' : 'No projects yet'}
                  </h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                    {searchQuery 
                      ? `Nothing matched "${searchQuery}". Try a different term or clear your search.`
                      : 'Start your academic journey by creating your first thesis project.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button 
                    onClick={onCreateNew} 
                    className="mt-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                  >
                    <Plus size={16} /> Create First Project
                  </button>
                )}
            </div>
            ) : (
            <div className="divide-y divide-slate-100">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="col-span-5 px-2">Document Name</div>
                    <div className="col-span-3">Workflow Status</div>
                    <div className="col-span-3">Last Modified</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
                {filteredDocuments.map((doc) => (
                <div key={doc.id} onClick={() => onOpenDocument(doc)} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-slate-50/50 cursor-pointer transition-colors items-center group relative border-l-4 border-transparent hover:border-blue-500">
                    <div className="col-span-12 md:col-span-5 flex items-center space-x-4">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0"><FileText size={22} /></div>
                        <div className="flex-1 min-w-0">
                            {editingId === doc.id ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <input type="text" className="w-full border-2 border-blue-500 rounded-lg px-3 py-1 text-sm font-bold text-slate-800 outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditingId(null); }} />
                                    <button onClick={handleSaveRename} className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm"><Check size={16}/></button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate text-sm md:text-base leading-snug">{doc.title}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter md:hidden">Edited {doc.lastModified.toLocaleDateString()}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="col-span-6 md:col-span-3 flex items-center">
                        <div className="w-full max-w-[160px]">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                            <span className={`px-2 py-0.5 rounded-md ${doc.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : doc.status === 'Review' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{doc.status}</span>
                            <span className="text-slate-500">{doc.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${doc.progress}%` }}></div></div>
                        </div>
                    </div>
                    <div className="col-span-6 md:col-span-3 text-xs font-medium text-slate-500 hidden md:flex items-center space-x-2">
                        <Clock size={14} className="text-slate-300" /><span>{doc.lastModified.toLocaleDateString()}</span>
                    </div>
                    <div className="hidden md:flex col-span-1 justify-end relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }} className={`p-2 rounded-xl transition-colors ${menuOpenId === doc.id ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}><MoreVertical size={18} /></button>
                        {menuOpenId === doc.id && (
                            <div ref={menuRef} className="absolute right-0 top-11 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-fade-in py-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleStartRename(doc)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors font-medium"><Pen size={16} /> Rename Project</button>
                                <div className="h-px bg-slate-100 mx-2"></div>
                                <button onClick={() => onDelete(doc.id)} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors font-medium"><Trash2 size={16} /> Delete Forever</button>
                            </div>
                        )}
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-6">
             <div className="flex gap-8 h-full min-w-[1100px]">
                 <KanbanColumn title="Research & Drafting" items={drafts} color="text-slate-400" icon={CircleDashed} />
                 <KanbanColumn title="Under Review" items={reviews} color="text-blue-500" icon={Circle} />
                 <KanbanColumn title="Validated & Final" items={completed} color="text-emerald-500" icon={CheckCircle2} />
             </div>
        </div>
      )}
    </div>
  );
};