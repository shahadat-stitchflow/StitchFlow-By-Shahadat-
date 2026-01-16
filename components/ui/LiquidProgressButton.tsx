
import React from 'react';

interface LiquidProgressButtonProps {
  progress: number; // 0 to 100
  label: string;
  onClick?: () => void;
  className?: string;
}

export const LiquidProgressButton: React.FC<LiquidProgressButtonProps> = ({ progress, label, onClick, className }) => {
  return (
    <div className={`relative liquid-container ${className}`}>
      <button 
        onClick={onClick}
        className="relative z-10 w-full h-12 bg-indigo-600 text-white font-bold rounded-xl shadow-lg overflow-hidden group transition-all active:scale-95"
      >
        <span className="relative z-20 flex items-center justify-center gap-2">
           {label}
           <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{Math.round(progress)}%</span>
        </span>
        
        {/* Liquid Layer */}
        <div 
          className="absolute top-0 left-0 h-full bg-indigo-400 transition-all duration-1000 ease-in-out liquid-blob"
          style={{ width: `${progress}%`, opacity: 0.6 }}
        />
        <div 
          className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-700 delay-100 ease-in-out liquid-blob"
          style={{ width: `${progress - 2}%`, opacity: 0.8 }}
        />
      </button>
    </div>
  );
};
