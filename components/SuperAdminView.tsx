
import React, { useState } from 'react';
import { ReportsView } from './ReportsView';
import { UsersView } from './UsersView';
import { QAView } from './QAView';
import { DocumentationView } from './DocumentationView';
import { BarChart3, Users, ShieldCheck, TerminalSquare, BookOpen } from 'lucide-react';

type Tab = 'reports' | 'users' | 'qa' | 'docs';

export const SuperAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reports');

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
        
        {/* Sub-navigation Institucional */}
        <div className="px-8 py-5 bg-white border-b border-slate-200 shadow-sm z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="bg-[#1E293B] p-3 rounded-2xl text-white shadow-xl shadow-slate-200">
                        <ShieldCheck size={22} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[9px] font-black border border-slate-950 uppercase tracking-widest">
                                MODO AUDITORÍA MASTER
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Panel de Control</h2>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'reports'
                            ? 'bg-white text-indigo-600 shadow-lg ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BarChart3 size={16} strokeWidth={2.5}/> Reportes
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'users'
                            ? 'bg-white text-indigo-600 shadow-lg ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Users size={16} strokeWidth={2.5}/> Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('qa')}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'qa'
                            ? 'bg-white text-indigo-600 shadow-lg ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <TerminalSquare size={16} strokeWidth={2.5}/> Auditoría QA
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'docs'
                            ? 'bg-white text-indigo-600 shadow-lg ring-1 ring-black/5'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BookOpen size={16} strokeWidth={2.5}/> Manuales
                    </button>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'qa' && <QAView />}
            {activeTab === 'docs' && <DocumentationView />}
        </div>
    </div>
  );
};
