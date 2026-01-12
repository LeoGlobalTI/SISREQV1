
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RequestCard, Status, Priority, Area, UserRole, ViewMode, TransitionRule, LogEntry } from '../types';
import { AREA_HEADS } from '../constants';
import { db } from '../services/storage';

interface SisreqContextType {
  currentUser: User | null;
  users: User[];
  requests: RequestCard[];
  isAuthenticated: boolean;
  isLoading: boolean;
  initError: string | null;
  activeRole: UserRole | null;
  viewMode: ViewMode;
  globalFilterArea: Area | 'ALL';
  selectedRequestId: string | null;
  
  login: (user: User) => void;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  switchHybridRole: () => void;
  setViewMode: (mode: ViewMode) => void;
  addUser: (name: string, email: string, role: UserRole, password: string, area?: Area) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  
  setSelectedRequestId: (id: string | null) => void;
  setGlobalFilterArea: (area: Area | 'ALL') => void;
  addRequest: (title: string, detail: string, area: Area, priority: Priority, requester: string) => Promise<void>;
  updateStatus: (id: string, newStatus: Status) => Promise<void>;
  returnRequest: (id: string, reason: string) => Promise<void>;
  assignAnalyst: (id: string, analystName: string) => Promise<void>;
  addLog: (id: string, message: string) => Promise<void>;
  updateRequestDetails: (id: string, title: string, detail: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  
  canUserTransition: (request: RequestCard, targetStatus: Status) => { allowed: boolean; reason?: string };
  canUserSeeRequest: (request: RequestCard) => boolean;
  isActionable: (request: RequestCard) => boolean;
}

const SisreqContext = createContext<SisreqContextType | undefined>(undefined);

const genId = (p: string) => `${p}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

/**
 * MATRIZ DE SEGURIDAD Y WORKFLOW SISREQ
 */
const WORKFLOW_MATRIX: TransitionRule[] = [
  { from: Status.RECIBIDO, to: Status.DERIVACION, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
  { from: Status.DERIVACION, to: Status.EJECUCION, allowedRoles: [UserRole.HEAD, UserRole.SUPERADMIN, UserRole.ADMIN], requiresAnalyst: true, checkAreaJurisdiction: true },
  
  // Transiciones a Finalizado (Reglas estrictas)
  { from: Status.RECIBIDO, to: Status.FINALIZADO, allowedRoles: [UserRole.SUPERADMIN] }, 
  { from: Status.DERIVACION, to: Status.FINALIZADO, allowedRoles: [UserRole.SUPERADMIN, UserRole.HEAD], checkAreaJurisdiction: true }, 
  { from: Status.EJECUCION, to: Status.FINALIZADO, allowedRoles: [UserRole.ANALYST, UserRole.HEAD, UserRole.SUPERADMIN], checkAreaJurisdiction: true }, 

  // Flujos de Retorno y Ajuste Operativo
  { from: Status.FINALIZADO, to: Status.RECIBIDO, allowedRoles: [UserRole.SUPERADMIN] },
  { from: Status.EJECUCION, to: Status.DERIVACION, allowedRoles: [UserRole.HEAD, UserRole.SUPERADMIN, UserRole.ADMIN], checkAreaJurisdiction: true },
  { from: Status.DERIVACION, to: Status.RECIBIDO, allowedRoles: [UserRole.HEAD, UserRole.ADMIN, UserRole.SUPERADMIN], checkAreaJurisdiction: true },
  { from: Status.EJECUCION, to: Status.RECIBIDO, allowedRoles: [UserRole.HEAD, UserRole.ADMIN, UserRole.SUPERADMIN], checkAreaJurisdiction: true }
];

export const SisreqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestCard[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('work');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [globalFilterArea, setGlobalFilterArea] = useState<Area | 'ALL'>('ALL');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        await db.init();
        const [loadedUsers, loadedRequests] = await Promise.all([
          db.getUsers(),
          db.getRequests()
        ]);
        setUsers(loadedUsers);
        setRequests(loadedRequests.sort((a, b) => 
          new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime()
        ));
      } catch (error) {
        setInitError("Fallo en la conexión con la base de datos local SISREQ.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeSystem();
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    setIsAuthenticated(true);
    setGlobalFilterArea(user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN ? 'ALL' : (user.area as Area));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveRole(null);
    setSelectedRequestId(null);
    setViewMode('work');
  };

  const switchHybridRole = () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN || !currentUser.area) return;
    const isNowHead = activeRole === UserRole.ADMIN;
    setActiveRole(isNowHead ? UserRole.HEAD : UserRole.ADMIN);
    setGlobalFilterArea(isNowHead ? (currentUser.area as Area) : 'ALL');
  };

  const createAuditLog = useCallback((message: string): LogEntry => ({
    id: genId('LOG'),
    timestamp: new Date().toISOString(),
    message,
    actor: currentUser?.name || 'Sistema',
    role: activeRole || UserRole.ANALYST
  }), [currentUser, activeRole]);

  const canUserSeeRequest = useCallback((req: RequestCard): boolean => {
    if (!currentUser || !activeRole) return false;
    if (activeRole === UserRole.SUPERADMIN || activeRole === UserRole.ADMIN) return true;
    const isSameArea = req.area === currentUser.area;
    const isOutOfCentral = req.status !== Status.RECIBIDO;
    return isSameArea && isOutOfCentral;
  }, [currentUser, activeRole]);

  const canUserTransition = useCallback((req: RequestCard, target: Status): { allowed: boolean; reason?: string } => {
    if (!currentUser || !activeRole) return { allowed: false, reason: 'Sesión inactiva.' };
    if (req.status === target) return { allowed: false, reason: 'Fase operativa redundante.' };
    
    const rule = WORKFLOW_MATRIX.find(r => r.from === req.status && r.to === target);
    
    if (!rule) return { allowed: false, reason: 'Transición no contemplada en la matriz técnica para este estado.' };

    if (!rule.allowedRoles.includes(activeRole)) {
        return { allowed: false, reason: `Privilegios insuficientes para esta acción (Rol actual: ${activeRole}).` };
    }

    if (rule.checkAreaJurisdiction && ![UserRole.SUPERADMIN, UserRole.ADMIN].includes(activeRole)) {
        if (req.area !== currentUser.area) return { allowed: false, reason: 'Jurisdicción ajena a su área operativa.' };
        if (target === Status.FINALIZADO && activeRole === UserRole.ANALYST) {
           if (req.assignedAnalyst !== currentUser.name) return { allowed: false, reason: 'Sólo el responsable técnico designado puede cerrar el expediente.' };
        }
    }

    if (rule.requiresAnalyst && !req.assignedAnalyst) {
        return { allowed: false, reason: 'Falta designación de Responsable Técnico para iniciar ejecución.' };
    }

    return { allowed: true };
  }, [currentUser, activeRole]);

  const isActionable = useCallback((req: RequestCard): boolean => {
    if (!activeRole) return false;
    if (activeRole === UserRole.SUPERADMIN) return true;
    return Object.values(Status).some(s => s !== req.status && canUserTransition(req, s).allowed);
  }, [activeRole, canUserTransition]);

  const addRequest = async (title: string, detail: string, area: Area, priority: Priority, requester: string) => {
    const now = new Date().toISOString();
    const initialStatus = activeRole === UserRole.HEAD ? Status.DERIVACION : Status.RECIBIDO;
    const auditMessage = activeRole === UserRole.HEAD 
      ? `SISTEMA: Apertura y auto-derivación técnica a Jefatura de ${area}.`
      : `SISTEMA: Apertura de registro oficial SISREQ en Bandeja Central.`;

    const newReq: RequestCard = {
      id: genId('REQ'),
      title: title.trim(),
      detail: detail.trim(),
      area,
      status: initialStatus,
      priority,
      requester: requester.trim(),
      responsibleHead: AREA_HEADS[area],
      createdAt: now,
      lastUpdated: now,
      logs: [createAuditLog(auditMessage)]
    };

    await db.saveRequest(newReq);
    setRequests(prev => [newReq, ...prev]);
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const validation = canUserTransition(req, newStatus);
    if (!validation.allowed) throw new Error(validation.reason);

    const now = new Date().toISOString();
    const updated: RequestCard = {
      ...req,
      status: newStatus,
      lastUpdated: now,
      finishedAt: newStatus === Status.FINALIZADO ? now : req.finishedAt,
      assignedAnalyst: newStatus === Status.RECIBIDO ? undefined : req.assignedAnalyst,
      isReturned: newStatus === Status.RECIBIDO ? true : (newStatus === Status.EJECUCION ? false : req.isReturned),
      logs: [...req.logs, createAuditLog(`FLUJO: Cambio de fase operativa a [${newStatus.toUpperCase()}]`)]
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r).sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  };

  const returnRequest = async (id: string, reason: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    
    // Validamos transición vía matriz
    const validation = canUserTransition(req, Status.RECIBIDO);
    if (!validation.allowed) throw new Error(validation.reason);

    const now = new Date().toISOString();
    const updated: RequestCard = {
      ...req,
      status: Status.RECIBIDO,
      isReturned: true,
      assignedAnalyst: undefined,
      lastUpdated: now,
      logs: [...req.logs, createAuditLog(`RETORNO TÉCNICO: ${reason.trim()}`)]
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r).sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  };

  const assignAnalyst = async (id: string, analystName: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    
    // Verificamos permisos del rol activo para asignar (Solo HEAD, ADMIN o SUPERADMIN)
    if (!activeRole || ![UserRole.HEAD, UserRole.ADMIN, UserRole.SUPERADMIN].includes(activeRole)) {
        throw new Error("No posee privilegios para realizar asignaciones técnicas.");
    }

    const now = new Date().toISOString();
    const updated: RequestCard = {
      ...req,
      assignedAnalyst: analystName,
      status: Status.EJECUCION,
      lastUpdated: now,
      logs: [
          ...req.logs, 
          createAuditLog(`SISTEMA: ${analystName.toUpperCase()} designado como Responsable Técnico.`),
          createAuditLog(`FLUJO: Transición automática a fase operativa [EJECUCIÓN] por asignación técnica.`)
      ]
    };
    await db.saveRequest(updated);
    setRequests(prev => 
      prev.map(r => r.id === id ? updated : r)
      .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    );
  };

  const addLog = async (id: string, message: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const now = new Date().toISOString();
    const updated: RequestCard = {
      ...req,
      lastUpdated: now,
      logs: [...req.logs, createAuditLog(message.trim())]
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const updateRequestDetails = async (id: string, title: string, detail: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const now = new Date().toISOString();
    const updated: RequestCard = {
      ...req,
      title: title.trim(),
      detail: detail.trim(),
      lastUpdated: now,
      logs: [...req.logs, createAuditLog('SISTEMA: Actualización manual de metadatos técnicos.')]
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteRequest = async (id: string) => {
    if (activeRole !== UserRole.SUPERADMIN) throw new Error("Acceso restringido a Auditoría Master.");
    await db.deleteRequest(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const addUser = async (name: string, email: string, role: UserRole, pass: string, area?: Area) => {
    const newUser: User = { 
      id: genId('U'), name, email, role, area, password: pass, status: 'ACTIVE', joinedAt: new Date().toISOString() 
    };
    await db.saveUser(newUser);
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = async (u: User) => {
    await db.saveUser(u);
    setUsers(prev => prev.map(o => o.id === u.id ? u : o));
    if (currentUser?.id === u.id) setCurrentUser(u);
  };

  return (
    <SisreqContext.Provider value={{
      currentUser, users, requests, isAuthenticated, isLoading, initError, activeRole, viewMode, globalFilterArea, selectedRequestId,
      login, logout, setActiveRole, switchHybridRole, setViewMode, addUser, updateUser,
      setSelectedRequestId, setGlobalFilterArea, addRequest, updateStatus, returnRequest, assignAnalyst, addLog, updateRequestDetails, deleteRequest,
      canUserTransition, canUserSeeRequest, isActionable
    }}>
      {children}
    </SisreqContext.Provider>
  );
};

export const useSisreq = () => {
  const context = useContext(SisreqContext);
  if (context === undefined) throw new Error('useSisreq debe usarse dentro de SisreqProvider');
  return context;
};
