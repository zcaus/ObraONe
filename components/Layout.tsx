import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  UserCog,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Pedidos', path: '/orders', icon: ShoppingCart },
    { label: 'Clientes', path: '/clients', icon: Users },
    { label: 'Produtos', path: '/products', icon: Package },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Usuários', path: '/users', icon: UserCog });
    navItems.push({ label: 'Ajustes', path: '/settings', icon: Settings });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Header - Hidden on Print */}
      <div className="md:hidden bg-zinc-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md border-b border-red-600 print:hidden">
        <h1 className="font-bold text-lg"><span className="text-red-500">Obra</span>One</h1>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="text-gray-300 hover:text-white">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on Print */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-20 w-64 bg-zinc-900 text-white transform transition-transform duration-200 ease-in-out border-r border-zinc-800 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex md:flex-col
      `}>
        <div className="p-6 text-center border-b border-zinc-800 hidden md:block">
          <h1 className="text-2xl font-bold tracking-wider"><span className="text-red-600">Obra</span>One</h1>
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Gestão de Vendas</span>
        </div>

        <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-red-900/50">
              {user?.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm truncate text-gray-200">{user?.name}</p>
              <p className="text-xs text-zinc-400">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive(item.path) 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-3">
          {/* Desktop Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="hidden md:flex items-center gap-3 px-4 py-2 w-full text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>

          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-gray-50 dark:bg-zinc-950 text-slate-900 dark:text-gray-100 transition-colors print:p-0 print:overflow-visible print:h-auto print:bg-white">
        {children}
      </main>
    </div>
  );
};

export default Layout;