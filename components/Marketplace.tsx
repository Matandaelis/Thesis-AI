
import React, { useState } from 'react';
import { Star, Clock, Check, X, Filter, Circle } from 'lucide-react';

const services = [
  {
    id: 1,
    title: 'Professional Proofreading',
    provider: 'Dr. Sarah K.',
    rating: 4.9,
    reviews: 120,
    price: 'KES 200/page',
    desc: 'Deep grammatical check and flow correction by a linguistics PhD.',
    tags: ['Grammar', 'Flow'],
    online: true
  },
  {
    id: 2,
    title: 'Statistical Analysis (SPSS)',
    provider: 'Data Wizards Kenya',
    rating: 4.7,
    reviews: 85,
    price: 'KES 5,000/task',
    desc: 'Complete Chapter 4 analysis including graphs, tables and interpretation.',
    tags: ['Data', 'Charts'],
    online: false
  },
  {
    id: 3,
    title: 'Plagiarism Removal',
    provider: 'Academic Cleanse',
    rating: 4.8,
    reviews: 200,
    price: 'KES 150/page',
    desc: 'Paraphrasing services to reduce Turnitin score below 15%.',
    tags: ['Turnitin', 'Rewriting'],
    online: true
  },
  {
    id: 4,
    title: 'Qualitative Coding (NVivo)',
    provider: 'QualiInsights',
    rating: 4.9,
    reviews: 45,
    price: 'KES 4,500/hr',
    desc: 'Expert coding of interview transcripts using NVivo or Atlas.ti with thematic analysis.',
    tags: ['Qualitative', 'Coding'],
    online: true
  },
  {
    id: 5,
    title: 'Grant Proposal Writing',
    provider: 'Prof. Omondi',
    rating: 5.0,
    reviews: 32,
    price: 'KES 10,000',
    desc: 'Turn your thesis concept into a winning grant proposal for NACOSTI or international funding.',
    tags: ['Funding', 'Grants'],
    online: false
  },
  {
    id: 6,
    title: 'Viva Defense Coaching',
    provider: 'Thesis Coach KE',
    rating: 4.8,
    reviews: 67,
    price: 'KES 3,000/session',
    desc: '1-on-1 mock defense sessions with Q&A prep to build confidence for your oral examination.',
    tags: ['Coaching', 'Defense'],
    online: true
  },
  {
    id: 7,
    title: 'Literature Review Specialist',
    provider: 'Research Nexus',
    rating: 4.6,
    reviews: 90,
    price: 'KES 500/page',
    desc: 'Comprehensive search and synthesis of the latest journals (2020-2024) relevant to your topic.',
    tags: ['Research', 'Literature'],
    online: false
  },
  {
    id: 8,
    title: 'Formatting & Layout',
    provider: 'Format Pro',
    rating: 4.9,
    reviews: 150,
    price: 'KES 1,500',
    desc: 'Perfect adherence to specific university guidelines (UoN, KU, Strathmore, etc.) including TOC and margins.',
    tags: ['Formatting', 'Layout'],
    online: true
  },
  {
    id: 9,
    title: 'Academic Translation',
    provider: 'Lingua East Africa',
    rating: 4.7,
    reviews: 28,
    price: 'KES 400/page',
    desc: 'Professional translation of research instruments or manuscripts (English <-> Swahili).',
    tags: ['Translation', 'Language'],
    online: false
  },
  {
    id: 10,
    title: 'Mobile Data Collection Setup',
    provider: 'Field Ready KE',
    rating: 4.8,
    reviews: 55,
    price: 'KES 3,000',
    desc: 'Digitization of questionnaires into ODK, KoboToolbox, or SurveyCTO for field data collection.',
    tags: ['Data', 'Fieldwork'],
    online: true
  },
  {
    id: 11,
    title: 'Audio Transcription',
    provider: 'Sauti Safi Transcripts',
    rating: 4.9,
    reviews: 112,
    price: 'KES 50/min',
    desc: 'Accurate verbatim transcription of interviews and focus groups. Swahili, English & Sheng supported.',
    tags: ['Qualitative', 'Transcription'],
    online: true
  },
  {
    id: 12,
    title: 'Concept Paper Review',
    provider: 'Scholarly KE',
    rating: 4.7,
    reviews: 40,
    price: 'KES 2,500',
    desc: 'Expert review of your initial concept paper to ensure alignment with department research thrusts.',
    tags: ['Writing', 'Concept'],
    online: false
  }
];

