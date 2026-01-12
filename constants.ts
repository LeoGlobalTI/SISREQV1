
import { Area, Status, User, UserRole, Priority, RequestCard } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u0', name: 'Leandro', email: 'leandro@sisreq.com', status: 'ACTIVE', joinedAt: '2023-01-01T10:00:00Z', role: UserRole.SUPERADMIN, password: '123' },
  { id: 'u1', name: 'Evelin', email: 'evelin@sisreq.com', status: 'ACTIVE', joinedAt: '2023-02-15T11:00:00Z', role: UserRole.ADMIN, area: Area.FINANZAS, password: '123' },
  { id: 'u2', name: 'Vania', email: 'vania@sisreq.com', status: 'ACTIVE', joinedAt: '2023-03-10T09:00:00Z', role: UserRole.HEAD, area: Area.CONTABILIDAD, password: '123' },
  { id: 'u3', name: 'Rodrigo', email: 'rodrigo@sisreq.com', status: 'ACTIVE', joinedAt: '2023-04-05T08:30:00Z', role: UserRole.HEAD, area: Area.RRHH, password: '123' },
  { id: 'u4', name: 'Yerman', email: 'yerman@sisreq.com', status: 'ACTIVE', joinedAt: '2023-05-20T14:00:00Z', role: UserRole.HEAD, area: Area.ACREDITACION, password: '123' },
  { id: 'u5', name: 'Analista Contabilidad', email: 'ana.cont@sisreq.com', status: 'ACTIVE', joinedAt: '2023-06-15T10:00:00Z', role: UserRole.ANALYST, area: Area.CONTABILIDAD, password: '123' },
  { id: 'u6', name: 'Analista RRHH', email: 'ana.rrhh@sisreq.com', status: 'ACTIVE', joinedAt: '2023-07-01T11:00:00Z', role: UserRole.ANALYST, area: Area.RRHH, password: '123' },
  { id: 'u7', name: 'Analista Acreditación', email: 'ana.acred@sisreq.com', status: 'ACTIVE', joinedAt: '2023-08-10T12:00:00Z', role: UserRole.ANALYST, area: Area.ACREDITACION, password: '123' },
  { id: 'u8', name: 'Analista Finanzas', email: 'ana.finanzas@sisreq.com', status: 'ACTIVE', joinedAt: '2023-09-05T09:30:00Z', role: UserRole.ANALYST, area: Area.FINANZAS, password: '123' },
];

export const AREA_HEADS: Record<Area, string> = {
  [Area.CONTABILIDAD]: 'Vania',
  [Area.RRHH]: 'Rodrigo',
  [Area.ACREDITACION]: 'Yerman',
  [Area.FINANZAS]: 'Evelin',
};

