import React, { useState, useEffect } from 'react';
import { 
    GitBranch, Tag, ShieldCheck, Clock, CheckCircle2, 
    Plus, Calendar, Server, Cpu, Database, Award, 
    ArrowUpRight, Sparkles, History, AlertCircle, FileText, ChevronRight
} from 'lucide-react';

export interface VersionEntry {
  id: string;
  version: string;
  codename: string;
  releaseDate: string;
  type: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
  author: string;
  commitHash: string;
  highlights: string[];
  status: 'CURRENT' | 'STABLE' | 'DEPRECATED';
}

const INITIAL_VERSIONS: VersionEntry[] = [
  {
    id: 'ver-350',
    version: 'v3.5.0-MASTER',
    codename: 'Executive Insight & Governance',
    releaseDate: '27 de Agosto 2026',
    type: 'MINOR',
    author: 'Global TI 2026',
    commitHash: 'gti-89f42d1',
    highlights: [
      'Inteligencia Operativa: Incorporación de métricas de desempeño y carga analítica por usuario.',
      'Control Maestro: Módulo institucional de versionamiento semántico y release notes para SuperAdmin.',
      'Enfoque Sistémico: Visualización integral del tablero general y calibración ergonómica de expedientes.',
      'Identidad Corporativa: Integración del sello y garantía "Powered by Global TI 2026".'
    ],
    status: 'CURRENT'
  },
  {
    id: 'ver-342',
    version: 'v3.4.2-MASTER',
    codename: 'Ergonomic Workspace Layout',
    releaseDate: '27 de Agosto 2026',
    type: 'PATCH',
    author: 'Global TI 2026',
    commitHash: 'gti-71e3b09',
    highlights: [
      'Rediseño a dos columnas del expediente técnico y log cronológico de trazabilidad.',
      'Calibración matemática del ancho modal para lectura óptima de especificaciones.'
    ],
    status: 'STABLE'
  },
  {
    id: 'ver-340',
    version: 'v3.4.0-MASTER',
    codename: 'Forensic Audit & Data Retention',
    releaseDate: '25 de Agosto 2026',
    type: 'MINOR',
    author: 'Global TI 2026',
    commitHash: 'gti-55a19c8',
    highlights: [
      'Papelera forense protegida para SuperAdmin con historial inmutable de borrado.',
      'Registro unificado de trazabilidad cronológica con actores, roles y estampas de tiempo.'
    ],
    status: 'STABLE'
  },
  {
    id: 'ver-320',
    version: 'v3.2.0-STABLE',
    codename: 'Dual Profile & Delegation Engine',
    releaseDate: '20 de Agosto 2026',
    type: 'MINOR',
    author: 'Global TI 2026',
    commitHash: 'gti-40d82ea',
    highlights: [
      'Capacidad de supervisión transversal para Jefaturas de Área.',
      'Asignación directa y derivación interdepartamental de analistas con validación de roles.'
    ],
    status: 'STABLE'
  },
  {
    id: 'ver-300',
    version: 'v3.0.0-CORE',
    codename: 'ANSI Workflow Architecture',
    releaseDate: '10 de Agosto 2026',
    type: 'MAJOR',
    author: 'Global TI 2026',
    commitHash: 'gti-10c0001',
    highlights: [
      'Motor central de 4 estados: Recibido, Derivación, Ejecución y Finalizado.',
      'Control de SLA de 5 días hábiles para cierre normativo de requerimientos.'
    ],
    status: 'STABLE'
  }
];

