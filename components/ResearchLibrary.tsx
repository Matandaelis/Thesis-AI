
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Folder, Star, FileText, MoreVertical, 
  Trash2, ExternalLink, BookOpen, Check, X, Tag, Sparkles, Hash, Menu,
  Clock, PenLine, Activity, ArrowUpRight, Globe, DownloadCloud, Quote, Lightbulb, Library,
  FolderPlus, FolderOpen, Copy
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer 
} from 'recharts';
import { LibraryItem, LibraryFolder, Reference } from '../types';
import { GeminiService } from '../services/geminiService';
import { OpenCitationsService } from '../services/openCitationsService';
import { SemanticScholarService, SemanticPaper } from '../services/semanticScholarService';
import { CitationService, CrossRefPaper } from '../services/citationService';

interface ResearchLibraryProps {
  items: LibraryItem[];
  setItems: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
  folders: LibraryFolder[];
  setFolders: React.Dispatch<React.SetStateAction<LibraryFolder[]>>;
}

export const ResearchLibrary: React.FC<ResearchLibraryProps> = ({ items, setItems, folders, setFolders }) => {
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMethod, setAddMethod] = useState<'manual' | 'doi' | 'search' | 'import'>('manual');
  const [searchProvider, setSearchProvider] = useState<'gemini' | 'semantic' | 'crossref'>('semantic');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Folder Management State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterHasPdf, setFilterHasPdf] = useState(false);
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread' | 'reading'>('all');
  const [filterType, setFilterType] = useState<'all' | 'journal' | 'book' | 'website' | 'report'>('all');
  
  // New Item State
  const [newItemInput, setNewItemInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]); // Mixed types based on provider

  // Metrics Modal State
  const [viewingMetrics, setViewingMetrics] = useState<LibraryItem | null>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [relatedPapers, setRelatedPapers] = useState<SemanticPaper[]>([]);

  // Integration Status
  const [isZoteroConnected, setIsZoteroConnected] = useState(false);
  const [isMendeleyConnected, setIsMendeleyConnected] = useState(false);

  // Active Item Menu State
  const [activeItemMenu, setActiveItemMenu] = useState<string | null>(null);
  
  // Citation Copy State
  const [copyStyle, setCopyStyle] = useState('APA 7th');
  const [openCopyMenuId, setOpenCopyMenuId] = useState<string | null>(null);

  useEffect(() => {
      // Check local storage for mocked connection status
      setIsZoteroConnected(localStorage.getItem('zotero_connected') === 'true');
      setIsMendeleyConnected(localStorage.getItem('mendeley_connected') === 'true');
  }, []);

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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: LibraryFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      count: 0
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = (folderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if(confirm('Delete this folder? Items inside will be moved to "All References".')) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      // Reset items in this folder to no folder
      setItems(prev => prev.map(item => 
        item.folderId === folderId ? { ...item, folderId: undefined } : item
      ));
      if (activeFolder === folderId) setActiveFolder('all');
    }
  };

  const handleMoveItem = (itemId: string, folderId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, folderId: folderId === 'all' ? undefined : folderId } : item
    ));
    setActiveItemMenu(null); // Close menu
  };

  const handleCopyCitation = (item: LibraryItem, style: string) => {
      const text = CitationService.formatCitation(item, style);
      navigator.clipboard.writeText(text);
      setOpenCopyMenuId(null);
      alert(`Copied as ${style}!`);
  };

  const handleViewMetrics = async (item: LibraryItem) => {
      setViewingMetrics(item);
      setLoadingMetrics(true);
      setMetricsData(null);
      setRelatedPapers([]);

      const doiMatch = item.raw.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/i);
      const doi = doiMatch ? doiMatch[0] : (item.raw.includes('10.') ? item.raw : null);

      try {
         // Attempt Semantic Scholar details first if we have a title match or DOI
         let semanticData = null;
         if (doi) {
             const results = await SemanticScholarService.searchPapers(doi, 1);
             if (results.length > 0) semanticData = results[0];
         } else {
             const results = await SemanticScholarService.searchPapers(item.title, 1);
             if (results.length > 0 && results[0].title.toLowerCase().includes(item.title.toLowerCase().substring(0, 20))) {
                 semanticData = results[0];
             }
         }

         if (semanticData) {
             // Get Recs
             const recs = await SemanticScholarService.getRecommendations(semanticData.paperId);
             setRelatedPapers(recs);
             
             // Construct metrics from Semantic Data
             setMetricsData({
                 incoming: semanticData.citationCount,
                 outgoing: 0, // Semantic API separate call
                 influential: semanticData.influentialCitationCount,
                 tldr: semanticData.tldr?.text,
                 source: 'Semantic Scholar'
             });
         } else if (doi) {
             // Fallback to OpenCitations
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
             setMetricsData({ incoming, outgoing, chartData, source: 'OpenCitations' });
         }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingMetrics(false);
      }
  };

  const handleSearchWeb = async () => {
      if(!newItemInput) return;
      setIsParsing(true);
      setSearchResults([]);
      try {
          if (searchProvider === 'semantic') {
              const results = await SemanticScholarService.searchPapers(newItemInput);
              setSearchResults(results);
          } else if (searchProvider === 'crossref') {
              const results = await CitationService.searchPapers(newItemInput);
              setSearchResults(results);
          } else {
              const results = await GeminiService.findCitation(newItemInput);
              setSearchResults(results);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsParsing(false);
      }
  };

  const handleAddSearchResult = (res: any) => {
      let newItem: LibraryItem;
      
      if (searchProvider === 'semantic') {
          // Semantic Paper format
          newItem = {
              id: Date.now().toString(),
              raw: res.paperId,
              title: res.title,
              author: res.authors?.[0]?.name || 'Unknown',
              year: res.year?.toString() || 'n.d.',
              source: res.venue || 'Semantic Scholar',
              formatted: `${res.authors?.[0]?.name} (${res.year}). ${res.title}. ${res.venue || ''}.`,
              type: 'journal',
              tags: ['Semantic Import', `${res.citationCount} Citations`],
              pdfUrl: res.openAccessPdf?.url,
              readStatus: 'unread',
              isFavorite: false,
              addedDate: new Date(),
              folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder,
              notes: res.tldr?.text ? `TLDR: ${res.tldr.text}` : ''
          };
      } else if (searchProvider === 'crossref') {
          // CrossRef Paper format
          const authors = res.author ? res.author.map((a: any) => `${a.family}, ${a.given?.[0]}.`).join('; ') : 'Unknown';
          const year = res.issued?.['date-parts']?.[0]?.[0]?.toString() || 'n.d.';
          const journal = res['container-title']?.[0] || res.publisher || 'CrossRef';
          
          newItem = {
              id: Date.now().toString(),
              raw: res.DOI || res.URL,
              title: res.title?.[0] || 'Untitled',
              author: authors,
              year: year,
              source: journal,
              formatted: `${authors} (${year}). ${res.title?.[0]}. ${journal}.`,
              type: 'journal',
              tags: ['CrossRef Import', 'DOI'],
              pdfUrl: res.URL,
              readStatus: 'unread',
              isFavorite: false,
              addedDate: new Date(),
              folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder
          };
      } else {
          // Gemini Reference format
          newItem = {
              ...res,
              id: Date.now().toString(),
              type: 'journal',
              tags: ['Web Import'],
              readStatus: 'unread',
              isFavorite: false,
              addedDate: new Date(),
              folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder
          };
      }
      
      setItems([newItem, ...items]);
  };

  const handleImportLibrary = (source: 'zotero' | 'mendeley') => {
      setIsParsing(true);
      setTimeout(() => {
          // Mock Data
          const mockImports: LibraryItem[] = [
              {
                  id: `imp-${Date.now()}-1`,
                  raw: '10.1038/s41586-020-2003-2',
                  title: 'Deep learning in genomics',
                  author: 'Zou, J.',
                  year: '2019',
                  source: 'Nature Genetics',
                  formatted: 'Zou, J. et al. (2019). Deep learning in genomics. Nature Genetics.',
                  type: 'journal',
                  tags: [source === 'zotero' ? 'Zotero Sync' : 'Mendeley Sync', 'AI'],
                  readStatus: 'read',
                  isFavorite: true,
                  addedDate: new Date(),
                  pdfUrl: '#'
              },
              {
                  id: `imp-${Date.now()}-2`,
                  raw: '10.1126/science.aar6404',
                  title: 'A general reinforcement learning algorithm that masters chess',
                  author: 'Silver, D.',
                  year: '2018',
                  source: 'Science',
                  formatted: 'Silver, D. (2018). A general reinforcement learning algorithm... Science.',
                  type: 'journal',
                  tags: [source === 'zotero' ? 'Zotero Sync' : 'Mendeley Sync', 'RL'],
                  readStatus: 'unread',
                  isFavorite: false,
                  addedDate: new Date()
              }
          ];
          setItems(prev => [...mockImports, ...prev]);
          setIsParsing(false);
          setShowAddModal(false);
          alert(`Successfully imported 2 references from ${source === 'zotero' ? 'Zotero' : 'Mendeley'}.`);
      }, 1500);
  };

  const handleAddItem = async () => {
    if(!newItemInput) return;
    setIsParsing(true);
    
    try {
        let newItem: LibraryItem | null = null;
        const isDoiInput = newItemInput.match(/^(doi:)?10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/i);
        
        if (addMethod === 'doi' || isDoiInput) {
            // Priority 1: Try CrossRef
            const crData = await CitationService.fetchByDOI(newItemInput);
            if (crData) {
                const authors = crData.author ? crData.author.map(a => `${a.family}, ${a.given?.[0]}.`).join('; ') : 'Unknown Author';
                const year = crData.issued?.['date-parts']?.[0]?.[0]?.toString() || 'n.d.';
                const journal = crData['container-title']?.[0] || crData.publisher || 'Unknown Source';
                const citations = await OpenCitationsService.getCitationCount(newItemInput); // Enrich with citation count

                newItem = {
                    id: Date.now().toString(),
                    raw: newItemInput,
                    title: crData.title?.[0] || 'Unknown Title',
                    author: authors,
                    year: year,
                    source: journal,
                    formatted: `${authors} (${year}). ${crData.title?.[0]}. ${journal}.`,
                    type: 'journal',
                    tags: ['DOI Import', citations > 0 ? `${citations} Citations` : ''],
                    readStatus: 'unread',
                    isFavorite: false,
                    addedDate: new Date(),
                    folderId: activeFolder === 'favorites' || activeFolder === 'reading' || activeFolder === 'all' ? undefined : activeFolder
                };
            } else {
                // Priority 2: Fallback to OpenCitations
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
        }

        if (!newItem && addMethod === 'manual') {
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
        } else if (addMethod === 'doi') {
            alert('Could not resolve reference. Please check the DOI.');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred.');
    } finally {
        setIsParsing(false);
    }
  };

  return (
    <div className="flex h-full animate-fade-in bg-slate-50 relative overflow-hidden" onClick={() => { setActiveItemMenu(null); setOpenCopyMenuId(null); }}>
      
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
                 <button onClick={() => setIsCreatingFolder(true)} className="text-slate-400 hover:text-teal-600"><Plus size={14} /></button>
              </div>
              <div className="space-y-1">
                 {isCreatingFolder && (
                    <div className="px-2 mb-2">
                       <div className="flex items-center gap-1 bg-white border border-teal-500 rounded p-1">
                          <input 
                             autoFocus
                             className="w-full text-sm outline-none bg-transparent"
                             placeholder="Folder Name"
                             value={newFolderName}
                             onChange={(e) => setNewFolderName(e.target.value)}
                             onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') setIsCreatingFolder(false);
                             }}
                          />
                          <button onClick={handleCreateFolder} className="text-teal-600"><Check size={14}/></button>
                       </div>
                    </div>
                 )}
                 {folders.map(folder => (
                   <div key={folder.id} className="relative group">
                       <button 
                         onClick={() => { setActiveFolder(folder.id); setIsMobileSidebarOpen(false); }}
                         className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === folder.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                       >
                         <div className="flex items-center gap-3 truncate max-w-[140px]">
                            <Folder size={16} className={activeFolder === folder.id ? 'fill-slate-400 text-slate-400' : ''} /> 
                            <span className="truncate">{folder.name}</span>
                         </div>
                         <span className="text-xs text-slate-400 group-hover:hidden">{items.filter(i => i.folderId === folder.id).length}</span>
                       </button>
                       <button 
                          onClick={(e) => handleDeleteFolder(folder.id, e)} 
                          className="absolute right-2 top-2 text-slate-400 hover:text-red-500 hidden group-hover:block bg-white/50 rounded"
                       >
                          <Trash2 size={14} />
                       </button>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-slate-200">
           <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
             <div className="flex items-center gap-2 mb-1 font-bold text-slate-700">
                <Sparkles size={12} className="text-teal-500" /> Pro Tip
             </div>
             Connect Zotero or Mendeley in Settings to sync your existing library automatically.
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

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 md:px-6 animate-fade-in-down">
             <div className="flex flex-wrap gap-4 items-center">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Read Status:</span>
                    <select 
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-teal-500"
                      value={filterReadStatus}
                      onChange={(e: any) => setFilterReadStatus(e.target.value)}
                    >
                       <option value="all">All</option>
                       <option value="unread">Unread</option>
                       <option value="reading">Reading</option>
                       <option value="read">Read</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Type:</span>
                    <select 
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-teal-500"
                      value={filterType}
                      onChange={(e: any) => setFilterType(e.target.value)}
                    >
                       <option value="all">All Types</option>
                       <option value="journal">Journal</option>
                       <option value="book">Book</option>
                       <option value="website">Website</option>
                       <option value="report">Report</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                       <input 
                         type="checkbox" 
                         className="rounded text-teal-600 focus:ring-teal-500"
                         checked={filterHasPdf}
                         onChange={(e) => setFilterHasPdf(e.target.checked)}
                       />
                       <span>Has PDF</span>
                    </label>
                 </div>
                 <button onClick={() => { setFilterReadStatus('all'); setFilterType('all'); setFilterHasPdf(false); }} className="text-xs text-slate-400 hover:text-slate-600 underline">Reset</button>
             </div>
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
                           <button 
                             onClick={(e) => { e.stopPropagation(); setActiveItemMenu(activeItemMenu === item.id ? null : item.id); }}
                             className={`p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50 ${activeItemMenu === item.id ? 'bg-slate-100 text-slate-600' : ''}`}
                           >
                              <MoreVertical size={18} />
                           </button>
                           {/* Click Menu */}
                           {activeItemMenu === item.id && (
                             <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-100 rounded-lg shadow-xl py-1 z-20 animate-fade-in-down">
                                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><PenLine size={14}/> Edit</button>
                                
                                {/* Move Submenu Logic */}
                                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Move to Collection</div>
                                <div className="max-h-32 overflow-y-auto">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleMoveItem(item.id, 'all'); }}
                                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2 ${!item.folderId ? 'text-teal-600 font-bold' : 'text-slate-600'}`}
                                    >
                                        <FolderOpen size={14}/> All References
                                    </button>
                                    {folders.map(folder => (
                                        <button 
                                            key={folder.id}
                                            onClick={(e) => { e.stopPropagation(); handleMoveItem(item.id, folder.id); }}
                                            className={`w-full text-left px-4 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2 ${item.folderId === folder.id ? 'text-teal-600 font-bold' : 'text-slate-600'}`}
                                        >
                                            <Folder size={14}/> {folder.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="h-px bg-slate-100 my-1"></div>
                                <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={() => handleViewMetrics(item)}
                        className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1"
                     >
                        <Activity size={12} /> View Details
                     </button>
                     <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenCopyMenuId(openCopyMenuId === item.id ? null : item.id); }}
                          className="text-xs font-medium text-slate-500 hover:text-teal-600 flex items-center gap-1"
                        >
                            <Copy size={12} /> Copy Citation
                        </button>
                        {openCopyMenuId === item.id && (
                            <div className="absolute left-0 bottom-full mb-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                                {['APA 7th', 'MLA 9', 'Harvard', 'Chicago', 'IEEE'].map(style => (
                                    <button 
                                        key={style}
                                        onClick={() => handleCopyCitation(item, style)}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        )}
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                 <h3 className="font-bold text-lg text-slate-800">Add New Reference</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                 {/* Tabs */}
                 <div className="flex gap-4 mb-6 border-b border-slate-100 pb-1 overflow-x-auto no-scrollbar">
                    {['manual', 'doi', 'search', 'import'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => { setAddMethod(tab as any); setSearchResults([]); setNewItemInput(''); }}
                            className={`text-sm font-bold pb-2 border-b-2 transition-colors whitespace-nowrap capitalize ${addMethod === tab ? 'text-teal-600 border-teal-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
                        >
                            {tab === 'manual' ? 'Manual' : tab === 'doi' ? 'Import DOI' : tab === 'search' ? 'Paper Search' : 'Sync Library'}
                        </button>
                    ))}
                 </div>

                 <div className="space-y-4">
                    {addMethod === 'import' ? (
                        <div className="space-y-4">
                            {!isZoteroConnected && !isMendeleyConnected && (
                                <div className="p-4 bg-orange-50 text-orange-700 rounded-lg text-sm mb-4 flex gap-2">
                                    <Globe size={16} className="shrink-0 mt-0.5" />
                                    No libraries connected. Go to Settings > Integrations to connect Zotero or Mendeley.
                                </div>
                            )}
                            {isZoteroConnected && (
                                <button onClick={() => handleImportLibrary('zotero')} className="w-full p-4 border border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded border border-slate-100 group-hover:border-teal-200"><Library size={24} className="text-slate-600 group-hover:text-teal-600"/></div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-800">Sync from Zotero</div>
                                            <div className="text-xs text-slate-500">Import collections</div>
                                        </div>
                                    </div>
                                    <DownloadCloud size={20} className="text-slate-300 group-hover:text-teal-600" />
                                </button>
                            )}
                            {isMendeleyConnected && (
                                <button onClick={() => handleImportLibrary('mendeley')} className="w-full p-4 border border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded border border-slate-100 group-hover:border-red-200"><BookOpen size={24} className="text-slate-600 group-hover:text-red-600"/></div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-800">Sync from Mendeley</div>
                                            <div className="text-xs text-slate-500">Import references</div>
                                        </div>
                                    </div>
                                    <DownloadCloud size={20} className="text-slate-300 group-hover:text-red-600" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">
                               {addMethod === 'doi' ? 'Enter DOI' : addMethod === 'search' ? 'Search Papers' : 'Paste Reference Details'}
                           </label>
                           
                           {addMethod === 'search' && (
                               <div className="flex gap-2 mb-2">
                                   <button 
                                     onClick={() => setSearchProvider('semantic')}
                                     className={`flex-1 text-xs py-1.5 rounded border ${searchProvider === 'semantic' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                   >
                                     Semantic Scholar
                                   </button>
                                   <button 
                                     onClick={() => setSearchProvider('crossref')}
                                     className={`flex-1 text-xs py-1.5 rounded border ${searchProvider === 'crossref' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200'}`}
                                   >
                                     CrossRef
                                   </button>
                                   <button 
                                     onClick={() => setSearchProvider('gemini')}
                                     className={`flex-1 text-xs py-1.5 rounded border ${searchProvider === 'gemini' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                   >
                                     Gemini Web
                                   </button>
                               </div>
                           )}

                           {addMethod === 'search' ? (
                               <div className="flex gap-2">
                                   <input 
                                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                      placeholder="e.g. Deep learning in medical imaging"
                                      value={newItemInput}
                                      onChange={(e) => setNewItemInput(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSearchWeb()}
                                   />
                                   <button 
                                      onClick={handleSearchWeb}
                                      disabled={isParsing || !newItemInput}
                                      className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                                   >
                                      {isParsing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Search size={16} />}
                                   </button>
                               </div>
                           ) : (
                               <textarea 
                                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[100px]"
                                  placeholder={addMethod === 'doi' ? "e.g. 10.1108/jd-12-2013-0166" : "e.g. Smith, J. (2023). The Future of AI. Academic Press."}
                                  value={newItemInput}
                                  onChange={(e) => setNewItemInput(e.target.value)}
                               />
                           )}
                        </div>
                    )}

                    {/* Search Results Area */}
                    {addMethod === 'search' && searchResults.length > 0 && (
                        <div className="mt-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Results ({searchProvider})</h4>
                            {searchResults.map((res: any, i) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between gap-3 group hover:border-teal-300 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-800 text-sm truncate">{res.title?.[0] || res.title}</div>
                                        <div className="text-xs text-slate-500">
                                            {searchProvider === 'semantic' 
                                                ? `${res.authors?.[0]?.name || 'Unknown'} (${res.year})` 
                                                : searchProvider === 'crossref'
                                                ? `${res.author?.[0]?.family || 'Unknown'} (${res.issued?.['date-parts']?.[0]?.[0] || 'n.d.'})`
                                                : `${res.author} (${res.year})`}
                                        </div>
                                        {searchProvider === 'semantic' && res.tldr && (
                                            <div className="text-[10px] text-slate-500 mt-1 italic line-clamp-2">TLDR: {res.tldr.text}</div>
                                        )}
                                        {searchProvider === 'crossref' && res.DOI && (
                                            <div className="text-[10px] text-slate-400 mt-1 font-mono">{res.DOI}</div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleAddSearchResult(res)}
                                        className="self-center px-3 py-1.5 bg-white text-teal-600 border border-teal-200 rounded text-xs font-bold hover:bg-teal-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {addMethod !== 'search' && addMethod !== 'import' && (
                        <div className="pt-2 flex justify-end gap-3">
                           <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                           <button 
                             onClick={handleAddItem}
                             disabled={!newItemInput || isParsing}
                             className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                           >
                             {isParsing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check size={16} />}
                             <span>{addMethod === 'doi' ? 'Search & Add' : 'Add to Library'}</span>
                           </button>
                        </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Details/Metrics Modal */}
      {viewingMetrics && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Activity className="text-teal-600" size={20} /> Paper Insights
                 </h3>
                 <button onClick={() => setViewingMetrics(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                 {loadingMetrics ? (
                     <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                         <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-4"></div>
                         <p className="text-sm">Analyzing via Semantic Scholar...</p>
                     </div>
                 ) : !metricsData ? (
                     <div className="text-center py-10 text-slate-400">
                         <Hash size={40} className="mx-auto mb-2 opacity-30" />
                         <p className="text-sm">Data unavailable for this reference.</p>
                     </div>
                 ) : (
                     <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{viewingMetrics.title}</h4>
                            <p className="text-xs text-slate-500">{viewingMetrics.author} ({viewingMetrics.year})</p>
                            {metricsData.tldr && (
                                <div className="mt-3 text-sm text-slate-700 bg-white p-3 rounded border border-slate-100 italic">
                                    <span className="font-bold not-italic text-slate-900">TL;DR: </span>{metricsData.tldr}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citations</span>
                                    <ArrowUpRight size={16} className="text-teal-500"/>
                                </div>
                                <span className="text-3xl font-bold text-slate-900">{metricsData.incoming}</span>
                                {metricsData.influential > 0 && (
                                    <p className="text-xs text-amber-600 mt-1 font-bold">{metricsData.influential} Highly Influential</p>
                                )}
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source</span>
                                    <Globe size={16} className="text-indigo-500"/>
                                </div>
                                <span className="text-lg font-bold text-slate-900 truncate">{metricsData.source}</span>
                                <p className="text-xs text-slate-400 mt-1">Data Provider</p>
                            </div>
                        </div>

                        {relatedPapers.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                    <Lightbulb size={16} className="text-amber-500" /> Related Papers
                                </h4>
                                <div className="space-y-2">
                                    {relatedPapers.map(paper => (
                                        <div key={paper.paperId} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg hover:border-teal-300 group">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <div className="font-bold text-xs text-slate-800 truncate">{paper.title}</div>
                                                <div className="text-[10px] text-slate-500">{paper.authors?.[0]?.name} • {paper.year}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleAddSearchResult(paper)} 
                                                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-teal-600 hover:text-white transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
