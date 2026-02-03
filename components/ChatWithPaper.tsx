import React, { useState, useRef, useEffect } from 'react';
// Added RefreshCw to imports
import { Send, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { LibraryItem } from '../types';

interface ChatWithPaperProps {
  paper: LibraryItem;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatWithPaper: React.FC<ChatWithPaperProps> = ({ paper }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: `Greetings Scholar! I've loaded "${paper.title}" into my synthesis engine. How can I help you extract value from this work today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const context = paper.fullText || `
      Title: ${paper.title}
      Author: ${paper.author}
      Year: ${paper.year}
      Source: ${paper.source}
      Abstract/Summary: ${paper.notes || "No specific abstract available. Answer based on title and metadata."}
    `;

    const history = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      const responseText = await GeminiService.chatWithDocument(userMsg.text, context, history);
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Apologies, I encountered an internal error processing that request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-slate-50/30 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
        {!paper.fullText && !paper.notes && (
           <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-xs flex items-start gap-3 border border-blue-100 shadow-sm animate-fade-in">
              <AlertCircle size={18} className="text-blue-600 mt-0.5 shrink-0"/>
              <span>
                <strong>Grounding Notice:</strong> Full text is unavailable. My responses will be based on extracted metadata and provided summary. Consider uploading a full PDF for deeper methodology analysis.
              </span>
           </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                   <RefreshCw size={14} className="animate-spin" />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   Synthesizing context...
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <div className="relative group">
          <input
            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all group-hover:bg-white"
            placeholder="Ask a scholarly question about this paper..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-30 shadow-md active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-bold uppercase tracking-tighter">AI may generate inaccurate information. Verify critical findings.</p>
      </div>
    </div>
  );
};