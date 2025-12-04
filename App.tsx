import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Orders from './pages/Orders';
import OrderForm from './pages/OrderForm';
import Users from './pages/Users';
import Settings from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/clients" element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />

          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <OrderForm />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute adminOnly>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;