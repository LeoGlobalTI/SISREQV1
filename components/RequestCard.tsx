
import React, { useState, useEffect } from 'react';
import { RequestCard as RequestCardType, Status } from '../types';
import { useSisreq } from '../context/SisreqContext';
import { PRIORITY_STYLES } from '../constants';
import { User as UserIcon, GripVertical, MapPin, ChevronUp, ChevronDown, Clock, Hash, Building2, AlertCircle, FileText } from 'lucide-react';

interface Props {
  data: RequestCardType;
}

export const RequestCard: React.FC<Props> = ({ data }) => {
  const { setSelectedRequestId, isActionable } = useSisreq();
  const [isMinimized, setIsMinimized] = useState(data.status === Status.FINALIZADO);
  
  useEffect(() => {
    if (data.status === Status.FINALIZADO) {
        setIsMinimized(true);
    }
  }, [data.status]);

  const draggable = isActionable(data);

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('requestId', data.id);
    e.dataTransfer.effectAllowed = 'move';
    
    const dragGhost = e.currentTarget as HTMLElement;
    dragGhost.style.opacity = '0.4';
    setTimeout(() => {
        if (dragGhost) dragGhost.style.opacity = '1';
    }, 0);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRequestId(data.id);
  };

  const getStatusColors = (status: Status) => {
    switch (status) {
        case Status.RECIBIDO: 
            return { border: 'border-indigo-600', outline: 'border-indigo-600/30', text: 'text-indigo-600', bg: 'bg-indigo-600', light: 'bg-indigo-50' };
        case Status.DERIVACION: 
            return { border: 'border-orange-500', outline: 'border-orange-500/30', text: 'text-orange-600', bg: 'bg-orange-500', light: 'bg-orange-50' };
        case Status.EJECUCION: 
            return { border: 'border-amber-500', outline: 'border-amber-500/30', text: 'text-amber-600', bg: 'bg-amber-500', light: 'bg-amber-50' };
        case Status.FINALIZADO: 
            return { border: 'border-emerald-500', outline: 'border-emerald-500/30', text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50' };
        default: 
            return { border: 'border-slate-300', outline: 'border-slate-200', text: 'text-slate-600', bg: 'bg-slate-500', light: 'bg-slate-50' };
    }
  };

  const colors = getStatusColors(data.status);

  return (
    <div 
        draggable={draggable}
        onDragStart={handleDragStart}
        onClick={handleCardClick}
        className={`
            bg-white rounded-2xl relative group transition-all duration-300 ease-out
            shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-slate-200/50
            border-2 ${colors.outline}
            border-t-4 ${colors.border}
            cursor-pointer flex flex-col overflow-hidden
            ${draggable ? 'hover:bg-slate-50/50 active:scale-[0.98]' : 'cursor-default'}
            ${isMinimized ? 'h-[64px] px-4 py-3' : 'h-[185px]'}
        `}
    >
      {/* Header Info (Expanded Only) */}
      {!isMinimized && (
        <div className="px-4 pt-3 flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg text-white shadow-sm opacity-90 ${colors.bg}`}>
                    <FileText size={10} strokeWidth={3}/>
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 font-bold tracking-widest uppercase leading-none mb-0.5">
                        EXPEDIENTE
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono font-bold tracking-tighter leading-none">
                        #{data.id.split('-')[1].toUpperCase()}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                {data.isReturned && (
                     <span className="text-[7px] bg-red-600 text-white px-1.5 py-0.5 rounded-md font-bold tracking-widest flex items-center gap-1 shadow-sm uppercase animate-pulse">
                        <AlertCircle size={8} strokeWidth={3}/> RETORNO
                     </span>
                )}
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md border shadow-sm transition-all uppercase tracking-widest ${PRIORITY_STYLES[data.priority]}`}>
                    {data.priority}
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                    className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-md transition-all"
                >
                    <ChevronUp size={12}/>
                </button>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 px-4 ${isMinimized ? 'flex items-center gap-3 pr-10' : 'flex flex-col'}`}>
        {isMinimized && (
             <div className={`p-1.5 rounded-lg text-white shadow-sm shrink-0 opacity-80 ${colors.bg}`}>
                <FileText size={10} strokeWidth={3}/>
             </div>
        )}
        <h3 className={`font-bold tracking-tight leading-tight transition-colors uppercase
            ${isMinimized ? 'text-[11px] text-slate-700 truncate flex-1' : 'text-[13px] text-slate-800 mb-2 line-clamp-2'}`}>
            {data.title}
        </h3>
        
        {!isMinimized && (
            <div className="flex-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80 mb-3 overflow-hidden">
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 font-medium italic">
                    {data.detail}
                </p>
            </div>
        )}

        {isMinimized && (
             <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                className="absolute right-4 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-md transition-all"
            >
                <ChevronDown size={14}/>
            </button>
        )}
      </div>

      {/* Footer (Expanded Only) */}
      {!isMinimized && (
          <div className="mt-auto p-4 pt-3 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-2 shrink-0">
             <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50 w-fit">
                        <MapPin size={9} strokeWidth={3} /> {data.area}
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-400 uppercase tracking-tighter max-w-[130px]">
                        <Building2 size={9} className="opacity-40" />
                        <span className="truncate">{data.requester}</span>
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                    {data.assignedAnalyst ? (
                        <div className="flex items-center gap-1.5 bg-slate-700 text-white px-2 py-1 rounded-md text-[7px] font-bold border border-slate-800 shadow-sm" title="Responsable Técnico">
                            <UserIcon size={8} strokeWidth={3} />
                            <span className="truncate max-w-[65px] uppercase">{data.assignedAnalyst.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-slate-400 font-mono text-[8px] font-bold bg-white px-1.5 py-0.5 rounded-md border border-slate-100">
                            <Clock size={9} strokeWidth={3} />
                            {new Date(data.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                        </div>
                    )}
                </div>
             </div>
          </div>
      )}
    </div>
  );
};
