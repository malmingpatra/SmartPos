import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, User, Role, normalizeRole } from '../../types';
import { supabaseService } from '../../supabase';
import FormProduk from '../Formulir/FormProduk';

interface AdminProdukProps {
  products: Product[];
  onProductsChange: () => Promise<void> | void;
  currentUser: User;
  addLog: (msg: string) => void;
}

const AdminProductRow = ({ p, onEdit, onDelete, selected, onSelect, showCheckbox }: { p: Product, onEdit: (p: Product) => void, onDelete: (id: string) => void, selected: boolean, onSelect: (id: string, selected: boolean) => void, showCheckbox: boolean }) => {
  const [isActive, setIsActive] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        setCanScroll(contentWidth > containerWidth);
      }
    };
    checkOverflow();
    const observer = new ResizeObserver(() => checkOverflow());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [p.name, p.category]);

  const isScrolling = isActive && canScroll;

  return (
    <tr 
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      className={`transition-colors select-none ${selected ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
    >
      <td className="px-1 py-4 w-10 text-center border-r border-gray-100 shrink-0">
        {showCheckbox && (
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
            checked={selected} 
            onChange={(e) => onSelect(p.id, e.target.checked)} 
          />
        )}
      </td>
      <td className="px-3 py-4">
        <div ref={containerRef} className="overflow-hidden">
          <div className={isScrolling ? 'animate-marquee-seamless flex w-max gap-10' : 'flex'}>
            <div ref={contentRef} className="flex flex-col gap-0.5 shrink-0 min-w-full">
               <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase shrink-0 w-fit whitespace-nowrap">
                 {p.category}
               </span>
               <span className={`product-name-span font-bold text-gray-800 block leading-tight whitespace-nowrap ${!isScrolling && 'truncate'}`}>
                 {p.name}
               </span>
            </div>
            {isScrolling && (
              <div className="flex flex-col gap-0.5 shrink-0 min-w-full">
                 <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase shrink-0 w-fit whitespace-nowrap">
                   {p.category}
                 </span>
                 <span className="font-bold text-gray-800 leading-tight whitespace-nowrap">
                   {p.name}
                 </span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-1">
          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black shadow-sm border border-emerald-100">
            Rp {p.price.toLocaleString()}
          </span>
        </div>
      </td>
      <td className="px-1 py-4 text-center w-16 shrink-0">
        <span className={`inline-block px-1 md:px-2 py-1 rounded text-[10px] font-black ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{p.stock}</span>
      </td>
      <td className="px-1 py-4 text-center w-12 shrink-0">
        <div className="flex justify-center gap-1 md:gap-2">
          <button onClick={() => onEdit(p)} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition active:scale-95 flex items-center justify-center"><i className="fas fa-edit"></i></button>
        </div>
      </td>
    </tr>
  );
};

