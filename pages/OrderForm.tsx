import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, Plus, Calculator, Printer, FileDown } from 'lucide-react';
import { Order, OrderItem, Client, Product, OrderStatus, AppSettings } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

const OrderForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.DRAFT);
  const [freightType, setFreightType] = useState('');
  const [notes, setNotes] = useState('');

  // Item Adding State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDependencies();
  }, [id]);

  const loadDependencies = async () => {
    setLoading(true);
    const [c, p, s] = await Promise.all([
      storageService.getClients(),
      storageService.getProducts(),
      storageService.getSettings()
    ]);
    setClients(c);
    setProducts(p);
    setSettings(s);

    if (id && id !== 'new') {
      const allOrders = await storageService.getOrders();
      const existing = allOrders.find(o => o.id === id);
      if (existing) {
        setSelectedClient(existing.clientId);
        setItems(existing.items);
        setStatus(existing.status);
        setFreightType(existing.freightType || '');
        setNotes(existing.notes || '');
      }
    }
    setLoading(false);
  };

  const orderTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.total, 0);
  }, [items]);

  const clientData = useMemo(() => {
    return clients.find(c => c.id === selectedClient);
  }, [selectedClient, clients]);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    const newItem: OrderItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: quantity,
      unitPrice: prod.price,
      total: prod.price * quantity
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!selectedClient) {
      alert("Selecione um cliente");
      return;
    }
    if (items.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    const orderData: Order = {
      id: id && id !== 'new' ? id : Math.floor(Math.random() * 100000000).toString(),
      clientId: selectedClient,
      clientName: clientData?.name || 'Desconhecido',
      sellerId: user?.id || '0',
      date: new Date().toISOString(),
      items,
      total: orderTotal,
      status,
      freightType,
      notes
    };

    const success = await storageService.saveOrder(orderData);
    if (success) {
      navigate('/orders');
    } else {
      alert("Erro ao salvar pedido.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Basic CSV Export
    const headers = ['Código', 'Produto', 'Quantidade', 'Preço Unit.', 'Total'];
    const rows = items.map(item => [
      item.productId,
      item.productName,
      item.quantity,
      item.unitPrice.toFixed(2),
      item.total.toFixed(2)
    ]);
    
    // Add Summary at bottom
    rows.push([]);
    rows.push(['', '', '', 'TOTAL PEDIDO:', orderTotal.toFixed(2)]);
    
    // Combine
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedido_${id || 'novo'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando formulário...</div>;

  return (
    <>
      {/* --- EDIT MODE (Hidden on Print) --- */}
      <div className="space-y-6 max-w-5xl mx-auto pb-20 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/orders')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {id === 'new' ? 'Novo Pedido' : `Editar Pedido #${id?.slice(0,8)}`}
            </h2>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 dark:text-green-400 dark:border-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
             >
                <FileDown size={18} /> Excel
             </button>
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors shadow-lg"
             >
                <Printer size={18} /> Imprimir / PDF
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Client & Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">1</span>
                Dados do Pedido
              </h3>
              
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-2 bg-white dark:bg-zinc-950 dark:text-white"
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.city || 'Sem Cidade'}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Frete</label>
                    <select 
                      className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-2 bg-white dark:bg-zinc-950 dark:text-white"
                      value={freightType}
                      onChange={e => setFreightType(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {settings?.freightOptions?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select 
                      className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-2 bg-white dark:bg-zinc-950 dark:text-white"
                      value={status}
                      onChange={e => setStatus(e.target.value as OrderStatus)}
                    >
                      {Object.values(OrderStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">2</span>
                Itens do Pedido
              </h3>

              {/* Add Item Form */}
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg mb-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Produto</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-zinc-600 rounded p-2 text-sm bg-white dark:bg-zinc-900 dark:text-white"
                    value={selectedProduct}
                    onChange={e => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Buscar produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name} (R${p.price})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qtd</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border border-gray-300 dark:border-zinc-600 rounded p-2 text-sm bg-white dark:bg-zinc-900 dark:text-white"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value))}
                  />
                </div>
                <div className="sm:col-span-3">
                  <button 
                    onClick={handleAddItem}
                    className="w-full bg-red-600 text-white p-2 rounded text-sm hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="p-2">Produto</th>
                        <th className="p-2 text-right">Qtd</th>
                        <th className="p-2 text-right">Unit.</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-gray-900 dark:text-white">{item.productName}</td>
                          <td className="p-2 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                          <td className="p-2 text-right text-gray-600 dark:text-gray-300">R$ {item.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-medium text-gray-900 dark:text-white">R$ {item.total.toFixed(2)}</td>
                          <td className="p-2">
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                  Nenhum item adicionado
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 sticky top-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Calculator size={20} />
                Resumo
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Frete</span>
                  <span>-</span>
                </div>
                <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 flex justify-between font-bold text-lg text-red-600 dark:text-red-500">
                  <span>Total</span>
                  <span>R$ {orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                <textarea 
                  className="w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-2 text-sm h-24 bg-white dark:bg-zinc-950 dark:text-white"
                  placeholder="Obs internas ou para nota fiscal..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              
              {settings && orderTotal < settings.minOrderValue && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg text-sm mb-4">
                  Atenção: Pedido abaixo do valor mínimo (R$ {settings.minOrderValue})
                </div>
              )}

              <button 
                onClick={handleSave}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} /> Salvar Pedido
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- PRINT TEMPLATE (Visible only on Print) --- */}
      <div className="hidden print:block bg-white text-black p-8 font-serif">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
           <div>
              <h1 className="text-4xl font-bold uppercase tracking-widest text-red-700">ObraOne</h1>
              <p className="text-sm text-gray-600 mt-1">Soluções em Construção Civil</p>
           </div>
           <div className="text-right">
              <h2 className="text-xl font-bold uppercase">Pedido #{id?.slice(0,8) || 'NOVO'}</h2>
              <p className="text-sm">Data: {new Date().toLocaleDateString()}</p>
              <p className="text-sm font-bold mt-2">{status.toUpperCase()}</p>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
           <div className="border border-gray-300 p-4 rounded">
              <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b pb-1">Cliente</h3>
              <p className="font-bold text-lg">{clientData?.name || 'Cliente não selecionado'}</p>
              <p>{clientData?.businessName}</p>
              <p>Doc: {clientData?.document}</p>
              <p>{clientData?.address}, {clientData?.addressNumber}</p>
              <p>{clientData?.city} - {clientData?.state}</p>
              <p>{clientData?.phone}</p>
           </div>
           <div className="border border-gray-300 p-4 rounded">
              <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 border-b pb-1">Detalhes</h3>
              <p><strong>Vendedor:</strong> {user?.name}</p>
              <p><strong>Frete:</strong> {freightType || 'Não definido'}</p>
              <p><strong>Cond. Pagamento:</strong> {settings?.commercialPolicy.substring(0, 30)}...</p>
              <div className="mt-2 bg-gray-100 p-2 text-sm italic">
                 Obs: {notes}
              </div>
           </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8 border-collapse">
           <thead>
              <tr className="bg-gray-200 text-sm uppercase">
                 <th className="border border-gray-400 p-2 text-left">Item / Produto</th>
                 <th className="border border-gray-400 p-2 text-center w-20">Qtd</th>
                 <th className="border border-gray-400 p-2 text-right w-32">Unitário</th>
                 <th className="border border-gray-400 p-2 text-right w-32">Total</th>
              </tr>
           </thead>
           <tbody>
              {items.map((item, idx) => (
                 <tr key={idx}>
                    <td className="border border-gray-400 p-2">{item.productName}</td>
                    <td className="border border-gray-400 p-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-400 p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="border border-gray-400 p-2 text-right font-medium">R$ {item.total.toFixed(2)}</td>
                 </tr>
              ))}
              {/* Empty Rows Filler */}
              {Array.from({length: Math.max(0, 10 - items.length)}).map((_, i) => (
                 <tr key={`empty-${i}`}>
                    <td className="border border-gray-400 p-2 text-white">.</td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                 </tr>
              ))}
           </tbody>
           <tfoot>
              <tr className="bg-gray-100 font-bold">
                 <td colSpan={3} className="border border-gray-400 p-2 text-right uppercase">Total do Pedido</td>
                 <td className="border border-gray-400 p-2 text-right text-lg">R$ {orderTotal.toFixed(2)}</td>
              </tr>
           </tfoot>
        </table>

        {/* Footer / Signatures */}
        <div className="mt-12 pt-8 border-t border-gray-300 flex justify-between gap-10">
           <div className="flex-1 text-center">
              <div className="border-t border-black w-2/3 mx-auto pt-2"></div>
              <p className="text-sm font-medium">Assinatura do Cliente</p>
           </div>
           <div className="flex-1 text-center">
              <div className="border-t border-black w-2/3 mx-auto pt-2"></div>
              <p className="text-sm font-medium">Assinatura do Vendedor</p>
           </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-12">Impresso em {new Date().toLocaleString()} via ObraOne System</p>
      </div>
    </>
  );
};

export default OrderForm;