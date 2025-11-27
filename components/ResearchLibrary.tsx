
import React, { useState } from 'react';
import { 
  Search, Plus, Filter, Folder, Star, FileText, MoreVertical, 
  Trash2, ExternalLink, Download, BookOpen, Check, X, Tag, Upload, 
  PenLine, Clock, Link, Sparkles
} from 'lucide-react';
import { LibraryItem, LibraryFolder } from '../types';
import { GeminiService } from '../services/geminiService';

interface ResearchLibraryProps {
  items: LibraryItem[];
  setItems: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
}

export const ResearchLibrary: React.FC<ResearchLibraryProps> = ({ items, setItems }) => {
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Mock Folders
  const [folders, setFolders] = useState<LibraryFolder[]>([
    { id: 'all', name: 'All References', count: items.length },
    { id: 'f1', name: 'Thesis Chapter 1', count: items.filter(i => i.folderId === 'f1').length },
    { id: 'f2', name: 'Methodology', count: items.filter(i => i.folderId === 'f2').length },
    { id: 'f3', name: 'AI Ethics', count: items.filter(i => i.folderId === 'f3').length },
  ]);

  // New Item State
  const [newItemInput, setNewItemInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesFolder = activeFolder === 'all' || item.folderId === activeFolder;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFolder === 'favorites') return item.isFavorite && matchesSearch;
    if (activeFolder === 'reading') return item.readStatus === 'reading' && matchesSearch;
    
    return matchesFolder && matchesSearch;
  });

  const handleToggleFavorite = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const handleStatusChange = (id: string, status: LibraryItem['readStatus']) => {
    setItems(prev => prev.map(item => 
        item.id === id ? { ...item, readStatus: status } : item
    ));
  };

  const handleDelete = (id: string) => {
    if(confirm('Are you sure you want to delete this reference?')) {
        setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddItem = async () => {
    if(!newItemInput) return;
    setIsParsing(true);
    
    try {
        const parsed = await GeminiService.parseReference(newItemInput);
        if(parsed) {
            const newItem: LibraryItem = {
                ...parsed,
                id: Date.now().toString(),
                type: 'journal', // Default, could be inferred
                tags: [],
                readStatus: 'unread',
                isFavorite: false,
                addedDate: new Date(),
                folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder
            };
            setItems([newItem, ...items]);
            setNewItemInput('');
            setShowAddModal(false);
        } else {
            alert('Could not parse reference. Please try again or enter manually.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsParsing(false);
    }
  };

  return (
    <div className="flex h-full animate-fade-in bg-slate-50">
      
      {/* Sidebar Filters */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
           <h2 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-2">
             <BookOpen className="text-teal-600" size={20} /> Library
           </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {/* Main Categories */}
           <div className="space-y-1">
              <button 
                onClick={() => setActiveFolder('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'all' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                 <div className="flex items-center gap-3"><Folder size={16} /> All References</div>
                 <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </button>
              <button 
                onClick={() => setActiveFolder('favorites')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'favorites' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                 <div className="flex items-center gap-3"><Star size={16} /> Favorites</div>
                 <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{items.filter(i => i.isFavorite).length}</span>
              </button>
              <button 
                onClick={() => setActiveFolder('reading')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'reading' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                 <div className="flex items-center gap-3"><Clock size={16} /> To Read</div>
                 <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{items.filter(i => i.readStatus === 'reading' || i.readStatus === 'unread').length}</span>
              </button>
           </div>

           {/* Custom Folders */}
           <div>
              <div className="flex justify-between items-center mb-2 px-3">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collections</span>
                 <button className="text-slate-400 hover:text-teal-600"><Plus size={14} /></button>
              </div>
              <div className="space-y-1">
                 {folders.slice(1).map(folder => (
                   <button 
                     key={folder.id}
                     onClick={() => setActiveFolder(folder.id)}
                     className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === folder.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                   >
                     <div className="flex items-center gap-3"><Folder size={16} className={activeFolder === folder.id ? 'fill-slate-400 text-slate-400' : ''} /> {folder.name}</div>
                     <span className="text-xs text-slate-400">{items.filter(i => i.folderId === folder.id).length}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-slate-200">
           <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
             <div className="flex items-center gap-2 mb-1 font-bold text-slate-700">
                <Sparkles size={12} className="text-teal-500" /> Pro Tip
             </div>
             Drag and drop PDFs here to automatically extract citations.
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Toolbar */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
           <div className="relative w-96">
              <input 
                type="text" 
                placeholder="Search authors, titles, tags..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
           </div>

           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium border border-slate-200">
                 <Filter size={16} /> Filter
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                 <Plus size={18} /> Add Reference
              </button>
           </div>
        </div>

        {/* References List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
           {filteredItems.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <BookOpen size={48} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No references found</h3>
                <p className="max-w-xs text-center text-sm mt-2">Try adjusting your search or add a new reference to your collection.</p>
             </div>
           ) : (
             filteredItems.map(item => (
               <div key={item.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start">
                     <div className="flex items-start gap-4">
                        {/* Icon based on type */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            item.pdfUrl ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                           {item.pdfUrl ? <FileText size={20} /> : <BookOpen size={20} />}
                        </div>
                        
                        <div>
                           <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{item.title}</h3>
                           <p className="text-sm text-slate-600">
                              <span className="font-medium text-slate-900">{item.author}</span> • {item.year} • <span className="italic">{item.source}</span>
                           </p>
                           
                           <div className="flex items-center gap-2 mt-3">
                              {/* Status Chip */}
                              <button 
                                onClick={() => handleStatusChange(item.id, item.readStatus === 'read' ? 'unread' : item.readStatus === 'unread' ? 'reading' : 'read')}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity ${
                                  item.readStatus === 'read' ? 'bg-green-100 text-green-700' : 
                                  item.readStatus === 'reading' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {item.readStatus}
                              </button>

                              {/* Tags */}
                              {item.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
                                   <Tag size={10} /> {tag}
                                </span>
                              ))}

                              {/* PDF Link */}
                              {item.pdfUrl && (
                                <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                   <FileText size={10} /> PDF Attached
                                </span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleToggleFavorite(item.id)}
                          className={`p-2 rounded-full transition-colors ${item.isFavorite ? 'text-amber-400 bg-amber-50' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'}`}
                        >
                           <Star size={18} fill={item.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <div className="relative group/menu">
                           <button className="p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50">
                              <MoreVertical size={18} />
                           </button>
                           {/* Hover Menu Mockup */}
                           <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-lg shadow-xl py-1 hidden group-hover/menu:block z-20">
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><PenLine size={14}/> Edit</button>
                              <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Folder size={14}/> Move</button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1">
                        <ExternalLink size={12} /> View Source
                     </button>
                     <button 
                       onClick={() => {navigator.clipboard.writeText(item.formatted); alert('Citation Copied!')}}
                       className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1"
                     >
                        <Check size={12} /> Copy Citation
                     </button>
                     {item.pdfUrl && (
                        <button className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1">
                            <Download size={12} /> Download PDF
                        </button>
                     )}
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-lg text-slate-800">Add New Reference</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              <div className="p-6">
                 {/* Tabs (Mock) */}
                 <div className="flex gap-4 mb-6 border-b border-slate-100 pb-1">
                    <button className="text-sm font-bold text-teal-600 border-b-2 border-teal-600 pb-2">Manual / AI Parse</button>
                    <button className="text-sm font-medium text-slate-500 pb-2 hover:text-slate-800">Upload PDF</button>
                    <button className="text-sm font-medium text-slate-500 pb-2 hover:text-slate-800">Search Online</button>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Paste Reference or Details</label>
                       <textarea 
                          className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[100px]"
                          placeholder="e.g. Smith, J. (2023). The Future of AI. Academic Press."
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                       />
                       <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Sparkles size={12} className="text-teal-500" /> AI will automatically extract author, title, and metadata.
                       </p>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                       <button 
                         onClick={() => setShowAddModal(false)}
                         className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={handleAddItem}
                         disabled={!newItemInput || isParsing}
                         className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                       >
                         {isParsing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check size={16} />}
                         <span>Add to Library</span>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
