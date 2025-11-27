
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Clock, FileText, Activity, Calendar, Award, 
  Zap, BrainCircuit, ArrowUpRight, ArrowDownRight, Target, BookOpen, Sparkles, RefreshCw
} from 'lucide-react';
import { Document } from '../types';
import { GeminiService } from '../services/geminiService';

interface AnalyticsProps {
  documents: Document[];
}

const COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ef4444'];

export const Analytics: React.FC<AnalyticsProps> = ({ documents }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [vocabStats, setVocabStats] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // --- Real-time Calculations ---
  const totalWords = documents.reduce((acc, doc) => {
     const text = doc.content ? doc.content.trim() : '';
     return acc + (text ? text.split(/\s+/).length : 0);
  }, 0);

  const totalReadingTime = Math.ceil(totalWords / 200); // 200 wpm
  const avgProgress = documents.length > 0 
    ? Math.round(documents.reduce((acc, doc) => acc + doc.progress, 0) / documents.length) 
    : 0;
  
  // Calculate dynamic vocab stats on mount or doc change
  useEffect(() => {
    let common = 0;
    let academic = 0;
    let complex = 0;
    let total = 0;

    documents.forEach(doc => {
        const words = doc.content ? doc.content.split(/\s+/) : [];
        words.forEach(w => {
            const len = w.replace(/[^a-zA-Z]/g, '').length;
            if (len > 0) {
                total++;
                if (len <= 4) common++;
                else if (len <= 8) academic++;
                else complex++;
            }
        });
    });

    if (total > 0) {
        setVocabStats([
            { name: 'Common', value: Math.round((common / total) * 100) },
            { name: 'Academic', value: Math.round((academic / total) * 100) },
            { name: 'Complex', value: Math.round((complex / total) * 100) },
        ]);
    } else {
        setVocabStats([
            { name: 'Common', value: 33 },
            { name: 'Academic', value: 33 },
            { name: 'Complex', value: 34 },
        ]);
    }
  }, [documents]);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const summary = documents.map(d => `- ${d.title}: ${d.progress}% complete, ${d.content ? d.content.length : 0} chars`).join('\n');
    const report = await GeminiService.generateAnalyticsReport(summary);
    setAiReport(report);
    setIsGeneratingReport(false);
  };
  
  // Mock Data for Activity (Since we don't store daily history yet)
  const activityData = [
    { day: 'Mon', words: Math.round(totalWords * 0.1), target: 1000 },
    { day: 'Tue', words: Math.round(totalWords * 0.15), target: 1000 },
    { day: 'Wed', words: Math.round(totalWords * 0.3), target: 1000 },
    { day: 'Thu', words: Math.round(totalWords * 0.05), target: 1000 },
    { day: 'Fri', words: Math.round(totalWords * 0.2), target: 1000 },
    { day: 'Sat', words: Math.round(totalWords * 0.4), target: 1500 },
    { day: 'Sun', words: Math.round(totalWords * 0.1), target: 1500 },
  ];

  const projectProgressData = documents.map(doc => ({
    name: doc.title.substring(0, 15) + '...',
    progress: doc.progress,
    words: doc.content ? doc.content.trim().split(/\s+/).length : 0
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Writing Analytics</h1>
          <p className="text-slate-500 mt-1">Track your productivity, vocabulary, and thesis completion metrics.</p>
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
           <button 
             onClick={() => setTimeRange('week')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === 'week' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Last 7 Days
           </button>
           <button 
             onClick={() => setTimeRange('month')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === 'month' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Last 30 Days
           </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                 <FileText size={20} />
              </div>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                 <ArrowUpRight size={12} className="mr-1" /> +12%
              </span>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mb-1">{totalWords.toLocaleString()}</h3>
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Words Written</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                 <Clock size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                 Today
              </span>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mb-1">{Math.floor(totalReadingTime / 60)}h {totalReadingTime % 60}m</h3>
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Estimated Reading Time</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                 <Target size={20} />
              </div>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mb-1">{avgProgress}%</h3>
           <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
              <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${avgProgress}%` }}></div>
           </div>
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-2">Overall Completion</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                 <Zap size={20} />
              </div>
              <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                 Hot Streak
              </span>
           </div>
           <h3 className="text-3xl font-bold text-slate-800 mb-1">5 Days</h3>
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Current Streak</p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Line Chart: Writing Activity */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-teal-600" /> Writing Velocity
               </h3>
               <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-teal-500 mr-1"></div> Words</span>
                  <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-300 mr-1"></div> Target</span>
               </div>
            </div>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="words" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                     <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Pie Chart: Vocabulary */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
               <BookOpen size={18} className="text-indigo-600" /> Vocabulary Mix
            </h3>
            <p className="text-xs text-slate-500 mb-4">Analysis of linguistic complexity in your drafts.</p>
            <div className="flex-1 min-h-[200px] relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={vocabStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {vocabStats.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}}/>
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Stat */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-2xl font-bold text-slate-800">
                     {vocabStats.length > 0 ? vocabStats.find(v => v.name === 'Academic')?.value : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Academic</span>
               </div>
            </div>
         </div>
      </div>

      {/* Bottom Section: Project Breakdown & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Project Progress</h3>
              <div className="space-y-4">
                  {projectProgressData.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No documents available.</p>
                  ) : (
                      projectProgressData.map((doc, idx) => (
                          <div key={idx}>
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="font-medium text-slate-700">{doc.name}</span>
                                  <span className="text-slate-500">{doc.words} words</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-1000" 
                                        style={{ 
                                            width: `${doc.progress}%`,
                                            backgroundColor: COLORS[idx % COLORS.length]
                                        }}
                                      ></div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{doc.progress}%</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          <div className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                  <BrainCircuit size={120} />
              </div>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-yellow-400" /> AI Insights
              </h3>
              
              {!aiReport ? (
                 <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                       <p className="text-xs text-slate-400 text-center italic">Generate a report to see personalized writing patterns and predictions.</p>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-4 relative z-10 animate-fade-in">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                            <TrendingUp size={16} className="text-teal-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Peak Performance</h4>
                            <p className="text-xs text-slate-400 mt-1">{aiReport.peakPerformance}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                            <Award size={16} className="text-yellow-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Academic Tone</h4>
                            <p className="text-xs text-slate-400 mt-1">{aiReport.academicTone}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                            <Target size={16} className="text-rose-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Goal Projection</h4>
                            <p className="text-xs text-slate-400 mt-1">{aiReport.goalProjection}</p>
                        </div>
                    </div>
                 </div>
              )}

              <button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                  {isGeneratingReport ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  <span>{aiReport ? 'Regenerate Report' : 'Generate Full Report'}</span>
              </button>
          </div>
      </div>
    </div>
  );
};
