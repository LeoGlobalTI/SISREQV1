/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestCard, User, Status, ScheduledProcess, LogEntry } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS } from '../constants';

const SLIM_REQUEST_COLUMNS = 'id,title,detail,requester,area,status,priority,"responsibleHead","responsibleHeadId","assignedAnalyst","assignedAnalystId","createdAt","lastUpdated","finishedAt","isReturned","isDeleted","deletedAt","deletedBy","sourceType","clientType","paymentProportion","paymentAmount","totalAmount"';

const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giwyowsqmgwsaliiduqi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Owy6oQHM50c9v1tNp1PCPg_TTSNIger';

const STORE_REQUESTS = 'requests';
const STORE_USERS = 'users';
const STORE_AREAS = 'organization_areas';
const STORE_PROCESSES = 'scheduled_processes';

const CACHE_REQUESTS = 'sisreq_cache_requests';
const CACHE_USERS = 'sisreq_cache_users';
const CACHE_AREAS = 'sisreq_cache_areas';
const CACHE_PROCESSES = 'sisreq_cache_routines';

export interface DbDiagnostic {
    status: 'READY' | 'ERROR' | 'SETUP_REQUIRED';
    message: string;
    sqlSuggestion?: string;
    errorDetails?: any;
}

let proxyDisabled = !import.meta.env.DEV;

const createResilientFetch = () => {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let originalUrl = '';
        let method = init?.method;
        let headers = init?.headers;
        let body = init?.body;

        if (typeof input === 'string') {
            originalUrl = input;
        } else if (input instanceof URL) {
            originalUrl = input.toString();
        } else if (typeof Request !== 'undefined' && input instanceof Request) {
            originalUrl = input.url;
            method = method || input.method;
            headers = headers || input.headers;
        }

        // Si estamos en el navegador y la URL apunta a /supabase-proxy, intentamos vía proxy solo si está habilitado
        if (typeof window !== 'undefined' && originalUrl.includes('/supabase-proxy')) {
            if (!proxyDisabled) {
                try {
                    const proxyRes = await fetch(input, init);
                    if (proxyRes.status !== 404 && proxyRes.status !== 502 && proxyRes.status !== 504) {
                        return proxyRes;
                    }
                    proxyDisabled = true;
                } catch (err) {
                    proxyDisabled = true;
                    console.warn('Proxy fetch no disponible, recurriendo a conexión directa:', err);
                }
            }

            // Fallback a conexión directa
            const directUrl = originalUrl.replace(`${window.location.origin}/supabase-proxy`, RAW_SUPABASE_URL);
            return fetch(directUrl, {
                ...init,
                method,
                headers,
                body
            });
        }

        // Si la URL apunta directamente a supabase.co en desarrollo, intentamos el proxy local de Vite primero
        if (typeof window !== 'undefined' && !proxyDisabled && originalUrl.includes('supabase.co')) {
            const proxyUrl = originalUrl.replace(/^https?:\/\/[^/]+/, `${window.location.origin}/supabase-proxy`);
            try {
                const proxyRes = await fetch(proxyUrl, {
                    ...init,
                    method,
                    headers,
                    body
                });
                if (proxyRes.status !== 404 && proxyRes.status !== 502 && proxyRes.status !== 504) {
                    return proxyRes;
                }
                proxyDisabled = true;
            } catch (err) {
                proxyDisabled = true;
            }
        }

        return fetch(input, init);
    };
};

