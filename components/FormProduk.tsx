
import React, { useState } from 'react';
import { Product } from '../types';

interface FormProdukProps {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
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

const FormProduk: React.FC<FormProdukProps> = ({ product, onClose, onSave }) => {
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">{product ? 'Edit' : 'Tambah'} Produk</h2>
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          <i className="fas fa-exclamation-circle mr-2"></i>{errorMsg}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
        <input required type="text" className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <input required type="text" className="w-full border p-2 rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
          <input type="number" inputMode="numeric" className="w-full border p-2 rounded-lg" value={formData.price === 0 ? '' : formData.price} onChange={e => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : 0 })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
          <input type="number" inputMode="numeric" className="w-full border p-2 rounded-lg" value={formData.stock === 0 ? '' : formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value ? Number(e.target.value) : 0 })} />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Batal</button>
        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Simpan</button>
      </div>
    </form>
  );
};

export default FormProduk;
