
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocumentsList } from './components/DocumentsList';
import { Editor } from './components/Editor';
import { Templates } from './components/Templates';
import { Marketplace } from './components/Marketplace';
import { Settings } from './components/Settings';
import { Toolkit } from './components/Toolkit';
import { Analytics } from './components/Analytics';
import { Pricing } from './components/Pricing';
import { ResearchLibrary } from './components/ResearchLibrary';
import { Calendar } from './components/Calendar';
import { LandingPage } from './components/LandingPage';
import { Document, University, View, LibraryItem, LibraryFolder } from './types';
import { Construction, Menu, GraduationCap, LifeBuoy, Loader2 } from 'lucide-react';
import { dbService } from './services/dbService';
import { KENYAN_UNIVERSITIES } from './lib/constants';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [previousView, setPreviousView] = useState<View>(View.DASHBOARD);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [activeUniversity, setActiveUniversity] = useState<University | null>(null);
  const [universities, setUniversities] = useState<University[]>(KENYAN_UNIVERSITIES);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryFolders, setLibraryFolders] = useState<LibraryFolder[]>([
    { id: 'f1', name: 'Thesis Chapter 1', count: 0 },
    { id: 'f2', name: 'Methodology', count: 0 },
    { id: 'f3', name: 'AI Ethics', count: 0 },
  ]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Load Data from Supabase on Mount
  useEffect(() => {
    if (currentView !== View.LANDING) {
      loadData();
    }
  }, [currentView]);

  const loadData = async () => {
    // Only show loader if we have no data yet
    if (documents.length === 0) setIsLoading(true);
    
    try {
      const [docs, items] = await Promise.all([
        dbService.getDocuments(),
        dbService.getLibrary()
      ]);
      setDocuments(docs);
      setLibraryItems(items);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocument = (doc: Document) => {
    setPreviousView(currentView === View.DOCUMENTS ? View.DOCUMENTS : View.DASHBOARD);
    setCurrentDoc(doc);
    
    // Find associated university from state to ensure standards exist (supports custom unis)
    const uni = universities.find(u => u.id === doc.universityId) || universities[0];
    
    setActiveUniversity(uni);
    setCurrentView(View.EDITOR);
    setIsSidebarOpen(false);
  };

  const handleCreateDocument = async (uni: University) => {
    if (!universities.find(u => u.id === uni.id)) {
        setUniversities(prev => [...prev, uni]);
    }

    const newDoc: Document = {
      id: crypto.randomUUID(), // Use standard UUID
      title: 'Untitled Thesis',
      universityId: uni.id,
      content: `<h1>Title Page</h1><p>[Insert Title]</p><p>A Thesis Submitted in Partial Fulfillment for the Degree of Master of Science at ${uni.name}</p><p>${new Date().getFullYear()}</p>`,
      lastModified: new Date(),
      status: 'Draft',
      progress: 0
    };

    // Optimistic UI update
    setDocuments([newDoc, ...documents]);
    setCurrentDoc(newDoc);
    setActiveUniversity(uni);
    setPreviousView(View.DOCUMENTS); 
    setCurrentView(View.EDITOR);
    setIsSidebarOpen(false);

    // Persist to DB
    await dbService.saveDocument(newDoc);
  };

  const handleSaveDocument = async (updatedDoc: Document) => {
    // Optimistic Update
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setCurrentDoc(updatedDoc);
    
    // Persist
    await dbService.saveDocument(updatedDoc);
  };

  // Wrapper for Library Updates to ensure persistence
  const handleLibraryUpdate = (newItems: LibraryItem[] | ((prev: LibraryItem[]) => LibraryItem[])) => {
      // Resolve functional state update if necessary
      const resolvedNewItems = typeof newItems === 'function' ? newItems(libraryItems) : newItems;
      
      // Determine diff (Naive approach: check length or ids)
      // For simplicity in this demo: 
      // 1. If length increased, we added something.
      // 2. If length decreased, we deleted.
      // 3. Otherwise we likely updated a status.
      
      const isAdd = resolvedNewItems.length > libraryItems.length;
      const isDelete = resolvedNewItems.length < libraryItems.length;

      if (isAdd) {
         // Find the new item
         const added = resolvedNewItems.find(n => !libraryItems.some(o => o.id === n.id));
         if (added) dbService.addToLibrary(added);
      } else if (isDelete) {
         const deleted = libraryItems.find(o => !resolvedNewItems.some(n => n.id === o.id));
         if (deleted) dbService.deleteLibraryItem(deleted.id);
      } else {
         // Update - Find changed item (usually just read status or favorite)
         resolvedNewItems.forEach(n => {
             const old = libraryItems.find(o => o.id === n.id);
             if (old && (old.readStatus !== n.readStatus || old.isFavorite !== n.isFavorite)) {
                 dbService.updateLibraryItem(n.id, { readStatus: n.readStatus, isFavorite: n.isFavorite });
             }
         });
      }

      setLibraryItems(resolvedNewItems);
  };

  // Simple Placeholder for new features
  const PlaceholderView = ({ title, desc }: { title: string, desc: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-fade-in">
      <div className="bg-slate-100 p-6 rounded-full mb-6">
        {title === "Help Center" ? <LifeBuoy size={48} className="text-slate-300" /> : <Construction size={48} className="text-slate-300" />}
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="max-w-md">{desc}</p>
      <button 
        onClick={() => setCurrentView(View.DASHBOARD)}
        className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );

  // If in Landing View, render just the landing page
  if (currentView === View.LANDING) {
    return <LandingPage onGetStarted={() => setCurrentView(View.DASHBOARD)} />;
  }

  if (isLoading && documents.length === 0) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-teal-600" size={32} />
                  <p className="text-sm font-medium text-slate-500">Loading your thesis...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {currentView !== View.EDITOR && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentView !== View.EDITOR && (
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-30 shrink-0">
             <div className="flex items-center gap-2">
                <div className="bg-teal-500 p-1.5 rounded-lg text-white">
                    <GraduationCap size={20} />
                </div>
                <span className="font-bold font-serif text-lg text-slate-800">ThesisAI</span>
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1">
                <Menu size={24} />
             </button>
          </header>
        )}

        <main className="flex-1 overflow-auto relative">
          {currentView === View.DASHBOARD && (
            <Dashboard documents={documents} onOpenDocument={handleOpenDocument} />
          )}

          {currentView === View.DOCUMENTS && (
            <DocumentsList 
               documents={documents} 
               onOpenDocument={handleOpenDocument}
               onCreateNew={() => setCurrentView(View.TEMPLATES)}
            />
          )}

          {currentView === View.TEMPLATES && (
            <Templates onSelect={handleCreateDocument} />
          )}

          {currentView === View.EDITOR && currentDoc && (
            <Editor 
              document={currentDoc} 
              university={activeUniversity} 
              onSave={handleSaveDocument}
              onBack={() => setCurrentView(previousView)}
              libraryItems={libraryItems}
              onAddToLibrary={handleLibraryUpdate}
            />
          )}

          {currentView === View.MARKETPLACE && (
            <Marketplace />
          )}
          
          {currentView === View.SETTINGS && (
             <Settings />
          )}

          {currentView === View.TOOLKIT && (
             <Toolkit />
          )}

          {currentView === View.ANALYTICS && (
             <Analytics documents={documents} />
          )}
          
          {currentView === View.PRICING && (
             <Pricing />
          )}

          {currentView === View.RESEARCH && (
             <ResearchLibrary 
                items={libraryItems}
                setItems={handleLibraryUpdate}
                folders={libraryFolders}
                setFolders={setLibraryFolders}
             />
          )}
          
          {currentView === View.CALENDAR && (
             <Calendar />
          )}

          {currentView === View.HELP && (
             <PlaceholderView 
               title="Help Center" 
               desc="Documentation, video tutorials, and support contact details." 
             />
          )}

          {currentView === View.COMMUNITY && (
             <PlaceholderView 
               title="Scholar Community" 
               desc="Connect with other researchers, share drafts for peer review, and find study partners." 
             />
          )}
        </main>
      </div>
    </div>
  );
};
