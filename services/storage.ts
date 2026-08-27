import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestCard, User, Status } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS } from '../constants';

const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giwyowsqmgwsaliiduqi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Owy6oQHM50c9v1tNp1PCPg_TTSNIger';

const STORE_REQUESTS = 'requests';
const STORE_USERS = 'users';
const STORE_AREAS = 'organization_areas';

const CACHE_REQUESTS = 'sisreq_cache_requests';
const CACHE_USERS = 'sisreq_cache_users';
const CACHE_AREAS = 'sisreq_cache_areas';

export interface DbDiagnostic {
    status: 'READY' | 'ERROR' | 'SETUP_REQUIRED';
    message: string;
    sqlSuggestion?: string;
    errorDetails?: any;
}

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

        // Si estamos en el navegador y la URL apunta a /supabase-proxy, intentamos vía proxy primero
        if (typeof window !== 'undefined' && originalUrl.includes('/supabase-proxy')) {
            try {
                const proxyRes = await fetch(input, init);
                if (proxyRes.status !== 404 && proxyRes.status !== 502 && proxyRes.status !== 504) {
                    return proxyRes;
                }
            } catch (err) {
                console.warn('Proxy fetch no disponible, recurriendo a conexión directa:', err);
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

        // Si la URL apunta directamente a supabase.co, intentamos el proxy local de Vite primero
        if (typeof window !== 'undefined' && originalUrl.includes('supabase.co')) {
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
            } catch (err) {
                // Si el proxy falla, proseguir con fetch directo
            }
        }

        return fetch(input, init);
    };
};

class DatabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const effectiveUrl = typeof window !== 'undefined' && window.location?.origin
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
        try {
            if (typeof window === 'undefined') return fallback;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch {
            return fallback;
        }
    }

    private setCached<T>(key: string, value: T): void {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.warn(`No se pudo almacenar caché para ${key}:`, e);
        }
    }

    public async init(): Promise<DbDiagnostic> {
        try {
            const { error: userError } = await this.supabase
                .from(STORE_USERS)
                .select('id, "canSupervise", "canReceiveAndDerive"', { count: 'exact', head: true });

            if (userError) {
                const msg = userError.message || "";
                if (msg.includes('Failed to fetch') || userError instanceof TypeError) {
                    console.warn("Supabase no alcanzable directamente; activando modo resiliente con caché local.");
                    return { status: 'READY', message: 'Modo local de contingencia activo.' };
                }
                return this.diagnoseError(userError, STORE_USERS);
            }

            const { error: reqError } = await this.supabase
                .from(STORE_REQUESTS)
                .select('*', { count: 'exact', head: true });

            if (reqError) {
                const msg = reqError.message || "";
                if (msg.includes('Failed to fetch') || reqError instanceof TypeError) {
                    return { status: 'READY', message: 'Modo local de contingencia activo.' };
                }
                return this.diagnoseError(reqError, STORE_REQUESTS);
            }

            await this.seedData();
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

    private async seedData() {
        try {
            const { count: uCount, error: uErr } = await this.supabase.from(STORE_USERS).select('*', { count: 'exact', head: true });
            if (!uErr && uCount === 0) {
                await this.supabase.from(STORE_USERS).insert(INITIAL_USERS);
            }

            const { count: rCount, error: rErr } = await this.supabase.from(STORE_REQUESTS).select('*', { count: 'exact', head: true });
            if (!rErr && rCount === 0) {
                await this.supabase.from(STORE_REQUESTS).insert(INITIAL_REQUESTS);
            }

            const { count: aCount, error: aErr } = await this.supabase.from(STORE_AREAS).select('*', { count: 'exact', head: true });
            if (!aErr && aCount === 0) {
                const initialAreas = Array.from(new Set(INITIAL_REQUESTS.map(r => r.area)));
                for (const area of initialAreas) {
                    await this.supabase.from(STORE_AREAS).insert({ name: area });
                }
            }
        } catch (e) {
            console.warn("Aviso en verificación de semillas iniciales:", e);
        }
    }

    private diagnoseError(error: any, table: string): DbDiagnostic {
        const msg = error.message || "";
        const code = error.code || "";

        // Handle network/connection errors
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

        const sqlRLS = `-- SEGURIDAD DE FILA (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.organization_areas FOR SELECT USING (true);
CREATE POLICY "Public Write" ON public.requests FOR ALL USING (true);
CREATE POLICY "Public Write" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Write" ON public.organization_areas FOR ALL USING (true);`;

        if (code === '42703' || msg.includes('column')) {
            return {
                status: 'SETUP_REQUIRED',
                message: `Estructura obsoleta en '${table}'`,
                sqlSuggestion: `-- Migración de integridad:\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "isDeleted" boolean DEFAULT false;\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS "canSupervise" boolean DEFAULT false;\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS "canReceiveAndDerive" boolean DEFAULT false;`
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
                sqlSuggestion: `${sqlTableUsers}\n\n${sqlTableRequests}\n\n${sqlTableAreas}\n\n${sqlRLS}`
            };
        }

        return { status: 'ERROR', message: msg, errorDetails: error };
    }

    public async getRequests(): Promise<RequestCard[]> {
        try {
            const { data, error } = await this.supabase
                .from(STORE_REQUESTS)
                .select('id, title, detail, requester, area, status, priority, "responsibleHead", "assignedAnalyst", logs, "createdAt", "lastUpdated", "finishedAt", "isReturned", "isDeleted", "deletedAt", "deletedBy"')
                .order('lastUpdated', { ascending: false });
            if (error) {
                console.warn('Aviso al obtener requerimientos desde Supabase:', error.message || error);
                return this.getCached(CACHE_REQUESTS, INITIAL_REQUESTS);
            }
            if (data && data.length > 0) {
                this.setCached(CACHE_REQUESTS, data);
                return data as RequestCard[];
            }
            return (data || []) as RequestCard[];
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

    public async saveRequest(req: RequestCard): Promise<void> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, INITIAL_REQUESTS);
        const idx = cached.findIndex(r => r.id === req.id);
        const updated = idx >= 0 ? cached.map(r => r.id === req.id ? req : r) : [req, ...cached];
        this.setCached(CACHE_REQUESTS, updated);

        try {
            const { error } = await this.supabase.from(STORE_REQUESTS).upsert(req);
            if (error) console.warn('Aviso al guardar requerimiento en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al guardar requerimiento:', e);
        }
    }

    public async deleteRequest(id: string, deletedBy: string): Promise<void> {
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, []);
        const updated = cached.map(r => r.id === id ? {
            ...r,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy,
            status: Status.FINALIZADO
        } : r);
        this.setCached(CACHE_REQUESTS, updated);

        try {
            const { error } = await this.supabase
                .from(STORE_REQUESTS)
                .update({ 
                    isDeleted: true, 
                    deletedAt: new Date().toISOString(),
                    deletedBy: deletedBy,
                    status: Status.FINALIZADO
                })
                .eq('id', id);
            if (error) console.warn('Aviso al archivar requerimiento en Supabase:', error.message);
        } catch (e) {
            console.warn('Excepción de red al archivar requerimiento:', e);
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
        } catch (e) {
            console.warn('Validación de usuario con Supabase fallida, comprobando respaldo local:', e);
        }

        const localUsers = this.getCached<User[]>(CACHE_USERS, INITIAL_USERS);
        const match = localUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === pass);
        if (match) {
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
            // fallback
        }
        const cached = this.getCached<RequestCard[]>(CACHE_REQUESTS, INITIAL_REQUESTS);
        return cached.find(r => r.id === id) || null;
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
                    // ignore
                }
            };
        } catch (e) {
            console.warn("No se pudo iniciar suscripción en tiempo real:", e);
            return () => {};
        }
    }
}

export const db = new DatabaseService();
