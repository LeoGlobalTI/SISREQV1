
import React, { useState, useMemo, useRef } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { User, UserRole, UserStatus } from '../types';
import { User as UserIcon, Edit2, Activity, UserPlus, Calendar, Shield, Briefcase, Mail, Power, ShieldCheck, Database, Key, Hash, MapPin, ShieldAlert } from 'lucide-react';
import { NewUserModal } from './NewUserModal';

export const UsersView: React.FC = () => {
  const { users } = useSisreq();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Resizable Columns State
  const [colWidths, setColWidths] = useState<number[]>([250, 180, 180, 120, 120, 100, 80]);
  const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      index,
      startX: e.clientX,
      startWidth: colWidths[index]
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { index, startX, startWidth } = resizingRef.current;
    const delta = e.clientX - startX;
    const newWidths = [...colWidths];
    newWidths[index] = Math.max(50, startWidth + delta);
    setColWidths(newWidths);
  };

  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  const gridTemplate = useMemo(() => colWidths.map(w => `${w}px`).join(' '), [colWidths]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'ACTIVE' || !u.status).length;
    const inactive = total - active;
    const roles = {
        [UserRole.SUPERADMIN]: users.filter(u => u.role === UserRole.SUPERADMIN).length,
        [UserRole.ADMIN]: users.filter(u => u.role === UserRole.ADMIN).length,
        [UserRole.HEAD]: users.filter(u => u.role === UserRole.HEAD).length,
        [UserRole.ANALYST]: users.filter(u => u.role === UserRole.ANALYST).length,
    };
    return { total, active, inactive, roles };
  }, [users]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleNewUserClick = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const ResizeHandle = ({ index }: { index: number }) => (
    <div 
      onMouseDown={(e) => handleMouseDown(index, e)}
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400/50 active:bg-indigo-600 transition-colors z-30"
    />
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
        
        {/* Header & Stats Modern Grid */}
        <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-indigo-100">
                        <UserIcon size={20} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Colaboradores</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-emerald-100">
                        <Activity size={20} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Activos</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.active}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center gap-2 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-1">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Database size={10}/> Distribución
                         </p>
                    </div>
                    <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-slate-900 h-full" style={{ width: `${(stats.roles.SUPERADMIN / stats.total) * 100}%` }}></div>
                        <div className="bg-red-600 h-full" style={{ width: `${(stats.roles.ADMIN / stats.total) * 100}%` }}></div>
                        <div className="bg-indigo-600 h-full" style={{ width: `${(stats.roles.HEAD / stats.total) * 100}%` }}></div>
                        <div className="bg-slate-400 h-full" style={{ width: `${(stats.roles.ANALYST / stats.total) * 100}%` }}></div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[7px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-indigo-600"></div> Jefes</span>
                        <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-red-600"></div> Admin</span>
                        <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-slate-900"></div> Auditor</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <button 
                    onClick={handleNewUserClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-indigo-700"
                >
                    <UserPlus size={16} strokeWidth={2.5}/> Alta Colaborador
                </button>
            </div>
        </div>

        {/* User Inventory - Institutional List format */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500 min-w-max">
             
             {/* Institutional Table Header */}
             <div 
                className="grid gap-4 px-8 py-5 bg-slate-50/80 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] items-center sticky top-0 z-10"
                style={{ gridTemplateColumns: gridTemplate }}
             >
                <div className="relative h-full flex items-center">
                    <UserIcon size={10} className="text-slate-300 mr-2"/> Identidad Institucional
                    <ResizeHandle index={0} />
                </div>
                <div className="relative h-full flex items-center">
                    <Shield size={10} className="inline mr-1 text-slate-300"/> Rol
                    <ResizeHandle index={1} />
                </div>
                <div className="relative h-full flex items-center">
                    <MapPin size={10} className="inline mr-1 text-slate-300"/> Jurisdicción
                    <ResizeHandle index={2} />
                </div>
                <div className="relative h-full flex items-center">
                    <Activity size={10} className="inline mr-1 text-slate-300"/> Estado
                    <ResizeHandle index={3} />
                </div>
                <div className="relative h-full flex items-center">
                    <Calendar size={10} className="inline mr-1 text-slate-300"/> Alta
                    <ResizeHandle index={4} />
                </div>
                <div className="relative h-full flex items-center">
                    <Key size={10} className="inline mr-1 text-slate-300"/> Seguridad
                    <ResizeHandle index={5} />
                </div>
                <div className="text-right">Acciones</div>
             </div>
             
             {/* Rows List */}
             <div className="divide-y divide-slate-50">
                {users.map(user => (
                    <div 
                        key={user.id} 
                        className="grid gap-4 px-8 py-4 items-center hover:bg-indigo-50/30 transition-all group"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        {/* Identidad */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm border border-white shrink-0 transition-transform group-hover:scale-105 ${
                                    user.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white' :
                                    user.role === UserRole.ADMIN ? 'bg-red-600 text-white' :
                                    user.role === UserRole.HEAD ? 'bg-indigo-600 text-white' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {user.name.substring(0,2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-black text-slate-900 text-[11px] truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{user.name}</div>
                                    <div className="text-[9px] text-slate-400 font-bold truncate flex items-center gap-1">
                                        <Mail size={9} className="opacity-40" /> {user.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rol */}
                        <div className="truncate">
                            <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black border flex items-center gap-1.5 w-fit uppercase tracking-widest shadow-sm truncate ${
                                user.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white border-slate-950' :
                                user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600 border-red-100' :
                                user.role === UserRole.HEAD ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                                {user.role === UserRole.SUPERADMIN ? <ShieldCheck size={8} /> : user.role === UserRole.HEAD ? <Briefcase size={8}/> : <UserIcon size={8}/>}
                                {user.role}
                            </span>
                        </div>

                        {/* Jurisdicción */}
                        <div className="truncate">
                            {user.area ? (
                                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-tight truncate block w-fit">{user.area}</span>
                            ) : (
                                <span className="text-slate-300 font-black text-[8px] tracking-widest uppercase opacity-50 truncate">Global</span>
                            )}
                        </div>

                        {/* Estado */}
                        <div className="truncate">
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit shadow-sm truncate ${(!user.status || user.status === 'ACTIVE') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <div className={`w-1 h-1 rounded-full ${(!user.status || user.status === 'ACTIVE') ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                <span className="text-[7px] font-black uppercase tracking-widest truncate">
                                    {(!user.status || user.status === 'ACTIVE') ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        {/* Fecha */}
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 truncate">
                            <Calendar size={10} className="text-slate-300"/>
                            {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                        </div>

                        {/* Seguridad */}
                        <div className="truncate">
                            <div className="flex items-center gap-1 text-slate-300 font-mono text-[9px] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 shadow-inner truncate w-fit">
                                <Key size={9}/> ••••
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex justify-end">
                            <button 
                                onClick={() => handleEditClick(user)} 
                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100 bg-white" 
                            >
                                <Edit2 size={14} strokeWidth={2.5}/>
                            </button>
                        </div>

                    </div>
                ))}
             </div>
             
             {users.length === 0 && (
                 <div className="p-20 text-center flex flex-col items-center gap-4">
                     <div className="bg-slate-50 p-8 rounded-[2rem] border border-dashed border-slate-200">
                         <UserIcon size={40} className="text-slate-200"/>
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sin Colaboradores</p>
                 </div>
             )}
        </div>
        
        <NewUserModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            userToEdit={selectedUser}
        />
    </div>
  );
};
