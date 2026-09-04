import React, { useState, useMemo, useRef } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { User, UserRole, UserStatus, Status, Area } from '../types';
import { 
  Building, Users, UserPlus, Plus, Edit2, Trash2, Save, X, 
  Activity, Calendar, Shield, Briefcase, Mail, Key, MapPin, 
  ShieldAlert, ShieldCheck, Zap, Database, Search, Filter,
  CheckCircle2, Layers, ChevronRight, AlertCircle, ArrowRight
} from 'lucide-react';
import { NewUserModal } from './NewUserModal';

export const OrganizationUsersView: React.FC = () => {
  const { 
    users, deleteUser, currentUser, addNotification, requests,
    organizationAreas, addOrganizationArea, updateOrganizationArea, deleteOrganizationArea
  } = useSisreq();

  // Filter state for users
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');

  // Area management state
  const [newArea, setNewArea] = useState('');
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);

  // User management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Resizable Columns State for User Table
  const [colWidths, setColWidths] = useState<number[]>([250, 160, 160, 110, 110, 90, 80]);
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

  // Area helpers
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newArea.trim()) {
      try {
        await addOrganizationArea(newArea.trim());
        addNotification('SUCCESS', 'Unidad Creada', `Se ha registrado la unidad "${newArea.trim()}" con éxito.`);
        setNewArea('');
      } catch (err: any) {
        addNotification('WARNING', 'Error', err.message || 'No se pudo crear la unidad.');
      }
    }
  };

  const handleSaveEditArea = async () => {
    if (editingArea && editValue.trim() && editingArea !== editValue.trim()) {
      try {
        await updateOrganizationArea(editingArea, editValue.trim());
        addNotification('SUCCESS', 'Unidad Actualizada', `La unidad se renombró a "${editValue.trim()}".`);
      } catch (err: any) {
        addNotification('WARNING', 'Error', err.message || 'No se pudo actualizar la unidad.');
      }
    }
    setEditingArea(null);
    setEditValue('');
  };

  const confirmDeleteArea = async () => {
    if (areaToDelete) {
      try {
        await deleteOrganizationArea(areaToDelete);
        if (selectedAreaFilter === areaToDelete) {
          setSelectedAreaFilter('ALL');
        }
        addNotification('SUCCESS', 'Unidad Eliminada', `Se ha eliminado el área "${areaToDelete}".`);
      } catch (err: any) {
        addNotification('WARNING', 'Error', err.message || 'No se pudo eliminar la unidad.');
      }
      setAreaToDelete(null);
    }
  };

  // User helpers
  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      addNotification('WARNING', 'Acción denegada', 'No puede eliminar su propia cuenta estando en sesión.');
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      addNotification('SUCCESS', 'Usuario Eliminado', `Se ha eliminado al usuario ${userToDelete.name}.`);
      setUserToDelete(null);
    } catch (e: any) {
      addNotification('WARNING', 'Error', e.message);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE' || !u.status).length;
    const inactiveUsers = totalUsers - activeUsers;
    const totalAreas = organizationAreas.length;

    const roles = {
      [UserRole.SUPERADMIN]: users.filter(u => u.role === UserRole.SUPERADMIN).length,
      [UserRole.ADMIN]: users.filter(u => u.role === UserRole.ADMIN).length,
      [UserRole.HEAD]: users.filter(u => u.role === UserRole.HEAD).length,
      [UserRole.ANALYST]: users.filter(u => u.role === UserRole.ANALYST).length,
    };

    const areaStats = organizationAreas.map(areaName => {
      const members = users.filter(u => u.area === areaName || u.areas?.includes(areaName as any));
      const areaRequests = requests.filter(r => r.area === areaName);
      const completedRequests = areaRequests.filter(r => r.status === Status.FINALIZADO);
      return {
        name: areaName,
        membersCount: members.length,
        requestsCount: areaRequests.length,
        completedCount: completedRequests.length,
      };
    });

    const unassignedUsers = users.filter(u => !u.area && (!u.areas || u.areas.length === 0)).length;
    const assignmentRate = totalUsers > 0 ? Math.round(((totalUsers - unassignedUsers) / totalUsers) * 100) : 0;

    return { totalUsers, activeUsers, inactiveUsers, totalAreas, roles, areaStats, unassignedUsers, assignmentRate };
  }, [users, organizationAreas, requests]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Area filter
      if (selectedAreaFilter !== 'ALL') {
        const userHasArea = user.area === selectedAreaFilter || user.areas?.includes(selectedAreaFilter as any);
        if (!userHasArea) return false;
      }
      // Role filter
      if (roleFilter !== 'ALL' && user.role !== roleFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(term);
        const matchesEmail = user.email ? user.email.toLowerCase().includes(term) : false;
        const matchesArea = user.area ? user.area.toLowerCase().includes(term) : false;
        const matchesAreas = user.areas ? user.areas.some(a => a.toLowerCase().includes(term)) : false;
        const matchesRole = user.role.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesArea && !matchesAreas && !matchesRole) {
          return false;
        }
      }
      return true;
    });
  }, [users, selectedAreaFilter, roleFilter, searchTerm]);

  const ResizeHandle = ({ index }: { index: number }) => (
    <div 
      onMouseDown={(e) => handleMouseDown(index, e)}
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400/50 active:bg-indigo-600 transition-colors z-30"
    />
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Compacto */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-sm">
                <Building size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Centro de Mando Organizacional
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                Gestión unificada de Unidades y Directorio de Colaboradores
              </p>
            </div>
          </div>
        </div>

        {/* NIVEL 1: KPIs DE CAPITAL HUMANO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl shadow-sm">
                  <Users size={24} />
              </div>
              <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Colaboradores</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalUsers}</div>
                  <div className="text-[10px] font-bold text-emerald-600 mt-1">{stats.activeUsers} ACTIVOS</div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                  <Building size={24} />
              </div>
              <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unidades Operativas</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalAreas}</div>
                  <div className="text-[10px] font-bold text-indigo-600 mt-1">ÁREAS REGISTRADAS</div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal de Gestión</span>
            </div>
            <div className="flex items-end gap-3 mb-2">
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.roles.SUPERADMIN + stats.roles.ADMIN}</div>
                <div className="text-xs font-bold text-slate-500 mb-1">Admins</div>
            </div>
            <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                <div className="bg-slate-900 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.SUPERADMIN / stats.totalUsers) * 100 : 0}%` }} title="SuperAdmin" />
                <div className="bg-red-600 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.ADMIN / stats.totalUsers) * 100 : 0}%` }} title="Admin" />
                <div className="bg-indigo-600 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.HEAD / stats.totalUsers) * 100 : 0}%` }} title="Jefes" />
                <div className="bg-slate-300 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.ANALYST / stats.totalUsers) * 100 : 0}%` }} title="Analistas" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                  <Activity size={24} />
              </div>
              <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasa de Distribución</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.assignmentRate}%</div>
                  <div className={`text-[10px] font-bold mt-1 ${stats.unassignedUsers > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {stats.unassignedUsers} SIN ASIGNAR
                  </div>
              </div>
          </div>

        </div>

        {/* NIVEL 2: INTERFAZ DIVIDIDA 30/70 */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: Estructura de Áreas (30%) */}
          <div className="w-full xl:w-1/3 xl:min-w-[320px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
             
             {/* Área Header & Input */}
             <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={16} className="text-indigo-600"/>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    Estructura de Áreas
                  </h3>
                </div>
                <form onSubmit={handleAddArea} className="relative">
                  <input
                    type="text"
                    placeholder="NUEVA UNIDAD..."
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 transition-colors shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newArea.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </form>
             </div>

             {/* Lista de Áreas */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                <div 
                  onClick={() => setSelectedAreaFilter('ALL')}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    selectedAreaFilter === 'ALL' ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedAreaFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Building size={14} />
                    </div>
                    <span className={`text-xs font-black uppercase ${selectedAreaFilter === 'ALL' ? 'text-indigo-900' : 'text-slate-700'}`}>
                      Todas las Unidades
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                    {stats.totalUsers} usr
                  </span>
                </div>

                {stats.areaStats.map((area) => (
                   <div 
                    key={area.name}
                    className={`group flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedAreaFilter === area.name ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {editingArea === area.name ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-white border border-indigo-300 px-2 py-1.5 rounded-lg text-xs font-bold outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditArea()}
                        />
                        <button onClick={handleSaveEditArea} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                          <Save size={14} />
                        </button>
                        <button onClick={() => setEditingArea(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedAreaFilter(area.name)}
                        >
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${selectedAreaFilter === area.name ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                            <MapPin size={14} />
                          </div>
                          <span className={`text-xs font-black uppercase truncate ${selectedAreaFilter === area.name ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {area.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md shrink-0">
                            {area.membersCount} usr
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingArea(area.name); setEditValue(area.name); }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => setAreaToDelete(area.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
             </div>
          </div>

          {/* COLUMNA DERECHA: Directorio de Colaboradores (70%) */}
          <div className="w-full xl:w-2/3 flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[700px]">
            
            {/* Directorio Header & Controles */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="BUSCAR POR NOMBRE, EMAIL O ÁREA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm placeholder:text-slate-300"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <Shield size={14} className="text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent border-0 text-xs font-bold text-slate-700 uppercase outline-none cursor-pointer pr-4"
                  >
                    <option value="ALL">Todos los Roles</option>
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleNewUser}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95 shrink-0"
              >
                <UserPlus size={16} /> Colaborador
              </button>
            </div>

            {/* Tabla de Usuarios */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Header de Tabla */}
              <div className="flex bg-slate-50/80 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 shrink-0">
                <div style={{ width: colWidths[0] }} className="relative shrink-0 flex items-center px-3">
                  Colaborador
                  <ResizeHandle index={0} />
                </div>
                <div style={{ width: colWidths[1] }} className="relative shrink-0 flex items-center px-3">
                  Rol & Permisos
                  <ResizeHandle index={1} />
                </div>
                <div style={{ width: colWidths[2] }} className="relative shrink-0 flex items-center px-3">
                  Unidad Asignada
                  <ResizeHandle index={2} />
                </div>
                <div style={{ width: colWidths[3] }} className="relative shrink-0 flex items-center px-3">
                  Estado
                  <ResizeHandle index={3} />
                </div>
                <div style={{ width: colWidths[4] }} className="relative shrink-0 flex items-center px-3">
                  Seguridad
                  <ResizeHandle index={4} />
                </div>
                <div style={{ width: colWidths[5] }} className="relative shrink-0 flex items-center justify-end px-3">
                  Acciones
                </div>
              </div>

              {/* Cuerpo de Tabla */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="min-w-fit px-4 pb-4">
                  {filteredUsers.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-3">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-slate-300">
                        <Users size={32} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No se encontraron colaboradores
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div 
                        key={user.id} 
                        className="flex items-center border-b border-slate-100 py-3 hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Identidad */}
                        <div style={{ width: colWidths[0] }} className="shrink-0 px-3 truncate">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-black text-slate-900 uppercase truncate" title={user.name}>{user.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 truncate" title={user.email}>{user.email || 'Sin correo registrado'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Rol */}
                        <div style={{ width: colWidths[1] }} className="shrink-0 px-3 truncate flex items-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${
                            user.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white border-slate-800' :
                            user.role === UserRole.ADMIN ? 'bg-red-50 text-red-700 border-red-200' :
                            user.role === UserRole.HEAD ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {user.role === UserRole.SUPERADMIN && <ShieldAlert size={10} />}
                            {user.role === UserRole.ADMIN && <ShieldCheck size={10} />}
                            {user.role}
                          </span>
                        </div>

                        {/* Unidad */}
                        <div style={{ width: colWidths[2] }} className="shrink-0 px-3 truncate">
                           {(user.area || (user.areas && user.areas.length > 0)) ? (
                            <div className="flex flex-col gap-1 truncate">
                              {user.area && (
                                <span className="text-[9px] font-bold text-slate-700 uppercase flex items-center gap-1 truncate w-fit" title={user.area}>
                                  <MapPin size={10} className="text-slate-400 shrink-0" /> {user.area}
                                </span>
                              )}
                              {user.areas && user.areas.length > 0 && user.areas.map(a => (
                                <span key={a} className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 truncate w-fit bg-slate-50 px-1 rounded border border-slate-100" title={a}>
                                  <Building size={9} className="text-slate-300 shrink-0" /> {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 uppercase italic">No asignado</span>
                          )}
                        </div>

                        {/* Estado */}
                        <div style={{ width: colWidths[3] }} className="shrink-0 px-3 truncate">
                          <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit ${
                            (!user.status || user.status === 'ACTIVE') ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${(!user.status || user.status === 'ACTIVE') ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {(!user.status || user.status === 'ACTIVE') ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        {/* Seguridad */}
                        <div style={{ width: colWidths[4] }} className="shrink-0 px-3 truncate">
                          <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] bg-slate-50 px-2 py-1 rounded border border-slate-200 w-fit">
                            <Key size={10} /> ••••
                          </div>
                        </div>

                        {/* Acciones */}
                        <div style={{ width: colWidths[5] }} className="shrink-0 px-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditUser(user)} 
                            title="Editar Colaborador"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                          >
                            <Edit2 size={14} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)} 
                            title="Eliminar Colaborador"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Creación / Edición de Usuario */}
      <NewUserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        userToEdit={selectedUser}
      />

      {/* Modal de Confirmación de Eliminación de Usuario */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Confirmar Eliminación</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              ¿Está seguro que desea eliminar la cuenta del colaborador <strong className="text-slate-900">{userToDelete.name}</strong>? Esta acción no se puede deshacer y revocará inmediatamente sus accesos.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-wider"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Unidad */}
      {areaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Eliminar Unidad</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              ¿Está seguro que desea eliminar la unidad <strong className="text-slate-900">{areaToDelete}</strong>? Los colaboradores asignados a esta unidad perderán esta jurisdicción y los tickets históricos mantendrán su registro.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setAreaToDelete(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteArea}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-wider"
              >
                Sí, Eliminar Unidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
