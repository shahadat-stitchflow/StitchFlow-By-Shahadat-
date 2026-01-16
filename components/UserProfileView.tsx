
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Project } from '../types';

interface UserProfileViewProps {
  projects: Project[];
  onToggleAdmin: (val: boolean) => void;
  isAdminMode: boolean;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ projects, onToggleAdmin, isAdminMode }) => {
  // Mock Admin Email from AI Studio perspective as specified by user
  const AUTHORIZED_ADMIN_EMAIL = 'merch@stitchflow.io';

  const [profile, setProfile] = useState<UserProfile>(() => {
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
  });

  const isActuallyAdmin = profile.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('stitchflow_user_profile', JSON.stringify(profile));
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const activeProjects = projects.filter(p => p.currentStepIndex < 15);
  const totalCompletion = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + ((p.currentStepIndex + 1) / 16), 0) / projects.length * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 sm:p-16 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Dynamic Background Blurs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-[120px] opacity-70"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-14 relative z-10">
          {/* Avatar Section */}
          <div className="relative group shrink-0">
            <div className="w-48 h-48 rounded-[3.5rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center ring-[14px] ring-slate-50 dark:ring-slate-800/50 transition-all duration-500 group-hover:scale-105 group-hover:ring-indigo-50 dark:group-hover:ring-indigo-900/20">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center">
                   <svg className="w-20 h-20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-40">User Identity</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-3 -right-3 bg-slate-900 dark:bg-indigo-600 text-white p-5 rounded-3xl shadow-2xl hover:bg-black dark:hover:bg-indigo-500 transition transform hover:scale-110 active:scale-95 border-4 border-white dark:border-slate-700"
              title="Upload Identity Image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} accept="image/*" />
          </div>

          {/* Form Content */}
          <div className="flex-1 w-full space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-4 flex-wrap">
                <input 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="text-5xl font-black text-slate-900 dark:text-white border-none bg-transparent p-0 focus:ring-0 w-full md:w-auto tracking-tighter"
                  placeholder="Full Name"
                />
                {isActuallyAdmin && (
                   <span className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30">
                     Verified Admin
                   </span>
                )}
              </div>
              <input 
                value={profile.companyRole}
                onChange={e => setProfile({...profile, companyRole: e.target.value})}
                className="text-sm font-black text-indigo-600 dark:text-indigo-400 border-none bg-transparent p-0 focus:ring-0 w-full uppercase tracking-widest"
                placeholder="Job Designation"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   Workspace Email
                </label>
                <input 
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  className="w-full text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-6 py-5 rounded-2xl focus:ring-8 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-inner dark:text-white"
                  placeholder="e.g. name@company.com"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                   Active Contact
                </label>
                <input 
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile({...profile, phone: e.target.value})}
                  className="w-full text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-6 py-5 rounded-2xl focus:ring-8 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-inner dark:text-white"
                  placeholder="e.g. +880 1xxx-xxxxxx"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-10">Historical Context</h3>
          <div className="space-y-10">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1.5">Primary Buyer Portfolio</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeProjects.length > 0 ? activeProjects[0].buyerName : 'N/A'}</p>
              </div>
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl border border-indigo-50 dark:border-indigo-900/30">
                 <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Global Workflow Velocity</p>
                 <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{totalCompletion}%</span>
              </div>
              <div className="w-full h-5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-1.5 border border-slate-100 dark:border-slate-700 shadow-inner">
                <div 
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  style={{ width: `${totalCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Section */}
        <div className={`rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group transition-all duration-500 border ${
          isActuallyAdmin ? 'bg-slate-950 dark:bg-slate-900 text-white border-white/10 dark:border-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 opacity-70'
        }`}>
           <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zM10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
           </div>
           
           <div className="relative z-10 h-full flex flex-col">
              <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] mb-8 ${isActuallyAdmin ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {isActuallyAdmin ? 'Super-Admin Console' : 'Locked Permission'}
              </h3>
              
              <div className="flex-1 space-y-6">
                <p className="text-base leading-relaxed font-medium">
                  {isActuallyAdmin 
                    ? 'Authenticated via AI Studio Portal. You possess full override authority for production pipelines, master costing templates, and supplier verification modules.' 
                    : 'Administrative access restricted to authorized Merchandising Directors. Please verify your workspace email to unlock high-level dashboard features.'}
                </p>
                
                {isActuallyAdmin ? (
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master Pipeline Override</span>
                        <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center px-1"><div className="w-3 h-3 bg-white rounded-full translate-x-5"></div></div>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Ledger Edit</span>
                        <div className="w-10 h-5 bg-white/10 rounded-full flex items-center px-1"><div className="w-3 h-3 bg-slate-500 rounded-full"></div></div>
                     </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-200/50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                )}
              </div>

              {isActuallyAdmin && (
                <button 
                  onClick={() => onToggleAdmin(!isAdminMode)}
                  className={`mt-10 w-full py-6 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${
                    isAdminMode ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isAdminMode ? 'Deactivate Admin Mode' : 'Enter Admin Workspace'}
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
