
import { Area, Status, User, UserRole, Priority, RequestCard, VersionEntry } from './types';

export const INITIAL_USERS: User[] = [
  { id: '11111111-1111-4111-a111-111111111111', name: 'Leandro', email: 'leandro@sisreq.com', status: 'ACTIVE', joinedAt: '2023-01-01T10:00:00Z', role: UserRole.SUPERADMIN, password: '123' },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Evelin', email: 'evelin@sisreq.com', status: 'ACTIVE', joinedAt: '2023-02-15T11:00:00Z', role: UserRole.ADMIN, area: 'Finanzas', password: '123' },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Vania', email: 'vania@sisreq.com', status: 'ACTIVE', joinedAt: '2023-03-10T09:00:00Z', role: UserRole.HEAD, area: 'Contabilidad', password: '123' },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Rodrigo', email: 'rodrigo@sisreq.com', status: 'ACTIVE', joinedAt: '2023-04-05T08:30:00Z', role: UserRole.HEAD, area: 'RRHH', password: '123' },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Yerman', email: 'yerman@sisreq.com', status: 'ACTIVE', joinedAt: '2023-05-20T14:00:00Z', role: UserRole.HEAD, area: 'Acreditación', password: '123' },
  { id: '66666666-6666-4666-a666-666666666666', name: 'Analista Contabilidad', email: 'ana.cont@sisreq.com', status: 'ACTIVE', joinedAt: '2023-06-15T10:00:00Z', role: UserRole.ANALYST, area: 'Contabilidad', password: '123' },
  { id: '77777777-7777-4777-a777-777777777777', name: 'Analista RRHH', email: 'ana.rrhh@sisreq.com', status: 'ACTIVE', joinedAt: '2023-07-01T11:00:00Z', role: UserRole.ANALYST, area: 'RRHH', password: '123' },
  { id: '88888888-8888-4888-a888-888888888888', name: 'Analista Acreditación', email: 'ana.acred@sisreq.com', status: 'ACTIVE', joinedAt: '2023-08-10T12:00:00Z', role: UserRole.ANALYST, area: 'Acreditación', password: '123' },
  { id: '99999999-9999-4999-a999-999999999999', name: 'Analista Finanzas', email: 'ana.finanzas@sisreq.com', status: 'ACTIVE', joinedAt: '2023-09-05T09:30:00Z', role: UserRole.ANALYST, area: 'Finanzas', password: '123' },
];

export const AREA_HEADS: Record<Area, string> = {
  ['Contabilidad']: 'Vania',
  ['RRHH']: 'Rodrigo',
  ['Acreditación']: 'Yerman',
  ['Finanzas']: 'Evelin',
};

