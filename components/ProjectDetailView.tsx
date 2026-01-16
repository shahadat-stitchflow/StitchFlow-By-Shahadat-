
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, StepStatus, WorkflowStep, StepRecord, UserProfile, CollaborationState } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { getAIAdvice, analyzeProductionRisks, getBuyerSummaryEmail, getCostingEfficiencyAudit } from '../services/geminiService';
import { useCollaboration } from '../hooks/useCollaboration';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onUpdateStep: (stepIdx: number, updates: Partial<WorkflowStep>) => void;
  onUpdateProject: (updates: Partial<Project>) => void;
}

const SectionPresenceStack: React.FC<{ collaborators: CollaborationState[] }> = ({ collaborators }) => {
  if (collaborators.length === 0) return null;
  
  return (
    <div className="absolute -top-8 -right-4 flex items-center gap-2 z-50 pointer-events-none group/stack">
      <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
        {collaborators.map((c, idx) => (
          <div 
            key={c.userId}
            className="w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black text-white relative animate-in zoom-in fade-in duration-300"
            style={{ 
              backgroundColor: c.userColor,
              zIndex: collaborators.length - idx
            }}
          >
            {c.userName.substring(0, 2).toUpperCase()}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
        ))}
      </div>
      
      <div className="bg-white border-2 border-slate-900 px-3 py-1.5 rounded-2xl shadow-2xl flex flex-col translate-y-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 leading-none mb-0.5 whitespace-nowrap">
          {collaborators.length > 1 ? `${collaborators[0].userName} + ${collaborators.length - 1}` : collaborators[0].userName}
        </span>
        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter animate-pulse">
          Active
        </span>
      </div>
    </div>
  );
};

