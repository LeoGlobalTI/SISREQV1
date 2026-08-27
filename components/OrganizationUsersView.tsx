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

type SubView = 'INTEGRAL' | 'USERS' | 'AREAS';

export const OrganizationUsersView: React.FC = () => {
  const { 
    users, deleteUser, currentUser, addNotification, requests,
    organizationAreas, addOrganizationArea, updateOrganizationArea, deleteOrganizationArea
  } = useSisreq();

  // Sub-view toggle
  const [subView, setSubView] = useState<SubView>('INTEGRAL');

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

    return { totalUsers, activeUsers, inactiveUsers, totalAreas, roles, areaStats };
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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
      
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center">
            <div className="flex items-center -space-x-1.5">
              <Building size={20} strokeWidth={2.5} />
              <Users size={16} strokeWidth={2.5} className="text-indigo-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                GESTIÓN INTEGRADA
              </span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                • Powered by Global TI 2026
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Unidades y Directorio de Usuarios
            </h2>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleNewUser}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-indigo-700"
          >
            <UserPlus size={15} strokeWidth={2.5} /> Alta Colaborador
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSubView(subView === 'AREAS' ? 'INTEGRAL' : 'AREAS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-slate-900 text-white rounded-xl group-hover:scale-105 transition-transform shadow-md">
              <Building size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ORGANIZACIÓN</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.totalAreas}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Unidades Registradas</p>
        </div>

        <div 
          onClick={() => setSubView(subView === 'USERS' ? 'INTEGRAL' : 'USERS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-indigo-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-indigo-100">
              <Users size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PLANTILLA</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.totalUsers}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total de Colaboradores</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-emerald-600 text-white rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-emerald-100">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% ACTIVO
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tighter">{stats.activeUsers}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Colaboradores en Alta</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Database size={10} /> Roles Institucionales
            </p>
          </div>
          <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-slate-100 mb-2">
            <div className="bg-slate-900 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.SUPERADMIN / stats.totalUsers) * 100 : 0}%` }} title="SuperAdmin" />
            <div className="bg-red-600 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.ADMIN / stats.totalUsers) * 100 : 0}%` }} title="Admin" />
            <div className="bg-indigo-600 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.HEAD / stats.totalUsers) * 100 : 0}%` }} title="Jefes" />
            <div className="bg-slate-400 h-full" style={{ width: `${stats.totalUsers > 0 ? (stats.roles.ANALYST / stats.totalUsers) * 100 : 0}%` }} title="Analistas" />
          </div>
          <div className="flex items-center justify-between text-[7px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> {stats.roles.SUPERADMIN} Master</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-600" /> {stats.roles.ADMIN} Admins</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> {stats.roles.HEAD} Jefes</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {stats.roles.ANALYST} Analistas</span>
          </div>
        </div>
      </div>

      {/* Sub-view Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubView('INTEGRAL')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              subView === 'INTEGRAL'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vista Integral
          </button>
          <button
            onClick={() => setSubView('USERS')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              subView === 'USERS'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Colaboradores ({users.length})
          </button>
          <button
            onClick={() => setSubView('AREAS')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              subView === 'AREAS'
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Unidades ({organizationAreas.length})
          </button>
        </div>

        {selectedAreaFilter !== 'ALL' && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtro Activo:</span>
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5">
              <Building size={11} /> {selectedAreaFilter}
              <button 
                onClick={() => setSelectedAreaFilter('ALL')}
                className="hover:bg-indigo-200/60 p-0.5 rounded transition-colors text-indigo-900"
                title="Quitar filtro"
              >
                <X size={10} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: GESTIÓN DE UNIDADES ORGANIZACIONALES (Visible en INTEGRAL o AREAS) */}
      {(subView === 'INTEGRAL' || subView === 'AREAS') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                <Building size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                  Unidades de la Organización
                </h3>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  Departamentos funcionales y jurisdicciones operativas
                </p>
              </div>
            </div>

            {/* Quick Add Area Form */}
            <form onSubmit={handleAddArea} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="NUEVA UNIDAD (EJ: MARKETING)..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-wider focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </div>
              <button
                type="submit"
                disabled={!newArea.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <Plus size={13} strokeWidth={3} /> Agregar
              </button>
            </form>
          </div>

          {/* Cards Grid de Unidades */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.areaStats.map((area) => {
              const isSelected = selectedAreaFilter === area.name;
              const isEditing = editingArea === area.name;

              return (
                <div
                  key={area.name}
                  className={`p-4 rounded-2xl border transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border-2 border-indigo-500 rounded-lg text-xs font-black uppercase outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEditArea()}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleSaveEditArea}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[8px] font-black uppercase flex items-center gap-1"
                        >
                          <Save size={10} /> Guardar
                        </button>
                        <button
                          onClick={() => setEditingArea(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[8px] font-black uppercase"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'} transition-colors`}>
                              <Building size={14} />
                            </div>
                            <span className="font-black text-xs text-slate-900 uppercase truncate">
                              {area.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingArea(area.name);
                                setEditValue(area.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Editar nombre"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAreaToDelete(area.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Eliminar unidad"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3">
                          <span className="flex items-center gap-1 text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <Users size={10} className="text-indigo-500" /> {area.membersCount} miembros
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            {area.requestsCount} tickets
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAreaFilter('ALL');
                            } else {
                              setSelectedAreaFilter(area.name);
                              // Si está en modo áreas, cambiar a integral para ver los usuarios filtrados
                              if (subView === 'AREAS') setSubView('INTEGRAL');
                            }
                          }}
                          className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${
                            isSelected ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'
                          }`}
                        >
                          {isSelected ? '✓ Mostrando Miembros' : 'Ver Colaboradores'} <ArrowRight size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {organizationAreas.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                No hay unidades registradas en el sistema.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: DIRECTORIO DE COLABORADORES (Visible en INTEGRAL o USERS) */}
      {(subView === 'INTEGRAL' || subView === 'USERS') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col space-y-4 p-6">
          
          {/* Header & Filter Controls for Users */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
                <Users size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    Directorio de Colaboradores
                  </h3>
                  <span className="bg-slate-100 text-slate-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                    {filteredUsers.length} de {users.length}
                  </span>
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  Administración de cuentas, roles y jurisdicciones asignadas
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="BUSCAR POR NOMBRE, CORREO O ÁREA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-7 py-2 rounded-xl text-[9px] font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-2xs placeholder:text-slate-300"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Role Filter Selector */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-slate-700 outline-none focus:border-indigo-600 transition-all shadow-2xs"
              >
                <option value="ALL">TODOS LOS ROLES</option>
                <option value={UserRole.SUPERADMIN}>MODO AUDITOR (SUPERADMIN)</option>
                <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
                <option value={UserRole.HEAD}>JEFE DE ÁREA</option>
                <option value={UserRole.ANALYST}>ANALISTA</option>
              </select>

              {/* Area Filter Selector */}
              <select
                value={selectedAreaFilter}
                onChange={(e) => setSelectedAreaFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-slate-700 outline-none focus:border-indigo-600 transition-all shadow-2xs"
              >
                <option value="ALL">TODAS LAS UNIDADES</option>
                {organizationAreas.map(a => (
                  <option key={a} value={a}>UNIDAD: {a.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Institutional Users Table with Resizable Columns */}
          <div className="border border-slate-100 rounded-2xl overflow-x-auto min-w-max">
            {/* Table Header */}
            <div 
              className="grid gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] items-center sticky top-0 z-10"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="relative h-full flex items-center">
                <Users size={10} className="text-slate-300 mr-2" /> Identidad Institucional
                <ResizeHandle index={0} />
              </div>
              <div className="relative h-full flex items-center">
                <Shield size={10} className="inline mr-1 text-slate-300" /> Rol
                <ResizeHandle index={1} />
              </div>
              <div className="relative h-full flex items-center">
                <MapPin size={10} className="inline mr-1 text-slate-300" /> Jurisdicción
                <ResizeHandle index={2} />
              </div>
              <div className="relative h-full flex items-center">
                <Activity size={10} className="inline mr-1 text-slate-300" /> Estado
                <ResizeHandle index={3} />
              </div>
              <div className="relative h-full flex items-center">
                <Calendar size={10} className="inline mr-1 text-slate-300" /> Alta
                <ResizeHandle index={4} />
              </div>
              <div className="relative h-full flex items-center">
                <Key size={10} className="inline mr-1 text-slate-300" /> Seguridad
                <ResizeHandle index={5} />
              </div>
              <div className="text-right">Acciones</div>
            </div>

            {/* Rows List */}
            <div className="divide-y divide-slate-50">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="grid gap-4 px-6 py-3.5 items-center hover:bg-indigo-50/30 transition-all group"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {/* Identidad */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-xs border border-white shrink-0 transition-transform group-hover:scale-105 ${
                        user.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white' :
                        user.role === UserRole.ADMIN ? 'bg-red-600 text-white' :
                        user.role === UserRole.HEAD ? 'bg-indigo-600 text-white' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-[11px] truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                          {user.name}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold truncate flex items-center gap-1">
                          <Mail size={9} className="opacity-40" /> {user.email}
                        </div>
                        {(() => {
                          const assigned = requests.filter(r => r.assignedAnalyst && r.assignedAnalyst.toLowerCase() === user.name.toLowerCase());
                          const completed = assigned.filter(r => r.status === Status.FINALIZADO).length;
                          if (assigned.length === 0) return null;
                          return (
                            <div className="text-[8px] font-black text-indigo-600 truncate flex items-center gap-1 mt-0.5">
                              <Zap size={8} className="text-amber-500" /> {assigned.length} asignados • {completed} finalizados
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Rol */}
                  <div className="truncate">
                    <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black border flex items-center gap-1.5 w-fit uppercase tracking-widest shadow-2xs truncate ${
                      user.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white border-slate-950' :
                      user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600 border-red-100' :
                      user.role === UserRole.HEAD ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {user.role === UserRole.SUPERADMIN ? <ShieldCheck size={8} /> : user.role === UserRole.HEAD ? <Briefcase size={8} /> : <Users size={8} />}
                      {user.role}
                    </span>
                  </div>

                  {/* Jurisdicción */}
                  <div className="truncate">
                    {(user.areas && user.areas.length > 0) || user.area ? (
                      <span className="text-[8px] font-black text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-tight truncate block w-fit">
                        {user.areas?.join(', ') || user.area}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-black text-[8px] tracking-widest uppercase opacity-50 truncate">Global</span>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="truncate">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit shadow-2xs truncate ${(!user.status || user.status === 'ACTIVE') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${(!user.status || user.status === 'ACTIVE') ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="text-[7px] font-black uppercase tracking-widest truncate">
                        {(!user.status || user.status === 'ACTIVE') ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Fecha Alta */}
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 truncate">
                    <Calendar size={10} className="text-slate-300" />
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                  </div>

                  {/* Seguridad */}
                  <div className="truncate">
                    <div className="flex items-center gap-1 text-slate-300 font-mono text-[9px] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 shadow-inner truncate w-fit">
                      <Key size={9} /> ••••
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => handleEditUser(user)} 
                      title="Editar Colaborador"
                      className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100 bg-white" 
                    >
                      <Edit2 size={13} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user)} 
                      title="Eliminar Colaborador"
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 bg-white" 
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center gap-3">
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-slate-300">
                  <Users size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No se encontraron colaboradores con los criterios seleccionados
                </p>
                {(searchTerm || roleFilter !== 'ALL' || selectedAreaFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('ALL');
                      setSelectedAreaFilter('ALL');
                    }}
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-wider hover:underline"
                  >
                    Restablecer Filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
