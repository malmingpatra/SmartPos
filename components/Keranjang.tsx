
import React, { useState, useMemo } from 'react';
import { CartItem, Customer, User, normalizeRole } from '../types';
import FormMember from './FormMember';

interface KeranjangProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, value: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (discount: number, buyerName?: string, buyerPhone?: string, customerId?: string) => void;
  onReset: () => void;
  onClose: () => void;
  customers: Customer[];
  onSaveCustomer: (c: Customer) => void;
  currentUser: User;
  readOnly?: boolean;
  buyerName: string;
  setBuyerName: (name: string) => void;
  buyerPhone: string;
  setBuyerPhone: (phone: string) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
}

const Keranjang: React.FC<KeranjangProps> = ({ 
  items, onUpdateQuantity, onSetQuantity, onRemove, onCheckout, onReset, onClose, customers, onSaveCustomer, currentUser, readOnly = false,
  buyerName, setBuyerName, buyerPhone, setBuyerPhone, selectedCustomer, setSelectedCustomer
}) => {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setBuyerName(c.name);
    setBuyerPhone(c.phone);
    setCustomerSearch('');
  };

  const handleCheckout = () => {
    onCheckout(discountAmount, buyerName, buyerPhone, selectedCustomer?.id);
    setDiscountPercent(0);
    setShowBuyerForm(false);
  };

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden max-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-4 border-b border-gray-50 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <i className="fas fa-shopping-basket text-blue-600"></i> {readOnly ? 'Isi Keranjang' : 'Keranjang'}
        </h2>
        {items.length > 0 && !readOnly && (
          <button 
            onClick={onReset} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 border border-red-100 active:scale-95 transition-all shadow-sm shadow-red-50"
          >
            <i className="fas fa-trash-alt"></i> Kosongkan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-300 h-full min-h-[150px] border border-dashed border-gray-100 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
              <i className="fas fa-box-open text-xs"></i> Keranjang Kosong
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate text-xs leading-tight">{item.name}</h4>
                  <p className="text-blue-600 font-black text-[10px] mt-1">Rp{item.price.toLocaleString('id-ID')}</p>
                </div>
                
                <div className={`flex items-center gap-1 bg-gray-50 rounded-xl p-1 h-fit shrink-0 border border-gray-100 ml-auto ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
                  <button onClick={() => !readOnly && onUpdateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-blue-600 transition-colors">
                    <i className="fas fa-minus text-[8px]"></i>
                  </button>
                  <input type="number" inputMode="numeric" readOnly={readOnly} className="w-8 bg-transparent text-center font-black text-xs focus:outline-none text-gray-700" value={item.quantity} onChange={(e) => { if (readOnly) return; const val = parseInt(e.target.value); if (!isNaN(val) && val >= 0) onSetQuantity(item.id, val); }} />
                  <button onClick={() => !readOnly && onUpdateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-blue-600 transition-colors">
                    <i className="fas fa-plus text-[8px]"></i>
                  </button>
                </div>

                {!readOnly && (
                  <button onClick={() => onRemove(item.id)} className="text-gray-200 hover:text-red-400 transition-colors pl-1 shrink-0">
                    <i className="fas fa-times-circle text-lg"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
        {/* Customer Data Section - Now Sticky above subtotal */}
        <div>
          {selectedCustomer ? (
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Member Terpilih</p>
                <p className="text-sm font-black text-amber-900">{selectedCustomer.name}</p>
                <p className="text-[10px] text-amber-700">HP: {selectedCustomer.phone}</p>
              </div>
              {!readOnly && (
                <button onClick={() => { setSelectedCustomer(null); setBuyerName(''); setBuyerPhone(''); }} className="text-amber-400 hover:text-amber-600">
                  <i className="fas fa-times-circle"></i>
                </button>
              )}
            </div>
          ) : (
            <button 
              disabled={readOnly}
              onClick={() => !readOnly && setShowBuyerForm(!showBuyerForm)}
              className={`w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100/50 hover:bg-blue-50 transition-colors ${readOnly ? 'opacity-50 grayscale' : ''}`}
            >
              <span><i className="fas fa-user-tag mr-2 opacity-70"></i> Data Pembeli</span>
              {!readOnly && <i className={`fas fa-chevron-${showBuyerForm ? 'up' : 'down'} text-[8px] opacity-70`}></i>}
            </button>
          )}
          
          {showBuyerForm && !selectedCustomer && (
            <div className="space-y-4 mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <label className="block text-[9px] font-black text-gray-400 uppercase mb-1.5 ml-1 leading-none">Nama / Pencarian Member</label>
                <div className="w-full relative">
                  <input 
                    type="text" 
                    placeholder="Ketik Nama Pembeli..." 
                    className="w-full bg-white border border-gray-200 px-4 h-11 rounded-xl text-xs font-bold outline-none focus:border-blue-300 transition-all shadow-sm" 
                    value={buyerName} 
                    onChange={(e) => { 
                      setBuyerName(e.target.value);
                      setCustomerSearch(e.target.value); 
                    }} 
                  />
                  {filteredCustomers.length > 0 && customerSearch && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-gray-50">
                      {filteredCustomers.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-xs font-black text-gray-800">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-[0.5]">
                  <label className="block text-[9px] font-black text-gray-400 uppercase mb-1.5 ml-1 leading-none text-center">Nomor HP</label>
                  <input 
                    type="tel" 
                    placeholder="08..." 
                    className="w-full bg-white border border-gray-200 px-3 h-11 rounded-xl text-xs font-bold outline-none focus:border-blue-300 transition-all shadow-sm text-center" 
                    value={buyerPhone} 
                    onChange={(e) => setBuyerPhone(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={() => {
                    if (buyerName && buyerPhone) {
                      const newCust: Customer = {
                        id: crypto.randomUUID(),
                        name: buyerName,
                        phone: buyerPhone,
                        total_spent: 0,
                        created_at: new Date().toISOString(),
                        created_by: currentUser.id,
                        created_by_role: normalizeRole(currentUser.role)
                      };
                      onSaveCustomer(newCust);
                      setSelectedCustomer(newCust);
                      setShowBuyerForm(false);
                      setCustomerSearch('');
                    }
                  }}
                  disabled={!buyerName || !buyerPhone}
                  className="flex-[0.3] bg-emerald-500 text-white h-11 rounded-xl text-[8px] font-black uppercase tracking-tighter shadow-sm shadow-emerald-100 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-1"
                >
                  <i className="fas fa-save text-[9px]"></i> Simpan
                </button>
                <button 
                  onClick={() => {
                    setBuyerName('');
                    setBuyerPhone('');
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="flex-[0.2] bg-gray-100 text-gray-400 h-11 rounded-xl text-[8px] font-black uppercase tracking-tighter shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  <i className="fas fa-undo"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-gray-400 text-[10px] font-black uppercase tracking-wider">
            <span>Subtotal</span>
            <span className="text-gray-600">Rp {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Potongan (%)</span>
            <div className="relative w-24">
              <input type="number" inputMode="numeric" readOnly={readOnly} placeholder="0" max="100" min="0" className={`w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-right text-xs font-black text-red-500 focus:bg-white focus:border-red-400 transition-all outline-none pr-7 ${readOnly ? 'opacity-50' : ''}`} value={discountPercent || ''} onChange={(e) => { if (readOnly) return; const val = Number(e.target.value); if (val >= 0 && val <= 100) setDiscountPercent(val); }} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-400 pointer-events-none">%</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
          <div>
            <span className="font-black text-gray-800 text-xs uppercase tracking-widest block">Total Bayar</span>
          </div>
          <span className="text-2xl font-black text-blue-700 tracking-tighter">Rp {total.toLocaleString()}</span>
        </div>

        <div className="flex gap-3">
          {!readOnly ? (
            <button 
              disabled={items.length === 0}
              onClick={handleCheckout}
              className="w-[70%] bg-blue-600 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.1em] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              <i className="fas fa-print text-sm opacity-70"></i> 
              <span>Selesai & Cetak</span>
            </button>
          ) : (
            <div className="w-[70%] bg-blue-50 text-blue-400 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 opacity-60">
              <i className="fas fa-info-circle"></i>
              <span>Hanya Lihat</span>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className={`${readOnly ? 'w-[30%]' : 'w-[30%]'} bg-gray-100 text-gray-600 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center border border-gray-200/50`}
          >
            Tutup
          </button>
        </div>
      </div>

      {isAddingCustomer && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 animate-in fade-in zoom-in duration-300 shadow-2xl">
             <FormMember 
              customer={null} 
              onClose={() => setIsAddingCustomer(false)} 
              onSave={(c) => { 
                c.created_by = currentUser.id;
                c.created_by_role = normalizeRole(currentUser.role);
                onSaveCustomer(c); 
                handleSelectCustomer(c);
                setIsAddingCustomer(false); 
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Keranjang;