const now = new Date();
const pastDate = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const INITIAL_REQUESTS: RequestCard[] = [
  // --- CONTABILIDAD (6) ---
  {
    id: 'req-cont-1',
    title: 'Auditoría de Procesos Q1',
    detail: 'Evaluación técnica de cumplimiento normativo para el primer trimestre del año fiscal.',
    requester: 'Gerencia de Control',
    area: Area.CONTABILIDAD,
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    createdAt: pastDate(2),
    lastUpdated: pastDate(2),
    logs: [{ id: 'l1', timestamp: pastDate(2), message: 'SISTEMA: Apertura de requerimiento SISREQ', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-cont-2',
    title: 'Cierre Mensual de Activos',
    detail: 'Proceso de depreciación y conciliación de activos fijos de la sede central.',
    requester: 'Operaciones',
    area: Area.CONTABILIDAD,
    status: Status.DERIVACION,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    createdAt: pastDate(24),
    lastUpdated: pastDate(20),
    logs: [{ id: 'l2', timestamp: pastDate(24), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-cont-3',
    title: 'Revisión Facturación Electrónica',
    detail: 'Validación de folios y discrepancias detectadas en el portal tributario.',
    requester: 'Ventas',
    area: Area.CONTABILIDAD,
    status: Status.EJECUCION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    assignedAnalyst: 'Analista Contabilidad',
    createdAt: pastDate(48),
    lastUpdated: pastDate(12),
    logs: [{ id: 'l3', timestamp: pastDate(48), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-cont-4',
    title: 'Informe Anual de Impuestos',
    detail: 'Preparación de documentos para la declaración de renta anual consolidada.',
    requester: 'Dirección General',
    area: Area.CONTABILIDAD,
    status: Status.FINALIZADO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    finishedAt: pastDate(1),
    createdAt: pastDate(120),
    lastUpdated: pastDate(1),
    logs: [{ id: 'l4', timestamp: pastDate(120), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-cont-5',
    title: 'Conciliación Bancaria Mayor',
    detail: 'Ajuste de diferencias en cuentas corrientes principales de Banco Estado.',
    requester: 'Tesorería',
    area: Area.CONTABILIDAD,
    status: Status.RECIBIDO,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    createdAt: pastDate(5),
    lastUpdated: pastDate(5),
    logs: [{ id: 'l-c5', timestamp: pastDate(5), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-cont-6',
    title: 'Regularización Gastos Caja Chica',
    detail: 'Rendición de cuentas de la sucursal norte correspondiente a Mayo.',
    requester: 'Sucursal Norte',
    area: Area.CONTABILIDAD,
    status: Status.DERIVACION,
    priority: Priority.LOW,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    createdAt: pastDate(10),
    lastUpdated: pastDate(8),
    logs: [{ id: 'l-c6', timestamp: pastDate(10), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },

  // --- RRHH (6) ---
  {
    id: 'req-rrhh-1',
    title: 'Actualización Manual de Funciones',
    detail: 'Reestructuración de perfiles de cargo para la nueva unidad de TI.',
    requester: 'Dirección de Talento',
    area: Area.RRHH,
    status: Status.DERIVACION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.RRHH],
    createdAt: pastDate(86),
    lastUpdated: pastDate(72),
    logs: [{ id: 'l5', timestamp: pastDate(86), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-rrhh-2',
    title: 'Cálculo de Gratificaciones',
    detail: 'Liquidación de beneficios sociales para el personal de planta.',
    requester: 'Finanzas',
    area: Area.RRHH,
    status: Status.EJECUCION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.RRHH],
    assignedAnalyst: 'Analista RRHH',
    createdAt: pastDate(96),
    lastUpdated: pastDate(24),
    logs: [{ id: 'l6', timestamp: pastDate(96), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-rrhh-3',
    title: 'Onboarding Personal Nuevo',
    detail: 'Gestión de contratos y accesos para 10 nuevos colaboradores de logística.',
    requester: 'Producción',
    area: Area.RRHH,
    status: Status.RECIBIDO,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.RRHH],
    createdAt: pastDate(10),
    lastUpdated: pastDate(10),
    logs: [{ id: 'l7', timestamp: pastDate(10), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-rrhh-4',
    title: 'Plan de Capacitación 2024',
    detail: 'Diseño de la malla curricular para el segundo semestre técnico.',
    requester: 'Gerencia General',
    area: Area.RRHH,
    status: Status.FINALIZADO,
    priority: Priority.LOW,
    responsibleHead: AREA_HEADS[Area.RRHH],
    finishedAt: pastDate(5),
    createdAt: pastDate(200),
    lastUpdated: pastDate(5),
    logs: [{ id: 'l8', timestamp: pastDate(200), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-rrhh-5',
    title: 'Evaluación de Desempeño 360',
    detail: 'Lanzamiento de plataforma de feedback para mandos medios.',
    requester: 'Desarrollo Organizacional',
    area: Area.RRHH,
    status: Status.RECIBIDO,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.RRHH],
    createdAt: pastDate(15),
    lastUpdated: pastDate(15),
    logs: [{ id: 'l-r5', timestamp: pastDate(15), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-rrhh-6',
    title: 'Control de Asistencia y HE',
    detail: 'Auditoría de horas extras reportadas en el periodo de Junio.',
    requester: 'Jefatura de Operaciones',
    area: Area.RRHH,
    status: Status.EJECUCION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.RRHH],
    assignedAnalyst: 'Analista RRHH',
    createdAt: pastDate(30),
    lastUpdated: pastDate(12),
    logs: [{ id: 'l-r6', timestamp: pastDate(30), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },

  // --- ACREDITACION (6) ---
  {
    id: 'req-acre-1',
    title: 'Certificación ISO 9001',
    detail: 'Preparación de documentos para la auditoría de seguimiento ISO internacional.',
    requester: 'Calidad',
    area: Area.ACREDITACION,
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    createdAt: pastDate(5),
    lastUpdated: pastDate(5),
    logs: [{ id: 'l9', timestamp: pastDate(5), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-acre-2',
    title: 'Renovación Patentes Comerciales',
    detail: 'Trámite de permisos municipales para sucursales periféricas y bodegas.',
    requester: 'Legal',
    area: Area.ACREDITACION,
    status: Status.DERIVACION,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    createdAt: pastDate(40),
    lastUpdated: pastDate(30),
    logs: [{ id: 'l10', timestamp: pastDate(40), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-acre-3',
    title: 'Verificación de Competencias',
    detail: 'Validación de títulos y certificaciones del nuevo equipo técnico especializado.',
    requester: 'Operaciones',
    area: Area.ACREDITACION,
    status: Status.EJECUCION,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    assignedAnalyst: 'Analista Acreditación',
    createdAt: pastDate(70),
    lastUpdated: pastDate(10),
    logs: [{ id: 'l11', timestamp: pastDate(70), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-acre-4',
    title: 'Protocolo de Seguridad Hídrica',
    detail: 'Acreditación de estándares para el manejo de residuos industriales líquidos.',
    requester: 'Mantenimiento',
    area: Area.ACREDITACION,
    status: Status.FINALIZADO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    finishedAt: pastDate(48),
    createdAt: pastDate(300),
    lastUpdated: pastDate(48),
    logs: [{ id: 'l12', timestamp: pastDate(300), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-acre-5',
    title: 'Certificación de Proveedores',
    detail: 'Homologación de estándares de seguridad para proveedores de transporte.',
    requester: 'Logística',
    area: Area.ACREDITACION,
    status: Status.RECIBIDO,
    priority: Priority.LOW,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    createdAt: pastDate(12),
    lastUpdated: pastDate(12),
    logs: [{ id: 'l-a5', timestamp: pastDate(12), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'req-acre-6',
    title: 'Auditoría Interna de Calidad',
    detail: 'Revisión preventiva de procesos en la planta de manufactura.',
    requester: 'Gerencia de Planta',
    area: Area.ACREDITACION,
    status: Status.DERIVACION,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    createdAt: pastDate(18),
    lastUpdated: pastDate(15),
    logs: [{ id: 'l-a6', timestamp: pastDate(18), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },

  // --- FINANZAS (6) ---
  {
    id: 'req-fin-1',
    title: 'Presupuesto Operativo 2025',
    detail: 'Consolidación de requerimientos presupuestarios para el próximo año fiscal.',
    requester: 'Gerencia General',
    area: Area.FINANZAS,
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    createdAt: pastDate(12),
    lastUpdated: pastDate(12),
    logs: [{ id: 'l13', timestamp: pastDate(12), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-fin-2',
    title: 'Análisis de Flujo de Caja Q2',
    detail: 'Reporte de liquidez y proyecciones de egresos para el segundo trimestre.',
    requester: 'Tesorería',
    area: Area.FINANZAS,
    status: Status.DERIVACION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    createdAt: pastDate(50),
    lastUpdated: pastDate(40),
    logs: [{ id: 'l14', timestamp: pastDate(50), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-fin-3',
    title: 'Gestión de Pagos Críticos',
    detail: 'Priorización de desembolsos para proveedores estratégicos de IT y Suministros.',
    requester: 'Sistemas',
    area: Area.FINANZAS,
    status: Status.EJECUCION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    assignedAnalyst: 'Analista Finanzas',
    createdAt: pastDate(60),
    lastUpdated: pastDate(5),
    logs: [{ id: 'l15', timestamp: pastDate(60), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-fin-4',
    title: 'Auditoría Bancaria Externa',
    detail: 'Soporte documental para la auditoría de riesgos financieros del Holding.',
    requester: 'Directorio',
    area: Area.FINANZAS,
    status: Status.FINALIZADO,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    finishedAt: pastDate(100),
    createdAt: pastDate(400),
    lastUpdated: pastDate(100),
    logs: [{ id: 'l16', timestamp: pastDate(400), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-fin-5',
    title: 'Análisis de Inversiones CAPEX',
    detail: 'Evaluación de factibilidad financiera para la compra de nuevas maquinarias.',
    requester: 'Ingeniería',
    area: Area.FINANZAS,
    status: Status.RECIBIDO,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    createdAt: pastDate(25),
    lastUpdated: pastDate(25),
    logs: [{ id: 'l-f5', timestamp: pastDate(25), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'req-fin-6',
    title: 'Renegociación Líneas de Crédito',
    detail: 'Búsqueda de mejores tasas de interés para el financiamiento de corto plazo.',
    requester: 'Gerencia Financiera',
    area: Area.FINANZAS,
    status: Status.EJECUCION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    assignedAnalyst: 'Analista Finanzas',
    createdAt: pastDate(35),
    lastUpdated: pastDate(15),
    logs: [{ id: 'l-f6', timestamp: pastDate(35), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  }
];

export const PRIORITY_STYLES: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/10',
  [Priority.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10',
  [Priority.LOW]: 'bg-slate-50 text-slate-600 border-slate-200 ring-1 ring-slate-500/10'
};

export const STATUS_BADGE_COLORS: Record<Status, string> = {
  [Status.RECIBIDO]: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20',
  [Status.DERIVACION]: 'bg-orange-50 text-orange-700 ring-1 ring-orange-500/20',
  [Status.EJECUCION]: 'bg-amber-50 text-amber-800 ring-1 ring-amber-500/20',
  [Status.FINALIZADO]: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
};
