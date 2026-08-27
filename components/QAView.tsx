import React, { useMemo, useState, useRef } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, UserRole, RequestCard, RequestLog } from '../types';
import { 
    ShieldCheck, AlertTriangle, CheckCircle2, Search, 
    Database, Activity, Lock, Terminal, Info, 
    CheckSquare, Zap, Shield, Hash, ArrowRight, Eye,
    Trash2, Clock, User, FileText, Filter, RefreshCw,
    X, AlertOctagon, ArrowUpRight, History, Layers
} from 'lucide-react';

type QATab = 'DIAGNOSTICO' | 'TRAZABILIDAD' | 'BOVEDA';

export const QAView: React.FC = () => {
  const { requests, users, setSelectedRequestId, hardDeleteAllRequests } = useSisreq();

  const [activeTab, setActiveTab] = useState<QATab>('DIAGNOSTICO');
  const [findingFilter, setFindingFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
  const [findingSearch, setFindingSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<string>('ALL');
  const [vaultSearch, setVaultSearch] = useState('');

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');

  const deletedRequests = useMemo(() => requests.filter(r => r.isDeleted), [requests]);
  const activeRequests = useMemo(() => requests.filter(r => !r.isDeleted), [requests]);

  // Resizable Columns State
  const [monColWidths, setMonColWidths] = useState<number[]>([100, 120, 450, 120, 100]);
  const resizingMonRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);
  const [archColWidths, setArchColWidths] = useState<number[]>([100, 450, 150, 150, 100]);
  const resizingArchRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const handleResizing = (widths: number[], setWidths: React.Dispatch<React.SetStateAction<number[]>>, ref: React.MutableRefObject<any>) => {
    const onMouseMove = (e: MouseEvent) => {
        if (!ref.current) return;
        const { index, startX, startWidth } = ref.current;
        const delta = e.clientX - startX;
        const newWidths = [...widths];
        newWidths[index] = Math.max(50, startWidth + delta);
        setWidths(newWidths);
    };
    const onMouseUp = () => {
        ref.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'default';
    };
    return { onMouseMove, onMouseUp };
  };

  const startResizeMon = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingMonRef.current = { index, startX: e.clientX, startWidth: monColWidths[index] };
    const { onMouseMove, onMouseUp } = handleResizing(monColWidths, setMonColWidths, resizingMonRef);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const startResizeArch = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingArchRef.current = { index, startX: e.clientX, startWidth: archColWidths[index] };
    const { onMouseMove, onMouseUp } = handleResizing(archColWidths, setArchColWidths, resizingArchRef);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const monGridTemplate = useMemo(() => monColWidths.map(w => `${w}px`).join(' '), [monColWidths]);
  const archGridTemplate = useMemo(() => archColWidths.map(w => `${w}px`).join(' '), [archColWidths]);

  // Auditoría Diagnóstica Integral
  const auditResults = useMemo(() => {
    const findings: { type: 'ERROR' | 'WARNING' | 'INFO', msg: string, id?: string, code: string }[] = [];
    const now = Date.now();
    
    // 1. Integridad de Ejecución (Sin Analista)
    const inExecutionWithoutAnalyst = activeRequests.filter(r => r.status === Status.EJECUCION && !r.assignedAnalyst);
    inExecutionWithoutAnalyst.forEach(r => findings.push({ 
        type: 'ERROR', 
        msg: `EXPEDIENTE EN EJECUCIÓN SIN ANALISTA ASIGNADO.`,
        id: r.id,
        code: 'ERR_PROC_01'
    }));

    // 2. Coherencia de Área / Jurisdicción
    activeRequests.forEach(r => {
        if (r.assignedAnalyst) {
            const analyst = users.find(u => u.name.toLowerCase() === r.assignedAnalyst?.toLowerCase());
            if (analyst && analyst.area && analyst.area !== r.area && analyst.role !== UserRole.SUPERADMIN) {
                findings.push({ 
                    type: 'WARNING', 
                    msg: `ALERTA DE JURISDICCIÓN: EL ANALISTA ${analyst.name.toUpperCase()} PERTENECE A ${analyst.area.toUpperCase()} PERO EL TICKET ES DE ${r.area.toUpperCase()}.`,
                    id: r.id,
                    code: 'WARN_JUR_02'
                });
            }
        }
    });

    // 3. Hallazgo de Cierre sin Fecha Finalizado
    activeRequests.forEach(r => {
        if (r.status === Status.FINALIZADO && !r.finishedAt) {
            findings.push({
                type: 'ERROR',
                msg: `INCONSISTENCIA TEMPORAL: EXPEDIENTE FINALIZADO SIN FECHA DE CIERRE (FINISHEDAT).`,
                id: r.id,
                code: 'ERR_TIME_03'
            });
        }
    });

    // 4. Excedente de SLA ANSI (> 5 días en curso)
    activeRequests.forEach(r => {
        if (r.status !== Status.FINALIZADO) {
            const diffDays = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 5) {
                findings.push({
                    type: 'WARNING',
                    msg: `SLA ANSI EXCEDIDO: ${diffDays.toFixed(1)} DÍAS HÁBILES ACTIVOS SIN RESOLUCIÓN.`,
                    id: r.id,
                    code: 'WARN_SLA_04'
                });
            }
        }
    });

    // 5. Integridad de Solicitante
    activeRequests.forEach(r => {
        if (r.requester) {
            const userExists = users.some(u => u.name.toLowerCase() === r.requester?.toLowerCase());
            if (!userExists) {
                findings.push({
                    type: 'WARNING',
                    msg: `SOLICITANTE NO REGISTRADO: "${r.requester}" NO FIGURA EN EL DIRECTORIO ACTIVO.`,
                    id: r.id,
                    code: 'WARN_USER_05'
                });
            }
        }
    });

    const errorCount = findings.filter(f => f.type === 'ERROR').length;
    const warnCount = findings.filter(f => f.type === 'WARNING').length;
    const integrityScore = Math.max(0, 100 - (errorCount * 15) - (warnCount * 5));

    return { findings, integrityScore, errorCount, warnCount };
  }, [activeRequests, users]);

  const filteredFindings = useMemo(() => {
    return auditResults.findings.filter(f => {
        if (findingFilter !== 'ALL' && f.type !== findingFilter) return false;
        if (!findingSearch.trim()) return true;
        const term = findingSearch.toLowerCase();
        return f.msg.toLowerCase().includes(term) || f.code.toLowerCase().includes(term) || (f.id && f.id.toLowerCase().includes(term));
    });
  }, [auditResults.findings, findingFilter, findingSearch]);

  // Registro Global Forense de Logs
  const globalAuditLogs = useMemo(() => {
    const allLogs: {
        id: string;
        requestId: string;
        requestTitle: string;
        area: string;
        author: string;
        authorRole: string;
        action: string;
        timestamp: string;
        details?: string;
    }[] = [];

    requests.forEach(r => {
        if (r.logs && Array.isArray(r.logs)) {
            r.logs.forEach(l => {
                allLogs.push({
                    id: l.id || `${r.id}-${l.timestamp}`,
                    requestId: r.id,
                    requestTitle: r.title,
                    area: r.area,
                    author: l.author || 'Sistema',
                    authorRole: l.authorRole || 'SYSTEM',
                    action: l.action || 'EVENTO',
                    timestamp: l.timestamp || r.createdAt,
                    details: l.details
                });
            });
        }
    });

    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [requests]);

  const filteredLogs = useMemo(() => {
    return globalAuditLogs.filter(log => {
        if (logActionFilter !== 'ALL' && !log.action.toLowerCase().includes(logActionFilter.toLowerCase())) return false;
        if (!logSearch.trim()) return true;
        const term = logSearch.toLowerCase();
        return (
            log.author.toLowerCase().includes(term) ||
            log.action.toLowerCase().includes(term) ||
            log.requestId.toLowerCase().includes(term) ||
            log.requestTitle.toLowerCase().includes(term) ||
            (log.details && log.details.toLowerCase().includes(term))
        );
    });
  }, [globalAuditLogs, logActionFilter, logSearch]);

  const filteredVault = useMemo(() => {
    if (!vaultSearch.trim()) return deletedRequests;
    const term = vaultSearch.toLowerCase();
    return deletedRequests.filter(r => 
        r.id.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        (r.deletedBy && r.deletedBy.toLowerCase().includes(term)) ||
        r.area.toLowerCase().includes(term)
    );
  }, [deletedRequests, vaultSearch]);

  const ResizeHandle = ({ onStart }: { onStart: (e: React.MouseEvent) => void }) => (
    <div 
      onMouseDown={onStart}
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400/50 active:bg-indigo-600 transition-colors z-30"
    />
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
        {/* Header Institucional Master */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
                        <ShieldCheck size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                AUDITORÍA MASTER
                            </span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                • Powered by Global TI 2026
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mt-1">
                            Auditoría Forense & QA del Sistema
                        </h3>
                    </div>
                </div>
            </div>

            {/* Sub-Tabs de Auditoría */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                {[
                    { id: 'DIAGNOSTICO', label: 'Diagnóstico Core', icon: <Activity size={13} />, count: auditResults.findings.length },
                    { id: 'TRAZABILIDAD', label: 'Rastreo Forense', icon: <History size={13} />, count: globalAuditLogs.length },
                    { id: 'BOVEDA', label: 'Bóveda Inmutable', icon: <Trash2 size={13} />, count: deletedRequests.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as QATab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 font-black'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[7px] font-black ${
                            activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
        
        {/* KPI & Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between group hover:shadow-md transition-all duration-300">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
                            <ShieldCheck size={18} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Índice de Salud</h4>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ESTADO DEL CORE</p>
                        </div>
                    </div>
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-tight leading-relaxed max-w-[190px]">
                        Evaluación matemática de coherencia relacional y SLAs.
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-5xl font-black tracking-tighter ${auditResults.integrityScore > 85 ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {auditResults.integrityScore}<span className="text-xl">%</span>
                    </span>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">CERTIFICACIÓN QA</p>
                </div>
            </div>
            
            <div className="bg-[#1E293B] p-6 rounded-2xl text-white shadow-md flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/10">
                            <Activity size={16} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-[9px] text-slate-200">Auditoría Live</h4>
                            <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">MOTOR: v3.5.0-MASTER</p>
                        </div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span className="text-slate-400">Nodos Verificados</span>
                        <span className="font-black text-sm text-white">{requests.length} expedientes</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-full opacity-70"></div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase">
                        <span className="text-slate-400">Archivados (Inmutables)</span>
                        <span className="text-indigo-400 font-black">{deletedRequests.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ESTADO DE HALLAZGOS</span>
                    <span className="text-[8px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {auditResults.findings.length} TOTAL
                    </span>
                </div>
                <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
                        <span className="text-xl font-black text-red-600 block leading-none">{auditResults.errorCount}</span>
                        <span className="text-[7px] font-black uppercase tracking-widest text-red-500 mt-1 block">Críticos</span>
                    </div>
                    <div className="flex-1 bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center">
                        <span className="text-xl font-black text-amber-600 block leading-none">{auditResults.warnCount}</span>
                        <span className="text-[7px] font-black uppercase tracking-widest text-amber-500 mt-1 block">Advertencias</span>
                    </div>
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">
                    {auditResults.errorCount === 0 ? '✓ Sin anomalías bloqueantes' : 'Requiere intervención del analista'}
                </p>
            </div>

            <div className="bg-red-50/70 p-6 rounded-2xl border border-red-200 shadow-xs flex flex-col justify-between items-center text-center">
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={18} strokeWidth={2.5}/>
                    <span className="text-xs font-black uppercase tracking-tight text-slate-900">Restablecer BD</span>
                </div>
                <p className="text-[8px] text-slate-500 font-medium uppercase mt-1">
                    Operación de depuración controlada para entornos de validación y test.
                </p>
                <button 
                    onClick={() => {
                        setPurgeConfirmationText('');
                        setIsResetConfirmOpen(true);
                    }}
                    className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xs active:scale-95"
                >
                    Purgar Requerimientos
                </button>
            </div>
        </div>

        {/* TAB 1: DIAGNÓSTICO CORE & HALLAZGOS ESTRUCTURALES */}
        {activeTab === 'DIAGNOSTICO' && (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
                        <Shield size={16} className="text-indigo-600" /> Registro de Hallazgos Estructurales
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filtro de severidad */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {(['ALL', 'ERROR', 'WARNING'] as const).map(sev => (
                                <button
                                    key={sev}
                                    onClick={() => setFindingFilter(sev)}
                                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                                        findingFilter === sev 
                                            ? 'bg-white text-indigo-600 shadow-xs font-black' 
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {sev === 'ALL' ? 'Todos' : sev === 'ERROR' ? 'Críticos' : 'Avisos'}
                                </button>
                            ))}
                        </div>

                        {/* Búsqueda de hallazgos */}
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="FILTRAR HALLAZGO..."
                                value={findingSearch}
                                onChange={e => setFindingSearch(e.target.value)}
                                className="bg-white border border-slate-200 pl-7 pr-3 py-1.5 rounded-xl text-[9px] font-black uppercase outline-none focus:border-indigo-600 transition-all shadow-2xs placeholder:text-slate-300 w-44"
                            />
                            {findingSearch && (
                                <button onClick={() => setFindingSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-w-max animate-in fade-in duration-500">
                    <div 
                        className="grid gap-4 px-8 py-4 bg-slate-50/80 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] items-center sticky top-0 z-10"
                        style={{ gridTemplateColumns: monGridTemplate }}
                    >
                        <div className="relative h-full flex items-center">
                            <Terminal size={10} className="inline mr-1 text-slate-400"/> Gravedad
                            <ResizeHandle onStart={(e) => startResizeMon(0, e)} />
                        </div>
                        <div className="relative h-full flex items-center">
                            <Hash size={10} className="inline mr-1 text-slate-400"/> Expediente
                            <ResizeHandle onStart={(e) => startResizeMon(1, e)} />
                        </div>
                        <div className="relative h-full flex items-center">
                            <Search size={10} className="inline mr-1 text-slate-400"/> Hallazgo Técnico & Validación
                            <ResizeHandle onStart={(e) => startResizeMon(2, e)} />
                        </div>
                        <div className="relative h-full flex items-center">
                            <Shield size={10} className="inline mr-1 text-slate-400"/> Regla QA
                            <ResizeHandle onStart={(e) => startResizeMon(3, e)} />
                        </div>
                        <div className="text-right">Acción</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredFindings.length > 0 ? filteredFindings.map((f, i) => (
                            <div 
                                key={i} 
                                onClick={() => f.id && setSelectedRequestId(f.id)}
                                className="grid gap-4 px-8 py-3.5 items-center hover:bg-indigo-50/30 transition-all group cursor-pointer"
                                style={{ gridTemplateColumns: monGridTemplate }}
                            >
                                <div className="truncate">
                                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border truncate block w-fit ${
                                        f.type === 'ERROR' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                        {f.type === 'ERROR' ? 'CRÍTICO' : 'AVISO'}
                                    </span>
                                </div>
                                <div className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50 w-fit truncate">
                                    {f.id ? `#${f.id.substring(0, 6).toUpperCase()}` : 'SYS_CORE'}
                                </div>
                                <div className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                                    {f.msg}
                                </div>
                                <div className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-tighter truncate">
                                    {f.code}
                                </div>
                                <div className="flex justify-end">
                                    <div className="p-1.5 text-slate-400 group-hover:text-indigo-600 transition-all bg-white rounded-lg border border-slate-200 group-hover:border-indigo-200 shadow-2xs">
                                        <Eye size={14} strokeWidth={2.5}/>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-600">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Cero incidencias encontradas con el filtro seleccionado
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: RASTREO FORENSE GLOBAL DE LOGS */}
        {activeTab === 'TRAZABILIDAD' && (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
                            <History size={16} className="text-indigo-600" /> Libro Mayor de Trazabilidad Forense
                        </h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            Registro cronológico inmutable de todas las transiciones operativas del sistema
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Selector de acción */}
                        <select
                            value={logActionFilter}
                            onChange={e => setLogActionFilter(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-700 outline-none shadow-2xs"
                        >
                            <option value="ALL">TODAS LAS ACCIONES</option>
                            <option value="CREACIÓN">CREACIÓN</option>
                            <option value="DERIVACIÓN">DERIVACIÓN</option>
                            <option value="ASIGNACIÓN">ASIGNACIÓN</option>
                            <option value="NOTA">NOTAS TÉCNICAS</option>
                            <option value="RESOLUCIÓN">RESOLUCIÓN</option>
                            <option value="FINALIZADO">CIERRE</option>
                        </select>

                        {/* Búsqueda de logs */}
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="BUSCAR POR USUARIO, ID O TEXTO..."
                                value={logSearch}
                                onChange={e => setLogSearch(e.target.value)}
                                className="bg-white border border-slate-200 pl-7 pr-3 py-1.5 rounded-xl text-[9px] font-black uppercase outline-none focus:border-indigo-600 transition-all shadow-2xs placeholder:text-slate-300 w-64"
                            />
                            {logSearch && (
                                <button onClick={() => setLogSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                            <div 
                                key={log.id || idx}
                                onClick={() => setSelectedRequestId(log.requestId)}
                                className="p-4 hover:bg-indigo-50/20 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                        <Clock size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[8px] font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                                                #{log.requestId.substring(0, 6).toUpperCase()}
                                            </span>
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                                                {log.action}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase">
                                                Área: {log.area}
                                            </span>
                                        </div>
                                        <p className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-indigo-600 transition-colors">
                                            {log.requestTitle}
                                        </p>
                                        {log.details && (
                                            <p className="text-[9px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-800 uppercase flex items-center gap-1.5 justify-end">
                                            <User size={10} className="text-indigo-500" />
                                            <span>{log.author}</span>
                                            <span className="text-[7px] text-slate-400 font-bold">({log.authorRole})</span>
                                        </div>
                                        <span className="text-[8px] font-mono text-slate-400 block mt-0.5">
                                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                    <div className="p-1.5 text-slate-300 group-hover:text-indigo-600 transition-all bg-white rounded-lg border border-slate-200 shadow-2xs">
                                        <ArrowUpRight size={14} />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-400">
                                    <History size={24} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    No se encontraron eventos forenses con el criterio especificado
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* TAB 3: BÓVEDA DE AUDITORÍA (ARCHIVADOS INMUTABLES) */}
        {activeTab === 'BOVEDA' && (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2.5">
                            <Trash2 size={16} className="text-red-600" /> Bóveda de Auditoría (Registros Inmutables)
                        </h3>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            Depósito forense protegido con soft-delete para salvaguardar el historial institucional
                        </p>
                    </div>

                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="BUSCAR EN BÓVEDA..."
                            value={vaultSearch}
                            onChange={e => setVaultSearch(e.target.value)}
                            className="bg-white border border-slate-200 pl-7 pr-3 py-1.5 rounded-xl text-[9px] font-black uppercase outline-none focus:border-indigo-600 transition-all shadow-2xs placeholder:text-slate-300 w-56"
                        />
                        {vaultSearch && (
                            <button onClick={() => setVaultSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-red-100 shadow-xs overflow-hidden flex flex-col min-w-max animate-in fade-in duration-500">
                    <div 
                        className="grid gap-4 px-8 py-4 bg-red-50/50 border-b border-red-100 text-[8px] font-black text-red-500 uppercase tracking-[0.15em] items-center sticky top-0 z-10"
                        style={{ gridTemplateColumns: archGridTemplate }}
                    >
                        <div className="relative h-full flex items-center">
                            <Hash size={10} className="inline mr-1 text-red-400"/> ID
                            <ResizeHandle onStart={(e) => startResizeArch(0, e)} />
                        </div>
                        <div className="relative h-full flex items-center">
                            <Info size={10} className="inline mr-1 text-red-400"/> Título del Expediente
                            <ResizeHandle onStart={(e) => startResizeArch(1, e)} />
                        </div>
                        <div className="relative h-full flex items-center">
                            <Clock size={10} className="inline mr-1 text-red-400"/> Fecha de Retiro
                            <ResizeHandle onStart={(e) => startResizeArch(2, e)} />
                        </div>
                        <div className="relative h-full flex items-center">
                            <User size={10} className="inline mr-1 text-red-400"/> Autorizante
                            <ResizeHandle onStart={(e) => startResizeArch(3, e)} />
                        </div>
                        <div className="text-right">Inspección</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredVault.length > 0 ? filteredVault.map((r, i) => (
                            <div 
                                key={i} 
                                className="grid gap-4 px-8 py-3.5 items-center hover:bg-red-50/30 transition-all group"
                                style={{ gridTemplateColumns: archGridTemplate }}
                            >
                                <div className="text-[9px] font-mono font-black text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200 w-fit truncate">
                                    #{r.id.substring(0, 6).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-black text-slate-800 uppercase truncate group-hover:text-red-600 transition-colors tracking-tight">
                                        {r.title}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-bold italic truncate">
                                        Fase Previa: {r.status} | Área: {r.area}
                                    </div>
                                </div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 truncate font-mono">
                                    <Clock size={11} className="text-slate-300"/>
                                    {r.deletedAt ? new Date(r.deletedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                </div>
                                <div className="text-[9px] font-black text-slate-700 uppercase flex items-center gap-2 truncate">
                                    <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[7px] font-black shrink-0">
                                        {r.deletedBy?.substring(0, 2).toUpperCase() || 'AD'}
                                    </div>
                                    <span className="truncate">{r.deletedBy || 'SuperAdmin'}</span>
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => setSelectedRequestId(r.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 transition-all bg-white rounded-lg border border-slate-200 hover:border-red-200 shadow-2xs"
                                        title="Inspeccionar Archivo"
                                    >
                                        <Eye size={14} strokeWidth={2.5}/>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-16 text-center flex flex-col items-center gap-3">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                                    <Trash2 size={28} className="text-slate-300"/>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Bóveda de auditoría limpia y sin registros archivados
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Modal de Confirmación Segura de Purgado */}
        {isResetConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-md w-full animate-in zoom-in-95 border border-slate-200 space-y-5">
                    <div className="flex items-center gap-3.5 text-red-600 pb-3 border-b border-slate-100">
                        <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                                Confirmar Purgado Total
                            </h3>
                            <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">
                                ACCIÓN IRREVERSIBLE DE ALTO IMPACTO
                            </p>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 text-xs leading-relaxed">
                        Esta operación eliminará permanentemente <strong className="text-slate-900">todos los expedientes y logs</strong> de la base de datos.
                    </p>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">
                            Escribe <strong className="text-red-600">PURGAR</strong> para desbloquear la confirmación:
                        </label>
                        <input
                            type="text"
                            placeholder="PURGAR"
                            value={purgeConfirmationText}
                            onChange={e => setPurgeConfirmationText(e.target.value.toUpperCase())}
                            className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-red-600 transition-all font-mono"
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                        <button 
                            onClick={() => setIsResetConfirmOpen(false)}
                            className="px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            disabled={purgeConfirmationText !== 'PURGAR'}
                            onClick={async () => {
                                try {
                                    await hardDeleteAllRequests();
                                    setIsResetConfirmOpen(false);
                                } catch (e: any) {
                                    alert(e.message);
                                }
                            }}
                            className="px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Sí, Purgar Base de Datos
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
