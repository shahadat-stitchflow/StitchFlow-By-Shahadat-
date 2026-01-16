
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Project } from '../types';
import { getAIAdvice, getHistoricalTrendAnalysis } from '../services/geminiService';

interface AIAdvisorProps {
  projects: Project[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ projects }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: "Hello! I am your AI Strategic Advisor. Beyond day-to-day merchandising, I can now perform deep historical trend analysis and benchmark your production performance across different seasons. How can I help you optimize your supply chain data today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const activeInput = customPrompt || input;
    if (!activeInput.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: activeInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Prepare a more detailed historical context
    const historicalContext = projects.map(p => ({
      style: p.styleName,
      number: p.styleNumber,
      buyer: p.buyerName,
      season: p.season,
      quantity: p.quantity,
      shipDate: p.shipDate,
      workflowHistory: p.workflow.map(w => ({
        stage: w.label,
        status: w.status,
        dueDate: w.dueDate,
        lastUpdated: w.updatedAt,
        logCount: w.records?.length || 0
      }))
    }));

    let advice: string;
    
    // Detect if this is a historical or trend-specific request
    const isHistorical = activeInput.toLowerCase().includes('trend') || 
                       activeInput.toLowerCase().includes('history') || 
                       activeInput.toLowerCase().includes('benchmark') ||
                       activeInput.toLowerCase().includes('predict');

    if (isHistorical) {
      advice = await getHistoricalTrendAnalysis(activeInput, historicalContext);
    } else {
      advice = await getAIAdvice(activeInput, { projects: historicalContext });
    }

    const modelMsg: ChatMessage = {
      role: 'model',
      content: advice,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">AI Strategic Advisor</h2>
              <div className="flex items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Data Sync Active</span>
              </div>
           </div>
        </div>
        <div className="hidden sm:flex -space-x-2">
           {projects.slice(0, 3).map(p => (
              <div key={p.id} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md ring-2 ring-slate-50" title={p.styleName}>
                 <img src={p.productImageUrl} className="w-full h-full object-cover" />
              </div>
           ))}
           {projects.length > 3 && (
              <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-md">
                 +{projects.length - 3}
              </div>
           )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <div className="prose prose-sm font-medium leading-relaxed whitespace-pre-wrap text-[13px]">
                {msg.content}
              </div>
              <div className={`mt-3 text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] rounded-tl-none p-6 max-w-[80%] shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Crushing Historical Data...</span>
               </div>
               <p className="mt-3 text-[11px] text-slate-400 font-bold italic">Benchmarking current style velocity against previous seasons and predicting future bottlenecks...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 bg-slate-50/80 border-t border-slate-100 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="flex gap-3 mb-6">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isThinking}
            placeholder="Ask for trend predictions or historical performance comparisons..."
            className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
          />
          <button 
            type="submit" 
            disabled={isThinking || !input.trim()}
            className="bg-indigo-600 text-white px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group active:scale-95"
          >
            {isThinking ? 'Analyzing' : 'Consult'}
            {!isThinking && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
          </button>
        </form>
        
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={() => handleSendMessage(undefined, "Perform a historical performance comparison between these active styles. Which buyer has the highest approval velocity?")} 
             disabled={isThinking}
             className="text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Buyer Benchmarking
           </button>
           <button 
             onClick={() => handleSendMessage(undefined, "Based on current fabric choices and styles, predict production trends for the next Summer season.")} 
             disabled={isThinking}
             className="text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             Trend Prediction
           </button>
           <button 
             onClick={() => handleSendMessage(undefined, "Identify recursive delays in the samples approval stages across all projects. What is our average lead time?")} 
             disabled={isThinking}
             className="text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Lead Time Audit
           </button>
           <button 
             onClick={() => handleSendMessage(undefined, "Which similar styles had the most discrepancies in the final inspection stage historically?")} 
             disabled={isThinking}
             className="text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             Discrepancy Forecast
           </button>
        </div>
      </div>
    </div>
  );
};
