
import React, { useState, useEffect } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Area, Priority, UserRole } from '../types';
import { 
  X, FileText, Building, AlertCircle, User, 
  AlignLeft, Send, Sparkles, Calculator, 
  Users, FileCheck, BadgeDollarSign, ChevronRight,
  Hash, Tag, ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AREA_CONFIG = {
  [Area.CONTABILIDAD]: { icon: <Calculator size={16} />, color: 'indigo', desc: 'Balances y Facturas' },
  [Area.RRHH]: { icon: <Users size={16} />, color: 'emerald', desc: 'Personal y Beneficios' },
  [Area.ACREDITACION]: { icon: <FileCheck size={16} />, color: 'blue', desc: 'Certificaciones' },
  [Area.FINANZAS]: { icon: <BadgeDollarSign size={16} />, color: 'amber', desc: 'Presupuestos y Flujos' },
};

export const NewRequestModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addRequest, currentUser, activeRole } = useSisreq();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [requester, setRequester] = useState('');
  const [area, setArea] = useState<Area>(Area.CONTABILIDAD);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  // Efecto para auto-seleccionar el área si el usuario es Jefatura
  useEffect(() => {
    if (isOpen && activeRole === UserRole.HEAD && currentUser?.area) {
        setArea(currentUser.area);
    }
  }, [isOpen, activeRole, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !detail || !requester) return;
    addRequest(title, detail, area, priority, requester);
    setTitle('');
    setDetail('');
    setRequester('');
    onClose();
  };

  const isHeadSelection = activeRole === UserRole.HEAD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 border-t-8 border-indigo-600 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-indigo-50/30 border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shrink-0">
                <Sparkles size={18} strokeWidth={2.5}/>
             </div>
             <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        NUEVO TICKET
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold tracking-tighter bg-white px-1.5 py-0.5 rounded border border-slate-100">
                        <Hash size={9}/>AUTOGENERADO
                    </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Registrar Requerimiento</h2>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <form id="new-request-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {isHeadSelection && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
                        Modo Jefatura: El requerimiento será asignado automáticamente a su área ({currentUser?.area}).
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origen */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} className="text-indigo-500" /> Origen Solicitud
                  </label>
                  <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 font-semibold"
                      value={requester}
                      onChange={(e) => setRequester(e.target.value)}
                      placeholder="Unidad solicitante..."
                      autoFocus
                  />
                </div>

                {/* Título */}
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Tag size={12} className="text-indigo-500" /> Asunto
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Resumen del ticket..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Building size={12} className="text-indigo-500" /> Área Gestión
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                        {(Object.values(Area)).map((a) => {
                            const config = AREA_CONFIG[a];
                            const isSelected = area === a;
                            const isDisabled = isHeadSelection && currentUser?.area !== a;
                            
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => setArea(a)}
                                    className={`
                                        flex items-center gap-3 p-2 rounded-xl border text-left transition-all
                                        ${isSelected 
                                            ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                                            : isDisabled 
                                                ? 'opacity-40 grayscale cursor-not-allowed border-transparent bg-slate-50'
                                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}
                                    `}
                                >
                                    <div className={`
                                        p-1.5 rounded-lg transition-all
                                        ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 border border-slate-100'}
                                    `}>
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

                <div className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} className="text-indigo-500" /> Urgencia
                    </label>
                    <div className="flex flex-col bg-slate-50 p-2 rounded-xl gap-1.5 border border-slate-100">
                        {(Object.values(Priority)).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`
                                    w-full py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border
                                    ${priority === p 
                                        ? p === Priority.HIGH ? 'bg-red-600 border-red-700 text-white shadow-sm' :
                                          p === Priority.MEDIUM ? 'bg-amber-500 border-amber-600 text-white shadow-sm' :
                                          'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                                        : 'bg-white border-white text-slate-400 hover:border-slate-100'}
                                `}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detalle */}
            <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={12} className="text-indigo-500" /> Memoria Descriptiva
                </label>
                <textarea
                    required
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium leading-relaxed italic"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Detalle los alcances técnicos..."
                />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between gap-4 shrink-0">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
            >
                Cancelar
            </button>
            <button
                form="new-request-form"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95"
            >
                <Send size={14} strokeWidth={3}/> Registrar Ticket
            </button>
        </div>
      </div>
    </div>
  );
};
