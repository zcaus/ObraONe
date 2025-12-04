import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, ChevronRight, LayoutDashboard } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(username, pass);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciais inválidas. Verifique usuário e senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[100vw] h-[100vw] bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-[100vw] h-[100vw] bg-zinc-800/20 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-zinc-200 dark:border-zinc-800">
        <div className="w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4 text-white shadow-lg shadow-red-500/30">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white"><span className="text-red-600">Obra</span>One</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acesso ao Sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white"
                  placeholder="Ex: admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white"
                  placeholder="••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 shadow-lg shadow-red-600/30"
            >
              {loading ? 'Entrando...' : 'Acessar Sistema'}
              {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
             <p>Ainda não tem acesso? Contate o administrador.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;