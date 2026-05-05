import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import { supabaseService } from '../supabase';
import FormStaf from './FormStaf';

interface AdminStafProps {
  users: User[];
  onUsersChange: () => void;
  addLog: (msg: string) => void;
}

const AdminStaf: React.FC<AdminStafProps> = ({ users, onUsersChange, addLog }) => {
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 10;
  
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, id: string }>({ show: false, id: '' });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                           u.role.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userFilterRole === 'all' || u.role === userFilterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userFilterRole]);

  const handleDeleteUser = (id: string) => { 
    addLog("Pencet tombol hapus staf id: " + id);
    setConfirmModal({ show: true, id });
  };

  const processDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ show: false, id: '' });
    addLog(`Memproses hapus staf...`);
    try {
      await supabaseService.deleteUser(id);
      onUsersChange();
      addLog(`Berhasil hapus staf`);
    } catch (err: any) {
      addLog(`Gagal hapus staf: ${err.message}`);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Search and Filters - Refined Balanced Box Design (Floating Sticky) */}
        <div className="sticky top-2 z-20 -mx-1 pt-1 pb-4 no-print pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl border border-gray-100 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] flex flex-col gap-3 items-stretch pointer-events-auto transition-all duration-300">
            <div className="relative w-full">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Cari staf..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none text-xs font-bold transition-all placeholder:text-gray-300 shadow-sm" 
                value={userSearch} 
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} 
              />
            </div>
            <div className="flex gap-3 w-full h-11">
              <div className="flex-[60] relative h-full">
                <select 
                  className="w-full h-full pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl appearance-none focus:outline-none focus:bg-white focus:border-blue-400 text-xs font-bold text-gray-700 shadow-sm cursor-pointer hover:border-blue-200 transition-all font-sans"
                  value={userFilterRole}
                  onChange={(e) => { setUserFilterRole(e.target.value); setUserPage(1); }}
                >
                  <option value="all">Semua Role</option>
                  {Object.values(Role).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
              </div>
              <button 
                onClick={() => { setEditingUser(null); setIsFormOpen(true); }} 
                className="flex-[40] bg-emerald-600 text-white h-full rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md shadow-emerald-100 active:scale-95 transition-all"
              >
                <i className="fas fa-user-plus"></i> <span className="truncate">Tambah</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left table-fixed min-w-[300px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/2">Nama Staff</th>
                  <th className="px-2 md:px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Role</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <span className="font-bold text-gray-800 block truncate w-full">{u.name}</span>
                    </td>
                    <td className="px-2 md:px-4 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-tight">{u.role}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 md:gap-2">
                        <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition flex items-center justify-center"><i className="fas fa-edit text-xs"></i></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition flex items-center justify-center"><i className="fas fa-trash text-xs"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button 
              disabled={userPage === 1}
              onClick={() => setUserPage(prev => prev - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[11px] font-black text-gray-500 shadow-sm">
              {userPage} / {Math.ceil(filteredUsers.length / itemsPerPage)}
            </div>
            <button 
              disabled={userPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
              onClick={() => setUserPage(prev => prev + 1)}
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
            <FormStaf 
              user={editingUser} 
              onClose={() => setIsFormOpen(false)} 
              onSave={async (u) => { 
                try {
                  await supabaseService.saveUser(u); 
                  onUsersChange(); 
                  setIsFormOpen(false); 
                } catch (err: any) {
                  console.error("Save User Exception:", err);
                  alert("ERROR SIMPAN STAF:\n" + err.message);
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
            <h2 className="text-xl font-black text-center text-gray-800 mb-2 tracking-tight">Konfirmasi Hapus</h2>
            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Data akan dihapus permanen dari sistem.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ show: false, id: '' })} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase">Batal</button>
              <button onClick={processDelete} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-red-100">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminStaf;
