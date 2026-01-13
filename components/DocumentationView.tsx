
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
    ShieldAlert as ShieldAlertIcon
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

            // --- Header Global ---
            doc.setFillColor(30, 41, 59); // Slate 900
            doc.rect(0, 0, pageWidth, 45, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text('SISREQ', margin, 22);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('SISTEMA DE GESTIÓN Y AUDITORÍA DE REQUERIMIENTOS', margin, 29);
            
            const manualTitle = activeManual === 'user' ? 'MANUAL DE USUARIO OPERATIVO' : 'ESPECIFICACIÓN TÉCNICA Y ARQUITECTURA';
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(manualTitle, pageWidth - margin, 25, { align: 'right' });
            
            doc.setDrawColor(79, 70, 229); // Indigo 600
            doc.setLineWidth(1.5);
            doc.line(pageWidth - margin - 60, 28, pageWidth - margin, 28);

            yPos = 60;
            doc.setTextColor(30, 41, 59);

            if (activeManual === 'user') {
                // SECCIÓN 01: INTRODUCCIÓN
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('01. Introducción y Propósito', margin, yPos);
                yPos += 10;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const intro = "SISREQ centraliza la gestión interdepartamental asegurando la trazabilidad absoluta. Este manual describe los procedimientos estándar para la creación, seguimiento y cierre de expedientes técnicos dentro de la institución.";
                const splitIntro = doc.splitTextToSize(intro, contentWidth);
                doc.text(splitIntro, margin, yPos);
                yPos += (splitIntro.length * 6) + 12;

                // SECCIÓN 02: ROLES
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Matriz de Responsabilidades', margin, yPos);
                yPos += 8;

                autoTable(doc, {
                    startY: yPos,
                    head: [['ROL', 'ALCANCE OPERATIVO']],
                    body: [
                        ['ADMIN CENTRAL', 'Recepción de solicitudes externas y derivación inicial.'],
                        ['JEFATURA DE ÁREA', 'Gestión de carga de trabajo y asignación de analistas.'],
                        ['ANALYST', 'Resolución técnica del requerimiento y logs de avance.'],
                        ['AUDITORÍA MASTER', 'Control inmutable, gestión de usuarios y archivado.']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9 },
                    styles: { fontSize: 8, cellPadding: 5 },
                    margin: { left: margin, right: margin }
                });
                
                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;

                // SECCIÓN 03: CICLO DE VIDA
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Ciclo de Vida del Expediente', margin, yPos);
                yPos += 10;

                const workflowSteps = [
                    { t: 'RECIBIDO', d: 'Validación inicial en bandeja de entrada central.' },
                    { t: 'DERIVACIÓN', d: 'Asignación a la unidad orgánica responsable.' },
                    { t: 'EJECUCIÓN', d: 'Trabajo técnico activo con registro de comentarios.' },
                    { t: 'FINALIZADO', d: 'Resolución completa y cierre de trazabilidad.' }
                ];

                workflowSteps.forEach((step, idx) => {
                    doc.setFillColor(241, 245, 249);
                    doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(79, 70, 229);
                    doc.text(`${idx + 1}. ${step.t}`, margin + 5, yPos + 9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    doc.text(step.d, margin + 45, yPos + 9);
                    yPos += 16;
                });

                yPos += 5;
                // FUNCIONES CLAVE
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('Funciones de Interfaz', margin, yPos);
                yPos += 8;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text('• Arrastrar y Soltar (Drag & Drop) para transiciones de fase.', margin + 5, yPos); yPos += 6;
                doc.text('• Notificaciones sonoras y visuales en tiempo real.', margin + 5, yPos); yPos += 6;
                doc.text('• Historial de auditoría inmutable por cada ticket.', margin + 5, yPos);

            } else {
                // SECCIÓN 01: STACK
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Arquitectura de Software', margin, yPos);
                yPos += 10;
                
                autoTable(doc, {
                    startY: yPos,
                    head: [['COMPONENTE', 'TECNOLOGÍA']],
                    body: [
                        ['Frontend Core', 'React 19 + TypeScript 5.x'],
                        ['Motor de Estilos', 'Tailwind CSS (Atomic Design)'],
                        ['Backend / BaaS', 'Supabase (PostgreSQL)'],
                        ['Seguridad', 'JWT + Row Level Security (RLS)']
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [30, 41, 59] },
                    styles: { fontSize: 8 }
                });

                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;

                // SECCIÓN 02: ESQUEMA
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Modelo de Datos (Public Schema)', margin, yPos);
                yPos += 8;
                
                const sqlCode = [
                    "CREATE TABLE public.requests (",
                    "  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
                    "  title text NOT NULL, status text NOT NULL,",
                    "  logs jsonb DEFAULT '[]'::jsonb,",
                    "  is_deleted boolean DEFAULT false",
                    ");"
                ];
                
                doc.setFillColor(15, 23, 42); // Slate 950
                doc.rect(margin, yPos, contentWidth, 35, 'F');
                doc.setFont('courier', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(52, 211, 153); // Emerald 400
                sqlCode.forEach((line, i) => {
                    doc.text(line, margin + 8, yPos + 10 + (i * 5));
                });
                
                yPos += 45;
                doc.setTextColor(30, 41, 59);

                // SECCIÓN 03: WORKFLOW
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('Lógica de Estados (Workflow Matrix)', margin, yPos);
                yPos += 8;

                autoTable(doc, {
                    startY: yPos,
                    head: [['ORIGEN', 'DESTINO', 'PERMISOS']],
                    body: [
                        ['RECIBIDO', 'DERIVACIÓN', 'ADMIN, SUPERADMIN'],
                        ['DERIVACIÓN', 'EJECUCIÓN', 'HEAD, ADMIN, SUPERADMIN'],
                        ['EJECUCIÓN', 'FINALIZADO', 'ANALYST, HEAD, SUPERADMIN'],
                        ['ANY', 'ARCHIVADO', 'SOLO SUPERADMIN']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229] },
                    styles: { fontSize: 8 }
                });

                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 15;
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Seguridad e Integridad', margin, yPos);
                yPos += 8;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const security = "El sistema utiliza borrado lógico (Soft Delete) para garantizar que ningún dato sea eliminado físicamente del registro de auditoría. Las transiciones de estado están protegidas por una matriz de validación en el cliente y políticas RLS en la base de datos.";
                const splitSec = doc.splitTextToSize(security, contentWidth);
                doc.text(splitSec, margin, yPos);
            }

            // --- Footer Global ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(241, 245, 249);
                doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
                
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `SISREQ DOCUMENTATION ENGINE v2.5 | Generado: ${new Date().toLocaleString()} | Página ${i} de ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }

            doc.save(`SISREQ_${activeManual.toUpperCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating documentation PDF:', error);
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
                            <HelpCircle size={12} className="text-indigo-400"/> Guía oficial de uso y arquitectura del sistema
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
                        title="Exportar Manual a PDF"
                    >
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} className="group-hover:scale-110 transition-transform"/>}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                {activeManual === 'user' ? (
                    <div className="space-y-12 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                        {/* Manual de Usuario Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <span className="text-4xl font-black text-slate-200 font-mono">01.</span>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Introducción al Sistema</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                SISREQ es una plataforma de flujo de trabajo diseñada para centralizar, gestionar y auditar requerimientos interdepartamentales. El sistema garantiza que cada solicitud pase por las fases correctas de validación, asignación y ejecución técnica.
                            </p>
                        </section>

                        <section className="space-y-8">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Shield className="text-indigo-600" size={24}/> Estructura de Roles
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h5 className="font-black text-indigo-600 uppercase text-xs mb-2 tracking-widest">Administración Central (ADMIN)</h5>
                                    <p className="text-slate-500 text-sm">Responsable de recibir requerimientos externos, validar la información inicial y derivar a las áreas correspondientes.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h5 className="font-black text-emerald-600 uppercase text-xs mb-2 tracking-widest">Jefaturas de Área (HEAD)</h5>
                                    <p className="text-slate-500 text-sm">Gestionan los recursos de su unidad, asignan responsables técnicos (Analistas) y supervisan el cumplimiento de plazos.</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h5 className="font-black text-amber-600 uppercase text-xs mb-2 tracking-widest">Cuerpo Analista (ANALYST)</h5>
                                    <p className="text-slate-500 text-sm">Efectúan la resolución técnica del requerimiento, documentan avances en el log y marcan la finalización del trabajo.</p>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white">
                                    <h5 className="font-black text-indigo-400 uppercase text-xs mb-2 tracking-widest">Auditoría Master (SUPERADMIN)</h5>
                                    <p className="text-slate-400 text-sm">Control total del sistema, gestión de usuarios, visualización de reportes avanzados y archivado inmutable de expedientes.</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <GitPullRequest className="text-indigo-600" size={24}/> Ciclo de Vida del Requerimiento
                            </h4>
                            <div className="flex flex-col gap-6 pl-6 border-l-4 border-indigo-100 ml-4">
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">1</div>
                                    <h5 className="font-black text-slate-900 uppercase text-sm mb-1 tracking-tight">Fase de Recepción (Status: Recibido)</h5>
                                    <p className="text-slate-500 text-sm">El Admin Central registra el ticket. Se define el área de gestión y el nivel de prioridad inicial.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">2</div>
                                    <h5 className="font-black text-slate-900 uppercase text-sm mb-1 tracking-tight">Fase de Derivación (Status: En Derivación)</h5>
                                    <p className="text-slate-500 text-sm">El requerimiento llega a la bandeja de la Jefatura de Área. Aquí se designa al Analista responsable.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">3</div>
                                    <h5 className="font-black text-slate-900 uppercase text-sm mb-1 tracking-tight">Fase de Ejecución (Status: En Ejecución)</h5>
                                    <p className="text-slate-500 text-sm">El analista trabaja activamente. El sistema permite añadir notas técnicas para mantener la trazabilidad.</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">4</div>
                                    <h5 className="font-black text-slate-900 uppercase text-sm mb-1 tracking-tight">Fase Finalizado (Status: Finalizado)</h5>
                                    <p className="text-slate-500 text-sm">El ticket se resuelve. Solo Auditoría Master puede archivar definitivamente este registro.</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-900 p-8 rounded-[2rem] text-white">
                            <h4 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                                <Zap className="text-amber-400" size={20}/> Funciones Clave de Interfaz
                            </h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> <strong>Arrastrar y Soltar:</strong> Permite mover tickets entre fases operativas rápidamente (si el rol tiene permisos).</li>
                                <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> <strong>Notificaciones Live:</strong> Alertas visuales y sonoras instantáneas ante cualquier cambio de estado o asignación.</li>
                                <li className="flex gap-3"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> <strong>Trazabilidad Total:</strong> Historial de logs inmutable que registra quién, cuándo y qué acción realizó sobre cada ticket.</li>
                            </ul>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-12 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                        {/* Manual Técnico Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <span className="text-4xl font-black text-slate-200 font-mono">02.</span>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Arquitectura del Sistema</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                SISREQ está construido sobre una arquitectura moderna de Single Page Application (SPA) desacoplada, utilizando servicios gestionados para la persistencia de datos y seguridad.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl">
                                <LayoutDashboard className="text-indigo-600 mb-4" size={32}/>
                                <h5 className="font-black text-slate-900 uppercase text-xs mb-2">Frontend Stack</h5>
                                <ul className="text-[11px] text-slate-500 font-bold space-y-1">
                                    <li>• React 19 (Hooks/Context)</li>
                                    <li>• TypeScript 5.x</li>
                                    <li>• Tailwind CSS (Utilidades)</li>
                                    <li>• Lucide React (Icons)</li>
                                </ul>
                            </div>
                            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl">
                                <Database className="text-emerald-600 mb-4" size={32}/>
                                <h5 className="font-black text-slate-900 uppercase text-xs mb-2">Backend & Data</h5>
                                <ul className="text-[11px] text-slate-500 font-bold space-y-1">
                                    <li>• Supabase (PostgreSQL)</li>
                                    <li>• REST API (PostgREST)</li>
                                    <li>• Row Level Security (RLS)</li>
                                    <li>• JSONB Auditing</li>
                                </ul>
                            </div>
                            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-white">
                                <Layers className="text-indigo-400 mb-4" size={32}/>
                                <h5 className="font-black text-slate-100 uppercase text-xs mb-2">Seguridad Core</h5>
                                <ul className="text-[11px] text-slate-400 font-bold space-y-1">
                                    <li>• JWT Authentication</li>
                                    <li>• Workflow Matrix Strict</li>
                                    <li>• UUID v4 Integrity</li>
                                    <li>• Base64 Signature Simulation</li>
                                </ul>
                            </div>
                        </div>

                        <section className="space-y-6">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Server className="text-indigo-600" size={24}/> Modelo de Datos (Esquema SQL)
                            </h4>
                            <div className="relative group">
                                <pre className="bg-slate-900 rounded-2xl p-8 text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-2xl leading-relaxed">
{`-- Tabla Principal de Expedientes
CREATE TABLE public.requests (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  detail text,
  requester text,
  area text NOT NULL,
  status text NOT NULL, -- Enum: Recibido, En Derivación, ...
  priority text NOT NULL,
  "responsibleHead" text,
  "assignedAnalyst" text,
  logs jsonb DEFAULT '[]'::jsonb, -- Trazabilidad histórica
  "createdAt" timestamp with time zone DEFAULT now(),
  "isDeleted" boolean DEFAULT false, -- Archivo de auditoría
  "deletedAt" timestamp with time zone,
  "deletedBy" text
);

-- Tabla de Identidades
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL,
  area text,
  password text, -- Hash/Signature sim
  status text
);`}
                                </pre>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <Lock className="text-indigo-600" size={24}/> Lógica de Transiciones (Workflow Matrix)
                            </h4>
                            <p className="text-slate-500 text-sm">
                                El sistema implementa una matriz de transición de estados rígida para evitar saltos en la cadena de mando.
                            </p>
                            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                <table className="w-full text-left text-[10px] font-bold">
                                    <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Desde Estado</th>
                                            <th className="px-6 py-4">Hacia Estado</th>
                                            <th className="px-6 py-4">Roles Permitidos</th>
                                            <th className="px-6 py-4">Condición Adicional</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-slate-700">
                                        <tr>
                                            <td className="px-6 py-4">RECIBIDO</td>
                                            <td className="px-6 py-4 text-indigo-600">DERIVACIÓN</td>
                                            <td className="px-6 py-4">ADMIN, SUPERADMIN</td>
                                            <td className="px-6 py-4 italic">N/A</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4">DERIVACIÓN</td>
                                            <td className="px-6 py-4 text-indigo-600">EJECUCIÓN</td>
                                            <td className="px-6 py-4">HEAD, ADMIN, SUPERADMIN</td>
                                            <td className="px-6 py-4 italic text-red-500">Requiere Asignación de Analista</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4">EJECUCIÓN</td>
                                            <td className="px-6 py-4 text-indigo-600">FINALIZADO</td>
                                            <td className="px-6 py-4">ANALYST, HEAD, SUPERADMIN</td>
                                            <td className="px-6 py-4 italic">Firma del ejecutor</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 flex items-start gap-6">
                            <ShieldAlert className="text-amber-600 shrink-0" size={28}/>
                            <div>
                                <h4 className="font-black text-amber-900 uppercase text-sm mb-1">Integridad de Auditoría</h4>
                                <p className="text-amber-800 text-xs leading-relaxed font-bold">
                                    Cualquier eliminación lógica activa el flag `isDeleted`. Estos registros son invisibles para los procesos operativos pero permanecen accesibles en el Panel de Auditoría QA del SuperAdmin para reconstrucción de incidentes.
                                </p>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <Zap size={size} className={className} />
);

const ShieldAlert = ({ className, size }: { className?: string, size?: number }) => (
    <div className={className}>
        <Shield size={size} strokeWidth={2.5}/>
    </div>
);
