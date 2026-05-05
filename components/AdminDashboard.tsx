import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, Role, Order, Customer, normalizeRole } from '../types';
import { supabaseService } from '../supabase';
import AdminProduk from './AdminProduk';
import AdminStaf from './AdminStaf';
import AdminMember from './AdminMember';
import AdminLaporan from './AdminLaporan';

interface AdminDashboardProps {
  products: Product[];
  onProductsChange: () => Promise<void> | void;
  orders: Order[];
  customers: Customer[];
  currentUser: User;
  onCustomersChange: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, onProductsChange, orders, customers, currentUser, onCustomersChange }) => {
  const userRole = normalizeRole(currentUser.role);
  
  const allowedTabs = useMemo(() => {
    if (userRole === Role.ADMIN) return ['products', 'users', 'customers', 'reports'];
    if (userRole === Role.GUDANG) return ['products'];
    if (userRole === Role.KASIR || userRole === Role.SALES) return ['customers'];
    return [];
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'customers' | 'reports'>(allowedTabs[0] as any || 'products');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    supabaseService.getUsers().then(setUsers);
  }, []);

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [msg, ...prev].slice(0, 5));
  };

  return (
    <React.Fragment>
      <div className="flex flex-col gap-6 relative min-h-screen pb-48">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          {debugLogs.length > 0 && (
            <div className="bg-black text-[9px] text-emerald-400 p-2 font-mono break-all opacity-80">
              {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          )}
          <div className="p-6 pb-2 flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Pusat Manajemen</h2>
              <p className="text-xs text-gray-400 font-medium">Kelola inventaris, staff, member, dan pantau performa bisnis.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full w-fit">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Administrator Mode</span>
            </div>
          </div>

          <div className="p-4 pt-4">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center relative h-12">
              <div 
                className="absolute bg-white rounded-xl shadow-md transition-all duration-300 ease-out z-0"
                style={{ 
                  top: '6px',
                  bottom: '6px',
                  width: `calc((100% - 12px) / ${allowedTabs.length} - 8px)`,
                  left: `calc(6px + ${allowedTabs.indexOf(activeTab)} * (100% - 12px) / ${allowedTabs.length} + 4px)`
                }}
              ></div>

              {allowedTabs.includes('products') && (
                <button onClick={() => setActiveTab('products')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'products' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <i className="fas fa-box"></i> <span className="hidden sm:inline">Produk</span>
                </button>
              )}
              {allowedTabs.includes('users') && (
                <button onClick={() => setActiveTab('users')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <i className="fas fa-user-shield"></i> <span className="hidden sm:inline">Staff</span>
                </button>
              )}
              {allowedTabs.includes('customers') && (
                <button onClick={() => setActiveTab('customers')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'customers' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <i className="fas fa-users"></i> <span className="hidden sm:inline">Member</span>
                </button>
              )}
              {allowedTabs.includes('reports') && (
                <button onClick={() => setActiveTab('reports')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <i className="fas fa-chart-bar"></i> <span className="hidden sm:inline">Laporan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'products' && (
            <AdminProduk products={products} onProductsChange={onProductsChange} addLog={addLog} />
          )}

          {activeTab === 'users' && (
            <AdminStaf users={users} onUsersChange={async () => setUsers(await supabaseService.getUsers())} addLog={addLog} />
          )}

          {activeTab === 'customers' && (
            <AdminMember 
              customers={customers} 
              onCustomersChange={onCustomersChange} 
              users={users} 
              currentUser={currentUser} 
              addLog={addLog} 
            />
          )}

          {activeTab === 'reports' && (
            <AdminLaporan orders={orders} />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default AdminDashboard;
