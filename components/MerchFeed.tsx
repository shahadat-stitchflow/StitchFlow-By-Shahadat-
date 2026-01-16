
import React, { useState, useEffect } from 'react';
import { getAIFeedSuggestions } from '../services/geminiService';
import { Project } from '../types';

interface FeedItem {
  type: 'Fabric' | 'Trims' | 'Production' | 'News';
  title: string;
  description: string;
  styleContext: string;
}

export const MerchFeed: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // Load from local storage first (Encrypted simulation)
    const cached = localStorage.getItem('stitchflow_feed_cache');
    if (cached) {
      setItems(JSON.parse(cached));
    }

    if (navigator.onLine) {
      fetchNewFeed();
    }

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const fetchNewFeed = async () => {
    setLoading(true);
    const newItems = await getAIFeedSuggestions(projects);
    if (newItems && newItems.length > 0) {
      setItems(newItems);
      localStorage.setItem('stitchflow_feed_cache', JSON.stringify(newItems));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Merch Feed</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personalized Insights & Industry Intelligence</p>
        </div>
        {isOffline && (
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Offline Mode</span>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-[2rem]"></div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" />
               </svg>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
               <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                 item.type === 'Fabric' ? 'bg-indigo-100 text-indigo-700' :
                 item.type === 'Trims' ? 'bg-emerald-100 text-emerald-700' :
                 item.type === 'Production' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
               }`}>
                 {item.type}
               </span>
               <span className="text-[10px] text-slate-400 font-bold italic">{item.styleContext}</span>
            </div>
            
            <h3 className="font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
            
            <button className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
               Save to Notepad
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        ))}
      </div>
      
      {!loading && items.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <p className="text-slate-400 font-bold">Connect to internet to sync the latest industry intelligence.</p>
        </div>
      )}
    </div>
  );
};
