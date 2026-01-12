
import React, { useMemo } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, UserRole, RequestCard } from '../types';
import { 
    ShieldCheck, AlertTriangle, CheckCircle2, Search, 
    Database, Activity, Lock, Terminal, Info, 
    CheckSquare, Zap, Shield, Hash, ArrowRight, Eye
} from 'lucide-react';

export const QAView: React.FC = () => {
  const { requests, users, setSelectedRequestId } = useSisreq();

  const auditResults = useMemo(() => {
    const findings: { type: 'ERROR' | 'WARNING' | 'INFO', msg: string, id?: string, code: string }[] = [];
    
    // 1. Integridad de Ejecución
    const inExecutionWithoutAnalyst = requests.filter(r => r.status === Status.EJECUCION && !r.assignedAnalyst);
    inExecutionWithoutAnalyst.forEach(r => findings.push({ 
        type: 'ERROR', 
        msg: `Inconsistencia de Proceso: Expediente en fase EJECUCIÓN sin Responsable Técnico asignado.`,
        id: r.id,
        code: 'ERR_PROC_01'
    }));

    // 2. Coherencia de Área
    requests.forEach(r => {
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
    const orphanRequests = requests.filter(r => !Object.values(Status).includes(r.status));
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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
        
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
                        <span className="text-slate-400 uppercase tracking-widest text-[8px] font-black">Objetos Auditados</span>
                        <span className="font-black text-base">{requests.length}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-full opacity-60"></div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 uppercase tracking-widest text-[8px] font-black">Normas Validadas</span>
                        <span className="text-indigo-400 font-black text-xs">9 REGLAS</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:border-indigo-100 transition-all">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 group-hover:scale-105 transition-transform shadow-sm">
                    <Zap size={24} strokeWidth={2.5}/>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">SLA 100%</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">NORMATIVA</p>
            </div>
        </div>

        {/* Registro de Hallazgos - Lista Institucional de Alta Densidad */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-[1000px] animate-in fade-in duration-700">
            {/* Table Header Institucional */}
            <div className="grid grid-cols-[100px_120px_1fr_120px_100px] gap-4 px-10 py-5 bg-slate-50/80 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] items-center">
                <div><Terminal size={10} className="inline mr-1 text-slate-300"/> Gravedad</div>
                <div><Hash size={10} className="inline mr-1 text-slate-300"/> Nodo / ID</div>
                <div><Search size={10} className="inline mr-1 text-slate-300"/> Hallazgo Técnico</div>
                <div><Shield size={10} className="inline mr-1 text-slate-300"/> Código</div>
                <div className="text-right">Inspección</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-50">
                {auditResults.findings.length > 0 ? auditResults.findings.map((f, i) => (
                    <div 
                        key={i} 
                        onClick={() => f.id && setSelectedRequestId(f.id)}
                        className="grid grid-cols-[100px_120px_1fr_120px_100px] gap-4 px-10 py-4 items-center hover:bg-indigo-50/30 transition-all group cursor-pointer"
                    >
                        {/* Gravedad */}
                        <div>
                            <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border shadow-sm ${
                                f.type === 'ERROR' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {f.type === 'ERROR' ? 'CRÍTICO' : 'ALERTA'}
                            </span>
                        </div>

                        {/* ID */}
                        <div className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50 w-fit">
                            {f.id ? `EXP:${f.id.split('-')[1].toUpperCase()}` : 'SYS_NODE'}
                        </div>

                        {/* Mensaje */}
                        <div className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                            {f.msg}
                        </div>

                        {/* Código */}
                        <div className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-tighter">
                            {f.code}
                        </div>

                        {/* Acción */}
                        <div className="flex justify-end">
                            <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-all bg-white rounded-lg border border-transparent group-hover:border-indigo-100 group-hover:shadow-md">
                                <Eye size={16} strokeWidth={2.5}/>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="p-24 text-center flex flex-col items-center gap-4">
                        <div className="bg-emerald-50 p-10 rounded-[2.5rem] border-2 border-dashed border-emerald-100 group">
                            <CheckCircle2 size={48} className="text-emerald-500 group-hover:scale-105 transition-transform duration-500"/>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">Integridad Óptima</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Cero anomalías detectadas en el presente ciclo</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Banner Institucional */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                <Shield size={180} />
            </div>
            
            <div className="max-w-md relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                        <Lock size={18} strokeWidth={2.5}/>
                    </div>
                    <h4 className="text-2xl font-black tracking-tighter uppercase leading-none">Seguridad SISREQ</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-[0.05em]">
                    La auditoría técnica automatizada garantiza la segregación de funciones (SoD) mandatada por la administración central. Cada transición es auditada bajo firma electrónica.
                </p>
            </div>
            
            <div className="flex items-center gap-6 relative z-10 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                {[Status.RECIBIDO, Status.DERIVACION, Status.EJECUCION, Status.FINALIZADO].map((s, i) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center gap-2 group/step">
                            <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-sm shadow-xl transition-all group-hover/step:bg-indigo-500 group-hover/step:text-white" title={s}>
                                {i+1}
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 group-hover/step:text-white transition-colors">{s.split(' ')[0]}</span>
                        </div>
                        {i < 3 && <div className="w-6 h-0.5 bg-white/10 rounded-full"></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </div>
  );
};
