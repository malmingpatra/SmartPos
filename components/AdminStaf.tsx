import React, { useState, useMemo } from 'react';
import { User, Role } from '../types';
import { supabaseService } from '../supabase';
import FormStaf from './FormStaf';
import { motion, AnimatePresence } from 'motion/react';

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
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, id: string | string[] }>({ show: false, id: '' });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<Role | ''>('');

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                           u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                           u.role.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userFilterRole === 'all' || u.role === userFilterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userFilterRole]);

  const pagedUsers = useMemo(() => {
    return filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  }, [filteredUsers, userPage, itemsPerPage]);

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === pagedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(pagedUsers.map(u => u.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteUser = (id: string) => { 
    addLog("Pencet tombol hapus staf id: " + id);
    setConfirmModal({ show: true, id });
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    setConfirmModal({ show: true, id: selectedUserIds });
  };

  const handleBulkChangeRole = async () => {
    if (selectedUserIds.length === 0 || !bulkRole) return;
    try {
      await supabaseService.bulkUpdateUserRole(selectedUserIds, bulkRole as Role);
      setSelectedUserIds([]);
      setBulkRole('');
      onUsersChange();
      addLog(`Berhasil mengganti role`);
    } catch (err: any) {
      addLog(`Gagal mengganti role`);
      console.error(err);
    }
  };

  const processDelete = async () => {
    const { id } = confirmModal;
    const ids = Array.isArray(id) ? id : [id];
    
    setConfirmModal({ show: false, id: '' });
    try {
      if (ids.length === 1) {
        await supabaseService.deleteUser(ids[0]);
      } else {
        await supabaseService.bulkDeleteUsers(ids);
      }
      setSelectedUserIds([]);
      onUsersChange();
      addLog(`Berhasil menghapus`);
    } catch (err: any) {
      addLog(`Gagal menghapus`);
      console.error(err);
    }
  };

  return (
    <>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Search and Filters */}
        <div className="sticky top-[74px] z-20 -mx-1 pt-0.5 pb-2 no-print pointer-events-none transition-all duration-300">
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

        {selectedUserIds.length > 0 && (
          <div className="fixed bottom-32 right-4 flex flex-col gap-1 bg-white/95 backdrop-blur-xl p-1 rounded-xl border border-gray-100 shadow-[0_15px_40px_rgba(59,130,246,0.15)] z-[200] animate-in fade-in slide-in-from-right-5 duration-300">
            {/* Role Selection Dropdown */}
            <div className="relative group">
              <select 
                className="w-10 h-10 bg-blue-50/50 border border-transparent rounded-lg appearance-none focus:outline-none focus:border-blue-300 text-[10px] font-bold text-transparent transition-all cursor-pointer font-sans"
                value={bulkRole}
                onChange={e => setBulkRole(e.target.value as Role)}
                title="Pilih Role Baru"
              >
                <option value="" disabled>Role...</option>
                {Object.values(Role).map(role => <option key={role} value={role} className="text-gray-900">{role}</option>)}
              </select>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-blue-500 group-hover:text-blue-700 transition-colors">
                <i className="fas fa-user-tag text-xs"></i>
              </div>
            </div>

            {/* Save/Change Action */}
            <button 
              onClick={handleBulkChangeRole}
              disabled={!bulkRole}
              className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-200 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
              title="Ubah Role Staf"
            >
              <i className="fas fa-save text-xs"></i>
            </button>

            {/* Delete Action */}
            <button 
              onClick={handleBulkDelete}
              className="w-10 h-10 bg-red-50 text-red-500 border border-red-100 rounded-lg flex items-center justify-center active:scale-90 transition-all hover:bg-red-500 hover:text-white disabled:opacity-30"
              title="Hapus Staf"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>

            <div className="h-px bg-gray-100 mx-1.5 my-0.5"></div>

            {/* Count Badge (Click to Cancel) */}
            <button 
              onClick={() => { setSelectedUserIds([]); setBulkRole(''); }}
              className="w-10 h-10 bg-blue-600 text-white rounded-lg flex flex-col items-center justify-center shadow-md shadow-blue-200 active:scale-95 transition-all group relative overflow-hidden"
              title="Klik untuk Batalkan Pilihan"
            >
              <span className="text-[10px] font-black group-hover:hidden">{selectedUserIds.length}</span>
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
                  <th className="px-4 py-4 w-[10%] text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedUserIds.length > 0 && selectedUserIds.length === pagedUsers.length}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[60%]">Nama Staff</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-[30%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {pagedUsers.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${selectedUserIds.includes(u.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-4 w-[10%] text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => handleToggleSelectOne(u.id)}
                      />
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="truncate">
                        <span className="font-black text-gray-800 block truncate text-xs uppercase tracking-tight mb-1">{u.name}</span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[8px] font-black tracking-widest border border-gray-200/50">
                            @{u.username}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                            u.role === Role.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            u.role === Role.KASIR ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            u.role === Role.SALES ? 'bg-green-50 text-green-600 border-green-100' :
                            u.role === Role.GUDANG_MASTER ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            u.role === Role.MANAGER ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            u.role === Role.GUDANG ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 md:gap-2">
                        <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition flex items-center justify-center"><i className="fas fa-edit text-xs"></i></button>
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
                  addLog(`Berhasil ${editingUser ? 'mengubah' : 'menambah'} staf`);
                } catch (err: any) {
                  addLog(`Gagal ${editingUser ? 'mengubah' : 'menambah'} staf`);
                  console.error(err);
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
