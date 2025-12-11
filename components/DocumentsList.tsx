
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

  // Menu & Edit State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset filtered docs when main docs change, unless actively searching
    if (!searchQuery) {
        setFilteredDocuments(documents);
    }
  }, [documents, searchQuery]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpenId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Standard Local Search (Instant)
  const handleLocalSearch = (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
          setFilteredDocuments(documents);
          return;
      }
      const lower = query.toLowerCase();
      const filtered = documents.filter(d => 
          d.title.toLowerCase().includes(lower) || 
          d.status.toLowerCase().includes(lower)
      );
      setFilteredDocuments(filtered);
  };

  // AI Semantic Search
  const handleAiSearch = async () => {
      if (!searchQuery.trim()) return;
      
      setIsAiSearching(true);
      try {
          // Prepare lightweight metadata for the AI
          const docsMetadata = documents.map(d => ({
              id: d.id,
              title: d.title,
              status: d.status,
              lastModified: d.lastModified.toDateString(),
              progress: `${d.progress}%`
          }));

          const matchedIds = await GeminiService.filterDocuments(searchQuery, docsMetadata);
          
          if (matchedIds && matchedIds.length > 0) {
              const matchedDocs = documents.filter(d => matchedIds.includes(d.id));
              setFilteredDocuments(matchedDocs);
          } else {
              setFilteredDocuments([]);
          }
      } catch (e) {
          console.error("AI Search Failed", e);
          // Fallback to local search
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

  const handleDelete = (id: string) => {
      setMenuOpenId(null);
      onDelete(id);
  };

  // Grouping for Kanban
  const drafts = filteredDocuments.filter(d => d.status === 'Draft');
  const reviews = filteredDocuments.filter(d => d.status === 'Review');
  const completed = filteredDocuments.filter(d => d.status === 'Completed');

  const KanbanColumn = ({ title, items, color, icon: Icon }: any) => (
    <div className="flex-1 min-w-[300px] bg-slate-50 rounded-xl p-4 flex flex-col h-full border border-slate-200">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Icon size={18} className={color} /> {title}
        </h3>
        <span className="bg-white text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200">{items.length}</span>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                Empty
            </div>
        ) : items.map((doc: Document) => (
          <div 
            key={doc.id}
            onClick={() => onOpenDocument(doc)}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer transition-all group relative"
          >
            <h4 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-teal-700 line-clamp-2">{doc.title}</h4>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3">
               <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${doc.progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={10} /> {doc.lastModified.toLocaleDateString()}</span>
              <span className="font-medium text-slate-700">{doc.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">My Documents</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">Manage and organize your thesis drafts.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex items-center w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="Search documents..." 
                    className="w-full pl-10 pr-12 py-2 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-sm"
                    value={searchQuery}
                    onChange={(e) => handleLocalSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <button 
                    onClick={handleAiSearch}
                    disabled={isAiSearching || !searchQuery}
                    className="absolute right-1 top-1 p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors disabled:opacity-50"
                    title="AI Smart Search"
                >
                    {isAiSearching ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14} />}
                </button>
            </div>

            <div className="flex gap-3">
                <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center shadow-sm">
                    <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`}
                    title="List View"
                    >
                        <ListIcon size={18} />
                    </button>
                    <button 
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded transition-colors ${viewMode === 'board' ? 'bg-slate-100 text-teal-700' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Kanban Board"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
                <button 
                    onClick={onCreateNew}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full md:w-auto shadow-sm whitespace-nowrap"
                >
                    <Plus size={20} />
                    <span className="hidden md:inline">New Document</span>
                    <span className="md:hidden">New</span>
                </button>
            </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible min-h-[300px]">
            {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                <FileText size={48} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No documents found</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                    {searchQuery ? "Try adjusting your search terms or use the AI filter for natural language queries." : "Start your journey by creating your first thesis document tailored to your university standards."}
                </p>
                {!searchQuery && <button onClick={onCreateNew} className="text-teal-600 font-medium hover:underline">Create new document</button>}
            </div>
            ) : (
            <div className="divide-y divide-slate-100">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-3">Last Modified</div>
                <div className="col-span-1"></div>
                </div>
                
                {/* Rows */}
                {filteredDocuments.map((doc) => (
                <div 
                    key={doc.id}
                    onClick={() => onOpenDocument(doc)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors items-center group relative"
                >
                    <div className="col-span-12 md:col-span-5 flex items-center space-x-3">
                        <div className="bg-teal-100 p-2 rounded text-teal-600 shrink-0">
                        <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {editingId === doc.id ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="text" 
                                        className="w-full border border-teal-500 rounded px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveRename();
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                    />
                                    <button onClick={handleSaveRename} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14}/></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors truncate text-sm md:text-base">{doc.title}</h3>
                                    <p className="text-xs text-slate-500 md:hidden mt-1">Edited {doc.lastModified.toLocaleDateString()}</p>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="col-span-6 md:col-span-3 flex items-center mt-1 md:mt-0">
                        <div className="w-full max-w-[140px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span className={`px-2 py-0.5 rounded-full ${
                            doc.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                            doc.status === 'Review' ? 'bg-orange-100 text-orange-700' : 
                            'bg-slate-100 text-slate-600'
                            }`}>
                            {doc.status}
                            </span>
                            <span className="text-slate-500">{doc.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${doc.progress}%` }}></div>
                        </div>
                        </div>
                    </div>

                    <div className="col-span-6 md:col-span-3 text-sm text-slate-500 hidden md:flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{doc.lastModified.toLocaleDateString()}</span>
                    </div>

                    <div className="hidden md:flex col-span-1 justify-end relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }}
                            className={`p-2 rounded-full transition-colors ${menuOpenId === doc.id ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                            <MoreVertical size={16} />
                        </button>
                        
                        {menuOpenId === doc.id && (
                            <div 
                                ref={menuRef}
                                className="absolute right-0 top-10 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-fade-in-down"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button 
                                    onClick={() => handleStartRename(doc)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 first:rounded-t-lg"
                                >
                                    <Pen size={14} /> Rename
                                </button>
                                <div className="h-px bg-slate-100"></div>
                                <button 
                                    onClick={() => handleDelete(doc.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
             <div className="flex gap-6 h-full min-w-[1000px]">
                 <KanbanColumn title="Drafting" items={drafts} color="text-slate-500" icon={CircleDashed} />
                 <KanbanColumn title="In Review" items={reviews} color="text-orange-500" icon={Circle} />
                 <KanbanColumn title="Completed" items={completed} color="text-green-500" icon={CheckCircle2} />
             </div>
        </div>
      )}
    </div>
  );
};
