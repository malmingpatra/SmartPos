
import React, { useState, useEffect } from 'react';
import { Customer, User, Role, normalizeRole } from '../../types';

interface FormMemberProps {
  customer: Customer | null;
  users?: User[]; // Untuk pilihan owner jika Admin
  isAdmin?: boolean;
  onClose: () => void;
  onSave: (c: Customer) => void;
  onDelete?: (id: string) => void;
}

const FormMember: React.FC<FormMemberProps> = ({ customer, users = [], isAdmin = false, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Customer>(customer || {
    id: crypto.randomUUID(),
    name: '',
    phone: '',
    total_spent: 0,
    created_at: new Date().toISOString(),
    created_by: '',
    created_by_role: '' as any
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleOwnerChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        created_by: selectedUser.id,
        created_by_role: normalizeRole(selectedUser.role)
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 leading-none">Nama Member</label>
          <input required type="text" placeholder="Masukkan nama pelanggan..." className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-orange-400 transition font-bold text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 leading-none">Nomor HP</label>
          <input required type="tel" placeholder="081234567xxx" className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-orange-400 transition font-bold text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} />
        </div>
        
        {/* Fitur Pindah Kepemilikan untuk Admin */}
        {isAdmin && (
          <div className="bg-orange-50/30 p-3 rounded-2xl border border-orange-50">
            <label className="block text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2 ml-1 leading-none">Petugas Terkait (Admin Only)</label>
            <select 
              className="w-full bg-white border border-gray-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-orange-400 transition font-bold text-gray-800 text-xs shadow-sm"
              value={formData.created_by}
              onChange={(e) => handleOwnerChange(e.target.value)}
            >
              <option value="">Pilih Petugas...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}

        {customer && (
          <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Belanja</span>
              <span className="text-sm font-black text-emerald-600 tracking-tight">Rp {formData.total_spent.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <i className="fas fa-wallet text-xs"></i>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 pt-6">
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">Batal</button>
          <button type="submit" className="flex-[2] px-4 py-3.5 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all">SIMPAN</button>
        </div>
        {customer && onDelete && (
          <button 
            type="button" 
            onClick={() => onDelete(customer.id)}
            className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
          >
            <i className="fas fa-trash-alt mr-2"></i> Hapus Member
          </button>
        )}
      </div>
    </form>
  );
};

export default FormMember;
