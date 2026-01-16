
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, StepStatus, WorkflowStep, StepRecord, UserProfile, CollaborationState } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { 
  getAIAdvice, 
  analyzeProductionRisks, 
  getBuyerSummaryEmail, 
  getStepSummary, 
  getUrgencyActionPlan, 
  analyzeCustomCostingText
} from '../services/geminiService';
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
            className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-[10px] font-black text-white relative animate-in zoom-in fade-in duration-300"
            style={{ 
              backgroundColor: c.userColor,
              zIndex: collaborators.length - idx
            }}
          >
            {c.userName.substring(0, 2).toUpperCase()}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkflowTimeline: React.FC<{ 
  workflow: WorkflowStep[]; 
  activeIdx: number; 
  currentIdx: number; 
  onSelect: (idx: number) => void;
  onSummarize: (idx: number) => void;
  summarizingIdx: number | null;
  today: string;
}> = ({ workflow, activeIdx, currentIdx, onSelect, onSummarize, summarizingIdx, today }) => {
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
        <div className="flex gap-2">
          {workflow[activeIdx].records && workflow[activeIdx].records!.length > 0 && (
            <button 
              onClick={() => onSummarize(activeIdx)}
              disabled={summarizingIdx !== null}
              className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {summarizingIdx === activeIdx ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )}
              Stage Summary
            </button>
          )}
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
                  {step.aiSummary && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white dark:border-slate-800 animate-bounce">
                      AI
                    </div>
                  )}
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
  const [loadingExcelAnalysis, setLoadingExcelAnalysis] = useState(false);
  const [summarizingIdx, setSummarizingIdx] = useState<number | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  // Custom Costing Modal States
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [rawCostingInput, setRawCostingInput] = useState('');
  const [costingAnalysisResult, setCostingAnalysisResult] = useState<string | null>(null);
  const [buyerEmailModal, setBuyerEmailModal] = useState<string | null>(null);

  const headerPhotoInputRef = useRef<HTMLInputElement>(null);
  const excelFileRef = useRef<HTMLInputElement>(null);
  const techPackInputRef = useRef<HTMLInputElement>(null);
  const costingSheetInputRef = useRef<HTMLInputElement>(null);

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

  const handleGenerateStepSummary = async (idx: number) => {
    const step = project.workflow[idx];
    if (!step.records || step.records.length === 0) return;
    
    setSummarizingIdx(idx);
    const summary = await getStepSummary(step.label, step.records);
    onUpdateStep(idx, { aiSummary: summary });
    setSummarizingIdx(null);
  };

  const handleUrgencyAction = async () => {
    setLoadingAi(true);
    const result = await getUrgencyActionPlan(project);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleExcelAnalysis = async () => {
    if (!rawCostingInput.trim()) return;
    setLoadingExcelAnalysis(true);
    try {
      const result = await analyzeCustomCostingText(rawCostingInput, project);
      setCostingAnalysisResult(result);
    } catch (e) {
      setCostingAnalysisResult("Failed to analyze the provided data. Please ensure it contains cost-related keywords.");
    }
    setLoadingExcelAnalysis(false);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawCostingInput(text);
        setCostingModalOpen(true);
      };
      reader.readAsText(file);
    }
  };

  const handleCostingSheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProject({ 
          costingSheetUrl: reader.result as string, 
          costingSheetName: file.name 
        });
        
        // If it's a text-based file, pre-fill the strategic analyst
        if (file.type.includes('text') || file.name.endsWith('.csv')) {
           const textReader = new FileReader();
           textReader.onload = (txtEvent) => {
              setRawCostingInput(txtEvent.target?.result as string);
           };
           textReader.readAsText(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCosting = () => {
    const baseData = [
      ['Style Name', project.styleName],
      ['Style Number', project.styleNumber],
      ['Buyer', project.buyerName],
      ['Season', project.season],
      ['Target FOB', project.targetFob?.toString() || '0'],
      ['Fabric', project.fabricType || 'N/A'],
      ['Quantity', project.quantity.toString()],
    ];

    let csvContent = baseData.map(r => r.join(",")).join("\n");

    if (rawCostingInput) {
      csvContent += "\n\n--- RAW COSTING INPUT ---\n";
      csvContent += rawCostingInput.replace(/,/g, ";").replace(/\n/g, " | ");
    }

    if (costingAnalysisResult) {
      csvContent += "\n\n--- AI SOURCING REPORT ---\n";
      csvContent += costingAnalysisResult.replace(/,/g, ";").replace(/\n/g, " | ");
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${project.styleNumber}_FOB_Breakdown.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTechPackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProject({ 
          techPackUrl: reader.result as string, 
          techPackName: file.name 
        });
      };
      reader.readAsDataURL(file);
    }
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
    const totalSteps = project.workflow.length;
    const progressPercent = Math.round((completed / totalSteps) * 100);
    return { completed, progressPercent };
  }, [project.workflow]);

  const renderStageTools = () => {
    const isCostingStage = activeStep.id === 'costing_quotation' || activeStep.id === 'final_costing';

    return (
      <div className="flex flex-wrap items-center gap-3">
        {isCostingStage && (
          <>
            <button 
              onClick={() => setCostingModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9l3-3m0 0l3 3m-3-3v12" /></svg>
              Strategic Costing Assistant
            </button>
            <button 
              onClick={handleExportCosting}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
          </>
        )}

        <button onClick={handleTriggerBuyerEmail} disabled={loadingBuyerEmail} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
          Draft Buyer Update
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
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[85vh] animate-in fade-in duration-500 pb-20">
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
                   Update Identity
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
            <button onClick={() => setActiveTab('planner')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'planner' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Planner</button>
            <button onClick={() => setActiveTab('techpack')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'techpack' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Route</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-slate-900/10 custom-scrollbar">
          {activeTab === 'workflow' ? (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
               <div>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Production Health</h4>
                  <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Completion Rate</p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.progressPercent}%</p>
                      <p className="text-[10px] font-bold text-emerald-500 mb-1">Active</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${stats.progressPercent}%` }}></div>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl">
                  <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Shipment Target</h4>
                  <p className="text-2xl font-black text-white tracking-tighter">{project.shipDate}</p>
               </div>
               
               {project.isUrgent && (
                  <button onClick={handleUrgencyAction} className="w-full bg-red-600 text-white p-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 animate-pulse hover:bg-red-700 transition-all">
                    Urgency Plan
                  </button>
               )}
            </div>
          ) : activeTab === 'planner' ? (
            <div className="p-6 space-y-6 animate-in fade-in duration-500">
               {/* STYLES CARD (Specification DNA) */}
               <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
                  <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Style DNA</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Buyer</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate ml-4">{project.buyerName}</span>
                    </div>
                    <div className="flex justify-between border-b dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Season</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.season}</span>
                    </div>
                    <div className="flex justify-between border-b dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Order Qty</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{project.gender || 'Mens'}</span>
                    </div>
                    <div className="flex justify-between border-b dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Target FOB</span>
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase">${project.targetFob?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
               </div>

               {/* COSTING SHEET CARD */}
               <div className="bg-emerald-600 dark:bg-emerald-700 rounded-[2rem] p-6 text-white shadow-xl space-y-5">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9l3-3m0 0l3 3m-3-3v12" /></svg>
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Costing Sheets (Excel)</h4>
                  </div>
                  
                  {project.costingSheetUrl ? (
                    <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between group border border-white/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1" /></svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black truncate max-w-[120px]">{project.costingSheetName || 'Costing_Breakdown.xlsx'}</p>
                          <p className="text-[8px] opacity-60 uppercase font-bold">Live Document</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => costingSheetInputRef.current?.click()}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/30 transition-all"
                          title="Update Costing"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                        <a 
                          href={project.costingSheetUrl} 
                          download={project.costingSheetName || 'Costing.xlsx'}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/40 transition-all"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => costingSheetInputRef.current?.click()}
                      className="w-full bg-white/5 border-2 border-dashed border-white/20 p-8 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all group"
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Upload Custom Costing Excel</span>
                    </button>
                  )}
                  <input type="file" ref={costingSheetInputRef} className="hidden" accept=".xls,.xlsx,.csv,.txt" onChange={handleCostingSheetUpload} />
               </div>

               <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl space-y-5">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Tech Pack (Spec)</h4>
                  </div>
                  
                  {project.techPackUrl ? (
                    <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between group border border-white/5">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black truncate max-w-[120px]">{project.techPackName || 'Spec_Master.pdf'}</p>
                          <p className="text-[8px] opacity-60 uppercase font-bold">Verified File</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => techPackInputRef.current?.click()}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/30 transition-all"
                          title="Update Specification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                        <a 
                          href={project.techPackUrl} 
                          download={project.techPackName || 'TechPack.pdf'}
                          className="p-2 bg-indigo-500 rounded-lg hover:bg-emerald-400 transition-all"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => techPackInputRef.current?.click()}
                      className="w-full bg-white/5 border-2 border-dashed border-white/20 p-8 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all group"
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Upload Specification</span>
                    </button>
                  )}
                  <input type="file" ref={techPackInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleTechPackUpload} />
               </div>

               <div className={`bg-slate-900 dark:bg-slate-950 p-5 rounded-[2rem] shadow-xl h-48 flex flex-col relative overflow-visible ${getSectionCollaborators('notes').length > 0 ? 'ring-2 ring-indigo-500' : ''}`}
                 onFocus={() => onFocusSection('notes')}
                 onBlur={() => onFocusSection('')}
               >
                  <SectionPresenceStack collaborators={getSectionCollaborators('notes')} />
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Merchandiser Log</h4>
                  <textarea value={project.merchandiserNotes || ''} onChange={(e) => onUpdateProject({ merchandiserNotes: e.target.value })} placeholder="Log updates..." className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] text-white font-medium leading-relaxed resize-none no-scrollbar" />
               </div>
            </div>
          ) : (
             <div className="p-8">
               <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Technical Lifecycle</h3>
               <div className="space-y-4">
                  {project.workflow.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                       <span className={`w-2 h-2 rounded-full ${i <= project.currentStepIndex ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${i <= project.currentStepIndex ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{s.label}</span>
                    </div>
                  ))}
               </div>
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
          onSummarize={handleGenerateStepSummary}
          summarizingIdx={summarizingIdx}
          today={today}
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl min-h-[600px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg">Route Navigation</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeStep.label}</h2>
            </div>
            
            {renderStageTools()}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
            <div className="xl:col-span-3 space-y-10">
               {activeStep.aiSummary && (
                 <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       <span className="text-[10px] font-black uppercase tracking-widest">AI Summary</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic">"{activeStep.aiSummary}"</p>
                 </div>
               )}

               <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Stage Progress Log</h3>
                  <div className={`bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border relative ${getSectionCollaborators('records').length > 0 ? 'ring-2 ring-indigo-500' : ''}`} onFocus={() => onFocusSection('records')} onBlur={() => onFocusSection('')}>
                    <SectionPresenceStack collaborators={getSectionCollaborators('records')} />
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Enter details..." className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium dark:text-white no-scrollbar min-h-[100px]" />
                    <div className="flex justify-end mt-4">
                      <button onClick={handleAddRecord} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition">Post Record</button>
                    </div>
                  </div>
                  <div className="mt-8 space-y-4">
                    {(activeStep.records || []).map((record) => (
                      <div key={record.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in">
                         <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">{record.timestamp}</p>
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{record.note}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            
            <div className="xl:col-span-2 space-y-10">
               <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-4 block tracking-widest">Stage Deadline</label>
                  <input type="date" value={activeStep.dueDate || ''} onChange={(e) => onUpdateStep(activeStepIdx, { dueDate: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-black outline-none dark:text-white" />
               </div>
               
               <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-[500px] flex flex-col border border-white/5">
                  <div className="relative z-10 flex justify-between items-center mb-8">
                    <h4 className="text-xl font-black tracking-tight">AI Advisor</h4>
                    <button onClick={handleAiAnalysis} disabled={loadingAi} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all disabled:opacity-50">
                      {loadingAi ? <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    </button>
                  </div>
                  <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
                    {aiAnalysis ? <p className="text-[13px] font-medium leading-relaxed opacity-90 whitespace-pre-wrap text-slate-300">{aiAnalysis}</p> : <div className="h-full flex flex-col items-center justify-center text-center opacity-40"><p className="text-[11px] font-black uppercase tracking-widest">Strategic Engine Ready</p></div>}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Costing Modal (Excel Notepad Facility) */}
      {costingModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => { setCostingModalOpen(false); setCostingAnalysisResult(null); }}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-6xl h-full lg:h-[90vh] flex flex-col rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9l3-3m0 0l3 3m-3-3v12" /></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">FOB Costing Analyst</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Excel Notepad Facility & Sourcing Optimizer</p>
                </div>
              </div>
              <button onClick={() => { setCostingModalOpen(false); setCostingAnalysisResult(null); }} className="w-12 h-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
               {/* Left: Notepad Facility */}
               <div className="flex-1 p-8 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">1. Provide Raw Data</h3>
                     <div className="flex gap-3">
                        <button 
                          onClick={() => excelFileRef.current?.click()}
                          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          Upload Excel/CSV
                        </button>
                        <input type="file" ref={excelFileRef} className="hidden" accept=".csv,.txt" onChange={handleExcelUpload} />
                        <button 
                          onClick={() => setRawCostingInput('')}
                          className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                        >
                          Clear
                        </button>
                     </div>
                  </div>
                  
                  <div className="flex-1 relative">
                    <textarea 
                      value={rawCostingInput}
                      onChange={(e) => setRawCostingInput(e.target.value)}
                      placeholder="Paste your FOB breakdown directly from Excel (e.g., Fabric: $3.20, Lab: $0.45...) or upload a file above. messy data is fine, our AI will parse it."
                      className="w-full h-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] p-8 text-xs font-medium font-mono leading-relaxed resize-none focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-900/10 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white no-scrollbar"
                    />
                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border dark:border-slate-700">Notepad Active</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleExcelAnalysis}
                    disabled={loadingExcelAnalysis || !rawCostingInput.trim()}
                    className={`w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                      loadingExcelAnalysis || !rawCostingInput.trim() 
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                    }`}
                  >
                    {loadingExcelAnalysis ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Parsing Costing Metrics...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Analyze Costing Intelligence
                      </>
                    )}
                  </button>
               </div>

               {/* Right: AI Intelligence Result */}
               <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-8 flex flex-col gap-6 overflow-hidden">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">2. Sourcing Insight Report</h3>
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-y-auto custom-scrollbar p-8">
                    {costingAnalysisResult ? (
                      <div className="prose prose-indigo dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium animate-in fade-in slide-in-from-right-4 duration-500">
                        {costingAnalysisResult}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-6">
                        <svg className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9l3-3m0 0l3 3m-3-3v12" /></svg>
                        <p className="text-[11px] font-black uppercase tracking-widest mb-2">Awaiting Costing Data</p>
                        <p className="text-[10px] font-bold text-slate-500">Paste your Excel costing rows or upload a file. The Strategic AI will identify fabric savings and target FOB negotiation points.</p>
                      </div>
                    )}
                  </div>
                  
                  {costingAnalysisResult && (
                     <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(costingAnalysisResult);
                            alert("Intelligence report copied!");
                          }}
                          className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 dark:text-white"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                           Copy Report
                        </button>
                        <button 
                          onClick={() => setCostingModalOpen(false)}
                          className="flex-1 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                        >
                           Close Assistant
                        </button>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Email Modal */}
      {buyerEmailModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setBuyerEmailModal(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Draft Update for Buyer</h3>
             <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem] max-h-[60vh] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-700">
                <pre className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 font-inter">{buyerEmailModal}</pre>
             </div>
             <div className="mt-10 flex justify-end gap-4">
                <button onClick={() => setBuyerEmailModal(null)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Close</button>
                <button 
                   onClick={() => {
                     navigator.clipboard.writeText(buyerEmailModal);
                     alert("Copied!");
                   }}
                   className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95"
                >
                   Copy Email
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