const AdminProduk: React.FC<AdminProdukProps> = ({ products, onProductsChange, currentUser, addLog }) => {
  const userRole = normalizeRole(currentUser.role);
  
  // Roles with full bulk/checkbox access
  const hasBulkAccess = userRole === Role.ADMIN || userRole === Role.MANAGER || userRole === Role.GUDANG_MASTER;
  
  const isGudang = userRole === Role.GUDANG;
  const isKasirSales = userRole === Role.KASIR || userRole === Role.SALES;

  const [productPage, setProductPage] = useState(1);
  const itemsPerPage = 10;
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productFilterCategory, setProductFilterCategory] = useState('all');

  const [confirmModal, setConfirmModal] = useState<{ show: boolean, type: 'single' | 'bulk', id?: string }>({ show: false, type: 'single' });

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState('');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkCategory = async () => {
    if (!bulkCategory.trim()) return alert('Pilih kategori terlebih dahulu');
    try {
      await supabaseService.bulkUpdateProductCategory(Array.from(selectedProducts), bulkCategory.trim());
      onProductsChange();
      setSelectedProducts(new Set());
      setBulkCategory('');
      addLog(`Berhasil mengganti kategori`);
    } catch (err: any) {
      addLog(`Gagal mengganti kategori`);
      console.error(err);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;
    setConfirmModal({ show: true, type: 'bulk' });
  };

  const filteredProducts = useMemo(() => {
    const list = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                           p.category.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productFilterCategory === 'all' || p.category === productFilterCategory;
      return matchesSearch && matchesCategory;
    });
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, productSearch, productFilterCategory]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category))).sort();
    return unique;
  }, [products]);

  const handleDeleteProduct = (id: string) => { 
    addLog("Pencet tombol hapus produk id: " + id);
    setConfirmModal({ show: true, type: 'single', id });
  };

  const processDelete = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ show: false, type: 'single' });
    
    if (type === 'single' && id) {
      try {
        await supabaseService.deleteProduct(id);
        onProductsChange();
        addLog(`Berhasil menghapus`);
      } catch (err: any) {
        addLog(`Gagal menghapus`);
        console.error(err);
      }
    } else if (type === 'bulk') {
      try {
        await supabaseService.bulkDeleteProducts(Array.from(selectedProducts));
        onProductsChange();
        setSelectedProducts(new Set());
        addLog(`Berhasil menghapus`);
      } catch (err: any) {
        addLog(`Gagal menghapus`);
        console.error(err);
      }
    }
  };

  return (
    <>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Search and Filters - Refined Balanced Box Design (Floating Sticky) */}
        <div className="sticky top-[74px] z-20 -mx-1 pt-0.5 pb-2 no-print pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl border border-gray-100 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] flex flex-col gap-3 items-stretch pointer-events-auto transition-all duration-300">
            <div className="relative w-full">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Cari di inventaris..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none text-xs font-bold transition-all placeholder:text-gray-300 shadow-sm" 
                value={productSearch} 
                onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }} 
              />
            </div>
            <div className="flex gap-3 w-full h-11">
              <div className="flex-[60] relative h-full">
                <select 
                  className="w-full h-full pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl appearance-none focus:outline-none focus:bg-white focus:border-blue-400 text-xs font-bold text-gray-700 shadow-sm cursor-pointer hover:border-blue-200 transition-all"
                  value={productFilterCategory}
                  onChange={(e) => { setProductFilterCategory(e.target.value); setProductPage(1); }}
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
              </div>
              <button 
                onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} 
                className="flex-[40] bg-blue-600 text-white h-full rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md shadow-blue-100 active:scale-95 transition-all"
              >
                <i className="fas fa-plus"></i> <span className="truncate">Tambah</span>
              </button>
            </div>
          </div>
        </div>

        {hasBulkAccess && selectedProducts.size > 0 && (
          <div className="fixed bottom-32 right-4 flex flex-col gap-1 bg-white/95 backdrop-blur-xl p-1 rounded-xl border border-gray-100 shadow-[0_15px_40px_rgba(59,130,246,0.15)] z-[200] animate-in fade-in slide-in-from-right-5 duration-300">
            {/* Category Selection Dropdown */}
            <div className="relative group">
              <select 
                className="w-10 h-10 bg-blue-50/50 border border-transparent rounded-lg appearance-none focus:outline-none focus:border-blue-300 text-[10px] font-bold text-transparent transition-all cursor-pointer"
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                title="Pilih Kategori Baru"
              >
                <option value="" disabled>Kategori...</option>
                {categories.map(cat => <option key={cat} value={cat} className="text-gray-900">{cat}</option>)}
              </select>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-blue-500 group-hover:text-blue-700 transition-colors">
                <i className="fas fa-tag text-xs"></i>
              </div>
            </div>

            {/* Save/Change Action */}
            <button 
              onClick={handleBulkCategory}
              disabled={!bulkCategory}
              className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-200 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
              title="Ubah Kategori Produk"
            >
              <i className="fas fa-save text-xs"></i>
            </button>

            {/* Delete Action */}
            <button 
              onClick={handleBulkDelete}
              className="w-10 h-10 bg-red-50 text-red-500 border border-red-100 rounded-lg flex items-center justify-center active:scale-90 transition-all hover:bg-red-500 hover:text-white disabled:opacity-30"
              title="Hapus Produk"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>

            <div className="h-px bg-gray-100 mx-1.5 my-0.5"></div>

            {/* Count Badge (Click to Cancel) */}
            <button 
              onClick={() => setSelectedProducts(new Set())}
              className="w-10 h-10 bg-blue-600 text-white rounded-lg flex flex-col items-center justify-center shadow-md shadow-blue-200 active:scale-95 transition-all group relative overflow-hidden"
              title="Klik untuk Batalkan Pilihan"
            >
              <span className="text-[10px] font-black group-hover:hidden">{selectedProducts.size}</span>
              <i className="fas fa-times text-[10px] hidden group-hover:block"></i>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left table-fixed min-w-[300px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-1 py-4 w-10 text-center border-r border-gray-100 shrink-0">
                     {hasBulkAccess && (
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                         checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length} 
                         onChange={(e) => handleSelectAll(e.target.checked)} 
                       />
                     )}
                  </th>
                  <th className="px-3 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Produk</th>
                  <th className="px-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16 shrink-0">Stok</th>
                  <th className="px-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-12 shrink-0">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredProducts.slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage).map(p => (
                  <AdminProductRow 
                    key={p.id} 
                    p={p} 
                    onEdit={(p) => { setEditingProduct(p); setIsFormOpen(true); }}
                    onDelete={handleDeleteProduct}
                    selected={selectedProducts.has(p.id)}
                    onSelect={handleSelect}
                    showCheckbox={hasBulkAccess}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button 
              disabled={productPage === 1}
              onClick={() => setProductPage(prev => prev - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[11px] font-black text-gray-500 shadow-sm">
              {productPage} / {Math.ceil(filteredProducts.length / itemsPerPage)}
            </div>
            <button 
              disabled={productPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
              onClick={() => setProductPage(prev => prev + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 animate-in zoom-in duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
            <FormProduk 
              key={editingProduct ? editingProduct.id : 'new'}
              product={editingProduct} 
              onClose={() => setIsFormOpen(false)} 
              onDelete={(id) => { setIsFormOpen(false); handleDeleteProduct(id); }}
              onSave={async (p) => { 
                try {
                  await supabaseService.saveProduct(p); 
                  onProductsChange(); 
                  setIsFormOpen(false); 
                  addLog(`Berhasil ${editingProduct ? 'mengubah' : 'menambah'} produk`);
                } catch (err: any) {
                  addLog(`Gagal ${editingProduct ? 'mengubah' : 'menambah'} produk`);
                }
              }} 
            />
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-6 mx-auto">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-xl font-black text-center text-gray-800 mb-2 tracking-tight">
              {confirmModal.type === 'bulk' ? `Hapus ${selectedProducts.size} Produk` : 'Konfirmasi Hapus'}
            </h2>
            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">
              {confirmModal.type === 'bulk' 
                ? 'Semua produk terpilih akan dihapus permanen.' 
                : 'Data akan dihapus permanen dari sistem.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ show: false, type: 'single' })} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase">Batal</button>
              <button onClick={processDelete} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-red-100">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProduk;
