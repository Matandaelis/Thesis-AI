
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocumentsList } from './components/DocumentsList';
import { Editor } from './components/Editor';
import { Templates } from './components/Templates';
import { Marketplace } from './components/Marketplace';
import { Settings } from './components/Settings';
import { Toolkit } from './components/Toolkit';
import { Document, University, View } from './types';
import { Construction, Menu, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [previousView, setPreviousView] = useState<View>(View.DASHBOARD);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [activeUniversity, setActiveUniversity] = useState<University | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock Data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'The Impact of Mobile Lending Apps on Rural Economy',
      universityId: 'uon',
      content: 'Chapter 1: Introduction\n\n1.1 Background of the Study\n\nFinancial inclusion has been a major topic of discussion in developing economies...',
      lastModified: new Date('2023-10-10'),
      status: 'Draft',
      progress: 45
    },
    {
      id: '2',
      title: 'AI Adoption in Kenyan Healthcare Systems',
      universityId: 'strath',
      content: 'Abstract\n\nThis study explores the readiness of Level 5 hospitals in adopting AI-driven diagnostic tools...',
      lastModified: new Date('2023-10-12'),
      status: 'Review',
      progress: 10
    }
  ]);

  const handleOpenDocument = (doc: Document) => {
    setPreviousView(currentView === View.DOCUMENTS ? View.DOCUMENTS : View.DASHBOARD);
    setCurrentDoc(doc);
    // Find associated university mock (simplified logic)
    const uniName = doc.universityId === 'uon' ? 'University of Nairobi' : 'Kenyatta University'; 
    setActiveUniversity({ id: doc.universityId, name: uniName } as University);
    setCurrentView(View.EDITOR);
    setIsSidebarOpen(false);
  };

  const handleCreateDocument = (uni: University) => {
    const newDoc: Document = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Untitled Thesis',
      universityId: uni.id,
      content: `Title Page\n\n[Insert Title]\n\nA Thesis Submitted in Partial Fulfillment for the Degree of Master of Science at ${uni.name}\n\n${new Date().getFullYear()}`,
      lastModified: new Date(),
      status: 'Draft',
      progress: 0
    };
    setDocuments([newDoc, ...documents]);
    setCurrentDoc(newDoc);
    setActiveUniversity(uni);
    setPreviousView(View.DOCUMENTS); // When creating new, going back should generally go to list
    setCurrentView(View.EDITOR);
    setIsSidebarOpen(false);
  };

  const handleSaveDocument = (updatedDoc: Document) => {
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setCurrentDoc(updatedDoc);
  };

  // Simple Placeholder for new features
  const PlaceholderView = ({ title, desc }: { title: string, desc: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-fade-in">
      <div className="bg-slate-100 p-6 rounded-full mb-6">
        <Construction size={48} className="text-slate-300" />
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

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar is always present in DOM but hidden on mobile via CSS unless open */}
      {currentView !== View.EDITOR && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
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

          {/* New Views Placeholders */}
          {currentView === View.RESEARCH && (
             <PlaceholderView 
               title="Research Library" 
               desc="A centralized hub to manage your references, PDFs, and citations across all your thesis projects. Coming soon!" 
             />
          )}
          {currentView === View.CALENDAR && (
             <PlaceholderView 
               title="Thesis Calendar" 
               desc="Track your submission deadlines, supervisor meetings, and writing milestones in one place." 
             />
          )}
          {currentView === View.ANALYTICS && (
             <PlaceholderView 
               title="Writing Analytics" 
               desc="Deep insights into your writing habits, vocabulary usage, and productivity trends." 
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

export default App;
