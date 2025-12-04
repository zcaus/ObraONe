import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, X, MapPin, Phone, Building2, UserCircle, Filter } from 'lucide-react';
import { Client, ClientContact } from '../types';
import { storageService } from '../services/storageService';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'endereco' | 'contatos'>('geral');
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({ contacts: [], personType: 'PJ' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Segment Filter State
  const [selectedSegment, setSelectedSegment] = useState('');

  // Contact Form State
  const [newContact, setNewContact] = useState<Partial<ClientContact>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const data = await storageService.getClients();
    setClients(data);
    setLoading(false);
  };

  const segments = useMemo(() => {
    const uniqueSegments = new Set(clients.map(c => c.segment).filter(Boolean));
    return Array.from(uniqueSegments) as string[];
  }, [clients]);

  const openNewClient = () => {
    setCurrentClient({ contacts: [], taxException: false, personType: 'PJ' });
    setActiveTab('geral');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentClient.document || !currentClient.businessName || !currentClient.name || !currentClient.phone) {
      alert("Por favor preencha os campos obrigatórios (*)");
      return;
    }

    const saved = await storageService.saveClient(currentClient as Client);
    if (saved) {
      await fetchClients();
      setIsModalOpen(false);
      setCurrentClient({ contacts: [] });
    } else {
      alert("Erro ao salvar cliente.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await storageService.deleteClient(id);
      await fetchClients();
    }
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      alert("Nome e Telefone são obrigatórios para o contato.");
      return;
    }
    const contact: ClientContact = {
      id: Math.random().toString(36).substr(2, 9),
      name: newContact.name || '',
      role: newContact.role || '',
      phone: newContact.phone || '',
      email: newContact.email || ''
    };
    setCurrentClient({
      ...currentClient,
      contacts: [...(currentClient.contacts || []), contact]
    });
    setNewContact({});
  };

  const removeContact = (contactId: string) => {
    setCurrentClient({
      ...currentClient,
      contacts: currentClient.contacts?.filter(c => c.id !== contactId)
    });
  };

  const filtered = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.document.includes(searchTerm) ||
      c.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSegment = selectedSegment ? c.segment === selectedSegment : true;

    return matchesSearch && matchesSegment;
  });

  const isPF = currentClient.personType === 'PF';

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Clientes</h2>
        <button 
          onClick={openNewClient}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
        >
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-4 flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome fantasia, razão social ou CPF/CNPJ..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter size={18} className="text-gray-400" />
            <select
              className="w-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
            >
              <option value="">Todos os Segmentos</option>
              {segments.map(seg => (
                <option key={seg} value={seg}>{seg}</option>
              ))}
            </select>
          </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Nome / Fantasia</th>
                <th className="px-6 py-4">Segmento</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Cidade/UF</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{client.businessName}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">
                    {client.segment ? (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded text-xs border border-gray-200 dark:border-zinc-700">
                        {client.segment}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                     {client.personType === 'PF' ? 'PF' : 'PJ'} - {client.document}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{client.city}/{client.state}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => { setCurrentClient(client); setIsModalOpen(true); setActiveTab('geral'); }}
                      className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-2 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 p-2 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                {currentClient.id ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-zinc-800 shrink-0">
              <button 
                onClick={() => setActiveTab('geral')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'geral' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-500' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                <Building2 size={16} /> Principal
              </button>
              <button 
                onClick={() => setActiveTab('endereco')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'endereco' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-500' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                <MapPin size={16} /> Endereço
              </button>
              <button 
                onClick={() => setActiveTab('contatos')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'contatos' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-500' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
              >
                <UserCircle size={16} /> Contatos
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-zinc-950">
              <form id="clientForm" onSubmit={handleSave}>
                {activeTab === 'geral' && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Person Type Selector */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                       <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide"></label>
                       <div className="flex gap-6">
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                             type="radio" 
                             name="personType" 
                             value="PJ"
                             checked={currentClient.personType !== 'PF'}
                             onChange={() => setCurrentClient({...currentClient, personType: 'PJ'})}
                             className="w-4 h-4 text-red-600 focus:ring-red-500"
                           />
                           <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Pessoa Jurídica</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                             type="radio" 
                             name="personType" 
                             value="PF"
                             checked={currentClient.personType === 'PF'}
                             onChange={() => setCurrentClient({...currentClient, personType: 'PF'})}
                             className="w-4 h-4 text-red-600 focus:ring-red-500"
                           />
                           <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Pessoa Física</span>
                         </label>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                           {isPF ? 'CPF' : 'CNPJ'} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required 
                          placeholder={isPF ? "000.000.000-00" : "00.000.000/0000-00"}
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.document || ''} 
                          onChange={e => setCurrentClient({...currentClient, document: e.target.value})}
                        />
                      </div>
                      {!isPF && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Inscrição Estadual
                        </label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.stateRegistration || ''} 
                          onChange={e => setCurrentClient({...currentClient, stateRegistration: e.target.value})}
                        />
                      </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isPF ? 'Nome Completo' : 'Razão Social'} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                        value={currentClient.businessName || ''} 
                        onChange={e => setCurrentClient({...currentClient, businessName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isPF ? 'Apelido / Como gosta de ser chamado' : 'Nome Fantasia'} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                        value={currentClient.name || ''} 
                        onChange={e => setCurrentClient({...currentClient, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone Principal <span className="text-red-500">*</span></label>
                        <input 
                          required 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.phone || ''} 
                          onChange={e => setCurrentClient({...currentClient, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Principal</label>
                        <input 
                          type="email" 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.email || ''} 
                          onChange={e => setCurrentClient({...currentClient, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Segmento</label>
                        <input 
                          placeholder="Ex: Varejo, Indústria..."
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.segment || ''} 
                          onChange={e => setCurrentClient({...currentClient, segment: e.target.value})}
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            checked={currentClient.taxException || false}
                            onChange={e => setCurrentClient({...currentClient, taxException: e.target.checked})}
                          />
                          <span className="text-sm font-medium">Exceção Fiscal / Isento</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Informações Adicionais</label>
                      <textarea 
                        className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none h-20"
                        value={currentClient.additionalInfo || ''} 
                        onChange={e => setCurrentClient({...currentClient, additionalInfo: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'endereco' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.zipCode || ''} 
                          onChange={e => setCurrentClient({...currentClient, zipCode: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço (Rua/Av)</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.address || ''} 
                          onChange={e => setCurrentClient({...currentClient, address: e.target.value})}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.addressNumber || ''} 
                          onChange={e => setCurrentClient({...currentClient, addressNumber: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Complemento</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.complement || ''} 
                          onChange={e => setCurrentClient({...currentClient, complement: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.neighborhood || ''} 
                          onChange={e => setCurrentClient({...currentClient, neighborhood: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.city || ''} 
                          onChange={e => setCurrentClient({...currentClient, city: e.target.value})}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                        <input 
                          className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                          value={currentClient.state || ''} 
                          onChange={e => setCurrentClient({...currentClient, state: e.target.value})}
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contatos' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Add Contact Box */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Adicionar Novo Contato</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                         <input 
                          placeholder="Nome"
                          className="border border-gray-300 dark:border-zinc-700 rounded p-2 text-sm bg-gray-50 dark:bg-zinc-950 dark:text-white"
                          value={newContact.name || ''}
                          onChange={e => setNewContact({...newContact, name: e.target.value})}
                         />
                         <input 
                          placeholder="Cargo"
                          className="border border-gray-300 dark:border-zinc-700 rounded p-2 text-sm bg-gray-50 dark:bg-zinc-950 dark:text-white"
                          value={newContact.role || ''}
                          onChange={e => setNewContact({...newContact, role: e.target.value})}
                         />
                         <input 
                          placeholder="Telefone"
                          className="border border-gray-300 dark:border-zinc-700 rounded p-2 text-sm bg-gray-50 dark:bg-zinc-950 dark:text-white"
                          value={newContact.phone || ''}
                          onChange={e => setNewContact({...newContact, phone: e.target.value})}
                         />
                         <input 
                          placeholder="Email"
                          className="border border-gray-300 dark:border-zinc-700 rounded p-2 text-sm bg-gray-50 dark:bg-zinc-950 dark:text-white"
                          value={newContact.email || ''}
                          onChange={e => setNewContact({...newContact, email: e.target.value})}
                         />
                      </div>
                      <button 
                        type="button"
                        onClick={addContact}
                        className="w-full bg-zinc-800 text-white dark:bg-zinc-700 py-2 rounded text-sm hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Adicionar Contato à Lista
                      </button>
                    </div>

                    {/* Contacts List */}
                    <div className="space-y-3">
                      {currentClient.contacts?.map((contact, index) => (
                        <div key={contact.id || index} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
                           <div>
                             <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{contact.name}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{contact.role} • {contact.phone}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                           </div>
                           <button 
                            type="button"
                            onClick={() => removeContact(contact.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                      {(!currentClient.contacts || currentClient.contacts.length === 0) && (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          Nenhum contato adicional cadastrado.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 shrink-0 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                form="clientForm"
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 font-medium"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;