
import React, { useState } from 'react';
import { Star, Clock, Check, X } from 'lucide-react';

const services = [
  {
    id: 1,
    title: 'Professional Proofreading',
    provider: 'Dr. Sarah K.',
    rating: 4.9,
    reviews: 120,
    price: 'KES 200/page',
    desc: 'Deep grammatical check and flow correction by a linguistics PhD.',
    tags: ['Grammar', 'Flow']
  },
  {
    id: 2,
    title: 'Statistical Analysis (SPSS)',
    provider: 'Data Wizards Kenya',
    rating: 4.7,
    reviews: 85,
    price: 'KES 5,000/task',
    desc: 'Complete Chapter 4 analysis including graphs, tables and interpretation.',
    tags: ['Data', 'Charts']
  },
  {
    id: 3,
    title: 'Plagiarism Removal',
    provider: 'Academic Cleanse',
    rating: 4.8,
    reviews: 200,
    price: 'KES 150/page',
    desc: 'Paraphrasing services to reduce Turnitin score below 15%.',
    tags: ['Turnitin', 'Rewriting']
  },
];

export const Marketplace: React.FC = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBooked, setIsBooked] = useState(false);

  const handleBook = () => {
    setIsBooked(true);
    setTimeout(() => {
        setSelectedService(null);
        setIsBooked(false);
        alert("Booking request sent! The expert will contact you shortly.");
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in relative">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h1 className="text-3xl font-bold font-serif text-slate-900">Expert Services</h1>
           <p className="text-slate-600 mt-2">Hire vetted professionals to polish your thesis.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto text-center md:text-left">
            <span className="text-sm font-medium text-slate-600">Your Balance: </span>
            <span className="text-lg font-bold text-teal-700">KES 4,500</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="h-32 bg-slate-800 relative">
               <img src={`https://picsum.photos/400/200?random=${service.id + 10}`} className="w-full h-full object-cover opacity-60" alt="Service" />
               <div className="absolute bottom-3 left-4">
                  <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">Featured</span>
               </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{service.title}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">{service.desc}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {service.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">{tag}</span>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400">Starting at</p>
                        <p className="text-lg font-bold text-indigo-700">{service.price}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-500">
                        <Star size={16} fill="currentColor" />
                        <span className="font-bold text-sm">{service.rating}</span>
                        <span className="text-xs text-slate-400">({service.reviews})</span>
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedService(service)}
                    className="w-full mt-4 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                    View Details
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="relative h-40 bg-slate-800 shrink-0">
                   <img src={`https://picsum.photos/400/200?random=${selectedService.id + 10}`} className="w-full h-full object-cover opacity-50" />
                   <button onClick={() => setSelectedService(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                        <X size={16} />
                   </button>
                   <div className="absolute bottom-4 left-6 text-white">
                        <h2 className="text-2xl font-bold font-serif">{selectedService.title}</h2>
                        <p className="text-sm opacity-90">{selectedService.provider}</p>
                   </div>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 uppercase">Rate</p>
                            <p className="font-bold text-slate-900">{selectedService.price}</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 uppercase">Delivery</p>
                            <p className="font-bold text-slate-900">3-5 Days</p>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            <p className="text-xs text-slate-500 uppercase">Rating</p>
                            <div className="flex justify-center items-center space-x-1 font-bold text-amber-500">
                                <Star size={12} fill="currentColor" /> <span>{selectedService.rating}</span>
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-800 mb-2">Service Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {selectedService.desc} Includes full commentary, track changes, and a zoom consultation call to discuss the edits. Guaranteed confidentiality.
                    </p>

                    <h4 className="font-bold text-slate-800 mb-2">Upload File</h4>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mb-6 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                        <p className="text-sm text-slate-500">Drag & drop your chapter here, or click to browse.</p>
                        <p className="text-xs text-slate-400 mt-1">.docx, .pdf up to 10MB</p>
                    </div>

                    <button 
                        onClick={handleBook}
                        disabled={isBooked}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-all flex items-center justify-center space-x-2"
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
