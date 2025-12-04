import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Upload, Download, FileSpreadsheet, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { Product } from '../types';
import { storageService } from '../services/storageService';
import * as XLSX from 'xlsx';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [newCategory, setNewCategory] = useState('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCode, setSearchCode] = useState('');

  // Import Logic
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'update' | 'replace'>('update');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      storageService.getProducts(),
      storageService.getCategories()
    ]);
    setProducts(p);
    setCategories(c);
    setLoading(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave = {
      ...currentProduct,
      price: Number(currentProduct.price),
      priceRegional: currentProduct.priceRegional ? Number(currentProduct.priceRegional) : undefined,
      stock: Number(currentProduct.stock),
      salesMultiple: Number(currentProduct.salesMultiple || 1),
    } as Product;

    const success = await storageService.saveProduct(productToSave);
    if (success) {
      await fetchData();
      setIsModalOpen(false);
      setCurrentProduct({});
    } else {
      alert("Erro ao salvar produto.");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory && !categories.includes(newCategory)) {
      await storageService.saveCategory(newCategory);
      await fetchData();
      setNewCategory('');
      setIsCategoryModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este item?')) {
      await storageService.deleteProduct(id);
      await fetchData();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Import Logic (XLSX) ---
  const downloadModel = () => {
    // Define Headers matching requirements
    const headers = [
      "Código do Produto",
      "Nome do Produto",
      "Preço de Tabela",
      "Categoria",
      "Unidade de Medida",
      "Multiplo de Venda",
      "Preço PR/SC/RS/EJ/MG",
      "Preço Demais Estados"
    ];

    // Create example data
    const data = [
      {
        "Código do Produto": "EX001",
        "Nome do Produto": "Cimento CP-II 50kg",
        "Preço de Tabela": 32.50,
        "Categoria": "Construção",
        "Unidade de Medida": "SC",
        "Multiplo de Venda": 1,
        "Preço PR/SC/RS/EJ/MG": 35.00,
        "Preço Demais Estados": 32.50
      },
      {
        "Código do Produto": "EX002",
        "Nome do Produto": "Tinta Acrílica Branca 18L",
        "Preço de Tabela": 250.00,
        "Categoria": "Pintura",
        "Unidade de Medida": "GL",
        "Multiplo de Venda": 1,
        "Preço PR/SC/RS/EJ/MG": 260.00,
        "Preço Demais Estados": 250.00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    
    // Adjust column widths for better visibility
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Importação");

    XLSX.writeFile(workbook, "Modelo_Produtos_ObraOne.xlsx");
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get JSON
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const importedProducts: Product[] = [];
      const newCategories = new Set(categories);

      jsonData.forEach((row: any) => {
        // Validation: Required fields
        const code = row["Código do Produto"];
        const name = row["Nome do Produto"];
        const price = row["Preço de Tabela"];
        const category = row["Categoria"];

        if (code && name && price !== undefined && category) {
          // Logic for prices
          // If "Preço Demais Estados" is present, use it as base price (overwriting Tabela if needed), 
          // otherwise use "Preço de Tabela"
          const basePrice = row["Preço Demais Estados"] !== undefined ? parseFloat(row["Preço Demais Estados"]) : parseFloat(row["Preço de Tabela"]);
          const regionalPrice = row["Preço PR/SC/RS/EJ/MG"] !== undefined ? parseFloat(row["Preço PR/SC/RS/EJ/MG"]) : undefined;

          // Add category to set if new
          if (category) newCategories.add(category);

          importedProducts.push({
            id: Math.random().toString(36).substr(2, 9), // Temp ID, storage will handle logic
            code: String(code).trim(),
            name: String(name).trim(),
            category: String(category).trim(),
            price: basePrice,
            priceRegional: regionalPrice,
            stock: 0, // Default to 0 stock on import as per request columns (no stock column requested)
            unit: row["Unidade de Medida"] ? String(row["Unidade de Medida"]).trim() : 'UN',
            salesMultiple: row["Multiplo de Venda"] ? parseInt(row["Multiplo de Venda"]) : 1
          });
        }
      });

      if (importedProducts.length === 0) {
        alert("Nenhum produto válido encontrado. Verifique se as colunas obrigatórias estão preenchidas.");
        return;
      }

      // 1. Save new categories
      const categoriesToSave = Array.from(newCategories).filter(c => !categories.includes(c));
      for (const cat of categoriesToSave) {
        await storageService.saveCategory(cat);
      }

      // 2. Handle Import Mode
      if (importMode === 'replace') {
        // Delete all current products then add new ones
        // WARNING: Deleting all in Supabase one by one is slow. A better way would be needed for production.
        // For now, we will just loop delete.
        for (const p of products) {
          await storageService.deleteProduct(p.id);
        }
      }

      // 3. Save Products (Upsert Logic handled in service? No, logic here or service)
      // We will loop save.
      let savedCount = 0;
      for (const imp of importedProducts) {
        // Check if exists by code if update mode
        const existing = products.find(p => p.code === imp.code);
        if (existing && importMode === 'update') {
          await storageService.saveProduct({ ...imp, id: existing.id, image: existing.image });
        } else {
          await storageService.saveProduct(imp);
        }
        savedCount++;
      }

      setIsImportModalOpen(false);
      setImportFile(null);
      await fetchData();
      alert(`${savedCount} produtos processados com sucesso!`);

    } catch (error) {
      console.error(error);
      alert("Erro ao processar arquivo. Certifique-se de que é um arquivo Excel válido (.xlsx).");
    }
  };

  // --- Filtering ---
  const filtered = products.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const catMatch = p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const codeMatch = searchCode ? p.code.toLowerCase().includes(searchCode.toLowerCase()) : true;
    
    return (nameMatch || catMatch) && codeMatch;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando produtos...</div>;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Produtos</h2>
          <p className="text-sm text-gray-500">Gerencie seu catálogo de itens</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
          >
            <PlusCircle size={16} /> Nova Categoria
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <FileSpreadsheet size={16} /> Importar Itens
          </button>
          <button 
            onClick={() => { setCurrentProduct({ salesMultiple: 1, unit: 'UN' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 text-sm"
          >
            <Plus size={16} /> Novo Item
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou categoria..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar por Código / SKU..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
          </div>
      </div>
      
      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
              <tr>
                <th className="px-6 py-4 w-16">Img</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Estoque</th>
                <th className="px-6 py-4 text-right">Preço (Base)</th>
                <th className="px-6 py-4 text-right">Preço (Reg)</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filtered.map(prod => (
                <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded bg-gray-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                      {prod.image ? (
                        <img src={prod.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm">{prod.code}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {prod.name}
                    <span className="block text-xs text-gray-400 font-normal">
                       {prod.unit} - Mult: {prod.salesMultiple}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">
                    <span className="bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{prod.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{prod.stock}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">R$ {prod.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                    {prod.priceRegional ? `R$ ${prod.priceRegional.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setCurrentProduct(prod); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-2 rounded">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 p-2 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* PRODUCT MODAL */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh] border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                {currentProduct.id ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              
              {/* Image Upload */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden relative group">
                  {currentProduct.image ? (
                    <img src={currentProduct.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-gray-400" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Alterar
                  </div>
                </div>
                <div className="flex-1">
                   <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem do Produto</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">Clique na caixa ao lado para fazer upload de uma imagem.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código (SKU/Ref)</label>
                   <input required type="text" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.code || ''} onChange={e => setCurrentProduct({...currentProduct, code: e.target.value})} />
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                   <select 
                    required 
                    className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2"
                    value={currentProduct.category || ''}
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                   >
                     <option value="">Selecione...</option>
                     {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto</label>
                <input required type="text" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                   <input placeholder="Ex: UN, CX, KG" type="text" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.unit || ''} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Múltiplo de Venda</label>
                   <input type="number" min="1" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.salesMultiple || 1} onChange={e => setCurrentProduct({...currentProduct, salesMultiple: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Preço Base (R$)</label>
                   <input required type="number" step="0.01" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Preço Regional (R$)</label>
                   <p className="text-xs text-gray-500 mb-1">PR / SC / RS / EJ / MG</p>
                   <input type="number" step="0.01" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.priceRegional || ''} onChange={e => setCurrentProduct({...currentProduct, priceRegional: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque Atual</label>
                 <input required type="number" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={currentProduct.stock || ''} onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800">
             <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
               <h3 className="font-bold text-lg text-gray-800 dark:text-white">Nova Categoria</h3>
             </div>
             <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Categoria</label>
                  <input required autoFocus type="text" className="w-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg p-2" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-3 py-2 text-sm bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">Criar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800">
             <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
               <h3 className="font-bold text-lg text-gray-800 dark:text-white">Importar Produtos</h3>
               <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
             </div>
             <div className="p-6 space-y-6">
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-2 font-medium">1. Baixe a planilha modelo (Excel)</p>
                  <button onClick={downloadModel} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">
                    <Download size={16} /> Download Modelo.xlsx
                  </button>
                </div>

                <div>
                   <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Escolha o arquivo preenchido (.xlsx)</p>
                   <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-red-50 file:text-red-700
                      hover:file:bg-red-100
                    "
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                   />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3. Opções de Importação</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="update" 
                        checked={importMode === 'update'} 
                        onChange={() => setImportMode('update')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <span className="block text-sm font-bold text-gray-800 dark:text-white">Atualizar e Adicionar</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Mantém produtos atuais, atualiza se encontrar mesmo Código e adiciona novos.</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800">
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="replace" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <span className="block text-sm font-bold text-gray-800 dark:text-white">Substituir Tudo</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 text-red-500">Atenção: Apaga todos os produtos atuais e cadastra os da planilha.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleImport}
                  disabled={!importFile}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> Processar Importação
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;