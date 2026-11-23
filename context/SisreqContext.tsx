
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, RequestCard, Status, Priority, Area, UserRole, ViewMode, TransitionRule, LogEntry, Notification, NotificationType, NotificationSettings, ScheduledProcess } from '../types';

import { db, DbDiagnostic } from '../services/storage';
import { canReceiveAndDerive, canSupervise } from '../src/lib/auth';

interface SisreqContextType {
  currentUser: User | null;
  users: User[];
  requests: RequestCard[];
  scheduledProcesses: ScheduledProcess[];
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
  isSupervisorMode: boolean;
  bypassConnectionError: () => void;
  
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setActiveRole: (role: UserRole) => void;
  toggleSupervisorMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  addUser: (name: string, email: string, role: UserRole, password: string, area?: Area, areas?: Area[], canSupervise?: boolean, canReceiveAndDerive?: boolean) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  addOrganizationArea: (areaName: string) => Promise<void>;
  updateOrganizationArea: (oldName: string, newName: string) => Promise<void>;
  deleteOrganizationArea: (areaName: string) => Promise<void>;
  
  setSelectedRequestId: (id: string | null) => void;
  setGlobalFilterArea: (area: Area | 'ALL') => void;
  addRequest: (title: string, detail: string, area: Area, priority: Priority, requester: string, clientType?: 'FREQUENT' | 'ONE_OFF', paymentProportion?: 'ADVANCE' | 'FULL', paymentAmount?: number, totalAmount?: number) => Promise<void>;
  updateStatus: (id: string, newStatus: Status) => Promise<void>;
  returnRequest: (id: string, reason: string) => Promise<void>;
  assignAnalyst: (id: string, analystName: string) => Promise<void>;
  addLog: (id: string, message: string) => Promise<void>;
  updateRequestDetails: (id: string, title: string, detail: string, clientType?: 'FREQUENT' | 'ONE_OFF', paymentProportion?: 'ADVANCE' | 'FULL', paymentAmount?: number, totalAmount?: number, priority?: Priority, area?: Area) => Promise<void>;
  finalizeOneOffRequest: (id: string, totalAmount: number) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  hardDeleteAllRequests: () => Promise<void>;
  
  addProcess: (processData: Omit<ScheduledProcess, 'id' | 'status'>) => Promise<void>;
  updateProcess: (updatedProcess: ScheduledProcess) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;

  addNotification: (type: NotificationType, title: string, message: string, requestId?: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  canUserTransition: (request: RequestCard, targetStatus: Status) => { allowed: boolean; reason?: string };
  canUserSeeRequest: (request: RequestCard) => boolean;
  isActionable: (request: RequestCard) => boolean;
  ensureRequestLogs: (id: string) => Promise<void>;
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

const genDeterministicUUID = (seed: string): string => {
    let h1 = 0x811c9dc5;
    let h2 = 0xdeadbeef;
    let h3 = 0x1b873593;
    let h4 = 0x9e3779b9;
    for (let i = 0; i < seed.length; i++) {
        const ch = seed.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 0x01000193);
        h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b);
        h3 = Math.imul(h3 ^ (ch * 31), 0xc2b2ae35);
        h4 = Math.imul(h4 ^ (ch ^ 0xa5), 0x27d4eb2f);
    }
    const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
    const raw = hex(h1) + hex(h2) + hex(h3) + hex(h4);
    const variantNibble = ((parseInt(raw[16], 16) & 0x3) | 0x8).toString(16);
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-${variantNibble}${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
};

const getReqTimestamp = (r: RequestCard): number => Date.parse(r.lastUpdated || r.createdAt) || 0;
const sortRequestsDesc = (list: RequestCard[]): RequestCard[] =>
  [...list].sort((a, b) => getReqTimestamp(b) - getReqTimestamp(a));

const addPeriodClamped = (baseDate: Date, frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Date => {
  const result = new Date(baseDate);
  if (frequency === 'WEEKLY') {
    result.setDate(result.getDate() + 7);
    return result;
  }
  const originalDay = result.getDate();
  if (frequency === 'MONTHLY') {
    result.setDate(1);
    result.setMonth(result.getMonth() + 1);
  } else {
    result.setDate(1);
    result.setFullYear(result.getFullYear() + 1);
  }
  const maxDaysInTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, maxDaysInTargetMonth));
  return result;
};

