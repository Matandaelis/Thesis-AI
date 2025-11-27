import React from 'react';
import { Document } from '../types';
import { FileText, Plus, Clock, MoreVertical } from 'lucide-react';

interface DocumentsListProps {
  documents: Document[];
  onOpenDocument: (doc: Document) => void;
  onCreateNew: () => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ documents, onOpenDocument, onCreateNew }) => {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">My Documents</h1>
          <p className="text-slate-500 mt-1">Manage and organize your thesis drafts.</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>New Document</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
             <div className="bg-slate-100 p-4 rounded-full mb-4">
               <FileText size={48} className="text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">No documents found</h3>
             <p className="text-slate-500 mb-6 max-w-md">Start your journey by creating your first thesis document tailored to your university standards.</p>
             <button onClick={onCreateNew} className="text-teal-600 font-medium hover:underline">Create new document</button>
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
             {documents.map((doc) => (
               <div 
                 key={doc.id}
                 onClick={() => onOpenDocument(doc)}
                 className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors items-center group"
               >
                 <div className="col-span-12 md:col-span-5 flex items-center space-x-3">
                    <div className="bg-teal-100 p-2 rounded text-teal-600">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors truncate">{doc.title}</h3>
                      <p className="text-xs text-slate-500 md:hidden">Edited {doc.lastModified.toLocaleDateString()}</p>
                    </div>
                 </div>
                 
                 <div className="col-span-6 md:col-span-3 flex items-center">
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

                 <div className="col-span-6 md:col-span-3 text-sm text-slate-500 flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{doc.lastModified.toLocaleDateString()}</span>
                 </div>

                 <div className="hidden md:flex col-span-1 justify-end">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full">
                      <MoreVertical size={16} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
