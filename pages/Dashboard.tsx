import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';
import { OrderStatus, Order, Client } from '../types';
import { generateSalesInsights } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [o, c] = await Promise.all([
        storageService.getOrders(),
        storageService.getClients()
      ]);
      setOrders(o);
      setClients(c);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Calculate KPIs
  const metrics = useMemo(() => {
    const totalSales = orders
      .filter(o => o.status !== OrderStatus.CANCELLED)
      .reduce((acc, curr) => acc + curr.total, 0);
    
    const activeClients = new Set(orders.map(o => o.clientId)).size;
    
    return {
      totalSales,
      orderCount: orders.length,
      activeClients,
      averageTicket: orders.length > 0 ? totalSales / orders.length : 0,
      totalClients: clients.length
    };
  }, [orders, clients]);

  // Chart Data Preparation
  const salesByDate = useMemo(() => {
    const data: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status === OrderStatus.CANCELLED) return;
      const date = new Date(o.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      data[date] = (data[date] || 0) + o.total;
    });
    return Object.keys(data).map(key => ({ date: key, amount: data[key] }));
  }, [orders]);

  const handleGenerateInsight = async () => {
    setAnalyzing(true);
    const result = await generateSalesInsights(metrics, orders);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando indicadores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Visão geral do desempenho comercial</p>
        </div>
        <button 
          onClick={handleGenerateInsight}
          disabled={analyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70 shadow-red-900/20"
        >
          <Sparkles size={18} className={analyzing ? "animate-spin" : ""} />
          {analyzing ? "Analisando..." : "Gerar Análise IA"}
        </button>
      </div>

      {/* AI Analysis Box */}
      {aiAnalysis && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border-l-4 border-red-500 animate-fade-in dark:border-zinc-800">
          <h3 className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400 mb-2">
            <Sparkles size={16} /> Insight Inteligente
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendas (Mês)</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center mt-2">
            <TrendingUp size={12} className="mr-1" /> +12% vs mês anterior
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{metrics.orderCount}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Carteira Clientes</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{metrics.totalClients}</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
            {metrics.activeClients} compraram recentemente
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Positivação</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {metrics.totalClients > 0 ? Math.round((metrics.activeClients / metrics.totalClients) * 100) : 0}%
              </h3>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Evolução de Vendas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} dy={10} stroke="#9CA3AF" />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#18181B', color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#DC2626" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#DC2626', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Top Produtos</h3>
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="w-10 h-10 rounded bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs">
                  P{i}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Produto Exemplo {i}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">120 unidades</p>
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">R$ 1.2k</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;