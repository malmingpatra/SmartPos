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
  const isKasirSales = userRole === Role.KASIR || userRole === Role.SALES;
  
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
    try {
      await supabaseService.deleteCustomer(id);
      onCustomersChange();
      addLog(`Berhasil menghapus`);
    } catch (err: any) {
      addLog(`Gagal menghapus`);
      console.error(err);
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
      await supabaseService.bulkDeleteCustomers(selectedCustomerIds);
      await onCustomersChange();
      addLog(`Berhasil menghapus`);
      setSelectedCustomerIds([]);
      setShowBulkDeleteConfirm(false);
    } catch (error: any) {
      addLog(`Gagal menghapus`);
      console.error(error);
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
    
    setIsProcessing(true);
    try {
      await supabaseService.bulkTransferCustomers(selectedCustomerIds, newOwner.id, newOwner.role);
      await onCustomersChange();
      addLog(`Berhasil mengganti member`);
      setSelectedCustomerIds([]);
      setShowTransferModal(false);
    } catch (error: any) {
      addLog(`Gagal mengganti member`);
      console.error(error);
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
              {(userRole === Role.ADMIN || userRole === Role.MANAGER) && (
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
                className={`${(userRole === Role.ADMIN || userRole === Role.MANAGER) ? 'flex-[40]' : 'w-full'} bg-amber-600 text-white h-full rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md shadow-amber-100 active:scale-95 transition-all`}
              >
                <i className="fas fa-user-plus"></i> <span className="truncate">Member</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Panel - Hide for Kasir/Sales */}
        {!isKasirSales && selectedCustomerIds.length > 0 && (
          <div className="fixed bottom-32 right-4 flex flex-col gap-1 bg-white/95 backdrop-blur-xl p-1 rounded-xl border border-gray-100 shadow-[0_15px_40px_rgba(59,130,246,0.15)] z-[200] animate-in fade-in slide-in-from-right-5 duration-300">
            {/* Staff Selection Dropdown */}
            <div className="relative group">
              <select 
                className="w-10 h-10 bg-blue-50/50 border border-transparent rounded-lg appearance-none focus:outline-none focus:border-blue-300 text-[10px] font-bold text-transparent transition-all cursor-pointer"
                value={targetOwnerId}
                onChange={(e) => setTargetOwnerId(e.target.value)}
                title="Pilih Staf Tujuan"
              >
                <option value="">Staf...</option>
                {users.map(u => <option key={u.id} value={u.id} className="text-gray-900">{u.name}</option>)}
              </select>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-blue-500 group-hover:text-blue-700 transition-colors">
                <i className="fas fa-user-friends text-xs"></i>
              </div>
            </div>

            {/* Transfer Action */}
            <button 
              onClick={onBulkTransferSubmit}
              disabled={!targetOwnerId || isProcessing}
              className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-200 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
              title="Pindahkan Member"
            >
              <i className="fas fa-exchange-alt text-xs"></i>
            </button>

            {/* Delete Action */}
            <button 
              onClick={onBulkDeleteClick}
              disabled={isProcessing}
              className="w-10 h-10 bg-red-50 text-red-500 border border-red-100 rounded-lg flex items-center justify-center active:scale-90 transition-all hover:bg-red-500 hover:text-white disabled:opacity-30"
              title="Hapus Member"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>

            <div className="h-px bg-gray-100 mx-1.5 my-0.5"></div>

            {/* Count Badge (Click to Cancel) */}
            <button 
              onClick={() => setSelectedCustomerIds([])}
              className="w-10 h-10 bg-amber-500 text-white rounded-lg flex flex-col items-center justify-center shadow-md shadow-amber-100 active:scale-95 transition-all group relative overflow-hidden"
              title="Klik untuk Batalkan Pilihan"
            >
              <span className="text-[10px] font-black group-hover:hidden">{selectedCustomerIds.length}</span>
              <i className="fas fa-times text-[10px] hidden group-hover:block"></i>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left table-fixed min-w-[360px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 md:px-6 py-4 w-12">
                    {!isKasirSales && (
                      <input type="checkbox" checked={filteredCustomers.length > 0 && selectedCustomerIds.length === filteredCustomers.length} onChange={handleToggleSelectAll} />
                    )}
                  </th>
                  <th className="px-2 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left w-[70%]">Nama</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-[30%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredCustomers.slice((customerPage - 1) * itemsPerPage, customerPage * itemsPerPage).map(c => (
                  <tr key={c.id} className={`${selectedCustomerIds.includes(c.id) ? 'bg-blue-50/50' : ''} hover:bg-gray-50/50 transition-colors`}>
                    <td className="px-4 md:px-6 py-4">
                      {!isKasirSales && (
                        <input type="checkbox" checked={selectedCustomerIds.includes(c.id)} onChange={() => handleToggleSelectOne(c.id)} />
                      )}
                    </td>
                    <td className="px-2 py-4 overflow-hidden text-left">
                      <span className="font-bold text-gray-800 block truncate">{c.name}</span>
                      <div className="mt-1 mb-1">
                        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-tight border border-blue-100">
                          <i className="fas fa-phone-alt mr-1 text-[8px]"></i>{c.phone}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 block truncate">Total: Rp {c.total_spent.toLocaleString()}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <button onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }} className="text-blue-500 hover:bg-blue-50 w-8 h-8 rounded-lg transition flex items-center justify-center"><i className="fas fa-edit"></i></button>
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
              onDelete={(id) => { setIsFormOpen(false); handleDeleteCustomer(id); }}
              onSave={async (c) => { 
                try {
                  if (!editingCustomer && !c.created_by) {
                    c.created_by = currentUser.id;
                    c.created_by_role = normalizeRole(currentUser.role);
                  }
                  await supabaseService.saveCustomer(c); 
                  await onCustomersChange(); 
                  setIsFormOpen(false); 
                  addLog(`Berhasil ${editingCustomer ? 'mengubah' : 'menambah'} member`);
                } catch (err: any) {
                  addLog(`Gagal ${editingCustomer ? 'mengubah' : 'menambah'} member`);
                  console.error(err);
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
