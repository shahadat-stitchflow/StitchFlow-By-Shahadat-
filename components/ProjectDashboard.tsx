
import React, { useState, useMemo } from 'react';
import { Project, StepStatus } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { LiquidProgressButton } from './ui/LiquidProgressButton';
import { MerchandisingSkillsMeter } from './MerchandisingSkillsMeter';

interface ProjectDashboardProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onAddNew?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onSelectProject, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const successfulShipments = projects.filter(p => {
      const lastStep = p.workflow[p.workflow.length - 1];
      return lastStep.status === StepStatus.COMPLETED || lastStep.status === StepStatus.APPROVED;
    }).length;

    const pendingShipments = projects.length - successfulShipments;
    
    const totalExpertisePoints = projects.reduce((acc, p) => 
      acc + p.workflow.filter(w => w.status === StepStatus.COMPLETED || w.status === StepStatus.APPROVED).length
    , 0);

    let rankLabel = "Junior Merchandiser";
    let rankColor = "text-slate-400 dark:text-slate-500";
    let rankBg = "bg-slate-400 dark:bg-slate-600";
    let nextTier = 5;

    if (successfulShipments >= 20) {
      rankLabel = "Legendary Merchant";
      rankColor = "text-amber-500";
      rankBg = "bg-amber-500";
      nextTier = 50;
    } else if (successfulShipments >= 10) {
      rankLabel = "Industrial Expert";
      rankColor = "text-purple-500";
      rankBg = "bg-purple-500";
      nextTier = 20;
    } else if (successfulShipments >= 5) {
      rankLabel = "Senior Merchandiser";
      rankColor = "text-emerald-500";
      rankBg = "bg-emerald-500";
      nextTier = 10;
    } else if (successfulShipments >= 1) {
      rankLabel = "Professional Merchandiser";
      rankColor = "text-indigo-500";
      rankBg = "bg-indigo-500";
      nextTier = 5;
    }

    const rankProgress = Math.min((successfulShipments / nextTier) * 100, 100);

    return {
      successfulShipments,
      pendingShipments,
      totalExpertisePoints,
      rankLabel,
      rankColor,
      rankBg,
      rankProgress,
      nextTier
    };
  }, [projects]);

  const mockSkillsStats = {
    avgDaysToComplete: 3.4,
    totalTasksUpdated: stats.totalExpertisePoints,
    overdueCount: projects.filter(p => p.isUrgent).length,
    aiFollowupCount: 15
  };

  const filteredProjects = projects.filter(project => 
    project.styleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.styleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:max-w-xl group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search Style, Number or Buyer..."
            className="block w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-8 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-100 dark:focus:border-indigo-800 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Global Active Portfolio</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{projects.length} Styles</p>
           </div>
           <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center px-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Production Pipeline</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Unified view of your style development lifecycles.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProjects.map((project) => {
              const totalSteps = project.workflow.length;
              const progressPercentage = ((project.currentStepIndex + 1) / totalSteps) * 100;
              return (
                <div 
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={`bg-white dark:bg-slate-900 border rounded-[3rem] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col relative ${
                    project.isUrgent ? 'border-orange-200 dark:border-orange-900/50 ring-4 ring-orange-50/50 dark:ring-orange-900/10' : 'border-slate-100 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    {project.productImageUrl ? (
                      <img src={project.productImageUrl} alt={project.styleName} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-700 bg-slate-50 dark:bg-slate-800">
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="absolute top-5 right-5">
                      <StatusBadge status={project.workflow[project.currentStepIndex].status} />
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <h3 className="font-black text-xl text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate tracking-tight">{project.styleName}</h3>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{project.styleNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-50 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Buyer</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{project.buyerName}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-50 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">X-Factory</p>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-200">{project.shipDate}</p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Stage {project.currentStepIndex + 1}/{totalSteps}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{Math.round(progressPercentage)}%</span>
                      </div>
                      <LiquidProgressButton 
                        progress={progressPercentage} 
                        label={project.workflow[project.currentStepIndex].label}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* "Add New Style" Card */}
            <div 
              onClick={onAddNew}
              className="bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-600 transition-all cursor-pointer min-h-[400px]"
            >
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">New Inquiry</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-[200px]">Start another style discovery or production cycle.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:sticky lg:top-28">
           <div className="bg-slate-950 dark:bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group border border-white/5 dark:border-indigo-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>
              
              <div className="relative z-10 space-y-12">
                <div className="flex justify-between items-center">
                   <div>
                      <h3 className="text-[11px] font-black uppercase text-indigo-400 mb-1.5 tracking-[0.25em]">Active Performance</h3>
                      <p className={`font-black text-3xl tracking-tighter ${stats.rankColor}`}>{stats.rankLabel}</p>
                   </div>
                   <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md">
                      <svg className={`w-9 h-9 ${stats.rankColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.15em]">
                      <span className="text-slate-500">Tier Advancement</span>
                      <span className="text-white">{stats.successfulShipments} / {stats.nextTier} Success</span>
                   </div>
                   <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                      <div 
                         className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] ${stats.rankBg}`}
                         style={{ width: `${stats.rankProgress}%` }}
                      ></div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group/tile">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover/tile:text-emerald-400 transition-colors">Shipments Done</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{stats.successfulShipments}</span>
                        <span className="text-[10px] font-bold text-emerald-400">Styles</span>
                      </div>
                   </div>
                   <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-default group/tile">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover/tile:text-indigo-400 transition-colors">In Queue</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{stats.pendingShipments}</span>
                        <span className="text-[10px] font-bold text-indigo-400">Active</span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Expertise Score</p>
                        <p className="text-xl font-black text-white leading-none">{stats.totalExpertisePoints}</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>

           <MerchandisingSkillsMeter stats={mockSkillsStats} />
        </div>
      </div>
    </div>
  );
};
