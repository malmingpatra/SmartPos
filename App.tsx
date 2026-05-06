
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Role, User, Product, CartItem, Order, Customer, normalizeRole } from './types';
import { supabaseService } from './supabase';
import { APP_CONFIG } from './constants';
import LoginPin from './components/Otentikasi/LoginPin';
import Katalog from './components/Kasir/Katalog';
import Keranjang from './components/Kasir/Keranjang';
import DasborAdmin from './components/Admin/DasborAdmin';
import Riwayat from './components/Kasir/Riwayat';
import Struk from './components/Kasir/Struk';
import ModalKontak from './components/Umum/ModalKontak';
import { ContactLink } from './types';

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
  
  // Persisted Buyer Data for Cart
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showContactLinks, setShowContactLinks] = useState(false);
  const [contactLinks, setContactLinks] = useState<ContactLink[]>([]);
  
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [prods, links] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getContactLinks()
      ]);
      setProducts(prods);
      setContactLinks(links);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      supabaseService.getCustomers(user).then(setCustomers);
      supabaseService.getOrders(user).then(setOrders);
    } else {
      setCustomers([]);
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const handleUpdatePin = async () => {
    if (!user || newPin.length < 3) return;
    setIsUpdatingPin(true);
    try {
      await supabaseService.updateUserPin(user.id, newPin);
      setUser({ ...user, pin: newPin });
      setIsChangePinOpen(false);
      setNewPin('');
      alert('PIN Berhasil Diperbarui!');
    } catch (err) {
      alert('Gagal memperbarui PIN');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const addToCart = (product: Product) => {
    if (!user || normalizeRole(user.role) === Role.GUDANG) return;
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, stock: product.stock, quantity: 1 }];
    });
    // Buka keranjang otomatis saat menambah item
    setShowCart(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setManualQuantity = (id: string, value: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock, value)) } : item
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
    setBuyerName('');
    setBuyerPhone('');
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = async (customer: Customer) => {
    if (!user) return;
    await supabaseService.saveCustomer(customer);
    setCustomers(await supabaseService.getCustomers(user));
  };

  const isGudang = user && normalizeRole(user.role) === Role.GUDANG;
  const isCartDisabled = user && (normalizeRole(user.role) === Role.GUDANG || normalizeRole(user.role) === Role.GUDANG_MASTER);
  const canViewCart = user && (normalizeRole(user.role) !== Role.GUDANG || isGudang);
  const canEditCart = user && normalizeRole(user.role) !== Role.GUDANG;

  // Navigasi Logic for the new specific sequence
  const dockTabs = useMemo(() => {
    if (!user) return [];
    
    const tabs = [
      { id: 'catalog', label: 'Katalog', icon: 'fa-th-large' },
      { id: 'history', label: 'Riwayat', icon: 'fa-history' },
    ];
    
    if (canViewCart) {
      tabs.push({ id: 'cart_toggle', label: 'Keranjang', icon: 'fa-shopping-basket' });
    }

    if (normalizeRole(user.role) === Role.ADMIN || 
        normalizeRole(user.role) === Role.MANAGER ||
        normalizeRole(user.role) === Role.GUDANG_MASTER ||
        normalizeRole(user.role) === Role.GUDANG ||
        normalizeRole(user.role) === Role.KASIR ||
        normalizeRole(user.role) === Role.SALES) {
      tabs.push({ id: 'admin', label: 'Admin', icon: 'fa-cog' });
    }

    tabs.push({ id: 'logout', label: 'Keluar', icon: 'fa-sign-out-alt' });

    return tabs;
  }, [user, canViewCart]);

  const activeTabIndex = dockTabs.findIndex(t => t.id === view);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600 border-opacity-20 border-t-orange-600 mb-4"></div>
        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase animate-pulse">Tunggu Sebentar...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden relative print:block print:h-auto print:overflow-visible print:static">
      {/* 4. REFINED BOX GLASS HEADER */}
      <ModalKontak 
        isOpen={showContactLinks} 
        onClose={() => setShowContactLinks(false)} 
        links={contactLinks} 
      />
      <header className="fixed top-0 left-0 right-0 z-40 no-print p-2 pointer-events-none">
        <div className="max-w-5xl mx-auto w-full pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-5 py-2.5 rounded-2xl flex items-center justify-between">
            {/* Logo Section (Changed to Customer Service Icon) */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowContactLinks(true)}
                className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-100 shrink-0 hover:bg-orange-700 active:scale-95 transition-all group"
              >
                <i className="fas fa-headset text-sm group-hover:rotate-12 transition-transform"></i>
              </button>
              {user && (
                <div className="flex flex-col items-start gap-1">
                  <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border border-orange-100 bg-orange-50 text-orange-600 leading-none`}>
                    {user.role}
                  </span>
                  <button 
                    onClick={() => {
                      setNewPin('');
                      setIsChangePinOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-tight bg-gray-50 text-gray-800 border border-gray-200 hover:bg-white active:scale-95 transition-all shadow-sm leading-none"
                  >
                    {user.name}
                  </button>
                </div>
              )}
            </div>

            {/* User / Login Section */}
            <div className="flex items-center gap-4">
              {user && (
                <div className={`px-2 py-0.5 rounded-lg flex items-center gap-1.5 border ${
                  isOnline 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-red-50 text-red-600 border-red-100'
                } transition-all duration-300`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none translate-y-[0.5px]">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}
              <AnimatePresence mode="wait">
                {!user && (
                  <motion.button
                    key="login-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => (document.getElementById('login-modal') as any).showModal()}
                    className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-lock"></i>
                    Masuk
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-auto p-4 pt-20 scroll-smooth relative print:overflow-visible print:p-0 print:block ${showReceipt ? 'no-print' : ''}`}
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
                <DasborAdmin 
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

        <AnimatePresence>
          {showCart && canViewCart && (
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
                    onCheckout={(discount, name, phone, cid) => { handleCheckout(discount, name, phone, cid); setShowCart(false); }}
                    onReset={() => {
                      setCart([]);
                      setBuyerName('');
                      setBuyerPhone('');
                      setSelectedCustomer(null);
                    }}
                    onClose={() => setShowCart(false)}
                    customers={customers}
                    onSaveCustomer={handleSaveCustomer}
                    currentUser={user!}
                    readOnly={isCartDisabled || false}
                    buyerName={buyerName}
                    setBuyerName={setBuyerName}
                    buyerPhone={buyerPhone}
                    setBuyerPhone={setBuyerPhone}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Modal Ganti PIN */}
      <AnimatePresence>
        {isChangePinOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangePinOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-gray-100 overflow-hidden"
            >
              
              <div className="mb-6 text-center">
                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                  <i className="fas fa-key text-xl"></i>
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Ganti PIN</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Masukkan PIN baru Anda</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                  <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Min 3 Digit"
                    className="bg-transparent text-2xl text-center w-full focus:outline-none font-black tracking-[0.3em] text-orange-600 placeholder:text-gray-200"
                    maxLength={12}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsChangePinOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={newPin.length < 3 || isUpdatingPin}
                    onClick={handleUpdatePin}
                    className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-orange-600 text-white shadow-lg shadow-orange-200 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isUpdatingPin ? (
                       <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <i className="fas fa-save"></i>
                    )}
                    Simpan PIN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                          if (isCartDisabled) return;
                          setShowCart(!showCart);
                        } else {
                          setView(tab.id as any); 
                          setShowCart(false);
                          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); 
                        }
                      }}
                      className={`relative flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 isolate group ${
                        tab.id === 'cart_toggle' && isCartDisabled ? 'opacity-30 grayscale cursor-not-allowed' : 'active:scale-95'
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-orange-600 rounded-xl shadow-md shadow-orange-200"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      <div className="relative mb-0.5">
                        <i className={`fas ${tab.icon} relative z-10 transition-all duration-300 ${
                          isActive ? 'text-white scale-110' : 'text-gray-400 text-base group-hover:text-orange-500'
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
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold text-sm"
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

      <div className="hidden print-area">
        {showReceipt && <Struk order={showReceipt} />}
      </div>
    </div>
  );
};

export default App;
