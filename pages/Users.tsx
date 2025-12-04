import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await storageService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleOpenModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser({ ...userToEdit }); // Clone to avoid direct mutation
    } else {
      setEditingUser({ role: UserRole.SALES });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Simple validation
    if (!editingUser.name || !editingUser.username) {
      alert("Nome e Nome de Usuário são obrigatórios.");
      return;
    }

    if (editingUser.id) {
      // Edit
      await storageService.updateUser(editingUser as User);
    } else {
      // Create
      if (!editingUser.password) {
        alert("Senha é obrigatória para novos usuários.");
        return;
      }
      await storageService.createUser(editingUser as User);
    }

    await fetchUsers();
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Você não pode excluir a si mesmo.");
      return;
    }
    if (window.confirm('Excluir este usuário?')) {
      await storageService.deleteUser(id);
      await fetchUsers();
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando usuários...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciamento de Usuários</h2>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Controle de acesso e permissões</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.role === UserRole.ADMIN 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(u)} className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-2 rounded">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 p-2 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                {editingUser.id ? 'Editar Usuário & Permissões' : 'Criar Usuário'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input required type="text" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded p-2" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome de Usuário (Login)</label>
                <input required type="text" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded p-2" value={editingUser.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editingUser.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser.id}
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded p-2" 
                  value={editingUser.password || ''} 
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permissão / Função</label>
                <select 
                  className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded p-2" 
                  value={editingUser.role} 
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.SALES}>Vendedor</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Administradores têm acesso total. Vendedores acessam apenas pedidos, clientes e produtos.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;