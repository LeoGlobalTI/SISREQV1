
import React from 'react';
import { SisreqProvider, useSisreq } from './context/SisreqContext';
import { Layout } from './components/Layout';
import { Board } from './components/Board';
import { SuperAdminView } from './components/SuperAdminView';
import { LoginPage } from './components/LoginPage';
import { DocumentationView } from './components/DocumentationView';
import { LayoutDashboard, AlertCircle, Database, Copy, CheckCircle2, Terminal } from 'lucide-react';

const SetupRequiredView: React.FC<{ sql?: string, message: string }> = ({ sql, message }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (sql) {
            navigator.clipboard.writeText(sql);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
                <div className="bg-slate-900 p-10 md:w-80 text-white flex flex-col justify-between">
                    <div>
                        <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                            <Database size={24} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase leading-tight mb-4">Configuración Pendiente</h2>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest mb-8">
                            Se ha detectado una conexión exitosa con Supabase, pero la estructura de datos no está lista.
                        </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Estado detectado:</p>
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-tight">{message}</p>
                    </div>
                </div>

                <div className="flex-1 p-10 bg-white space-y-6">
                    <div className="flex items-center gap-3 text-slate-900 mb-2">
                        <Terminal size={20} className="text-indigo-600" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Script de Inicialización SQL</h3>
                    </div>

                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                        Copia el siguiente código y ejecútalo en el <strong>SQL Editor</strong> de tu proyecto en Supabase para crear las tablas y políticas necesarias.
                    </p>

                    <div className="relative group">
                        <pre className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-[10px] font-mono text-slate-600 overflow-x-auto max-h-[300px] custom-scrollbar shadow-inner leading-relaxed">
                            {sql || "-- No hay sugerencia SQL disponible"}
                        </pre>
                        {sql && (
                            <button 
                                onClick={handleCopy}
                                className="absolute top-4 right-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2"
                            >
                                {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                {copied ? 'Copiado' : 'Copiar Script'}
                            </button>
                        )}
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                           <AlertCircle size={16} className="text-indigo-600 shrink-0" />
                           <p className="text-[10px] font-bold text-indigo-700 uppercase leading-tight">
                               Una vez ejecutado el script, recarga esta página para iniciar el sistema.
                           </p>
                        </div>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
                        >
                            Verificar y Recargar Sistema
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MainContent: React.FC = () => {
  const { isAuthenticated, viewMode, isLoading, initError, dbDiagnostic } = useSisreq();

  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-3 rounded-xl shadow-lg shadow-indigo-200 animate-pulse">
                <LayoutDashboard className="text-white" size={32} />
            </div>
            <div className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">Sincronizando con Capa de Datos...</div>
        </div>
    );
  }

  // Si el diagnóstico indica que falta configuración de tablas o RLS
  if (dbDiagnostic?.status === 'SETUP_REQUIRED') {
      return <SetupRequiredView sql={dbDiagnostic.sqlSuggestion} message={dbDiagnostic.message} />;
  }

  if (initError || dbDiagnostic?.status === 'ERROR') {
      const errorMsg = initError || dbDiagnostic?.message || "Error desconocido";
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 max-w-md shadow-xl">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Fallo Crítico de Conexión</h2>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                    {errorMsg}
                    <br/><br/>
                    <span className="text-[10px] text-slate-400">Verifica que las credenciales de Supabase sean correctas y que el proyecto esté activo.</span>
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                    Reintentar Conexión
                </button>
            </div>
        </div>
      );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      {viewMode === 'superadmin' ? <SuperAdminView /> : viewMode === 'documentation' ? <DocumentationView /> : <Board />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <SisreqProvider>
      <MainContent />
    </SisreqProvider>
  );
};

export default App;
