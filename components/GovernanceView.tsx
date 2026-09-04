import React, { useMemo, useState } from 'react';
import { useSisreq } from '../context/SisreqContext';
import { Status, UserRole } from '../types';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, GitBranch, 
  BookOpen, Download, Activity, Database, FileText,
  TerminalSquare, Clock, ArrowRight, Zap, RefreshCw, Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const VERSIONS = [
  {
    version: 'v4.0.0-BENTO',
    codename: 'Governance & Bento Architecture',
    date: '04 de Septiembre 2026',
    type: 'MAJOR',
    highlights: ['Consolidación del Master Panel en arquitectura Bento Grid.', 'Centro de Mando Organizacional.', 'Módulo de Gobernanza Unificada.']
  },
  {
    version: 'v3.5.0-MASTER',
    codename: 'Executive Insight & Governance',
    date: '27 de Agosto 2026',
    type: 'MINOR',
    highlights: ['Inteligencia Operativa y desempeño.', 'Control Maestro para SuperAdmin.', 'Enfoque Sistémico y calibración ergonómica.']
  },
  {
    version: 'v3.4.2-MASTER',
    codename: 'Ergonomic Workspace Layout',
    date: '27 de Agosto 2026',
    type: 'PATCH',
    highlights: ['Rediseño a dos columnas del expediente técnico.', 'Calibración matemática del ancho modal.']
  }
];

