
import React, { useState } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { UserRole, Area } from '../types';
import { LayoutDashboard, Plus, Briefcase, LogOut, Shield, ArrowLeftRight, Book } from 'lucide-react';
import { NewRequestModal } from './NewRequestModal';
import { RequestDetailModal } from './RequestDetailModal';
import { NotificationBell } from './NotificationBell';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, viewMode, setViewMode, activeRole, toggleSupervisorMode, isSupervisorMode, setSelectedRequestId } = useSisreq();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Los hooks deben estar arriba. Si no hay usuario, retornamos null después.
  if (!currentUser) return null;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  
  const canSupervise = currentUser.role === UserRole.HEAD && currentUser.canSupervise;

  const handleToggleProfile = () => {
    setSelectedRequestId(null);
    toggleSupervisorMode();
  };

  const getRoleBadge = () => {
    if (canSupervise) {
        return (
            <button 
                onClick={handleToggleProfile}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                    isSupervisorMode 
                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                }`}
            >
                <ArrowLeftRight size={10} />
                {isSupervisorMode ? 'MODO SUPERVISOR' : `JEFE ${currentUser.areas?.join(', ')?.toUpperCase() || currentUser.area?.toUpperCase()}`}
            </button>
        );
    }

    switch (currentUser.role) {
        case UserRole.SUPERADMIN: return <span className="px-2 py-0.5 rounded-lg text-[9px] bg-slate-900 text-white font-bold border border-slate-950 tracking-wider">SUPERADMIN</span>;
        case UserRole.ADMIN: return <span className="px-2 py-0.5 rounded-lg text-[9px] bg-red-50 text-red-600 font-bold border border-red-100 tracking-wider uppercase">ADMIN CENTRAL</span>;
        case UserRole.HEAD: return <span className="px-2 py-0.5 rounded-lg text-[9px] bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 tracking-wider uppercase truncate max-w-[120px]">JEFE {currentUser.areas?.join(', ') || currentUser.area}</span>;
        default: return <span className="px-2 py-0.5 rounded-lg text-[9px] bg-slate-100 text-slate-500 font-bold border border-slate-200 tracking-wider uppercase">ANALYST</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 z-30 shrink-0 h-16 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 pr-8 border-r border-slate-200/50">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                    <LayoutDashboard size={20} strokeWidth={2.5} />
                </div>
                <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-none">SISREQ</h1>
            </div>

            <nav className="flex items-center gap-6">
                {currentUser.role === UserRole.SUPERADMIN ? (
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/50">
                        <button 
                            onClick={() => setViewMode('work')} 
                            className={`px-5 py-1.5 rounded-lg transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'work' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Operativo
                        </button>
                        <button 
                            onClick={() => setViewMode('superadmin')} 
                            className={`px-5 py-1.5 rounded-lg transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'superadmin' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Master
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 max-w-[300px]">
                        {isSupervisorMode || activeRole === UserRole.ADMIN ? <Shield size={14} className="text-red-500 shrink-0"/> : <Briefcase size={14} className="text-indigo-500 shrink-0"/>}
                        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 truncate">
                            {isSupervisorMode ? 'SUPERVISIÓN GLOBAL' : (activeRole === UserRole.ADMIN ? 'Consola de Control Central' : `${activeRole} • ${(currentUser.areas?.join(', ') || currentUser.area) || 'General'}`)}
                        </span>
                    </div>
                )}
            </nav>
        </div>

        <div className="flex items-center gap-5">
            {(activeRole === UserRole.ADMIN || activeRole === UserRole.SUPERADMIN || activeRole === UserRole.HEAD || currentUser.canReceiveAndDerive) && (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95 group"
                >
                    <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
                    Nuevo Requerimiento
                </button>
            )}

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setViewMode(viewMode === 'documentation' ? 'work' : 'documentation')}
                    className={`relative p-2.5 rounded-full transition-all border ${viewMode === 'documentation' ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 shadow-sm'}`}
                    title="Manual de Usuario y Técnico"
                >
                    <Book size={18} className={viewMode === 'documentation' ? 'fill-indigo-100' : ''}/>
                </button>
                <NotificationBell />
                
                <div className="flex items-center gap-4 ml-3 border-l border-slate-100 pl-4">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-slate-800 leading-none mb-1.5">{currentUser.name}</span>
                        {getRoleBadge()}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center font-black text-xs text-slate-600 shrink-0 ring-4 ring-slate-50">
                        {getInitials(currentUser.name)}
                    </div>
                    <button 
                        onClick={logout} 
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative z-10">
        {children}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none z-[-1]" 
             style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px'}}>
        </div>
      </main>

      <NewRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <RequestDetailModal />
    </div>
  );
};
