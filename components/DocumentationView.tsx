import React, { useState, useMemo } from 'react';
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
    HelpCircle,
    Server,
    Layers,
    FileDown,
    AlertTriangle,
    Scale,
    Fingerprint,
    Search,
    ChevronRight,
    Target,
    Briefcase,
    Users,
    Clock,
    X,
    Building2,
    CheckSquare,
    Workflow,
    FileCheck,
    Cpu,
    ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type ManualType = 'user' | 'organization' | 'technical';

export const DocumentationView: React.FC = () => {
    const [activeManual, setActiveManual] = useState<ManualType>('user');
    const [searchTerm, setSearchTerm] = useState('');
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

            // --- Header Estilo Institucional Master ---
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, pageWidth, 45, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('SISREQ v3.5.0-MASTER', margin, 20);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('DOCUMENTACIÓN INSTITUCIONAL • POWERED BY GLOBAL TI 2026', margin, 27);
            
            const titles: Record<ManualType, string> = {
                user: 'MANUAL DE USUARIO Y PROCESOS',
                organization: 'GUÍA UNIFICADA DE UNIDADES Y USUARIOS',
                technical: 'MEMORIA TÉCNICA E INFRAESTRUCTURA'
            };
            doc.setFontSize(10);
            doc.text(titles[activeManual], pageWidth - margin, 23, { align: 'right' });

            yPos = 60;
            doc.setTextColor(30, 41, 59);

            if (activeManual === 'user') {
                // SECCIÓN: PERFILES
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('01. Perfiles de Usuario y Atribuciones Operativas', margin, yPos);
                yPos += 8;

                autoTable(doc, {
                    startY: yPos,
                    head: [['PERFIL', 'ALCANCE Y COMPETENCIAS']],
                    body: [
                        ['SUPERADMIN', 'Auditoría forense global, configuración de parámetros del sistema, purgado controlado y recuperación en bóveda inmutable.'],
                        ['ADMIN CENTRAL', 'Mesa de entrada institucional, triage y clasificación, derivación formal a unidades orgánicas competentes.'],
                        ['JEFATURA (HEAD)', 'Gobierno departamental, balanceo de carga de analistas, asignación técnica y validación de resoluciones.'],
                        ['ANALISTA', 'Ejecución técnica de tareas, redacción de notas de progreso con marcas de tiempo y firma digital de finalización.']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [15, 23, 42] },
                    styles: { fontSize: 8 }
                });
                
                // @ts-ignore
                yPos = doc.lastAutoTable.finalY + 14;

                // SECCIÓN: SLA ANSI
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('02. Estándar de SLAs ANSI (Resolución en 5 Días)', margin, yPos);
                yPos += 7;
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                const slaText = "Todo expediente cuenta con un umbral operativo máximo de 5 días hábiles. Al superar los 4 días hábiles, el sistema emite una alerta temprana en el tablero ejecutivo para evitar cuellos de botella.";
                doc.text(doc.splitTextToSize(slaText, contentWidth), margin, yPos);
                yPos += 18;

                // SECCIÓN: FLUJO
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('03. Circuito de Requerimientos (Fases Consecutivas)', margin, yPos);
                yPos += 7;
                autoTable(doc, {
                    startY: yPos,
                    head: [['FASE', 'RESPONSABLE', 'REQUISITO DE SALIDA']],
                    body: [
                        ['1. RECIBIDO', 'Admin Central', 'Validación formal y derivación a unidad correspondiente.'],
                        ['2. DERIVACIÓN', 'Jefe de Área', 'Designación expresa de un Analista técnico matriculado.'],
                        ['3. EJECUCIÓN', 'Analista Asignado', 'Acciones operativas, notas y firma de resolución final.'],
                        ['4. FINALIZADO', 'Sistema / Auditor', 'Cierre inmutable con marca temporal finishedAt.']
                    ],
                    theme: 'striped',
                    styles: { fontSize: 8 }
                });

            } else if (activeManual === 'organization') {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('01. Gestión Unificada de Estructura Organizacional', margin, yPos);
                yPos += 8;

                const orgText = "En el Modo Master, la gestión de Unidades Orgánicas (Áreas) y de Usuarios (Colaboradores) se encuentra integrada en un mismo espacio de trabajo para optimizar la toma de decisiones y evitar inconsistencias.";
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.text(doc.splitTextToSize(orgText, contentWidth), margin, yPos);
                yPos += 18;

                autoTable(doc, {
                    startY: yPos,
                    head: [['MECANISMO', 'DESCRIPCIÓN OPERATIVA']],
                    body: [
                        ['Headcount en Vivo', 'Conteo en tiempo real del personal asignado a cada unidad funcional.'],
                        ['Cálculo de Carga', 'Monitoreo de expedientes activos vs. capacidad instalada de analistas.'],
                        ['Protección de Integridad', 'Bloqueo preventivo de eliminación si el área o usuario tiene tickets en curso.'],
                        ['Sincronización de Identidad', 'La actualización de nombre o área de un usuario propaga su reflejo en logs y expedientes.']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229] },
                    styles: { fontSize: 8 }
                });

            } else {
                // MANUAL TÉCNICO PDF
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('01. Arquitectura Técnica y Seguridad de Datos', margin, yPos);
                yPos += 8;
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.text('• Frontend: SPA React 19 + TypeScript 5.x Strict + Tailwind CSS.', margin + 5, yPos); yPos += 6;
                doc.text('• Persistencia: PostgreSQL 15 con motor Supabase y RLS granular.', margin + 5, yPos); yPos += 6;
                doc.text('• Trazabilidad: Array JSONB inmutable para bitácora forense de auditoría.', margin + 5, yPos); yPos += 6;
                doc.text('• Resiliencia: Soft-delete con campo isDeleted para recuperación en Bóveda.', margin + 5, yPos);
                
                yPos += 14;
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('02. Reglas del Motor de Validación QA', margin, yPos);
                yPos += 7;
                autoTable(doc, {
                    startY: yPos,
                    head: [['CÓDIGO', 'SEVERIDAD', 'DESCRIPCIÓN']],
                    body: [
                        ['ERR_PROC_01', 'CRÍTICO', 'Ticket en fase de ejecución sin analista técnico asignado.'],
                        ['WARN_JUR_02', 'AVISO', 'Analista asignado no coincide con el área declarada del ticket.'],
                        ['ERR_TIME_03', 'CRÍTICO', 'Expediente finalizado sin registro de fecha de finalización (finishedAt).'],
                        ['WARN_SLA_04', 'AVISO', 'Ticket activo con más de 5 días hábiles sin resolución.'],
                        ['WARN_USER_05', 'AVISO', 'Solicitante huérfano no registrado en el directorio institucional.']
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [15, 23, 42] },
                    styles: { fontSize: 8 }
                });
            }

            // Footer de Paginación
            const pages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`SISREQ v3.5.0-MASTER | Powered by Global TI 2026 | Página ${i} de ${pages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            doc.save(`SISREQ_v3.5.0_Manual_${activeManual.toUpperCase()}.pdf`);
        } catch (error) {
            console.error('Error exportando PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#F8FAFC]">
            {/* Header Institucional Master */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-7 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3.5 rounded-2xl text-white shadow-md">
                        <Book size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                DOCUMENTACIÓN MASTER
                            </span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                • Powered by Global TI 2026
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mt-1">
                            Manuales & Memorias Técnicas del Sistema
                        </h2>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Switcher de Manuales */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button 
                            onClick={() => setActiveManual('user')}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeManual === 'user' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <User size={13}/> Manual de Usuario
                        </button>
                        <button 
                            onClick={() => setActiveManual('organization')}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeManual === 'organization' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Building2 size={13}/> Unidades & Usuarios
                        </button>
                        <button 
                            onClick={() => setActiveManual('technical')}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeManual === 'technical' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Code size={13}/> Memoria Técnica
                        </button>
                    </div>

                    {/* Botón de Exportar a PDF */}
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-xs disabled:opacity-50`}
                        title="Exportar PDF Institucional"
                    >
                        {isExporting ? <Zap size={14} className="animate-spin text-indigo-400" /> : <FileDown size={14} />}
                        <span>{isExporting ? 'Generando...' : 'Exportar PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-400 pb-16">
                
                {/* MANUAL 1: MANUAL DE USUARIO Y PROCESOS */}
                {activeManual === 'user' && (
                    <div className="space-y-8">
                        {/* Sección 1: Perfiles */}
                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                <span className="text-3xl font-black text-slate-300 font-mono">01.</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Ecosistema de Roles y Atribuciones</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ESTRUCTURA JERÁRQUICA Y CADENA DE MANDO OPERATIVA</p>
                                </div>
                            </div>
                            
                            <p className="text-slate-600 leading-relaxed text-xs">
                                SISREQ implementa un modelo de control de acceso basado en roles (RBAC) con delimitación estricta de competencias para asegurar la confidencialidad, la celeridad y la inmutabilidad de cada expediente.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                <div className="p-5 bg-slate-900 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3">
                                            <Fingerprint size={16} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tight text-sm text-white mb-1.5">SuperAdmin</h4>
                                        <p className="text-slate-400 text-[10px] leading-relaxed font-medium">
                                            Auditoría global, control de parámetros core, purgado y bóveda inmutable.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-800 text-[8px] font-mono text-indigo-400 font-bold uppercase">
                                        Acceso Total
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mb-3">
                                            <Target size={16} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tight text-sm text-slate-900 mb-1.5">Admin Central</h4>
                                        <p className="text-slate-500 text-[10px] leading-relaxed font-medium">
                                            Mesa de entrada general, categorización, prioridad y derivación formal a unidades.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200 text-[8px] font-mono text-red-600 font-bold uppercase">
                                        Triage Institucional
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mb-3">
                                            <Briefcase size={16} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tight text-sm text-slate-900 mb-1.5">Jefatura (Head)</h4>
                                        <p className="text-slate-500 text-[10px] leading-relaxed font-medium">
                                            Gobierno de su área, distribución equitativa de carga y designación de analistas técnicos.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200 text-[8px] font-mono text-indigo-600 font-bold uppercase">
                                        Gestión Departamental
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <h4 className="font-black uppercase tracking-tight text-sm text-slate-900 mb-1.5">Analista</h4>
                                        <p className="text-slate-500 text-[10px] leading-relaxed font-medium">
                                            Ejecución directa del requerimiento, registro de notas técnicas y firma de resolución.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200 text-[8px] font-mono text-emerald-600 font-bold uppercase">
                                        Ejecución Técnica
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sección 2: Circuito de Requerimientos y SLAs */}
                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                <span className="text-3xl font-black text-slate-300 font-mono">02.</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Circuito de Requerimientos & Matriz SLA</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SECUENCIA OPERATIVA LINEAL CON UMBRAL MÁXIMO DE 5 DÍAS</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { step: '1', name: 'RECIBIDO', desc: 'Ingreso inicial por mesa de partes o usuario. Priorización y revisión.', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                                    { step: '2', name: 'DERIVACIÓN', desc: 'Asignado a la unidad orgánica correspondiente por el Administrador.', color: 'bg-orange-50 border-orange-100 text-orange-700' },
                                    { step: '3', name: 'EJECUCIÓN', desc: 'El Jefe asigna un analista matriculado. Trabajo activo y bitácora.', color: 'bg-amber-50 border-amber-100 text-amber-700' },
                                    { step: '4', name: 'FINALIZADO', desc: 'Cierre formal con firma digital de resolución y cálculo de SLA final.', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                                ].map(s => (
                                    <div key={s.step} className={`p-4 rounded-2xl border ${s.color} space-y-2`}>
                                        <div className="flex items-center justify-between">
                                            <span className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center font-mono font-black text-[10px]">
                                                {s.step}
                                            </span>
                                            <span className="text-[9px] font-black tracking-wider uppercase">{s.name}</span>
                                        </div>
                                        <p className="text-[10px] font-medium leading-relaxed opacity-90">{s.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-slate-900">Estándar SLA ANSI: Máximo 5 Días Hábiles</h4>
                                        <p className="text-[9px] text-slate-500 font-medium">
                                            El sistema computa automáticamente el tiempo de respuesta. A los 4 días se genera una alerta temprana preventiva en el Dashboard Ejecutivo.
                                        </p>
                                    </div>
                                </div>
                                <span className="bg-white border border-slate-200 text-slate-700 font-mono text-[9px] font-black px-3 py-1.5 rounded-xl uppercase shrink-0">
                                    ANSI / ISO 9001
                                </span>
                            </div>
                        </section>

                        {/* Sección 3: Principios de Seguridad e Inmutabilidad */}
                        <section className="bg-slate-900 text-white p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
                                <span className="text-3xl font-black text-indigo-400 font-mono">03.</span>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase">Principios de Seguridad & Trazabilidad</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">RESTRICCIONES Y POLÍTICAS SISTÉMICAS ACTIVAS</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase">
                                        <Lock size={14} /> Principio de Inmutabilidad de Cierres
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        Ningún usuario, independientemente de su nivel de privilegios, puede alterar el contenido ni las resoluciones de un expediente una vez finalizado. Las evidencias quedan aseguradas.
                                    </p>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase">
                                        <Shield size={14} /> Jurisdicción Restringida por Área
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        Los analistas y jefaturas están circunscritos exclusivamente a los tickets de su departamento orgánico, imposibilitando el acceso o manipulación de registros de otras áreas.
                                    </p>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase">
                                        <GitPullRequest size={14} /> Secuencialidad Forzada
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        El sistema no permite saltar estados de proceso: no es posible pasar a Ejecución sin antes haber asignado a un analista técnico responsable.
                                    </p>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase">
                                        <History size={14} /> Bitácora Forense JSONB
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        Cada interacción, cambio de estado, comentario o asignación escribe una entrada indeleble en el historial del expediente con identificador de usuario y marca UTC.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* MANUAL 2: GUÍA UNIFICADA DE UNIDADES Y USUARIOS */}
                {activeManual === 'organization' && (
                    <div className="space-y-8">
                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                <span className="text-3xl font-black text-slate-300 font-mono">01.</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Módulo Unificado de Gestión Organizacional</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ADMINISTRACIÓN CENTRALIZADA DE UNIDADES ORGÁNICAS Y COLABORADORES</p>
                                </div>
                            </div>

                            <p className="text-slate-600 leading-relaxed text-xs">
                                En el Modo Master, la administración de Unidades Funcionales (Áreas) y el Directorio de Usuarios operan en una misma vista integrada. Esto permite verificar de forma inmediata la disponibilidad de jefaturas, la dotación de analistas técnicos y la carga operativa por departamento.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                                        <Building2 size={16} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase text-slate-900">Unidades Orgánicas</h4>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        Creación y edición de áreas con designación de Jefatura responsable y presupuesto asignado.
                                    </p>
                                </div>

                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                                        <Users size={16} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase text-slate-900">Headcount en Tiempo Real</h4>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        Cómputo instantáneo de colaboradores activos por unidad para balancear la capacidad operativa.
                                    </p>
                                </div>

                                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                    <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase text-slate-900">Protección Anti-Pérdida</h4>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        El sistema rechaza la eliminación de usuarios o áreas que posean expedientes en trámite.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                <span className="text-3xl font-black text-slate-300 font-mono">02.</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Protocolo de Asignación y Reemplazos</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">PROCEDIMIENTO OPERATIVO ESTÁNDAR PARA CAMBIOS DE PERSONAL</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</div>
                                    <div>
                                        <h5 className="text-xs font-black text-slate-900 uppercase">Reasignación de Expedientes Previos</h5>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                            Antes de dar de baja a un colaborador o trasladarlo de unidad orgánica, el Administrador debe reasignar sus tickets en curso a otro analista activo.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</div>
                                    <div>
                                        <h5 className="text-xs font-black text-slate-900 uppercase">Sincronización Automática de Identidad</h5>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                            Cualquier corrección en el nombre de un colaborador o jefa de área actualiza asíncronamente las referencias visuales en los expedientes para mantener la consistencia histórica.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</div>
                                    <div>
                                        <h5 className="text-xs font-black text-slate-900 uppercase">Cálculo de Demanda y Saturación</h5>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                            El panel de métricas clasifica a los colaboradores en: Disponible (&le; 2 tickets), Carga Óptima (3 a 5 tickets) y Alta Demanda (&gt; 5 tickets activos).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* MANUAL 3: MEMORIA TÉCNICA E INFRAESTRUCTURA */}
                {activeManual === 'technical' && (
                    <div className="space-y-8">
                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                <span className="text-3xl font-black text-slate-300 font-mono">01.</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Arquitectura del Stack Tecnológico</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SISTEMA MODERNO DESACOPLADO CON PERSISTENCIA POSTGRESQL</p>
                                </div>
                            </div>

                            <p className="text-slate-600 leading-relaxed text-xs">
                                SISREQ v3.5.0-MASTER implementa una arquitectura React SPA desacoplada con TypeScript estricto, persistencia en Supabase (PostgreSQL 15+) con Row-Level Security (RLS) y Context API centralizado.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <LayoutDashboard className="text-indigo-600 mb-3" size={24}/>
                                    <h5 className="font-black text-slate-900 uppercase text-xs mb-2 tracking-wider">Frontend SPA</h5>
                                    <ul className="text-[10px] text-slate-600 font-bold space-y-1.5">
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> React 19 + Vite</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> TypeScript 5.x Strict</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Tailwind CSS JIT</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Lucide React Icons</li>
                                    </ul>
                                </div>

                                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                    <Database className="text-emerald-600 mb-3" size={24}/>
                                    <h5 className="font-black text-slate-900 uppercase text-xs mb-2 tracking-wider">Capa de Datos</h5>
                                    <ul className="text-[10px] text-slate-600 font-bold space-y-1.5">
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Supabase Client</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> PostgreSQL 15 Engine</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> JSONB Immutable Logs</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Soft-Delete Pattern</li>
                                    </ul>
                                </div>

                                <div className="p-6 bg-slate-900 text-white rounded-2xl">
                                    <Lock className="text-indigo-400 mb-3" size={24}/>
                                    <h5 className="font-black text-white uppercase text-xs mb-2 tracking-wider">Seguridad & Auth</h5>
                                    <ul className="text-[10px] text-slate-400 font-bold space-y-1.5">
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Matriz RLS Dinámica</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> RBAC Multi-Nivel</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Purgado con Confirmación</li>
                                        <li className="flex items-center gap-2"><ChevronRight size={10} /> Bóveda Inmutable</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                <span className="text-3xl font-black text-slate-300 font-mono">02.</span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Definición de Esquema SQL (DDL)</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ESTRUCTURA DE TABLAS PRINCIPALES Y POLÍTICAS RLS</p>
                                </div>
                            </div>

                            <div className="relative group">
                                <pre className="bg-slate-900 rounded-2xl p-6 text-[10px] font-mono text-emerald-400 overflow-x-auto shadow-sm leading-relaxed border border-slate-800">
{`-- 1. Tabla de Requerimientos Institucionales
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  area text NOT NULL,
  status text NOT NULL CHECK (status IN ('Recibido', 'En Derivación', 'En Ejecución', 'Finalizado')),
  priority text NOT NULL DEFAULT 'Normal',
  requester text NOT NULL,
  assignedAnalyst text,
  logs jsonb DEFAULT '[]'::jsonb, -- Trazabilidad forense inmutable
  isDeleted boolean DEFAULT false, -- Soft-delete para QA Vault
  deletedAt timestamp with time zone,
  deletedBy text,
  finishedAt timestamp with time zone,
  createdAt timestamp with time zone DEFAULT now()
);

-- 2. Políticas de Seguridad RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jurisdicción por Unidad" ON public.requests
FOR ALL USING (
  auth.role() = 'SUPERADMIN' 
  OR area = (SELECT area FROM public.users WHERE id = auth.uid())
);`}
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
