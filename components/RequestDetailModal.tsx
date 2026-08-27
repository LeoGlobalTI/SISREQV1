
import React, { useState, useEffect, useMemo } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { STATUS_BADGE_COLORS } from '../constants';
import { UserRole, Status } from '../types';
import { 
    X, User, Building, Clock, Save, Send, 
    RotateCcw, CheckCircle2, Hash, PlayCircle, Trash2,
    ShieldAlert, UserCheck, History, ClipboardList, PenTool,
    ShieldCheck, MapPin, Loader2, Info, FileStack, Archive
} from 'lucide-react';

export const RequestDetailModal: React.FC = () => {
  const { 
    selectedRequestId, 
    setSelectedRequestId, 
    requests, 
    currentUser, 
    updateStatus, 
    deleteRequest,
    returnRequest, 
    assignAnalyst,
    updateRequestDetails,
    addLog,
    users,
    activeRole,
    canUserTransition
  } = useSisreq();

  const [returnReason, setReturnReason] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);
  const [showAnalystSelect, setShowAnalystSelect] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [newComment, setNewComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const data = useMemo(() => requests.find(r => r.id === selectedRequestId), [requests, selectedRequestId]);

  // Se muestran todos los logs sin excepción para trazabilidad total
  const allLogs = useMemo(() => {
    if (!data || !data.logs) return [];
    const logsArray = Array.isArray(data.logs) ? data.logs : [];
    return [...logsArray].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data]);

  const availableAssignees = useMemo(() => {
    if (!data) return [];
    return users.filter(u => 
        (u.areas?.includes(data.area) || u.area === data.area) && 
        (u.status === 'ACTIVE' || !u.status) &&
        (u.role === UserRole.HEAD || u.role === UserRole.ANALYST || u.role === UserRole.ADMIN)
    ).sort((a, b) => {
        if (a.role === UserRole.HEAD && b.role !== UserRole.HEAD) return -1;
        if (a.role !== UserRole.HEAD && b.role === UserRole.HEAD) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [users, data?.area]);

  useEffect(() => {
     if (data) {
        setEditTitle(data.title);
        setEditDetail(data.detail);
        setIsEditing(false);
        setShowReturnInput(false);
        setShowAnalystSelect(false);
        setNewComment('');
        setActionError(null);
        setReturnReason('');
        setIsDeleting(false);
     }
  }, [selectedRequestId, data]);

  if (!selectedRequestId || !data || !currentUser) return null;

  const handleClose = () => {
    if (isDeleting) return; 
    setSelectedRequestId(null);
  };

  const isFinalized = data.status === Status.FINALIZADO;
  const isArchived = !!data.isDeleted;

  const handleTransition = async (targetStatus: Status) => {
    setActionError(null);
    try {
        await updateStatus(data.id, targetStatus);
        handleClose();
    } catch (e: any) {
        setActionError(e.message);
    }
  };

  const handleDeleteRequest = async () => {
    const confirmation = confirm('¿ELIMINAR ESTE EXPEDIENTE DE FORMA PERMANENTE? Esta acción no se puede deshacer.');
    if (!confirmation) return;

    setActionError(null);
    setIsDeleting(true);
    
    try {
      const idToDelete = data.id;
      await deleteRequest(idToDelete);
      setSelectedRequestId(null);
    } catch (e: any) {
      setActionError(`Error de Sistema: ${e.message || 'No se pudo eliminar el registro.'}`);
      setIsDeleting(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!returnReason.trim()) {
        setActionError("Debe especificar justificación técnica.");
        return;
    }
    try {
        await returnRequest(data.id, returnReason);
        setShowReturnInput(false);
        setReturnReason('');
        handleClose();
    } catch (e: any) {
        setActionError(e.message);
    }
  };

  const handleAssignAnalyst = async (analystName: string) => {
    setActionError(null);
    try {
        await assignAnalyst(data.id, analystName);
        setShowAnalystSelect(false);
    } catch (e: any) {
        setActionError(e.message);
    }
  };

  const handleSaveChanges = async () => {
    if (editTitle.trim() && editDetail.trim()) {
        setActionError(null);
        try {
            await updateRequestDetails(data.id, editTitle, editDetail);
            setIsEditing(false);
        } catch (e: any) {
            setActionError(e.message);
        }
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
        setActionError(null);
        try {
            await addLog(data.id, `NOTA: ${newComment.trim()}`);
            setNewComment('');
        } catch (e: any) {
            setActionError(e.message);
        }
    }
  };

  const canDeriveUI = !isArchived && canUserTransition(data, Status.DERIVACION).allowed;
  const canFinalizeUI = !isArchived && canUserTransition(data, Status.FINALIZADO).allowed;
  const canEditUI = !isArchived && (activeRole === UserRole.ADMIN || activeRole === UserRole.SUPERADMIN || (currentUser.canReceiveAndDerive && data.status === Status.RECIBIDO)) && !isFinalized;
  const showReturnButton = !isArchived && canUserTransition(data, Status.RECIBIDO).allowed && !isFinalized;
  const canAssignUI = !isArchived && (activeRole === UserRole.HEAD || activeRole === UserRole.ADMIN || activeRole === UserRole.SUPERADMIN) && data.status === Status.DERIVACION;

  const isSuperAdmin = currentUser.role === UserRole.SUPERADMIN || activeRole === UserRole.SUPERADMIN;

  const getLogStyle = (msg: string) => {
    if (msg.startsWith('SISTEMA:')) return { bg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-600', icon: 'S' };
    if (msg.startsWith('FLUJO:')) return { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-600', icon: 'F' };
    if (msg.startsWith('RETORNO:')) return { bg: 'bg-red-50/50', border: 'border-red-100', text: 'text-red-600', icon: 'R' };
    if (msg.startsWith('AUDITORÍA:')) return { bg: 'bg-slate-900', border: 'border-slate-800', text: 'text-white', icon: 'A' };
    if (msg.startsWith('EDICIÓN:')) return { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-600', icon: 'E' };
    if (msg.startsWith('ASIGNACIÓN:')) return { bg: 'bg-blue-50/50', border: 'border-blue-100', text: 'text-blue-600', icon: 'D' };
    return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600', icon: 'N' };
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
      <div className={`relative bg-white rounded-2xl md:rounded-[1.75rem] shadow-2xl w-full max-w-[914px] max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 border-t-8 ${isArchived ? 'border-slate-900' : isFinalized ? 'border-emerald-600' : 'border-indigo-600'}`}>
        
        {isDeleting && (
            <div className="absolute inset-0 z-[70] bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-in fade-in">
                <Loader2 size={40} className="text-red-600 animate-spin" />
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Eliminando Expediente...</p>
            </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-3.5 flex justify-between items-center shrink-0 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
             <div className={`p-2 rounded-xl text-white shrink-0 shadow-md ${isArchived ? 'bg-slate-900' : isFinalized ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                {isArchived ? <Archive size={16} strokeWidth={2.5}/> : isFinalized ? <CheckCircle2 size={16} strokeWidth={2.5}/> : <ClipboardList size={16} strokeWidth={2.5} />}
             </div>
             <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm ring-1 ring-black/5 ${isArchived ? 'bg-slate-900 text-white' : STATUS_BADGE_COLORS[data.status]}`}>
                        {isArchived ? 'ARCHIVADO' : data.status.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-black bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 uppercase">
                        #{data.id.split('-')[1]?.toUpperCase() || 'SYS'}
                    </span>
                </div>
                {isEditing ? (
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-base font-black text-slate-900 w-full bg-white border-b-2 border-indigo-600 outline-none uppercase tracking-tight" />
                ) : (
                    <h2 className="text-base font-black text-slate-900 truncate uppercase tracking-tight leading-none">{data.title}</h2>
                )}
             </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-colors"><X size={18} /></button>
        </div>

        {/* Modal Body: Two-Column Layout (Left: Requerimiento Details, Right: Historial / Log) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0 bg-white">
            
            {/* Columna Izquierda: Detalle del Requerimiento */}
            <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar flex flex-col">
                {isArchived && (
                    <div className="bg-red-50 border-2 border-dashed border-red-200 p-3.5 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                        <ShieldAlert size={20} className="text-red-600 shrink-0" />
                        <div>
                            <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">EXPEDIENTE EN ARCHIVO DE AUDITORÍA</p>
                            <p className="text-[8px] text-red-600 font-bold italic">
                                Archivado por {data.deletedBy} el {new Date(data.deletedAt!).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><PenTool size={11} className="text-indigo-600"/> ALCANCE TÉCNICO</label>
                        {canEditUI && !isEditing && <button onClick={() => setIsEditing(true)} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100">EDITAR</button>}
                    </div>
                    {isEditing ? (
                        <textarea value={editDetail} onChange={e => setEditDetail(e.target.value)} className="w-full bg-slate-50 border border-indigo-100 p-3 rounded-xl text-xs text-slate-900 leading-relaxed outline-none min-h-[90px] font-bold" />
                    ) : (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic text-slate-600 text-xs leading-relaxed">"{data.detail}"</div>
                    )}
                    {isEditing && (
                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setIsEditing(false)} className="px-2.5 py-1 text-[8px] font-black text-slate-400 uppercase">CANCELAR</button>
                            <button onClick={handleSaveChanges} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase shadow-md flex items-center gap-1.5 active:scale-95 transition-all"><Save size={12}/> GUARDAR</button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SOLICITANTE</p>
                        <p className="text-[10px] font-black text-slate-900 truncate uppercase">{data.requester}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">GESTIÓN ÁREA</p>
                        <p className="text-[10px] font-black text-slate-900 uppercase">{data.area}</p>
                    </div>
                </div>

                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3 relative">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md shrink-0 ${data.assignedAnalyst ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                        {data.assignedAnalyst ? data.assignedAnalyst.substring(0,2).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">RESPONSABLE DESIGNADO</p>
                        <p className={`text-xs font-black uppercase tracking-tight truncate ${data.assignedAnalyst ? 'text-slate-900' : 'text-slate-400 italic'}`}>{data.assignedAnalyst || 'Pendiente de asignación'}</p>
                    </div>
                    {canAssignUI && (
                        <div className="relative shrink-0">
                            <button onClick={() => setShowAnalystSelect(!showAnalystSelect)} className="bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-xs flex items-center gap-1.5">
                               <User size={11}/> ASIGNAR
                            </button>
                            {showAnalystSelect && (
                                <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-slate-200 shadow-2xl rounded-xl p-2 z-[70] animate-in slide-in-from-top-2">
                                    <div className="px-2.5 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Personal del Área {data.area}</div>
                                    <div className="max-h-44 overflow-y-auto custom-scrollbar">
                                        {availableAssignees.length > 0 ? availableAssignees.map((u, idx) => (
                                            <button 
                                                key={u.id || `assignee-${idx}`} 
                                                onClick={() => handleAssignAnalyst(u.name)} 
                                                className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 rounded-lg transition-colors group/item"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-slate-700 uppercase group-hover/item:text-indigo-600">{u.name}</span>
                                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-tighter ${
                                                        u.role === UserRole.HEAD ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                        {u.role === UserRole.HEAD ? 'JEFATURA' : 'ANALISTA'}
                                                    </span>
                                                </div>
                                            </button>
                                        )) : <div className="px-3 py-3 text-[8px] text-slate-400 italic uppercase text-center">No hay personal activo en esta unidad</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Columna Derecha: Historial y Log de Seguimiento */}
            <div className="p-5 space-y-3 bg-slate-50/60 flex flex-col overflow-hidden min-h-[300px]">
                <div className="flex items-center justify-between shrink-0">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                        <History size={13} className="text-indigo-600"/> LOG DE SEGUIMIENTO
                    </label>
                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
                        {allLogs.length} {allLogs.length === 1 ? 'evento' : 'eventos'}
                    </span>
                </div>
                
                {!isArchived && (
                    <div className="flex gap-1.5 shrink-0">
                        <input 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)} 
                            placeholder="AÑADIR COMENTARIO TÉCNICO..." 
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:border-indigo-600 shadow-xs" 
                            onKeyPress={e => e.key === 'Enter' && handleAddComment()} 
                        />
                        <button 
                            onClick={handleAddComment} 
                            disabled={!newComment.trim()} 
                            className="bg-slate-900 text-white px-3.5 py-2 rounded-xl disabled:opacity-20 hover:bg-black transition-all shadow-md flex items-center justify-center shrink-0"
                            title="Añadir comentario técnico"
                        >
                            <Send size={13}/>
                        </button>
                    </div>
                )}

                <div className="flex-1 space-y-2.5 pl-3.5 border-l-2 border-slate-200 ml-1.5 overflow-y-auto custom-scrollbar pt-1.5 pr-1 min-h-0">
                    {allLogs.length > 0 ? allLogs.map((log, idx) => {
                        const style = getLogStyle(log.message);
                        return (
                            <div key={log.id || `log-${idx}`} className="relative py-0.5">
                                <div className={`absolute -left-[19px] top-2.5 w-2.5 h-2.5 rounded-full bg-white border-2 flex items-center justify-center text-[4px] font-black ${style.border} ${style.text}`}>
                                    {style.icon}
                                </div>
                                <div className={`p-2.5 rounded-lg border transition-all ${style.bg} ${style.border} shadow-xs`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-[8px] font-black uppercase ${log.message.startsWith('AUDITORÍA:') ? 'text-indigo-300' : 'text-slate-900'}`}>
                                            {log.actor} <span className="opacity-40 ml-0.5">[{log.role}]</span>
                                        </span>
                                        <span className={`text-[7px] font-mono ${log.message.startsWith('AUDITORÍA:') ? 'text-slate-400' : 'text-slate-400'}`}>
                                            {new Date(log.timestamp).toLocaleString([], {day:'2-digit', month:'2-digit', hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase leading-tight ${log.message.startsWith('AUDITORÍA:') ? 'text-white' : 'text-slate-600'}`}>
                                        {log.message}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : <p className="text-[9px] text-center text-slate-300 uppercase tracking-widest py-8">Sin actividad registrada</p>}
                </div>
            </div>
        </div>

        {/* Modal Footer: Acciones del Expediente */}
        {!isArchived && (
            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex flex-col gap-2.5 shrink-0">
                {actionError && <div className="bg-red-50 p-2 rounded-lg text-red-600 text-[8px] font-black uppercase text-center border border-red-100 flex items-center justify-center gap-1.5 animate-bounce"><ShieldAlert size={12}/> {actionError}</div>}
                
                {showReturnInput && (
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100 animate-in slide-in-from-bottom-2">
                        <input autoFocus value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="JUSTIFICACIÓN TÉCNICA O MOTIVO DE DEVOLUCIÓN..." className="flex-1 bg-white border border-red-200 px-3 py-2 rounded-lg text-[9px] font-black text-red-900 uppercase outline-none shadow-inner" />
                        <button onClick={handleReturnSubmit} className="bg-red-600 text-white px-3.5 py-2 rounded-lg text-[9px] font-black uppercase shadow-lg">RETORNAR</button>
                        <button onClick={() => setShowReturnInput(false)} className="p-1 text-red-400"><X size={18}/></button>
                    </div>
                )}

                <div className="flex items-center gap-2.5">
                    {isSuperAdmin && (
                        <button 
                            onClick={handleDeleteRequest}
                            disabled={isDeleting}
                            className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all shadow-xs group border
                            ${isDeleting ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border-slate-200'}`}
                            title="Eliminar Expediente (SuperAdmin)"
                        >
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} className="group-hover:scale-110 transition-transform"/>}
                        </button>
                    )}
                    <div className="flex-1 flex gap-2">
                        {showReturnButton && !showReturnInput && <button onClick={() => setShowReturnInput(true)} className="flex-1 px-3 h-10 bg-white border border-red-200 text-[9px] font-black text-red-600 rounded-xl uppercase flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"><RotateCcw size={13}/> RETORNAR A CENTRAL</button>}
                        {canDeriveUI && <button onClick={() => handleTransition(Status.DERIVACION)} className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md flex items-center justify-center gap-1.5 hover:bg-indigo-700 px-3 transition-all"><UserCheck size={13}/> DERIVAR A UNIDAD</button>}
                        {canFinalizeUI && <button onClick={() => handleTransition(Status.FINALIZADO)} className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md flex items-center justify-center gap-1.5 hover:bg-emerald-700 px-3 transition-all"><ShieldCheck size={13}/> CERRAR EXPEDIENTE</button>}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
