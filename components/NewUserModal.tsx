
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
  Hash
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
}

const AREA_CONFIG = {
  [Area.CONTABILIDAD]: { icon: <Calculator size={18} />, desc: 'Balances y Facturas' },
  [Area.RRHH]: { icon: <Users size={18} />, desc: 'Personal y Beneficios' },
  [Area.ACREDITACION]: { icon: <FileCheck size={18} />, desc: 'Certificaciones' },
  [Area.FINANZAS]: { icon: <BadgeDollarSign size={18} />, desc: 'Presupuestos y Flujos' },
  'NONE': { icon: <Globe size={18} />, desc: 'Acceso Centralizado / Auditoría' }
};

export const NewUserModal: React.FC<Props> = ({ isOpen, onClose, userToEdit }) => {
  const { addUser, updateUser } = useSisreq();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ANALYST);
  const [area, setArea] = useState<Area | 'NONE'>('NONE');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');

  useEffect(() => {
    if (isOpen) {
        if (userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email || '');
            setRole(userToEdit.role);
            setArea(userToEdit.area || 'NONE');
            setStatus(userToEdit.status || 'ACTIVE');
            setPassword('');
        } else {
            setName('');
            setEmail('');
            setRole(UserRole.ANALYST);
            setArea(Area.CONTABILIDAD);
            setStatus('ACTIVE');
            setPassword('');
        }
    }
  }, [isOpen, userToEdit]);

  const isAreaMandatory = role === UserRole.HEAD || role === UserRole.ANALYST;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === UserRole.SUPERADMIN) {
        setArea('NONE');
    } else if (isAreaMandatory && area === 'NONE') {
        setArea(Area.CONTABILIDAD);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!userToEdit && !password)) return;

    const finalArea = area !== 'NONE' ? (area as Area) : undefined;
    
    if (userToEdit) {
        const updatedUser: User = {
            ...userToEdit,
            name,
            email,
            role,
            area: finalArea,
            status,
            password: password.trim() ? password : userToEdit.password
        };
        updateUser(updatedUser);
    } else {
        addUser(name, email, role, password, finalArea);
    }
    onClose();
  };

  const isEditMode = !!userToEdit;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[94vh]">
        
        {/* HEADER SECTION */}
        <div className="px-8 py-7 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="bg-[#1E293B] p-3.5 rounded-2xl text-white shadow-xl shadow-slate-200/50 shrink-0">
                <UserPlus size={24} strokeWidth={2.5}/>
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5]">
                        {isEditMode ? 'MODIFICAR PERFIL' : 'NUEVA ALTA'}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase">
                        # IDENTITY-MANAGER
                    </span>
                </div>
                <h2 className="text-2xl font-black text-[#1E293B] tracking-tight">{isEditMode ? 'Editar Colaborador' : 'Crear Colaborador'}</h2>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors p-2">
            <X size={28} />
          </button>
        </div>

        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white px-8 pb-8 pt-2">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-9">
            
            {/* NAME & EMAIL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                        <UserIcon size={14} className="text-slate-400" /> NOMBRE COMPLETO
                    </label>
                    <input 
                        required 
                        autoFocus
                        className="w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] text-[#1E293B] text-sm rounded-2xl px-5 py-5 focus:outline-none focus:border-[#1E293B] transition-all font-bold placeholder:text-slate-300" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Nombre y Apellido..." 
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                        <Mail size={14} className="text-slate-400" /> E-MAIL INSTITUCIONAL
                    </label>
                    <input 
                        required 
                        type="email" 
                        className="w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] text-[#1E293B] text-sm rounded-2xl px-5 py-5 focus:outline-none focus:border-[#1E293B] transition-all font-bold placeholder:text-slate-300" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="usuario@institucion.cl" 
                    />
                </div>
            </div>

            {/* ROLE TOGGLE SELECTOR */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                    <Shield size={14} className="text-slate-400" /> NIVEL DE PRIVILEGIOS OPERATIVOS
                </label>
                <div className="flex bg-[#F1F5F9] p-1.5 rounded-[1.5rem] gap-1 border border-slate-100">
                    {Object.values(UserRole).map(r => (
                        <button 
                            key={r}
                            type="button" 
                            onClick={() => handleRoleChange(r)} 
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === r ? 'bg-[#1E293B] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* AREA SELECTOR CARDS */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                    <Building size={14} className="text-slate-400" /> UNIDAD ORGÁNICA / ADSCRIPCIÓN
                </label>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${role === UserRole.SUPERADMIN ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    {(role === UserRole.ADMIN || role === UserRole.SUPERADMIN) && (
                        <button
                            type="button"
                            onClick={() => setArea('NONE')}
                            className={`
                                relative flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all duration-300 group
                                ${area === 'NONE' 
                                ? 'border-indigo-600 bg-white shadow-lg ring-4 ring-indigo-500/5' 
                                : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-slate-200'}
                            `}
                        >
                            <div className={`p-3 rounded-2xl transition-all ${area === 'NONE' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                {AREA_CONFIG.NONE.icon}
                            </div>
                            <div className="min-w-0">
                                <div className={`text-sm font-black tracking-tight ${area === 'NONE' ? 'text-indigo-900' : 'text-slate-700'}`}>Acceso Transversal</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{AREA_CONFIG.NONE.desc}</div>
                            </div>
                        </button>
                    )}
                    {Object.values(Area).map((a) => {
                        const config = AREA_CONFIG[a];
                        const isSelected = area === a;
                        return (
                            <button
                                key={a}
                                type="button"
                                onClick={() => setArea(a)}
                                className={`
                                    relative flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all duration-300 group
                                    ${isSelected 
                                    ? 'border-indigo-600 bg-white shadow-lg ring-4 ring-indigo-500/5' 
                                    : 'border-[#F1F5F9] bg-[#F8FAFC] hover:border-slate-200'}
                                `}
                            >
                                <div className={`p-3 rounded-2xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                    {config.icon}
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-sm font-black tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{a}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{config.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PASSWORD & STATUS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                        <Lock size={14} className="text-slate-400" /> CONTRASEÑA DE SISTEMA
                    </label>
                    <input 
                        type="password" 
                        className="w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] text-[#1E293B] text-sm rounded-2xl px-5 py-5 focus:outline-none focus:border-[#1E293B] transition-all font-black tracking-widest placeholder:text-slate-300" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder={isEditMode ? "••••••••" : "••••"} 
                    />
                </div>

                {isEditMode && (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                            <Power size={14} className="text-slate-400" /> ESTADO DE CUENTA
                        </label>
                        <div className="flex bg-[#F1F5F9] p-1.5 rounded-[1.5rem] gap-1.5 border border-slate-100">
                            <button 
                                type="button" 
                                onClick={() => setStatus('ACTIVE')} 
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${status === 'ACTIVE' ? 'bg-[#10B981] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                            >
                                Activo
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setStatus('INACTIVE')} 
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${status === 'INACTIVE' ? 'bg-slate-400 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                            >
                                Inactivo
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-white border-t border-slate-100 px-10 py-8 flex items-center justify-between gap-4 shrink-0">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-4 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
                CANCELAR
            </button>
            <button 
                form="user-form"
                type="submit" 
                className="bg-[#1E293B] hover:bg-[#0F172A] text-white py-5 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-300 flex items-center gap-3 transition-all active:scale-95"
            >
                <ShieldCheck size={18} strokeWidth={2.5} /> 
                {isEditMode ? 'GUARDAR CAMBIOS' : 'CONFIRMAR ALTA'}
            </button>
        </div>
      </div>
    </div>
  );
};
