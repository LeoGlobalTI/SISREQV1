
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestCard, User, Status } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS } from '../constants';

const SUPABASE_URL = 'https://giwyowsqmgwsaliiduqi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Owy6oQHM50c9v1tNp1PCPg_TTSNIger';

const STORE_REQUESTS = 'requests';
const STORE_USERS = 'users';

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
                .select('*', { count: 'exact', head: true });

            if (userError) return this.diagnoseError(userError, STORE_USERS);

            const { error: reqError } = await this.supabase
                .from(STORE_REQUESTS)
                .select('*', { count: 'exact', head: true });

            if (reqError) return this.diagnoseError(reqError, STORE_REQUESTS);

            await this.seedData();
            return { status: 'READY', message: 'Capa de persistencia verificada.' };
        } catch (error: any) {
            return { status: 'ERROR', message: error.message || 'Error de red crítico', errorDetails: error };
        }
    }

    private async seedData() {
        const { count: uCount } = await this.supabase.from(STORE_USERS).select('*', { count: 'exact', head: true });
        if (uCount === 0) await this.supabase.from(STORE_USERS).insert(INITIAL_USERS);

        const { count: rCount } = await this.supabase.from(STORE_REQUESTS).select('*', { count: 'exact', head: true });
        if (rCount === 0) await this.supabase.from(STORE_REQUESTS).insert(INITIAL_REQUESTS);
    }

    private diagnoseError(error: any, table: string): DbDiagnostic {
        const msg = error.message || "";
        const code = error.code || "";

        // SQL Definitions remain the same as they are structural requirements
        const sqlTableUsers = `CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL,
  area text,
  password text,
  status text,
  "joinedAt" timestamp with time zone DEFAULT now()
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

        const sqlRLS = `-- SEGURIDAD DE FILA (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Public Write" ON public.requests FOR ALL USING (true);
CREATE POLICY "Public Write" ON public.users FOR ALL USING (true);`;

        if (code === '42703' || msg.includes('column')) {
            return {
                status: 'SETUP_REQUIRED',
                message: `Estructura obsoleta en '${table}'`,
                sqlSuggestion: `-- Migración de integridad:\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "isDeleted" boolean DEFAULT false;`
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
                sqlSuggestion: `${sqlTableUsers}\n\n${sqlTableRequests}\n\n${sqlRLS}`
            };
        }

        return { status: 'ERROR', message: msg, errorDetails: error };
    }

    public async getRequests(): Promise<RequestCard[]> {
        const { data, error } = await this.supabase
            .from(STORE_REQUESTS)
            .select('*')
            .order('lastUpdated', { ascending: false });
        return error ? [] : (data || []) as RequestCard[];
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
        const { data, error } = await this.supabase.from(STORE_USERS).select('id, name, email, role, area, status, joinedAt');
        if (error) return [];
        return (data || []) as User[];
    }

    public async validateUser(email: string, pass: string): Promise<User | null> {
        // Auditoría: Validación en lado "servidor" (simulado por filtro Supabase)
        // No traemos el pass al cliente si no coincide
        const { data, error } = await this.supabase
            .from(STORE_USERS)
            .select('*')
            .eq('email', email)
            .eq('password', pass)
            .single();

        if (error || !data) return null;
        
        // Limpiamos datos sensibles antes de devolver al contexto
        const { password, ...safeUser } = data;
        return safeUser as User;
    }

    public async saveUser(user: User): Promise<void> {
        const { error } = await this.supabase.from(STORE_USERS).upsert(user);
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
