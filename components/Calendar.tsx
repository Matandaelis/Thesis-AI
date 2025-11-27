
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock, 
  Flag, AlertCircle, CheckCircle2, Trash2, X, Calendar as CalendarIcon,
  MoreVertical
} from 'lucide-react';
import { CalendarEvent } from '../types';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  
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

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 border-b border-r border-slate-100"></div>);
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
          className={`h-24 md:h-32 border-b border-r border-slate-100 p-2 cursor-pointer transition-colors hover:bg-slate-50 relative group ${isSelected ? 'bg-teal-50/50' : ''}`}
        >
          <div className="flex justify-between items-start">
             <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-teal-600 text-white' : 'text-slate-700'}`}>
               {day}
             </span>
             {dayEvents.length > 0 && (
               <span className="md:hidden w-2 h-2 rounded-full bg-teal-500"></span>
             )}
          </div>
          
          <div className="mt-2 space-y-1 hidden md:block overflow-y-auto max-h-[80px] custom-scrollbar">
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
          <div className="md:hidden flex gap-1 mt-1 justify-center">
            {dayEvents.slice(0, 3).map(event => (
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
             className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-200 rounded-full hover:bg-teal-600 hover:text-white transition-all"
          >
             <Plus size={14} />
          </button>
        </div>
      );
    }

    return days;
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="flex h-full animate-fade-in bg-slate-50 overflow-hidden">
      
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         {/* Toolbar */}
         <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-4">
               <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                 <CalendarIcon className="text-teal-600" size={24} />
                 {months[currentDate.getMonth()]} {currentDate.getFullYear()}
               </h2>
               <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={18} className="text-slate-600" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-teal-600">Today</button>
                  <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={18} className="text-slate-600" /></button>
               </div>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} /> Add Event
            </button>
         </div>

         {/* Calendar Grid */}
         <div className="flex-1 overflow-y-auto bg-white">
            <div className="grid grid-cols-7 border-b border-slate-200">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-r border-slate-100 last:border-r-0">
                     {day}
                  </div>
               ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
               {renderCalendarDays()}
            </div>
         </div>
      </div>

      {/* Right Sidebar Details */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
          {/* Selected Date Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50">
             <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
                {selectedDate.toDateString() === new Date().toDateString() && (
                    <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">TODAY</span>
                )}
             </div>
             <h3 className="text-3xl font-serif font-bold text-slate-900">
                {selectedDate.getDate()} {months[selectedDate.getMonth()].substring(0,3)}
             </h3>
          </div>

          {/* Events for Selected Day */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-700 text-sm">Schedule</h4>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                >
                  + Add
                </button>
             </div>
             
             {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                   <Clock size={32} className="mx-auto mb-2 opacity-50" />
                   <p className="text-sm">No events scheduled.</p>
                   <p className="text-xs">Enjoy your free time!</p>
                </div>
             ) : (
                getEventsForDay(selectedDate.getDate()).map(event => (
                   <div key={event.id} className="group flex gap-3 items-start p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all relative">
                      <div className="mt-1">
                         {event.type === 'meeting' && <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Video size={14} /></div>}
                         {event.type === 'deadline' && <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={14} /></div>}
                         {event.type === 'milestone' && <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><Flag size={14} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h5 className={`text-sm font-bold text-slate-800 truncate ${event.completed ? 'line-through text-slate-400' : ''}`}>{event.title}</h5>
                         <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {event.time && <span className="flex items-center gap-1"><Clock size={10} /> {event.time}</span>}
                            {event.location && <span className="flex items-center gap-1"><MapPin size={10} /> {event.location}</span>}
                         </div>
                         {event.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>}
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex flex-col gap-1 bg-white p-1 rounded shadow-sm border border-slate-100">
                         <button onClick={() => toggleComplete(event.id)} className="p-1 text-slate-400 hover:text-green-600">
                            <CheckCircle2 size={14} />
                         </button>
                         <button onClick={() => handleDeleteEvent(event.id)} className="p-1 text-slate-400 hover:text-red-600">
                            <Trash2 size={14} />
                         </button>
                      </div>
                   </div>
                ))
             )}
             
             {/* Upcoming Section */}
             <div className="pt-6 border-t border-slate-100">
                <h4 className="font-bold text-slate-700 text-sm mb-3">Upcoming Milestones</h4>
                <div className="space-y-3">
                   {getUpcomingEvents().map(event => (
                      <div key={event.id} className="flex gap-3 items-center">
                         <div className={`w-1 h-8 rounded-full ${
                             event.type === 'deadline' ? 'bg-red-400' :
                             event.type === 'meeting' ? 'bg-blue-400' : 'bg-green-400'
                         }`}></div>
                         <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">{event.title}</p>
                            <p className="text-[10px] text-slate-400">{event.date.toLocaleDateString()} • {event.time}</p>
                         </div>
                      </div>
                   ))}
                   {getUpcomingEvents().length === 0 && <p className="text-xs text-slate-400 italic">No upcoming events.</p>}
                </div>
             </div>
          </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
               <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-800">Add New Event</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
               </div>
               
               <div className="p-6 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                     <input 
                       type="text" 
                       className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                       placeholder="e.g. Thesis Defense"
                       value={newEvent.title}
                       onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                        <select 
                           className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none"
                           value={newEvent.type}
                           onChange={(e: any) => setNewEvent({...newEvent, type: e.target.value})}
                        >
                           <option value="deadline">Deadline</option>
                           <option value="meeting">Meeting</option>
                           <option value="milestone">Milestone</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                        <input 
                          type="time" 
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        />
                     </div>
                  </div>

                  {newEvent.type === 'meeting' && (
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / Link</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none"
                          placeholder="e.g. Room 304 or Zoom Link"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        />
                     </div>
                  )}

                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                     <textarea 
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none resize-none h-20"
                        placeholder="Add details..."
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                     />
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 text-sm text-slate-600">
                     <CalendarIcon size={16} />
                     <span>Date: <strong>{selectedDate.toDateString()}</strong></span>
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button 
                       onClick={() => setShowAddModal(false)}
                       className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleAddEvent}
                       disabled={!newEvent.title}
                       className="flex-1 py-2.5 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50"
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
