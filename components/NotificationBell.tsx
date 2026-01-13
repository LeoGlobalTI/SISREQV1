
import React, { useState, useRef, useEffect } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Bell, Info, CheckCircle, AlertTriangle, PlayCircle, Trash2, X, Clock, ExternalLink, Settings2 } from 'lucide-react';
import { NotificationType } from '../types';
import { NotificationSettingsModal } from './NotificationSettingsModal';

export const NotificationBell: React.FC = () => {
  const { notifications, markNotificationAsRead, clearNotifications, setSelectedRequestId } = useSisreq();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle size={14} className="text-red-500" />;
      case 'PROCESS': return <PlayCircle size={14} className="text-indigo-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  const handleNotificationClick = (id: string, requestId?: string) => {
    markNotificationAsRead(id);
    if (requestId) {
        setSelectedRequestId(requestId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all relative group ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
      >
        <Bell size={20} strokeWidth={2.5} className={unreadCount > 0 ? 'animate-swing' : ''} />
        {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 max-h-[550px]">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Centro de Notificaciones</h3>
            <div className="flex gap-1">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Ajustes de Alertas"
                >
                    <Settings2 size={14} />
                </button>
                <button 
                    onClick={clearNotifications}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Limpiar Todo"
                >
                    <Trash2 size={14} />
                </button>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                    {notifications.map(n => (
                        <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id, n.requestId)}
                            className={`p-5 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-indigo-50/20' : ''}`}
                        >
                            {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>}
                            <div className="flex gap-4">
                                <div className={`shrink-0 p-2.5 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center h-fit ${!n.isRead ? 'ring-2 ring-indigo-500/10' : ''}`}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`text-[11px] font-black uppercase tracking-tight truncate pr-2 ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {n.title}
                                        </h4>
                                        <span className="text-[8px] text-slate-300 font-mono shrink-0 flex items-center gap-1">
                                            <Clock size={8}/> {new Date(n.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        {n.message}
                                    </p>
                                    {n.requestId && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[8px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ir al Expediente #{(n.requestId.split('-')[1] || '').toUpperCase()} <ExternalLink size={9} strokeWidth={2.5}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-16 text-center flex flex-col items-center gap-4">
                    <div className="bg-slate-50 p-6 rounded-full border border-dashed border-slate-200">
                        <Bell size={32} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin alertas nuevas en bandeja</p>
                </div>
            )}
          </div>
          
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
            <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">
                Ver Historial de Operaciones
            </button>
          </div>
        </div>
      )}

      <NotificationSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};
