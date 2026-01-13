
import React from 'react';
import { useSisreq } from '../context/SisreqContext';
import { 
  X, Bell, Volume2, Settings2, FilePlus, 
  RefreshCcw, RotateCcw, UserPlus, ShieldAlert, CheckCircle2 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { notificationSettings, updateNotificationSettings } = useSisreq();

  if (!isOpen) return null;

  const toggle = (key: keyof typeof notificationSettings) => {
    updateNotificationSettings({ [key]: !notificationSettings[key] });
  };

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick 
  }: { 
    icon: any, 
    label: string, 
    value: boolean, 
    onClick: () => void 
  }) => (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${value ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 bg-slate-100'}`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{label}</span>
      </div>
      <button 
        onClick={onClick}
        className={`relative w-9 h-5 rounded-full transition-all duration-300 outline-none ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-end p-4 pt-20 pr-8">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 border border-slate-200 flex flex-col">
        
        {/* Header Simplificado */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <Settings2 size={16} className="text-indigo-600" strokeWidth={2.5}/>
             <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Ajustes de Alertas</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-md transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body Minimalista */}
        <div className="p-4 space-y-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="px-2 pb-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preferencias Globales</p>
            </div>
            
            <SettingRow 
                icon={Bell} 
                label="Mostrar Notificaciones" 
                value={notificationSettings.enabled} 
                onClick={() => toggle('enabled')} 
            />
            <SettingRow 
                icon={Volume2} 
                label="Sonidos del Sistema" 
                value={notificationSettings.sounds} 
                onClick={() => toggle('sounds')} 
            />

            <div className="h-px bg-slate-100 my-2 mx-2"></div>

            <div className="px-2 pb-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Eventos a Notificar</p>
            </div>

            <SettingRow 
                icon={FilePlus} 
                label="Nuevos Expedientes" 
                value={notificationSettings.newRequests} 
                onClick={() => toggle('newRequests')} 
            />
            <SettingRow 
                icon={RefreshCcw} 
                label="Cambios de Estado" 
                value={notificationSettings.statusChanges} 
                onClick={() => toggle('statusChanges')} 
            />
            <SettingRow 
                icon={RotateCcw} 
                label="Tickets Devueltos" 
                value={notificationSettings.returns} 
                onClick={() => toggle('returns')} 
            />
            <SettingRow 
                icon={UserPlus} 
                label="Designaciones" 
                value={notificationSettings.assignments} 
                onClick={() => toggle('assignments')} 
            />
            <SettingRow 
                icon={ShieldAlert} 
                label="Eventos de Auditoría" 
                value={notificationSettings.auditAlerts} 
                onClick={() => toggle('auditAlerts')} 
            />
        </div>

        {/* Footer Minimalista */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-center">
            <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <CheckCircle2 size={14} /> Aplicar y Cerrar
            </button>
        </div>

      </div>
    </div>
  );
};
