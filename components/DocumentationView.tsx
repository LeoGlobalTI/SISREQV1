import React, { useState } from 'react';
import { 
    Book, 
    Code, 
    FileText, 
    Shield, 
    Zap, 
    Database, 
    User, 
    ArrowRight, 
    LayoutDashboard, 
    GitPullRequest, 
    CheckCircle2, 
    Lock,
    Download,
    Printer,
    HelpCircle,
    Server,
    Smartphone,
    Layers,
    FileDown,
    ShieldAlert as ShieldAlertIcon,
    AlertTriangle,
    Scale,
    Fingerprint,
    Search,
    ChevronRight,
    Target,
    // Fix: Added missing icons Briefcase, Users, Clock to resolve "Cannot find name" errors
    Briefcase,
    Users,
    Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type ManualType = 'user' | 'technical';

export const DocumentationView: React.FC = () => {
    const [activeManual, setActiveManual] = useState<ManualType>('user');
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = 25;

            // --- Header Estilo Institucional ---
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, pageWidth, 45, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('SISREQ', margin, 22);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('DOCUMENTACIÓN OFICIAL DEL SISTEMA', margin, 29);
            
            const manualTitle = activeManual === 'user' ? 'MANUAL DE USUARIO Y PROCESOS' : 'MEMORIA TÉCNICA E INFRAESTRUCTURA';
            doc.setFontSize(11);
            doc.text(manualTitle, pageWidth - margin, 25, { align: 'right' });

            yPos = 60;
            doc.setTextColor(30, 41, 59);

            if (activeManual === 'user') {
                // SECCIÓN: PERFILES
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('01. Perfiles y Atribuciones', margin, yPos);
                yPos += 8;

                autoTable(doc, {
                    startY: yPos,
                    head: [['PERFIL', 'ALCANCE Y COMPETENCIAS']],
                    body: [
                        ['SUPERADMIN', 'Auditoría forense, gestión de identidades y recuperación de registros archivados.'],
                        ['ADMIN CENTRAL', 'Recepción de solicitudes, triage inicial y derivación a unidades orgánicas.'],
                        ['JEFATURA (HEAD)', 'Gestión departamental, asignación de analistas y validación de resoluciones.'],
                        ['ANALISTA', 'Ejecución técnica de requerimientos, registro de logs y cierre operativo.']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59] },
                    styles: { fontSize: 8 }
                });
                
                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;

                // SECCIÓN: PROCESO
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('02. Flujo del Requerimiento', margin, yPos);
                yPos += 8;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const flujo = "El sistema sigue un circuito cerrado: 1. RECEPCIÓN (Admin) -> 2. DERIVACIÓN (Head) -> 3. EJECUCIÓN (Analista) -> 4. FINALIZACIÓN. No se permiten saltos de fase para asegurar la cadena de mando.";
                const splitFlujo = doc.splitTextToSize(flujo, contentWidth);
                doc.text(splitFlujo, margin, yPos);
                yPos += 20;

                // SECCIÓN: RESTRICCIONES
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('03. Restricciones de Seguridad', margin, yPos);
                yPos += 8;
                autoTable(doc, {
                    startY: yPos,
                    body: [
                        ['Jurisdicción', 'Un usuario solo puede ver tickets asignados a su área específica.'],
                        ['Inmutabilidad', 'Los registros finalizados no permiten ediciones de fondo, solo lectura.'],
                        ['Auditoría', 'Toda acción deja una huella digital (Log) con marca de tiempo y autoría.'],
                        ['Archivado', 'Solo el SuperAdmin puede mover registros a la bóveda de auditoría.']
                    ],
                    theme: 'striped',
                    styles: { fontSize: 8 }
                });

            } else {
                // MANUAL TÉCNICO PDF
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Arquitectura y Seguridad', margin, yPos);
                yPos += 10;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text('• Backend: Supabase (PostgreSQL 15+) con RLS dinámico.', margin + 5, yPos); yPos += 6;
                doc.text('• Frontend: SPA con React 19 y Context API para gestión de estado.', margin + 5, yPos); yPos += 6;
                doc.text('• Trazabilidad: Objetos JSONB para logs inmutables.', margin + 5, yPos);
                
                yPos += 10;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Matriz de Transiciones SQL', margin, yPos);
                yPos += 8;
                autoTable(doc, {
                    startY: yPos,
                    head: [['DE', 'A', 'REQUISITO']],
                    body: [
                        ['RECIBIDO', 'DERIVACIÓN', 'Admin Role'],
                        ['DERIVACIÓN', 'EJECUCIÓN', 'Assign Analyst'],
                        ['EJECUCIÓN', 'FINALIZADO', 'Firma Analista']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229] }
                });
            }

            // Footer Paginación
            const pages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`SISREQ v2.5 | ${new Date().toLocaleDateString()} | Página ${i} de ${pages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            doc.save(`SISREQ_Manual_${activeManual.toUpperCase()}.pdf`);
        } catch (error) {
            console.error('Error exportando PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
            {/* Header Manuales */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl shadow-indigo-100">
                        <Book size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Documentación SISREQ</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <HelpCircle size={12} className="text-indigo-400"/> Guía oficial de procedimientos y arquitectura
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setActiveManual('user')}
                            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeManual === 'user' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <User size={14}/> Manual de Usuario
                        </button>
                        <button 
                            onClick={() => setActiveManual('technical')}
                            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeManual === 'technical' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Code size={14}/> Manual Técnico
                        </button>
                    </div>
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className={`p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm group ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Exportar a PDF"
                    >
                        {isExporting ? <Zap size={18} className="animate-spin text-indigo-600" /> : <FileDown size={18} className="group-hover:scale-110 transition-transform"/>}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                {activeManual === 'user' ? (
                    <div className="space-y-16">
                        {/* Introducción */}
                        <section className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <span className="text-4xl font-black text-slate-100 font-mono">01.</span>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Ecosistema de Usuarios</h3>
                            </div>
                            <p className="text-slate-500 leading-relaxed text-lg">
                                El sistema SISREQ opera bajo un esquema jerárquico estricto. Cada perfil tiene una responsabilidad definida para garantizar que los requerimientos se resuelvan con máxima eficiencia y trazabilidad.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                                    <Shield className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="bg-indigo-500 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                                            <Fingerprint size={20} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tighter text-xl mb-2">Auditoría Master (SuperAdmin)</h4>
                                        <p className="text-slate-400 text-xs leading-relaxed font-medium">Control supremo del sistema. Supervisa la salud técnica, gestiona identidades y tiene acceso exclusivo a la bóveda de registros archivados para reconstrucción de incidentes.</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden group">
                                    <LayoutDashboard className="absolute -right-4 -bottom-4 text-slate-50 w-32 h-32 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="bg-red-50 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-red-100">
                                            <Target size={20} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tighter text-xl mb-2 text-slate-900">Admin Central</h4>
                                        <p className="text-slate-500 text-xs leading-relaxed font-medium">Mesa de entrada institucional. Valida la información del ticket, asigna la prioridad inicial y deriva el requerimiento a la unidad orgánica competente.</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden group">
                                    <Briefcase className="absolute -right-4 -bottom-4 text-slate-50 w-32 h-32 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-indigo-100">
                                            <Users size={20} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tighter text-xl mb-2 text-slate-900">Jefatura de Área (Head)</h4>
                                        <p className="text-slate-500 text-xs leading-relaxed font-medium">Líder operativo de unidad. Gestiona la carga de trabajo de su departamento y designa al Analista (especialista) responsable de la ejecución técnica.</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden group">
                                    <Code className="absolute -right-4 -bottom-4 text-slate-50 w-32 h-32 group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="bg-amber-50 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-amber-100">
                                            <Zap size={20} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tighter text-xl mb-2 text-slate-900">Analista</h4>
                                        <p className="text-slate-500 text-xs leading-relaxed font-medium">Cuerpo técnico ejecutor. Resuelve el requerimiento, documenta hallazgos en el log inmutable y certifica la finalización del servicio.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Proceso del Sistema */}
                        <section className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-12">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <span className="text-4xl font-black text-slate-100 font-mono">02.</span>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Circuito Operativo</h3>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">1</div>
                                        <div className="w-1 flex-1 bg-indigo-100 my-2"></div>
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Triage y Registro</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed italic">El ticket nace en la Administración Central. Se evalúa su pertinencia técnica y se le asigna un folio único.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black shadow-lg">2</div>
                                        <div className="w-1 flex-1 bg-orange-100 my-2"></div>
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Asignación Departamental</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed italic">La Jefatura de Área recibe la derivación. Analiza la complejidad y "firma" la asignación a un analista idóneo.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black shadow-lg">3</div>
                                        <div className="w-1 flex-1 bg-amber-100 my-2"></div>
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Ejecución Técnica</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed italic">El analista trabaja activamente. Cada avance debe registrarse como "Nota Técnica" para futura auditoría.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg">4</div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Cierre y Auditoría</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed italic">El ticket se marca como FINALIZADO. Solo el SuperAdmin podrá mover este registro al archivo definitivo después de 5 días.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Restricciones */}
                        <section className="bg-slate-900 p-12 rounded-[3rem] text-white space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <AlertTriangle size={120} strokeWidth={1} />
                            </div>
                            
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-4">
                                    <Scale className="text-amber-400" size={32} /> Reglas y Restricciones
                                </h3>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest border-l-2 border-amber-400 pl-4">Protocolo de Seguridad Institucional</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><Lock size={16}/></div>
                                        <div>
                                            <h5 className="font-black uppercase text-xs mb-1">Principio de Inmutabilidad</h5>
                                            <p className="text-slate-400 text-[11px] leading-relaxed">Ningún usuario (incluyendo Admins) puede alterar el cuerpo de un ticket una vez finalizado. Las evidencias son permanentes.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Search size={16}/></div>
                                        <div>
                                            <h5 className="font-black uppercase text-xs mb-1">Jurisdicción Restringida</h5>
                                            <p className="text-slate-400 text-[11px] leading-relaxed">Los analistas y jefaturas están limitados a su Unidad Orgánica. No es posible visualizar ni operar expedientes de otras áreas.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><GitPullRequest size={16}/></div>
                                        <div>
                                            <h5 className="font-black uppercase text-xs mb-1">Secuencialidad Forzada</h5>
                                            <p className="text-slate-400 text-[11px] leading-relaxed">El sistema bloquea transiciones ilegales. Es obligatorio asignar un responsable antes de mover un ticket a la fase de Ejecución.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Clock size={16}/></div>
                                        <div>
                                            <h5 className="font-black uppercase text-xs mb-1">Auditoría Live</h5>
                                            <p className="text-slate-400 text-[11px] leading-relaxed">Toda acción genera un log automático que incluye ID de sesión, marca de tiempo UTC y autoría real del perfil.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-12 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                        {/* Manual Técnico Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <span className="text-4xl font-black text-slate-200 font-mono">03.</span>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Arquitectura Técnica</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                SISREQ utiliza una arquitectura moderna desacoplada con servicios gestionados para garantizar alta disponibilidad y seguridad de nivel gubernamental.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                <LayoutDashboard className="text-indigo-600 mb-4" size={32}/>
                                <h5 className="font-black text-slate-900 uppercase text-xs mb-2 tracking-widest">Frontend Stack</h5>
                                <ul className="text-[11px] text-slate-500 font-bold space-y-2">
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> React 19 (SPA)</li>
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> TypeScript 5.x Strict</li>
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> Tailwind JIT</li>
                                </ul>
                            </div>
                            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl">
                                <Database className="text-emerald-600 mb-4" size={32}/>
                                <h5 className="font-black text-slate-900 uppercase text-xs mb-2 tracking-widest">Persistencia</h5>
                                <ul className="text-[11px] text-slate-500 font-bold space-y-2">
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> Supabase (PaaS)</li>
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> PostgreSQL 15</li>
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> RLS Logic Layers</li>
                                </ul>
                            </div>
                            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-white">
                                <Lock className="text-indigo-400 mb-4" size={32}/>
                                <h5 className="font-black text-slate-100 uppercase text-xs mb-2 tracking-widest">Security Core</h5>
                                <ul className="text-[11px] text-slate-400 font-bold space-y-2">
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> JWT Auth</li>
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> Workflow Matrix</li>
                                    <li className="flex items-center gap-2"><ChevronRight size={10} /> JSONB Immutable Logs</li>
                                </ul>
                            </div>
                        </div>

                        <section className="space-y-6">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Server className="text-indigo-600" size={24}/> Definición del Esquema (DDL)
                            </h4>
                            <div className="relative group">
                                <pre className="bg-slate-900 rounded-2xl p-10 text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-2xl leading-relaxed">
{`-- Estructura de Auditoría y Trazabilidad
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  area text NOT NULL,
  status text NOT NULL CHECK (status IN ('Recibido', 'En Derivación', 'En Ejecución', 'Finalizado')),
  logs jsonb DEFAULT '[]'::jsonb, -- Almacén inmutable de eventos
  "isDeleted" boolean DEFAULT false, -- Soft-delete para QA
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Políticas de Seguridad RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Area Jurisdiction Access" ON public.requests 
FOR SELECT USING (auth.role() = 'SUPERADMIN' OR area = auth.user_area());`}
                                </pre>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

const History = ({ className, size }: { className?: string, size?: number }) => (
    <Clock size={size} className={className} />
);