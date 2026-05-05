import React, { useState, useMemo } from 'react';
import { Customer, User, Role, normalizeRole } from '../types';
import { supabaseService } from '../supabase';
import FormMember from './FormMember';

interface AdminMemberProps {
  customers: Customer[];
  onCustomersChange: () => void;
  users: User[];
  currentUser: User;
  addLog: (msg: string) => void;
}

const AdminMember: React.FC<AdminMemberProps> = ({ customers, onCustomersChange, users, currentUser, addLog }) => {
  const userRole = normalizeRole(currentUser.role);
  
  const [customerPage, setCustomerPage] = useState(1);
  const itemsPerPage = 10;
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilterUser, setCustomerFilterUser] = useState('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, id: string }>({ show: false, id: '' });

  // Multi-select state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetOwnerId, setTargetOwnerId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                           c.phone.includes(customerSearch);
      const matchesUser = customerFilterUser === 'all' || c.created_by === customerFilterUser;
      return matchesSearch && matchesUser;
    });
  }, [customers, customerSearch, customerFilterUser]);

  const handleDeleteCustomer = (id: string) => { 
    addLog("Pencet tombol hapus member id: " + id);
    setConfirmModal({ show: true, id });
  };

  const processDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ show: false, id: '' });
    addLog(`Memproses hapus member...`);
    try {
      await supabaseService.deleteCustomer(id);
      onCustomersChange();
      addLog(`Berhasil hapus member`);
    } catch (err: any) {
      addLog(`Gagal hapus member: ${err.message}`);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedCustomerIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const onBulkDeleteProcess = async () => {
    if (isProcessing || selectedCustomerIds.length === 0) return;
    setIsProcessing(true);
    try {
      addLog("Bulk hapus payload dikirim...");
      await supabaseService.bulkDeleteCustomers(selectedCustomerIds);
      await onCustomersChange();
      addLog("Data di-refresh");
      setSelectedCustomerIds([]);
      setShowBulkDeleteConfirm(false);
    } catch (error: any) {
      addLog(`Gagal bulk hapus: ${error.message}`);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally { setIsProcessing(false); }
  };

  const onBulkDeleteClick = (e: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowBulkDeleteConfirm(true);
  };

  const onBulkTransferSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isProcessing || !targetOwnerId) return;
    const newOwner = users.find(u => u.id === targetOwnerId);
    if (!newOwner) return;
    
    addLog(`Pencet bulk pindah ke: ${newOwner.name}`);
    setIsProcessing(true);
    try {
      await supabaseService.bulkTransferCustomers(selectedCustomerIds, newOwner.id, newOwner.role);
      addLog("Bulk pindah payload dikirim...");
      await onCustomersChange();
      addLog("Data di-refresh");
      setSelectedCustomerIds([]);
      setShowTransferModal(false);
    } catch (error: any) {
      addLog(`Gagal bulk pindah: ${error.message}`);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally { setIsProcessing(false); }
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
                placeholder="Cari member..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none text-xs font-bold transition-all placeholder:text-gray-300 shadow-sm" 
                value={customerSearch} 
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerPage(1); }} 
              />
            </div>
            <div className="flex gap-3 w-full h-11">
              {userRole === Role.ADMIN && (
                <div className="flex-[60] relative h-full">
                  <select 
                    className="w-full h-full pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl appearance-none focus:outline-none focus:bg-white focus:border-blue-400 text-xs font-bold text-gray-700 shadow-sm cursor-pointer hover:border-blue-200 transition-all font-sans"
                    value={customerFilterUser}
                    onChange={(e) => { setCustomerFilterUser(e.target.value); setCustomerPage(1); }}
                  >
                    <option value="all">Semua Petugas</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
                </div>
              )}
              <button 
                onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }} 
                className={`${userRole === Role.ADMIN ? 'flex-[40]' : 'w-full'} bg-amber-600 text-white h-full rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md shadow-amber-100 active:scale-95 transition-all`}
              >
                <i className="fas fa-user-plus"></i> <span className="truncate">Member</span>
              </button>
            </div>
          </div>
        </div>

        {selectedCustomerIds.length > 0 && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-white/95 backdrop-blur-xl rounded-3xl p-5 flex flex-col gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 z-[200] animate-in slide-in-from-bottom-10 duration-500">
            {/* Header Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                <span className="text-base font-black">{selectedCustomerIds.length}</span>
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-600">Member Terpilih</p>
                <button type="button" onClick={() => setSelectedCustomerIds([])} className="text-[10px] text-gray-400 font-bold uppercase hover:text-gray-800 transition tracking-tight">Batalkan Pilihan</button>
              </div>
            </div>

            {/* Action Row: Transfer */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <select 
                  className="w-full h-11 pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl appearance-none focus:outline-none focus:bg-white focus:border-blue-400 text-[11px] font-bold text-gray-700 shadow-sm transition-all"
                  value={targetOwnerId}
                  onChange={(e) => setTargetOwnerId(e.target.value)}
                >
                  <option value="">Pilih Staff...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
              </div>
              <button 
                onClick={onBulkTransferSubmit}
                disabled={!targetOwnerId || isProcessing}
                className="bg-blue-600 text-white px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-100 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <i className="fas fa-exchange-alt"></i> Pindahkan
              </button>
            </div>

            {/* Danger Action: Delete */}
            <button 
              onClick={onBulkDeleteClick}
              disabled={isProcessing}
              className="w-full h-12 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-100 disabled:opacity-50"
            >
              <i className="fas fa-trash-alt"></i> Hapus Member
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left table-fixed min-w-[360px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 md:px-6 py-4 w-12"><input type="checkbox" checked={filteredCustomers.length > 0 && selectedCustomerIds.length === filteredCustomers.length} onChange={handleToggleSelectAll} /></th>
                  <th className="px-2 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left w-full">Nama</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredCustomers.slice((customerPage - 1) * itemsPerPage, customerPage * itemsPerPage).map(c => (
                  <tr key={c.id} className={`${selectedCustomerIds.includes(c.id) ? 'bg-blue-50/50' : ''} hover:bg-gray-50/50 transition-colors`}>
                    <td className="px-4 md:px-6 py-4"><input type="checkbox" checked={selectedCustomerIds.includes(c.id)} onChange={() => handleToggleSelectOne(c.id)} /></td>
                    <td className="px-2 py-4 overflow-hidden text-left">
                      <span className="font-bold text-gray-800 block truncate">{c.name}</span>
                      <span className="text-[10px] font-black text-gray-400 block truncate">{c.phone}</span>
                      <span className="text-[10px] font-black text-emerald-600 block truncate">Total: Rp {c.total_spent.toLocaleString()}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 md:gap-2">
                        <button onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition flex items-center justify-center"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-400 hover:bg-red-50 w-8 h-8 rounded-lg transition flex items-center justify-center"><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredCustomers.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button 
              disabled={customerPage === 1}
              onClick={() => setCustomerPage(prev => prev - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[11px] font-black text-gray-500 shadow-sm">
              {customerPage} / {Math.ceil(filteredCustomers.length / itemsPerPage)}
            </div>
            <button 
              disabled={customerPage >= Math.ceil(filteredCustomers.length / itemsPerPage)}
              onClick={() => setCustomerPage(prev => prev + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 active:scale-90 transition-transform shadow-sm"
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 animate-in zoom-in duration-300 shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Pindahkan Member</h2>
            <div className="space-y-4 mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pilih Petugas Baru</label>
              <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none font-bold text-sm" value={targetOwnerId} onChange={(e) => setTargetOwnerId(e.target.value)}>
                <option value="">Pilih Staff...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTransferModal(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase">Batal</button>
              <button onClick={onBulkTransferSubmit} disabled={!targetOwnerId || isProcessing} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100">Proses</button>
            </div>
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

      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-6 mx-auto">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="text-xl font-black text-center text-gray-800 mb-2 tracking-tight">Hapus {selectedCustomerIds.length} Member?</h2>
            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Data akan dihapus permanen dari sistem.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkDeleteConfirm(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl text-xs uppercase cursor-pointer">Batal</button>
              <button onClick={onBulkDeleteProcess} disabled={isProcessing} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-red-100 cursor-pointer">{isProcessing ? 'Proses...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 animate-in zoom-in duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
            <FormMember 
              customer={editingCustomer} 
              users={users}
              isAdmin={normalizeRole(currentUser.role) === Role.ADMIN}
              onClose={() => setIsFormOpen(false)} 
              onSave={async (c) => { 
                try {
                  if (!editingCustomer && !c.created_by) {
                    c.created_by = currentUser.id;
                    c.created_by_role = normalizeRole(currentUser.role);
                  }
                  await supabaseService.saveCustomer(c); 
                  await onCustomersChange(); 
                  setIsFormOpen(false); 
                } catch (err: any) {
                  alert("Gagal menyimpan member: " + err.message);
                }
              }} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMember;
