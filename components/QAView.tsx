
import React, { useMemo } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, UserRole, RequestCard } from '../types';
import { 
    ShieldCheck, AlertTriangle, CheckCircle2, Search, 
    Database, Activity, Lock, Terminal, Info, 
    CheckSquare, Zap, Shield, Hash, ArrowRight, Eye,
    Trash2, Clock, User
} from 'lucide-react';

export const QAView: React.FC = () => {
  const { requests, users, setSelectedRequestId } = useSisreq();

  const deletedRequests = useMemo(() => requests.filter(r => r.isDeleted), [requests]);

  const auditResults = useMemo(() => {
    const activeRequests = requests.filter(r => !r.isDeleted);
    const findings: { type: 'ERROR' | 'WARNING' | 'INFO', msg: string, id?: string, code: string }[] = [];
    
    // 1. Integridad de Ejecución
    const inExecutionWithoutAnalyst = activeRequests.filter(r => r.status === Status.EJECUCION && !r.assignedAnalyst);
    inExecutionWithoutAnalyst.forEach(r => findings.push({ 
        type: 'ERROR', 
        msg: `Inconsistencia de Proceso: Expediente en fase EJECUCIÓN sin Responsable Técnico asignado.`,
        id: r.id,
        code: 'ERR_PROC_01'
    }));

    // 2. Coherencia de Área
    activeRequests.forEach(r => {
        if (r.assignedAnalyst) {
            const analyst = users.find(u => u.name === r.assignedAnalyst);
            if (analyst && analyst.area !== r.area && analyst.role !== UserRole.SUPERADMIN) {
                findings.push({ 
                    type: 'WARNING', 
                    msg: `Alerta de Jurisdicción: Analista asignado no pertenece al área de gestión del expediente.`,
                    id: r.id,
                    code: 'WARN_JUR_02'
                });
            }
        }
    });

    // 3. Salud de la Matriz
    const orphanRequests = activeRequests.filter(r => !Object.values(Status).includes(r.status));
    orphanRequests.forEach(r => findings.push({ 
        type: 'ERROR', 
        msg: `Corrupción de Estado: El expediente posee un estado no reconocido por el sistema.`,
        id: r.id,
        code: 'ERR_DB_99'
    }));

    // 4. Estadísticas de Auditoría
    const integrityScore = Math.max(0, 100 - (findings.filter(f => f.type === 'ERROR').length * 10));

    return { findings, integrityScore };
  }, [requests, users]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12 bg-[#F8FAFC]">
        
        {/* Header Section Institucional */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-500">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                            <ShieldCheck size={22} strokeWidth={2.5}/>
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Índice de Salud</h3>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SISTEMA INTEGRAL DE AUDITORÍA</p>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight leading-relaxed max-w-[240px]">
                        Evaluación automatizada de coherencia estructural y flujo de procesos en tiempo real.
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-6xl font-black tracking-tighter ${auditResults.integrityScore > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {auditResults.integrityScore}<span className="text-2xl">%</span>
                    </span>
                    <p className="text-[8px] font-black text-slate-300 uppercase mt-2 tracking-widest">INTEGRIDAD DB</p>
                </div>
            </div>
            
            <div className="bg-[#1E293B] p-8 rounded-3xl text-white shadow-lg flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/10">
                            <Activity size={18} strokeWidth={2.5}/>
                        </div>
                        <div>
                           <h3 className="font-black uppercase tracking-widest text-[8px] text-slate-300">Monitoreo</h3>
                           <p className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-0.5">ESTADO: ONLINE</p>
                        </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 uppercase tracking-widest text-[8px] font-black">Activos Auditados</span>
                        <span className="font-black text-base">{requests.filter(r => !r.isDeleted).length}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-full opacity-60"></div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 uppercase tracking-widest text-[8px] font-black">Archivados (Borrado Lógico)</span>
                        <span className="text-indigo-400 font-black text-xs">{deletedRequests.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:border-indigo-100 transition-all">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 group-hover:scale-105 transition-transform shadow-sm">
                    <Zap size={24} strokeWidth={2.5}/>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">SLA 100%</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">NORMATIVA SoD</p>
            </div>
        </div>

        {/* Registro de Hallazgos */}
        <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Shield size={18} className="text-indigo-600" /> Monitoreo de Consistencia Operativa
            </h3>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-[1000px] animate-in fade-in duration-700">
                <div className="grid grid-cols-[100px_120px_1fr_120px_100px] gap-4 px-10 py-5 bg-slate-50/80 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] items-center">
                    <div><Terminal size={10} className="inline mr-1 text-slate-300"/> Gravedad</div>
                    <div><Hash size={10} className="inline mr-1 text-slate-300"/> Nodo / ID</div>
                    <div><Search size={10} className="inline mr-1 text-slate-300"/> Hallazgo Técnico</div>
                    <div><Shield size={10} className="inline mr-1 text-slate-300"/> Código</div>
                    <div className="text-right">Inspección</div>
                </div>

                <div className="divide-y divide-slate-50">
                    {auditResults.findings.length > 0 ? auditResults.findings.map((f, i) => (
                        <div 
                            key={i} 
                            onClick={() => f.id && setSelectedRequestId(f.id)}
                            className="grid grid-cols-[100px_120px_1fr_120px_100px] gap-4 px-10 py-4 items-center hover:bg-indigo-50/30 transition-all group cursor-pointer"
                        >
                            <div>
                                <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border shadow-sm ${
                                    f.type === 'ERROR' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {f.type === 'ERROR' ? 'CRÍTICO' : 'ALERTA'}
                                </span>
                            </div>
                            <div className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50 w-fit">
                                {f.id ? `EXP:${f.id.split('-')[1].toUpperCase()}` : 'SYS_NODE'}
                            </div>
                            <div className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                {f.msg}
                            </div>
                            <div className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-tighter">
                                {f.code}
                            </div>
                            <div className="flex justify-end">
                                <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-all bg-white rounded-lg border border-transparent group-hover:border-indigo-100 group-hover:shadow-md">
                                    <Eye size={16} strokeWidth={2.5}/>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-dashed border-emerald-100">
                                <CheckCircle2 size={32} className="text-emerald-500"/>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cero anomalías operativas</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Archivo de Auditoría - EXPEDIENTES ELIMINADOS */}
        <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Trash2 size={18} className="text-red-600" /> Archivo de Auditoría (Eliminaciones Administrativas)
            </h3>
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden flex flex-col min-w-[1000px] animate-in fade-in duration-700">
                <div className="grid grid-cols-[100px_1fr_150px_150px_100px] gap-4 px-10 py-5 bg-red-50/50 border-b border-red-100 text-[8px] font-black text-red-400 uppercase tracking-[0.15em] items-center">
                    <div><Hash size={10} className="inline mr-1 text-red-300"/> ID</div>
                    <div><Info size={10} className="inline mr-1 text-red-300"/> Título del Expediente</div>
                    <div><Clock size={10} className="inline mr-1 text-red-300"/> Fecha Eliminación</div>
                    <div><User size={10} className="inline mr-1 text-red-300"/> Autor de Orden</div>
                    <div className="text-right">Acción</div>
                </div>

                <div className="divide-y divide-slate-50">
                    {deletedRequests.length > 0 ? deletedRequests.map((r, i) => (
                        <div 
                            key={i} 
                            className="grid grid-cols-[100px_1fr_150px_150px_100px] gap-4 px-10 py-5 items-center hover:bg-red-50/30 transition-all group"
                        >
                            <div className="text-[10px] font-mono font-black text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200 w-fit">
                                #{r.id.split('-')[1].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-black text-slate-800 uppercase truncate group-hover:text-red-600 transition-colors tracking-tight">
                                    {r.title}
                                </div>
                                <div className="text-[8px] text-slate-400 font-bold italic truncate">
                                    Último Estado: {r.status} | Área: {r.area}
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Clock size={12} className="text-slate-300"/>
                                {r.deletedAt ? new Date(r.deletedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                            </div>
                            <div className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">{r.deletedBy?.substring(0,2).toUpperCase()}</div>
                                {r.deletedBy || 'Sistema'}
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setSelectedRequestId(r.id)}
                                    className="p-2.5 text-slate-300 hover:text-red-600 transition-all bg-white rounded-xl border border-slate-100 hover:border-red-200 hover:shadow-md"
                                    title="Ver detalle del archivo"
                                >
                                    <Eye size={16} strokeWidth={2.5}/>
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="bg-slate-50 p-8 rounded-full border border-dashed border-slate-200">
                                <Trash2 size={32} className="text-slate-200"/>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Archivo histórico vacío</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
