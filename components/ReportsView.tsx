
import React, { useMemo, useState } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, Area, Priority, UserRole } from '../types';
import { 
    BarChart3, TrendingUp, CheckCircle2, Clock, 
    Activity, AlertTriangle, CalendarRange, ArrowRight,
    Briefcase, Zap, Layers, Filter, Target, Calendar, PieChart
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { requests, users } = useSisreq();
  const [timeRange, setTimeRange] = useState<'Semanal' | 'Mensual' | 'Anual' | 'Todo'>('Mensual');

  const filteredRequests = useMemo(() => {
    if (timeRange === 'Todo') return requests;
    const now = new Date();
    return requests.filter(r => {
        const reqDate = new Date(r.createdAt);
        const diffTime = Math.abs(now.getTime() - reqDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (timeRange === 'Semanal') return diffDays <= 7;
        if (timeRange === 'Mensual') return diffDays <= 30;
        if (timeRange === 'Anual') return diffDays <= 365;
        return true;
    });
  }, [requests, timeRange]);

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
    if (completedItems.length > 0) {
        const totalMs = completedItems.reduce((acc, curr) => {
            const start = new Date(curr.createdAt).getTime();
            const end = new Date(curr.finishedAt!).getTime();
            return acc + (end - start);
        }, 0);
        avgDays = Number((totalMs / (1000 * 60 * 60 * 24) / completedItems.length).toFixed(1));
    }
    const byPriority = Object.values(Priority).map(p => ({
        name: p,
        count: filteredRequests.filter(r => r.priority === p).length
    }));
    return { total, completed, pending, completionRate, byStatus, avgDays, byPriority };
  }, [filteredRequests]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
        {/* Header Section Institucional */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
                        <TrendingUp size={18} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Inteligencia Operativa</h3>
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-1.5 ml-1">
                        <Calendar size={10} className="text-indigo-400" /> CORTE TEMPORAL:
                    </span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 text-[8px] font-black uppercase tracking-tight">{timeRange}</span>
                </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                {['Semanal', 'Mensual', 'Anual', 'Todo'].map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range as any)}
                        className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            timeRange === range 
                            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                            : 'text-slate-400 hover:text-slate-800'
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>
        </div>

        {/* High Density Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: 'FLUJO TOTAL', val: stats.total, icon: <Briefcase size={18}/>, color: 'bg-slate-900', trend: 'TICKETS' },
                { label: 'ACTIVOS', val: stats.pending, icon: <Zap size={18}/>, color: 'bg-orange-500', trend: 'EJECUCIÓN' },
                { label: 'RESOLUCIÓN', val: `${stats.completionRate}%`, icon: <Target size={18}/>, color: 'bg-emerald-600', trend: 'EFICIENCIA' },
                { label: 'ANSI SLA', val: `${stats.avgDays}d`, icon: <Clock size={18}/>, color: 'bg-indigo-600', trend: 'PROMEDIO' }
            ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 ${card.color} text-white rounded-xl shadow-lg transition-transform group-hover:scale-105`}>
                            {card.icon}
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">{card.trend}</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{card.val}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-2">{card.label}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Charts Section Institucional */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                            <Layers size={16} strokeWidth={2.5}/>
                        </div>
                        <div>
                           <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Distribución de Ciclo de Vida</h3>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Estado de los expedientes en el periodo</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    {stats.byStatus.map((step) => (
                        <div key={step.name} className="group">
                            <div className="flex justify-between items-end mb-2 text-[9px] font-black uppercase tracking-widest">
                                <span className="text-slate-400 group-hover:text-slate-900 transition-colors">{step.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-900 font-black">{step.count}</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">{step.percentage}%</span>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner">
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
                    ))}
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
    </div>
  );
};
