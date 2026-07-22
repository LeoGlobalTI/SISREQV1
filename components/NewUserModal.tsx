
import React, { useState, useEffect } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Area, UserRole, User, UserStatus } from '../types';
import { 
  X, 
  UserPlus, 
  User as UserIcon, 
  Building, 
  Lock, 
  Mail, 
  Shield, 
  Save, 
  Power,
  ShieldCheck,
  Calculator,
  Users,
  FileCheck,
  BadgeDollarSign,
  Globe,
  Hash,
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}

const AREA_CONFIG = {
  ['Contabilidad']: { icon: <Calculator size={16} />, desc: 'Balances y Facturas' },
  ['RRHH']: { icon: <Users size={16} />, desc: 'Personal y Beneficios' },
  ['Acreditación']: { icon: <FileCheck size={16} />, desc: 'Certificaciones' },
  ['Finanzas']: { icon: <BadgeDollarSign size={16} />, desc: 'Presupuestos y Flujos' },
  'NONE': { icon: <Globe size={16} />, desc: 'Acceso Central / Auditoría' }
};

export const NewUserModal: React.FC<Props> = ({ isOpen, onClose, userToEdit }) => {
  const { addUser, updateUser, organizationAreas } = useSisreq();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ANALYST);
  const [area, setArea] = useState<Area | 'NONE'>('NONE');
  const [areas, setAreas] = useState<Area[]>([]);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [canSupervise, setCanSupervise] = useState(false);
  const [canReceiveAndDerive, setCanReceiveAndDerive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email || '');
            setRole(userToEdit.role);
            setArea(userToEdit.area || 'NONE');
            setAreas(userToEdit.areas || (userToEdit.area ? [userToEdit.area] : []));
            setStatus(userToEdit.status || 'ACTIVE');
            setCanSupervise(userToEdit.canSupervise || false);
            setCanReceiveAndDerive(userToEdit.canReceiveAndDerive || false);
            setPassword('');
        } else {
            setName('');
            setEmail('');
            setRole(UserRole.ANALYST);
            setArea('Contabilidad');
            setAreas(['Contabilidad']);
            setStatus('ACTIVE');
            setCanSupervise(false);
            setCanReceiveAndDerive(false);
            setPassword('');
        }
    }
  }, [isOpen, userToEdit]);

  const isAreaMandatory = role === UserRole.HEAD || role === UserRole.ANALYST;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === UserRole.SUPERADMIN) {
        setArea('NONE');
        setAreas([]);
    } else if (isAreaMandatory && areas.length === 0) {
        setArea('Contabilidad');
        setAreas(['Contabilidad']);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!userToEdit && !password)) return;
    setError(null);

    const finalArea = areas.length > 0 ? areas[0] : undefined;
    const finalAreas = areas;
    
    try {
        if (userToEdit) {
            const updatedUser: User = {
                ...userToEdit,
                name,
                email,
                role,
                area: finalArea,
                areas: finalAreas,
                status,
                canSupervise,
                canReceiveAndDerive,
                password: password.trim() ? password : userToEdit.password
            };
            await updateUser(updatedUser);
        } else {
            await addUser(name, email, role, password, finalArea, finalAreas, canSupervise, canReceiveAndDerive);
        }
        onClose();
    } catch (err: any) {
        setError(err.message || 'Error al guardar el usuario');
    }
  };

  const isEditMode = !!userToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 border-t-8 border-indigo-600 flex flex-col max-h-[90vh]">
        
        {/* Header - Matching NewRequestModal */}
        <div className="bg-indigo-50/30 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shrink-0">
                <Sparkles size={18} strokeWidth={2.5}/>
             </div>
             <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {isEditMode ? 'MODIFICAR PERFIL' : 'NUEVA ALTA'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold tracking-tighter bg-white px-1.5 py-0.5 rounded border border-slate-100">
                        <Hash size={9}/>IDENTITY-MANAGER
                    </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {isEditMode ? 'Editar Colaborador' : 'Crear Colaborador'}
                </h2>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Matching NewRequestModal Padding */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <form id="user-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <ShieldCheck size={16} className="text-red-600 shrink-0" />
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-tight">
                        {error}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <UserIcon size={12} className="text-indigo-500" /> Nombre Completo
                    </label>
                    <input 
                        required 
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all font-semibold placeholder:text-slate-300" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Nombre y Apellido..." 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} className="text-indigo-500" /> Email Institucional
                    </label>
                    <input 
                        required 
                        type="email" 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all font-semibold placeholder:text-slate-300" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="usuario@institucion.cl" 
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={12} className="text-indigo-500" /> Nivel de Privilegios
                </label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 border border-slate-200/50">
                    {Object.values(UserRole).filter(r => r !== UserRole.ADMIN).map(r => (
                        <button 
                            key={r}
                            type="button" 
                            onClick={() => handleRoleChange(r)} 
                            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${role === r ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building size={12} className="text-indigo-500" /> Unidad Orgánica / Adscripción
                </label>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 transition-all duration-300 ${role === UserRole.SUPERADMIN ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    {(role === UserRole.ADMIN || role === UserRole.SUPERADMIN) && (
                        <button
                            type="button"
                            onClick={() => { setArea('NONE'); setAreas([]); }}
                            className={`
                                flex items-center gap-3 p-2 rounded-xl border text-left transition-all
                                ${areas.length === 0 
                                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}
                            `}
                        >
                            <div className={`p-1.5 rounded-lg transition-all ${areas.length === 0 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                {AREA_CONFIG.NONE.icon}
                            </div>
                            <div className="min-w-0">
                                <div className={`text-[12px] font-bold truncate ${areas.length === 0 ? 'text-indigo-900' : 'text-slate-700'}`}>Acceso Central</div>
                                <div className="text-[8px] text-slate-500 font-medium truncate">{AREA_CONFIG.NONE.desc}</div>
                            </div>
                        </button>
                    )}
                    {organizationAreas.map((a) => {
                        const config = (AREA_CONFIG as any)[a] || { icon: <Building size={16} />, desc: 'Área Organizacional' };
                        const isSelected = areas.includes(a);
                        return (
                            <button
                                key={a}
                                type="button"
                                onClick={() => {
                                    if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) {
                                        setArea(a);
                                        setAreas([a]);
                                    } else {
                                        setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
                                        setArea(a);
                                    }
                                }}
                                className={`
                                    flex items-center gap-3 p-2 rounded-xl border text-left transition-all
                                    ${isSelected 
                                        ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}
                                `}
                            >
                                <div className={`p-1.5 rounded-lg transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                    {config.icon}
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-[12px] font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{a}</div>
                                    <div className="text-[8px] text-slate-500 font-medium truncate">{config.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                {role === UserRole.HEAD && (
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={12} className="text-indigo-500" /> Modo Supervisor
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/50">
                            <button
                                 type="button"
                                 onClick={() => setCanSupervise(true)}
                                 className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${canSupervise ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Sí
                            </button>
                            <button
                                 type="button"
                                 onClick={() => setCanSupervise(false)}
                                 className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${!canSupervise ? 'bg-slate-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}
                <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowLeftRight size={12} className="text-indigo-500" /> Recepción y Derivación
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/50">
                        <button
                             type="button"
                             onClick={() => setCanReceiveAndDerive(true)}
                             className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${canReceiveAndDerive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Sí
                        </button>
                        <button
                             type="button"
                             onClick={() => setCanReceiveAndDerive(false)}
                             className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${!canReceiveAndDerive ? 'bg-slate-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            No
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Lock size={12} className="text-indigo-500" /> Firma Electrónica
                    </label>
                    <input 
                        type="password" 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all font-black tracking-widest" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder={isEditMode ? "••••••••" : "••••"} 
                    />
                </div>

                {isEditMode && (
                    <div className="space-y-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Power size={12} className="text-indigo-500" /> Estado Cuenta
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/50">
                            <button 
                                type="button" 
                                onClick={() => setStatus('ACTIVE')} 
                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${status === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Activo
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setStatus('INACTIVE')} 
                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${status === 'INACTIVE' ? 'bg-slate-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Inactivo
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </form>
        </div>

        {/* Footer - Matching NewRequestModal */}
        <div className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between gap-4 shrink-0">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
            >
                Cancelar
            </button>
            <button
                form="user-form"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95"
            >
                <Save size={14} strokeWidth={3} /> {isEditMode ? 'Guardar Cambios' : 'Confirmar Alta'}
            </button>
        </div>
      </div>
    </div>
  );
};