const now = new Date();
const pastDate = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const INITIAL_REQUESTS: RequestCard[] = [
  {
    id: 'a1111111-1111-4111-b111-111111111111',
    title: 'Auditoría de Procesos Q1',
    detail: 'Evaluación técnica de cumplimiento normativo para el primer trimestre del año fiscal.',
    requester: 'Gerencia de Control',
    area: 'Contabilidad',
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS['Contabilidad'],
    createdAt: pastDate(2),
    lastUpdated: pastDate(2),
    logs: [{ id: 'l1111111-1111-4111-c111-111111111111', timestamp: pastDate(2), message: 'SISTEMA: Apertura de requerimiento SISREQ', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'a2222222-2222-4222-b222-222222222222',
    title: 'Cierre Mensual de Activos',
    detail: 'Proceso de depreciación y conciliación de activos fijos de la sede central.',
    requester: 'Operaciones',
    area: 'Contabilidad',
    status: Status.DERIVACION,
    priority: Priority.MEDIUM,
    responsibleHead: AREA_HEADS['Contabilidad'],
    createdAt: pastDate(24),
    lastUpdated: pastDate(20),
    logs: [{ id: 'l2222222-2222-4222-c222-222222222222', timestamp: pastDate(24), message: 'SISTEMA: Apertura', actor: 'Leandro', role: UserRole.SUPERADMIN }]
  },
  {
    id: 'a3333333-3333-4333-b333-333333333333',
    title: 'Revisión Facturación Electrónica',
    detail: 'Validación de folios y discrepancias detectadas en el portal tributario.',
    requester: 'Ventas',
    area: 'Contabilidad',
    status: Status.EJECUCION,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS['Contabilidad'],
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
    area: 'Finanzas',
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS['Finanzas'],
    createdAt: pastDate(12),
    lastUpdated: pastDate(12),
    logs: [{ id: 'l4444444-4444-4444-c444-444444444444', timestamp: pastDate(12), message: 'SISTEMA: Apertura', actor: 'Evelin', role: UserRole.ADMIN }]
  },
  {
    id: 'a5555555-5555-4555-b555-555555555555',
    title: 'Certificación ISO 9001',
    detail: 'Preparación de documentos para la auditoría de seguimiento ISO internacional.',
    requester: 'Calidad',
    area: 'Acreditación',
    status: Status.RECIBIDO,
    priority: Priority.HIGH,
    responsibleHead: AREA_HEADS['Acreditación'],
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

export const VERSIONS: VersionEntry[] = [
  {
    version: 'v4.3.4-INTEGRITY',
    codename: 'Workflow Consolidation & Transactional Security',
    date: '23 de Septiembre 2026',
    type: 'PATCH',
    highlights: [
      'Reasignación Flexible: Habilitada reasignación de analistas en fases de Derivación y Ejecución.',
      'Control de Ejecución: Botón "Iniciar Ejecución" explícito para transiciones controladas.',
      'Persistencia Atómica: Unificación de guardado directo en DB para todas las transiciones, previniendo pérdida de estado.',
      'Saneamiento en Retornos: Limpieza automática de analistas y jefaturas al devolver expedientes a Central.',
      'Validación de Titularidad: Restricción de cierre de expedientes para analistas asignados.',
      'Reapertura Master: Capacidad de reapertura de expedientes finalizados para roles SuperAdmin.',
      'Edición de Área: Reasignación de unidad orgánica en modo edición para operadores autorizados.',
      'Filtros Estrictos: Corrección en el filtro de tablero para Bandeja Central.'
    ]
  },
  {
    version: 'v4.3.3-STABILITY',
    codename: 'Operational Flow & Traceability',
    date: '20 de Septiembre 2026',
    type: 'PATCH',
    highlights: [
      'Integridad de IDs: Implementación de prefijos p- en UUIDs para eliminar falsos positivos en auditoría.',
      'Sincronización Atómica: Nuevo motor de guardado que previene pérdida de datos en logs por concurrencia.',
      'Auditoría Granular: Trazabilidad específica de cambios en títulos, alcances y prioridades.',
      'Escalamiento Directo: Habilitación de cambio de prioridad con registro de historial en el detalle del expediente.',
      'Validación Financiera: Bloqueo preventivo de registros Únicos con monto cero en la fase de creación.'
    ]
  },
  {
    version: 'v4.3.2-INTEGRITY',
    codename: 'Unified Governance & Security',
    date: '20 de Septiembre 2026',
    type: 'PATCH',
    highlights: [
      'Estandarización de SLA: Unificación de umbrales (3.5d, 5d, 15d, 30d) en todos los módulos analíticos.',
      'Monitor de Descarte: Nuevo KPI de Tasa de Descarte en Gobernanza para detectar posibles manipulaciones de métricas.',
      'Blindaje de Sesión: Validación activa del estado del usuario contra la base de datos para cierre de sesión inmediato en cuentas inactivas.',
      'Refinamiento de Reportes: Sincronización de semántica de plazos y estados en exportaciones de datos.'
    ]
  },
  {
    version: 'v4.3.1-LAYOUT',
    codename: 'Technical Context & UX Flow',
    date: '18 de Septiembre 2026',
    type: 'PATCH',
    highlights: [
      'Reordenamiento de Detalle: Priorización del Responsable Designado al inicio del expediente para una gestión ágil.',
      'Optimización de Lectura: Reubicación del Alcance Técnico al final del modal de detalle, favoreciendo el escaneo de datos financieros y operativos.',
      'Restauración de Flujo: Reversión de campos en el modal de Nuevo Requerimiento para mantener la consistencia con el estándar de ingreso corporativo.',
      'Alineación Semántica: Sincronización de etiquetas entre los módulos de registro y visualización técnica.'
    ]
  },
  {
    version: 'v4.3.0-INTEGRITY',
    codename: 'Concurrency & Financial Integrity',
    date: '18 de Septiembre 2026',
    type: 'MINOR',
    highlights: [
      'Blindaje de Concurrencia: Implementación de IDs deterministas para evitar duplicidad de tickets en inyecciones simultáneas.',
      'Auditoría Resiliente: Nuevo motor de logs atómicos para prevenir pérdida de datos durante ediciones concurrentes.',
      'Refinamiento Comercial: Rediseño de la modalidad "Único" con gestión avanzada de Anticipos y Totales.',
      'Validación de Cierre: Control crítico de confirmación de pago total antes de finalizar expedientes comerciales.',
      'Simplificación UI/UX: Eliminación de redundancias textuales y optimización de densidad visual en formularios.'
    ]
  },
  {
    version: 'v4.2.0-PLANNER',
    codename: 'Process Engine & Operational Resilience',
    date: '16 de Septiembre 2026',
    type: 'MAJOR',
    highlights: [
      'Planificador de Procesos Maestro: Automatización visual de procesos y programación de alertas temporales Just-In-Time.',
      'Inyección Automática a Kanban: Despacho inteligente de tickets según ventana de visibilidad y asignación directa a analistas.',
      'Blindaje Estructural e Integridad: Candados anti-orfandad al eliminar Áreas o Usuarios y saneamiento al retornar requerimientos.',
      'Sincronización Institucional del Sistema: Centralización del Registro de Versiones y enlace corporativo a Global TI (www.gtitech.cl).'
    ]
  },
  {
    version: 'v4.1.0-SECURITY',
    codename: 'Data Integrity & Cloud Resilience',
    date: '10 de Septiembre 2026',
    type: 'MINOR',
    highlights: [
      'Persistencia Híbrida: Conexión con Supabase y respaldo en caché local resiliente para operación continua tolerante a fallos.',
      'Control de Transiciones RBAC: Restricción estricta en expedientes finalizados y validación de jurisdicción de áreas.',
      'Módulo de Auditoría: Registro cronológico de eventos, borrado lógico con trazabilidad y marcas de tiempo.'
    ]
  },
  {
    version: 'v4.0.0-BENTO',
    codename: 'Governance & Bento Architecture',
    date: '04 de Septiembre 2026',
    type: 'MAJOR',
    highlights: [
      'Consolidación del Master Panel en arquitectura Bento Grid modular.',
      'Centro de Mando Organizacional y gestión de usuarios multi-área.',
      'Módulo de Gobernanza Unificada con exportación de manuales técnicos en PDF.'
    ]
  },
  {
    version: 'v3.5.0-MASTER',
    codename: 'Executive Insight & Governance',
    date: '27 de Agosto 2026',
    type: 'MINOR',
    highlights: [
      'Inteligencia Operativa y métricas de desempeño por analista y departamento.',
      'Control Maestro para SuperAdmin con alternancia de perfiles y supervisión.',
      'Enfoque Sistémico y calibración ergonómica.'
    ]
  },
  {
    version: 'v3.4.2-MASTER',
    codename: 'Ergonomic Workspace Layout',
    date: '27 de Agosto 2026',
    type: 'PATCH',
    highlights: [
      'Rediseño a dos columnas del expediente técnico con registro cronológico de eventos (logs).',
      'Calibración matemática del ancho modal y diseño responsive.'
    ]
  }
];

export const CURRENT_VERSION = VERSIONS[0].version;

// --- SLA & OPERATIONAL THRESHOLDS ---
export const SLA_THRESHOLDS = {
  NORMAL_DAYS: 3.5,    // Verde: Bajo este tiempo el servicio es óptimo
  WARNING_DAYS: 5,     // Ámbar: Umbral de advertencia para gestión proactiva
  CRITICAL_DAYS: 15,   // Rojo: Riesgo operacional, requiere intervención inmediata
  BREACHED_DAYS: 30    // Crítico: Incumplimiento total de compromiso de servicio
};
