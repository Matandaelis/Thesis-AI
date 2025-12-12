
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { 
  Clock, CheckCircle2, AlertCircle, FileText, Plus, Bell, RefreshCw, 
  ExternalLink, ShieldAlert, Target, Trophy, Edit2, ArrowRight, 
  Sparkles, Zap, BookOpen, Quote, Play, ChevronRight, PenTool
} from 'lucide-react';
import { Document, UniversityUpdate } from '../types';
import { GeminiService } from '../services/geminiService';

interface DashboardProps {
  documents: Document[];
  onOpenDocument: (doc: Document) => void;
}

const activityData = [
  { name: 'Mon', words: 450 },
  { name: 'Tue', words: 1200 },
  { name: 'Wed', words: 800 },
  { name: 'Thu', words: 1500 },
  { name: 'Fri', words: 600 },
  { name: 'Sat', words: 2000 },
  { name: 'Sun', words: 1000 },
];

const THESIS_STAGES = [
  { id: 1, label: 'Proposal', status: 'done' },
  { id: 2, label: 'Literature', status: 'done' },
  { id: 3, label: 'Methodology', status: 'current' },
  { id: 4, label: 'Results', status: 'pending' },
  { id: 5, label: 'Discussion', status: 'pending' },
  { id: 6, label: 'Defense', status: 'pending' },
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

  // Daily Goal State
  const [dailyGoal, setDailyGoal] = useState(500);
  const [todayWords, setTodayWords] = useState(320); 
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Derived Stats
  const activeDoc = documents.length > 0 ? documents[0] : null;
  const goalPercentage = Math.min(100, Math.round((todayWords / dailyGoal) * 100));

  const handleScanUpdates = async () => {
      setIsScanning(true);
      
      const userUniIds = new Set(documents.map(d => d.universityId));
      let universitiesToCheck = Array.from(userUniIds).map(id => UNI_ID_TO_NAME[id as string]).filter(Boolean);

      if (universitiesToCheck.length === 0) {
        universitiesToCheck = ['University of Nairobi', 'Kenyatta University'];
      }
      
      universitiesToCheck = Array.from(new Set(universitiesToCheck));
      const newUpdates: UniversityUpdate[] = [];
      
      try {
        for (const uni of universitiesToCheck) {
            const results = await GeminiService.checkUniversityUpdates(uni);
            newUpdates.push(...results);
        }

        setUpdates(prev => {
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20 space-y-6">
      
      {/* 1. Header & Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-serif">Dashboard</h1>
           <p className="text-slate-500 text-sm">Overview of your academic progress.</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Term</p>
            <p className="text-sm font-bold text-slate-700">Sep 2023 - Dec 2023</p>
        </div>
      </div>

      {/* 2. Hero Section: Recent Work & Daily Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Hero: Resume Writing */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                  <FileText size={180} />
              </div>
              
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-500/30 uppercase tracking-wider">
                          Active Project
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock size={10} /> Last edited {activeDoc?.lastModified ? new Date(activeDoc.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                      </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2 line-clamp-1" title={activeDoc?.title}>
                      {activeDoc?.title || "Start Your First Thesis"}
                  </h2>
                  <p className="text-slate-300 text-sm max-w-md line-clamp-2">
                      {activeDoc ? "You were working on the Methodology section. Continue identifying your research variables." : "Create a new document to begin your research journey."}
                  </p>
              </div>

              <div className="relative z-10 mt-6 flex gap-3">
                  {activeDoc ? (
                      <button 
                        onClick={() => onOpenDocument(activeDoc)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-900/50"
                      >
                          <Edit2 size={16} /> Resume Writing
                      </button>
                  ) : (
                      <button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
                          <Plus size={16} /> Create Document
                      </button>
                  )}
                  <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-sm">
                      <Sparkles size={16} /> AI Critique
                  </button>
              </div>
          </div>

          {/* Daily Goal Widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-slate-800 font-bold text-lg">Daily Goal</h3>
                      <p className="text-slate-500 text-xs">Keep your streak alive!</p>
                  </div>
                  <div className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Zap size={12} fill="currentColor" /> 5 Day Streak
                  </div>
              </div>

              <div className="flex items-center justify-center my-4">
                  <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                          <circle 
                            cx="48" cy="48" r="40" stroke="#0d9488" strokeWidth="8" fill="transparent" 
                            strokeDasharray={251.2} 
                            strokeDashoffset={251.2 - (251.2 * goalPercentage) / 100} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-slate-800">{todayWords}</span>
                          <span className="text-[10px] text-slate-400">/ {dailyGoal}</span>
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                  <button 
                    onClick={() => setIsEditingGoal(!isEditingGoal)}
                    className="text-slate-400 hover:text-teal-600 text-xs font-medium underline decoration-dashed"
                  >
                      Edit Target
                  </button>
                  {isEditingGoal && (
                      <input 
                        type="number" 
                        className="w-16 border rounded px-1 text-xs" 
                        value={dailyGoal} 
                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                        onBlur={() => setIsEditingGoal(false)}
                        autoFocus
                      />
                  )}
                  <span className="text-teal-600 font-bold text-xs">{goalPercentage}% Done</span>
              </div>
          </div>
      </div>

      {/* 3. Thesis Journey & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Journey Roadmap */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Target size={18} className="text-indigo-600" /> Thesis Journey
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Estimated Completion: Dec 15</span>
              </div>
              
              <div className="relative">
                  {/* Connector Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                  <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-1000" style={{width: '40%'}}></div>

                  <div className="relative z-10 flex justify-between">
                      {THESIS_STAGES.map((stage) => (
                          <div key={stage.id} className="flex flex-col items-center gap-2 group cursor-default">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                  stage.status === 'done' ? 'bg-indigo-600 border-indigo-600 text-white' :
                                  stage.status === 'current' ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg scale-110' :
                                  'bg-white border-slate-200 text-slate-300'
                              }`}>
                                  {stage.status === 'done' ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{stage.id}</span>}
                              </div>
                              <span className={`text-xs font-medium transition-colors ${
                                  stage.status === 'current' ? 'text-indigo-700 font-bold' : 
                                  stage.status === 'done' ? 'text-indigo-900' : 'text-slate-400'
                              }`}>
                                  {stage.label}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-sm">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-100 transition-all group">
                      <Quote size={20} className="mb-2 text-slate-400 group-hover:text-teal-600" />
                      <span className="text-[10px] font-bold">New Citation</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-100 transition-all group">
                      <BookOpen size={20} className="mb-2 text-slate-400 group-hover:text-indigo-600" />
                      <span className="text-[10px] font-bold">Search Lit</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-100 transition-all group">
                      <ShieldAlert size={20} className="mb-2 text-slate-400 group-hover:text-rose-600" />
                      <span className="text-[10px] font-bold">Plagiarism</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-slate-100 transition-all group">
                      <Play size={20} className="mb-2 text-slate-400 group-hover:text-amber-600" />
                      <span className="text-[10px] font-bold">Focus Mode</span>
                  </button>
              </div>
          </div>
      </div>

      {/* 4. Analytics & Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">Writing Velocity</h3>
                  <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1 px-2 outline-none text-slate-600">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                  </select>
              </div>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                              itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="words" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* University Updates */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col max-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Bell size={18} className="text-teal-600" /> Updates
                  </h3>
                  <button 
                      onClick={handleScanUpdates} 
                      disabled={isScanning}
                      className={`p-1.5 rounded-lg transition-all ${isScanning ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                  >
                      <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {isScanning && updates.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs">Scanning university portals...</div>
                  )}
                  {updates.map((update) => (
                      <div key={update.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors group">
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                  {update.universityName === 'University of Nairobi' ? 'UON' : update.universityName}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                  {new Date(update.date).toLocaleDateString()}
                              </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-xs mb-1 group-hover:text-teal-700">{update.title}</h4>
                          <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">{update.description}</p>
                          {update.sourceUrl && (
                              <a href={update.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-[9px] text-teal-600 hover:underline font-bold mt-2">
                                  Read More <ExternalLink size={8} className="ml-1" />
                              </a>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* 5. Recent Documents List */}
      <div>
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-lg">Recent Documents</h3>
              <button className="text-sm font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                  View All <ArrowRight size={14} />
              </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-slate-100">
                  {documents.slice(0, 3).map((doc) => (
                      <div 
                          key={doc.id} 
                          onClick={() => onOpenDocument(doc)}
                          className="p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                              <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                  <span>{doc.status}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                  <span>Edited {new Date(doc.lastModified).toLocaleDateString()}</span>
                              </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-4">
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${doc.progress}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 w-8 text-right">{doc.progress}%</span>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600" />
                      </div>
                  ))}
                  {documents.length === 0 && (
                      <div className="p-8 text-center text-slate-400 italic text-sm">
                          No documents yet. Create one to get started!
                      </div>
                  )}
              </div>
          </div>
      </div>

    </div>
  );
};