export const VersioningView: React.FC = () => {
  const [versions, setVersions] = useState<VersionEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sisreq_version_history');
      return saved ? JSON.parse(saved) : INITIAL_VERSIONS;
    } catch (e) {
      return INITIAL_VERSIONS;
    }
  });

  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version: '',
    codename: '',
    type: 'MINOR' as 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX',
    highlights: '',
    author: 'Global TI 2026'
  });

  const saveVersions = (updated: VersionEntry[]) => {
    setVersions(updated);
    try {
      localStorage.setItem('sisreq_version_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.version.trim()) return;

    const highlightsArray = newVersion.highlights
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const created: VersionEntry = {
      id: `ver-${Date.now()}`,
      version: newVersion.version.trim().startsWith('v') ? newVersion.version.trim() : `v${newVersion.version.trim()}`,
      codename: newVersion.codename.trim() || 'Despliegue Maestro',
      releaseDate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
      type: newVersion.type,
      author: newVersion.author || 'Global TI 2026',
      commitHash: `gti-${Math.random().toString(36).substring(2, 9)}`,
      highlights: highlightsArray.length > 0 ? highlightsArray : ['Despliegue operativo registrado en la consola Master.'],
      status: 'STABLE'
    };

    // Marcar como corriente si es deseado
    const updated = [created, ...versions];
    saveVersions(updated);
    setIsModalOpen(false);
    setNewVersion({
      version: '',
      codename: '',
      type: 'MINOR',
      highlights: '',
      author: 'Global TI 2026'
    });
  };

  const currentVersion = versions[0] || INITIAL_VERSIONS[0];

  const filteredVersions = versions.filter(v => {
    if (filterType === 'ALL') return true;
    return v.type === filterType;
  });

  const getTypeBadge = (type: VersionEntry['type']) => {
    switch (type) {
      case 'MAJOR':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">MAJOR RELEASE</span>;
      case 'MINOR':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">MINOR ENHANCEMENT</span>;
      case 'PATCH':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">PATCH / UX</span>;
      case 'HOTFIX':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">HOTFIX CRÍTICO</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
      {/* Header Institucional */}
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                <GitBranch size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Control de Versionamiento
              </h3>
            </div>
            
            <div className="flex items-center gap-6 mt-4 overflow-x-auto">
              {['ALL', 'MAJOR', 'MINOR', 'PATCH'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                    filterType === t 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t === 'ALL' ? 'Todas las versiones' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} /> Registrar Release
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Versión Activa en Producción */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-8 shadow-sm border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Producción
              </span>
              <span className="bg-white/10 text-slate-300 border border-white/20 px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider">
                {currentVersion.commitHash}
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
                {currentVersion.version}
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1">
                Codename: <span className="text-indigo-400 font-semibold">{currentVersion.codename}</span>
              </p>
            </div>

            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Instancia principal compilada para el entorno corporativo con arquitectura de alta disponibilidad, auditoría forense inmutable y control estricto de roles RBAC.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Server size={10} className="text-indigo-400"/> DESPLIEGUE
              </p>
              <p className="text-xs font-black text-white uppercase">Cloud Run Container</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Clock size={10} className="text-emerald-400"/> FECHA CORTE
              </p>
              <p className="text-xs font-black text-white uppercase">{currentVersion.releaseDate}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl col-span-2 sm:col-span-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Award size={10} className="text-amber-400"/> AUTORÍA
              </p>
              <p className="text-xs font-black text-white uppercase truncate">Global TI 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial Cronológico de Versiones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-indigo-600" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
              Registro de Releases & Registro de Cambios (Changelog)
            </h4>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {filteredVersions.length} {filteredVersions.length === 1 ? 'versión registrada' : 'versiones registradas'}
          </span>
        </div>

        <div className="space-y-4">
          {filteredVersions.map((v, idx) => (
            <div 
              key={v.id || idx}
              className={`bg-white rounded-2xl p-6 border transition-all duration-200 hover:shadow-md ${
                v.status === 'CURRENT' ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-sm' : 'border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 font-mono">
                    {v.version.replace('-MASTER', '').replace('-STABLE', '').replace('-CORE', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900 uppercase font-mono tracking-tight">{v.version}</span>
                      {getTypeBadge(v.type)}
                      {v.status === 'CURRENT' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest">
                          ACTIVA
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                      {v.codename}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" /> {v.releaseDate}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    <Tag size={11} /> {v.commitHash}
                  </span>
                  <span className="text-indigo-600 font-black">
                    {v.author}
                  </span>
                </div>
              </div>

              {/* Highlights List */}
              <div className="pt-4">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-500" /> NOTAS DE VERSIÓN Y MEJORAS TÉCNICAS
                </p>
                <ul className="space-y-1.5">
                  {v.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <CheckCircle2 size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para Registrar Nueva Versión */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <GitBranch size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Registrar Nueva Versión</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Master Release • Global TI 2026</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-black text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tag de Versión (ej: v3.6.0-MASTER)</label>
                <input 
                  type="text"
                  required
                  placeholder="v3.6.0-MASTER"
                  value={newVersion.version}
                  onChange={e => setNewVersion({ ...newVersion, version: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo de Release</label>
                  <select
                    value={newVersion.type}
                    onChange={e => setNewVersion({ ...newVersion, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-600 focus:bg-white uppercase"
                  >
                    <option value="MINOR">MINOR (Mejoras)</option>
                    <option value="MAJOR">MAJOR (Estructural)</option>
                    <option value="PATCH">PATCH (Corrección UX)</option>
                    <option value="HOTFIX">HOTFIX (Crítico)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Codename</label>
                  <input 
                    type="text"
                    placeholder="ej: Enhanced Analytics"
                    value={newVersion.codename}
                    onChange={e => setNewVersion({ ...newVersion, codename: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Autor / Responsable del Despliegue</label>
                <input 
                  type="text"
                  value={newVersion.author}
                  onChange={e => setNewVersion({ ...newVersion, author: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Notas de Versión (una por línea)</label>
                <textarea 
                  rows={3}
                  placeholder="Nuevas métricas analíticas...&#10;Ajustes de auditoría en base de datos..."
                  value={newVersion.highlights}
                  onChange={e => setNewVersion({ ...newVersion, highlights: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md"
                >
                  Guardar Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
