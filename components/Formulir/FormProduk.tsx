
import React, { useState } from 'react';
import { Product } from '../../types';

interface FormProdukProps {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
  onDelete?: (id: string) => void;
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const FormProduk: React.FC<FormProdukProps> = ({ product, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Product>(() => product || {
    id: generateUUID(),
    name: '',
    category: '',
    price: 0,
    stock: 0
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await onSave(formData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan produk');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          <i className="fas fa-exclamation-circle mr-2"></i>{errorMsg}
        </div>
      )}
      
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Produk</label>
        <input required type="text" placeholder="Masukkan nama produk..." className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none transition font-bold text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Kategori</label>
        <input required type="text" placeholder="Makanan, Minuman, dsb..." className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none transition font-bold text-sm" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Harga (Rp)</label>
          <input type="number" inputMode="numeric" placeholder="0" className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none transition font-bold text-sm" value={formData.price === 0 ? '' : formData.price} onChange={e => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : 0 })} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Stok</label>
          <input type="number" inputMode="numeric" placeholder="0" className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none transition font-bold text-sm" value={formData.stock === 0 ? '' : formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value ? Number(e.target.value) : 0 })} />
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-6">
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Batal</button>
          <button type="submit" className="flex-[2] px-4 py-3.5 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all">SIMPAN</button>
        </div>
        {product && onDelete && (
          <button 
            type="button" 
            onClick={() => onDelete(product.id)}
            className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
          >
            <i className="fas fa-trash-alt mr-2"></i> Hapus Produk
          </button>
        )}
      </div>
    </form>
  );
};

export default FormProduk;
