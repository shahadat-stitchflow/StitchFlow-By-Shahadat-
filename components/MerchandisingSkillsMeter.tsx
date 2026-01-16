
import React, { useState, useEffect } from 'react';
import { evaluateMerchandisingSkills } from '../services/geminiService';

interface SkillsMeterProps {
  stats: {
    avgDaysToComplete: number;
    totalTasksUpdated: number;
    overdueCount: number;
    aiFollowupCount: number;
  };
}

export const MerchandisingSkillsMeter: React.FC<SkillsMeterProps> = ({ stats }) => {
  const [score, setScore] = useState(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      const result = await evaluateMerchandisingSkills(stats);
      setAnalysis(result);
      const match = result.match(/(\d+)\/100/);
      const targetScore = match ? parseInt(match[1]) : 85;
      
      // Animate score increment
      let current = 0;
      const interval = setInterval(() => {
        if (current >= targetScore) {
          clearInterval(interval);
        } else {
          current += 1;
          setScore(current);
        }
      }, 15);
      
      setLoading(false);
      return () => clearInterval(interval);
    };
    fetchAnalysis();
  }, [stats]);

  // Calculate wave position based on score
  const waveTranslateY = 100 - score;

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden group">
      {/* Decorative background liquid blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-40 group-hover:scale-150 transition-transform duration-1000"></div>
      
      <div className="flex flex-col items-center mb-6 relative z-10">
        <div className="relative w-full max-w-[200px] aspect-square flex items-center justify-center">
           {/* Liquid Gauge Background */}
           <div className="absolute inset-0 rounded-full bg-slate-50 border-8 border-white shadow-inner overflow-hidden">
              {/* Animated Liquid Wave */}
              <div 
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out"
                style={{ 
                  height: `${score}%`,
                  filter: 'url(#goo)'
                }}
              >
                {/* Wave Svg Layer 1 */}
                <svg 
                  className="absolute bottom-full left-0 w-[200%] h-12 fill-indigo-400 animate-[wave_4s_infinite_linear]" 
                  viewBox="0 0 100 20" 
                  preserveAspectRatio="none"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <path d="M0,10 C20,10 30,0 50,0 C70,0 80,10 100,10 L100,20 L0,20 Z" />
                </svg>
                {/* Wave Svg Layer 2 */}
                <svg 
                  className="absolute bottom-full left-0 w-[200%] h-16 fill-indigo-500/40 animate-[wave_7s_infinite_linear_reverse]" 
                  viewBox="0 0 100 20" 
                  preserveAspectRatio="none"
                  style={{ transform: 'translateX(-30%)', opacity: 0.5 }}
                >
                  <path d="M0,10 C20,10 30,0 50,0 C70,0 80,10 100,10 L100,20 L0,20 Z" />
                </svg>
              </div>
           </div>

           {/* Progress Ring Overlay */}
           <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
             <circle 
               cx="50%" cy="50%" r="44%" 
               fill="transparent" 
               stroke="white" 
               strokeWidth="4" 
               className="opacity-20"
             />
             <circle 
               cx="50%" cy="50%" r="44%" 
               fill="transparent" 
               stroke="url(#ringGradient)" 
               strokeWidth="8" 
               strokeLinecap="round"
               className="transition-all duration-1000 ease-out"
               strokeDasharray="276%"
               strokeDashoffset={`${276 * (1 - score / 100)}%`}
             />
             <defs>
               <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#818cf8" />
                 <stop offset="100%" stopColor="#c084fc" />
               </linearGradient>
             </defs>
           </svg>
           
           {/* Center Score Display */}
           <div className="relative z-20 text-center drop-shadow-sm">
             <span className={`block text-5xl font-black transition-colors duration-500 ${score > 50 ? 'text-white' : 'text-slate-800'}`}>
                {score}
             </span>
             <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${score > 50 ? 'text-indigo-100' : 'text-slate-400'}`}>
                Skills Score
             </span>
           </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group/stat cursor-default">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover/stat:scale-150 transition-transform"></div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Effort</p>
             </div>
             <p className="text-xl font-black text-slate-800">{stats.totalTasksUpdated}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group/stat cursor-default">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover/stat:scale-150 transition-transform"></div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Velocity</p>
             </div>
             <p className="text-xl font-black text-slate-800">{stats.avgDaysToComplete}<span className="text-[10px] ml-1">d</span></p>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[1.5rem] p-5 text-white shadow-lg shadow-indigo-100 group-hover:shadow-indigo-200 transition-all">
           <div className="flex items-center gap-2 mb-3">
             <div className="p-1.5 bg-white/20 rounded-lg">
               <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest">Merch AI Performance Sync</span>
           </div>
           {loading ? (
             <div className="space-y-2">
               <div className="h-2.5 w-full bg-white/20 animate-pulse rounded"></div>
               <div className="h-2.5 w-4/5 bg-white/20 animate-pulse rounded"></div>
             </div>
           ) : (
             <p className="text-[11px] font-medium leading-relaxed opacity-90 italic">
               {analysis?.split('\n')[0] || 'Analyzing your merchandising patterns...'}
             </p>
           )}
        </div>
      </div>

      <style>{`
        @keyframes wave {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
