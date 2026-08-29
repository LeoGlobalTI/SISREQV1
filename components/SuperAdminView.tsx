
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
        <div className="px-8 py-5 bg-white border-b border-slate-200 z-20">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-sm">
                        <ShieldCheck size={20} strokeWidth={2.5}/>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Auditoría Master
                            </span>
                            <button
                                onClick={() => setActiveTab('versioning')}
                                className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 uppercase tracking-wider flex items-center gap-1 transition-all"
                                title="Ver control de versiones"
                            >
                                <GitBranch size={10} /> v3.5.0
                            </button>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider hidden sm:inline">
                                • Powered by Global TI 2026
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1"></div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Panel de Control General</h2>
                    </div>
                </div>

                <div className="flex items-center gap-8 overflow-x-auto border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'reports'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BarChart3 size={16} strokeWidth={2.5}/> Reportes
                    </button>
                    <button
                        onClick={() => setActiveTab('organization')}
                        className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'organization'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Users size={16} strokeWidth={2.5}/> Organización
                    </button>
                    <button
                        onClick={() => setActiveTab('versioning')}
                        className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'versioning'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <GitBranch size={16} strokeWidth={2.5}/> Versiones
                    </button>
                    <button
                        onClick={() => setActiveTab('qa')}
                        className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'qa'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <ShieldCheck size={16} strokeWidth={2.5}/> Auditoría
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                            activeTab === 'docs'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BookOpen size={16} strokeWidth={2.5}/> Docs
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
