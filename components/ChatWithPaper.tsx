
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
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
    { id: '1', role: 'model', text: `Hello! I've analyzed "${paper.title}". You can ask me to summarize it, explain the methodology, or clarify specific findings.` }
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

    // Prepare context: Use fullText if available, otherwise construct from metadata
    const context = paper.fullText || `
      Title: ${paper.title}
      Author: ${paper.author}
      Year: ${paper.year}
      Source: ${paper.source}
      Abstract/Summary: ${paper.notes || "No specific abstract available. Answer based on title and metadata."}
    `;

    // Map history to simple format for service
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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error analyzing the paper." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {!paper.fullText && !paper.notes && (
           <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs flex items-start gap-2 border border-yellow-100">
              <AlertCircle size={14} className="mt-0.5 shrink-0"/>
              <span>
                <strong>Note:</strong> Full text not available. AI is using metadata (Title, Author, Notes) for context. 
                Add content to the "Notes" field or import a paper with abstract for better results.
              </span>
           </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-teal-100 text-teal-700'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                   <Sparkles size={14} className="animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm text-xs text-slate-500 italic">
                   Reading paper...
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            placeholder="Ask a question about this paper..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
