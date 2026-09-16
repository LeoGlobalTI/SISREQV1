import React, { useState, useMemo } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { ScheduledProcess, ProcessAlert, User } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User as UserIcon, Tag, AlignLeft, Send, Trash2, CheckCircle2 } from 'lucide-react';

export const PlannerView: React.FC = () => {
    const { scheduledProcesses, addProcess, deleteProcess, users, organizationAreas, currentUser } = useSisreq();

    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Estado del formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<ScheduledProcess | null>(null);
    const [processName, setProcessName] = useState('');
    const [area, setArea] = useState('');
    const [globalStartDate, setGlobalStartDate] = useState('');
    const [globalEndDate, setGlobalEndDate] = useState('');
    
    const [alerts, setAlerts] = useState<Omit<ProcessAlert, 'id' | 'status' | 'linkedRequestId'>[]>([]);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const processesByDay = useMemo(() => {
        const map: { [key: string]: { process: ScheduledProcess, alert: ProcessAlert }[] } = {};
        if (!scheduledProcesses) return map;
        
        scheduledProcesses.forEach(proc => {
            proc.alerts.forEach(alert => {
                const triggerStr = alert.triggerDate;
                if (!map[triggerStr]) map[triggerStr] = [];
                map[triggerStr].push({ process: proc, alert });
            });
        });
        return map;
    }, [scheduledProcesses]);

    const closeAndResetModal = () => {
        setIsModalOpen(false);
        setProcessName('');
        setArea('');
        setGlobalStartDate('');
        setGlobalEndDate('');
        setAlerts([]);
    };

    const handleAddAlert = () => {
        setAlerts([...alerts, {
            title: '',
            description: '',
            assignedToId: null,
            triggerDate: '',
            visibilityWindowDays: 5
        }]);
    };

    const handleUpdateAlert = (index: number, field: string, value: any) => {
        const newAlerts = [...alerts];
        (newAlerts[index] as any)[field] = value;
        setAlerts(newAlerts);
    };

    const handleRemoveAlert = (index: number) => {
        const newAlerts = [...alerts];
        newAlerts.splice(index, 1);
        setAlerts(newAlerts);
    };

    const handleCreateProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (alerts.length === 0) {
            alert('Debe agregar al menos una alerta al proceso.');
            return;
        }

        const start = new Date(globalStartDate + 'T00:00:00');
        const end = new Date(globalEndDate + 'T23:59:59');
        if (end < start) {
            alert('La fecha límite (Hasta) no puede ser anterior a la fecha de inicio (Desde).');
            return;
        }
        
        // Asegurar que todas las fechas de alertas sean válidas
        for (const alert of alerts) {
             if(!alert.title || !alert.triggerDate) {
                 window.alert('Todas las alertas deben tener título y fecha programada.');
                 return;
             }
             const trigger = new Date(alert.triggerDate + 'T00:00:00');
             if (trigger < start || trigger > end) {
                 window.alert(`La alerta "${alert.title}" tiene una fecha (${alert.triggerDate}) que está fuera del rango global del proceso (${globalStartDate} a ${globalEndDate}).`);
                 return;
             }
        }

        await addProcess({
            processName,
            area: area || '',
            globalStartDate,
            globalEndDate,
            alerts: alerts.map(a => ({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
                title: a.title,
                description: a.description,
                assignedToId: a.assignedToId,
                triggerDate: a.triggerDate,
                visibilityWindowDays: a.visibilityWindowDays,
                status: 'WAITING',
                linkedRequestId: null
            }))
        });
        closeAndResetModal();
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <CalendarIcon className="text-indigo-600" /> Planificador de Procesos
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Configura motores de inyección de alertas en Kanban</p>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="px-8 py-4 flex items-center justify-between bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <h2 className="text-sm font-black text-slate-800 w-32 text-center uppercase tracking-widest">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button 
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
                <button 
                    onClick={() => {
                        closeAndResetModal();
                        setIsModalOpen(true);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} /> Configurar Proceso
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-7 border-b border-slate-100">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-[120px]">
                        {daysInMonth.map((currentDayDate, index) => {
                            const day = currentDayDate.getDate();
                            const yyyy = currentDayDate.getFullYear();
                            const mm = String(currentDayDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(currentDayDate.getDate()).padStart(2, '0');
                            const formattedDate = `${yyyy}-${mm}-${dd}`;
                            
                            const dayAlerts = processesByDay[formattedDate] || [];

                            return (
                                <div 
                                    key={day} 
                                    className="border-b border-r border-slate-100 p-2 relative hover:bg-slate-50 transition-colors"
                                >
                                    <span className={`text-xs font-black ${
                                        currentDayDate.toDateString() === new Date().toDateString() 
                                        ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                                        : 'text-slate-400'
                                    }`}>
                                        {day}
                                    </span>
                                    
                                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                                        {dayAlerts.map(item => (
                                            <div 
                                                key={item.alert.id} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProcess(item.process);
                                                }}
                                                className={`text-[9px] font-bold px-1.5 py-1 rounded truncate border cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${
                                                    item.alert.status === 'TRIGGERED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}
                                                title={`[${item.process.processName}] ${item.alert.title}`}
                                            >
                                                {item.alert.status === 'TRIGGERED' ? <CheckCircle2 size={10} className="shrink-0"/> : <Clock size={10} className="shrink-0"/>}
                                                <span className="truncate">{item.alert.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Plus size={18} className="text-indigo-600" />
                                Configurar Nuevo Proceso
                            </h3>
                            <button onClick={closeAndResetModal} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form id="new-process-form" onSubmit={handleCreateProcess} className="p-6 flex-1 overflow-y-auto space-y-8">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Tag size={12} className="text-indigo-500"/> Definición del Proceso Maestro
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Proceso</label>
                                        <input 
                                            required value={processName} onChange={(e) => setProcessName(e.target.value)} type="text" 
                                            placeholder="Ej: Cierre de Mes Contable"
                                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Área Responsable</label>
                                        <select
                                            required value={area} onChange={(e) => setArea(e.target.value)}
                                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                                        >
                                            <option value="">-- Seleccione un Área --</option>
                                            {organizationAreas.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Desde (Global)</label>
                                        <input 
                                            required value={globalStartDate} onChange={(e) => setGlobalStartDate(e.target.value)} type="date" 
                                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hasta (Global)</label>
                                        <input 
                                            required value={globalEndDate} onChange={(e) => setGlobalEndDate(e.target.value)} type="date" 
                                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} className="text-indigo-500"/> Secuencia de Alertas
                                    </h4>
                                    <button type="button" onClick={handleAddAlert} className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                                        <Plus size={12}/> Agregar Alerta
                                    </button>
                                </div>
                                
                                {alerts.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-xs font-medium text-slate-400">No hay alertas configuradas. Agregue una alerta para inyectar tickets en el Kanban.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {alerts.map((alert, index) => (
                                            <div key={index} className="bg-white border border-slate-200 p-4 rounded-2xl flex gap-4 items-start shadow-sm relative group">
                                                <div className="bg-slate-100 text-slate-400 font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-2">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input required value={alert.title} onChange={e => handleUpdateAlert(index, 'title', e.target.value)} placeholder="Título de la alerta..." className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                                                    <input required value={alert.triggerDate} onChange={e => handleUpdateAlert(index, 'triggerDate', e.target.value)} type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                                                    <input value={alert.description} onChange={e => handleUpdateAlert(index, 'description', e.target.value)} placeholder="Instrucciones adicionales (Opcional)" className="w-full md:col-span-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 italic" />
                                                    <div className="flex gap-2">
                                                        <select value={alert.assignedToId || ''} onChange={e => handleUpdateAlert(index, 'assignedToId', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold uppercase focus:outline-none focus:border-indigo-500">
                                                            <option value="">Analista (Opcional)</option>
                                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                        </select>
                                                        <input required type="number" min="0" value={alert.visibilityWindowDays} onChange={e => handleUpdateAlert(index, 'visibilityWindowDays', parseInt(e.target.value) || 0)} className="w-20 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-center" title="Días de anticipación en Kanban" />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveAlert(index)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>

                        <div className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between shrink-0">
                            <button type="button" onClick={closeAndResetModal} className="px-4 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all">Cancelar</button>
                            <button type="submit" form="new-process-form" className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95">
                                <Send size={14} strokeWidth={3}/> Guardar Proceso
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedProcess && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                                    {selectedProcess.processName}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    <MapPin size={10}/> {selectedProcess.area}
                                </p>
                            </div>
                            <button onClick={() => setSelectedProcess(null)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full border border-slate-200">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inicio Global</div>
                                    <div className="text-xs font-bold text-slate-700">{selectedProcess.globalStartDate}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fin Global</div>
                                    <div className="text-xs font-bold text-slate-700">{selectedProcess.globalEndDate}</div>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Clock size={12} className="text-indigo-500"/> Alertas Programadas
                                </h4>
                                <div className="space-y-2">
                                    {selectedProcess.alerts.map((alert, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <div className="shrink-0">
                                                {alert.status === 'TRIGGERED' ? (
                                                    <CheckCircle2 size={16} className="text-purple-600" />
                                                ) : (
                                                    <Clock size={16} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-slate-800 truncate">{alert.title}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    Día D: {alert.triggerDate}
                                                </div>
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                                                alert.status === 'TRIGGERED' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                                {alert.status === 'TRIGGERED' ? 'En Kanban' : 'Esperando'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
                            <button 
                                onClick={async () => {
                                    if(window.confirm('¿Está seguro de eliminar este proceso? Los tickets que ya nacieron en Kanban seguirán existiendo.')) {
                                        await deleteProcess(selectedProcess.id);
                                        setSelectedProcess(null);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-red-600 hover:bg-red-50 border border-red-100 rounded-xl transition-all"
                            >
                                <Trash2 size={14}/> Eliminar Proceso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
