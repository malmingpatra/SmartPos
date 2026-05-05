import React, { useState, useMemo } from 'react';
import { Order, SalesReport } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell
} from 'recharts';

interface AdminLaporanProps {
  orders: Order[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

const AdminLaporan: React.FC<AdminLaporanProps> = ({ orders }) => {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('all');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (reportPeriod === 'daily') return orderDate >= startOfToday;
      if (reportPeriod === 'weekly') return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (reportPeriod === 'monthly') return orderDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      return true;
    });
  }, [orders, reportPeriod]);

  const stats = useMemo(() => {
    const report: SalesReport = {
      total_revenue: 0,
      order_count: filteredOrders.length,
      avg_order_value: 0,
      user_stats: {},
    };

    const userPerf: { [name: string]: { revenue: number, count: number } } = {};
    const timeSeriesData: { [key: string]: number } = {};

    filteredOrders.forEach(o => {
      report.total_revenue += o.total_amount;
      report.user_stats[o.user_name] = (report.user_stats[o.user_name] || 0) + o.total_amount;
      
      if (!userPerf[o.user_name]) userPerf[o.user_name] = { revenue: 0, count: 0 };
      userPerf[o.user_name].revenue += o.total_amount;
      userPerf[o.user_name].count += 1;

      const dateKey = new Date(o.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      timeSeriesData[dateKey] = (timeSeriesData[dateKey] || 0) + o.total_amount;
    });

    report.avg_order_value = report.order_count > 0 ? report.total_revenue / report.order_count : 0;

    const chartData = Object.keys(timeSeriesData).map(key => ({
      name: key,
      revenue: timeSeriesData[key]
    })).reverse();

    const userChartData = Object.keys(userPerf).map(name => ({
      name: name.split(' ')[0],
      fullName: name,
      revenue: userPerf[name].revenue,
      orders: userPerf[name].count
    })).sort((a, b) => b.revenue - a.revenue);

    return { ...report, chartData, userChartData };
  }, [filteredOrders]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col items-center gap-4 w-full">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Periode:</span>
          <div className="flex bg-gray-100 p-1 rounded-xl w-full">
            {(['all', 'daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
              <button key={period} onClick={() => setReportPeriod(period)} className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${reportPeriod === period ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{period === 'all' ? 'Semua' : period === 'daily' ? 'Hari Ini' : period === 'weekly' ? '7 Hari' : 'Bulan Ini'}</button>
            ))}
          </div>
        </div>
        <button onClick={() => window.print()} className="w-full bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fas fa-file-export"></i> Cetak Laporan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pendapatan Kotor</p>
          <p className="text-2xl font-black text-blue-700 mt-1">Rp {stats.total_revenue.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-2"><i className="fas fa-caret-up mr-1"></i> Total Periode Terpilih</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Transaksi</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.order_count}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-2">Nota Penjualan Terbit</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Rata-rata Penjualan</p>
          <p className="text-2xl font-black text-amber-600 mt-1">Rp {Math.round(stats.avg_order_value).toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-2">Nilai per Transaksi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Grafik Tren Penjualan</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px'}}
                  formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Pendapatan']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-4 mb-8">
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Laporan Penjualan per User</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Analisis produktivitas dan kontribusi staff dalam periode ini.</p>
              </div>
              <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                <i className="fas fa-users"></i> {stats.userChartData.length} User Aktif
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.userChartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      fontSize={11} 
                      fontWeight="bold" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{fill: '#475569'}}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px'}}
                      formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Total Penjualan']}
                    />
                    <Bar 
                      dataKey="revenue" 
                      radius={[0, 12, 12, 0]} 
                      barSize={24}
                    >
                      {stats.userChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-hidden border border-gray-100 rounded-3xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Nama Staff</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Nota</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {stats.userChartData.map((user, i) => (
                      <tr key={user.fullName} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] text-white" style={{backgroundColor: COLORS[i % COLORS.length]}}>
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-700">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="px-2.5 py-1 bg-gray-100 rounded-full font-black text-[10px] text-gray-500">{user.orders}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-blue-700">Rp {user.revenue.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                    {stats.userChartData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-300 italic">Belum ada data penjualan per user</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminLaporan;
