
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, User, Role, normalizeRole } from '../../types';
import { APP_CONFIG } from '../../constants';

interface KatalogProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  user: User | null;
}

const ProductRow = ({ 
  p, 
  isButtonDisabled, 
  onAddToCart, 
  setViewingProductName 
}: { 
  p: Product, 
  isButtonDisabled: boolean, 
  onAddToCart: (p: Product) => void,
  setViewingProductName: (name: string) => void
}) => {
  const [isActive, setIsActive] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && containerRef.current) {
        const nameEl = contentRef.current.querySelector('h3');
        const catEl = contentRef.current.querySelector('.category-tag');
        const containerWidth = containerRef.current.offsetWidth;
        
        // We measure against the parent container width
        // scrollWidth gives us the full content width even if truncated
        const nameOverflows = nameEl ? nameEl.scrollWidth > containerWidth : false;
        const catOverflows = catEl ? catEl.scrollWidth > containerWidth : false;
        
        setCanScroll(nameOverflows || catOverflows);
      }
    };

    checkOverflow();

    // Resize observer to handle window or container size changes
    const observer = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [p.name, p.category]);

  const isScrolling = isActive && canScroll;

  return (
    <div 
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50 transition gap-3 select-none"
    >
      <div ref={containerRef} className="w-[50%] min-w-[120px] flex-shrink-0 overflow-hidden">
          <div className={isScrolling ? 'animate-marquee-seamless flex w-max gap-10' : 'flex'}>
          {/* Main Content Block */}
          <div ref={contentRef} className="flex flex-col gap-1 shrink-0 min-w-full">
            {/* Category Tag */}
            <div className={`category-tag bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest text-[8px] md:text-[9px] self-start whitespace-nowrap ${!isScrolling && 'truncate'}`}>
              {p.category}
            </div>
            {/* Name */}
            <h3 
              onClick={() => setViewingProductName(p.name)}
              className={`font-bold text-gray-800 text-sm md:text-base cursor-help hover:text-orange-600 transition whitespace-nowrap ${!isScrolling && 'truncate'}`}
            >
              {p.name}
            </h3>
          </div>
          {/* Duplicate Block for Seamless Scrolling (Sync) */}
          {isScrolling && (
            <div className="flex flex-col gap-1 shrink-0 min-w-full">
              <div className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest text-[8px] md:text-[9px] self-start whitespace-nowrap">
                {p.category}
              </div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base whitespace-nowrap">
                {p.name}
              </h3>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            p.stock <= 0 ? 'bg-red-50 text-red-400' : 
            p.stock <= 5 ? 'bg-orange-50 text-orange-500' : 
            'bg-green-50 text-green-600'
          }`}>
            Stok: {p.stock}
          </span>
          {p.stock <= 0 && (
            <span className="bg-gray-100 text-gray-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
              Habis
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 text-right">
        <p className="text-orange-700 font-black text-sm md:text-lg whitespace-nowrap">
          Rp{p.price.toLocaleString('id-ID')}
        </p>
      </div>

      <div className="shrink-0 ml-1">
        <button 
          disabled={isButtonDisabled || p.stock <= 0}
          onClick={() => onAddToCart(p)}
          className={`flex items-center justify-center rounded-lg font-bold transition-all ${
            isButtonDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
            p.stock <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
            'bg-orange-600 text-white hover:bg-orange-700 active:scale-90 shadow-sm'
          } w-9 h-9 md:w-auto md:h-10 md:px-4`}
        >
          <i className="fas fa-plus text-sm"></i>
          <span className="hidden md:inline ml-2 text-sm">Tambah</span>
        </button>
      </div>
    </div>
  );
};

const Katalog: React.FC<KatalogProps> = ({ products, onAddToCart, user }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sortStock, setSortStock] = useState<'none' | 'asc' | 'desc'>('none');
  const [page, setPage] = useState(1);
  const [viewingProductName, setViewingProductName] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).sort((a, b) => a.localeCompare(b));
    return ['Semua', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'Semua' || p.category === category)
    );

    if (sortStock === 'asc') result.sort((a, b) => a.stock - b.stock);
    if (sortStock === 'desc') result.sort((a, b) => b.stock - a.stock);

    return result;
  }, [products, search, category, sortStock]);

  const paginated = useMemo(() => {
    const start = (page - 1) * APP_CONFIG.PAGE_SIZE;
    return filtered.slice(start, start + APP_CONFIG.PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / APP_CONFIG.PAGE_SIZE);

  const isButtonDisabled = !user || normalizeRole(user.role) === Role.GUDANG || normalizeRole(user.role) === Role.GUDANG_MASTER;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Search and Filters - Refined Balanced Box Design */}
      <div className="sticky top-0 z-20 -mx-1 pt-0.5 pb-2 no-print pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl border border-gray-100 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] flex flex-col gap-3 items-stretch pointer-events-auto transition-all duration-300">
          <div className="relative w-full">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Cari produk..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50/50 outline-none text-xs font-bold transition-all placeholder:text-gray-300 shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-3 w-full">
            <div className="relative w-[70%]">
              <i className="fas fa-filter absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 text-[10px] pointer-events-none z-10"></i>
              <select 
                className="w-full pl-8 pr-8 py-3 bg-gray-50 border border-gray-100 rounded-xl appearance-none focus:outline-none focus:bg-white focus:border-orange-400 text-xs font-bold text-gray-700 shadow-sm cursor-pointer hover:border-orange-200 transition-all"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
            </div>
            <button 
              onClick={() => {
                setSortStock(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none');
                setPage(page); // keep page
              }}
              className={`w-[30%] px-3 py-3 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                sortStock !== 'none' 
                  ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              <i className="fas fa-layer-group text-[10px] opacity-70"></i> 
              <span className="font-bold">{sortStock === 'asc' ? '↑' : sortStock === 'desc' ? '↓' : 'STOK'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product List - Reverted to Vertical List */}
      <div className="bg-white rounded-xl border shadow-sm divide-y overflow-hidden">
        {paginated.length > 0 ? (
          paginated.map(p => (
            <ProductRow 
              key={p.id} 
              p={p} 
              isButtonDisabled={isButtonDisabled} 
              onAddToCart={onAddToCart} 
              setViewingProductName={setViewingProductName} 
            />
          ))
        ) : (
          <div className="p-12 text-center text-gray-400">
             <i className="fas fa-search text-3xl mb-2 block"></i>
             <p className="text-sm font-medium">Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Pagination - Static */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 pb-8">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-20"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
             <span className="text-xs font-bold text-gray-400 px-1">{page}</span>
             <span className="text-xs text-gray-300">/</span>
             <span className="text-xs font-bold text-gray-600 px-1">{totalPages}</span>
          </div>

          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-20"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      )}

      {/* Name Viewer Popup - Static */}
      {viewingProductName && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full animate-in zoom-in duration-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Nama Produk Lengkap:</h4>
            <p className="text-xl font-bold text-gray-800 leading-tight mb-6">{viewingProductName}</p>
            <button 
              onClick={() => setViewingProductName(null)}
              className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Katalog;
