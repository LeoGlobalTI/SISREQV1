
import React, { useMemo, useState } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, Area, Priority, UserRole, RequestItem } from '../types';
import { 
    BarChart3, TrendingUp, CheckCircle2, Clock, 
    Activity, AlertTriangle, CalendarRange, ArrowRight,
    Briefcase, Zap, Layers, Filter, Target, Calendar, PieChart,
    Users, Award, ChevronRight, Search, ShieldAlert, ArrowUpRight, X, UserCheck,
    Printer, Building, CheckCircle, Download, AlertOctagon, FileSpreadsheet, Shield
} from 'lucide-react';

type ReportPerspective = 'ALL' | 'AREAS' | 'STAFF' | 'SLA';

export const ReportsView: React.FC = () => {
  const { requests, users, setSelectedRequestId, organizationAreas } = useSisreq();
  const [timeRange, setTimeRange] = useState<'Semanal' | 'Mensual' | 'Anual' | 'Todo'>('Mensual');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [perspective, setPerspective] = useState<ReportPerspective>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    userName: string;
    role: string;
    area: string;
    requests: RequestItem[];
  } | null>(null);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (selectedArea !== 'ALL') {
      list = list.filter(r => r.area === selectedArea);
    }
    if (selectedStatusFilter !== 'ALL') {
      list = list.filter(r => r.status === selectedStatusFilter);
    }
    if (timeRange === 'Todo') return list;
    const now = new Date();
    return list.filter(r => {
        const reqDate = new Date(r.createdAt);
        const diffTime = Math.abs(now.getTime() - reqDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (timeRange === 'Semanal') return diffDays <= 7;
        if (timeRange === 'Mensual') return diffDays <= 30;
        if (timeRange === 'Anual') return diffDays <= 365;
        return true;
    });
  }, [requests, timeRange, selectedArea, selectedStatusFilter]);

  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const completed = filteredRequests.filter(r => r.status === Status.FINALIZADO).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const byStatus = [Status.RECIBIDO, Status.DERIVACION, Status.EJECUCION, Status.FINALIZADO].map(status => {
        const count = filteredRequests.filter(r => r.status === status).length;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return { name: status, count, percentage };
    });
    const completedItems = filteredRequests.filter(r => r.status === Status.FINALIZADO && r.finishedAt);
    let avgDays = 0;
    let withinSlaCount = 0;
    if (completedItems.length > 0) {
        const totalMs = completedItems.reduce((acc, curr) => {
            const start = new Date(curr.createdAt).getTime();
            const end = new Date(curr.finishedAt!).getTime();
            const days = (end - start) / (1000 * 60 * 60 * 24);
            if (days <= 5) withinSlaCount++;
            return acc + (end - start);
        }, 0);
        avgDays = Number((totalMs / (1000 * 60 * 60 * 24) / completedItems.length).toFixed(1));
    }
    const slaComplianceRate = completedItems.length > 0 
        ? Math.round((withinSlaCount / completedItems.length) * 100) 
        : 100;

    const byPriority = Object.values(Priority).map(p => ({
        name: p,
        count: filteredRequests.filter(r => r.priority === p).length
    }));
    return { total, completed, pending, completionRate, byStatus, avgDays, slaComplianceRate, byPriority };
  }, [filteredRequests]);

  // Alerta Temprana de Cuello de Botella (SLA ANSI > 5 días en curso)
  const slaBottlenecks = useMemo(() => {
    const now = Date.now();
    return requests
      .filter(r => !r.isDeleted && r.status !== Status.FINALIZADO)
      .map(r => {
        const ageDays = Number(((now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1));
        let riskLevel: 'NORMAL' | 'WARNING' | 'BREACHED' = 'NORMAL';
        if (ageDays > 5) riskLevel = 'BREACHED';
        else if (ageDays >= 3.5) riskLevel = 'WARNING';
        return { request: r, ageDays, riskLevel };
      })
      .filter(item => item.riskLevel !== 'NORMAL')
      .sort((a, b) => b.ageDays - a.ageDays);
  }, [requests]);

  // Desglose por Unidades Operativas
  const areaBreakdown = useMemo(() => {
    return organizationAreas.map(areaName => {
      const areaRequests = filteredRequests.filter(r => r.area === areaName);
      const completed = areaRequests.filter(r => r.status === Status.FINALIZADO).length;
      const pending = areaRequests.length - completed;
      const rate = areaRequests.length > 0 ? Math.round((completed / areaRequests.length) * 100) : 0;
      return {
        name: areaName,
        total: areaRequests.length,
        completed,
        pending,
        rate
      };
    }).sort((a, b) => b.total - a.total);
  }, [organizationAreas, filteredRequests]);

  // Métricas Específicas por Usuario
  const userMetrics = useMemo(() => {
    return users.map(user => {
        const assigned = filteredRequests.filter(r => 
            r.assignedAnalyst && r.assignedAnalyst.toLowerCase() === user.name.toLowerCase()
        );
        const assignedTotal = assigned.length;
        const completed = assigned.filter(r => r.status === Status.FINALIZADO);
        const assignedCompleted = completed.length;
        const assignedActive = assignedTotal - assignedCompleted;
        const completionRate = assignedTotal > 0 ? Math.round((assignedCompleted / assignedTotal) * 100) : 0;
        
        let avgDays = 0;
        const finalizedWithTime = completed.filter(r => r.finishedAt);
        if (finalizedWithTime.length > 0) {
            const totalMs = finalizedWithTime.reduce((acc, curr) => {
                return acc + (new Date(curr.finishedAt!).getTime() - new Date(curr.createdAt).getTime());
            }, 0);
            avgDays = Number((totalMs / (1000 * 60 * 60 * 24) / finalizedWithTime.length).toFixed(1));
        }

        const createdByMe = filteredRequests.filter(r => 
            r.requester && r.requester.toLowerCase() === user.name.toLowerCase()
        ).length;

        // Clasificación de Carga de Trabajo
        let loadLevel: 'ALTA' | 'OPTIMA' | 'DISPONIBLE' = 'DISPONIBLE';
        if (assignedActive >= 4) loadLevel = 'ALTA';
        else if (assignedActive >= 1) loadLevel = 'OPTIMA';

        return {
            user,
            assignedTotal,
            assignedCompleted,
            assignedActive,
            completionRate,
            avgDays,
            createdByMe,
            loadLevel,
            assignedRequests: assigned
        };
    }).sort((a, b) => b.assignedCompleted - a.assignedCompleted || b.assignedTotal - a.assignedTotal);
  }, [users, filteredRequests]);

  const filteredUserMetrics = useMemo(() => {
    if (!userSearch.trim()) return userMetrics;
    const term = userSearch.toLowerCase();
    return userMetrics.filter(m => 
        m.user.name.toLowerCase().includes(term) ||
        m.user.role.toLowerCase().includes(term) ||
        (m.user.area && m.user.area.toLowerCase().includes(term))
    );
  }, [userMetrics, userSearch]);

  const teamKPIs = useMemo(() => {
    const activeStaff = userMetrics.filter(m => m.assignedTotal > 0);
    const topPerformer = activeStaff.length > 0 ? activeStaff[0] : null;
    const totalAssignments = userMetrics.reduce((acc, m) => acc + m.assignedTotal, 0);
    const avgLoad = activeStaff.length > 0 ? (totalAssignments / activeStaff.length).toFixed(1) : '0';
    const avgRate = activeStaff.length > 0 ? Math.round(activeStaff.reduce((acc, m) => acc + m.completionRate, 0) / activeStaff.length) : 0;
    return { activeStaffCount: activeStaff.length, topPerformer, avgLoad, avgRate };
  }, [userMetrics]);

  // Exportación a CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Folio',
      'Titulo',
      'Estado',
      'Prioridad',
      'Unidad_Organica',
      'Analista_Asignado',
      'Solicitante',
      'Fecha_Creacion',
      'Fecha_Finalizado',
      'Dias_Transcurridos',
      'Cumple_SLA_ANSI'
    ];
    const rows = filteredRequests.map(r => {
      const start = new Date(r.createdAt).getTime();
      const end = r.finishedAt ? new Date(r.finishedAt).getTime() : Date.now();
      const days = ((end - start) / (1000 * 60 * 60 * 24)).toFixed(1);
      const compliesSla = r.status === Status.FINALIZADO 
        ? (Number(days) <= 5 ? 'SI (<=5d)' : 'NO (>5d)') 
        : (Number(days) <= 5 ? 'EN PLAZO' : 'EXCEDIDO');
      return [
        `"${r.id}"`,
        `"#${r.id.substring(0, 6).toUpperCase()}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${r.priority}"`,
        `"${r.area}"`,
        `"${r.assignedAnalyst || 'Sin Asignar'}"`,
        `"${r.requester || 'Anónimo'}"`,
        `"${new Date(r.createdAt).toISOString()}"`,
        `"${r.finishedAt ? new Date(r.finishedAt).toISOString() : ''}"`,
        `"${days}"`,
        `"${compliesSla}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SISREQ_Reporte_Master_${selectedArea}_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = selectedArea !== 'ALL' || selectedStatusFilter !== 'ALL' || timeRange !== 'Mensual';

  const resetFilters = () => {
    setSelectedArea('ALL');
    setSelectedStatusFilter('ALL');
    setTimeRange('Mensual');
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
        {/* Header Section Institucional */}
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-5">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                            <TrendingUp size={20} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            Inteligencia Operativa y Rendimiento
                        </h3>
                    </div>

                    {/* Perspectivas (Tabs) */}
                    <div className="flex items-center gap-6 mt-4 overflow-x-auto">
                        {[
                            { id: 'ALL', label: 'Visión 360° Integral', icon: <BarChart3 size={15} /> },
                            { id: 'AREAS', label: 'Unidades Organizacionales', icon: <Building size={14} /> },
                            { id: 'STAFF', label: 'Colaboradores y Rendimiento', icon: <Users size={14} /> },
                            { id: 'SLA', label: 'Auditoría SLA y Alertas', icon: <Clock size={14} />, alertCount: slaBottlenecks.length }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setPerspective(item.id as ReportPerspective)}
                                className={`flex items-center gap-2 pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                                    perspective === item.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {item.alertCount !== undefined && item.alertCount > 0 && (
                                    <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none ml-1">
                                        {item.alertCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Unified Filter and Action Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    {/* Area Filter */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <Building size={14} className="text-slate-400" />
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="bg-transparent border-0 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="ALL">Todas las Unidades</option>
                            {organizationAreas.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                        {['Semanal', 'Mensual', 'Anual', 'Todo'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range as any)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                                    timeRange === range 
                                    ? 'bg-white text-indigo-600 shadow-sm font-semibold' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Export Data Button */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-sm"
                        title="Exportar base de datos a Excel/CSV"
                    >
                        <FileSpreadsheet size={14} /> Exportar
                    </button>

                    {/* Print / Export Report Button */}
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                        title="Imprimir o guardar reporte en PDF"
                    >
                        <Printer size={14} /> Imprimir
                    </button>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="flex items-center gap-3">
                    {selectedStatusFilter !== 'ALL' && (
                        <span className="text-xs font-medium px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-2">
                            Estado: {selectedStatusFilter}
                            <button onClick={() => setSelectedStatusFilter('ALL')} className="hover:text-indigo-900">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    <button
                        onClick={resetFilters}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                        <X size={12}/> Limpiar filtros
                    </button>
                </div>
            )}
        </div>

        {/* High Density Stats Grid (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
                { label: 'Flujo Total', val: stats.total, icon: <Briefcase size={20}/>, color: 'bg-slate-900', text: 'text-white' },
                { label: 'En Ejecución', val: stats.pending, icon: <Zap size={20}/>, color: 'bg-orange-100', text: 'text-orange-600' },
                { label: 'Resolución', val: `${stats.completionRate}%`, icon: <Target size={20}/>, color: 'bg-emerald-100', text: 'text-emerald-600' },
                { label: 'Cumplimiento SLA', val: `${stats.slaComplianceRate}%`, icon: <CheckCircle size={20}/>, color: 'bg-blue-100', text: 'text-blue-600' },
                { label: 'SLA Promedio', val: `${stats.avgDays}d`, icon: <Clock size={20}/>, color: 'bg-indigo-100', text: 'text-indigo-600' }
            ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className={`p-3 ${card.color} ${card.text} rounded-xl w-fit shadow-sm mb-4`}>
                        {card.icon}
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-slate-900 tracking-tight">{card.val}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1">{card.label}</div>
                    </div>
                </div>
            ))}
        </div>

        {/* Charts Section Institucional (Ciclo de Vida + Prioridad) */}
        {(perspective === 'ALL' || perspective === 'SLA') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                                <Layers size={16} strokeWidth={2.5}/>
                            </div>
                            <div>
                               <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Distribución de Ciclo de Vida</h3>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Haz clic en una fase para aislar sus expedientes</p>
                            </div>
                        </div>
                        {selectedStatusFilter !== 'ALL' && (
                            <button
                                onClick={() => setSelectedStatusFilter('ALL')}
                                className="text-[8px] font-black text-indigo-600 uppercase hover:underline"
                            >
                                Ver Todas las Fases
                            </button>
                        )}
                    </div>
                    <div className="space-y-6">
                        {stats.byStatus.map((step) => {
                            const isFiltered = selectedStatusFilter === step.name;
                            return (
                                <div 
                                    key={step.name} 
                                    onClick={() => setSelectedStatusFilter(isFiltered ? 'ALL' : step.name)}
                                    className={`group cursor-pointer p-2 rounded-xl transition-all ${isFiltered ? 'bg-indigo-50/50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-end mb-2 text-[9px] font-black uppercase tracking-widest">
                                        <span className={`transition-colors ${isFiltered ? 'text-indigo-600 font-black' : 'text-slate-500 group-hover:text-slate-900'}`}>
                                            {isFiltered ? `✓ ${step.name}` : step.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-black">{step.count}</span>
                                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">{step.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                step.name === Status.FINALIZADO ? 'bg-emerald-500' : 
                                                step.name === Status.RECIBIDO ? 'bg-indigo-600' :
                                                step.name === Status.DERIVACION ? 'bg-orange-500' : 'bg-amber-500'
                                            }`}
                                            style={{ width: `${Math.max(step.percentage, 2)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                            <PieChart size={16} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Nivel de Prioridad</h3>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Urgencia detectada</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end justify-between gap-4 px-1 mb-2">
                        {stats.byPriority.map((p) => {
                             const height = stats.total > 0 ? (p.count / stats.total) * 100 : 0;
                             return (
                                <div key={p.name} className="flex flex-col items-center gap-3 flex-1 group">
                                    <div className="text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-all bg-slate-900 px-2 py-0.5 rounded shadow-xl translate-y-1 group-hover:translate-y-0">
                                        {p.count}
                                    </div>
                                    <div className="w-full relative flex items-end justify-center h-32 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner p-1">
                                        <div 
                                            className={`w-full rounded-xl transition-all duration-1000 ease-out ${
                                                p.name === Priority.HIGH ? 'bg-red-600' : 
                                                p.name === Priority.MEDIUM ? 'bg-amber-500' : 'bg-indigo-600'
                                            }`} 
                                            style={{ height: `${Math.max(height, 8)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.name}</div>
                                </div>
                             );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* Matriz de Alerta Preventiva y Cumplimiento Normativo SLA ANSI */}
        {(perspective === 'ALL' || perspective === 'SLA') && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                            <Clock size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-base">
                                    Matriz de Alerta Preventiva y Cumplimiento SLA ANSI
                                </h3>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    slaBottlenecks.length > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                    {slaBottlenecks.length > 0 ? `${slaBottlenecks.length} en Alerta` : '100% En Plazo'}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Estándar ANSI: Ciclo máximo de resolución $\le 5$ días hábiles desde recepción técnica
                            </p>
                        </div>
                    </div>
                </div>

                {slaBottlenecks.length > 0 ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs">
                            <div className="flex items-center gap-2.5">
                                <AlertOctagon size={18} className="text-amber-600 shrink-0" />
                                <span className="font-bold text-[11px]">
                                    Atención Master: Se detectaron {slaBottlenecks.length} expediente(s) con tiempos en riesgo o excedidos respecto al estándar normativo de 5 días.
                                </span>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 shrink-0">Intervención Recomendada</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {slaBottlenecks.map(({ request, ageDays, riskLevel }) => (
                                <div
                                    key={request.id}
                                    onClick={() => setSelectedRequestId(request.id)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                                        riskLevel === 'BREACHED'
                                            ? 'bg-red-50/40 border-red-200 hover:border-red-400 hover:shadow-xs'
                                            : 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:shadow-xs'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                                #{request.id.substring(0, 6).toUpperCase()}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                riskLevel === 'BREACHED' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                            }`}>
                                                {riskLevel === 'BREACHED' ? `SLA Excedido (${ageDays}d)` : `Riesgo Alto (${ageDays}d)`}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-indigo-600 transition-colors">
                                            {request.title}
                                        </h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                                            Área: {request.area} • Resp: {request.assignedAnalyst || 'Sin Asignar'}
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase text-indigo-600">
                                        <span>Abrir Expediente</span>
                                        <ArrowUpRight size={12} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-emerald-900 tracking-tight">
                                Certificación de Cumplimiento Activo
                            </p>
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                Todos los expedientes en curso se encuentran estrictamente dentro de la ventana de resolución ANSI ($\le 5$ días). No se registran cuellos de botella operativos.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Rendimiento por Unidades Operativas (Áreas) */}
        {(perspective === 'ALL' || perspective === 'AREAS') && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
                            <Building size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-base">
                                    Distribución y Rendimiento por Unidad Organizacional
                                </h3>
                                <span className="bg-slate-100 text-slate-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                    {areaBreakdown.length} Unidades
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Carga de expedientes, capacidad de resolución y tasa de éxito por departamento
                            </p>
                        </div>
                    </div>

                    {selectedArea !== 'ALL' && (
                        <button
                            onClick={() => setSelectedArea('ALL')}
                            className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center gap-1.5 self-start md:self-auto"
                        >
                            Mostrar Todas las Unidades <X size={11} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {areaBreakdown.map((area) => {
                        const isSelected = selectedArea === area.name;
                        return (
                            <div
                                key={area.name}
                                onClick={() => setSelectedArea(isSelected ? 'ALL' : area.name)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'} transition-colors`}>
                                                <Building size={14} />
                                            </div>
                                            <span className="font-black text-xs text-slate-900 uppercase truncate">
                                                {area.name}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                                            {area.rate}% Resuelto
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                            <span>Tickets: <strong className="text-slate-900">{area.total}</strong></span>
                                            <span>Finalizados: <strong className="text-emerald-600">{area.completed}</strong></span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-600 rounded-full transition-all duration-700" 
                                                style={{ width: `${Math.max(area.rate, area.total > 0 ? 4 : 0)}%` }} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    <span>{isSelected ? '✓ Filtro Aplicado' : 'Aislar esta unidad'}</span>
                                    <ChevronRight size={12} className={isSelected ? 'text-indigo-600' : 'text-slate-300'} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Sección de Métricas y Rendimiento por Usuario */}
        {(perspective === 'ALL' || perspective === 'STAFF') && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
                            <Users size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-base">
                                    Métricas y Rendimiento por Usuario
                                </h3>
                                <span className="bg-slate-100 text-slate-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                    {filteredUserMetrics.length} Colaboradores
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Seguimiento analítico de carga de trabajo, efectividad y resolución • Powered by Global TI 2026
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative min-w-[240px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="BUSCAR COLABORADOR O ÁREA..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-[9px] font-black uppercase outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-xs placeholder:text-slate-300"
                            />
                            {userSearch && (
                                <button onClick={() => setUserSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            {/* Quick KPI Cards por Usuario / Equipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PERSONAL ASIGNADO</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">{teamKPIs.activeStaffCount} <span className="text-[10px] text-slate-400 font-bold">/ {users.length}</span></p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
                        <Award size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">TOP RESOLUTOR</p>
                        <p className="text-sm font-black text-slate-900 uppercase truncate">
                            {teamKPIs.topPerformer ? teamKPIs.topPerformer.user.name : 'Sin registros'}
                        </p>
                        {teamKPIs.topPerformer && (
                            <p className="text-[8px] font-bold text-emerald-600 uppercase">
                                {teamKPIs.topPerformer.assignedCompleted} tickets resueltos ({teamKPIs.topPerformer.completionRate}%)
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-500 text-white rounded-xl shadow-sm">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CARGA MEDIA / ANALISTA</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">{teamKPIs.avgLoad} <span className="text-[10px] text-slate-400 font-bold">tickets</span></p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-slate-900 text-white rounded-xl shadow-sm">
                        <Target size={18} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">TASA MEDIA RESOLUCIÓN</p>
                        <p className="text-xl font-black text-slate-900 leading-tight">{teamKPIs.avgRate}%</p>
                    </div>
                </div>
            </div>

            {/* Tabla Detallada de Métricas por Usuario */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="py-3.5 px-4">Colaborador</th>
                            <th className="py-3.5 px-3">Rol & Jurisdicción</th>
                            <th className="py-3.5 px-3 text-center">Asignados</th>
                            <th className="py-3.5 px-3 text-center">Activos</th>
                            <th className="py-3.5 px-3 text-center">Finalizados</th>
                            <th className="py-3.5 px-4 min-w-[140px]">Tasa de Efectividad</th>
                            <th className="py-3.5 px-3 text-center">Prom. Días SLA</th>
                            <th className="py-3.5 px-3 text-center">Carga Operativa</th>
                            <th className="py-3.5 px-3 text-right">Expedientes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {filteredUserMetrics.map((item) => (
                            <tr key={item.user.id} className="hover:bg-indigo-50/20 transition-colors">
                                <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-[10px] shrink-0">
                                            {item.user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 uppercase text-[11px] truncate">{item.user.name}</p>
                                            <p className="text-[8px] text-slate-400 font-medium truncate">{item.user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3.5 px-3">
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 block w-fit">
                                        {item.user.role} • {item.user.area || 'General'}
                                    </span>
                                </td>
                                <td className="py-3.5 px-3 text-center font-black text-slate-900">
                                    {item.assignedTotal}
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${item.assignedActive > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-slate-300'}`}>
                                        {item.assignedActive}
                                    </span>
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${item.assignedCompleted > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'text-slate-300'}`}>
                                        {item.assignedCompleted}
                                    </span>
                                </td>
                                <td className="py-3.5 px-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-black uppercase">
                                            <span className="text-slate-400">{item.completionRate}% completado</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    item.completionRate >= 70 ? 'bg-emerald-500' : 
                                                    item.completionRate >= 40 ? 'bg-indigo-600' : 
                                                    item.assignedTotal === 0 ? 'bg-slate-200' : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${Math.max(item.completionRate, item.assignedTotal > 0 ? 5 : 0)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3.5 px-3 text-center font-mono text-[10px] text-slate-600">
                                    {item.assignedCompleted > 0 ? `${item.avgDays}d` : '—'}
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                    {item.loadLevel === 'ALTA' && (
                                        <span className="bg-red-50 text-red-600 border border-red-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                            Alta Demanda
                                        </span>
                                    )}
                                    {item.loadLevel === 'OPTIMA' && (
                                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                            Carga Óptima
                                        </span>
                                    )}
                                    {item.loadLevel === 'DISPONIBLE' && (
                                        <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                            Disponible
                                        </span>
                                    )}
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                    <button
                                        disabled={item.assignedTotal === 0}
                                        onClick={() => setSelectedUserDetail({
                                            userName: item.user.name,
                                            role: item.user.role,
                                            area: item.user.area || 'General',
                                            requests: item.assignedRequests
                                        })}
                                        className="bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1"
                                    >
                                        Ver ({item.assignedTotal}) <ChevronRight size={10} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        )}

        {/* Modal / Detalle de Expedientes Asignados a un Usuario */}
        {selectedUserDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                                <Users size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                    Expedientes Asignados a {selectedUserDetail.userName}
                                </h3>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    {selectedUserDetail.role} • Área {selectedUserDetail.area} • {selectedUserDetail.requests.length} expedientes
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-slate-700 font-black text-base p-1">✕</button>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar space-y-2.5 flex-1 pr-1">
                        {selectedUserDetail.requests.map(req => (
                            <div 
                                key={req.id}
                                onClick={() => {
                                    setSelectedUserDetail(null);
                                    setSelectedRequestId(req.id);
                                }}
                                className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                                            #{req.id.substring(0,6).toUpperCase()}
                                        </span>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                                            req.status === Status.FINALIZADO ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            req.status === Status.RECIBIDO ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                            req.status === Status.DERIVACION ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                            'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-indigo-600 transition-colors">
                                        {req.title}
                                    </h4>
                                    <p className="text-[9px] text-slate-400 font-medium truncate">
                                        Solicitado por: <span className="font-bold text-slate-600">{req.requester}</span> • Área: {req.area}
                                    </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    <span className="text-[8px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 uppercase">
                                        Abrir <ArrowUpRight size={12} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
                        <button
                            onClick={() => setSelectedUserDetail(null)}
                            className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