export const Marketplace: React.FC = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Data', 'Writing', 'Coaching', 'Formatting'];

  const handleBook = () => {
    setIsBooked(true);
    setTimeout(() => {
        setSelectedService(null);
        setIsBooked(false);
        alert("Booking request sent! The expert will contact you shortly.");
    }, 1500);
  };

  const filteredServices = filter === 'All' 
    ? services 
    : services.filter(s => s.tags.some(t => t.includes(filter) || (filter === 'Writing' && (t === 'Grammar' || t === 'Rewriting' || t === 'Literature' || t === 'Concept'))));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in relative pb-20">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h1 className="text-3xl font-bold font-serif text-slate-900">Expert Services</h1>
           <p className="text-slate-600 mt-2">On-demand professionals for every stage of your thesis.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto text-center md:text-left flex flex-col md:block">
            <span className="text-sm font-medium text-slate-600">Your Balance: </span>
            <span className="text-lg font-bold text-teal-700">KES 4,500</span>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
        {categories.map(cat => (
            <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === cat ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
                {cat}
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full group">
            <div className="h-32 bg-slate-800 relative overflow-hidden">
               <img src={`https://picsum.photos/400/200?random=${service.id + 10}`} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt="Service" />
               {(service.rating >= 4.9) && (
                   <div className="absolute bottom-3 left-4">
                      <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wide shadow-sm">Top Rated</span>
                   </div>
               )}
               {service.online && (
                   <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-green-700 uppercase">Online</span>
                   </div>
               )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{service.title}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide flex items-center gap-2">
                    {service.provider}
                </p>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{service.desc}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {service.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] uppercase font-bold rounded-full border border-slate-100">{tag}</span>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400">Starting at</p>
                        <p className="text-base font-bold text-indigo-700">{service.price}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="font-bold text-sm">{service.rating}</span>
                        <span className="text-xs text-slate-400">({service.reviews})</span>
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedService(service)}
                    className="w-full mt-4 bg-slate-50 text-slate-900 border border-slate-200 py-2 rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors text-sm font-bold"
                >
                    View Details
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="relative h-40 bg-slate-800 shrink-0">
                   <img src={`https://picsum.photos/400/200?random=${selectedService.id + 10}`} className="w-full h-full object-cover opacity-50" />
                   <button onClick={() => setSelectedService(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
                        <X size={16} />
                   </button>
                   <div className="absolute bottom-4 left-6 text-white">
                        <h2 className="text-2xl font-bold font-serif">{selectedService.title}</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-sm opacity-90">{selectedService.provider}</p>
                            {selectedService.online && (
                                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Online Now</span>
                            )}
                        </div>
                   </div>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold">Rate</p>
                            <p className="font-bold text-slate-900 text-sm">{selectedService.price}</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold">Delivery</p>
                            <p className="font-bold text-slate-900 text-sm">3-5 Days</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold">Rating</p>
                            <div className="flex justify-center items-center space-x-1 font-bold text-amber-500 text-sm">
                                <Star size={12} fill="currentColor" /> <span>{selectedService.rating}</span>
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Service Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {selectedService.desc} Includes full commentary, track changes, and a zoom consultation call to discuss the edits. Guaranteed confidentiality.
                    </p>

                    <h4 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Upload File (Optional)</h4>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mb-6 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group">
                        <p className="text-sm text-slate-500 group-hover:text-slate-700">Drag & drop your chapter here, or click to browse.</p>
                        <p className="text-xs text-slate-400 mt-1">.docx, .pdf up to 10MB</p>
                    </div>

                    <button 
                        onClick={handleBook}
                        disabled={isBooked}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-teal-600/20"
                    >
                        {isBooked ? (
                            <>
                                <Check size={20} /> <span>Booking Confirmed!</span>
                            </>
                        ) : (
                            <span>Proceed to Payment</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