const WorkflowTimeline: React.FC<{ 
  workflow: WorkflowStep[]; 
  activeIdx: number; 
  currentIdx: number; 
  onSelect: (idx: number) => void;
  today: string;
}> = ({ workflow, activeIdx, currentIdx, onSelect, today }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[activeIdx] as HTMLElement;
      if (activeElement) {
        const containerWidth = scrollRef.current.offsetWidth;
        const elementOffset = activeElement.offsetLeft;
        const elementWidth = activeElement.offsetWidth;
        
        scrollRef.current.scrollTo({
          left: elementOffset - (containerWidth / 2) + (elementWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [activeIdx]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] mb-8 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-10 px-4">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Visual Production Route</h3>
          <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">Stage {activeIdx + 1}: {workflow[activeIdx].label}</p>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex items-start gap-0 overflow-x-auto overflow-y-hidden pb-16 pt-6 px-[45%] no-scrollbar snap-x snap-mandatory scroll-smooth min-h-[180px] touch-pan-x"
      >
        {workflow.map((step, idx) => {
          const isSelected = activeIdx === idx;
          const isCompleted = step.status === StepStatus.COMPLETED || step.status === StepStatus.APPROVED;
          const isActuallyCurrent = idx === currentIdx;
          const isOverdue = step.dueDate && step.dueDate < today && !isCompleted;
          
          return (
            <div key={step.id} className="flex items-center shrink-0 snap-center">
              {idx > 0 && (
                <div className={`w-24 h-1.5 transition-all duration-700 relative overflow-hidden ${idx <= currentIdx ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`}>
                </div>
              )}
              
              <button 
                onClick={() => onSelect(idx)}
                className="group relative flex flex-col items-center outline-none"
              >
                <div className={`
                  w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative
                  ${isSelected ? 'scale-125 z-20 ring-4 ring-indigo-500/30' : 'hover:scale-110'}
                  ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                    isActuallyCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/10' : 
                    isOverdue ? 'bg-red-500 text-white animate-pulse' : 
                    'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-100 dark:border-slate-700'}
                `}>
                  <span className="text-[12px] font-black">{idx + 1}</span>
                </div>
                
                <div className={`
                  absolute top-full mt-6 flex flex-col items-center transition-all duration-500 pointer-events-none whitespace-nowrap
                  ${isSelected ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}
                `}>
                  <p className={`text-[10px] font-black uppercase tracking-widest text-center max-w-[120px] ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {step.label}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, onBack, onUpdateStep, onUpdateProject }) => {
  const [activeStepIdx, setActiveStepIdx] = useState(project.currentStepIndex);
  const [activeTab, setActiveTab] = useState<'workflow' | 'planner' | 'techpack'>('workflow');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingBuyerEmail, setLoadingBuyerEmail] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [buyerEmailModal, setBuyerEmailModal] = useState<string | null>(null);
  
  const headerPhotoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser: UserProfile = useMemo(() => {
    const saved = localStorage.getItem('stitchflow_user_profile');
    return saved ? JSON.parse(saved) : { id: 'user_1', name: 'Senior Merchandiser', color: '#6366f1' };
  }, []);

  const { collaborators, onFocusSection } = useCollaboration(project.id, currentUser);
  const activeStep = project.workflow[activeStepIdx];
  const today = new Date().toISOString().split('T')[0];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const result = await analyzeProductionRisks(project);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Error generating analysis.");
    }
    setLoadingAi(false);
  };

  const handleHeaderPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProject({ productImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerBuyerEmail = async () => {
    setLoadingBuyerEmail(true);
    const result = await getBuyerSummaryEmail(project);
    setBuyerEmailModal(result);
    setLoadingBuyerEmail(false);
  };

  const handleStatusChange = (status: StepStatus) => {
    onUpdateStep(activeStepIdx, { status });
    setIsStatusDropdownOpen(false);
  };

  const handleAddRecord = () => {
    if (!newNote.trim()) return;
    const newRecord: StepRecord = {
      id: Date.now().toString(),
      note: newNote,
      timestamp: new Date().toLocaleString(),
    };
    const updatedRecords = [newRecord, ...(activeStep.records || [])];
    onUpdateStep(activeStepIdx, { records: updatedRecords });
    setNewNote('');
  };

  const getSectionCollaborators = (sectionId: string): CollaborationState[] => {
    return (Object.values(collaborators) as CollaborationState[]).filter(c => c.activeSection === sectionId);
  };

  const statusOptions = [
    { value: StepStatus.PENDING, label: 'Pending' },
    { value: StepStatus.IN_PROGRESS, label: 'In Progress' },
    { value: StepStatus.COMPLETED, label: 'Completed' },
    { value: StepStatus.APPROVED, label: 'Approved' },
    { value: StepStatus.REJECTED, label: 'Rejected' },
  ];

  const stats = useMemo(() => {
    const completed = project.workflow.filter(s => s.status === StepStatus.COMPLETED || s.status === StepStatus.APPROVED).length;
    const overdue = project.workflow.filter(s => s.dueDate && s.dueDate < today && s.status !== StepStatus.COMPLETED && s.status !== StepStatus.APPROVED).length;
    const totalSteps = project.workflow.length;
    const progressPercent = Math.round((completed / totalSteps) * 100);
    return { completed, overdue, progressPercent };
  }, [project.workflow, today]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[85vh] animate-in fade-in duration-500">
      {/* Sidebar Section */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl">
        <div className="p-0 border-b border-slate-200 dark:border-slate-800">
          <div className="relative h-56 bg-slate-950 overflow-hidden group">
             {project.productImageUrl ? (
               <img src={project.productImageUrl} alt={project.styleName} className="w-full h-full object-cover opacity-80 transition-transform duration-700 hover:scale-110" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-700">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
             )}
             
             <div 
               className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
               onClick={() => headerPhotoInputRef.current?.click()}
             >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Update Photo
                </div>
             </div>
             <input type="file" ref={headerPhotoInputRef} className="hidden" accept="image/*" onChange={handleHeaderPhotoChange} />

             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent flex flex-col justify-end p-6 pointer-events-none">
                <button onClick={onBack} className="text-white text-[10px] font-black uppercase tracking-widest hover:text-indigo-400 transition mb-3 flex items-center gap-1.5 opacity-80 pointer-events-auto">
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                   Back
                </button>
                <h2 className="font-black text-white truncate text-xl leading-tight tracking-tight">{project.styleName}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{project.styleNumber}</p>
             </div>
          </div>
          
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button onClick={() => setActiveTab('workflow')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'workflow' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Health</button>
            <button onClick={() => setActiveTab('planner')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'planner' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Profile</button>
            <button onClick={() => setActiveTab('techpack')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'techpack' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Specs</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-slate-900/10 custom-scrollbar">
          {activeTab === 'workflow' ? (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Production Health</h4>
                  <div className="space-y-4">
                     <div className="bg-white dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Overall Progress</p>
                        <div className="flex items-end gap-3">
                           <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.progressPercent}%</p>
                           <p className="text-[10px] font-bold text-emerald-500 mb-1">On Track</p>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                           <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${stats.progressPercent}%` }}></div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl">
                  <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Ex-Factory Target</h4>
                  <p className="text-2xl font-black text-white tracking-tighter">{project.shipDate}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: Active</p>
               </div>
            </div>
          ) : activeTab === 'planner' ? (
            <div className="p-6 space-y-6 animate-in fade-in duration-500">
               {/* STYLES CARD (Metadata Summary) */}
               <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                  <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Style Specification</h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Buyer</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.buyerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Season</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.season}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Order Qty</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.gender || 'Mens'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Target FOB</span>
                      <span className="text-[11px] font-black text-indigo-600 uppercase">${project.targetFob || '0.00'}</span>
                    </div>
                  </div>
               </div>

               <div className={`bg-slate-900 dark:bg-slate-950 p-5 rounded-[2rem] shadow-xl h-48 flex flex-col ring-2 transition-all duration-500 relative overflow-visible ${getSectionCollaborators('notes').length > 0 ? 'ring-indigo-500 ring-offset-2' : 'ring-transparent'}`}
                 onFocus={() => onFocusSection('notes')}
                 onBlur={() => onFocusSection('')}
               >
                  <SectionPresenceStack collaborators={getSectionCollaborators('notes')} />
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Internal Log</h4>
                  <textarea value={project.merchandiserNotes || ''} onChange={(e) => onUpdateProject({ merchandiserNotes: e.target.value })} placeholder="Internal logs..." className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] text-white font-medium leading-relaxed resize-none no-scrollbar" />
               </div>
            </div>
          ) : (
             <div className="p-8 animate-in fade-in duration-500">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Technical Specifications</h3>
               <p className="text-xs text-slate-500 font-medium">Standard PLM specs for {project.styleName} would appear here.</p>
             </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 overflow-hidden">
        <WorkflowTimeline 
          workflow={project.workflow} 
          activeIdx={activeStepIdx} 
          currentIdx={project.currentStepIndex}
          onSelect={setActiveStepIdx}
          today={today}
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl min-h-[600px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg">Production Focus</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeStep.label}</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
               <button onClick={handleTriggerBuyerEmail} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                 Draft Email
               </button>
               <div className="relative">
                  <button onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}><StatusBadge status={activeStep.status} /></button>
                  {isStatusDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] shadow-2xl py-3 z-[100] animate-in slide-in-from-top-2">
                       {statusOptions.map((opt) => (
                         <button key={opt.value} onClick={() => handleStatusChange(opt.value)} className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{opt.label}</button>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
            <div className="xl:col-span-3 space-y-10">
               <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Execution Records</h3>
                  <div className={`bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border ring-2 transition-all duration-500 mb-8 relative ${getSectionCollaborators('records').length > 0 ? 'ring-indigo-500' : 'ring-transparent'}`} onFocus={() => onFocusSection('records')} onBlur={() => onFocusSection('')}>
                    <SectionPresenceStack collaborators={getSectionCollaborators('records')} />
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Log detailed updates..." className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-300 resize-none min-h-[120px] font-medium dark:text-white no-scrollbar" />
                    <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                      <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                      <button onClick={handleAddRecord} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl active:scale-95">Post Update</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {(activeStep.records || []).map((record) => (
                      <div key={record.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-left-2">
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">{record.timestamp}</p>
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{record.note}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            
            <div className="xl:col-span-2 space-y-10">
               <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-4 block tracking-widest">Stage Deadline</label>
                  <input type="date" value={activeStep.dueDate || ''} onChange={(e) => onUpdateStep(activeStepIdx, { dueDate: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all dark:text-white" />
               </div>
               
               <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-[500px] flex flex-col border border-white/5">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="relative z-10 flex justify-between items-center mb-8 shrink-0">
                    <h4 className="text-xl font-black tracking-tight">AI Advisor</h4>
                    <button onClick={handleAiAnalysis} disabled={loadingAi} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all disabled:opacity-50">
                      {loadingAi ? <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    </button>
                  </div>
                  <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 no-scrollbar">
                    {aiAnalysis ? <p className="text-[13px] font-medium leading-relaxed opacity-90 whitespace-pre-wrap text-slate-300">{aiAnalysis}</p> : <div className="h-full flex flex-col items-center justify-center text-center px-4"><p className="text-xs font-black uppercase text-slate-500 mb-2">Analysis Available</p><p className="text-[11px] text-slate-600 font-bold max-w-[180px]">Generate strategic production insights for this stage.</p></div>}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
