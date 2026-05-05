
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Role, User, Product, CartItem, Order, Customer, normalizeRole } from './types';
import { supabaseService } from './supabase';
import { APP_CONFIG } from './constants';
import LoginPin from './components/LoginPin';
import Katalog from './components/Katalog';
import Keranjang from './components/Keranjang';
import AdminDashboard from './components/AdminDashboard';
import Riwayat from './components/Riwayat';
import Struk from './components/Struk';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'catalog' | 'admin' | 'history'>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isDockVisible, setIsDockVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [prods, ords] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getOrders()
      ]);
      setProducts(prods);
      setOrders(ords);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      supabaseService.getCustomers(user).then(setCustomers);
    } else {
      setCustomers([]);
    }
  }, [user]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const currentScrollY = scrollContainerRef.current.scrollTop;
    const scrollDiff = currentScrollY - lastScrollY.current;
    if (currentScrollY < 10) setIsDockVisible(true);
    else if (scrollDiff > 10 && isDockVisible) setIsDockVisible(false);
    else if (scrollDiff < -10 && !isDockVisible) setIsDockVisible(true);
    lastScrollY.current = currentScrollY;
  };

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setView('catalog');
  };

  const handleLogout = () => {
    setUser(null);
    setView('catalog');
    setCart([]);
  };

  const addToCart = (product: Product) => {
    if (!user || normalizeRole(user.role) === Role.GUDANG) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    // Buka keranjang otomatis saat menambah item
    setShowCart(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setManualQuantity = (id: string, value: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: value } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async (discount: number = 0, buyerName?: string, buyerPhone?: string, customerId?: string) => {
    if (!user || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount;
    const date = new Date();
    
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString();
    const random = Math.floor(1000 + Math.random() * 9000);
    const receiptNum = `${d}${m}${y}${random}`;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      receipt_number: receiptNum,
      user_id: user.id,
      user_name: user.name,
      total_amount: total,
      discount: discount,
      items: [...cart],
      created_at: new Date().toISOString(),
      buyer_name: buyerName || undefined,
      buyer_phone: buyerPhone || undefined,
      customer_id: customerId
    };

    await supabaseService.createOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    
    // Refresh products for stock
    setProducts(await supabaseService.getProducts());
    // Refresh customers for points
    setCustomers(await supabaseService.getCustomers(user));

    setShowReceipt(newOrder);
    setCart([]);
  };

  const handleSaveCustomer = async (customer: Customer) => {
    if (!user) return;
    await supabaseService.saveCustomer(customer);
    setCustomers(await supabaseService.getCustomers(user));
  };

  const canUseCart = user && normalizeRole(user.role) !== Role.GUDANG;

  // Navigasi Logic for the new specific sequence
  const dockTabs = useMemo(() => {
    if (!user) return [];
    
    const tabs = [
      { id: 'catalog', label: 'Katalog', icon: 'fa-th-large' },
      { id: 'history', label: 'Riwayat', icon: 'fa-history' },
    ];
    
    if (canUseCart) {
      tabs.push({ id: 'cart_toggle', label: 'Keranjang', icon: 'fa-shopping-basket' });
    }

    if (normalizeRole(user.role) === Role.ADMIN) {
      tabs.push({ id: 'admin', label: 'Admin', icon: 'fa-cog' });
    }

    tabs.push({ id: 'logout', label: 'Keluar', icon: 'fa-sign-out-alt' });

    return tabs;
  }, [user, canUseCart]);

  const activeTabIndex = dockTabs.findIndex(t => t.id === view);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-20 border-t-blue-600 mb-4"></div>
        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase animate-pulse">Memuat SmartPOS...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden relative">
      {/* 4. REFINED BOX GLASS HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 no-print p-2 pointer-events-none">
        <div className="max-w-5xl mx-auto w-full pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-5 py-2.5 rounded-2xl flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
                <i className="fas fa-cash-register text-sm"></i>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-black text-blue-800 tracking-tighter leading-none">SmartPOS</h1>
                <span className="text-[9px] font-bold uppercase text-blue-500/60 tracking-[0.15em] mt-1">Sistem Pintar</span>
              </div>
            </div>

            {/* User / Login Section */}
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {!user ? (
                  <motion.button
                    key="login-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => (document.getElementById('login-modal') as any).showModal()}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-lock"></i>
                    Masuk
                  </motion.button>
                ) : (
                  <motion.div 
                    key="user-badge"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 pl-5 border-l border-gray-100"
                  >
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="font-black text-gray-800 text-[11px] uppercase tracking-tight">{user.name}</p>
                      </div>
                      <div className="mt-1 px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4 pt-20 no-print scroll-smooth relative"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto w-full pt-1"
          >
            {view === 'catalog' && (
              <div className="flex flex-col gap-4 pb-24 relative">
                <div className="order-2">
                  <Katalog products={products} onAddToCart={addToCart} user={user} />
                </div>
              </div>
            )}
            {view === 'admin' && user && (
              <div className="pb-24">
                <AdminDashboard 
                  products={products} 
                  onProductsChange={async () => setProducts(await supabaseService.getProducts())}
                  orders={orders}
                  customers={customers}
                  currentUser={user}
                  onCustomersChange={async () => setCustomers(await supabaseService.getCustomers(user))}
                />
              </div>
            )}
            {view === 'history' && user && (
              <div className="pb-24">
                <Riwayat orders={orders} user={user} onViewOrder={setShowReceipt} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* GLOBAL KERANJANG DRAWER */}
        <AnimatePresence>
          {showCart && canUseCart && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCart(false)}
                className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm no-print"
              />
              
              {/* Drawer */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white z-[70] shadow-2xl no-print flex flex-col"
              >
                <div className="flex-1 overflow-hidden">
                  <Keranjang 
                    items={cart} 
                    onUpdateQuantity={updateCartQuantity} 
                    onSetQuantity={setManualQuantity}
                    onRemove={removeFromCart} 
                    onCheckout={() => { handleCheckout(); setShowCart(false); }}
                    onReset={() => setCart([])}
                    onClose={() => setShowCart(false)}
                    customers={customers}
                    onSaveCustomer={handleSaveCustomer}
                    currentUser={user!}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* 4. REFINED BOX GLASS NAVIGATION BAR - Only when logged in */}
      <AnimatePresence>
        {user && (
          <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none no-print">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ 
                y: isDockVisible ? 0 : 100, 
                opacity: isDockVisible ? 1 : 0 
              }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="mx-auto w-[92%] max-w-[480px] pointer-events-auto"
            >
              <div className="bg-white/80 backdrop-blur-2xl p-1.5 rounded-2xl flex items-center relative border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.12)] h-16">
                {dockTabs.map((tab) => {
                  const isActive = (view === tab.id) || (tab.id === 'cart_toggle' && showCart);
                  
                  return (
                    <button 
                      key={tab.id}
                      onClick={() => { 
                        if (tab.id === 'logout') {
                          handleLogout();
                        } else if (tab.id === 'cart_toggle') {
                          setShowCart(!showCart);
                        } else {
                          setView(tab.id as any); 
                          setShowCart(false);
                          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); 
                        }
                      }}
                      className="relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 isolate group"
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-200"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      <div className="relative mb-0.5">
                        <i className={`fas ${tab.icon} relative z-10 transition-all duration-300 ${
                          isActive ? 'text-white scale-110' : 'text-gray-400 text-base group-hover:text-blue-500'
                        }`}></i>
                        
                        {tab.id === 'cart_toggle' && cart.length > 0 && !isActive && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                          </span>
                        )}
                      </div>

                      <span className={`relative z-10 text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-gray-400 opacity-60'
                      }`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <dialog id="login-modal" className="modal p-0 rounded-[2.5rem] backdrop:bg-black/70 no-print overflow-hidden">
        <div className="w-full max-w-[320px] landscape:max-w-[500px] h-auto overflow-y-auto max-h-[95vh]">
          <LoginPin onLogin={handleLogin} onCancel={() => (document.getElementById('login-modal') as any).close()} />
        </div>
      </dialog>

      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 no-print">
          <div className="bg-white rounded-xl max-w-[340px] w-full p-5 animate-in zoom-in duration-200">
            <div className="max-h-[70vh] overflow-y-auto">
              <Struk order={showReceipt} />
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm"
              >
                Cetak Nota
              </button>
              <button 
                onClick={() => setShowReceipt(null)}
                className="flex-1 border border-gray-300 py-3 rounded-lg font-bold text-gray-600 text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="print-area" className="hidden">
        {showReceipt && <Struk order={showReceipt} />}
      </div>
    </div>
  );
};

export default App;
