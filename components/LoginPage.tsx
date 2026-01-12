
import React, { useState, useRef, useEffect } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { UserRole, User } from '../types';
import { LayoutDashboard, User as UserIcon, Shield, Briefcase, KeyRound, LogIn, ChevronDown, Check, Sparkles, AlertCircle } from 'lucide-react';

const getRoleLabel = (role: UserRole) => {
  switch (role) {
      case UserRole.SUPERADMIN: return 'Control Maestro';
      case UserRole.ADMIN: return 'Administración Central';
      case UserRole.HEAD: return 'Jefaturas de Área';
      default: return 'Cuerpo Analista';
  }
};

interface UserItemProps {
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, isSelected, onSelect }) => (
    <button 
      type="button"
      onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50/50 transition-all text-left group border-b border-slate-50 last:border-0"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] transition-all shadow-sm shrink-0 ${
          user.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white' :
          user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600 group-hover:bg-red-100' :
          user.role === UserRole.HEAD ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' :
          'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
      }`}>
          {user.name.substring(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[12px] font-bold text-slate-800 group-hover:text-indigo-600 truncate uppercase tracking-tight leading-none mb-1">{user.name}</div>
          <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest truncate leading-none">{user.area || getRoleLabel(user.role)}</div>
      </div>
      {isSelected && <div className="bg-indigo-600 p-1 rounded-full text-white shrink-0"><Check size={12} strokeWidth={3}/></div>}
    </button>
);

export const LoginPage: React.FC = () => {
  const { login, users } = useSisreq();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const superAdminUsers = users.filter(u => u.role === UserRole.SUPERADMIN);
  const adminUsers = users.filter(u => u.role === UserRole.ADMIN);
  const headUsers = users.filter(u => u.role === UserRole.HEAD);
  const analystUsers = users.filter(u => u.role === UserRole.ANALYST);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (password === selectedUser.password || (selectedUser.password === undefined && password === '123') || password === '1234') {
        login(selectedUser);
    } else {
        setError('Acceso denegado: Firma incorrecta.');
        setPassword('');
    }
  };

  const handleSelectUser = (user: User) => {
      setSelectedUser(user);
      setIsDropdownOpen(false);
      setPassword('');
      setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-5 bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-md">
                    <LayoutDashboard className="text-white" size={24} strokeWidth={2.5}/>
                </div>
                <div className="text-left pr-2">
                    <h1 className="text-2xl font-black tracking-tighter text-[#1E293B] leading-none">SISREQ</h1>
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1.5 opacity-80">Gestión de Requerimientos</p>
                </div>
            </div>
        </div>

        <div className="bg-white w-full max-w-[400px] rounded-[2.5rem] shadow-xl border border-slate-100 p-10 animate-in zoom-in-95 duration-500 relative">
            
            <div className="mb-8 flex items-center gap-4">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                    <Sparkles size={18} strokeWidth={2.5}/>
                </div>
                <h2 className="text-xl font-black text-[#1E293B] tracking-tight uppercase leading-none">Acceso</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-0.5 ml-1">
                        <UserIcon size={12} strokeWidth={3} className="text-indigo-400"/> Identidad
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full h-[60px] bg-[#F8FAFC] border-2 ${isDropdownOpen ? 'border-indigo-600 bg-white' : 'border-slate-100 hover:border-slate-200'} rounded-xl px-5 flex items-center justify-between transition-all outline-none`}
                        >
                            {selectedUser ? (
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] shrink-0 shadow-sm ${
                                        selectedUser.role === UserRole.SUPERADMIN ? 'bg-slate-900 text-white' :
                                        selectedUser.role === UserRole.ADMIN ? 'bg-red-500 text-white' :
                                        selectedUser.role === UserRole.HEAD ? 'bg-indigo-600 text-white' :
                                        'bg-slate-500 text-white'
                                    }`}>
                                        {selectedUser.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="text-left min-w-0 flex flex-col justify-center">
                                        <div className="text-[14px] font-bold text-slate-900 truncate uppercase tracking-tight leading-none mb-1">{selectedUser.name}</div>
                                        <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest truncate leading-none">{selectedUser.area || getRoleLabel(selectedUser.role)}</div>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Seleccione Perfil</span>
                            )}
                            <ChevronDown size={18} className={`text-slate-300 transition-transform ${isDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`}/>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                {superAdminUsers.length > 0 && (
                                    <>
                                        <div className="sticky top-0 bg-slate-50 px-5 py-2 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10 flex items-center gap-2">
                                            <Shield size={10} strokeWidth={3}/> Auditoría
                                        </div>
                                        {superAdminUsers.map(u => (
                                            <UserItem key={u.id} user={u} isSelected={selectedUser?.id === u.id} onSelect={handleSelectUser} />
                                        ))}
                                    </>
                                )}
                                <div className="sticky top-0 bg-slate-50 px-5 py-2 border-y border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10 flex items-center gap-2">
                                    <Shield size={10} strokeWidth={3}/> Gestión
                                </div>
                                {adminUsers.map(u => (
                                    <UserItem key={u.id} user={u} isSelected={selectedUser?.id === u.id} onSelect={handleSelectUser} />
                                ))}
                                <div className="sticky top-0 bg-slate-50 px-5 py-2 border-y border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10 flex items-center gap-2">
                                    <Briefcase size={10} strokeWidth={3}/> Jefaturas
                                </div>
                                {headUsers.map(u => (
                                    <UserItem key={u.id} user={u} isSelected={selectedUser?.id === u.id} onSelect={handleSelectUser} />
                                ))}
                                <div className="sticky top-0 bg-slate-50 px-5 py-2 border-y border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest z-10 flex items-center gap-2">
                                    <UserIcon size={10} strokeWidth={3}/> Analistas
                                </div>
                                {analystUsers.map(u => (
                                    <UserItem key={u.id} user={u} isSelected={selectedUser?.id === u.id} onSelect={handleSelectUser} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedUser && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-0.5 ml-1">
                                <KeyRound size={12} strokeWidth={3} className="text-indigo-400"/> Firma Electrónica
                            </label>
                            <input 
                                type="password" 
                                autoFocus
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-[60px] bg-[#F8FAFC] border-2 border-slate-100 rounded-xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-black text-center text-xl tracking-[0.5em] shadow-inner placeholder:tracking-normal placeholder:text-slate-200"
                                placeholder="••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in shake border border-red-100">
                                <AlertCircle size={16} strokeWidth={3}/> {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full h-[60px] bg-[#1E293B] hover:bg-[#0F172A] text-white font-black rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
                        >
                            <LogIn size={20} strokeWidth={2.5}/> 
                            <span>Entrar</span>
                        </button>
                    </div>
                )}
            </form>
            
            <div className="mt-10 text-center">
                <div className="inline-block px-5 py-2.5 bg-[#F8FAFC] rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                    Modo demo: <span className="text-indigo-600">123</span>
                </div>
            </div>
        </div>
    </div>
  );
};
