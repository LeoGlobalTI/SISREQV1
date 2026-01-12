
import React from 'react';
import { SisreqProvider, useSisreq } from './context/SisreqContext';
import { Layout } from './components/Layout';
import { Board } from './components/Board';
import { SuperAdminView } from './components/SuperAdminView';
import { LoginPage } from './components/LoginPage';
import { LayoutDashboard, AlertCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isAuthenticated, viewMode, isLoading, initError } = useSisreq();

  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-3 rounded-xl shadow-lg shadow-indigo-200 animate-pulse">
                <LayoutDashboard className="text-white" size={32} />
            </div>
            <div className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">Conectando a Capa de Persistencia...</div>
        </div>
    );
  }

  if (initError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 max-w-md shadow-xl">
                <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Fallo de Conectividad</h2>
                <p className="text-slate-500 text-sm font-medium mb-6">{initError}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
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
      {viewMode === 'superadmin' ? <SuperAdminView /> : <Board />}
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
