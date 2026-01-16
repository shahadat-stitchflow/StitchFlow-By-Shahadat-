
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, WorkflowStep, UserProfile } from './types';
import { MOCK_PROJECTS, createInitialWorkflow } from './constants';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectDetailView } from './components/ProjectDetailView';
import { MerchFeed } from './components/MerchFeed';
import { UserProfileView } from './components/UserProfileView';
import { AIAdvisor } from './components/AIAdvisor';
import { getStyleSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'feed' | 'settings' | 'profile' | 'advisor'>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const addModalFileRef = useRef<HTMLInputElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('stitchflow_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stitchflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stitchflow_theme', 'light');
    }
  }, [isDarkMode]);

  const userProfile: UserProfile = useMemo(() => {
    const saved = localStorage.getItem('stitchflow_user_profile');
    return saved ? JSON.parse(saved) : {
      id: 'u1',
      name: 'Senior Merchandiser',
      email: 'merch@stitchflow.io',
      phone: '+880 1700 000000',
      companyRole: 'Lead Merchandiser',
      isAdmin: true,
      photoUrl: ''
    };
  }, []);

  const [newProject, setNewProject] = useState({
    styleName: '',
    styleNumber: '',
    buyerName: '',
    season: '',
    quantity: 0,
    shipDate: '',
    productImageUrl: '',
    fabricType: '',
    targetFob: 0,
    gender: 'Mens',
    colorways: '1'
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleUpdateStep = (stepIdx: number, updates: Partial<WorkflowStep>) => {
    if (!selectedProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProjectId) return p;
      const newWorkflow = [...p.workflow];
      newWorkflow[stepIdx] = { ...newWorkflow[stepIdx], ...updates, updatedAt: new Date().toISOString() };
      return { ...p, workflow: newWorkflow };
    }));
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const handleSuggestDetails = async () => {
    if (!newProject.buyerName || !newProject.season) {
      alert("Please enter a Buyer Name and Season first to get relevant AI suggestions.");
      return;
    }
    setIsSuggesting(true);
    const suggestions = await getStyleSuggestions(newProject.buyerName, newProject.season, projects);
    if (suggestions) {
      setNewProject(prev => ({
        ...prev,
        styleName: suggestions.styleName || prev.styleName,
        styleNumber: suggestions.styleNumber || prev.styleNumber,
        productImageUrl: suggestions.productImageUrl || prev.productImageUrl,
        quantity: suggestions.quantity || prev.quantity
      }));
    }
    setIsSuggesting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProject(prev => ({ ...prev, productImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `p${Date.now()}`;
    const project: Project = {
      ...newProject,
      id,
      currentStepIndex: 0,
      workflow: createInitialWorkflow(),
      techPackUrl: '#',
      todoItems: [],
      merchandiserNotes: ''
    };
    setProjects([project, ...projects]);
    setIsAddModalOpen(false);
    setNewProject({
      styleName: '',
      styleNumber: '',
      buyerName: '',
      season: '',
      quantity: 0,
      shipDate: '',
      productImageUrl: '',
      fabricType: '',
      targetFob: 0,
      gender: 'Mens',
      colorways: '1'
    });
    setSelectedProjectId(id);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (selectedProject) {
      return (
        <ProjectDetailView 
          project={selectedProject} 
          onBack={() => setSelectedProjectId(null)} 
          onUpdateStep={handleUpdateStep}
          onUpdateProject={(updates) => handleUpdateProject(selectedProjectId!, updates)}
        />
      );
    }

    switch (currentView) {
      case 'feed': return <MerchFeed projects={projects} />;
      case 'profile': return <UserProfileView projects={projects} onToggleAdmin={setIsAdminMode} isAdminMode={isAdminMode} />;
      case 'advisor': return <AIAdvisor projects={projects} />;
      default: return <ProjectDashboard projects={projects} onSelectProject={(p) => setSelectedProjectId(p.id)} onAddNew={() => setIsAddModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-32 md:pb-36 font-inter">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setSelectedProjectId(null); setCurrentView('dashboard');}}>
              <div className="w-11 h-11 bg-slate-900 dark:bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 dark:shadow-indigo-900/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">STITCH<span className="text-indigo-600 dark:text-indigo-400">FLOW</span></span>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90">
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
              <button onClick={() => {setSelectedProjectId(null); setCurrentView('profile');}} className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border-2 transition-all ${currentView === 'profile' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center">
                  {userProfile.photoUrl ? (
                    <img src={userProfile.photoUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-0.5">{userProfile.name.split(' ')[0]}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Profile</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-in fade-in duration-500">
        {renderContent()}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[95%] max-w-2xl animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-2xl px-2 py-3 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between">
          <button onClick={() => {setSelectedProjectId(null); setCurrentView('dashboard');}} className={`flex-1 flex flex-col items-center gap-1 transition-all group ${currentView === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            <div className={`p-2.5 rounded-2xl transition-all ${currentView === 'dashboard' ? 'bg-indigo-500/20' : 'group-hover:bg-white/5'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setCurrentView('advisor')} className={`flex-1 flex flex-col items-center gap-1 transition-all group ${currentView === 'advisor' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            <div className={`p-2.5 rounded-2xl transition-all ${currentView === 'advisor' ? 'bg-indigo-500/20' : 'group-hover:bg-white/5'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Advisor</span>
          </button>
          <div className="px-2">
            <button onClick={() => setIsAddModalOpen(true)} className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center hover:bg-indigo-500 transition-all transform hover:scale-110 active:scale-95 shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] border-4 border-slate-900 dark:border-slate-800 -translate-y-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <button onClick={() => setCurrentView('feed')} className={`flex-1 flex flex-col items-center gap-1 transition-all group ${currentView === 'feed' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            <div className={`p-2.5 rounded-2xl transition-all ${currentView === 'feed' ? 'bg-indigo-500/20' : 'group-hover:bg-white/5'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Discover</span>
          </button>
          <button onClick={() => setCurrentView('profile')} className={`flex-1 flex flex-col items-center gap-1 transition-all group ${currentView === 'profile' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
            <div className={`p-2.5 rounded-2xl transition-all ${currentView === 'profile' ? 'bg-indigo-500/20' : 'group-hover:bg-white/5'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">My Profile</span>
          </button>
        </div>
      </nav>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-6xl h-full lg:h-[90vh] flex flex-col rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-slate-900 dark:bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Style Discovery</h2>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry Pipeline SF-PRO-{Date.now().toString().slice(-4)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-14 space-y-16 bg-white dark:bg-slate-900">
              <form id="style-init-form" onSubmit={handleAddProject} className="space-y-20 pb-10">
                <section className="space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">01</span>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Commercial Core</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Buyer Name</label>
                      <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-100 transition-all dark:text-white" value={newProject.buyerName} onChange={e => setNewProject({...newProject, buyerName: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Season</label>
                      <div className="relative">
                        <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-100 transition-all dark:text-white" value={newProject.season} onChange={e => setNewProject({...newProject, season: e.target.value})} />
                        <button type="button" onClick={handleSuggestDetails} className="absolute right-4 top-4 bottom-4 px-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center gap-2">
                           {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-10">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">02</span>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-200">Product Info</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Style Name</label>
                        <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-100 transition-all dark:text-white" value={newProject.styleName} onChange={e => setNewProject({...newProject, styleName: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Style Number</label>
                        <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-100 transition-all dark:text-white" value={newProject.styleNumber} onChange={e => setNewProject({...newProject, styleNumber: e.target.value})} />
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-[3rem] p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden">
                       {newProject.productImageUrl ? (
                          <div className="relative w-full h-full min-h-[200px] rounded-3xl overflow-hidden shadow-2xl">
                             <img src={newProject.productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                             <button type="button" onClick={() => setNewProject({...newProject, productImageUrl: ''})} className="absolute top-4 right-4 bg-white dark:bg-slate-900 p-2 rounded-xl text-red-500 shadow-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Custom Product Photo</p>
                             <input type="file" ref={addModalFileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                             <button type="button" onClick={() => addModalFileRef.current?.click()} className="w-full bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Select From Device</button>
                             <input type="url" placeholder="Or paste URL..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-black text-center dark:text-white" value={newProject.productImageUrl} onChange={e => setNewProject({...newProject, productImageUrl: e.target.value})} />
                          </div>
                       )}
                    </div>
                  </div>
                </section>
              </form>
            </div>

            <div className="px-10 py-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-end gap-4">
               <button onClick={() => setIsAddModalOpen(false)} className="px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
               <button form="style-init-form" type="submit" className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl active:scale-[0.98]">Deploy Production</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
