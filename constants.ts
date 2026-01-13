
import { Area, Status, User, UserRole, Priority, RequestCard } from './types';

export const INITIAL_USERS: User[] = [
  { id: '11111111-1111-4111-a111-111111111111', name: 'Leandro', email: 'leandro@sisreq.com', status: 'ACTIVE', joinedAt: '2023-01-01T10:00:00Z', role: UserRole.SUPERADMIN, password: '123' },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Evelin', email: 'evelin@sisreq.com', status: 'ACTIVE', joinedAt: '2023-02-15T11:00:00Z', role: UserRole.ADMIN, area: Area.FINANZAS, password: '123' },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Vania', email: 'vania@sisreq.com', status: 'ACTIVE', joinedAt: '2023-03-10T09:00:00Z', role: UserRole.HEAD, area: Area.CONTABILIDAD, password: '123' },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Rodrigo', email: 'rodrigo@sisreq.com', status: 'ACTIVE', joinedAt: '2023-04-05T08:30:00Z', role: UserRole.HEAD, area: Area.RRHH, password: '123' },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Yerman', email: 'yerman@sisreq.com', status: 'ACTIVE', joinedAt: '2023-05-20T14:00:00Z', role: UserRole.HEAD, area: Area.ACREDITACION, password: '123' },
  { id: '66666666-6666-4666-a666-666666666666', name: 'Analista Contabilidad', email: 'ana.cont@sisreq.com', status: 'ACTIVE', joinedAt: '2023-06-15T10:00:00Z', role: UserRole.ANALYST, area: Area.CONTABILIDAD, password: '123' },
  { id: '77777777-7777-4777-a777-777777777777', name: 'Analista RRHH', email: 'ana.rrhh@sisreq.com', status: 'ACTIVE', joinedAt: '2023-07-01T11:00:00Z', role: UserRole.ANALYST, area: Area.RRHH, password: '123' },
  { id: '88888888-8888-4888-a888-888888888888', name: 'Analista Acreditación', email: 'ana.acred@sisreq.com', status: 'ACTIVE', joinedAt: '2023-08-10T12:00:00Z', role: UserRole.ANALYST, area: Area.ACREDITACION, password: '123' },
  { id: '99999999-9999-4999-a999-999999999999', name: 'Analista Finanzas', email: 'ana.finanzas@sisreq.com', status: 'ACTIVE', joinedAt: '2023-09-05T09:30:00Z', role: UserRole.ANALYST, area: Area.FINANZAS, password: '123' },
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
  {
    id: 'a1111111-1111-4111-b111-111111111111',
    title: 'Auditoría de Procesos Q1',
    detail: 'Evaluación técnica de cumplimiento normativo para el primer trimestre del año fiscal.',
    requester: 'Gerencia de Control',
    area: Area.CONTABILIDAD,
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    createdAt: pastDate(2),
    lastUpdated: pastDate(2),
    logs: [{ id: 'l1111111-1111-4111-c111-111111111111', timestamp: pastDate(2), message: 'SISTEMA: Apertura de requerimiento SISREQ', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'a2222222-2222-4222-b222-222222222222',
    title: 'Cierre Mensual de Activos',
    detail: 'Proceso de depreciación y conciliación de activos fijos de la sede central.',
    requester: 'Operaciones',
    area: Area.CONTABILIDAD,
    status: Status.DERIVACION,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS[Area.CONTABILIDAD],
    createdAt: pastDate(24),
    lastUpdated: pastDate(20),
    logs: [{ id: 'l2222222-2222-4222-c222-222222222222', timestamp: pastDate(24), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'a3333333-3333-4333-b333-333333333333',
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
    logs: [{ id: 'l3333333-3333-4333-c333-333333333333', timestamp: pastDate(48), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'a4444444-4444-4444-b444-444444444444',
    title: 'Presupuesto Operativo 2025',
    detail: 'Consolidación de requerimientos presupuestarios para el próximo año fiscal.',
    requester: 'Gerencia General',
    area: Area.FINANZAS,
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.FINANZAS],
    createdAt: pastDate(12),
    lastUpdated: pastDate(12),
    logs: [{ id: 'l4444444-4444-4444-c444-444444444444', timestamp: pastDate(12), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'a5555555-5555-4555-b555-555555555555',
    title: 'Certificación ISO 9001',
    detail: 'Preparación de documentos para la auditoría de seguimiento ISO internacional.',
    requester: 'Calidad',
    area: Area.ACREDITACION,
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS[Area.ACREDITACION],
    createdAt: pastDate(5),
    lastUpdated: pastDate(5),
    logs: [{ id: 'l5555555-5555-4555-c555-555555555555', timestamp: pastDate(5), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
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
