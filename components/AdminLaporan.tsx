import React, { useState, useMemo } from 'react';
import { Order, SalesReport } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface AdminLaporanProps {
  orders: Order[];
}

type ReportPeriod = 'today' | '7days' | 'month' | 'custom';

const AdminLaporan: React.FC<AdminLaporanProps> = ({ orders }) => {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [staffSort, setStaffSort] = useState<'name' | 'revenue'>('name');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      if (reportPeriod === 'today') return orderDate >= startOfToday;
      if (reportPeriod === '7days') return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (reportPeriod === 'month') return orderDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      if (reportPeriod === 'custom') {
        const start = customRange.start ? new Date(customRange.start) : null;
        const end = customRange.end ? new Date(customRange.end) : null;
        if (end) end.setHours(23, 59, 59, 999);
        
        if (start && end) return orderDate >= start && orderDate <= end;
        if (start) return orderDate >= start;
        if (end) return orderDate <= end;
        return true;
      }
      return true;
    });
  }, [orders, reportPeriod, customRange]);

  const stats = useMemo(() => {
    const report = {
      total_revenue: 0,
      order_count: filteredOrders.length,
      chartData: [] as { name: string, revenue: number }[],
      topProducts: [] as { name: string, quantity: number }[],
      staffStats: [] as { name: string, quantity: number, revenue: number }[],
      detailedProducts: [] as { name: string, price: number, quantity: number, subtotal: number }[],
    };

    const timeSeriesData: { [key: string]: number } = {};
    const productMap: { [name: string]: { quantity: number, price: number, subtotal: number } } = {};
    const staffMap: { [name: string]: { quantity: number, revenue: number } } = {};

    filteredOrders.forEach(o => {
      report.total_revenue += o.total_amount;
      
      // Time Series
      const dateKey = new Date(o.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      timeSeriesData[dateKey] = (timeSeriesData[dateKey] || 0) + o.total_amount;

      // Staff Stats
      if (!staffMap[o.user_name]) staffMap[o.user_name] = { quantity: 0, revenue: 0 };
      staffMap[o.user_name].revenue += o.total_amount;

      // Product Stats
      o.items.forEach(item => {
        if (!productMap[item.name]) {
          productMap[item.name] = { quantity: 0, price: item.price, subtotal: 0 };
        }
        productMap[item.name].quantity += item.quantity;
        productMap[item.name].subtotal += item.price * item.quantity;
        staffMap[o.user_name].quantity += item.quantity;
      });
    });

    report.chartData = Object.keys(timeSeriesData).map(key => ({
      name: key,
      revenue: timeSeriesData[key]
    })).reverse();

    report.topProducts = Object.keys(productMap)
      .map(name => ({ name, quantity: productMap[name].quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    report.detailedProducts = Object.keys(productMap)
      .map(name => ({ name, ...productMap[name] }))
      .sort((a, b) => b.subtotal - a.subtotal);

    report.staffStats = Object.keys(staffMap)
      .map(name => ({ name, ...staffMap[name] }))
      .sort((a, b) => {
        if (staffSort === 'revenue') return b.revenue - a.revenue;
        return a.name.localeCompare(b.name);
      });

    return report;
  }, [filteredOrders, staffSort]);

  const getReportTitle = () => {
    if (reportPeriod === 'today') return 'Laporan Penjualan Hari Ini';
    if (reportPeriod === '7days') return 'Laporan Penjualan 7 Hari Terakhir';
    if (reportPeriod === 'month') return 'Laporan Penjualan Bulan Ini';
    if (reportPeriod === 'custom') {
      return `Laporan Penjualan (${customRange.start || '?'} s/d ${customRange.end || '?'})`;
    }
    return 'Laporan Penjualan';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
      {/* Print-Only Report Content (Hidden in UI) */}
      <div className="hidden print:block font-mono text-[10pt] leading-tight p-4">
        <div className="text-center mb-6">
          <h1 className="text-base font-black uppercase mb-1">SMART POS</h1>
          <p className="text-[10pt]">{getReportTitle()}</p>
          <div className="h-px bg-black w-full my-2"></div>
        </div>

        <div className="space-y-4">
          {stats.detailedProducts.map((p, idx) => (
            <div key={idx} className="space-y-1">
              <div className="font-bold uppercase">{p.name}</div>
              <div className="flex justify-between items-end border-b border-dashed border-gray-300 pb-1">
                <span className="w-1/3 text-left">Rp {p.price.toLocaleString()}</span>
                <span className="w-1/3 text-center">x{p.quantity}</span>
                <span className="w-1/3 text-right font-bold">Rp {p.subtotal.toLocaleString()}</span>
              </div>
              <div className="text-center opacity-30 text-[8pt]">--</div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t-2 border-double border-black pt-2 flex justify-between items-center">
          <span className="font-black uppercase">TOTAL PENJUALAN</span>
          <span className="text-base font-black">Rp {stats.total_revenue.toLocaleString()}</span>
        </div>

        <div className="mt-12 text-center text-[8pt] opacity-50 italic">
          Dicetak pada: {new Date().toLocaleString('id-ID')}
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-20 no-print">
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex bg-gray-50/80 p-1 rounded-xl w-full border border-gray-100/50">
              {(['today', '7days', 'month', 'custom'] as ReportPeriod[]).map((period) => (
                <button 
                  key={period} 
                  onClick={() => setReportPeriod(period)} 
                  className={`flex-1 px-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${reportPeriod === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  {period === 'today' ? 'Hari Ini' : period === '7days' ? '7 Hari' : period === 'month' ? 'Bulan Ini' : 'Tanggal'}
                </button>
              ))}
            </div>

            {reportPeriod === 'custom' && (
              <div className="flex items-center gap-2 w-full animate-in slide-in-from-top-2 duration-200">
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-blue-300 transition-colors"
                />
                <span className="text-gray-300 text-[10px]"><i className="fas fa-arrow-right"></i></span>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-bold focus:outline-none focus:border-blue-300 transition-colors"
                />
              </div>
            )}
          </div>
          
          <button 
            onClick={() => window.print()} 
            className="w-full bg-gray-900 text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <i className="fas fa-print"></i> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Pendapatan</p>
          <p className="text-lg font-black text-blue-700 mt-1">Rp {stats.total_revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Transaksi</p>
          <p className="text-lg font-black text-emerald-600 mt-1">{stats.order_count}</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mx-1">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tren Penjualan</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
              <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px'}}
                formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mx-1">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Top 5 Produk Terlaris</h3>
        <div className="overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="py-2 text-gray-400 font-bold uppercase tracking-tighter w-[70%]">Nama Produk</th>
                <th className="py-2 text-gray-400 font-bold uppercase tracking-tighter text-center w-[30%]">Terjual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.topProducts.map((p, i) => (
                <tr key={i}>
                  <td className="py-3 font-medium text-gray-700">{p.name}</td>
                  <td className="py-3 text-center font-black text-blue-600">{p.quantity}</td>
                </tr>
              ))}
              {stats.topProducts.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-gray-300 italic">Belum ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mx-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penjualan per Staf</h3>
          <button 
            onClick={() => setStaffSort(staffSort === 'name' ? 'revenue' : 'name')}
            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${staffSort === 'revenue' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
          >
            <i className="fas fa-sort-amount-down-alt mr-1"></i> Rp Terbanyak
          </button>
        </div>
        <div className="overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="py-2 text-gray-400 font-bold uppercase tracking-tighter">Nama Staf</th>
                <th className="py-2 text-gray-400 font-bold uppercase tracking-tighter text-center">Items</th>
                <th className="py-2 text-gray-400 font-bold uppercase tracking-tighter text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.staffStats.map((s, i) => (
                <tr key={i}>
                  <td className="py-3 font-medium text-gray-700">{s.name}</td>
                  <td className="py-3 text-center text-gray-500 font-bold">{s.quantity}</td>
                  <td className="py-3 text-right font-black text-emerald-600">Rp {s.revenue.toLocaleString()}</td>
                </tr>
              ))}
              {stats.staffStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-300 italic">Belum ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
};

export default AdminLaporan;
