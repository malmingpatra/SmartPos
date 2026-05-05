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
      <div className="flex flex-col gap-4 relative min-h-screen pb-32">
        {/* Sticky Management Navigator - Simplified Style */}
        <div className="sticky top-0 z-30 pt-1 pb-3 no-print pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] flex items-center relative h-14 translate-y-1">
            {debugLogs.length > 0 && (
              <div className="fixed top-20 left-4 right-4 bg-black text-[9px] text-emerald-400 p-2 font-mono break-all opacity-80 rounded-lg z-50 pointer-events-none">
                {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            )}
            
            <div 
              className="absolute bg-blue-50/80 rounded-xl transition-all duration-300 ease-out z-0"
              style={{ 
                top: '6px',
                bottom: '6px',
                width: `calc((100% - 12px) / ${allowedTabs.length})`,
                left: `calc(6px + ${allowedTabs.indexOf(activeTab)} * (100% - 12px) / ${allowedTabs.length})`
              }}
            ></div>

            {allowedTabs.includes('products') && (
              <button onClick={() => setActiveTab('products')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'products' ? 'text-blue-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-box text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Produk</span>
              </button>
            )}
            {allowedTabs.includes('users') && (
              <button onClick={() => setActiveTab('users')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-user-shield text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Staff</span>
              </button>
            )}
            {allowedTabs.includes('customers') && (
              <button onClick={() => setActiveTab('customers')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'customers' ? 'text-blue-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-users text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Member</span>
              </button>
            )}
            {allowedTabs.includes('reports') && (
              <button onClick={() => setActiveTab('reports')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-chart-bar text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Laporan</span>
              </button>
            )}
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
