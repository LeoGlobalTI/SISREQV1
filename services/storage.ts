
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestCard, User, Status } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS } from '../constants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giwyowsqmgwsaliiduqi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Owy6oQHM50c9v1tNp1PCPg_TTSNIger';

const STORE_REQUESTS = 'requests';
const STORE_USERS = 'users';
const STORE_AREAS = 'organization_areas';

export interface DbDiagnostic {
    status: 'READY' | 'ERROR' | 'SETUP_REQUIRED';
    message: string;
    sqlSuggestion?: string;
    errorDetails?: any;
}

class DatabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    public async init(): Promise<DbDiagnostic> {
        try {
            const { error: userError } = await this.supabase
                .from(STORE_USERS)
                .select('id, "canSupervise", "canReceiveAndDerive"', { count: 'exact', head: true });

            if (userError) return this.diagnoseError(userError, STORE_USERS);

            const { error: reqError } = await this.supabase
                .from(STORE_REQUESTS)
                .select('*', { count: 'exact', head: true });

            if (reqError) return this.diagnoseError(reqError, STORE_REQUESTS);

            await this.seedData();
            return { status: 'READY', message: 'Capa de persistencia verificada.' };
        } catch (error: any) {
            return this.diagnoseError(error, 'init');
        }
    }

    private async seedData() {
        const { count: uCount } = await this.supabase.from(STORE_USERS).select('*', { count: 'exact', head: true });
        if (uCount === 0) await this.supabase.from(STORE_USERS).insert(INITIAL_USERS);

        const { count: rCount } = await this.supabase.from(STORE_REQUESTS).select('*', { count: 'exact', head: true });
        if (rCount === 0) await this.supabase.from(STORE_REQUESTS).insert(INITIAL_REQUESTS);

        const { count: aCount } = await this.supabase.from(STORE_AREAS).select('*', { count: 'exact', head: true });
        if (aCount === 0) {
            const initialAreas = Array.from(new Set(INITIAL_REQUESTS.map(r => r.area)));
            for (const area of initialAreas) {
                await this.supabase.from(STORE_AREAS).insert({ name: area });
            }
        }
    }

    private diagnoseError(error: any, table: string): DbDiagnostic {
        const msg = error.message || "";
        const code = error.code || "";

        // Handle network/connection errors
        if (msg.includes('Failed to fetch') || error instanceof TypeError) {
            return {
                status: 'ERROR',
                message: `Error de conexión: No se pudo conectar a la base de datos (${SUPABASE_URL}). Verifique su conexión a Internet o si la URL de Supabase es correcta.`,
                errorDetails: error
            };
        }

        // SQL Definitions remain the same as they are structural requirements
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
        const { data, error } = await this.supabase
            .from(STORE_REQUESTS)
            .select('id, title, detail, requester, area, status, priority, "responsibleHead", "assignedAnalyst", logs, "createdAt", "lastUpdated", "finishedAt", "isReturned", "isDeleted", "deletedAt", "deletedBy"')
            .order('lastUpdated', { ascending: false });
        if (error) {
            console.error('Error fetching requests:', JSON.stringify(error, null, 2));
            throw new Error(`DB_FETCH_ERROR: ${error.message || 'Unknown error'}`);
        }
        return (data || []) as RequestCard[];
    }

    public async getAreas(): Promise<string[]> {
        const { data, error } = await this.supabase
            .from(STORE_AREAS)
            .select('name')
            .order('name', { ascending: true });
        if (error) throw new Error(`DB_AREA_FETCH_ERROR: ${error.message}`);
        return (data || []).map(a => a.name);
    }

    public async addArea(name: string): Promise<void> {
        const { error } = await this.supabase.from(STORE_AREAS).insert({ name });
        if (error) throw new Error(`DB_AREA_INSERT_ERROR: ${error.message}`);
    }

    public async deleteArea(name: string): Promise<void> {
        const { error } = await this.supabase.from(STORE_AREAS).delete().eq('name', name);
        if (error) throw new Error(`DB_AREA_DELETE_ERROR: ${error.message}`);
    }

    public async saveRequest(req: RequestCard): Promise<void> {
        const { error } = await this.supabase.from(STORE_REQUESTS).upsert(req);
        if (error) throw new Error(`DB_WRITE_ERROR: ${error.message}`);
    }

    public async deleteRequest(id: string, deletedBy: string): Promise<void> {
        const { error } = await this.supabase
            .from(STORE_REQUESTS)
            .update({ 
                isDeleted: true, 
                deletedAt: new Date().toISOString(),
                deletedBy: deletedBy,
                status: Status.FINALIZADO
            })
            .eq('id', id);
        
        if (error) throw new Error(`DB_DELETE_ERROR: ${error.message}`);
    }

    public async getUsers(): Promise<User[]> {
        const { data, error } = await this.supabase
            .from(STORE_USERS)
            .select('id, name, email, role, area, status, joinedAt, "canSupervise", "canReceiveAndDerive"')
            .order('joinedAt', { ascending: false });
        if (error) {
            console.error('Error fetching users:', JSON.stringify(error, null, 2));
            throw new Error(`DB_USER_FETCH_ERROR: ${error.message || 'Unknown error'}`);
        }
        return (data || []).map(u => {
            const areas = u.area ? u.area.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0) : [];
            return {
                ...u,
                areas,
                area: areas.length > 0 ? areas[0] : undefined,
                canSupervise: u.canSupervise || false,
                canReceiveAndDerive: u.canReceiveAndDerive || false
            };
        }) as User[];
    }

    public async validateUser(email: string, pass: string): Promise<User | null> {
        // Auditoría: Validación en lado "servidor" (simulado por filtro Supabase)
        // No traemos el pass al cliente si no coincide
        const { data, error } = await this.supabase
            .from(STORE_USERS)
            .select('*')
            .ilike('email', email.trim())
            .eq('password', pass)
            .single();

        if (error || !data) return null;
        
        // Limpiamos datos sensibles antes de devolver al contexto
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

    public async saveUser(user: User): Promise<void> {
        const toSave = { ...user } as any;
        if (toSave.areas) {
            toSave.area = toSave.areas.length > 0 ? toSave.areas.join(',') : null;
            delete toSave.areas;
        }

        const { error } = await this.supabase.from(STORE_USERS).upsert(toSave);
        if (error) throw new Error(`DB_USER_UPDATE_ERROR: ${error.message}`);
    }

    public async deleteUser(id: string): Promise<void> {
        const { error, data } = await this.supabase.from(STORE_USERS).delete().eq('id', id).select();
        console.log("Supabase deleteUser result:", error, data);
        if (error) throw new Error(`DB_USER_DELETE_ERROR: ${error.message}`);
    }

    public async hardDeleteAllRequests(): Promise<void> {
        const { error } = await this.supabase.from(STORE_REQUESTS).delete().not('id', 'is', null);
        if (error) throw new Error(`DB_HARD_DELETE_ALL_REQUESTS_ERROR: ${error.message}`);
    }

    public async getRequestById(id: string): Promise<RequestCard | null> {
        const { data, error } = await this.supabase.from(STORE_REQUESTS).select('*').eq('id', id).single();
        return error ? null : data as RequestCard;
    }

    public subscribeToRequests(callback: (payload: any) => void) {
        const channel = this.supabase.channel('public:requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: STORE_REQUESTS }, (payload) => {
                callback(payload);
            })
            .subscribe();
        return () => { this.supabase.removeChannel(channel); };
    }
}

export const db = new DatabaseService();
