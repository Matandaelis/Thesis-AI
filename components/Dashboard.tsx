
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Clock, CheckCircle, AlertCircle, FileText, Plus, Bell, RefreshCw, ExternalLink, ShieldAlert } from 'lucide-react';
import { Document, UniversityUpdate } from '../types';
import { GeminiService } from '../services/geminiService';

interface DashboardProps {
  documents: Document[];
  onOpenDocument: (doc: Document) => void;
}

const data = [
  { name: 'Mon', hours: 2 },
  { name: 'Tue', hours: 4 },
  { name: 'Wed', hours: 3 },
  { name: 'Thu', hours: 5 },
  { name: 'Fri', hours: 2 },
  { name: 'Sat', hours: 6 },
  { name: 'Sun', hours: 4 },
];

const UNI_ID_TO_NAME: Record<string, string> = {
  'uon': 'University of Nairobi',
  'ku': 'Kenyatta University',
  'strath': 'Strathmore University',
  'jkuat': 'JKUAT',
};

export const Dashboard: React.FC<DashboardProps> = ({ documents, onOpenDocument }) => {
  const [updates, setUpdates] = useState<UniversityUpdate[]>([
    {
      id: '1',
      universityId: 'uon',
      universityName: 'University of Nairobi',
      date: new Date('2023-10-01'),
      title: 'Formatting Guideline Update',
      description: 'The Graduate School has updated the margin requirements to 2.5cm on all sides for 2024 theses.',
      type: 'formatting'
    },
    {
      id: '2',
      universityId: 'ku',
      universityName: 'Kenyatta University',
      date: new Date('2023-09-15'),
      title: 'Digital Submission Portal',
      description: 'All final thesis submissions must now be done via the new tracking system by Nov 30th.',
      type: 'policy'
    }
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Date | null>(null);

  // Simple calculated stats
  const completedDocs = documents.filter(d => d.status === 'Completed').length;
  const inProgressDocs = documents.filter(d => d.status !== 'Completed').length;
  const avgProgress = documents.length > 0 
    ? Math.round(documents.reduce((acc, doc) => acc + doc.progress, 0) / documents.length) 
    : 0;

  const handleScanUpdates = async () => {
      setIsScanning(true);
      
      // Identify relevant universities from user's active documents
      const userUniIds = new Set(documents.map(d => d.universityId));
      let universitiesToCheck = Array.from(userUniIds).map(id => UNI_ID_TO_NAME[id as string]).filter(Boolean);

      // Default if no documents
      if (universitiesToCheck.length === 0) {
        universitiesToCheck = ['University of Nairobi', 'Kenyatta University'];
      }
      
      // Dedup
      universitiesToCheck = Array.from(new Set(universitiesToCheck));
      
      const newUpdates: UniversityUpdate[] = [];
      
      try {
        for (const uni of universitiesToCheck) {
            const results = await GeminiService.checkUniversityUpdates(uni);
            newUpdates.push(...results);
        }

        setUpdates(prev => {
            // Merge and remove duplicates based on title + uni
            const combined = [...newUpdates, ...prev];
            const unique = combined.filter((update, index, self) =>
                index === self.findIndex((u) => (
                    u.title === update.title && u.universityId === update.universityId
                ))
            );
            return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        setLastScanned(new Date());
      } catch (err) {
        console.error("Scan failed", err);
      } finally {
        setIsScanning(false);
      }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-serif">Welcome back, Edwin</h1>
           <p className="text-slate-500 mt-2">You have {inProgressDocs} active thesis documents.</p>
        </div>
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full md:w-auto justify-center">
            <Plus size={20} />
            <span>New Task</span>
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Projects</p>
            <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Avg. Completion</p>
            <p className="text-2xl font-bold text-slate-900">{avgProgress}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Next Deadline</p>
            <p className="text-2xl font-bold text-slate-900">Oct 14</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Chart + Docs) */}
        <div className="lg:col-span-2 space-y-8">
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Writing Activity</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="hours" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Recent Documents</h3>
                    <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">View All</button>
                </div>
                <div className="space-y-3">
                    {documents.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No documents yet. Start writing!</p>
                    ) : (
                        documents.slice(0, 4).map((doc) => (
                        <div 
                            key={doc.id} 
                            onClick={() => onOpenDocument(doc)}
                            className="group p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50 cursor-pointer transition-all flex items-start space-x-3"
                        >
                            <FileText className="text-slate-400 group-hover:text-teal-500 mt-1" size={20} />
                            <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 group-hover:text-teal-700 text-sm truncate">{doc.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{doc.progress}% Complete • {doc.lastModified.toLocaleDateString()}</p>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* Right Column (Updates) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
            {/* Realtime Pulse Indicator */}
            {isScanning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500 animate-pulse z-10"></div>
            )}
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Bell size={18} className="text-teal-600" /> University Updates
                    </h3>
                    {lastScanned && (
                        <p className="text-[10px] text-slate-400 mt-1">
                            Live Check: {lastScanned.toLocaleTimeString()}
                        </p>
                    )}
                </div>
                <button 
                    onClick={handleScanUpdates} 
                    disabled={isScanning}
                    className={`p-2 rounded-full transition-all ${isScanning ? 'bg-teal-50 text-teal-600' : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'}`}
                    title="Scan for latest updates"
                >
                    <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {isScanning && updates.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                       <RefreshCw className="animate-spin" size={24} />
                       <span className="text-xs">Connecting to University Portals...</span>
                   </div>
                )}
                
                {!isScanning && updates.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                        <ShieldAlert size={24} />
                        <span className="text-xs">No updates found. You're up to date!</span>
                    </div>
                )}

                {updates.map((update) => (
                    <div key={update.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                                {update.universityName}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                update.type === 'deadline' ? 'bg-red-100 text-red-600' :
                                update.type === 'formatting' ? 'bg-blue-100 text-blue-600' :
                                'bg-teal-100 text-teal-600'
                            }`}>
                                {update.type}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-teal-700 transition-colors">{update.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">{update.description}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                            <span className="text-[10px] text-slate-400">Detected: {new Date(update.date).toLocaleDateString()}</span>
                            {update.sourceUrl && (
                                <a href={update.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-[10px] text-teal-600 hover:underline font-medium">
                                    Verify Source <ExternalLink size={10} className="ml-1" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 border border-dashed border-slate-300 rounded hover:bg-slate-50 transition-colors">
                    View Compliance History
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
