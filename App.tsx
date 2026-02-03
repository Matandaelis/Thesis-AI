
import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { DocumentsList } from './components/DocumentsList';
import { Editor } from './components/Editor';
import { Templates } from './components/Templates';
import { Marketplace } from './components/Marketplace';
import { Settings } from './components/Settings';
import { Toolkit } from './components/Toolkit';
import { Analytics } from './components/Analytics';
import { ResearchLibrary } from './components/ResearchLibrary';
import { LandingPage } from './components/LandingPage';
import { WebResearch } from './components/WebResearch';
import { VisualizationStudio } from './components/VisualizationStudio';
import { HelpCenter } from './components/HelpCenter';
import { Document, University, View, LibraryItem, LibraryFolder } from './types';
import { Loader2 } from 'lucide-react';
import { dbService } from './services/dbService';
import { GeminiService } from './services/geminiService';
import { KENYAN_UNIVERSITIES } from './lib/constants';

export const App: React.FC = () => {
  const [view, setView] = useState<View>(View.LANDING);
  const [prevView, setPrevView] = useState<View>(View.DASHBOARD);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [activeUniversity, setActiveUniversity] = useState<University | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // App Data State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryFolders, setLibraryFolders] = useState<LibraryFolder[]>([
    { id: 'f1', name: 'Thesis Core', count: 0 },
  ]);

  // Initial Sync
  useEffect(() => {
    const initApp = async () => {
      setApiStatus('checking');
      const conn = await GeminiService.testConnection();
      setApiStatus(conn.success ? 'connected' : 'error');
    };
    initApp();
  }, []);

  // View-based Data Refresher
  const loadData = useCallback(async () => {
    if (view === View.LANDING) return;
    setIsLoading(true);
    try {
      const [docs, library] = await Promise.all([
        dbService.getDocuments(),
        dbService.getLibrary()
      ]);
      setDocuments(docs);
      setLibraryItems(library);
    } catch (e) {
      console.error("Critical Data Fetch Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [view]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleOpenDocument = (doc: Document) => {
    setPrevView(view);
    setCurrentDoc(doc);
    const uni = KENYAN_UNIVERSITIES.find(u => u.id === doc.universityId) || null;
    setActiveUniversity(uni);
    setView(View.EDITOR);
  };

  const handleCreateDocument = async (university: University) => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Chapter',
      content: '',
      universityId: university.id,
      lastModified: new Date(),
      status: 'Draft',
      progress: 0
    };
    await dbService.saveDocument(newDoc);
    handleOpenDocument(newDoc);
  };

  const renderContent = () => {
    if (isLoading && documents.length === 0 && view !== View.LANDING) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Syncing your research...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case View.LANDING: 
        return <LandingPage onGetStarted={() => setView(View.DASHBOARD)} />;
      case View.DASHBOARD: 
        return <Dashboard documents={documents} onOpenDocument={handleOpenDocument} />;
      case View.DOCUMENTS: 
        return <DocumentsList 
          documents={documents} 
          onOpenDocument={handleOpenDocument} 
          onCreateNew={() => setView(View.TEMPLATES)}
          onRename={dbService.renameDocument}
          onDelete={async (id) => { await dbService.deleteDocument(id); loadData(); }}
        />;
      case View.TEMPLATES: 
        return <Templates onSelect={handleCreateDocument} />;
      case View.EDITOR: 
        return currentDoc && (
          <Editor 
            document={currentDoc} 
            university={activeUniversity} 
            onSave={dbService.saveDocument} 
            onBack={() => setView(prevView)} 
          />
        );
      case View.RESEARCH: 
        return <ResearchLibrary items={libraryItems} setItems={setLibraryItems} folders={libraryFolders} setFolders={setLibraryFolders} />;
      case View.WEB_RESEARCH: 
        return <WebResearch />;
      case View.VISUALIZATION: 
        return <VisualizationStudio />;
      case View.TOOLKIT: 
        return <Toolkit />;
      case View.ANALYTICS: 
        return <Analytics documents={documents} />;
      case View.MARKETPLACE: 
        return <Marketplace />;
      case View.SETTINGS: 
        return <Settings onSignOut={() => setView(View.LANDING)} />;
      case View.HELP: 
        return <HelpCenter />;
      default: 
        return <Dashboard documents={documents} onOpenDocument={handleOpenDocument} />;
    }
  };

  return (
    <MainLayout currentView={view} onChangeView={setView} apiStatus={apiStatus}>
      {renderContent()}
    </MainLayout>
  );
};
