import React, { useMemo, useState } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, Area, Priority, UserRole, RequestItem } from '../types';
import { 
    BarChart3, CheckCircle2, Clock, 
    Zap, Layers, Target, PieChart,
    Users, Award, Search, X, UserCheck,
    Printer, Building, CheckCircle, FileSpreadsheet, AlertOctagon,
    ArrowUpRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { requests, users, setSelectedRequestId, organizationAreas } = useSisreq();
  const [timeRange, setTimeRange] = useState<'Semanal' | 'Mensual' | 'Anual' | 'Todo'>('Mensual');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<Status | 'ALL'>('ALL');
  
  // No more perspective state. We show everything in one Bento grid.

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
    
    // SLA Bottlenecks for filtered requests
    const now = Date.now();
    const slaBottlenecks = filteredRequests
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

    return { total, completed, pending, completionRate, byStatus, avgDays, slaComplianceRate, byPriority, slaBottlenecks };
  }, [filteredRequests]);

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

        return {
            user,
            assignedTotal,
            assignedCompleted,
            assignedActive,
            completionRate,
            avgDays,
        };
    }).filter(u => u.assignedTotal > 0).sort((a, b) => b.assignedCompleted - a.assignedCompleted || b.assignedTotal - a.assignedTotal).slice(0, 5);
  }, [users, filteredRequests]);

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
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
            
            {/* NIVEL 1: FILTROS GLOBALES */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <Building size={16} className="text-slate-500" />
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="bg-transparent border-0 text-sm font-semibold text-slate-700 outline-none cursor-pointer pr-4"
                        >
                            <option value="ALL">Todas las Unidades</option>
                            {organizationAreas.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                        {['Semanal', 'Mensual', 'Anual', 'Todo'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range as any)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    timeRange === range 
                                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-2"
                        >
                            <X size={14}/> Limpiar filtros
                        </button>
                    )}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm"
                    >
                        <FileSpreadsheet size={16} className="text-emerald-600" /> CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
            </div>

            {/* NIVEL 2: KPIs CRÍTICOS (HERO METRICS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 mb-1">Total Atendidos</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.total}</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 mb-1">Resolución Promedio</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.avgDays} <span className="text-base font-bold text-slate-400">días</span></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-500 mb-1">Tasa de Eficiencia</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.completionRate}%</div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border shadow-sm flex items-center gap-5 ${
                    stats.slaBottlenecks.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                }`}>
                    <div className={`p-4 rounded-2xl shadow-sm border ${
                        stats.slaBottlenecks.length > 0 ? 'bg-red-600 text-white border-red-700' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                        <AlertOctagon size={24} />
                    </div>
                    <div>
                        <div className={`text-sm font-bold mb-1 ${stats.slaBottlenecks.length > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                            Tickets en Riesgo (SLA)
                        </div>
                        <div className={`text-3xl font-black tracking-tight ${stats.slaBottlenecks.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                            {stats.slaBottlenecks.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* NIVEL 3: NÚCLEO ANALÍTICO (Grid Dividido 60/40) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Izquierda: Ciclo de Vida (60%) */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                            <Layers size={18} strokeWidth={2.5}/>
                        </div>
                        <div>
                           <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Estado del Pipeline</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distribución actual de expedientes</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {stats.byStatus.map((step) => {
                            const isFiltered = selectedStatusFilter === step.name;
                            return (
                                <div 
                                    key={step.name} 
                                    onClick={() => setSelectedStatusFilter(isFiltered ? 'ALL' : step.name)}
                                    className={`group cursor-pointer p-3 rounded-2xl transition-all ${isFiltered ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-end mb-3">
                                        <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isFiltered ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-900'}`}>
                                            {isFiltered ? `✓ FILTRO: ${step.name}` : step.name}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-900 font-black text-lg">{step.count}</span>
                                            <span className="text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md text-[10px] font-black border border-indigo-200">{step.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                step.name === Status.FINALIZADO ? 'bg-emerald-500' : 
                                                step.name === Status.RECIBIDO ? 'bg-indigo-600' :
                                                step.name === Status.DERIVACION ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${Math.max(step.percentage, 2)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Derecha: Prioridad (40%) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg text-orange-600">
                            <PieChart size={18} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Distribución de Urgencia</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Carga por niveles de prioridad</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-2">
                        {stats.byPriority.map((p) => {
                             const height = stats.total > 0 ? (p.count / stats.total) * 100 : 0;
                             return (
                                <div key={p.name} className="flex flex-col items-center gap-4 flex-1 group">
                                    <div className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                                        {p.count}
                                    </div>
                                    <div className="w-full relative flex items-end justify-center h-48 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner p-1.5">
                                        <div 
                                            className={`w-full rounded-xl transition-all duration-1000 ease-out shadow-sm ${
                                                p.name === Priority.HIGH ? 'bg-red-500' : 
                                                p.name === Priority.MEDIUM ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} 
                                            style={{ height: `${Math.max(height, 8)}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.name}</div>
                                </div>
                             );
                        })}
                    </div>
                </div>
            </div>

            {/* NIVEL 4: RENDIMIENTO ESPECÍFICO (Grid Dividido 50/50) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                
                {/* Izquierda: Carga por Área Organizacional */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
                                <Building size={18} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Carga Operativa por Área</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Volumen y resolución</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar max-h-[320px]">
                        {areaBreakdown.length === 0 ? (
                             <div className="text-center text-sm font-bold text-slate-400 py-10 uppercase tracking-widest">No hay datos</div>
                        ) : areaBreakdown.map((area) => (
                            <div key={area.name} className="flex items-center gap-4">
                                <div className="w-32 text-xs font-bold text-slate-700 truncate" title={area.name}>
                                    {area.name}
                                </div>
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                                    {/* Porción completada */}
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-700" 
                                        style={{ width: `${area.total > 0 ? (area.completed / area.total) * 100 : 0}%` }} 
                                    />
                                    {/* Porción pendiente */}
                                    <div 
                                        className="h-full bg-blue-400 transition-all duration-700" 
                                        style={{ width: `${area.total > 0 ? (area.pending / area.total) * 100 : 0}%` }} 
                                    />
                                </div>
                                <div className="w-16 text-right">
                                    <span className="text-sm font-black text-slate-900">{area.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Resueltos</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Pendientes</div>
                    </div>
                </div>

                {/* Derecha: Top Colaboradores */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                            <Award size={18} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Top Resolutores</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ranking de efectividad (Top 5)</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-3 pl-2">Colaborador</th>
                                    <th className="pb-3 text-center">Asignados</th>
                                    <th className="pb-3 text-center">Efectividad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                                {userMetrics.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center text-sm font-bold text-slate-400 py-10 uppercase tracking-widest">No hay datos</td>
                                    </tr>
                                ) : userMetrics.map((item, index) => (
                                    <tr key={item.user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 pl-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black text-sm">{item.user.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.user.area || item.user.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-black border border-slate-200">
                                                {item.assignedTotal}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center justify-end gap-3 pr-2">
                                                <span className={`text-xs font-black ${item.completionRate >= 80 ? 'text-emerald-600' : item.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {item.completionRate}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
