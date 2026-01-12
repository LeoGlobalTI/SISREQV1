
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN', // Auditoría y Control Maestro
  ADMIN = 'ADMIN',           // Gestión Central: Recepción y Derivación
  HEAD = 'HEAD',            // Jefatura de Área: Gestión de Recursos y Asignación
  ANALYST = 'ANALYST'       // Cuerpo Técnico: Ejecución y Resolución
}

export enum Area {
  CONTABILIDAD = 'Contabilidad',
  RRHH = 'RRHH',
  ACREDITACION = 'Acreditación',
  FINANZAS = 'Finanzas'
}

export enum Status {
  RECIBIDO = 'Recibido',      // Bandeja de Entrada Central (Admin)
  DERIVACION = 'En Derivación', // Asignado a un Área (Jefe de Área)
  EJECUCION = 'En Ejecución',   // En trabajo activo por un Analista
  FINALIZADO = 'Finalizado'     // Requerimiento resuelto y auditado
}

export enum Priority {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  LOW = 'Baja'
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ViewMode = 'work' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  area?: Area; 
  password?: string;
  status?: UserStatus;
  joinedAt?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  actor: string;
  role: UserRole;
}

export interface RequestCard {
  id: string;
  title: string;
  detail: string;
  requester: string;
  area: Area;
  status: Status;
  priority: Priority;
  responsibleHead: string; 
  assignedAnalyst?: string; 
  logs: LogEntry[];
  createdAt: string;
  lastUpdated: string;
  finishedAt?: string;
  isReturned?: boolean; 
}

/**
 * Matriz de Transición de Estados (Ingeniería de Procesos)
 * Define las reglas de negocio para el flujo de trabajo SISREQ.
 */
export interface TransitionRule {
  from: Status;
  to: Status;
  allowedRoles: UserRole[];
  requiresAnalyst?: boolean;
  checkAreaJurisdiction?: boolean;
}