class DatabaseService {
    private supabase: SupabaseClient;
    private memoryCache = new Map<string, any>();
    private cacheTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor() {
        const effectiveUrl = typeof window !== 'undefined' && !proxyDisabled && window.location?.origin
            ? `${window.location.origin}/supabase-proxy`
            : RAW_SUPABASE_URL;

        this.supabase = createClient(effectiveUrl, SUPABASE_ANON_KEY, {
            global: {
                fetch: createResilientFetch(),
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        });
    }

    private getCached<T>(key: string, fallback: T): T {
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key) as T;
        }
        try {
            if (typeof window === 'undefined') return fallback;
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved) as T;
                this.memoryCache.set(key, parsed);
                return parsed;
            }
            return fallback;
        } catch {
            return fallback;
        }
    }

    private setCached<T>(key: string, value: T): void {
        this.memoryCache.set(key, value);
        if (typeof window === 'undefined') return;

        const existingTimer = this.cacheTimers.get(key);
        if (existingTimer) clearTimeout(existingTimer);

        this.cacheTimers.set(key, setTimeout(() => {
            this.cacheTimers.delete(key);
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                // Si se excede la cuota en requests, recortar respaldo offline a los últimos 150 registros
                if (key === CACHE_REQUESTS && Array.isArray(value) && value.length > 150) {
                    try {
                        localStorage.setItem(key, JSON.stringify(value.slice(0, 150)));
                        return;
                    } catch {
                        // ignorar si sigue sin espacio
                    }
                }
                console.warn(`No se pudo almacenar caché para ${key}:`, e);
            }
        }, 250));
    }

    public async init(): Promise<DbDiagnostic> {
        try {
            const [userCheck, reqCheck, areaCheck, processCheck] = await Promise.all([
                this.supabase
                    .from(STORE_USERS)
                    .select('id, "canSupervise", "canReceiveAndDerive"', { count: 'exact', head: true }),
                this.supabase
                    .from(STORE_REQUESTS)
                    .select('id, "responsibleHeadId", "assignedAnalystId"', { count: 'exact', head: true }),
                this.supabase
                    .from(STORE_AREAS)
                    .select('id', { count: 'exact', head: true }),
                this.supabase
                    .from(STORE_PROCESSES)
                    .select('id', { count: 'exact', head: true })
            ]);

            if (userCheck.error) {
                const msg = userCheck.error.message || "";
                if (msg.includes('Failed to fetch') || userCheck.error instanceof TypeError) {
                    console.warn("Supabase no alcanzable directamente; activando modo resiliente con caché local.");
                    return { status: 'READY', message: 'Modo local de contingencia activo.' };
                }
                return this.diagnoseError(userCheck.error, STORE_USERS);
            }

            if (reqCheck.error) {
                const msg = reqCheck.error.message || "";
                if (msg.includes('Failed to fetch') || reqCheck.error instanceof TypeError) {
                    return { status: 'READY', message: 'Modo local de contingencia activo.' };
                }
                return this.diagnoseError(reqCheck.error, STORE_REQUESTS);
            }

            if (processCheck.error) {
                const msg = processCheck.error.message || "";
                if (!msg.includes('Failed to fetch') && !(processCheck.error instanceof TypeError)) {
                    return this.diagnoseError(processCheck.error, STORE_PROCESSES);
                }
            }

            await this.seedData(userCheck.count, reqCheck.count, areaCheck.error ? null : areaCheck.count);
            return { status: 'READY', message: 'Capa de persistencia verificada.' };
        } catch (error: any) {
            const msg = error?.message || "";
            if (msg.includes('Failed to fetch') || error instanceof TypeError) {
                console.warn("Excepción de red al iniciar base de datos; activando modo resiliente.");
                return { status: 'READY', message: 'Modo local de contingencia activo.' };
            }
            return this.diagnoseError(error, 'init');
        }
    }

    private async seedData(uCount: number | null, rCount: number | null, aCount: number | null) {
        try {
            const tasks: PromiseLike<any>[] = [];
            if (uCount === 0) {
                tasks.push(this.supabase.from(STORE_USERS).insert(INITIAL_USERS));
            }
            if (rCount === 0) {
                tasks.push(this.supabase.from(STORE_REQUESTS).insert(INITIAL_REQUESTS));
            }
            if (aCount === 0) {
                const initialAreas = Array.from(new Set(INITIAL_REQUESTS.map(r => r.area))).map(name => ({ name }));
                if (initialAreas.length > 0) {
                    tasks.push(this.supabase.from(STORE_AREAS).insert(initialAreas));
                }
            }
            if (tasks.length > 0) {
                await Promise.all(tasks);
            }
        } catch (e) {
            console.warn("Aviso en verificación de semillas iniciales:", e);
        }
    }

    private diagnoseError(error: any, table: string): DbDiagnostic {
        const msg = error.message || "";
        const code = error.code || "";

        // Manejar errores de red/conexión
        if (msg.includes('Failed to fetch') || error instanceof TypeError) {
            return {
                status: 'READY',
                message: 'Modo local de contingencia activo (red restringida).',
                errorDetails: error
            };
        }

        const sqlTableUsers = `CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL,
  area text,
  password text,
  status text,
  "joinedAt" timestamp with time zone DEFAULT now(),
  "canSupervise" boolean DEFAULT false,
  "canReceiveAndDerive" boolean DEFAULT false
);`;

        const sqlTableRequests = `CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  detail text,
  requester text,
  area text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  "responsibleHead" text,
  "assignedAnalyst" text,
  "responsibleHeadId" text,
  "assignedAnalystId" text,
  "clientType" text DEFAULT 'FREQUENT',
  "paymentProportion" text,
  "paymentAmount" numeric,
  logs jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  "lastUpdated" timestamp with time zone DEFAULT now(),
  "finishedAt" timestamp with time zone,
  "isReturned" boolean DEFAULT false,
  "isDeleted" boolean DEFAULT false,
  "deletedAt" timestamp with time zone,
  "deletedBy" text
);`;

        const sqlTableAreas = `CREATE TABLE IF NOT EXISTS public.organization_areas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL
);`;

        const sqlTableProcesses = `CREATE TABLE IF NOT EXISTS public.scheduled_processes (
  id uuid PRIMARY KEY,
  "processName" text NOT NULL,
  area text NOT NULL,
  "globalStartDate" text NOT NULL,
  "globalEndDate" text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  alerts jsonb DEFAULT '[]'::jsonb
);`;

        const sqlRLS = `-- SEGURIDAD DE FILA (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.organization_areas FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.scheduled_processes FOR SELECT USING (true);
CREATE POLICY "Public Write" ON public.requests FOR ALL USING (true);
CREATE POLICY "Public Write" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Write" ON public.organization_areas FOR ALL USING (true);
CREATE POLICY "Public Write" ON public.scheduled_processes FOR ALL USING (true);`;

        if (code === '42703' || msg.includes('column')) {
            return {
                status: 'SETUP_REQUIRED',
                message: `Estructura obsoleta en '${table}'`,
                sqlSuggestion: `-- Migración de integridad:\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "isDeleted" boolean DEFAULT false;\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "responsibleHeadId" text;\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "assignedAnalystId" text;\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "clientType" text DEFAULT 'FREQUENT';\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "paymentProportion" text;\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "paymentAmount" numeric;\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "totalAmount" numeric;\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS "canSupervise" boolean DEFAULT false;\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS "canReceiveAndDerive" boolean DEFAULT false;`
            };
        }

        if (msg.includes('row-level security') || code === '42501') {
            return {
                status: 'SETUP_REQUIRED',
                message: `Violación de Políticas RLS`,
                sqlSuggestion: sqlRLS
            };
        }

        if (code === '42P01') {
            return {
                status: 'SETUP_REQUIRED',
                message: `Esquema no inicializado`,
                sqlSuggestion: `${sqlTableUsers}\n\n${sqlTableRequests}\n\n${sqlTableAreas}\n\n${sqlTableProcesses}\n\n${sqlRLS}`
            };
        }

        return { status: 'ERROR', message: msg, errorDetails: error };
    }

    public async getRequests(): Promise<RequestCard[]> {
        try {
            const { data, error } = await this.supabase
                .from(STORE_REQUESTS)
                .select(SLIM_REQUEST_COLUMNS)
                .order('lastUpdated', { ascending: false });
            if (error) {
                console.warn('Aviso al obtener requerimientos desde Supabase:', error.message || error);
                return this.getCached(CACHE_REQUESTS, INITIAL_REQUESTS);
            }
            const cachedById = new Map(this.getCached<RequestCard[]>(CACHE_REQUESTS, []).map(r => [r.id, r]));
            const hydrated = (data || []).map((row: any) => {
                const cachedRow = cachedById.get(row.id);
                return {
                    ...row,
                    logs: Array.isArray(cachedRow?.logs) ? cachedRow.logs : []
                } as RequestCard;
            });
            if (hydrated.length > 0) {
                this.setCached(CACHE_REQUESTS, hydrated);
            }
            return hydrated;
        } catch (err) {
            console.warn('Excepción de red al consultar requerimientos, usando respaldo:', err);
            return this.getCached(CACHE_REQUESTS, INITIAL_REQUESTS);
        }
    }

    public async getAreas(): Promise<string[]> {
        const defaultAreas = Array.from(new Set(INITIAL_REQUESTS.map(r => r.area)));
        try {
            const { data, error } = await this.supabase
                .from(STORE_AREAS)
                .select('name')
                .order('name', { ascending: true });
            if (error) {
                console.warn('Aviso al obtener áreas desde Supabase:', error.message || error);
                return this.getCached(CACHE_AREAS, defaultAreas);
            }
            const areas = (data || []).map(a => a.name);
            if (areas.length > 0) {
                this.setCached(CACHE_AREAS, areas);
                return areas;
            }
            return this.getCached(CACHE_AREAS, defaultAreas);
        } catch (err) {
            console.warn('Excepción de red al consultar áreas, usando respaldo:', err);
            return this.getCached(CACHE_AREAS, defaultAreas);
        }
    }

    public async addArea(name: string): Promise<void> {
        const cached = this.getCached<string[]>(CACHE_AREAS, []);
        if (!cached.includes(name)) {
            this.setCached(CACHE_AREAS, [...cached, name]);
        }
        try {
            const { error } = await this.supabase.from(STORE_AREAS).insert({ name });
            if (error) console.warn('Aviso al insertar área en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al insertar área:', e);
        }
    }

    public async deleteArea(name: string): Promise<void> {
        const cached = this.getCached<string[]>(CACHE_AREAS, []);
        this.setCached(CACHE_AREAS, cached.filter(a => a !== name));
        try {
            const { error } = await this.supabase.from(STORE_AREAS).delete().eq('name', name);
            if (error) console.warn('Aviso al eliminar área en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al eliminar área:', e);
        }
    }

    public async updateArea(oldName: string, newName: string): Promise<void> {
        const cached = this.getCached<string[]>(CACHE_AREAS, []);
        this.setCached(CACHE_AREAS, cached.map(a => a === oldName ? newName : a));
        try {
            const { error } = await this.supabase
                .from(STORE_AREAS)
                .update({ name: newName })
                .eq('name', oldName);
            if (error) console.warn('Aviso al actualizar área en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al actualizar área:', e);
        }
    }

    public async renameAreaInRequests(oldName: string, newName: string): Promise<void> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, []);
        if (cached.length > 0) {
            this.setCached(CACHE_REQUESTS, cached.map(r => r.area === oldName ? { ...r, area: newName } : r));
        }
        try {
            const { error } = await this.supabase
                .from(STORE_REQUESTS)
                .update({ area: newName })
                .eq('area', oldName);
            if (error) console.warn('Aviso al renombrar área en requerimientos:', error.message);
        } catch (e) {
            console.warn('Excepción de red al renombrar área en requerimientos:', e);
        }
    }

    public async renameUserInRequests(oldName: string, newName: string): Promise<void> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, []);
        if (cached.length > 0) {
            this.setCached(CACHE_REQUESTS, cached.map(r => {
                if (r.assignedAnalyst !== oldName && r.responsibleHead !== oldName) return r;
                return {
                    ...r,
                    assignedAnalyst: r.assignedAnalyst === oldName ? newName : r.assignedAnalyst,
                    responsibleHead: r.responsibleHead === oldName ? newName : r.responsibleHead,
                };
            }));
        }
        try {
            const [resAnalyst, resHead] = await Promise.all([
                this.supabase.from(STORE_REQUESTS).update({ assignedAnalyst: newName }).eq('assignedAnalyst', oldName),
                this.supabase.from(STORE_REQUESTS).update({ responsibleHead: newName }).eq('responsibleHead', oldName)
            ]);
            if (resAnalyst.error) console.warn('Aviso al renombrar analista en requerimientos:', resAnalyst.error.message);
            if (resHead.error) console.warn('Aviso al renombrar jefatura en requerimientos:', resHead.error.message);
        } catch (e) {
            console.warn('Excepción de red al renombrar usuario en requerimientos:', e);
        }
    }

    public async saveRequest(req: RequestCard): Promise<void> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, INITIAL_REQUESTS);
        const idx = cached.findIndex(r => r.id === req.id);
        const updated = idx >= 0 ? cached.map(r => r.id === req.id ? req : r) : [req, ...cached];
        this.setCached(CACHE_REQUESTS, updated);

        const { error } = await this.supabase.from(STORE_REQUESTS).upsert(req);
        if (error) {
            console.error('ERROR al guardar requerimiento en Supabase (Detalles):', {
                error: error.message,
                hint: error.hint,
                details: error.details,
                code: error.code,
                reqId: req.id,
                clientType: (req as any).clientType
            });
            throw new Error(error.message || 'No se pudo guardar el requerimiento.');
        }
    }

    public async insertRequestIfAbsent(req: RequestCard): Promise<void> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, INITIAL_REQUESTS);
        if (!cached.some(r => r.id === req.id)) {
            this.setCached(CACHE_REQUESTS, [req, ...cached]);
        }
        try {
            const { error } = await this.supabase
                .from(STORE_REQUESTS)
                .upsert(req, { onConflict: 'id', ignoreDuplicates: true });
            if (error) {
                console.warn('Aviso en inserción idempotente de rutina:', error.message);
            }
        } catch (e) {
            console.warn('Excepción de red en inserción idempotente de rutina:', e);
        }
    }

    public async updateRequestWithMergedLogs(
        requestId: string,
        patch: Partial<RequestCard>,
        newLogs: LogEntry[]
    ): Promise<RequestCard> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, INITIAL_REQUESTS);
        const existingCached = cached.find(r => r.id === requestId);
        const mergeLogs = (base: LogEntry[], incoming: LogEntry[]) => {
            const seen = new Set(base.map(l => l.id));
            const merged = [...base];
            for (const item of incoming) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    merged.push(item);
                }
            }
            return merged;
        };

        try {
            const { data: current, error: fetchError } = await this.supabase
                .from(STORE_REQUESTS)
                .select('logs')
                .eq('id', requestId)
                .single();

            if (!fetchError && current) {
                const serverLogs = Array.isArray(current.logs) ? (current.logs as LogEntry[]) : [];
                const mergedLogs = mergeLogs(serverLogs, newLogs);
                const { data: updated, error: updateError } = await this.supabase
                    .from(STORE_REQUESTS)
                    .update({ ...patch, logs: mergedLogs })
                    .eq('id', requestId)
                    .select()
                    .single();

                if (updateError) {
                    throw new Error(updateError.message || 'No se pudo actualizar el requerimiento.');
                }

                this.setCached(CACHE_REQUESTS, cached.map(r => r.id === requestId ? (updated as RequestCard) : r));
                return updated as RequestCard;
            }
        } catch (e: any) {
            if (e?.message && !e.message.includes('Failed to fetch')) {
                throw e;
            }
        }

        const fallbackLogs = mergeLogs(existingCached?.logs || [], newLogs);
        const fallbackCard = { ...(existingCached || {}), ...patch, id: requestId, logs: fallbackLogs } as RequestCard;
        this.setCached(CACHE_REQUESTS, cached.map(r => r.id === requestId ? fallbackCard : r));
        return fallbackCard;
    }

    /**
     * Añade un log fusionando contra el historial más reciente en servidor
     */
    public async appendRequestLog(requestId: string, newLog: LogEntry): Promise<RequestCard | null> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, []);
        const existingCached = cached.find(r => r.id === requestId);
        const now = new Date().toISOString();

        try {
            const { data: current, error: fetchError } = await this.supabase
                .from(STORE_REQUESTS)
                .select('*')
                .eq('id', requestId)
                .single();

            if (!fetchError && current) {
                const currentLogs = Array.isArray(current.logs) ? current.logs : [];
                if (currentLogs.find((l: any) => l.id === newLog.id)) return current as RequestCard;

                const updatedLogs = [...currentLogs, newLog];
                const { data: updated, error: updateError } = await this.supabase
                    .from(STORE_REQUESTS)
                    .update({
                        logs: updatedLogs,
                        lastUpdated: now
                    })
                    .eq('id', requestId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                this.setCached(CACHE_REQUESTS, cached.map(r => r.id === requestId ? (updated as RequestCard) : r));
                return updated as RequestCard;
            }
        } catch (e: any) {
            if (e?.message && !e.message.includes('Failed to fetch')) {
                console.error('Error atómico al añadir log:', e);
                throw new Error(e.message);
            }
        }

        if (!existingCached) return null;
        const baseLogs = Array.isArray(existingCached.logs) ? existingCached.logs : [];
        const localUpdated: RequestCard = {
            ...existingCached,
            lastUpdated: now,
            logs: baseLogs.some(l => l.id === newLog.id) ? baseLogs : [...baseLogs, newLog]
        };
        this.setCached(CACHE_REQUESTS, cached.map(r => r.id === requestId ? localUpdated : r));
        return localUpdated;
    }

    public async deleteRequest(id: string, deletedBy: string, newLogs?: LogEntry[]): Promise<void> {
        const now = new Date().toISOString();
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, []);
        const mergeLogs = (base: LogEntry[], incoming: LogEntry[] = []) => {
            const seen = new Set(base.map(l => l.id));
            const merged = [...base];
            for (const item of incoming) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    merged.push(item);
                }
            }
            return merged;
        };

        const updatedCache = cached.map(r => r.id === id ? {
            ...r,
            isDeleted: true,
            deletedAt: now,
            deletedBy,
            status: Status.FINALIZADO,
            lastUpdated: now,
            logs: mergeLogs(r.logs || [], newLogs || [])
        } : r);
        this.setCached(CACHE_REQUESTS, updatedCache);

        const payload: Record<string, any> = {
            isDeleted: true,
            deletedAt: now,
            deletedBy: deletedBy,
            status: Status.FINALIZADO,
            lastUpdated: now
        };

        if (newLogs && newLogs.length > 0) {
            const { data: current } = await this.supabase
                .from(STORE_REQUESTS)
                .select('logs')
                .eq('id', id)
                .single();
            const serverLogs = Array.isArray(current?.logs) ? (current.logs as LogEntry[]) : [];
            payload.logs = mergeLogs(serverLogs, newLogs);
        }

        const { error } = await this.supabase
            .from(STORE_REQUESTS)
            .update(payload)
            .eq('id', id);
        if (error) {
            throw new Error(error.message || 'No se pudo archivar el requerimiento en Supabase.');
        }
    }

    public async getUsers(): Promise<User[]> {
        try {
            const { data, error } = await this.supabase
                .from(STORE_USERS)
                .select('id, name, email, role, area, status, joinedAt, "canSupervise", "canReceiveAndDerive"')
                .order('joinedAt', { ascending: false });
            if (error) {
                console.warn('Aviso al consultar usuarios desde Supabase:', error.message || error);
                return this.getCached(CACHE_USERS, INITIAL_USERS);
            }
            const parsed = (data || []).map(u => {
                const areas = u.area ? u.area.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0) : [];
                return {
                    ...u,
                    areas,
                    area: areas.length > 0 ? areas[0] : undefined,
                    canSupervise: u.canSupervise || false,
                    canReceiveAndDerive: u.canReceiveAndDerive || false
                };
            }) as User[];
            if (parsed.length > 0) {
                this.setCached(CACHE_USERS, parsed);
                return parsed;
            }
            return this.getCached(CACHE_USERS, INITIAL_USERS);
        } catch (err) {
            console.warn('Excepción de red al consultar usuarios, usando respaldo:', err);
            return this.getCached(CACHE_USERS, INITIAL_USERS);
        }
    }

    public async validateUser(email: string, pass: string): Promise<User | null> {
        try {
            const { data, error } = await this.supabase
                .from(STORE_USERS)
                .select('*')
                .ilike('email', email.trim())
                .eq('password', pass)
                .single();

            if (!error && data) {
                if (data.status === 'INACTIVE') {
                    throw new Error('Cuenta desactivada. Contacte al Administrador.');
                }
                const { password, ...safeUser } = data;
                const areas = safeUser.area ? safeUser.area.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0) : [];
                return {
                    ...safeUser,
                    areas,
                    area: areas.length > 0 ? areas[0] : undefined,
                    canSupervise: safeUser.canSupervise || false,
                    canReceiveAndDerive: safeUser.canReceiveAndDerive || false
                } as User;
            }
        } catch (e: any) {
            if (e?.message?.includes('desactivada')) throw e;
            console.warn('Validación de usuario con Supabase fallida, comprobando respaldo local:', e);
        }

        const localUsers = this.getCached<User[]>(CACHE_USERS, INITIAL_USERS);
        const match = localUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === pass);
        if (match) {
            if (match.status === 'INACTIVE') {
                throw new Error('Cuenta desactivada. Contacte al Administrador.');
            }
            const { password, ...safeUser } = match;
            return safeUser as User;
        }

        return null;
    }

    public async saveUser(user: User): Promise<void> {
        const cached = this.getCached<User[]>(CACHE_USERS, INITIAL_USERS);
        const idx = cached.findIndex(u => u.id === user.id);
        const updated = idx >= 0 ? cached.map(u => u.id === user.id ? user : u) : [user, ...cached];
        this.setCached(CACHE_USERS, updated);

        try {
            const toSave = { ...user } as any;
            if (toSave.areas) {
                toSave.area = toSave.areas.length > 0 ? toSave.areas.join(',') : null;
                delete toSave.areas;
            }
            const { error } = await this.supabase.from(STORE_USERS).upsert(toSave);
            if (error) console.warn('Aviso al guardar usuario en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al guardar usuario:', e);
        }
    }

    public async deleteUser(id: string): Promise<void> {
        const cached = this.getCached<User[]>(CACHE_USERS, []);
        this.setCached(CACHE_USERS, cached.filter(u => u.id !== id));

        try {
            const { error } = await this.supabase.from(STORE_USERS).delete().eq('id', id);
            if (error) console.warn('Aviso al eliminar usuario en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al eliminar usuario:', e);
        }
    }

    public async hardDeleteAllRequests(): Promise<void> {
        this.setCached(CACHE_REQUESTS, []);
        try {
            const { error } = await this.supabase.from(STORE_REQUESTS).delete().not('id', 'is', null);
            if (error) console.warn('Aviso al vaciar requerimientos en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al vaciar requerimientos:', e);
        }
    }

    public async getRequestById(id: string): Promise<RequestCard | null> {
        try {
            const { data, error } = await this.supabase.from(STORE_REQUESTS).select('*').eq('id', id).single();
            if (!error && data) return data as RequestCard;
        } catch (e) {
            // usar caché como reserva
        }
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, INITIAL_REQUESTS);
        return cached.find(r => r.id === id) || null;
    }

    public async getScheduledProcesses(): Promise<ScheduledProcess[]> {
        try {
            const { data, error } = await this.supabase.from(STORE_PROCESSES).select('*').order('globalStartDate', { ascending: true });
            if (error) {
                console.warn('Aviso al obtener rutinas:', error.message);
                return this.getCached<ScheduledProcess[]>(CACHE_PROCESSES, []);
            }
            if (data) {
                this.setCached(CACHE_PROCESSES, data);
                return data;
            }
            return [];
        } catch (e) {
            return this.getCached<ScheduledProcess[]>(CACHE_PROCESSES, []);
        }
    }

    public async saveScheduledProcess(routine: ScheduledProcess): Promise<void> {
        const cached = this.getCached<ScheduledProcess[]>(CACHE_PROCESSES, []);
        const idx = cached.findIndex(r => r.id === routine.id);
        const updated = idx >= 0 ? cached.map(r => r.id === routine.id ? routine : r) : [routine, ...cached];
        this.setCached(CACHE_PROCESSES, updated);
        const { error } = await this.supabase.from(STORE_PROCESSES).upsert(routine);
        if (error) {
            throw new Error(error.message || 'No se pudo guardar la rutina.');
        }
    }

    public async deleteScheduledProcess(id: string): Promise<void> {
        const cached = this.getCached<ScheduledProcess[]>(CACHE_PROCESSES, []);
        this.setCached(CACHE_PROCESSES, cached.filter(r => r.id !== id));
        const { error } = await this.supabase.from(STORE_PROCESSES).delete().eq('id', id);
        if (error) {
            throw new Error(error.message || 'No se pudo eliminar la rutina.');
        }
    }

    public subscribeToRequests(callback: (payload: any) => void) {
        try {
            const channel = this.supabase.channel('public:requests')
                .on('postgres_changes', { event: '*', schema: 'public', table: STORE_REQUESTS }, (payload) => {
                    callback(payload);
                })
                .subscribe((status) => {
                    if (status === 'CHANNEL_ERROR') {
                        console.warn('Canal en tiempo real no disponible en este entorno; operando vía sincronización periódica.');
                    }
                });
            return () => { 
                try {
                    this.supabase.removeChannel(channel); 
                } catch {
                    // ignorar
                }
            };
        } catch (e) {
            console.warn("No se pudo iniciar suscripción en tiempo real:", e);
            return () => {};
        }
    }
}

export const db = new DatabaseService();
