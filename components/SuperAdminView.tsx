
import React, { useState } from 'react';
import { ReportsView } from './ReportsView';
import { OrganizationUsersView } from './OrganizationUsersView';
import { QAView } from './QAView';
import { DocumentationView } from './DocumentationView';
import { VersioningView } from './VersioningView';
import { BarChart3, Users, ShieldCheck, TerminalSquare, BookOpen, Building, GitBranch } from 'lucide-react';

type Tab = 'reports' | 'organization' | 'versioning' | 'qa' | 'docs';

export const SuperAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reports');

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
        
        {/* Sub-navigation Institucional */}
        <div className="px-8 py-4 bg-white border-b border-slate-200 shadow-sm z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                    <div className="bg-[#1E293B] p-3 rounded-2xl text-white shadow-xl shadow-slate-200">
                        <ShieldCheck size={22} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-lg text-[8px] font-black border border-slate-950 uppercase tracking-widest">
                                MODO AUDITORÍA MASTER
                            </span>
                            <button
                                onClick={() => setActiveTab('versioning')}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                title="Ver control de versiones"
                            >
                                <GitBranch size={10} /> v3.5.0-MASTER
                            </button>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
                                • Powered by Global TI 2026
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Panel de Control</h2>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'reports'
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 font-black'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BarChart3 size={15} strokeWidth={2.5}/> Reportes
                    </button>
                    <button
                        onClick={() => setActiveTab('organization')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'organization'
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <div className="flex items-center -space-x-1">
                            <Building size={14} strokeWidth={2.5}/>
                            <Users size={12} strokeWidth={2.5} className="opacity-80"/>
                        </div>
                        Unidades y Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('versioning')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'versioning'
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <GitBranch size={15} strokeWidth={2.5}/> Versiones
                    </button>
                    <button
                        onClick={() => setActiveTab('qa')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'qa'
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <TerminalSquare size={15} strokeWidth={2.5}/> Auditoría QA
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'docs'
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BookOpen size={15} strokeWidth={2.5}/> Manuales
                    </button>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'organization' && <OrganizationUsersView />}
            {activeTab === 'versioning' && <VersioningView />}
            {activeTab === 'qa' && <QAView />}
            {activeTab === 'docs' && <DocumentationView />}
        </div>
    </div>
  );
};
