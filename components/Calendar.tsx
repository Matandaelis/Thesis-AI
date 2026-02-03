
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock, 
  Flag, AlertCircle, CheckCircle2, Trash2, X, Calendar as CalendarIcon,
  GanttChartSquare, Sparkles, RefreshCw
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { GeminiService } from '../services/geminiService';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'roadmap'>('calendar');
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  
  // Mock initial events
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Chapter 1 Draft Submission',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
      type: 'deadline',
      completed: false,
      time: '23:59',
      description: 'Submit via university portal'
    },
    {
      id: '2',
      title: 'Supervisor Meeting',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 18),
      type: 'meeting',
      completed: false,
      time: '14:00',
      location: 'Zoom',
      description: 'Discuss literature review structure'
    },
    {
      id: '3',
      title: 'Finish Data Collection',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
      type: 'milestone',
      completed: false,
      description: 'Collect all survey responses'
    },
    {
      id: '4',
      title: 'Ethics Approval',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
      type: 'milestone',
      completed: true,
      description: 'Received approval letter'
    }
  ]);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    type: 'deadline',
    time: '09:00',
    description: '',
    location: ''
  });

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleAddEvent = () => {
    if (!newEvent.title) return;
    
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title || 'Untitled Event',
      date: selectedDate,
      type: newEvent.type || 'deadline',
      description: newEvent.description,
      time: newEvent.time,
      location: newEvent.location,
      completed: false
    };

    setEvents([...events, event]);
    setShowAddModal(false);
    setNewEvent({ title: '', type: 'deadline', time: '09:00', description: '', location: '' });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const toggleComplete = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const getEventsForDay = (day: number) => {
    return events.filter(e => 
      e.date.getDate() === day && 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return events
      .filter(e => e.date >= today && !e.completed)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  // Mock Roadmap Data (Usually this would be derived from real user milestones)
  const [roadmapStages, setRoadmapStages] = useState([
      { id: 1, name: 'Proposal Development', start: 0, duration: 20, status: 'completed' },
      { id: 2, name: 'Ethics & Approval', start: 20, duration: 15, status: 'completed' },
      { id: 3, name: 'Data Collection', start: 35, duration: 30, status: 'active' },
      { id: 4, name: 'Data Analysis', start: 65, duration: 25, status: 'pending' },
      { id: 5, name: 'Drafting Chapters', start: 65, duration: 40, status: 'pending' },
      { id: 6, name: 'Final Review & Defense', start: 105, duration: 15, status: 'pending' },
  ]);

  const handleGenerateRoadmap = async () => {
      const topic = prompt("Enter your thesis topic to generate a custom timeline:");
      if (!topic) return;
      
      setIsGeneratingRoadmap(true);
      const newStages = await GeminiService.generateStudySchedule(topic, new Date().toISOString());
      
      if (newStages && newStages.length > 0) {
          setRoadmapStages(newStages);
      } else {
          alert("Failed to generate roadmap. Please try again.");
      }
      setIsGeneratingRoadmap(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-32 bg-zinc-50/50 border-b border-r border-zinc-100"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isSelected = selectedDate.getDate() === day && 
                         selectedDate.getMonth() === currentDate.getMonth() && 
                         selectedDate.getFullYear() === currentDate.getFullYear();
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentDate.getMonth() && 
                      new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(day)}
          className={`h-16 md:h-32 border-b border-r border-zinc-100 p-1 md:p-2 cursor-pointer transition-colors hover:bg-zinc-50 relative group ${isSelected ? 'bg-indigo-50/50' : ''}`}
        >
          <div className="flex justify-between items-start">
             <span className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-zinc-700'}`}>
               {day}
             </span>
          </div>
          
          <div className="mt-1 md:mt-2 space-y-1 hidden md:block overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`text-[10px] px-1.5 py-1 rounded border truncate ${
                  event.type === 'deadline' ? 'bg-red-50 text-red-700 border-red-100' :
                  event.type === 'meeting' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-green-50 text-green-700 border-green-100'
                } ${event.completed ? 'opacity-50 line-through' : ''}`}
              >
                {event.time && <span className="mr-1 font-bold">{event.time}</span>}
                {event.title}
              </div>
            ))}
          </div>
          
          {/* Mobile dots */}
          <div className="md:hidden flex gap-1 mt-1 justify-center flex-wrap">
            {dayEvents.slice(0, 4).map(event => (
              <div 
                 key={event.id}
                 className={`w-1.5 h-1.5 rounded-full ${
                  event.type === 'deadline' ? 'bg-red-500' :
                  event.type === 'meeting' ? 'bg-blue-500' :
                  'bg-green-500'
                 }`}
              />
            ))}
          </div>

          <button 
             onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)); setShowAddModal(true); }}
             className="absolute bottom-1 right-1 md:bottom-2 md:right-2 opacity-0 group-hover:opacity-100 p-1 bg-zinc-200 rounded-full hover:bg-indigo-600 hover:text-white transition-all"
          >
             <Plus size={12} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      );
    }

    return days;
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="flex flex-col md:flex-row h-full animate-fade-in bg-zinc-50 overflow-hidden">
      
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden order-2 md:order-1">
         {/* Toolbar */}
         <div className="h-14 md:h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center space-x-2 md:space-x-4">
               <div className="flex items-center bg-zinc-100 rounded-lg p-1 border border-zinc-200 mr-2 md:mr-4">
                   <button 
                     onClick={() => setViewMode('calendar')}
                     className={`p-1.5 rounded transition-colors ${viewMode === 'calendar' ? 'bg-white shadow text-indigo-700' : 'text-zinc-500 hover:text-zinc-700'}`}
                     title="Month View"
                   >
                       <CalendarIcon size={18} />
                   </button>
                   <button 
                     onClick={() => setViewMode('roadmap')}
                     className={`p-1.5 rounded transition-colors ${viewMode === 'roadmap' ? 'bg-white shadow text-indigo-700' : 'text-zinc-500 hover:text-zinc-700'}`}
                     title="Thesis Roadmap"
                   >
                       <GanttChartSquare size={18} />
                   </button>
               </div>

               <h2 className="text-lg md:text-xl font-bold font-serif text-zinc-900 flex items-center gap-2">
                 {viewMode === 'calendar' ? (
                    <>
                        <span className="md:hidden">{months[currentDate.getMonth()].substring(0,3)} {currentDate.getFullYear()}</span>
                        <span className="hidden md:inline">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    </>
                 ) : (
                    <span>Thesis Roadmap</span>
                 )}
               </h2>
               
               {viewMode === 'calendar' && (
                   <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 md:p-1">
                      <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={16} className="text-zinc-600" /></button>
                      <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-xs font-bold text-zinc-600 hover:text-indigo-600">Today</button>
                      <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={16} className="text-zinc-600" /></button>
                   </div>
               )}
            </div>
            
            {viewMode === 'roadmap' ? (
                <button 
                  onClick={handleGenerateRoadmap}
                  disabled={isGeneratingRoadmap}
                  className="bg-indigo-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isGeneratingRoadmap ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                  <span className="hidden sm:inline">AI Plan</span>
                </button>
            ) : (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-zinc-900 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-zinc-800 flex items-center gap-2 shadow-sm"
                >
                  <Plus size={16} /> <span className="hidden sm:inline">Add Event</span>
                </button>
            )}
         </div>

         {/* Content Grid */}
         <div className="flex-1 overflow-y-auto bg-white">
            {viewMode === 'calendar' ? (
                <>
                    <div className="grid grid-cols-7 border-b border-zinc-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2 text-center text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50 border-r border-zinc-100 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {renderCalendarDays()}
                    </div>
                </>
            ) : (
                <div className="p-6 md:p-8">
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <Flag className="text-blue-600 mt-1" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-800 text-sm">Degree Timeline</h3>
                            <p className="text-xs text-blue-600 mt-1">
                                Visualizing your path from proposal to defense. Ensure "Data Collection" overlaps correctly with "Analysis".
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 relative pl-4 border-l-2 border-zinc-200">
                        {roadmapStages.map((stage: any) => (
                            <div key={stage.id} className="relative pl-6">
                                <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full border-2 ${
                                    stage.status === 'completed' ? 'bg-green-500 border-green-500' :
                                    stage.status === 'active' ? 'bg-white border-indigo-500 animate-pulse' :
                                    'bg-white border-zinc-300'
                                }`}></div>
                                
                                <div className={`p-4 rounded-xl border ${
                                    stage.status === 'active' ? 'bg-white border-indigo-200 shadow-md' : 
                                    stage.status === 'completed' ? 'bg-zinc-50 border-zinc-200 opacity-70' :
                                    'bg-white border-zinc-100'
                                }`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className={`font-bold ${stage.status === 'active' ? 'text-indigo-700' : 'text-zinc-700'}`}>{stage.name}</h4>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                            stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            stage.status === 'active' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-zinc-100 text-zinc-500'
                                        }`}>{stage.status}</span>
                                    </div>
                                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                stage.status === 'completed' ? 'bg-green-500 w-full' :
                                                stage.status === 'active' ? 'bg-indigo-500 w-1/2' :
                                                'w-0'
                                            }`}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-2">Duration: {stage.duration} Days • Start: Day {stage.start}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
         </div>
      </div>

      {/* Right Sidebar Details */}
      <div className="w-full md:w-80 h-1/3 md:h-full bg-white border-t md:border-t-0 md:border-l border-zinc-200 flex flex-col shrink-0 overflow-hidden order-1 md:order-2">
          {/* Selected Date Header */}
          <div className="p-4 md:p-6 border-b border-zinc-100 bg-zinc-50 shrink-0">
             <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
                {selectedDate.toDateString() === new Date().toDateString() && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">TODAY</span>
                )}
             </div>
             <h3 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900">
                {selectedDate.getDate()} {months[selectedDate.getMonth()].substring(0,3)}
             </h3>
          </div>

          {/* Events for Selected Day */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 md:space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-700 text-sm">Schedule</h4>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Add
                </button>
             </div>
             
             {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                <div className="text-center py-4 md:py-8 text-zinc-400">
                   <Clock size={24} className="mx-auto mb-2 opacity-50" />
                   <p className="text-xs md:text-sm">No events scheduled.</p>
                </div>
             ) : (
                getEventsForDay(selectedDate.getDate()).map(event => (
                   <div key={event.id} className="group flex gap-3 items-start p-2.5 md:p-3 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all relative">
                      <div className="mt-1">
                         {event.type === 'meeting' && <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Video size={12} /></div>}
                         {event.type === 'deadline' && <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={12} /></div>}
                         {event.type === 'milestone' && <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><Flag size={12} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h5 className={`text-sm font-bold text-zinc-800 truncate ${event.completed ? 'line-through text-zinc-400' : ''}`}>{event.title}</h5>
                         <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                            {event.time && <span className="flex items-center gap-1"><Clock size={10} /> {event.time}</span>}
                            {event.location && <span className="flex items-center gap-1"><MapPin size={10} /> {event.location}</span>}
                         </div>
                         {event.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-1 md:line-clamp-2">{event.description}</p>}
                      </div>
                      
                      <div className="flex flex-col gap-1 bg-white p-1 rounded shadow-sm border border-zinc-100 md:opacity-0 md:group-hover:opacity-100 md:absolute md:top-2 md:right-2 transition-opacity">
                         <button onClick={() => toggleComplete(event.id)} className="p-1 text-zinc-400 hover:text-green-600">
                            <CheckCircle2 size={14} />
                         </button>
                         <button onClick={() => handleDeleteEvent(event.id)} className="p-1 text-zinc-400 hover:text-red-600">
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>
                ))
             )}
             
             {/* Upcoming Section */}
             <div className="pt-4 md:pt-6 border-t border-zinc-100">
                <h4 className="font-bold text-zinc-700 text-sm mb-3">Upcoming</h4>
                <div className="space-y-2 md:space-y-3">
                   {getUpcomingEvents().map(event => (
                      <div key={event.id} className="flex gap-3 items-center">
                         <div className={`w-1 h-8 rounded-full ${
                             event.type === 'deadline' ? 'bg-red-400' :
                             event.type === 'meeting' ? 'bg-blue-400' : 'bg-green-400'
                         }`}></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-700 truncate">{event.title}</p>
                            <p className="text-[10px] text-zinc-400">{event.date.toLocaleDateString()} • {event.time}</p>
                         </div>
                      </div>
                   ))}
                   {getUpcomingEvents().length === 0 && <p className="text-xs text-zinc-400 italic">No upcoming events.</p>}
                </div>
             </div>
          </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
               <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
                  <h3 className="font-bold text-lg text-zinc-800">Add New Event</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20}/></button>
               </div>
               
               <div className="p-6 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Event Title</label>
                     <input 
                       type="text" 
                       className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="e.g. Thesis Defense"
                       value={newEvent.title}
                       onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                        <select 
                           className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm outline-none"
                           value={newEvent.type}
                           onChange={(e: any) => setNewEvent({...newEvent, type: e.target.value})}
                        >
                           <option value="deadline">Deadline</option>
                           <option value="meeting">Meeting</option>
                           <option value="milestone">Milestone</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Time</label>
                        <input 
                          type="time" 
                          className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm outline-none"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        />
                     </div>
                  </div>

                  {newEvent.type === 'meeting' && (
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Location / Link</label>
                        <input 
                          type="text" 
                          className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm outline-none"
                          placeholder="e.g. Room 304 or Zoom Link"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        />
                     </div>
                  )}

                  <div>
                     <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                     <textarea 
                        className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm outline-none resize-none h-20"
                        placeholder="Add details..."
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                     />
                  </div>
                  
                  <div className="bg-zinc-50 p-3 rounded-lg flex items-center gap-3 text-sm text-zinc-600">
                     <CalendarIcon size={16} />
                     <span>Date: <strong>{selectedDate.toDateString()}</strong></span>
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button 
                       onClick={() => setShowAddModal(false)}
                       className="flex-1 py-2.5 text-zinc-600 font-medium hover:bg-zinc-100 rounded-lg"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleAddEvent}
                       disabled={!newEvent.title}
                       className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                     >
                       Save Event
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};
