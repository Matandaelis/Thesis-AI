
import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MessageCircle, Mail, FileQuestion, Book } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      { q: "How do I create a new thesis document?", a: "Go to the 'My Documents' tab and click the 'New Document' button. You can then select your university template to ensure correct formatting." },
      { q: "Is the AI content plagiarism-free?", a: "Our AI generates original content based on your prompts. However, we always recommend running the built-in Plagiarism Checker before final submission." },
    ]
  },
  {
    category: 'Billing & Account',
    questions: [
      { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your subscription from the Settings > Billing page. Your access will continue until the end of the current billing cycle." },
      { q: "Do you offer student discounts?", a: "Yes! Our 'Semester' plan offers a 15% discount compared to monthly billing, specifically designed for student budgets." },
    ]
  },
  {
    category: 'Technical Support',
    questions: [
      { q: "How do I export to LaTeX?", a: "In the Editor, click the 'Download' icon in the top right corner and select 'Export as LaTeX'. A .tex file will be generated instantly." },
      { q: "My reference library isn't syncing.", a: "Try disconnecting and reconnecting your Zotero/Mendeley account in Settings > Integrations. Ensure pop-ups are allowed for authentication." },
    ]
  }
];

export const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFaq = (idx: string) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">How can we help you?</h1>
        <div className="max-w-2xl mx-auto relative">
          <input 
            type="text" 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* FAQs */}
        <div className="md:col-span-2 space-y-6">
          {filteredFaqs.length === 0 ? (
             <div className="text-center py-8 text-slate-500">No results found. Try a different keyword.</div>
          ) : (
             filteredFaqs.map((cat, catIdx) => (
                <div key={catIdx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                    <Book size={16} className="text-teal-600" />
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{cat.category}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {cat.questions.map((item, qIdx) => {
                      const id = `${catIdx}-${qIdx}`;
                      const isOpen = openIndex === id;
                      return (
                        <div key={qIdx} className="group">
                          <button 
                            onClick={() => toggleFaq(id)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                          >
                            <span className={`font-medium ${isOpen ? 'text-teal-700' : 'text-slate-800'}`}>{item.q}</span>
                            {isOpen ? <ChevronUp size={18} className="text-teal-500" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4 text-sm text-slate-600 leading-relaxed animate-fade-in-down">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
             ))
          )}
        </div>

        {/* Contact Sidebar */}
        <div className="space-y-6">
           <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <MessageCircle size={20} className="text-teal-400" /> Still stuck?
              </h3>
              <p className="text-slate-300 text-sm mb-6">Our academic support team is available 24/7 to assist you.</p>
              
              <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-bold transition-colors mb-3 flex items-center justify-center gap-2">
                 <MessageCircle size={16} /> Live Chat
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                 <Mail size={16} /> Email Support
              </button>
           </div>

           <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <FileQuestion size={18} className="text-indigo-500" /> Request Feature
              </h3>
              <p className="text-xs text-slate-500 mb-4">Suggest a new tool or university template.</p>
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 mb-3"
                placeholder="I wish ThesisAI could..."
              ></textarea>
              <button className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-lg font-bold text-sm transition-colors">
                 Submit Request
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
