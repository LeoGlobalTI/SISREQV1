import React, { useState, useMemo } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { ScheduledProcess, ProcessAlert, User, AlertFrequency } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User as UserIcon, Tag, AlignLeft, Send, Trash2, CheckCircle2, Info, Edit3, Repeat, Layers } from 'lucide-react';

export const PlannerView: React.FC = () => {
    const { scheduledProcesses, addProcess, updateProcess, deleteProcess, users, organizationAreas, currentUser, addNotification } = useSisreq();

    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Estado del formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
    const [showRoutinesDrawer, setShowRoutinesDrawer] = useState(false);
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
        setEditingProcessId(null);
        setProcessName('');
        setArea('');
        setGlobalStartDate('');
        setGlobalEndDate('');
        setAlerts([]);
    };

    const handleStartEditProcess = (proc: ScheduledProcess) => {
        setEditingProcessId(proc.id);
        setProcessName(proc.processName);
        setArea(proc.area);
        setGlobalStartDate(proc.globalStartDate);
        setGlobalEndDate(proc.globalEndDate);
        setAlerts(proc.alerts.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
            assignedToId: a.assignedToId,
            triggerDate: a.triggerDate,
            frequency: a.frequency || 'ONCE',
            visibilityWindowDays: a.visibilityWindowDays,
            status: a.status,
            linkedRequestId: a.linkedRequestId
        } as any)));
        setSelectedProcess(null);
        setIsModalOpen(true);
    };

    const handleAddAlert = () => {
        setAlerts([...alerts, {
            title: '',
            description: '',
            assignedToId: null,
            triggerDate: '',
            frequency: 'MONTHLY',
            visibilityWindowDays: 0
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

    const handleSaveProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (alerts.length === 0) {
            addNotification('WARNING', 'Alerta Requerida', 'Debe agregar al menos una alerta al proceso.');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(globalStartDate + 'T00:00:00');
        const end = new Date(globalEndDate + 'T23:59:59');
        if (end < start) {
            addNotification('WARNING', 'Rango Inválido', 'La fecha límite (Hasta) no puede ser anterior a la fecha de inicio (Desde).');
            return;
        }
        
        // Asegurar que todas las fechas de alertas sean válidas
        for (const alert of alerts) {
             if(!alert.title || !alert.triggerDate) {
                 addNotification('WARNING', 'Datos Incompletos', 'Todas las alertas deben tener título y fecha programada.');
                 return;
             }
             const trigger = new Date(alert.triggerDate + 'T00:00:00');
             
             if (trigger < today) {
                 addNotification('WARNING', 'Fecha Pasada', `No se pueden crear requerimientos con fechas pasadas. La alerta "${alert.title}" tiene fecha ${alert.triggerDate}.`);
                 return;
             }

             if (trigger < start || trigger > end) {
                 addNotification('WARNING', 'Fecha Fuera de Rango', `La alerta "${alert.title}" tiene una fecha (${alert.triggerDate}) fuera del rango global (${globalStartDate} a ${globalEndDate}).`);
                 return;
             }
        }

        if (editingProcessId) {
            const existing = scheduledProcesses.find(p => p.id === editingProcessId);
            const updatedAlerts: ProcessAlert[] = alerts.map(a => {
                const existingAlert = existing?.alerts.find(orig => orig.id === (a as any).id);
                return {
                    id: (a as any).id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString()),
                    title: a.title,
                    description: a.description,
                    assignedToId: a.assignedToId,
                    triggerDate: a.triggerDate,
                    frequency: (a.frequency as AlertFrequency) || 'MONTHLY',
                    visibilityWindowDays: 0,
                    status: existingAlert ? existingAlert.status : 'WAITING',
                    linkedRequestId: existingAlert ? existingAlert.linkedRequestId : null
                };
            });

            await updateProcess({
                id: editingProcessId,
                processName,
                area: area || '',
                globalStartDate,
                globalEndDate,
                status: existing?.status || 'ACTIVE',
                alerts: updatedAlerts
            });
            addNotification('SUCCESS', 'Rutina Actualizada', `La rutina "${processName}" se ha actualizado con éxito.`);
        } else {
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
                    frequency: (a.frequency as AlertFrequency) || 'MONTHLY',
                    visibilityWindowDays: 0,
                    status: 'WAITING',
                    linkedRequestId: null
                }))
            });
        }
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
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowRoutinesDrawer(true)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xs active:scale-95"
                    >
                        <Layers size={15} className="text-indigo-600" /> Gestionar Rutinas ({scheduledProcesses.length})
                    </button>
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
                                                    item.alert.frequency && item.alert.frequency !== 'ONCE' ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}
                                                title={`[${item.process.processName}] ${item.alert.title} (${item.alert.frequency === 'WEEKLY' ? 'Semanal' : item.alert.frequency === 'MONTHLY' ? 'Mensual' : item.alert.frequency === 'YEARLY' ? 'Anual' : 'Puntual'})`}
                                            >
                                                {item.alert.status === 'TRIGGERED' ? (
                                                    <CheckCircle2 size={10} className="shrink-0 text-purple-600"/>
                                                ) : item.alert.frequency && item.alert.frequency !== 'ONCE' ? (
                                                    <Repeat size={10} className="shrink-0 text-indigo-600"/>
                                                ) : (
                                                    <Clock size={10} className="shrink-0 text-slate-400"/>
                                                )}
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

            {/* Creation / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                {editingProcessId ? (
                                    <>
                                        <Edit3 size={18} className="text-indigo-600" />
                                        Editar Rutina / Proceso Maestro
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} className="text-indigo-600" />
                                        Configurar Nuevo Proceso
                                    </>
                                )}
                            </h3>
                            <button onClick={closeAndResetModal} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form id="new-process-form" onSubmit={handleSaveProcess} className="p-6 flex-1 overflow-y-auto space-y-8">
                            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm border border-indigo-100/50 shrink-0">
                                    <Info size={16} />
                                </div>
                                <div className="text-xs text-slate-600 space-y-1">
                                    <div className="font-bold text-slate-800">Parámetros Automáticos de Gestión Interna</div>
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                        Cada alerta generada para esta rutina se inyectará en el flujo Kanban con nivel de urgencia <strong className="text-red-700 font-bold">Alto</strong>, modalidad comercial <strong className="text-indigo-700 font-bold">Recurrente</strong> y solicitante el propio <strong className="text-slate-800 font-bold">Sistema</strong>. Si se selecciona frecuencia semanal, mensual o anual, se reprogramará automáticamente tras su inyección.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Tag size={12} className="text-indigo-500"/> Definición del Proceso Maestro
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Proceso / Rutina</label>
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
                                        <Clock size={12} className="text-indigo-500"/> Secuencia de Alertas y Frecuencias
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
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Título de Alerta</label>
                                                        <input required value={alert.title} onChange={e => handleUpdateAlert(index, 'title', e.target.value)} placeholder="Título de la alerta..." className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Fecha Programada (Día D)</label>
                                                        <input required value={alert.triggerDate} onChange={e => handleUpdateAlert(index, 'triggerDate', e.target.value)} type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Instrucciones Adicionales (Opcional)</label>
                                                        <input value={alert.description} onChange={e => handleUpdateAlert(index, 'description', e.target.value)} placeholder="Instrucciones adicionales para el equipo..." className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 italic" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Frecuencia</label>
                                                            <select 
                                                                value={alert.frequency || 'MONTHLY'} 
                                                                onChange={e => handleUpdateAlert(index, 'frequency', e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-xs font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                                                            >
                                                                <option value="ONCE">🎯 Puntual (Única)</option>
                                                                <option value="WEEKLY">🔄 Semanal</option>
                                                                <option value="MONTHLY">📅 Mensual</option>
                                                                <option value="YEARLY">🗓️ Anual</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Analista</label>
                                                            <select value={alert.assignedToId || ''} onChange={e => handleUpdateAlert(index, 'assignedToId', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[10px] font-bold uppercase focus:outline-none focus:border-indigo-500">
                                                                <option value="">Opcional</option>
                                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 md:col-span-2 pt-2 border-t border-slate-100">
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                                            Urgencia: Alto
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                            Modalidad: Recurrente
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                            Origen: Sistema
                                                        </span>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                                            alert.frequency === 'WEEKLY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            alert.frequency === 'MONTHLY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            alert.frequency === 'YEARLY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                            Frecuencia: {
                                                                alert.frequency === 'WEEKLY' ? 'Semanal' :
                                                                alert.frequency === 'MONTHLY' ? 'Mensual' :
                                                                alert.frequency === 'YEARLY' ? 'Anual' :
                                                                'Puntual'
                                                            }
                                                        </span>
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
                                <Send size={14} strokeWidth={3}/> {editingProcessId ? 'Guardar Cambios de Rutina' : 'Guardar Proceso'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedProcess && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
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
                                    <Clock size={12} className="text-indigo-500"/> Alertas Programadas y Frecuencia
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
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                                        Urgencia: Alto
                                                    </span>
                                                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        Modalidad: Recurrente
                                                    </span>
                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                                        alert.frequency === 'WEEKLY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        alert.frequency === 'MONTHLY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        alert.frequency === 'YEARLY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {alert.frequency === 'WEEKLY' ? '🔄 Semanal' :
                                                         alert.frequency === 'MONTHLY' ? '📅 Mensual' :
                                                         alert.frequency === 'YEARLY' ? '🗓️ Anual' :
                                                         '🎯 Puntual'}
                                                    </span>
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
                        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between">
                            <button 
                                onClick={() => handleStartEditProcess(selectedProcess)}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs"
                            >
                                <Edit3 size={14}/> Editar Rutina
                            </button>
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

            {/* Routines Drawer / Management Modal */}
            {showRoutinesDrawer && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 text-sm">
                                    <Layers size={18} className="text-indigo-600" />
                                    Gestión de Rutinas y Procesos Programados
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Visualiza y edita todas las rutinas configuradas en el sistema
                                </p>
                            </div>
                            <button onClick={() => setShowRoutinesDrawer(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full border border-slate-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            {scheduledProcesses.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                    <CalendarIcon className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No hay rutinas programadas</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Crea tu primera rutina con el botón "Configurar Proceso".</p>
                                </div>
                            ) : (
                                scheduledProcesses.map(proc => (
                                    <div key={proc.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-900 text-sm truncate">{proc.processName}</h4>
                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {proc.area || 'Sin Área'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                Vigencia: <span className="font-bold text-slate-700">{proc.globalStartDate}</span> al <span className="font-bold text-slate-700">{proc.globalEndDate}</span>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {proc.alerts.length} alerta{proc.alerts.length !== 1 ? 's' : ''}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {proc.alerts.map((al, idx) => (
                                                        <span key={idx} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                            {al.frequency === 'WEEKLY' ? 'Semanal' :
                                                             al.frequency === 'MONTHLY' ? 'Mensual' :
                                                             al.frequency === 'YEARLY' ? 'Anual' : 'Puntual'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button 
                                                onClick={() => {
                                                    setShowRoutinesDrawer(false);
                                                    handleStartEditProcess(proc);
                                                }}
                                                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                                                title="Editar rutina"
                                            >
                                                <Edit3 size={14} /> Editar
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if(window.confirm(`¿Desea eliminar la rutina "${proc.processName}"?`)) {
                                                        await deleteProcess(proc.id);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Eliminar rutina"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <button 
                                onClick={() => {
                                    setShowRoutinesDrawer(false);
                                    closeAndResetModal();
                                    setIsModalOpen(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-xs"
                            >
                                <Plus size={14} /> Nueva Rutina
                            </button>
                            <button 
                                onClick={() => setShowRoutinesDrawer(false)}
                                className="px-4 py-2 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700"
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
