
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RequestCard, Status, Priority, Area, UserRole, ViewMode, TransitionRule, LogEntry } from '../types';
import { AREA_HEADS } from '../constants';
import { db, DbDiagnostic } from '../services/storage';

interface SisreqContextType {
  currentUser: User | null;
  users: User[];
  requests: RequestCard[];
  isAuthenticated: boolean;
  isLoading: boolean;
  initError: string | null;
  dbDiagnostic: DbDiagnostic | null;
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

const genUUID = () => {
    try {
        return crypto.randomUUID();
    } catch (e) {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

const WORKFLOW_MATRIX: TransitionRule[] = [
  { from: Status.RECIBIDO, to: Status.DERIVACION, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
  { from: Status.DERIVACION, to: Status.EJECUCION, allowedRoles: [UserRole.HEAD, UserRole.SUPERADMIN, UserRole.ADMIN], requiresAnalyst: true, checkAreaJurisdiction: true },
  { from: Status.RECIBIDO, to: Status.FINALIZADO, allowedRoles: [UserRole.SUPERADMIN] }, 
  { from: Status.DERIVACION, to: Status.FINALIZADO, allowedRoles: [UserRole.SUPERADMIN, UserRole.HEAD], checkAreaJurisdiction: true }, 
  { from: Status.EJECUCION, to: Status.FINALIZADO, allowedRoles: [UserRole.ANALYST, UserRole.HEAD, UserRole.SUPERADMIN], checkAreaJurisdiction: true }, 
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
  const [dbDiagnostic, setDbDiagnostic] = useState<DbDiagnostic | null>(null);
  const [globalFilterArea, setGlobalFilterArea] = useState<Area | 'ALL'>('ALL');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const diag = await db.init();
        setDbDiagnostic(diag);
        
        if (diag.status === 'READY') {
          const [loadedUsers, loadedRequests] = await Promise.all([
            db.getUsers(),
            db.getRequests()
          ]);
          setUsers(loadedUsers);
          setRequests(loadedRequests.sort((a, b) => 
            new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime()
          ));
        }
      } catch (error: any) {
        setInitError(`Error de sistema: ${error.message}`);
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
  };

  const switchHybridRole = () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN || !currentUser.area) return;
    const isNowHead = activeRole === UserRole.ADMIN;
    setActiveRole(isNowHead ? UserRole.HEAD : UserRole.ADMIN);
    setGlobalFilterArea(isNowHead ? (currentUser.area as Area) : 'ALL');
  };

  const createAuditLog = useCallback((message: string): LogEntry => ({
    id: genUUID(),
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
    const rule = WORKFLOW_MATRIX.find(r => r.from === req.status && r.to === target);
    if (!rule) return { allowed: false, reason: 'Transición no permitida.' };
    if (!rule.allowedRoles.includes(activeRole)) return { allowed: false, reason: 'Permisos insuficientes.' };
    if (rule.checkAreaJurisdiction && ![UserRole.SUPERADMIN, UserRole.ADMIN].includes(activeRole)) {
        if (req.area !== currentUser.area) return { allowed: false, reason: 'Fuera de jurisdicción.' };
    }
    if (rule.requiresAnalyst && !req.assignedAnalyst) return { allowed: false, reason: 'Requiere asignación técnica.' };
    return { allowed: true };
  }, [currentUser, activeRole]);

  const isActionable = useCallback((req: RequestCard): boolean => {
    if (!activeRole) return false;
    return Object.values(Status).some(s => s !== req.status && canUserTransition(req, s).allowed);
  }, [activeRole, canUserTransition]);

  const addRequest = async (title: string, detail: string, area: Area, priority: Priority, requester: string) => {
    const now = new Date().toISOString();
    
    // Si el usuario está operando en rol de Jefatura (Hybrid Admin en modo Jefe o Jefe Nativo),
    // el requerimiento se auto-deriva para saltar la Bandeja Central.
    const initialStatus = activeRole === UserRole.HEAD ? Status.DERIVACION : Status.RECIBIDO;
    
    const newReq: RequestCard = {
      id: genUUID(),
      title, detail, area, status: initialStatus, priority, requester,
      responsibleHead: AREA_HEADS[area], createdAt: now, lastUpdated: now,
      logs: [createAuditLog(`SISTEMA: Apertura de registro en estado ${initialStatus.toUpperCase()}`)]
    };
    
    await db.saveRequest(newReq);
    setRequests(prev => [newReq, ...prev]);
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const now = new Date().toISOString();
    const updated = { ...req, status: newStatus, lastUpdated: now, logs: [...req.logs, createAuditLog(`FLUJO: Cambio a ${newStatus}`)] };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const returnRequest = async (id: string, reason: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const now = new Date().toISOString();
    const updated = { ...req, status: Status.RECIBIDO, isReturned: true, assignedAnalyst: undefined, lastUpdated: now, logs: [...req.logs, createAuditLog(`RETORNO: ${reason}`)] };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const assignAnalyst = async (id: string, name: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const now = new Date().toISOString();
    const updated = { ...req, assignedAnalyst: name, status: Status.EJECUCION, lastUpdated: now, logs: [...req.logs, createAuditLog(`ASIGNACIÓN: ${name}`)] };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const addLog = async (id: string, msg: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, lastUpdated: new Date().toISOString(), logs: [...req.logs, createAuditLog(msg)] };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const updateRequestDetails = async (id: string, title: string, detail: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, title, detail, lastUpdated: new Date().toISOString() };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteRequest = async (id: string) => {
    await db.deleteRequest(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const addUser = async (name: string, email: string, role: UserRole, pass: string, area?: Area) => {
    const newUser: User = { id: genUUID(), name, email, role, area, password: pass, status: 'ACTIVE', joinedAt: new Date().toISOString() };
    await db.saveUser(newUser);
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = async (u: User) => {
    await db.saveUser(u);
    setUsers(prev => prev.map(o => o.id === u.id ? u : o));
  };

  return (
    <SisreqContext.Provider value={{
      currentUser, users, requests, isAuthenticated, isLoading, initError, dbDiagnostic, activeRole, viewMode, globalFilterArea, selectedRequestId,
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
  if (!context) throw new Error('useSisreq debe usarse dentro de SisreqProvider');
  return context;
};
