
import React, { useState } from 'react';
import { User, Role } from '../types';

interface FormStafProps {
  user: User | null;
  onClose: () => void;
  onSave: (u: User) => void;
}

const FormStaf: React.FC<FormStafProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<User>(user || {
    id: crypto.randomUUID(),
    name: '',
    username: '',
    pin: '',
    role: Role.KASIR
  });

  const [internalError, setInternalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) {
      alert('Username wajib diisi');
      return;
    }
    console.log("Submitting UserForm with data:", formData);
    if (formData.pin.length < 3 || formData.pin.length > 12) {
      alert('PIN harus berukuran 3 sampai 12 digit (minimal 3)');
      return;
    }
    try {
      console.log("Calling onSave callback...");
      setInternalError(null);
      await onSave(formData);
      console.log("onSave callback finished successfully");
    } catch (err: any) {
      console.error("UserForm save error:", err);
      setInternalError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">{user ? 'Edit Profil User' : 'Tambah User Baru'}</h2>
      
      {internalError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
          <p className="text-red-700 text-[10px] font-black uppercase tracking-widest mb-1">Gagal Menyimpan</p>
          <p className="text-red-600 text-xs font-bold">{internalError}</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
          <input required type="text" placeholder="Contoh: Budi Santoso" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
          <input required type="text" placeholder="budi123" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
        </div>

        <div className="flex gap-4">
          <div className="w-[60%]">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">PIN (3-12 Digit)</label>
            <input required type="password" maxLength={12} inputMode="numeric" placeholder="••••" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl tracking-[0.3em] text-center font-black focus:outline-none transition" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
            <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none transition font-bold" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })}>
              {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl">Batal</button>
        <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black">Simpan User</button>
      </div>
    </form>
  );
};

export default FormStaf;
