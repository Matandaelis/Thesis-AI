import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Clock, CheckCircle2, FileText, Plus, Bell, RefreshCw, 
  ExternalLink, Target, Edit2, ArrowRight, 
  Sparkles, Zap, BookOpen, Quote, Play, ChevronRight
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
  const [dailyGoal, setDailyGoal] = useState(500);
  const [todayWords, setTodayWords] = useState(320); 
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const activeDoc = documents.length > 0 ? documents[0] : null;
  const goalPercentage = Math.min(100, Math.round((todayWords / dailyGoal) * 100));

  const handleScanUpdates = async () => {
      setIsScanning(true);
      const userUniIds = new Set(documents.map(d => d.universityId));
      let universitiesToCheck = Array.from(userUniIds).map(id => UNI_ID_TO_NAME[id as string]).filter(Boolean);
      if (universitiesToCheck.length === 0) universitiesToCheck = ['University of Nairobi', 'Kenyatta University'];
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
      } catch (err) {
        console.error("Scan failed", err);
      } finally {
        setIsScanning(false);
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-serif tracking-tight">Academic Overview</h1>
           <p className="text-slate-500 text-sm font-medium">Welcome back, Scholar. You're doing great work.</p>
        </div>
        <div className="text-right hidden md:block bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Term</p>
            <p className="text-sm font-bold text-blue-700">Sep 2023 - Dec 2023</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hero Blue Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden flex flex-col justify-between min-h-[240px] group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:rotate-12 group-hover:scale-110">
                  <FileText size={180} />
              </div>
              
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-widest backdrop-blur-md">
                          Primary Project
                      </span>
                      <span className="text-blue-100 text-xs font-medium flex items-center gap-1.5">
                          <Clock size={12} /> Last edit {activeDoc?.lastModified ? new Date(activeDoc.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                      </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold font-serif mb-3 line-clamp-1 text-white" title={activeDoc?.title}>
                      {activeDoc?.title || "Start Your Thesis"}
                  </h2>
                  <p className="text-blue-100 text-sm max-w-md line-clamp-2 leading-relaxed opacity-90">
                      {activeDoc ? "Pick up where you left off in the Methodology section." : "Your next breakthrough starts here. Create a document to begin."}
                  </p>
              </div>

              <div className="relative z-10 mt-8 flex gap-4">
                  {activeDoc ? (
                      <button 
                        onClick={() => onOpenDocument(activeDoc)}
                        className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                      >
                          <Edit2 size={16} /> Resume Writing
                      </button>
                  ) : (
                      <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-xl hover:scale-105">
                          <Plus size={16} /> New Chapter
                      </button>
                  )}
                  <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-md border border-white/20">
                      <Sparkles size={16} /> AI Assistant
                  </button>
              </div>
          </div>

          {/* Goal Widget */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-slate-900 font-bold text-xl">Daily Goal</h3>
                      <p className="text-slate-500 text-sm font-medium">Writing productivity</p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-100 shadow-sm">
                      <Zap size={14} fill="currentColor" /> 5 Day Streak
                  </div>
              </div>

              <div className="flex items-center justify-center my-6">
                  <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                          <circle 
                            cx="64" cy="64" r="56" stroke="#2563eb" strokeWidth="10" fill="transparent" 
                            strokeDasharray={351.8} 
                            strokeDashoffset={351.8 - (351.8 * goalPercentage) / 100} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-900 tracking-tighter">{todayWords}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">/ {dailyGoal}</span>
                      </div>
                  </div>
              </div>

              <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setIsEditingGoal(!isEditingGoal)}
                    className="text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors"
                  >
                      Set Target
                  </button>
                  {isEditingGoal && (
                      <input 
                        type="number" 
                        className="w-16 border rounded px-1 text-xs outline-none focus:ring-1 focus:ring-blue-500" 
                        value={dailyGoal} 
                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                        onBlur={() => setIsEditingGoal(false)}
                        autoFocus
                      />
                  )}
                  <span className="text-blue-600 font-black text-sm">{goalPercentage}%</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Journey Roadmap */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-3">
                      <Target size={22} className="text-blue-600" /> Milestone Tracking
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">Est. Completion: Dec 15</span>
              </div>
              
              <div className="relative pb-4">
                  <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 h-2 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-1000 rounded-full shadow-lg shadow-blue-600/30" style={{width: '40%'}}></div>

                  <div className="relative z-10 flex justify-between">
                      {THESIS_STAGES.map((stage) => (
                          <div key={stage.id} className="flex flex-col items-center gap-3 group cursor-default">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                  stage.status === 'done' ? 'bg-blue-600 border-blue-600 text-white' :
                                  stage.status === 'current' ? 'bg-white border-blue-600 text-blue-600 shadow-xl scale-110' :
                                  'bg-white border-slate-200 text-slate-300'
                              }`}>
                                  {stage.status === 'done' ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{stage.id}</span>}
                              </div>
                              <span className={`text-[10px] uppercase tracking-wider transition-colors ${
                                  stage.status === 'current' ? 'text-blue-700 font-black' : 
                                  stage.status === 'done' ? 'text-slate-900 font-bold' : 
                                  'text-slate-400 font-medium'
                              }`}>
                                  {stage.label}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 text-sm uppercase tracking-widest">Toolkit</h3>
              <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50/30 hover:bg-blue-600 hover:text-white border border-blue-100/50 transition-all group">
                      <Quote size={20} className="mb-2 text-blue-600 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold">Citation</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-sky-50/30 hover:bg-sky-500 hover:text-white border border-sky-100/50 transition-all group">
                      <BookOpen size={20} className="mb-2 text-sky-600 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold">Research</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-100 transition-all group">
                      <Play size={20} className="mb-2 text-slate-400 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold">Focus</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-100 transition-all group">
                      <RefreshCw size={20} className="mb-2 text-slate-400 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold">Resync</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-slate-900 text-lg">Velocity Analytics</h3>
                  <select className="bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase py-2 px-3 outline-none text-slate-600 focus:border-blue-500 transition-colors">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                  </select>
              </div>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                              itemStyle={{ color: '#2563eb', fontSize: '12px', fontWeight: '800' }}
                          />
                          <Area type="monotone" dataKey="words" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorWords)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* University Updates */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-3">
                      <Bell size={20} className="text-blue-600" /> Notifications
                  </h3>
                  <button 
                      onClick={handleScanUpdates} 
                      disabled={isScanning}
                      className={`p-2 rounded-xl transition-all ${isScanning ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                      <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                  {updates.map((update) => (
                      <div key={update.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-300 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">
                                  {update.universityName === 'University of Nairobi' ? 'UON' : update.universityName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                  {new Date(update.date).toLocaleDateString()}
                              </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs mb-1.5 group-hover:text-blue-700 transition-colors leading-tight">{update.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{update.description}</p>
                          {update.sourceUrl && (
                              <a href={update.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-[8px] text-blue-600 hover:underline font-black mt-3 uppercase tracking-tighter">
                                  View Bulletin <ExternalLink size={10} className="ml-1" />
                              </a>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};