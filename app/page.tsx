
'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { DocumentsList } from '../components/DocumentsList';
import { Editor } from '../components/Editor';
import { Templates } from '../components/Templates';
import { Marketplace } from '../components/Marketplace';
import { Settings } from '../components/Settings';
import { Toolkit } from '../components/Toolkit';
import { Analytics } from '../components/Analytics';
import { Pricing } from '../components/Pricing';
import { ResearchLibrary } from '../components/ResearchLibrary';
import { Calendar } from '../components/Calendar';
import { LandingPage } from '../components/LandingPage';
import { JournalMatcher } from '../components/JournalMatcher';
import { HelpCenter } from '../components/HelpCenter';
import { Community } from '../components/Community';
import { Document, University, View, LibraryItem } from '../types';
import { Menu, GraduationCap, Loader2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import { KENYAN_UNIVERSITIES } from '../lib/constants';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [previousView, setPreviousView] = useState<View>(View.DASHBOARD);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [activeUniversity, setActiveUniversity] = useState<University | null>(null);
  const [universities, setUniversities] = useState<University[]>(KENYAN_UNIVERSITIES);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
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
      id: crypto.randomUUID(),
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

  const handleRenameDocument = async (id: string, newTitle: string) => {
    // Optimistic Update
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: newTitle, lastModified: new Date() } : d));
    
    // Persist
    await dbService.renameDocument(id, newTitle);
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
        // Optimistic Update
        setDocuments(prev => prev.filter(d => d.id !== id));
        
        // Persist
        await dbService.deleteDocument(id);
    }
  };

  const handleLibraryUpdate = (newItems: LibraryItem[] | ((prev: LibraryItem[]) => LibraryItem[])) => {
      const resolvedNewItems = typeof newItems === 'function' ? newItems(libraryItems) : newItems;
      const isAdd = resolvedNewItems.length > libraryItems.length;
      const isDelete = resolvedNewItems.length < libraryItems.length;

      if (isAdd) {
         const added = resolvedNewItems.find(n => !libraryItems.some(o => o.id === n.id));
         if (added) dbService.addToLibrary(added);
      } else if (isDelete) {
         const deleted = libraryItems.find(o => !resolvedNewItems.some(n => n.id === o.id));
         if (deleted) dbService.deleteLibraryItem(deleted.id);
      } else {
         resolvedNewItems.forEach(n => {
             const old = libraryItems.find(o => o.id === n.id);
             if (old && (old.readStatus !== n.readStatus || old.isFavorite !== n.isFavorite)) {
                 dbService.updateLibraryItem(n.id, { readStatus: n.readStatus, isFavorite: n.isFavorite });
             }
         });
      }
      setLibraryItems(resolvedNewItems);
  };

  const handleSignOut = () => {
      // Clear sensitive state if needed
      setCurrentDoc(null);
      setCurrentView(View.LANDING);
  };

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
               onRename={handleRenameDocument}
               onDelete={handleDeleteDocument}
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
             <Settings onSignOut={handleSignOut} />
          )}

          {currentView === View.TOOLKIT && (
             <Toolkit />
          )}

          {currentView === View.JOURNAL_MATCHER && (
             <JournalMatcher />
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
                folders={[]} // Pass empty if folders logic is complex, or lift folder state to App
                setFolders={() => {}} 
             />
          )}
          
          {currentView === View.CALENDAR && (
             <Calendar />
          )}

          {currentView === View.HELP && (
             <HelpCenter />
          )}

          {currentView === View.COMMUNITY && (
             <Community />
          )}
        </main>
      </div>
    </div>
  );
}
