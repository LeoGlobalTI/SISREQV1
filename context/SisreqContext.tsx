
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RequestCard, Status, Priority, Area, UserRole, ViewMode, TransitionRule, LogEntry, Notification, NotificationType, NotificationSettings } from '../types';
import { AREA_HEADS } from '../constants';
import { db, DbDiagnostic } from '../services/storage';

interface SisreqContextType {
  currentUser: User | null;
  users: User[];
  requests: RequestCard[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  isAuthenticated: boolean;
  isLoading: boolean;
  initError: string | null;
  dbDiagnostic: DbDiagnostic | null;
  activeRole: UserRole | null;
  viewMode: ViewMode;
  globalFilterArea: Area | 'ALL';
  selectedRequestId: string | null;
  organizationAreas: string[];
  
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  switchHybridRole: () => void;
  setViewMode: (mode: ViewMode) => void;
  addUser: (name: string, email: string, role: UserRole, password: string, area?: Area) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  addOrganizationArea: (areaName: string) => void;
  updateOrganizationArea: (oldName: string, newName: string) => void;
  deleteOrganizationArea: (areaName: string) => void;
  
  setSelectedRequestId: (id: string | null) => void;
  setGlobalFilterArea: (area: Area | 'ALL') => void;
  addRequest: (title: string, detail: string, area: Area, priority: Priority, requester: string) => Promise<void>;
  updateStatus: (id: string, newStatus: Status) => Promise<void>;
  returnRequest: (id: string, reason: string) => Promise<void>;
  assignAnalyst: (id: string, analystName: string) => Promise<void>;
  addLog: (id: string, message: string) => Promise<void>;
  updateRequestDetails: (id: string, title: string, detail: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  hardDeleteAllRequests: () => Promise<void>;
  
  addNotification: (type: NotificationType, title: string, message: string, requestId?: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  canUserTransition: (request: RequestCard, targetStatus: Status) => { allowed: boolean; reason?: string };
  canUserSeeRequest: (request: RequestCard) => boolean;
  isActionable: (request: RequestCard) => boolean;
}

const SisreqContext = createContext<SisreqContextType | undefined>(undefined);

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sounds: false, // Notificaciones sonoras deshabilitadas por defecto
  newRequests: true,
  statusChanges: true,
  returns: true,
  assignments: true,
  auditAlerts: true
};

const genUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const WORKFLOW_MATRIX: TransitionRule[] = [
  { from: Status.RECIBIDO, to: Status.DERIVACION, allowedRoles: [UserRole.ADMIN, UserRole.SUPERADMIN] },
  { from: Status.DERIVACION, to: Status.EJECUCION, allowedRoles: [UserRole.HEAD, UserRole.SUPERADMIN, UserRole.ADMIN], requiresAnalyst: true, checkAreaJurisdiction: true },
  { from: Status.EJECUCION, to: Status.FINALIZADO, allowedRoles: [UserRole.ANALYST, UserRole.HEAD, UserRole.SUPERADMIN], checkAreaJurisdiction: true }, 
  { from: Status.RECIBIDO, to: Status.FINALIZADO, allowedRoles: [UserRole.SUPERADMIN] }, 
  { from: Status.DERIVACION, to: Status.FINALIZADO, allowedRoles: [UserRole.SUPERADMIN, UserRole.HEAD], checkAreaJurisdiction: true }, 
  { from: Status.FINALIZADO, to: Status.RECIBIDO, allowedRoles: [UserRole.SUPERADMIN] },
  { from: Status.EJECUCION, to: Status.RECIBIDO, allowedRoles: [UserRole.HEAD, UserRole.ADMIN, UserRole.SUPERADMIN], checkAreaJurisdiction: true },
  { from: Status.DERIVACION, to: Status.RECIBIDO, allowedRoles: [UserRole.HEAD, UserRole.ADMIN, UserRole.SUPERADMIN], checkAreaJurisdiction: true }
];

export const SisreqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestCard[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
        const saved = localStorage.getItem('sisreq_notification_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) {
        console.warn("localStorage no está disponible (modo incógnito/privado). Usando configuración por defecto.");
        return DEFAULT_SETTINGS;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const saved = localStorage.getItem('sisreq_session_user');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
  });
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => {
    try {
        const saved = localStorage.getItem('sisreq_session_role');
        return saved ? JSON.parse(saved) as UserRole : null;
    } catch (e) {
        return null;
    }
  });
  const [viewMode, setViewMode] = useState<ViewMode>('work');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
        return localStorage.getItem('sisreq_session_user') !== null;
    } catch (e) {
        return false;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [dbDiagnostic, setDbDiagnostic] = useState<DbDiagnostic | null>(null);
  const [globalFilterArea, setGlobalFilterArea] = useState<Area | 'ALL'>(() => {
    try {
        const savedUser = localStorage.getItem('sisreq_session_user');
        if (savedUser) {
            const user = JSON.parse(savedUser) as User;
            const savedRole = localStorage.getItem('sisreq_session_role');
            const role = savedRole ? JSON.parse(savedRole) as UserRole : user.role;
            return role === UserRole.ADMIN || role === UserRole.SUPERADMIN ? 'ALL' : (user.area as Area);
        }
        return 'ALL';
    } catch (e) {
        return 'ALL';
    }
  });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  const [organizationAreas, setOrganizationAreas] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('sisreq_organization_areas');
        return saved ? JSON.parse(saved) : ['Contabilidad', 'RRHH', 'Acreditación', 'Finanzas'];
    } catch (e) {
        return ['Contabilidad', 'RRHH', 'Acreditación', 'Finanzas'];
    }
  });

  const saveAreas = (newAreas: string[]) => {
      setOrganizationAreas(newAreas);
      try {
          localStorage.setItem('sisreq_organization_areas', JSON.stringify(newAreas));
      } catch (e) {
          console.warn("No se pudieron guardar las áreas.");
      }
  };

  const addOrganizationArea = (areaName: string) => {
      if (!organizationAreas.includes(areaName)) {
          saveAreas([...organizationAreas, areaName]);
          addNotification('SUCCESS', 'Área Creada', `El área ${areaName} fue registrada en la organización.`);
      }
  };

  const updateOrganizationArea = (oldName: string, newName: string) => {
      saveAreas(organizationAreas.map(a => a === oldName ? newName : a));
      addNotification('INFO', 'Área Actualizada', `El área ${oldName} ahora es ${newName}.`);
  };

  const deleteOrganizationArea = (areaName: string) => {
      saveAreas(organizationAreas.filter(a => a !== areaName));
      addNotification('WARNING', 'Área Eliminada', `El área ${areaName} fue eliminada de la organización.`);
  };

  const loadData = useCallback(async () => {
      const [loadedUsers, loadedRequests] = await Promise.all([
        db.getUsers(),
        db.getRequests()
      ]);
      setUsers(loadedUsers);
      setRequests(loadedRequests.sort((a, b) => 
        new Date(b.lastUpdated || b.createdAt).getTime() - new Date(a.lastUpdated || a.createdAt).getTime()
      ));
  }, []);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const diag = await db.init();
        setDbDiagnostic(diag);
        
        if (diag.status === 'READY') {
          await loadData();
        }
      } catch (error: any) {
        setInitError(`Fallo de Inicialización: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    initializeSystem();
  }, [loadData]);

  useEffect(() => {
    if (dbDiagnostic?.status !== 'READY') return;
    
    // Sincronización en tiempo real vía Supabase (Actualización Incremental O(1))
    const unsubscribe = db.subscribeToRequests((payload) => {
        if (payload.eventType === 'INSERT') {
            setRequests(prev => {
                if (prev.find(r => r.id === payload.new.id)) return prev;
                return [...prev, payload.new as RequestCard];
            });
        } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new as RequestCard : r));
        } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
    });

    // Fallback de Polling (reducido a cada 60 segundos para no saturar la red)
    const interval = setInterval(() => {
        loadData();
    }, 60000);

    return () => {
        unsubscribe();
        clearInterval(interval);
    };
  }, [dbDiagnostic, loadData]);

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => {
        const updated = { ...prev, ...newSettings };
        try {
            localStorage.setItem('sisreq_notification_settings', JSON.stringify(updated));
        } catch (e) {
            console.warn("No se pudo guardar la configuración en localStorage.");
        }
        return updated;
    });
  }, []);

  const addNotification = useCallback((type: NotificationType, title: string, message: string, requestId?: string) => {
    if (!notificationSettings.enabled) return;

    const newNotif: Notification = {
      id: genUUID(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      requestId
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));

    if (notificationSettings.sounds) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.15;
        audio.play().catch(() => {});
    }
  }, [notificationSettings]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => setNotifications([]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
        const user = await db.validateUser(email, pass);
        if (user) {
            setCurrentUser(user);
            setActiveRole(user.role);
            setIsAuthenticated(true);
            
            // Persistencia de sesión
            try {
                localStorage.setItem('sisreq_session_user', JSON.stringify(user));
                localStorage.setItem('sisreq_session_role', JSON.stringify(user.role));
            } catch (e) {
                console.warn("No se pudo persistir la sesión en localStorage.");
            }

            setGlobalFilterArea(user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN ? 'ALL' : (user.area as Area));
            addNotification('INFO', 'Acceso Concedido', `Bienvenido(a), ${user.name}. Modo ${user.role} activo.`);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Login Error:", e);
        return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveRole(null);
    setSelectedRequestId(null);
    setNotifications([]);
    
    // Limpieza de sesión
    try {
        localStorage.removeItem('sisreq_session_user');
        localStorage.removeItem('sisreq_session_role');
    } catch (e) {
        console.warn("No se pudo limpiar la sesión de localStorage.");
    }
  };

  const switchHybridRole = () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN || !currentUser.area) return;
    const isNowHead = activeRole === UserRole.ADMIN;
    const newRole = isNowHead ? UserRole.HEAD : UserRole.ADMIN;
    setActiveRole(newRole);
    setGlobalFilterArea(isNowHead ? (currentUser.area as Area) : 'ALL');
    addNotification('PROCESS', 'Cambio de Rol', `Perfil alternado a: ${newRole === UserRole.ADMIN ? 'Administrador Central' : 'Jefatura ' + currentUser.area}`);
  };

  const createAuditLog = useCallback((message: string): LogEntry => ({
    id: genUUID(),
    timestamp: new Date().toISOString(),
    message: message.toUpperCase(),
    actor: currentUser?.name || 'Sistema',
    role: activeRole || UserRole.ANALYST
  }), [currentUser, activeRole]);

  const canUserSeeRequest = useCallback((req: RequestCard): boolean => {
    if (!currentUser || !activeRole) return false;
    if (req.isDeleted && activeRole !== UserRole.SUPERADMIN) return false; 
    if (activeRole === UserRole.SUPERADMIN || activeRole === UserRole.ADMIN) return true;
    const isSameArea = req.area === currentUser.area;
    const isOutOfCentral = req.status !== Status.RECIBIDO;
    return isSameArea && isOutOfCentral;
  }, [currentUser, activeRole]);

  const canUserTransition = useCallback((req: RequestCard, target: Status): { allowed: boolean; reason?: string } => {
    if (!currentUser || !activeRole) return { allowed: false, reason: 'Sesión inactiva.' };
    if (req.isDeleted) return { allowed: false, reason: 'Expediente archivado e inmutable.' };
    
    // Auditoría: Bloqueo de cambios en expedientes finalizados (excepto por SuperAdmin)
    if (req.status === Status.FINALIZADO && activeRole !== UserRole.SUPERADMIN && target !== Status.FINALIZADO) {
        return { allowed: false, reason: 'Solo Auditoría Master puede reabrir registros finalizados.' };
    }

    const rule = WORKFLOW_MATRIX.find(r => r.from === req.status && r.to === target);
    if (!rule) return { allowed: false, reason: 'Flujo operativo no permitido.' };
    if (!rule.allowedRoles.includes(activeRole)) return { allowed: false, reason: 'Nivel de privilegios insuficiente.' };
    
    // Verificación estricta de Jurisdicción de Área
    if (rule.checkAreaJurisdiction && ![UserRole.SUPERADMIN, UserRole.ADMIN].includes(activeRole)) {
        if (req.area !== currentUser.area) return { allowed: false, reason: 'El expediente no pertenece a su unidad orgánica.' };
    }
    
    if (rule.requiresAnalyst && !req.assignedAnalyst) return { allowed: false, reason: 'Debe designar un Responsable Técnico antes de la ejecución.' };
    
    return { allowed: true };
  }, [currentUser, activeRole]);

  const isActionable = useCallback((req: RequestCard): boolean => {
    if (!activeRole || req.isDeleted) return false;
    if (req.status === Status.FINALIZADO && activeRole !== UserRole.SUPERADMIN) return false;
    return Object.values(Status).some(s => s !== req.status && canUserTransition(req, s).allowed);
  }, [activeRole, canUserTransition]);

  const addRequest = async (title: string, detail: string, area: Area, priority: Priority, requester: string) => {
    const now = new Date().toISOString();
    const initialStatus = (activeRole === UserRole.ADMIN || activeRole === UserRole.SUPERADMIN) ? Status.RECIBIDO : Status.DERIVACION;
    const newReq: RequestCard = {
      id: genUUID(),
      title, detail, area, status: initialStatus, priority, requester,
      responsibleHead: AREA_HEADS[area], createdAt: now, lastUpdated: now,
      logs: [createAuditLog(`APERTURA: Registro inicializado en fase ${initialStatus}`)]
    };
    await db.saveRequest(newReq);
    setRequests(prev => [newReq, ...prev]);
    addNotification('SUCCESS', 'Nuevo Expediente', `Ticket registrado: ${title}`, newReq.id);
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    const localReq = requests.find(r => r.id === id);
    if (!localReq) return;
    const req = await db.getRequestById(id) || localReq;
    
    const check = canUserTransition(req, newStatus);
    if (!check.allowed) throw new Error(check.reason);
    
    const now = new Date().toISOString();
    const finishedAt = newStatus === Status.FINALIZADO ? now : (req.status === Status.FINALIZADO ? null : req.finishedAt);
    const isReturned = newStatus !== Status.RECIBIDO ? false : req.isReturned;
    const updated = { 
        ...req, 
        status: newStatus, 
        isReturned,
        lastUpdated: now, 
        finishedAt: finishedAt, 
        logs: [...req.logs, createAuditLog(`TRANSICIÓN: Cambio de fase operativa a ${newStatus}`)] 
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    addNotification('PROCESS', 'Fase Actualizada', `Expediente en ${newStatus}`, id);
  };

  const returnRequest = async (id: string, reason: string) => {
    const localReq = requests.find(r => r.id === id);
    if (!localReq) return;
    const req = await db.getRequestById(id) || localReq;
    
    const check = canUserTransition(req, Status.RECIBIDO);
    if (!check.allowed) throw new Error(check.reason);
    
    const now = new Date().toISOString();
    const updated = { 
        ...req, 
        status: Status.RECIBIDO, 
        isReturned: true, 
        assignedAnalyst: null, 
        lastUpdated: now, 
        finishedAt: null, 
        logs: [...req.logs, createAuditLog(`DEVOLUCIÓN: Retornado a Central. Motivo: ${reason}`)] 
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    addNotification('WARNING', 'Devolución Técnica', `Ticket retornado: ${reason}`, id);
  };

  const assignAnalyst = async (id: string, name: string) => {
    if (activeRole !== UserRole.HEAD && activeRole !== UserRole.ADMIN && activeRole !== UserRole.SUPERADMIN) {
        throw new Error("Privilegios insuficientes para asignar personal.");
    }
    const localReq = requests.find(r => r.id === id);
    if (!localReq) return;
    const req = await db.getRequestById(id) || localReq;
    
    // Bloqueo de asignación si no está en la fase correcta
    if (req.status !== Status.DERIVACION && req.status !== Status.EJECUCION) 
        throw new Error("Acción denegada: El expediente debe estar en fase de DERIVACIÓN o EJECUCIÓN.");
        
    const now = new Date().toISOString();
    const updated = { 
        ...req, 
        assignedAnalyst: name, 
        status: Status.EJECUCION, 
        lastUpdated: now, 
        logs: [...req.logs, createAuditLog(`DESIGNACIÓN: Responsable Técnico asignado: ${name}`)] 
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
    addNotification('SUCCESS', 'Personal Designado', `${name} asume la responsabilidad del ticket.`, id);
  };

  const addLog = async (id: string, msg: string) => {
    const localReq = requests.find(r => r.id === id);
    if (!localReq || localReq.isDeleted) return;
    const req = await db.getRequestById(id) || localReq;
    
    if (!canUserSeeRequest(req)) {
        throw new Error("No tiene jurisdicción para comentar en este expediente.");
    }
    
    // Auditoría: Bloqueo de comentarios en tickets finalizados (solo lectura)
    if (req.status === Status.FINALIZADO && activeRole !== UserRole.SUPERADMIN)
        throw new Error("El historial está bloqueado por cierre de expediente.");

    const updated = { ...req, lastUpdated: new Date().toISOString(), logs: [...req.logs, createAuditLog(msg)] };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const updateRequestDetails = async (id: string, title: string, detail: string) => {
    const localReq = requests.find(r => r.id === id);
    if (!localReq || localReq.isDeleted) return;
    const req = await db.getRequestById(id) || localReq;
    
    if (activeRole !== UserRole.ADMIN && activeRole !== UserRole.SUPERADMIN) 
        throw new Error("Privilegios insuficientes para editar metadatos.");
    
    if (req.status === Status.FINALIZADO && activeRole !== UserRole.SUPERADMIN)
        throw new Error("Registro inmutable: El expediente ya ha sido finalizado.");

    const updated = { 
        ...req, 
        title, 
        detail, 
        lastUpdated: new Date().toISOString(), 
        logs: [...req.logs, createAuditLog(`MODIFICACIÓN: Actualización de metadatos de cabecera.`)] 
    };
    await db.saveRequest(updated);
    setRequests(prev => prev.map(r => r.id === id ? updated : r));
  };

  const deleteRequest = useCallback(async (id: string) => {
    if (activeRole !== UserRole.SUPERADMIN) 
        throw new Error("Acción Crítica Denegada: Solo Auditoría Master puede archivar registros.");
        
    const actorName = currentUser?.name || 'Sistema';
    const now = new Date().toISOString();
    await db.deleteRequest(id, actorName);
    
    setRequests(prev => prev.map(r => r.id === id ? { 
        ...r, 
        isDeleted: true, 
        deletedAt: now, 
        deletedBy: actorName, 
        status: Status.FINALIZADO,
        logs: [...r.logs, createAuditLog(`AUDITORÍA: Registro movido al archivo inmutable.`)] 
    } : r));
    addNotification('WARNING', 'Expediente Archivado', `Registro enviado al archivo de auditoría.`);
  }, [addNotification, currentUser, createAuditLog, activeRole]);

  const hardDeleteAllRequests = async () => {
    if (activeRole !== UserRole.SUPERADMIN) {
        throw new Error("Solo el Administrador Maestro puede restablecer la base de datos.");
    }
    await db.hardDeleteAllRequests();
    setRequests([]);
    addNotification('WARNING', 'Requerimientos Eliminados', `La base de datos de requerimientos ha sido restablecida.`);
  };

  const addUser = async (name: string, email: string, role: UserRole, pass: string, area?: Area) => {
    if ((role === UserRole.HEAD || role === UserRole.ANALYST) && !area) {
        throw new Error("El área es obligatoria para Jefaturas y Analistas.");
    }
    const newUser: User = { id: genUUID(), name, email, role, area, password: pass, status: 'ACTIVE', joinedAt: new Date().toISOString() };
    await db.saveUser(newUser);
    await loadData();
    addNotification('SUCCESS', 'Nuevo Usuario', `Colaborador creado: ${name}`);
  };

  const updateUser = async (u: User) => {
    await db.saveUser(u);
    await loadData();
    addNotification('INFO', 'Perfil Actualizado', `Usuario ${u.name} modificado.`);
  };

  const deleteUser = async (id: string) => {
    if (activeRole !== UserRole.SUPERADMIN) {
        throw new Error("Solo el Administrador Maestro puede eliminar usuarios.");
    }
    if (id === currentUser?.id) {
        throw new Error("Acción denegada: No puede eliminar su propia cuenta estando en sesión.");
    }
    try {
        await db.deleteUser(id);
        await loadData();
        addNotification('WARNING', 'Usuario Eliminado', `El usuario ha sido eliminado del sistema.`);
    } catch (e: any) {
        throw e;
    }
  };

  return (
    <SisreqContext.Provider value={{
      currentUser, users, requests, notifications, notificationSettings, isAuthenticated, isLoading, initError, dbDiagnostic, activeRole, viewMode, globalFilterArea, selectedRequestId, organizationAreas,
      login, logout, setActiveRole, switchHybridRole, setViewMode, addUser, updateUser, deleteUser,
      addOrganizationArea, updateOrganizationArea, deleteOrganizationArea,
      setSelectedRequestId, setGlobalFilterArea, addRequest, updateStatus, returnRequest, assignAnalyst, addLog, updateRequestDetails, deleteRequest, hardDeleteAllRequests,
      addNotification, updateNotificationSettings, markNotificationAsRead, clearNotifications,
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