type NotificationCategory = keyof Omit<NotificationSettings, 'enabled' | 'sounds'>;

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
  const [scheduledProcesses, setScheduledProcesss] = useState<ScheduledProcess[]>([]);
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
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
        const saved = localStorage.getItem('sisreq_view_mode');
        if (saved === 'work' || saved === 'superadmin' || saved === 'calculator' || saved === 'planner') {
            return saved;
        }
        return 'work';
    } catch (e) {
        return 'work';
    }
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
        localStorage.setItem('sisreq_view_mode', mode);
    } catch (e) {
        // ignorar
    }
  }, []);
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
  const [globalFilterArea, setGlobalFilterArea] = useState<Area | 'ALL'>('ALL');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isSupervisorMode, setIsSupervisorMode] = useState<boolean>(() => {
    try {
        const saved = localStorage.getItem('sisreq_session_supervisor');
        return saved ? JSON.parse(saved) : false;
    } catch (e) {
        return false;
    }
  });
  
  const [organizationAreas, setOrganizationAreas] = useState<string[]>([]);

  const usersRef = useRef(users);
  usersRef.current = users;
  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const scheduledProcessesRef = useRef(scheduledProcesses);
  scheduledProcessesRef.current = scheduledProcesses;
  const organizationAreasRef = useRef(organizationAreas);
  organizationAreasRef.current = organizationAreas;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const activeRoleRef = useRef(activeRole);
  activeRoleRef.current = activeRole;
  const notificationSettingsRef = useRef(notificationSettings);
  notificationSettingsRef.current = notificationSettings;
  const inFlightLoadRef = useRef<Promise<void> | null>(null);
  const lastLoadAtRef = useRef<number>(0);
  const hydratedLogIdsRef = useRef<Set<string>>(new Set());

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => {
        const updated = { ...prev, ...newSettings };
        notificationSettingsRef.current = updated;
        try {
            localStorage.setItem('sisreq_notification_settings', JSON.stringify(updated));
        } catch (e) {
            console.warn("No se pudo guardar la configuración en localStorage.");
        }
        return updated;
    });
  }, []);

  const addNotification = useCallback((type: NotificationType, title: string, message: string, requestId?: string, category?: NotificationCategory) => {
    const settings = notificationSettingsRef.current;
    if (!settings.enabled) return;
    if (category && settings[category] === false) return;

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

    if (settings.sounds) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.15;
        audio.play().catch(() => {});
    }
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveRole(null);
    setSelectedRequestId(null);
    setNotifications([]);
    setIsSupervisorMode(false);
    setViewModeState('work');
    setGlobalFilterArea('ALL');
    
    // Limpieza de sesión
    try {
        localStorage.removeItem('sisreq_session_user');
        localStorage.removeItem('sisreq_session_role');
        localStorage.removeItem('sisreq_session_supervisor');
        localStorage.removeItem('sisreq_view_mode');
    } catch (e) {
        console.warn("No se pudo limpiar la sesión de localStorage.");
    }
  }, []);

  const loadData = useCallback(async () => {
      if (inFlightLoadRef.current) return inFlightLoadRef.current;

      const task = (async () => {
          try {
              const [loadedUsers, loadedRequests, loadedAreas, loadedRoutines] = await Promise.all([
                db.getUsers(),
                db.getRequests(),
                db.getAreas(),
                db.getScheduledProcesses()
              ]);

              if (loadedUsers && loadedUsers.length > 0) {
                  setUsers(loadedUsers);
              }
              if (loadedAreas && loadedAreas.length > 0) {
                  setOrganizationAreas(loadedAreas);
              }

              const existingById = new Map<string, RequestCard>(requestsRef.current.map(r => [r.id, r]));
              const mergedLoadedRequests = (loadedRequests || []).map(r => {
                  const prev = existingById.get(r.id);
                  if (prev && hydratedLogIdsRef.current.has(r.id)) {
                      if (prev.lastUpdated === r.lastUpdated && Array.isArray(prev.logs) && prev.logs.length > 0) {
                          return { ...r, logs: prev.logs };
                      }
                      hydratedLogIdsRef.current.delete(r.id);
                  }
                  return r;
              });
              const existingRequestIds = new Set(mergedLoadedRequests.map(r => r.id));
              const sortedRequests = sortRequestsDesc(mergedLoadedRequests);
              let finalRequests = sortedRequests;
              let finalRoutines = loadedRoutines || [];
              let anyRoutineUpdated = false;

              if (loadedRoutines && loadedRoutines.length > 0) {
                  const userById = new Map<string, User>();
                  const headByArea = new Map<string, User>();
                  for (const u of loadedUsers) {
                      userById.set(u.id, u);
                      if (u.role === UserRole.HEAD && u.status !== 'INACTIVE') {
                          const uAreas = u.areas || (u.area ? [u.area] : []);
                          for (const a of uAreas) {
                              if (!headByArea.has(a)) headByArea.set(a, u);
                          }
                      }
                  }

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayMs = today.getTime();

                  const injectedRequests: RequestCard[] = [];
                  const updatedProcessesToSave: ScheduledProcess[] = [];

                  finalRoutines = loadedRoutines.map(process => {
                      if (process.status !== 'ACTIVE') return process;
                      let processUpdated = false;
                      const newAlerts = [...process.alerts];
                      const endDateMs = new Date(process.globalEndDate + 'T23:59:59').getTime();
                      const processHead = headByArea.get(process.area || '');

                      for (let i = 0; i < newAlerts.length; i++) {
                          const alert = newAlerts[i];
                          if (alert.status === 'WAITING' && !alert.linkedRequestId) {
                              const triggerDate = new Date(alert.triggerDate + 'T00:00:00');
                              if (todayMs >= triggerDate.getTime()) {
                                  const deterministicId = genDeterministicUUID(`${process.id}:${alert.id}:${alert.triggerDate}`);
                                  const alreadyInjected = existingRequestIds.has(deterministicId);
                                  const timestamp = new Date().toISOString();
                                  const assignedUser = alert.assignedToId ? userById.get(alert.assignedToId) : null;
                                  const isValidAssignee = !!assignedUser && assignedUser.status !== 'INACTIVE' && (!process.area || (assignedUser.areas?.includes(process.area) || assignedUser.area === process.area));

                                  if (!alreadyInjected) {
                                      const newReq: RequestCard = {
                                          id: deterministicId,
                                          title: `[Proceso: ${process.processName}] ${alert.title}`,
                                          detail: alert.description,
                                          requester: "Sistema",
                                          area: process.area || '',
                                          status: isValidAssignee ? Status.EJECUCION : (process.area ? Status.DERIVACION : Status.RECIBIDO),
                                          priority: Priority.HIGH,
                                          clientType: 'FREQUENT',
                                          assignedAnalystId: isValidAssignee ? assignedUser.id : null,
                                          assignedAnalyst: isValidAssignee ? assignedUser.name : null,
                                          responsibleHead: processHead?.name || (isValidAssignee ? 'Asignación Automática' : 'Pendiente de asignación'),
                                          responsibleHeadId: processHead?.id || null,
                                          logs: [
                                              {
                                                  id: genDeterministicUUID(`log:${deterministicId}`),
                                                  timestamp,
                                                  message: `GENERACIÓN AUTOMÁTICA: Proceso interno (${alert.triggerDate}). Urgencia: ALTO | Modalidad: CLIENTE | Solicitante: SISTEMA.${assignedUser && !isValidAssignee ? ' Nota: Analista preasignado inactivo o fuera de área; requiere reasignación.' : ''}`,
                                                  actor: 'Sistema',
                                                  role: UserRole.SUPERADMIN
                                              }
                                          ],
                                          createdAt: timestamp,
                                          lastUpdated: timestamp,
                                          sourceType: 'INTERNAL_PROCESS'
                                      };

                                      injectedRequests.push(newReq);
                                      existingRequestIds.add(deterministicId);
                                      hydratedLogIdsRef.current.add(deterministicId);
                                  }

                                  if (alert.frequency && alert.frequency !== 'ONCE') {
                                      const nextDate = addPeriodClamped(triggerDate, alert.frequency);

                                      const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
                                      if (nextDate.getTime() <= endDateMs) {
                                          newAlerts[i] = {
                                              ...alert,
                                              triggerDate: nextDateStr,
                                              status: 'WAITING',
                                              linkedRequestId: null
                                          };
                                        } else {
                                            newAlerts[i] = {
                                                ...alert,
                                                status: 'TRIGGERED',
                                                linkedRequestId: deterministicId
                                            };
                                        }
                                    } else {
                                        newAlerts[i] = {
                                            ...alert,
                                            status: 'TRIGGERED',
                                            linkedRequestId: deterministicId
                                        };
                                    }
                                    processUpdated = true;
                                }
                            }
                        }

                        const allTriggered = newAlerts.every(a => a.status === 'TRIGGERED');
                        let shouldArchive = false;
                        if (allTriggered && todayMs > endDateMs) {
                            shouldArchive = true;
                            processUpdated = true;
                        }

                        if (processUpdated) {
                            anyRoutineUpdated = true;
                            const updatedProcess: ScheduledProcess = {
                                ...process,
                                status: shouldArchive ? 'ARCHIVED' : process.status,
                                alerts: newAlerts
                            };
                            updatedProcessesToSave.push(updatedProcess);
                            return updatedProcess;
                        }
                        return process;
                    });

                    if (injectedRequests.length > 0 || updatedProcessesToSave.length > 0) {
                        await Promise.all([
                            ...injectedRequests.map(req => db.insertRequestIfAbsent(req)),
                            ...updatedProcessesToSave.map(proc => db.saveScheduledProcess(proc))
                        ]);
                        if (injectedRequests.length > 0) {
                            finalRequests = sortRequestsDesc([...injectedRequests, ...sortedRequests]);
                        }
                    }
                }

              if (loadedRequests && (loadedRequests.length >= 0 || anyRoutineUpdated)) {
                  setRequests(finalRequests);
              }
              setScheduledProcesss(finalRoutines);
              lastLoadAtRef.current = Date.now();
          } catch (e) {
              console.warn("Aviso al sincronizar datos:", e);
          } finally {
              inFlightLoadRef.current = null;
          }
      })();

      inFlightLoadRef.current = task;
      return task;
  }, []);

  const addOrganizationArea = useCallback(async (areaName: string) => {
      const normalized = areaName.trim();
      if (!normalized) {
          throw new Error('El nombre de la unidad orgánica no puede estar vacío.');
      }
      if (organizationAreasRef.current.some(a => a.trim().toLowerCase() === normalized.toLowerCase())) {
          throw new Error(`La unidad "${normalized}" ya se encuentra registrada.`);
      }
      await db.addArea(normalized);
      await loadData();
      addNotification('SUCCESS', 'Área Creada', `El área ${normalized} fue registrada en la organización.`);
  }, [loadData, addNotification]);

  const updateOrganizationArea = useCallback(async (oldName: string, newName: string) => {
      const normalizedNew = newName.trim();
      if (!normalizedNew) {
          throw new Error('El nuevo nombre del área no puede estar vacío.');
      }
      if (oldName !== normalizedNew && organizationAreasRef.current.some(a => a !== oldName && a.trim().toLowerCase() === normalizedNew.toLowerCase())) {
          throw new Error(`Ya existe una unidad registrada con el nombre "${normalizedNew}".`);
      }

      const userSaves = usersRef.current.reduce<Promise<void>[]>((acc, user) => {
          let updated = false;
          const updatedUser = { ...user };
          if (user.area) {
              const strAreas = user.area.split(',').map(a => a.trim());
              if (strAreas.includes(oldName)) {
                  updatedUser.area = strAreas.map(a => a === oldName ? normalizedNew : a).join(', ');
                  updated = true;
              }
          }
          if (user.areas && user.areas.includes(oldName)) {
              updatedUser.areas = user.areas.map(a => a === oldName ? normalizedNew : a);
              updated = true;
          }
          if (updated) acc.push(db.saveUser(updatedUser));
          return acc;
      }, []);

      const processSaves = scheduledProcessesRef.current
          .filter(p => p.area === oldName)
          .map(p => db.saveScheduledProcess({ ...p, area: normalizedNew }));

      await Promise.all([
          db.updateArea(oldName, normalizedNew),
          db.renameAreaInRequests(oldName, normalizedNew),
          ...userSaves,
          ...processSaves
      ]);

      if (globalFilterArea === oldName) {
          setGlobalFilterArea(normalizedNew);
      }

      await loadData();
      addNotification('INFO', 'Área Actualizada', `El área ${oldName} ahora es ${normalizedNew}.`);
  }, [globalFilterArea, loadData, addNotification]);

  const deleteOrganizationArea = useCallback(async (areaName: string) => {
      const anyRequests = requestsRef.current.some(r => r.area === areaName);
      const anyProcesses = scheduledProcessesRef.current.some(p => p.area === areaName);
      
      if (anyRequests || anyProcesses) {
          throw new Error(`No se puede eliminar el área "${areaName}" porque tiene expedientes históricos o procesos planificados asociados.`);
      }

      const userSaves = usersRef.current.reduce<Promise<void>[]>((acc, user) => {
          let updated = false;
          const updatedUser = { ...user };
          if (user.area) {
              const strAreas = user.area.split(',').map(a => a.trim());
              if (strAreas.includes(areaName)) {
                  updatedUser.area = strAreas.filter(a => a !== areaName).join(', ');
                  updated = true;
              }
          }
          if (user.areas && user.areas.includes(areaName)) {
              updatedUser.areas = user.areas.filter(a => a !== areaName);
              updated = true;
          }
          if (updated) acc.push(db.saveUser(updatedUser));
          return acc;
      }, []);

      await Promise.all([db.deleteArea(areaName), ...userSaves]);

      if (globalFilterArea === areaName) {
          setGlobalFilterArea('ALL');
      }

      await loadData();
      addNotification('WARNING', 'Área Eliminada', `El área ${areaName} fue eliminada de la organización.`);
  }, [globalFilterArea, loadData, addNotification]);

  useEffect(() => {
    const activeUser = currentUserRef.current;
    if (activeUser && users.length > 0) {
        const updated = users.find(u => u.id === activeUser.id);
        if (!updated || updated.status === 'INACTIVE') {
            logout();
        } else {
            const hasChanged = updated.name !== activeUser.name || 
                updated.role !== activeUser.role || 
                updated.area !== activeUser.area || 
                JSON.stringify(updated.areas) !== JSON.stringify(activeUser.areas) ||
                updated.canReceiveAndDerive !== activeUser.canReceiveAndDerive ||
                updated.canSupervise !== activeUser.canSupervise;
            if (hasChanged) {
                setCurrentUser(updated);
                try {
                    localStorage.setItem('sisreq_session_user', JSON.stringify(updated));
                } catch (e) {}
            }
        }
    }
  }, [users, logout]);

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
    if (dbDiagnostic?.status !== 'READY' || !isAuthenticated) return;
    
    // Sincronización en tiempo real vía Supabase (Actualización Incremental O(1))
    const unsubscribe = db.subscribeToRequests((payload) => {
        const actorName = currentUserRef.current?.name;
        if (payload.eventType === 'INSERT') {
            const newReq = { ...payload.new } as RequestCard;
            if (typeof newReq.logs === 'string') {
                try {
                    newReq.logs = JSON.parse(newReq.logs);
                } catch (e) {
                    newReq.logs = [];
                }
            }

            const lastLog = Array.isArray(newReq.logs) ? newReq.logs[newReq.logs.length - 1] : undefined;
            if (lastLog && lastLog.actor !== actorName) {
                addNotification('INFO', 'Nuevo Ingreso', `Registrado por ${lastLog.actor}: ${newReq.title}`, newReq.id, 'newRequests');
            }

            setRequests(prev => {
                if (prev.some(r => r.id === payload.new.id)) return prev;
                return sortRequestsDesc([newReq, ...prev]);
            });
        } else if (payload.eventType === 'UPDATE') {
            const updatedReq = { ...payload.new } as RequestCard;
            if (typeof updatedReq.logs === 'string') {
                try {
                    updatedReq.logs = JSON.parse(updatedReq.logs);
                } catch (e) {
                    updatedReq.logs = [];
                }
            }

            const oldReq = requestsRef.current.find(r => r.id === updatedReq.id);
            const lastLog = Array.isArray(updatedReq.logs) ? updatedReq.logs[updatedReq.logs.length - 1] : undefined;
            
            if (lastLog && lastLog.actor !== actorName) {
                if (oldReq && oldReq.status !== updatedReq.status) {
                    addNotification('PROCESS', 'Fase Actualizada', `${lastLog.actor} movió el expediente a ${updatedReq.status}`, updatedReq.id, updatedReq.isReturned ? 'returns' : 'statusChanges');
                } else if (oldReq && oldReq.assignedAnalyst !== updatedReq.assignedAnalyst && updatedReq.assignedAnalyst) {
                    addNotification('SUCCESS', 'Asignación Técnica', `${lastLog.actor} designó a ${updatedReq.assignedAnalyst}`, updatedReq.id, 'assignments');
                }
            }

            setRequests(prev => sortRequestsDesc(prev.map(r => r.id === payload.new.id ? updatedReq : r)));
        } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
    });

    // Polling de respaldo consciente de visibilidad (cada 60s solo si la pestaña está activa)
    const interval = setInterval(() => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
            loadData();
        }
    }, 60000);

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && Date.now() - lastLoadAtRef.current > 30000) {
            loadData();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        unsubscribe();
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dbDiagnostic, isAuthenticated, loadData, addNotification]);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    try {
        const user = await db.validateUser(email, pass);
        if (user) {
            if (user.status === 'INACTIVE') {
                throw new Error('Cuenta desactivada. Contacte al Administrador.');
            }
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

            setViewMode('work');
            setGlobalFilterArea('ALL');
            addNotification('INFO', 'Acceso Concedido', `Bienvenido(a), ${user.name}. Modo ${user.role} activo.`);
            return true;
        }
        return false;
    } catch (e: any) {
        if (e?.message?.includes('desactivada')) {
            throw e;
        }
        console.error("Login Error:", e);
        return false;
    }
  }, [setViewMode, addNotification]);

  const toggleSupervisorMode = useCallback(() => {
    const activeUser = currentUserRef.current;
    if (!canSupervise(activeUser || undefined) || !activeUser) return;
    setIsSupervisorMode(prev => {
        const newMode = !prev;
        try {
            localStorage.setItem('sisreq_session_supervisor', JSON.stringify(newMode));
        } catch (e) {
            console.warn("No se pudo persistir modo supervisor");
        }
        setGlobalFilterArea('ALL');
        addNotification('PROCESS', 'Modo Supervisor', newMode ? 'Modo supervisor activado. Vista global habilitada.' : `Vista retornada a la unidad ${activeUser.areas?.join(', ') || activeUser.area}.`);
        return newMode;
    });
  }, [addNotification]);

  const createAuditLog = useCallback((message: string): LogEntry => ({
    id: genUUID(),
    timestamp: new Date().toISOString(),
    message: message.toUpperCase(),
    actor: currentUser?.name || 'Sistema',
    role: activeRole || UserRole.ANALYST
  }), [currentUser, activeRole]);

  const checkEditJurisdiction = useCallback((req: RequestCard): boolean => {
    if (activeRole === UserRole.SUPERADMIN || activeRole === UserRole.ADMIN) return true;
    if (isSupervisorMode) return true;
    if (canReceiveAndDerive(currentUser || undefined) && (req.status === Status.RECIBIDO || req.status === Status.DERIVACION)) return true;
    const userAreas = currentUser?.areas || (currentUser?.area ? [currentUser.area] : []);
    return userAreas.includes(req.area);
  }, [activeRole, currentUser, isSupervisorMode]);

  const canUserSeeRequest = useCallback((req: RequestCard): boolean => {
    if (!currentUser || !activeRole) return false;
    if (req.isDeleted && activeRole !== UserRole.SUPERADMIN) return false; 
    if (activeRole === UserRole.SUPERADMIN || activeRole === UserRole.ADMIN) return true;
    
    if (isSupervisorMode) return true;
    if (canReceiveAndDerive(currentUser) && (req.status === Status.RECIBIDO || req.status === Status.DERIVACION)) return true;

    const userAreas = currentUser.areas || (currentUser.area ? [currentUser.area] : []);
    const isSameArea = userAreas.includes(req.area);
    const isOutOfCentral = req.status !== Status.RECIBIDO;
    return isSameArea && isOutOfCentral;
  }, [currentUser, activeRole, isSupervisorMode]);

  const canUserTransition = useCallback((req: RequestCard, target: Status): { allowed: boolean; reason?: string } => {
    if (!currentUser || !activeRole) return { allowed: false, reason: 'Sesión inactiva.' };
    if (req.isDeleted) return { allowed: false, reason: 'Expediente archivado e inmutable.' };
    
    if (req.status === Status.FINALIZADO && activeRole !== UserRole.SUPERADMIN && target !== Status.FINALIZADO) {
        return { allowed: false, reason: 'Solo Auditoría Master puede reabrir registros finalizados.' };
    }

    const rule = WORKFLOW_MATRIX.find(r => r.from === req.status && r.to === target);
    if (!rule) return { allowed: false, reason: 'Flujo operativo no permitido.' };
    
    const isCentralReceiverOrSupervisor = (canReceiveAndDerive(currentUser) || isSupervisorMode) && (req.status === Status.RECIBIDO || req.status === Status.DERIVACION);
    const hasRoleAccess = rule.allowedRoles.includes(activeRole) || (isCentralReceiverOrSupervisor && (rule.allowedRoles.includes(UserRole.ADMIN) || rule.allowedRoles.includes(UserRole.HEAD)));
    
    if (!hasRoleAccess) return { allowed: false, reason: 'Nivel de privilegios insuficiente.' };
    
    if (rule.checkAreaJurisdiction && ![UserRole.SUPERADMIN, UserRole.ADMIN].includes(activeRole) && !isCentralReceiverOrSupervisor && !isSupervisorMode) {
        const userAreas = currentUser.areas || (currentUser.area ? [currentUser.area] : []);
        if (!userAreas.includes(req.area)) return { allowed: false, reason: 'El expediente no pertenece a su unidad orgánica.' };
    }
    
    if (rule.requiresAnalyst && !req.assignedAnalyst && !req.assignedAnalystId) return { allowed: false, reason: 'Debe designar un Responsable Técnico antes de la ejecución.' };
    
    if (target === Status.FINALIZADO && activeRole === UserRole.ANALYST) {
        const isAssigned = (req.assignedAnalyst && req.assignedAnalyst === currentUser.name) ||
                           (req.assignedAnalystId && req.assignedAnalystId === currentUser.id);
        if (!isAssigned) {
            return { allowed: false, reason: 'Solo el analista técnico asignado a este expediente puede darlo por finalizado.' };
        }
    }
    
    return { allowed: true };
  }, [currentUser, activeRole]);

  const isActionable = useCallback((req: RequestCard): boolean => {
    if (!activeRole || req.isDeleted) return false;
    if (req.status === Status.FINALIZADO && activeRole !== UserRole.SUPERADMIN) return false;
    return Object.values(Status).some(s => s !== req.status && canUserTransition(req, s).allowed);
  }, [activeRole, canUserTransition]);

  const findAreaHead = useCallback((area: Area, preferUser?: User | null): User | undefined => {
    if (preferUser && preferUser.role === UserRole.HEAD && preferUser.status !== 'INACTIVE') {
      const preferAreas = preferUser.areas || (preferUser.area ? [preferUser.area] : []);
      if (preferAreas.includes(area)) return preferUser;
    }
    return usersRef.current.find(u =>
      u.role === UserRole.HEAD &&
      u.status !== 'INACTIVE' &&
      (u.areas?.includes(area) || u.area === area)
    );
  }, []);

  const addRequest = useCallback(async (title: string, detail: string, area: Area, priority: Priority, requester: string, clientType?: 'FREQUENT' | 'ONE_OFF', paymentProportion?: 'ADVANCE' | 'FULL', paymentAmount?: number, totalAmount?: number) => {
    const role = activeRoleRef.current;
    const actor = currentUserRef.current;
    if (!actor || !role || role === UserRole.ANALYST) {
        throw new Error("Privilegios insuficientes para registrar nuevos requerimientos.");
    }
    if (!title.trim() || !detail.trim() || !requester.trim() || !area.trim()) {
        throw new Error("Todos los campos obligatorios deben estar completos.");
    }
    if (role === UserRole.HEAD && !canReceiveAndDerive(actor)) {
        const actorAreas = actor.areas || (actor.area ? [actor.area] : []);
        if (!actorAreas.includes(area)) {
            throw new Error("Como Jefatura de Área, solo puede registrar requerimientos dentro de su unidad orgánica.");
        }
    }

    const now = new Date().toISOString();
    const initialStatus = (role === UserRole.ADMIN || role === UserRole.SUPERADMIN || canReceiveAndDerive(actor)) ? Status.RECIBIDO : Status.DERIVACION;
    
    const resolvedHead = initialStatus === Status.DERIVACION ? findAreaHead(area, actor) : undefined;
    const responsibleHead = resolvedHead ? resolvedHead.name : 'Pendiente de asignación';
    const responsibleHeadId = resolvedHead ? resolvedHead.id : null;

    const isOneOff = clientType === 'ONE_OFF';
    if (isOneOff && (!totalAmount || isNaN(totalAmount) || totalAmount <= 0)) {
        throw new Error("Control Financiero: El monto total es obligatorio para registros Únicos.");
    }
    const finalPaymentProportion = isOneOff ? (paymentProportion || 'ADVANCE') : undefined;
    const finalTotalAmount = isOneOff ? totalAmount : undefined;
    let finalPaymentAmount: number | undefined;
    if (isOneOff) {
        if (finalPaymentProportion === 'FULL') {
            finalPaymentAmount = finalTotalAmount;
        } else {
            if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
                throw new Error("Control Financiero: Debe ingresar un monto de anticipo válido.");
            }
            if (finalTotalAmount && paymentAmount >= finalTotalAmount) {
                throw new Error("Control Financiero: El monto del anticipo debe ser menor al monto total del servicio.");
            }
            finalPaymentAmount = paymentAmount;
        }
    }

    const finalClientType: 'FREQUENT' | 'ONE_OFF' = isOneOff ? 'ONE_OFF' : 'FREQUENT';

    const newReq: RequestCard = {
      id: genUUID(),
      title: title.trim(), detail: detail.trim(), area, status: initialStatus, priority, requester: requester.trim(),
      responsibleHead,
      responsibleHeadId,
      clientType: finalClientType,
      paymentProportion: finalPaymentProportion,
      paymentAmount: finalPaymentAmount,
      totalAmount: finalTotalAmount,
      createdAt: now, lastUpdated: now,
      logs: [createAuditLog(`APERTURA: Registro inicializado en fase ${initialStatus} (Modalidad: ${isOneOff ? 'Único' : 'Recurrente'})`)]
    };
    
    setRequests(prev => [newReq, ...prev]);
    addNotification('SUCCESS', 'Nuevo Expediente', `Ticket registrado: ${newReq.title}`, newReq.id, 'newRequests');

    try {
        await db.saveRequest(newReq);
    } catch (error) {
        console.error("Error al persistir nuevo ticket Único:", error);
        addNotification('WARNING', 'Error de Persistencia', 'El ticket no pudo guardarse en el servidor.');
    }
  }, [createAuditLog, addNotification, findAreaHead]);

  const updateStatus = useCallback(async (id: string, newStatus: Status) => {
    const localReq = requestsRef.current.find(r => r.id === id);
    if (!localReq) return;
    
    const check = canUserTransition(localReq, newStatus);
    if (!check.allowed) throw new Error(check.reason);

    if (newStatus === Status.FINALIZADO && localReq.clientType === 'ONE_OFF' && localReq.paymentProportion !== 'FULL') {
        throw new Error('Control Comercial: Confirme la recepción del pago total desde el detalle del expediente antes de finalizar.');
    }
    
    const now = new Date().toISOString();
    const isReopening = localReq.status === Status.FINALIZADO && newStatus === Status.RECIBIDO;
    const finishedAt = newStatus === Status.FINALIZADO ? now : (newStatus === Status.RECIBIDO ? null : localReq.finishedAt);
    const isReturned = isReopening ? false : (newStatus !== Status.RECIBIDO ? false : localReq.isReturned);
    
    const logMessage = isReopening 
        ? 'REAPERTURA: Expediente reabierto por Auditoría Master y enviado a Bandeja Central'
        : `TRANSICIÓN: Cambio de fase operativa a ${newStatus}`;
    const newLog = createAuditLog(logMessage);
    
    const assignedAnalyst = newStatus === Status.RECIBIDO ? null : localReq.assignedAnalyst;
    const assignedAnalystId = newStatus === Status.RECIBIDO ? null : localReq.assignedAnalystId;
    let responsibleHead = newStatus === Status.RECIBIDO ? 'Pendiente de asignación' : localReq.responsibleHead;
    let responsibleHeadId = newStatus === Status.RECIBIDO ? null : localReq.responsibleHeadId;

    if (newStatus === Status.DERIVACION && (!responsibleHeadId || responsibleHead === 'Pendiente de asignación')) {
        const areaHead = findAreaHead(localReq.area, currentUserRef.current);
        if (areaHead) {
            responsibleHead = areaHead.name;
            responsibleHeadId = areaHead.id;
        }
    }

    const updatedLocal = { 
        ...localReq, 
        status: newStatus, 
        isReturned,
        assignedAnalyst,
        assignedAnalystId,
        responsibleHead,
        responsibleHeadId,
        lastUpdated: now, 
        finishedAt: finishedAt, 
        logs: [...(localReq.logs || []), newLog] 
    };
    setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? updatedLocal : r)));
    addNotification('PROCESS', isReopening ? 'Expediente Reabierto' : 'Fase Actualizada', `Expediente en ${newStatus}`, id, 'statusChanges');

    try {
        const synced = await db.updateRequestWithMergedLogs(id, {
            status: newStatus,
            isReturned,
            assignedAnalyst,
            assignedAnalystId,
            responsibleHead,
            responsibleHeadId,
            lastUpdated: now,
            finishedAt: finishedAt
        }, [newLog]);
        hydratedLogIdsRef.current.add(id);
        setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? synced : r)));
    } catch (e) {
        console.error("DB Sync Error al actualizar estado:", e);
        addNotification('WARNING', 'Error de Persistencia', 'No se pudo sincronizar el cambio de estado con el servidor.', id);
    }
  }, [canUserTransition, createAuditLog, addNotification, findAreaHead]);

  const returnRequest = useCallback(async (id: string, reason: string) => {
    const cleanReason = reason?.trim();
    if (!cleanReason) {
        throw new Error('Debe especificar una justificación técnica para el retorno.');
    }
    const localReq = requestsRef.current.find(r => r.id === id);
    if (!localReq) return;
    
    const check = canUserTransition(localReq, Status.RECIBIDO);
    if (!check.allowed) throw new Error(check.reason);
    
    const now = new Date().toISOString();
    const newLog = createAuditLog(`DEVOLUCIÓN: Retornado a Central. Motivo: ${cleanReason}`);
    
    const updatedLocal = { 
        ...localReq, 
        status: Status.RECIBIDO, 
        isReturned: true, 
        assignedAnalyst: null, 
        assignedAnalystId: null,
        responsibleHead: 'Pendiente de asignación',
        responsibleHeadId: null,
        lastUpdated: now, 
        finishedAt: null, 
        logs: [...(localReq.logs || []), newLog] 
    };
    setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? updatedLocal : r)));
    addNotification('WARNING', 'Devolución Técnica', `Ticket retornado: ${cleanReason}`, id, 'returns');

    try {
        const synced = await db.updateRequestWithMergedLogs(id, {
            status: Status.RECIBIDO,
            isReturned: true,
            assignedAnalyst: null,
            assignedAnalystId: null,
            responsibleHead: 'Pendiente de asignación',
            responsibleHeadId: null,
            lastUpdated: now,
            finishedAt: null
        }, [newLog]);
        hydratedLogIdsRef.current.add(id);
        setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? synced : r)));
    } catch (e) {
        console.error("DB Sync Error al retornar expediente:", e);
        addNotification('WARNING', 'Error de Persistencia', 'No se pudo sincronizar la devolución con el servidor.', id);
    }
  }, [canUserTransition, createAuditLog, addNotification]);

  const assignAnalyst = useCallback(async (id: string, name: string) => {
    const role = activeRoleRef.current;
    const actor = currentUserRef.current;
    if (role !== UserRole.HEAD && role !== UserRole.ADMIN && role !== UserRole.SUPERADMIN) {
        throw new Error("Privilegios insuficientes para asignar personal.");
    }
    const localReq = requestsRef.current.find(r => r.id === id);
    if (!localReq || localReq.isDeleted) return;
    
    if (!checkEditJurisdiction(localReq)) {
        throw new Error("No tiene jurisdicción para editar este expediente.");
    }
    if (localReq.status !== Status.DERIVACION && localReq.status !== Status.EJECUCION) 
        throw new Error("Acción denegada: El expediente debe estar en fase de DERIVACIÓN o EJECUCIÓN.");
        
    const now = new Date().toISOString();
    const targetAnalyst = usersRef.current.find(u => u.name === name);
    if (!targetAnalyst) {
        throw new Error(`El colaborador "${name}" no existe en el directorio.`);
    }
    if (targetAnalyst.status === 'INACTIVE') {
        throw new Error(`El colaborador "${name}" se encuentra inactivo y no puede ser asignado.`);
    }
    const targetAreas = targetAnalyst.areas || (targetAnalyst.area ? [targetAnalyst.area] : []);
    if (!targetAreas.includes(localReq.area)) {
        throw new Error(`"${name}" no pertenece al área ${localReq.area}.`);
    }
    
    let finalResponsibleHead = localReq.responsibleHead;
    let finalResponsibleHeadId = localReq.responsibleHeadId;

    if (role === UserRole.HEAD && actor) {
        finalResponsibleHead = actor.name;
        finalResponsibleHeadId = actor.id;
    } else if ((role === UserRole.ADMIN || role === UserRole.SUPERADMIN) && (localReq.responsibleHead === 'Pendiente de asignación' || !localReq.responsibleHeadId)) {
        const areaHead = findAreaHead(localReq.area, actor);
        if (areaHead) {
            finalResponsibleHead = areaHead.name;
            finalResponsibleHeadId = areaHead.id;
        } else if (actor) {
            finalResponsibleHead = actor.name;
            finalResponsibleHeadId = actor.id;
        }
    }

    const logAction = localReq.assignedAnalyst ? 'REASIGNACIÓN' : 'DESIGNACIÓN';
    const newLog = createAuditLog(`${logAction}: Responsable Técnico asignado: ${name}`);
    
    const updatedLocal = { 
        ...localReq, 
        assignedAnalyst: name, 
        assignedAnalystId: targetAnalyst.id,
        responsibleHead: finalResponsibleHead,
        responsibleHeadId: finalResponsibleHeadId,
        status: Status.EJECUCION, 
        lastUpdated: now, 
        logs: [...(localReq.logs || []), newLog] 
    };
    setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? updatedLocal : r)));
    addNotification('SUCCESS', 'Personal Designado', `${name} asume la responsabilidad del ticket.`, id, 'assignments');

    try {
        const synced = await db.updateRequestWithMergedLogs(id, {
            assignedAnalyst: name,
            assignedAnalystId: targetAnalyst.id,
            responsibleHead: finalResponsibleHead,
            responsibleHeadId: finalResponsibleHeadId,
            status: Status.EJECUCION,
            lastUpdated: now
        }, [newLog]);
        hydratedLogIdsRef.current.add(id);
        setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? synced : r)));
    } catch (e) {
        console.error("DB Sync Error al designar analista:", e);
        addNotification('WARNING', 'Error de Persistencia', 'No se pudo sincronizar la asignación con el servidor.', id);
    }
  }, [checkEditJurisdiction, createAuditLog, addNotification, findAreaHead]);

  const addLog = useCallback(async (id: string, msg: string) => {
    const localReq = requestsRef.current.find(r => r.id === id);
    if (!localReq || localReq.isDeleted) return;
    
    if (!checkEditJurisdiction(localReq)) {
        throw new Error("No tiene jurisdicción para comentar en este expediente.");
    }
    if (localReq.status === Status.FINALIZADO && activeRoleRef.current !== UserRole.SUPERADMIN)
        throw new Error("El historial está bloqueado por cierre de expediente.");

    const now = new Date().toISOString();
    const newLog = createAuditLog(msg);
    
    const updatedLocal = { ...localReq, lastUpdated: now, logs: [...(localReq.logs || []), newLog] };
    setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? updatedLocal : r)));

    try {
        const synced = await db.appendRequestLog(id, newLog);
        if (synced) {
            hydratedLogIdsRef.current.add(id);
            setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? synced : r)));
        }
    } catch (e) {
        console.error("DB Sync Error al agregar comentario:", e);
        addNotification('WARNING', 'Error de Persistencia', 'No se pudo guardar la nota en el servidor.', id);
    }
  }, [checkEditJurisdiction, createAuditLog, addNotification]);

  const updateRequestDetails = useCallback(async (id: string, title: string, detail: string, clientType?: 'FREQUENT' | 'ONE_OFF', paymentProportion?: 'ADVANCE' | 'FULL', paymentAmount?: number, totalAmount?: number, priority?: Priority, area?: Area) => {
    const localReq = requestsRef.current.find(r => r.id === id);
    if (!localReq || localReq.isDeleted) return;
    
    const role = activeRoleRef.current;
    const isCentralReceiver = canReceiveAndDerive(currentUserRef.current || undefined) && localReq.status === Status.RECIBIDO;
    if (role !== UserRole.ADMIN && role !== UserRole.SUPERADMIN && role !== UserRole.HEAD && !isCentralReceiver) 
        throw new Error("Privilegios insuficientes para editar metadatos. Solo Administradores, Jefaturas y Receptores Centrales pueden modificar la solicitud.");

    if (role === UserRole.HEAD && !isCentralReceiver && !checkEditJurisdiction(localReq)) {
        throw new Error("No tiene jurisdicción para editar expedientes fuera de su unidad orgánica.");
    }
    
    if (localReq.status === Status.FINALIZADO && role !== UserRole.SUPERADMIN)
        throw new Error("Registro inmutable: El expediente ya ha sido finalizado.");

    const logs: string[] = [];
    if (priority && priority !== localReq.priority) {
        logs.push(`ESCALAMIENTO: Prioridad actualizada de ${localReq.priority} a ${priority}`);
    }
    if (title !== localReq.title) logs.push(`EDICIÓN: Título actualizado`);
    if (detail !== localReq.detail) logs.push(`EDICIÓN: Alcance técnico modificado`);
    
    let nextStatus = localReq.status;
    let nextAssignedAnalyst = localReq.assignedAnalyst;
    let nextAssignedAnalystId = localReq.assignedAnalystId;
    let nextResponsibleHead = localReq.responsibleHead;
    let nextResponsibleHeadId = localReq.responsibleHeadId;

    if (area && area !== localReq.area) {
        const canChangeArea = role === UserRole.ADMIN || role === UserRole.SUPERADMIN || isCentralReceiver;
        if (!canChangeArea) {
            throw new Error("No tiene permisos para reasignar la unidad orgánica de este expediente.");
        }
        logs.push(`REASIGNACIÓN DE ÁREA: Unidad orgánica cambiada de ${localReq.area} a ${area}`);

        if (localReq.status !== Status.RECIBIDO) {
            if (localReq.assignedAnalyst || localReq.assignedAnalystId) {
                logs.push(`SANEAMIENTO: Analista previo desvinculado por cambio de área; requiere nueva asignación en ${area}`);
            }
            nextAssignedAnalyst = null;
            nextAssignedAnalystId = null;
            if (localReq.status === Status.EJECUCION) {
                nextStatus = Status.DERIVACION;
            }
            const newHead = findAreaHead(area);
            nextResponsibleHead = newHead ? newHead.name : 'Pendiente de asignación';
            nextResponsibleHeadId = newHead ? newHead.id : null;
        }
    }

    const isOneOff = (clientType !== undefined ? clientType : localReq.clientType) === 'ONE_OFF';
    if (isOneOff && (!totalAmount || isNaN(totalAmount) || totalAmount <= 0)) {
        throw new Error("Control Financiero: El monto total es obligatorio para registros Únicos.");
    }

    const finalClientType: 'FREQUENT' | 'ONE_OFF' = isOneOff ? 'ONE_OFF' : 'FREQUENT';
    const finalPaymentProportion = isOneOff ? (paymentProportion || (localReq.paymentProportion as any) || 'ADVANCE') : undefined;
    const finalTotalAmount = isOneOff && (totalAmount !== undefined && totalAmount !== null && !isNaN(totalAmount) && totalAmount > 0) ? totalAmount : undefined;
    let finalPaymentAmount: number | undefined;
    if (isOneOff) {
        if (finalPaymentProportion === 'FULL') {
            finalPaymentAmount = finalTotalAmount;
        } else {
            if (paymentAmount === undefined || paymentAmount === null || isNaN(paymentAmount) || paymentAmount <= 0) {
                throw new Error("Control Financiero: Debe ingresar un monto de anticipo válido.");
            }
            if (finalTotalAmount && paymentAmount >= finalTotalAmount) {
                throw new Error("Control Financiero: El monto del anticipo debe ser menor al monto total del servicio.");
            }
            finalPaymentAmount = paymentAmount;
        }
    }

    const now = new Date().toISOString();
    const logMessages = logs.length > 0 ? logs : [`MODIFICACIÓN: Actualización de metadatos del expediente (Modalidad: ${isOneOff ? 'Único' : 'Recurrente'}).`];
    const newLogs = logMessages.map(msg => createAuditLog(msg));

    const patch: Partial<RequestCard> = {
        title,
        detail,
        area: area || localReq.area,
        status: nextStatus,
        assignedAnalyst: nextAssignedAnalyst,
        assignedAnalystId: nextAssignedAnalystId,
        responsibleHead: nextResponsibleHead,
        responsibleHeadId: nextResponsibleHeadId,
        priority: priority || localReq.priority,
        clientType: finalClientType,
        paymentProportion: finalPaymentProportion as any,
        paymentAmount: finalPaymentAmount,
        totalAmount: finalTotalAmount,
        lastUpdated: now
    };

    const updatedLocal: RequestCard = {
        ...localReq,
        ...patch,
        logs: [...(localReq.logs || []), ...newLogs]
    };
    setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? updatedLocal : r)));

    try {
        const synced = await db.updateRequestWithMergedLogs(id, patch, newLogs);
        hydratedLogIdsRef.current.add(id);
        setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? synced : r)));
    } catch (e) {
        console.error("DB Sync Error al actualizar detalles:", e);
        addNotification('WARNING', 'Error de Persistencia', 'No se pudieron sincronizar las modificaciones con el servidor.', id);
    }
  }, [checkEditJurisdiction, createAuditLog, addNotification, findAreaHead]);

  const deleteRequest = useCallback(async (id: string) => {
    const req = requestsRef.current.find(r => r.id === id);
    if (!req) throw new Error("Expediente no encontrado.");
    if (req.isDeleted) throw new Error("El expediente ya se encuentra en el archivo de auditoría.");

    const canDelete = activeRoleRef.current === UserRole.SUPERADMIN || 
                      (canReceiveAndDerive(currentUserRef.current) && req.status === Status.RECIBIDO);

    if (!canDelete) 
        throw new Error("Acción Denegada: No tiene permisos para archivar este registro.");
        
    const actorName = currentUserRef.current?.name || 'Sistema';
    const now = new Date().toISOString();
    const archiveLog = createAuditLog(`AUDITORÍA: Registro movido al archivo inmutable.`);
    const updatedLogs = [...(req.logs || []), archiveLog];
    
    setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? { 
        ...r, 
        isDeleted: true, 
        deletedAt: now, 
        deletedBy: actorName,
        status: Status.FINALIZADO,
        lastUpdated: now,
        logs: updatedLogs 
    } : r)));
    addNotification('WARNING', 'Expediente Archivado', `Registro enviado al archivo de auditoría.`, undefined, 'auditAlerts');

    try {
        await db.deleteRequest(id, actorName, [archiveLog]);
    } catch (e) {
        console.error("DB Sync Error al archivar expediente:", e);
        addNotification('WARNING', 'Error de Persistencia', 'El archivo del expediente no pudo sincronizarse con el servidor.', id);
    }
  }, [addNotification, createAuditLog]);

  const hardDeleteAllRequests = useCallback(async () => {
    if (activeRoleRef.current !== UserRole.SUPERADMIN) {
        throw new Error("Solo el Administrador Maestro puede restablecer la base de datos.");
    }
    await db.hardDeleteAllRequests();
    setRequests([]);
    addNotification('WARNING', 'Requerimientos Eliminados', `La base de datos de requerimientos ha sido restablecida.`);
  }, [addNotification]);

  const addUser = useCallback(async (name: string, email: string, role: UserRole, pass: string, area?: Area, areas?: Area[], canSupervise?: boolean, canReceiveAndDerive?: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (usersRef.current.some(u => u.email?.trim().toLowerCase() === normalizedEmail)) {
        throw new Error("Ya existe un colaborador registrado con ese correo electrónico.");
    }
    if ((role === UserRole.HEAD || role === UserRole.ANALYST) && (!areas || areas.length === 0) && !area) {
        throw new Error("El área es obligatoria para Jefaturas y Analistas.");
    }
    const newUser: User = { id: genUUID(), name: name.trim(), email: normalizedEmail, role, area, areas, password: pass, status: 'ACTIVE', joinedAt: new Date().toISOString(), canSupervise, canReceiveAndDerive };
    await db.saveUser(newUser);
    await loadData();
    addNotification('SUCCESS', 'Nuevo Usuario', `Colaborador creado: ${name}`);
  }, [loadData, addNotification]);

  const updateUser = useCallback(async (u: User) => {
    const normalizedEmail = u.email?.trim().toLowerCase();
    if (normalizedEmail && usersRef.current.some(existing => existing.id !== u.id && existing.email?.trim().toLowerCase() === normalizedEmail)) {
        throw new Error("Ya existe otro colaborador registrado con ese correo electrónico.");
    }
    if (u.id === currentUserRef.current?.id) {
        if (u.status === 'INACTIVE') {
            throw new Error("Acción denegada: No puede desactivar su propia cuenta estando en sesión.");
        }
        if (currentUserRef.current.role === UserRole.SUPERADMIN && u.role !== UserRole.SUPERADMIN) {
            throw new Error("Acción denegada: No puede degradar su propio rol de SuperAdmin estando en sesión.");
        }
    }
    if ((u.role === UserRole.HEAD || u.role === UserRole.ANALYST) && (!u.areas || u.areas.length === 0) && !u.area) {
        throw new Error("El área es obligatoria para Jefaturas y Analistas.");
    }
    const oldUser = usersRef.current.find(existing => existing.id === u.id);
    await db.saveUser({ ...u, name: u.name.trim(), email: normalizedEmail || u.email });
    
    // Sincronizar nombre en expedientes de forma masiva (2 consultas O(1) en lugar de N upserts)
    if (oldUser && oldUser.name !== u.name.trim()) {
        await db.renameUserInRequests(oldUser.name, u.name.trim());
    }
    
    await loadData();
    addNotification('INFO', 'Perfil Actualizado', `Usuario ${u.name.trim()} modificado.`);
  }, [loadData, addNotification]);

  const deleteUser = useCallback(async (id: string) => {
    if (activeRoleRef.current !== UserRole.SUPERADMIN) {
        throw new Error("Solo el Administrador Maestro puede eliminar usuarios.");
    }
    if (id === currentUserRef.current?.id) {
        throw new Error("Acción denegada: No puede eliminar su propia cuenta estando en sesión.");
    }
    
    const userToDelete = usersRef.current.find(u => u.id === id);
    if (userToDelete) {
        const hasActiveRequests = requestsRef.current.some(r =>
            (r.assignedAnalyst === userToDelete.name || r.assignedAnalystId === id) &&
            r.status !== Status.FINALIZADO &&
            !r.isDeleted
        );
        const isResponsibleForActiveRequests = requestsRef.current.some(r =>
            (r.responsibleHead === userToDelete.name || r.responsibleHeadId === id) &&
            r.status !== Status.FINALIZADO &&
            !r.isDeleted
        );
        const hasFutureAlerts = scheduledProcessesRef.current.some(p => p.status === 'ACTIVE' && p.alerts.some(a => a.status === 'WAITING' && a.assignedToId === id));
        
        if (hasActiveRequests || isResponsibleForActiveRequests) {
            throw new Error("El usuario tiene requerimientos activos asignados como Analista o Jefatura Responsable. Reasígnelos antes de eliminar.");
        }
        if (hasFutureAlerts) {
            throw new Error("El usuario está asignado a alertas futuras en el Planificador de Procesos. Elimine o modifique los procesos antes de eliminar al usuario.");
        }
    }

    await db.deleteUser(id);
    await loadData();
    addNotification('WARNING', 'Usuario Eliminado', `El usuario ha sido eliminado del sistema.`);
  }, [loadData, addNotification]);

  const addProcess = useCallback(async (processData: Omit<ScheduledProcess, 'id' | 'status'>) => {
      const actor = currentUserRef.current;
      if (!actor || (actor.role !== UserRole.SUPERADMIN && actor.role !== UserRole.HEAD)) {
          addNotification('WARNING', 'Acceso Denegado', 'No tienes permisos para crear procesos.');
          return;
      }
      const newProcess: ScheduledProcess = {
          ...processData,
          id: genUUID(),
          status: 'ACTIVE'
      };
      
      setScheduledProcesss(prev => [...prev, newProcess]);
      addNotification('INFO', 'Proceso Programado', `El proceso "${processData.processName}" ha sido planificado.`);
      
      try {
          await db.saveScheduledProcess(newProcess);
          await loadData();
      } catch (e) {
          console.error('Error al guardar proceso:', e);
          addNotification('WARNING', 'Error de Persistencia', 'No se pudo guardar el proceso en el servidor.');
      }
  }, [loadData, addNotification]);

  const updateProcess = useCallback(async (updatedProcess: ScheduledProcess) => {
      const actor = currentUserRef.current;
      if (!actor || (actor.role !== UserRole.SUPERADMIN && actor.role !== UserRole.HEAD)) {
          addNotification('WARNING', 'Acceso Denegado', 'No tienes permisos para modificar procesos.');
          return;
      }
      
      setScheduledProcesss(prev => prev.map(p => p.id === updatedProcess.id ? updatedProcess : p));
      
      try {
          await db.saveScheduledProcess(updatedProcess);
          await loadData();
      } catch (e) {
          console.error('Error al actualizar proceso:', e);
          addNotification('WARNING', 'Error de Persistencia', 'No se pudo sincronizar la rutina con el servidor.');
      }
  }, [loadData, addNotification]);

  const deleteProcess = useCallback(async (id: string) => {
      const actor = currentUserRef.current;
      if (!actor || (actor.role !== UserRole.SUPERADMIN && actor.role !== UserRole.HEAD)) {
          addNotification('WARNING', 'Acceso Denegado', 'No tienes permisos para eliminar procesos.');
          return;
      }
      
      setScheduledProcesss(prev => prev.filter(p => p.id !== id));
      try {
          await db.deleteScheduledProcess(id);
      } catch (e) {
          console.error('Error al eliminar proceso:', e);
          addNotification('WARNING', 'Error de Persistencia', 'No se pudo eliminar la rutina en el servidor.');
      }
  }, [addNotification]);

  const finalizeOneOffRequest = useCallback(async (id: string, totalAmount: number) => {
      const localReq = requestsRef.current.find(r => r.id === id);
      if (!localReq) return;

      const check = canUserTransition(localReq, Status.FINALIZADO);
      if (!check.allowed) throw new Error(check.reason);

      if (localReq.clientType !== 'ONE_OFF') {
          throw new Error('La liquidación comercial solo aplica a expedientes de modalidad Único.');
      }
      if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
          throw new Error('El monto total de cierre debe ser mayor a cero.');
      }
      
      const now = new Date().toISOString();
      const closeLog = createAuditLog(`CIERRE: Pago total confirmado ($${totalAmount.toLocaleString()}) y expediente finalizado.`);
      const updatedLocal: RequestCard = {
          ...localReq,
          status: Status.FINALIZADO,
          paymentProportion: 'FULL',
          paymentAmount: totalAmount,
          totalAmount: totalAmount,
          lastUpdated: now,
          finishedAt: now,
          logs: [...(localReq.logs || []), closeLog]
      };

      setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? updatedLocal : r)));
      addNotification('PROCESS', 'Cierre Comercial', `Expediente liquidado y finalizado ($${totalAmount.toLocaleString()}).`, id, 'statusChanges');
      
      try {
          const synced = await db.updateRequestWithMergedLogs(id, {
              status: Status.FINALIZADO,
              paymentProportion: 'FULL',
              paymentAmount: totalAmount,
              totalAmount: totalAmount,
              lastUpdated: now,
              finishedAt: now
          }, [closeLog]);
          hydratedLogIdsRef.current.add(id);
          setRequests(prev => sortRequestsDesc(prev.map(r => r.id === id ? synced : r)));
      } catch (e) {
          console.error("Error al finalizar ticket único:", e);
          throw new Error("No se pudo persistir el cierre del ticket.");
      }
  }, [canUserTransition, createAuditLog, addNotification]);

  const ensureRequestLogs = useCallback(async (id: string) => {
      if (!id || hydratedLogIdsRef.current.has(id)) return;
      try {
          const fullReq = await db.getRequestById(id);
          if (fullReq) {
              hydratedLogIdsRef.current.add(id);
              const normalizedLogs = typeof fullReq.logs === 'string'
                  ? JSON.parse(fullReq.logs)
                  : (Array.isArray(fullReq.logs) ? fullReq.logs : []);
              setRequests(prev => prev.map(r => r.id === id ? { ...r, logs: normalizedLogs } : r));
          }
      } catch (e) {
          console.warn('No se pudieron cargar los logs del expediente:', e);
      }
  }, []);

  const bypassConnectionError = useCallback(() => {
    setInitError(null);
    setDbDiagnostic({ status: 'READY', message: 'Modo local de contingencia activo.' });
    loadData();
  }, [loadData]);

  const contextValue = useMemo<SisreqContextType>(() => ({
      currentUser, users, requests, scheduledProcesses, notifications, notificationSettings, isAuthenticated, isLoading, initError, dbDiagnostic, activeRole, viewMode, globalFilterArea, selectedRequestId, organizationAreas, isSupervisorMode,
      bypassConnectionError,
      login, logout, setActiveRole, toggleSupervisorMode, setViewMode, addUser, updateUser, deleteUser,
      addOrganizationArea, updateOrganizationArea, deleteOrganizationArea,
      setSelectedRequestId, setGlobalFilterArea, addRequest, updateStatus, returnRequest, assignAnalyst, addLog, updateRequestDetails, finalizeOneOffRequest, deleteRequest, hardDeleteAllRequests,
      addProcess, updateProcess, deleteProcess,
      addNotification, updateNotificationSettings, markNotificationAsRead, clearNotifications,
      canUserTransition, canUserSeeRequest, isActionable, ensureRequestLogs
  }), [
      currentUser, users, requests, scheduledProcesses, notifications, notificationSettings, isAuthenticated, isLoading, initError, dbDiagnostic, activeRole, viewMode, globalFilterArea, selectedRequestId, organizationAreas, isSupervisorMode,
      bypassConnectionError,
      login, logout, toggleSupervisorMode, setViewMode, addUser, updateUser, deleteUser,
      addOrganizationArea, updateOrganizationArea, deleteOrganizationArea,
      addRequest, updateStatus, returnRequest, assignAnalyst, addLog, updateRequestDetails, finalizeOneOffRequest, deleteRequest, hardDeleteAllRequests,
      addProcess, updateProcess, deleteProcess,
      addNotification, updateNotificationSettings, markNotificationAsRead, clearNotifications,
      canUserTransition, canUserSeeRequest, isActionable, ensureRequestLogs
  ]);

  return (
    <SisreqContext.Provider value={contextValue}>
      {children}
    </SisreqContext.Provider>
  );
};

export const useSisreq = () => {
  const context = useContext(SisreqContext);
  if (!context) throw new Error('useSisreq debe usarse dentro de SisreqProvider');
  return context;
};
