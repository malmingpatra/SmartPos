
import React, { useState, useMemo } from 'react';
import { Order, User, Role, normalizeRole } from '../types';

interface RiwayatProps {
  orders: Order[];
  user: User;
  onViewOrder: (order: Order) => void;
}

const Riwayat: React.FC<RiwayatProps> = ({ orders, user, onViewOrder }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  
  const staffList = useMemo(() => {
    const names = new Set(orders.map(o => o.user_name));
    return Array.from(names).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    const userRole = normalizeRole(user.role);
    const canSeeAll = userRole === Role.ADMIN || userRole === Role.GUDANG;
    if (!canSeeAll) result = result.filter(o => o.user_id === user.id);
    if (canSeeAll && filterUser !== 'all') result = result.filter(o => o.user_name === filterUser);
    if (filterDate) result = result.filter(o => o.created_at.split('T')[0] === filterDate);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => o.receipt_number.toLowerCase().includes(query) || (o.buyer_name && o.buyer_name.toLowerCase().includes(query)));
    }
    return result;
  }, [orders, user, filterDate, filterUser, searchQuery]);

  const displayData = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const handleLoadMore = () => setVisibleCount(prev => prev + 20);

  const handleReset = () => {
    setFilterDate('');
    setFilterUser('all');
    setSearchQuery('');
    setVisibleCount(20);
  };

  const isFiltered = filterDate || searchQuery || (filterUser !== 'all');
  const userRole = normalizeRole(user.role);
  const canSeeStaffFilter = userRole === Role.ADMIN || userRole === Role.GUDANG;

  return (
    <div className="space-y-4">
      {/* Search and Filters - Refined Balanced Box Design (Floating Sticky) */}
      <div className="sticky top-0 z-20 -mx-1 pt-0.5 pb-2 no-print pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl border border-gray-100 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] flex flex-col gap-3 items-stretch pointer-events-auto transition-all duration-300">
          <div className="relative w-full">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Cari Nota atau Nama Member..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 outline-none text-xs font-bold transition-all placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(20); }}
            />
          </div>

          <div className="flex gap-3 w-full h-11">
            <div className="flex-[50] min-w-0">
              {canSeeStaffFilter ? (
                <div className="relative h-full">
                  <select 
                    className="w-full h-full pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl appearance-none focus:outline-none focus:bg-white focus:border-blue-400 text-xs font-bold text-gray-700 shadow-sm cursor-pointer hover:border-blue-200 transition-all"
                    value={filterUser}
                    onChange={(e) => { setFilterUser(e.target.value); setVisibleCount(20); }}
                  >
                    <option value="all">Staf: Semua</option>
                    {staffList.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
                </div>
              ) : (
                <div className="w-full h-full flex items-center px-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Milik Saya</span>
                </div>
              )}
            </div>
            
            <div className="flex-[35] min-w-0">
              <input 
                type="date" 
                className="w-full h-full border border-gray-100 rounded-xl px-3 bg-gray-50 text-[11px] focus:outline-none focus:bg-white focus:border-blue-400 font-bold text-gray-600 shadow-sm transition-all"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setVisibleCount(20); }}
              />
            </div>

            <div className="flex-[15] min-w-0">
              <button 
                onClick={handleReset}
                disabled={!isFiltered}
                className={`w-full h-full rounded-xl flex items-center justify-center transition active:scale-95 shadow-sm border ${
                  isFiltered 
                    ? 'bg-red-50 text-red-500 border-red-100 shadow-red-100' 
                    : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                }`}
                title="Reset Filter"
              >
                <i className="fas fa-undo text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">No. Nota</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic text-sm">
                    {isFiltered ? 'Tidak ada data yang cocok dengan filter' : 'Tidak ada riwayat'}
                  </td>
                </tr>
              ) : (
                displayData.map(o => (
                  <tr key={o.id} onClick={() => onViewOrder(o)} className="hover:bg-blue-50/50 cursor-pointer transition group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-blue-600 group-hover:text-blue-700">{o.receipt_number}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {o.buyer_name && (
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {o.buyer_name}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {o.user_name}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium mt-1">
                          {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(o.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><span className="font-bold text-gray-700 text-[11px] md:text-xs whitespace-nowrap">Rp {o.total_amount.toLocaleString('id-ID')}</span></td>
                    <td className="px-6 py-4 text-center"><button className="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center"><i className="fas fa-eye text-xs"></i></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filtered.length > 0 ? `Menampilkan ${displayData.length} dari ${filtered.length} Transaksi` : '0 Transaksi ditemukan'}</p>
          {visibleCount < filtered.length && (
            <button onClick={handleLoadMore} className="px-6 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-blue-600 flex items-center gap-2">
              Tampilkan Lebih Banyak <i className="fas fa-chevron-down text-[10px]"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Riwayat;
