import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, User, Role, Order, Customer, normalizeRole } from '../../types';
import { supabaseService } from '../../supabase';
import ProdukAdmin from './ProdukAdmin';
import StafAdmin from './StafAdmin';
import MemberAdmin from './MemberAdmin';
import LaporanAdmin from './LaporanAdmin';
import BantuanAdmin from './BantuanAdmin';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

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
    if (userRole === Role.ADMIN) return ['products', 'users', 'customers', 'reports', 'support'];
    if (userRole === Role.MANAGER) return ['products', 'customers', 'reports'];
    if (userRole === Role.GUDANG_MASTER) return ['products'];
    if (userRole === Role.GUDANG) return ['products'];
    if (userRole === Role.KASIR || userRole === Role.SALES) return ['customers'];
    return [];
  }, [userRole]);

  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'customers' | 'reports' | 'support'>(allowedTabs[0] as any || 'products');
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    supabaseService.getUsers().then(setUsers);
    
    // Cleanup timeouts on unmount
    const currentTimeouts = notificationTimeoutRef.current;
    return () => {
      Object.values(currentTimeouts).forEach(clearTimeout);
    };
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto close after 20 seconds
    const timeout = setTimeout(() => {
      removeNotification(id);
    }, 20000);
    
    notificationTimeoutRef.current[id] = timeout;
  };

  const removeNotification = (id: string) => {
    if (notificationTimeoutRef.current[id]) {
      clearTimeout(notificationTimeoutRef.current[id]);
      delete notificationTimeoutRef.current[id];
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addLog = (msg: string) => {
    // Keep internal logging or redirect to notifications if simple enough
    console.log(msg);
    // If it's a simple feedback message, we can show it as notification
    if (msg.toLowerCase().includes('berhasil') || msg.toLowerCase().includes('gagal')) {
      showNotification(msg, msg.toLowerCase().includes('gagal') ? 'error' : 'success');
    }
  };

  return (
    <React.Fragment>
      {/* Success/Error Notifications Toast - 20s auto-hide */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto shadow-2xl"
            >
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                n.type === 'success' 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : n.type === 'error' 
                    ? 'bg-red-600 border-red-500 text-white' 
                    : 'bg-orange-600 border-orange-500 text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <i className={`fas ${
                      n.type === 'success' ? 'fa-check-circle' : n.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
                    } text-sm`}></i>
                  </div>
                  <span className="text-xs font-bold leading-tight">{n.message}</span>
                </div>
                <button 
                  onClick={() => removeNotification(n.id)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                >
                  <i className="fas fa-times text-xs opacity-50"></i>
                </button>
              </div>
              
              {/* Progress bar for 20s */}
              <div className="h-1 bg-white/20 rounded-b-2xl overflow-hidden mt-[-4px]">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 20, ease: 'linear' }}
                  className="h-full bg-white/40"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4 relative min-h-screen pb-32">
        {/* Sticky Management Navigator - Simplified Style */}
        <div className="sticky top-0 z-30 pt-1 pb-3 no-print pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] flex items-center relative h-14 translate-y-1">
            
            <div 
              className="absolute bg-orange-50/80 rounded-xl transition-all duration-300 ease-out z-0"
              style={{ 
                top: '6px',
                bottom: '6px',
                width: `calc((100% - 12px) / ${allowedTabs.length})`,
                left: `calc(6px + ${allowedTabs.indexOf(activeTab)} * (100% - 12px) / ${allowedTabs.length})`
              }}
            ></div>

            {allowedTabs.includes('products') && (
              <button onClick={() => setActiveTab('products')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'products' ? 'text-orange-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-box text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Produk</span>
              </button>
            )}
            {allowedTabs.includes('users') && (
              <button onClick={() => setActiveTab('users')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'users' ? 'text-orange-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-user-shield text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Staff</span>
              </button>
            )}
            {allowedTabs.includes('customers') && (
              <button onClick={() => setActiveTab('customers')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'customers' ? 'text-orange-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-users text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Member</span>
              </button>
            )}
            {allowedTabs.includes('reports') && (
              <button onClick={() => setActiveTab('reports')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'reports' ? 'text-orange-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-chart-bar text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Laporan</span>
              </button>
            )}
            {allowedTabs.includes('support') && (
              <button onClick={() => setActiveTab('support')} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${activeTab === 'support' ? 'text-orange-600' : 'text-gray-400 active:scale-95'}`}>
                <i className="fas fa-headset text-sm"></i>
                <span className="text-[8px] font-black uppercase tracking-tighter">Support</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'products' && (
            <ProdukAdmin products={products} onProductsChange={onProductsChange} currentUser={currentUser} addLog={addLog} />
          )}

          {activeTab === 'users' && (
            <StafAdmin users={users} onUsersChange={async () => setUsers(await supabaseService.getUsers())} addLog={addLog} />
          )}

          {activeTab === 'customers' && (
            <MemberAdmin 
              customers={customers} 
              onCustomersChange={onCustomersChange} 
              users={users} 
              currentUser={currentUser} 
              addLog={addLog} 
            />
          )}

          {activeTab === 'reports' && (
            <LaporanAdmin orders={orders} />
          )}

          {activeTab === 'support' && (
            <BantuanAdmin addLog={addLog} />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default AdminDashboard;
