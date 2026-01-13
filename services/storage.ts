
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestCard, User } from '../types';
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
            return { status: 'READY', message: 'Conexión exitosa' };
        } catch (error: any) {
            return { status: 'ERROR', message: error.message || 'Fallo de red', errorDetails: error };
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

        const sqlRLS = `-- ACTIVAR SEGURIDAD DE FILA (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO (EJEMPLO SEGURO)
CREATE POLICY "Permitir lectura anónima" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir lectura anónima" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Permitir inserción/update anónima" ON public.requests FOR ALL USING (true);
CREATE POLICY "Permitir inserción/update anónima" ON public.users FOR ALL USING (true);`;

        if (code === '42703' || msg.includes('column') && msg.includes('does not exist')) {
            return {
                status: 'SETUP_REQUIRED',
                message: `Estructura desactualizada en la tabla '${table}'`,
                sqlSuggestion: `-- Migración necesaria:\nALTER TABLE public.requests ADD COLUMN IF NOT EXISTS "isDeleted" boolean DEFAULT false;`
            };
        }

        if (msg.includes('row-level security policy') || code === '42501') {
            return {
                status: 'SETUP_REQUIRED',
                message: `Restricción de Seguridad Detectada`,
                sqlSuggestion: sqlRLS
            };
        }

        if (msg.includes('schema cache') || code === '42P01') {
            return {
                status: 'SETUP_REQUIRED',
                message: `Tablas no encontradas`,
                sqlSuggestion: `${sqlTableUsers}\n\n${sqlTableRequests}\n\n${sqlRLS}`
            };
        }

        return { status: 'ERROR', message: msg, errorDetails: error };
    }

    public async getRequests(): Promise<RequestCard[]> {
        const { data, error } = await this.supabase.from(STORE_REQUESTS).select('*').order('lastUpdated', { ascending: false });
        return error ? [] : (data || []) as RequestCard[];
    }

    public async saveRequest(req: RequestCard): Promise<void> {
        const { error } = await this.supabase.from(STORE_REQUESTS).upsert(req);
        if (error) throw error;
    }

    public async deleteRequest(id: string, deletedBy: string): Promise<void> {
        const { error } = await this.supabase
            .from(STORE_REQUESTS)
            .update({ 
                isDeleted: true, 
                deletedAt: new Date().toISOString(),
                deletedBy: deletedBy
            })
            .eq('id', id);
        
        if (error) throw error;
    }

    public async getUsers(): Promise<User[]> {
        const { data, error } = await this.supabase.from(STORE_USERS).select('*');
        if (error) return [];
        // SEURIDAD: No devolvemos contraseñas en la lista general para evitar sniffing del estado
        return (data || []).map(u => ({ ...u, password: '***' })) as User[];
    }

    // Método especial para validación de login (simulado, en producción usar Supabase Auth)
    public async validateUser(email: string): Promise<User | null> {
        const { data, error } = await this.supabase.from(STORE_USERS).select('*').eq('email', email).single();
        if (error || !data) return null;
        return data as User;
    }

    public async saveUser(user: User): Promise<void> {
        const { error } = await this.supabase.from(STORE_USERS).upsert(user);
        if (error) throw error;
    }
}

export const db = new DatabaseService();