export const GovernanceView: React.FC = () => {
  const { requests, users, organizationAreas } = useSisreq();
  const [isExporting, setIsExporting] = useState(false);

  // --- AUDIT METRICS ---
  const auditStats = useMemo(() => {
    const total = requests.length;
    const deleted = requests.filter(r => r.deletedAt).length;
    const active = requests.filter(r => !r.deletedAt);
    
    // SLA Breaches
    let slaBreaches = 0;
    const now = new Date();
    active.forEach(r => {
      if (r.status !== Status.FINALIZADO && r.status !== Status.CANCELADO) {
        const daysOpen = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 3600 * 24));
        if (daysOpen > 30) slaBreaches++; // Example SLA logic
      }
    });

    // Orphans / Unassigned
    const noAnalyst = active.filter(r => 
      (r.status === Status.EN_EJECUCION || r.status === Status.DERIVADO) && !r.assignedToId
    ).length;
    
    const unassignedUsers = users.filter(u => !u.area && (!u.areas || u.areas.length === 0)).length;

    // Health Score Calculation (0-100)
    let score = 100;
    if (total > 0) {
        score -= (slaBreaches / total) * 20;
        score -= (noAnalyst / total) * 30;
    }
    score -= (unassignedUsers * 2);
    score = Math.max(0, Math.min(100, Math.round(score)));

    const anomalies = [
      { type: 'WARNING', title: 'SLA Crítico Vencido', count: slaBreaches, desc: 'Expedientes abiertos por más de 30 días.' },
      { type: 'ERROR', title: 'Ejecución sin Analista', count: noAnalyst, desc: 'Expedientes en progreso sin responsable.' },
      { type: 'WARNING', title: 'Usuarios Huérfanos', count: unassignedUsers, desc: 'Colaboradores sin área operativa asignada.' },
      { type: 'INFO', title: 'Papelera Inmutable', count: deleted, desc: 'Expedientes eliminados lógicamente (Soft Delete).' },
    ];

    return { total, deleted, active: active.length, score, anomalies };
  }, [requests, users]);


  // --- DOCS GENERATION ---
  const handleExportPDF = (type: 'USER' | 'ORG' | 'TECH') => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      
      let title = '';
      if (type === 'USER') title = 'MANUAL DE USUARIO Y PROCESOS';
      if (type === 'ORG') title = 'GUÍA DE ORGANIZACIÓN';
      if (type === 'TECH') title = 'MEMORIA TÉCNICA (ARQUITECTURA)';

      doc.text(title, 20, 25);
      
      doc.setFontSize(10);
      doc.text('Global TI Sisreq 2026 • Generado Automáticamente', 20, 32);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      
      let yPos = 60;

      if (type === 'TECH') {
          doc.text('Resumen del Sistema', 20, yPos);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Arquitectura: React + Vite + Tailwind CSS', 20, yPos + 10);
          doc.text('Gestión de Estado: Context API (useSisreq)', 20, yPos + 18);
          doc.text('Versión Actual: v4.0.0-BENTO', 20, yPos + 26);
          yPos += 40;
      }

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Sección', 'Descripción']],
        body: [
          ['1', 'Reportes', 'Dashboard analítico con KPIs.'],
          ['2', 'Organización', 'Gestión de áreas y usuarios.'],
          ['3', 'Gobernanza', 'Auditoría, versiones y documentación.'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`GlobalTI_${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Compacto */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-sm">
                <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Gobernanza y Salud del Sistema
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Auditoría • Versiones • Documentación
                  </span>
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      <GitBranch size={10} /> v4.0.0-BENTO
                  </span>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO GRID: Gobernanza */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* LEFT COLUMN: Auditoría (60%) */}
          <div className="w-full xl:w-3/5 flex flex-col gap-6">
              
              {/* Health Score & Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 sm:col-span-1">
                      <div className={`p-4 rounded-2xl border shadow-sm ${
                          auditStats.score > 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          auditStats.score > 70 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-red-50 text-red-600 border-red-100'
                      }`}>
                          <Activity size={24} />
                      </div>
                      <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Health Score</div>
                          <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                              {auditStats.score}<span className="text-sm text-slate-400">%</span>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 sm:col-span-2">
                      <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 shadow-sm">
                          <Database size={24} />
                      </div>
                      <div className="flex gap-10">
                          <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expedientes Activos</div>
                              <div className="text-2xl font-black text-slate-900 tracking-tight">{auditStats.active}</div>
                          </div>
                          <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volumen Total</div>
                              <div className="text-2xl font-black text-slate-900 tracking-tight">{auditStats.total}</div>
                          </div>
                          <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Papelera (Soft Delete)</div>
                              <div className="text-2xl font-black text-slate-900 tracking-tight">{auditStats.deleted}</div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Monitor de Anomalías */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TerminalSquare size={16} className="text-indigo-600"/>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                          Monitor de Anomalías Operativas
                        </h3>
                      </div>
                      <button className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                          <RefreshCw size={12} /> Actualizar
                      </button>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto">
                      <div className="space-y-3">
                          {auditStats.anomalies.map((anomaly, idx) => (
                              <div key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border ${
                                anomaly.type === 'ERROR' ? 'bg-red-50/50 border-red-100' :
                                anomaly.type === 'WARNING' ? 'bg-amber-50/50 border-amber-100' :
                                'bg-slate-50 border-slate-200'
                              }`}>
                                  <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                                      anomaly.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                                      anomaly.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-200 text-slate-600'
                                  }`}>
                                      {anomaly.type === 'ERROR' ? <AlertTriangle size={18} /> :
                                       anomaly.type === 'WARNING' ? <Zap size={18} /> :
                                       <Layers size={18} />}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                          <h4 className={`font-black uppercase text-sm ${
                                              anomaly.type === 'ERROR' ? 'text-red-900' :
                                              anomaly.type === 'WARNING' ? 'text-amber-900' :
                                              'text-slate-800'
                                          }`}>
                                              {anomaly.title}
                                          </h4>
                                          <span className="text-2xl font-black text-slate-900 tracking-tighter">
                                              {anomaly.count}
                                          </span>
                                      </div>
                                      <p className="text-xs font-medium text-slate-500 mt-1">
                                          {anomaly.desc}
                                      </p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

          </div>

          {/* RIGHT COLUMN (40%) */}
          <div className="w-full xl:w-2/5 flex flex-col gap-6">
              
              {/* Docs Hub */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-600"/>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                          Centro de Documentación
                        </h3>
                      </div>
                  </div>
                  <div className="p-5 space-y-3">
                      <button 
                        onClick={() => handleExportPDF('USER')}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                      >
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
                                  <FileText size={18} />
                              </div>
                              <div className="text-left">
                                  <div className="text-xs font-black text-slate-900 uppercase">Manual de Usuario</div>
                                  <div className="text-[10px] font-bold text-slate-400">Procesos y flujos</div>
                              </div>
                          </div>
                          <Download size={16} className="text-slate-400 group-hover:text-indigo-600" />
                      </button>

                      <button 
                        onClick={() => handleExportPDF('ORG')}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                      >
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition-transform">
                                  <Layers size={18} />
                              </div>
                              <div className="text-left">
                                  <div className="text-xs font-black text-slate-900 uppercase">Guía de Organización</div>
                                  <div className="text-[10px] font-bold text-slate-400">Roles y permisos</div>
                              </div>
                          </div>
                          <Download size={16} className="text-slate-400 group-hover:text-emerald-600" />
                      </button>

                      <button 
                        onClick={() => handleExportPDF('TECH')}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-50"
                      >
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-slate-900 text-white rounded-xl group-hover:scale-110 transition-transform">
                                  <TerminalSquare size={18} />
                              </div>
                              <div className="text-left">
                                  <div className="text-xs font-black text-slate-900 uppercase">Memoria Técnica</div>
                                  <div className="text-[10px] font-bold text-slate-400">Arquitectura de software</div>
                              </div>
                          </div>
                          <Download size={16} className="text-slate-400 group-hover:text-slate-900" />
                      </button>
                  </div>
              </div>

              {/* Version History */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-indigo-600"/>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                          Registro de Versiones
                        </h3>
                      </div>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
                          {VERSIONS.map((v, idx) => (
                              <div key={idx} className="relative pl-6">
                                  <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white ${
                                      v.status === 'CURRENT' || idx === 0 ? 'bg-indigo-600' : 'bg-slate-300'
                                  }`} />
                                  <div className="flex items-baseline gap-2 mb-1">
                                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{v.version}</h4>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                          {v.type}
                                      </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                      <Clock size={10} /> {v.date}
                                  </div>
                                  <p className="text-xs font-bold text-slate-700 italic mb-3">"{v.codename}"</p>
                                  
                                  <ul className="space-y-1.5">
                                      {v.highlights.map((h, i) => (
                                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                              <span className="leading-relaxed">{h}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

          </div>
        </div>

      </div>
    </div>
  );
};
