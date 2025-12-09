
import React, { useState } from 'react';
import { 
  Search, Plus, Filter, Folder, Star, FileText, MoreVertical, 
  Trash2, ExternalLink, BookOpen, Check, X, Tag, Sparkles, Hash, Menu,
  Clock, PenLine, Activity, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer 
} from 'recharts';
import { LibraryItem, LibraryFolder } from '../types';
import { GeminiService } from '../services/geminiService';
import { OpenCitationsService } from '../services/openCitationsService';

interface ResearchLibraryProps {
  items: LibraryItem[];
  setItems: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
}

export const ResearchLibrary: React.FC<ResearchLibraryProps> = ({ items, setItems }) => {
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMethod, setAddMethod] = useState<'manual' | 'doi'>('manual');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterHasPdf, setFilterHasPdf] = useState(false);
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread' | 'reading'>('all');
  const [filterType, setFilterType] = useState<'all' | 'journal' | 'book' | 'website' | 'report'>('all');
  
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

  // Metrics Modal State
  const [viewingMetrics, setViewingMetrics] = useState<LibraryItem | null>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const filteredItems = items.filter(item => {
    // 1. Context (Folder) Match
    let matchesContext = false;
    if (activeFolder === 'all') {
        matchesContext = true;
    } else if (activeFolder === 'favorites') {
        matchesContext = item.isFavorite;
    } else if (activeFolder === 'reading') {
        // Broaden 'reading' folder to include unread items for better UX ("To Read")
        matchesContext = item.readStatus === 'reading' || item.readStatus === 'unread';
    } else {
        matchesContext = item.folderId === activeFolder;
    }

    // 2. Search Match
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // 3. Advanced Filters
    const matchesPdf = !filterHasPdf || (!!item.pdfUrl && item.pdfUrl !== '#');
    const matchesStatus = filterReadStatus === 'all' || item.readStatus === filterReadStatus;
    const matchesType = filterType === 'all' || item.type === filterType;
    
    return matchesContext && matchesSearch && matchesPdf && matchesStatus && matchesType;
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

  const handleViewMetrics = async (item: LibraryItem) => {
      // Try to find DOI in raw or check if raw IS a DOI
      const doiMatch = item.raw.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/i);
      const doi = doiMatch ? doiMatch[0] : (item.raw.includes('10.') ? item.raw : null);
      
      setViewingMetrics(item);
      setLoadingMetrics(true);
      setMetricsData(null);

      if (!doi) {
          setLoadingMetrics(false);
          return;
      }

      try {
         const [incoming, outgoing, recent] = await Promise.all([
             OpenCitationsService.getCitationCount(doi),
             OpenCitationsService.getReferenceCount(doi),
             OpenCitationsService.getIncomingCitations(doi, 50)
         ]);

         // Process for chart
         const yearMap: Record<string, number> = {};
         recent.forEach((c: any) => {
             if (c.creation) {
                 const y = c.creation.split('-')[0];
                 yearMap[y] = (yearMap[y] || 0) + 1;
             }
         });
         const chartData = Object.keys(yearMap).sort().map(y => ({ year: y, count: yearMap[y] }));

         setMetricsData({ incoming, outgoing, chartData, recent });
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingMetrics(false);
      }
  };

  const handleAddItem = async () => {
    if(!newItemInput) return;
    setIsParsing(true);
    
    try {
        let newItem: LibraryItem | null = null;
        
        // Attempt DOI lookup if method is DOI or input looks like one
        const isDoiInput = newItemInput.match(/^(doi:)?10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/i);
        
        if (addMethod === 'doi' || isDoiInput) {
            const metadata = await OpenCitationsService.getMetadata(newItemInput);
            if (metadata) {
                 const year = metadata.pub_date ? metadata.pub_date.substring(0, 4) : 'n.d.';
                 const citations = await OpenCitationsService.getCitationCount(newItemInput);

                 newItem = {
                     id: Date.now().toString(),
                     raw: newItemInput,
                     title: metadata.title || 'Unknown Title',
                     author: metadata.author ? metadata.author.replace(/;/g, ',') : 'Unknown Author',
                     year: year,
                     source: metadata.venue || 'Unknown Source',
                     formatted: `${metadata.author ? metadata.author.split(';')[0] : 'Unknown'} (${year}). ${metadata.title}. ${metadata.venue || ''}.`,
                     type: 'journal',
                     tags: citations > 0 ? [`${citations} Citations`] : [],
                     readStatus: 'unread',
                     isFavorite: false,
                     addedDate: new Date(),
                     folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder
                 };
            }
        }

        // Fallback to Gemini Parsing if no DOI found or manual mode
        if (!newItem) {
            const parsed = await GeminiService.parseReference(newItemInput);
            if(parsed) {
                newItem = {
                    ...parsed,
                    id: Date.now().toString(),
                    type: 'journal',
                    tags: [],
                    readStatus: 'unread',
                    isFavorite: false,
                    addedDate: new Date(),
                    folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder
                };
            }
        }

        if(newItem) {
            setItems([newItem, ...items]);
            setNewItemInput('');
            setShowAddModal(false);
        } else {
            alert('Could not resolve reference. Please check the DOI or enter details manually.');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred.');
    } finally {
        setIsParsing(false);
    }
  };

  return (
    <div className="flex h-full animate-fade-in bg-slate-50 relative overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Filters */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
           <h2 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-2">
             <BookOpen className="text-teal-600" size={20} /> Library
           </h2>
           <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-slate-400">
               <X size={20} />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {/* Main Categories */}
           <div className="space-y-1">
              <button 
                onClick={() => { setActiveFolder('all'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'all' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                 <div className="flex items-center gap-3"><Folder size={16} /> All References</div>
                 <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </button>
              <button 
                onClick={() => { setActiveFolder('favorites'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'favorites' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                 <div className="flex items-center gap-3"><Star size={16} /> Favorites</div>
                 <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{items.filter(i => i.isFavorite).length}</span>
              </button>
              <button 
                onClick={() => { setActiveFolder('reading'); setIsMobileSidebarOpen(false); }}
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
                     onClick={() => { setActiveFolder(folder.id); setIsMobileSidebarOpen(false); }}
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
             Use a DOI to automatically fetch accurate metadata from OpenCitations.
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        
        {/* Toolbar */}
        <div className="h-auto py-3 md:py-0 md:h-16 border-b border-slate-200 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 shrink-0 z-10 gap-3">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
                  <Menu size={24} />
              </button>
              <div className="relative w-full md:w-96">
                <input 
                    type="text" 
                    placeholder="Search authors, titles, tags..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
           </div>

           <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-slate-100 text-teal-700 border-teal-200' : 'text-slate-600 hover:bg-slate-50 border-slate-200'}`}
              >
                 <Filter size={16} /> <span className="hidden sm:inline">Filter</span>
                 {(filterReadStatus !== 'all' || filterHasPdf || filterType !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                 )}
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
              >
                 <Plus size={18} /> <span className="hidden sm:inline">Add Reference</span><span className="sm:hidden">Add</span>
              </button>
           </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
            <div className="px-4 md:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 animate-fade-in-down">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                  <select 
                    value={filterReadStatus}
                    onChange={(e) => setFilterReadStatus(e.target.value as any)}
                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                     <option value="all">Any Status</option>
                     <option value="unread">Unread</option>
                     <option value="reading">Reading</option>
                     <option value="read">Completed</option>
                  </select>
               </div>
               
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Format:</span>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                     <option value="all">All Formats</option>
                     <option value="journal">Journals</option>
                     <option value="book">Books</option>
                     <option value="website">Websites</option>
                     <option value="report">Reports</option>
                  </select>
               </div>
               
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Type:</span>
                  <button 
                    onClick={() => setFilterHasPdf(!filterHasPdf)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${filterHasPdf ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                  >
                     <FileText size={12} /> 
                     {filterHasPdf ? 'PDF Only' : 'All Types'}
                  </button>
               </div>

               {(filterReadStatus !== 'all' || filterHasPdf || filterType !== 'all') && (
                   <button 
                     onClick={() => { setFilterReadStatus('all'); setFilterHasPdf(false); setFilterType('all'); }}
                     className="text-xs text-slate-500 hover:text-red-600 underline ml-auto"
                   >
                     Clear Filters
                   </button>
               )}
            </div>
        )}

        {/* References List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50">
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
                  <div className="flex justify-between items-start gap-3">
                     <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        {/* Icon based on type */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            item.pdfUrl ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                           {item.pdfUrl ? <FileText size={20} /> : <BookOpen size={20} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <h3 className="font-bold text-slate-800 text-base md:text-lg leading-tight mb-1 truncate">{item.title}</h3>
                           <p className="text-sm text-slate-600 line-clamp-2">
                              <span className="font-medium text-slate-900">{item.author}</span> • {item.year} • <span className="italic">{item.source}</span>
                           </p>
                           
                           <div className="flex flex-wrap items-center gap-2 mt-3">
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

                              <span className="flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100 uppercase">
                                 {item.type}
                              </span>

                              {/* Tags */}
                              {item.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
                                   <Tag size={10} /> {tag}
                                </span>
                              ))}

                              {/* PDF Link */}
                              {item.pdfUrl && item.pdfUrl !== '#' && (
                                <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                   <FileText size={10} /> PDF
                                </span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-1 md:gap-2 shrink-0">
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
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={() => handleViewMetrics(item)}
                        className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1"
                     >
                        <Activity size={12} /> View Metrics
                     </button>
                     <button 
                       onClick={() => {navigator.clipboard.writeText(item.formatted); alert('Citation Copied!')}}
                       className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1"
                     >
                        <Check size={12} /> Copy Citation
                     </button>
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
                 {/* Tabs */}
                 <div className="flex gap-4 mb-6 border-b border-slate-100 pb-1">
                    <button 
                        onClick={() => setAddMethod('manual')}
                        className={`text-sm font-bold pb-2 border-b-2 transition-colors ${addMethod === 'manual' ? 'text-teal-600 border-teal-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
                    >
                        Manual / AI Parse
                    </button>
                    <button 
                        onClick={() => setAddMethod('doi')}
                        className={`text-sm font-bold pb-2 border-b-2 transition-colors ${addMethod === 'doi' ? 'text-teal-600 border-teal-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
                    >
                        Import DOI
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">
                           {addMethod === 'doi' ? 'Enter DOI' : 'Paste Reference Details'}
                       </label>
                       <textarea 
                          className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[100px]"
                          placeholder={addMethod === 'doi' ? "e.g. 10.1108/jd-12-2013-0166" : "e.g. Smith, J. (2023). The Future of AI. Academic Press."}
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                       />
                       <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          {addMethod === 'doi' 
                            ? <><Hash size={12} className="text-teal-500" /> Fetch metadata from OpenCitations.</> 
                            : <><Sparkles size={12} className="text-teal-500" /> AI will automatically extract author, title, and metadata.</>}
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
                         <span>{addMethod === 'doi' ? 'Search & Add' : 'Add to Library'}</span>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Metrics Modal */}
      {viewingMetrics && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Activity className="text-teal-600" size={20} /> Citation Impact
                 </h3>
                 <button onClick={() => setViewingMetrics(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                 {loadingMetrics ? (
                     <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                         <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-4"></div>
                         <p className="text-sm">Fetching data from OpenCitations...</p>
                     </div>
                 ) : !metricsData ? (
                     <div className="text-center py-10 text-slate-400">
                         <Hash size={40} className="mx-auto mb-2 opacity-30" />
                         <p className="text-sm">No DOI found or data unavailable for this reference.</p>
                     </div>
                 ) : (
                     <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{viewingMetrics.title}</h4>
                            <p className="text-xs text-slate-500">{viewingMetrics.author} ({viewingMetrics.year})</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citations</span>
                                    <ArrowUpRight size={16} className="text-teal-500"/>
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{metricsData.incoming}</span>
                                <p className="text-xs text-slate-400 mt-1">Times Cited</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">References</span>
                                    <BookOpen size={16} className="text-indigo-500"/>
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{metricsData.outgoing}</span>
                                <p className="text-xs text-slate-400 mt-1">Cited Works</p>
                            </div>
                        </div>

                        {metricsData.chartData && metricsData.chartData.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-64">
                                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Citation Growth</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metricsData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="year" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                        <ReTooltip 
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
