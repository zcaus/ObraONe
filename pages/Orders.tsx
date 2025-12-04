import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import { storageService } from '../services/storageService';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const allOrders = await storageService.getOrders();
    // Sort orders by date desc
    allOrders.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setOrders(allOrders);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido/orçamento?')) {
      await storageService.deleteOrder(id);
      await loadOrders();
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case OrderStatus.DRAFT: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando pedidos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pedidos de Venda</h2>
        <Link 
          to="/orders/new"
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus size={18} /> Novo Pedido
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            statusFilter === 'ALL' 
            ? 'bg-zinc-800 text-white dark:bg-white dark:text-black' 
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-700 dark:hover:bg-zinc-800'
          }`}
        >
          Todos
        </button>
        {Object.values(OrderStatus).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === status
              ? 'bg-zinc-800 text-white dark:bg-white dark:text-black'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou ID..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Itens</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-500 dark:text-gray-400">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {new Date(order.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.clientName}</td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                    {order.items.length}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link to={`/orders/${order.id}`} className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-2 rounded inline-block">
                      <Eye size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(order.id)}
                      className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 p-2 rounded inline-block"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;