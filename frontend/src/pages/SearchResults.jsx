// frontend/src/pages/SearchResults.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Range } from 'react-range';
import toast from 'react-hot-toast';
import {
  FiSearch, FiHeart, FiShoppingCart, FiX, FiSliders, FiGrid,
  FiList, FiChevronLeft, FiChevronRight, FiCheck,
  FiArrowLeft, FiUser, FiAlertCircle, FiHome
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
.sr-root { font-family: 'Sora', sans-serif; }
.sr-mono { font-family: 'JetBrains Mono', monospace; }

@keyframes sr-fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes sr-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes sr-scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
@keyframes sr-slideIn { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes sr-spin    { to{transform:rotate(360deg)} }
@keyframes sr-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes sr-heartPop{ 0%{transform:scale(1)} 50%{transform:scale(1.45)} 100%{transform:scale(1)} }
@keyframes sr-cardIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes sr-popIn   { 0%{transform:scale(0)} 70%{transform:scale(1.12)} 100%{transform:scale(1)} }

.sr-fadeUp  { animation: sr-fadeUp  .46s cubic-bezier(.22,1,.36,1) both }
.sr-fadeIn  { animation: sr-fadeIn  .32s ease both }
.sr-scaleIn { animation: sr-scaleIn .28s cubic-bezier(.22,1,.36,1) both }
.sr-slideIn { animation: sr-slideIn .32s ease both }
.sr-spin    { animation: sr-spin .8s linear infinite }
.sr-heartPop{ animation: sr-heartPop .3s cubic-bezier(.22,1,.36,1) }
.sr-cardIn  { animation: sr-cardIn .4s cubic-bezier(.22,1,.36,1) both }
.sr-popIn   { animation: sr-popIn .22s cubic-bezier(.22,1,.36,1) both }

.sr-shimmer {
  background: linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%);
  background-size: 600px 100%;
  animation: sr-shimmer 1.4s infinite linear;
}
.dark .sr-shimmer {
  background: linear-gradient(90deg,#1f2937 25%,#374151 50%,#1f2937 75%);
  background-size: 600px 100%;
}

.sr-btn {
  transition: transform .15s cubic-bezier(.22,1,.36,1),
              box-shadow .15s ease, background .15s ease, opacity .15s ease;
}
.sr-btn:hover:not(:disabled)  { transform: translateY(-1px); }
.sr-btn:active:not(:disabled) { transform: scale(.97); }
.sr-btn:disabled { opacity:.45; cursor:not-allowed; }

.sr-card { transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease; }
.sr-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.11); }

.sr-img-zoom { transition: transform .4s cubic-bezier(.22,1,.36,1); }
.sr-card:hover .sr-img-zoom { transform: scale(1.07); }

.sr-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,184,148,.18);
  border-color: #00b894;
}

/* Price range thumb */
.sr-thumb {
  width: 20px; height: 20px;
  background: #00b894;
  border-radius: 50%;
  border: 2.5px solid white;
  box-shadow: 0 2px 8px rgba(0,184,148,.4);
  cursor: grab;
  transition: transform .15s ease, box-shadow .15s ease;
}
.sr-thumb:active { cursor: grabbing; transform: scale(1.2); box-shadow: 0 4px 16px rgba(0,184,148,.5); }

/* Price input */
.sr-price-input {
  width: 100%;
  padding: 8px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  background: #f9fafb;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.dark .sr-price-input {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}
.sr-price-input:focus {
  outline: none;
  border-color: #00b894;
  box-shadow: 0 0 0 3px rgba(0,184,148,.15);
}

.sr-chip {
  animation: sr-popIn .2s cubic-bezier(.22,1,.36,1) both;
}

.sr-sidebar { position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow-y: auto; }
.sr-sidebar::-webkit-scrollbar { width: 3px; }
.sr-sidebar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-px">
      {Array(full).fill(0).map((_,i) => <FaStar key={`f${i}`} size={size} className="text-amber-400"/>)}
      {half && <FaStarHalfAlt size={size} className="text-amber-400"/>}
      {Array(empty).fill(0).map((_,i) => <FaRegStar key={`e${i}`} size={size} className="text-gray-300 dark:text-gray-600"/>)}
    </span>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="sr-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00b894]/10 text-[#00b894] text-xs font-semibold rounded-full border border-[#00b894]/25">
      {label}
      <button onClick={onRemove} className="hover:bg-[#00b894]/20 rounded-full p-0.5 transition">
        <FiX size={10}/>
      </button>
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800">
      <div className="h-52 sr-shimmer"/>
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 sr-shimmer rounded-lg w-3/4"/>
        <div className="h-3 sr-shimmer rounded-lg w-1/2"/>
        <div className="h-5 sr-shimmer rounded-lg w-1/3 mt-4"/>
      </div>
    </div>
  );
}

// ─── Product card (grid) — fixed: div wrapper, no glitch ─────────────────────
function ProductCard({ product, index, wishlistIds, onToggleWishlist, onAddToCart }) {
  const [isFav, setIsFav]         = useState(wishlistIds.has(product._id));
  const [favAnim, setFavAnim]     = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const navigate = useNavigate();

  // Sync if parent wishlist changes
  useEffect(() => { setIsFav(wishlistIds.has(product._id)); }, [wishlistIds, product._id]);

  const goToProduct = () => navigate(`/product/${product._id}`);

  const handleFav = (e) => {
    e.stopPropagation();
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 350);
    setIsFav(f => !f);
    onToggleWishlist(product._id, isFav);
  };

  const handleCart = async (e) => {
    e.stopPropagation();
    if (cartLoading || product.stock === 0) return;
    setCartLoading(true);
    await onAddToCart(product);
    setCartLoading(false);
  };

  return (
    <div
      onClick={goToProduct}
      className="sr-card sr-cardIn bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm flex flex-col group cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        <img
          src={product.image || 'https://placehold.co/400x400?text=Produit'}
          alt={product.title}
          className="sr-img-zoom w-full h-full object-cover"
          onError={e => e.target.src='https://placehold.co/400x400?text=?'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

        {/* Stock badges */}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow">Rupture</span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow">Stock limité</span>
        )}

        {/* Wishlist */}
        <button
          onClick={handleFav}
          className={`absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-all duration-200
            ${isFav
              ? 'bg-red-500 text-white opacity-100'
              : 'bg-white/90 dark:bg-gray-900/90 text-gray-400 opacity-0 group-hover:opacity-100'
            }`}
        >
          <FiHeart size={15} className={`${favAnim ? 'sr-heartPop' : ''} ${isFav ? 'fill-white' : ''}`}/>
        </button>

        {/* Cart — always positioned, revealed on hover, NO translate animation that glitches */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCart}
            disabled={product.stock === 0 || cartLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all duration-150
              bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-95"
          >
            {cartLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full sr-spin"/>
              : <FiShoppingCart size={13}/>
            }
            {cartLoading ? 'Ajout…' : product.stock === 0 ? 'Rupture' : 'Ajouter au panier'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1 truncate">
          <FiUser size={10} className="flex-shrink-0"/> {product.seller?.name || 'Anonyme'}
        </p>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-[#00b894] transition-colors leading-snug flex-1">
          {product.title}
        </h3>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars rating={product.averageRating} size={11}/>
            <span className="sr-mono text-xs text-gray-400">({product.ratingCount || 0})</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-100 dark:border-gray-800">
          <span className="sr-mono font-black text-[#00b894] text-xl leading-none">
            {product.price?.toFixed(2)}<span className="text-xs font-semibold opacity-60 ml-0.5">DT</span>
          </span>
          {product.category && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg truncate max-w-[90px]">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product row (list view) ──────────────────────────────────────────────────
function ProductRow({ product, index, wishlistIds, onToggleWishlist, onAddToCart }) {
  const [isFav, setIsFav]             = useState(wishlistIds.has(product._id));
  const [favAnim, setFavAnim]         = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setIsFav(wishlistIds.has(product._id)); }, [wishlistIds, product._id]);

  const handleFav = (e) => {
    e.stopPropagation();
    setFavAnim(true); setTimeout(() => setFavAnim(false), 350);
    setIsFav(f => !f);
    onToggleWishlist(product._id, isFav);
  };

  const handleCart = async (e) => {
    e.stopPropagation();
    if (cartLoading || product.stock === 0) return;
    setCartLoading(true);
    await onAddToCart(product);
    setCartLoading(false);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="sr-card sr-cardIn bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm flex items-center gap-4 p-4 group cursor-pointer"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        <img src={product.image||'https://placehold.co/96x96?text=?'} alt={product.title}
          className="sr-img-zoom w-full h-full object-cover"
          onError={e=>e.target.src='https://placehold.co/96x96?text=?'}/>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1 truncate">
          <FiUser size={10} className="flex-shrink-0"/>{product.seller?.name||'Anonyme'}
        </p>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-[#00b894] transition-colors">
          {product.title}
        </h3>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Stars rating={product.averageRating} size={11}/>
            <span className="sr-mono text-xs text-gray-400">({product.ratingCount||0})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {product.stock === 0
            ? <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold">Rupture</span>
            : product.stock <= 5
            ? <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg font-semibold">Stock limité</span>
            : <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-semibold">En stock</span>
          }
          {product.category && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg">{product.category}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="sr-mono font-black text-[#00b894] text-xl leading-none">
          {product.price?.toFixed(2)}<span className="text-xs opacity-60 ml-0.5">DT</span>
        </span>
        <div className="flex gap-2">
          <button onClick={handleFav}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isFav?'bg-red-50 dark:bg-red-900/20 text-red-500':'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-400'}`}>
            <FiHeart size={14} className={`${favAnim?'sr-heartPop':''} ${isFav?'fill-red-500':''}`}/>
          </button>
          <button onClick={handleCart} disabled={product.stock===0||cartLoading}
            className="sr-btn w-9 h-9 bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition">
            {cartLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full sr-spin"/>
              : <FiShoppingCart size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Price Filter — ecommerce style ──────────────────────────────────────────
// Min/max inputs + slider, all debounced so no glitch on each keystroke
function PriceFilter({ min, max, value, onChange }) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const debounceRef = useRef(null);

  // Sync from parent when reset
  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value[0], value[1]]);

  const commit = useCallback((newMin, newMax) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const clampedMin = Math.max(min, Math.min(newMin, newMax - 1));
      const clampedMax = Math.min(max, Math.max(newMax, newMin + 1));
      onChange([clampedMin, clampedMax]);
    }, 600);
  }, [min, max, onChange]);

  const handleMinInput = (raw) => {
    const v = raw === '' ? min : Number(raw);
    setLocalMin(v);
    commit(v, localMax);
  };

  const handleMaxInput = (raw) => {
    const v = raw === '' ? max : Number(raw);
    setLocalMax(v);
    commit(localMin, v);
  };

  // Clamp for display
  const safeMin = Math.max(min, Math.min(localMin, localMax - 1));
  const safeMax = Math.min(max, Math.max(localMax, localMin + 1));
  const sliderMin = isNaN(safeMin) ? min : safeMin;
  const sliderMax = isNaN(safeMax) ? max : safeMax;
  const rangeValid = max > min;

  return (
    <div className="space-y-4">
      {/* Min / Max inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1">Min (DT)</label>
          <input
            type="number"
            min={min}
            max={localMax - 1}
            value={localMin}
            onChange={e => handleMinInput(e.target.value)}
            className="sr-price-input"
            placeholder={String(min)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1">Max (DT)</label>
          <input
            type="number"
            min={localMin + 1}
            max={max}
            value={localMax}
            onChange={e => handleMaxInput(e.target.value)}
            className="sr-price-input"
            placeholder={String(max)}
          />
        </div>
      </div>

      {/* Visual slider — only renders when range is valid */}
      {rangeValid && (
        <div className="px-1 pt-2">
          <Range
            values={[sliderMin, sliderMax]}
            step={Math.max(1, Math.floor((max - min) / 100))}
            min={min}
            max={max}
            onChange={([a, b]) => {
              setLocalMin(a);
              setLocalMax(b);
            }}
            onFinalChange={([a, b]) => {
              setLocalMin(a);
              setLocalMax(b);
              onChange([a, b]);
            }}
            renderTrack={({ props, children }) => (
              <div {...props} style={props.style}
                className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 relative">
                <div className="absolute h-full rounded-full bg-[#00b894]" style={{
                  left: `${((sliderMin - min) / (max - min)) * 100}%`,
                  right: `${100 - ((sliderMax - min) / (max - min)) * 100}%`
                }}/>
                {children}
              </div>
            )}
            renderThumb={({ props, isDragged }) => (
              <div {...props} style={props.style}
                className={`sr-thumb focus:outline-none ${isDragged ? 'scale-125' : ''}`}/>
            )}
          />
          <div className="flex justify-between mt-2">
            <span className="sr-mono text-xs text-gray-400">{min} DT</span>
            <span className="sr-mono text-xs text-gray-400">{max} DT</span>
          </div>
        </div>
      )}

      {/* Quick presets */}
      {rangeValid && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: 'Tout', v: [min, max] },
            { label: `< ${Math.round(max * 0.25)} DT`, v: [min, Math.round(max * 0.25)] },
            { label: `< ${Math.round(max * 0.5)} DT`,  v: [min, Math.round(max * 0.5)] },
            { label: `< ${Math.round(max * 0.75)} DT`, v: [min, Math.round(max * 0.75)] },
          ].map((preset, i) => {
            const active = localMin === preset.v[0] && localMax === preset.v[1];
            return (
              <button key={i}
                onClick={() => { setLocalMin(preset.v[0]); setLocalMax(preset.v[1]); onChange(preset.v); }}
                className={`sr-btn text-xs px-2.5 py-1 rounded-lg border font-semibold transition ${
                  active
                    ? 'bg-[#00b894] border-[#00b894] text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#00b894] hover:text-[#00b894]'
                }`}>
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [products, setProducts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const limit = 24;

  // Filters
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [minPriceReal, setMinPriceReal]       = useState(0);
  const [maxPriceReal, setMaxPriceReal]       = useState(0);
  const [appliedRange, setAppliedRange]       = useState([0, 0]);
  const [inStockOnly, setInStockOnly]         = useState(false);
  const [sortBy, setSortBy]                   = useState('price-asc');
  const [sellers, setSellers]                 = useState([]);
  const priceInitialized                      = useRef(false);

  // UI
  const [viewMode, setViewMode]       = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(query);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Inject CSS
  useEffect(() => {
    if (!document.getElementById('sr-styles')) {
      const el = document.createElement('style');
      el.id='sr-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Load wishlist
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get('/api/wishlist', { headers:{ Authorization:`Bearer ${token}` } })
      .then(res => setWishlistIds(new Set((res.data.products||[]).map(p=>p._id))))
      .catch(()=>{});
  }, []);

  // Sync search box
  useEffect(() => { setLocalSearch(query); }, [query]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        params.append('page', page);
        params.append('limit', limit);
        if (selectedSellers.length > 0) params.append('sellers', selectedSellers.join(','));
        if (appliedRange[0] > minPriceReal) params.append('minPrice', appliedRange[0]);
        if (appliedRange[1] < maxPriceReal) params.append('maxPrice', appliedRange[1]);
        if (inStockOnly) params.append('inStock', 'true');
        params.append('sort', sortBy);

        const res = await axios.get(`/api/products/search?${params.toString()}`);

        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
        setSellers(res.data.sellers || []);

        // Only initialize price range ONCE (first successful response)
        if (!priceInitialized.current) {
          const newMin = res.data.minPrice ?? 0;
          const newMax = res.data.maxPrice ?? 100000;
          if (newMax > newMin) {
            setMinPriceReal(newMin);
            setMaxPriceReal(newMax);
            setAppliedRange([newMin, newMax]);
            priceInitialized.current = true;
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Erreur lors du chargement des résultats');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, page, selectedSellers, appliedRange, inStockOnly, sortBy]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSellerToggle = (id) => {
    setSelectedSellers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearch.trim()) { setSearchParams({ q: localSearch.trim() }); setPage(1); }
  };

  const resetFilters = () => {
    setSelectedSellers([]);
    setAppliedRange([minPriceReal, maxPriceReal]);
    setInStockOnly(false);
    setSortBy('price-asc');
    setPage(1);
  };

  const handlePriceChange = useCallback((range) => {
    setAppliedRange(range);
    setPage(1);
  }, []);

  const toggleWishlist = async (productId, isFav) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    const endpoint = isFav ? '/api/wishlist/remove' : '/api/wishlist/add';
    setWishlistIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(productId) : next.add(productId);
      return next;
    });
    try {
      await axios.post(endpoint, { productId }, { headers:{ Authorization:`Bearer ${token}` } });
      window.dispatchEvent(new Event('wishlistUpdate'));
      toast.success(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris ❤️');
    } catch {
      setWishlistIds(prev => {
        const next = new Set(prev);
        isFav ? next.add(productId) : next.delete(productId);
        return next;
      });
      toast.error('Erreur favoris');
    }
  };

  const addToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    try {
      await axios.post('/api/cart/add', { productId: product._id, quantity: 1 }, {
        headers:{ Authorization:`Bearer ${token}` }
      });
      window.dispatchEvent(new Event('cartUpdate'));
      const name = product.title?.length > 28 ? product.title.substring(0,28)+'…' : product.title;
      toast.success(`"${name}" ajouté au panier !`);
    } catch { toast.error('Erreur ajout panier'); }
  };

  const activeFilterCount = selectedSellers.length
    + (inStockOnly ? 1 : 0)
    + (appliedRange[0] > minPriceReal || appliedRange[1] < maxPriceReal ? 1 : 0);

  const pagesCount = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <FiSliders size={14} className="text-[#00b894]"/> Filtres
          {activeFilterCount > 0 && (
            <span className="sr-popIn px-2 py-0.5 bg-[#00b894] text-white text-xs rounded-full font-bold">{activeFilterCount}</span>
          )}
        </h2>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-red-500 font-semibold flex items-center gap-1 transition">
            <FiX size={11}/> Tout effacer
          </button>
        )}
      </div>

      {/* ── Price filter ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Prix</h3>
        {maxPriceReal > minPriceReal ? (
          <PriceFilter
            min={minPriceReal}
            max={maxPriceReal}
            value={appliedRange}
            onChange={handlePriceChange}
          />
        ) : (
          <div className="space-y-2">
            <div className="h-8 sr-shimmer rounded-lg"/>
            <div className="h-2 sr-shimmer rounded-full mt-3"/>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800"/>

      {/* ── Stock ─────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Disponibilité</h3>
        <button onClick={() => { setInStockOnly(v=>!v); setPage(1); }}
          className="flex items-center gap-3 w-full group">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${inStockOnly ? 'bg-[#00b894] border-[#00b894]' : 'border-gray-300 dark:border-gray-600 group-hover:border-[#00b894]'}`}>
            {inStockOnly && <FiCheck size={11} className="text-white"/>}
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">En stock seulement</span>
        </button>
      </div>

      {/* ── Sellers ───────────────────────────────────────────────────────── */}
      {sellers.length > 0 && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-800"/>
          <div>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Vendeurs</h3>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {sellers.map(seller => (
                <button key={seller._id} onClick={() => handleSellerToggle(seller._id)}
                  className="flex items-center gap-3 w-full group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-xl transition">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${selectedSellers.includes(seller._id) ? 'bg-[#00b894] border-[#00b894]' : 'border-gray-300 dark:border-gray-600 group-hover:border-[#00b894]'}`}>
                    {selectedSellers.includes(seller._id) && <FiCheck size={9} className="text-white"/>}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 text-left line-clamp-1">{seller.name}</span>
                  <span className="sr-mono text-xs text-gray-400">({seller.count})</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="sr-root min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Sticky search bar */}
      <div className="sr-fadeUp sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="sr-btn w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 transition">
            <FiArrowLeft size={17}/>
          </button>
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="sr-input w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition"
              />
              {localSearch && (
                <button type="button" onClick={() => setLocalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <FiX size={13}/>
                </button>
              )}
            </div>
            <button type="submit"
              className="sr-btn bg-[#00b894] hover:bg-[#00997f] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-md flex-shrink-0">
              Chercher
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-7 flex gap-6">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-60 lg:w-68 flex-shrink-0">
          <div className="sr-slideIn sr-sidebar bg-white dark:bg-gray-900 rounded-2xl shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 p-5">
            <SidebarContent/>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">

          {/* Header row */}
          <div className="sr-fadeUp flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-black text-xl text-gray-900 dark:text-white tracking-tight">
                {query
                  ? <>Résultats pour <span className="text-[#00b894]">"{query}"</span></>
                  : 'Tous les produits'}
              </h1>
              {!loading && total > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{start}–{end} sur {total} produit{total>1?'s':''}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile filters */}
              <button onClick={() => setSidebarOpen(true)}
                className="sr-btn md:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition">
                <FiSliders size={13}/>
                Filtres
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-px bg-[#00b894] text-white text-xs rounded-full">{activeFilterCount}</span>
                )}
              </button>

              {/* Sort */}
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
                className="sr-input px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm cursor-pointer transition">
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name-asc">A → Z</option>
                <option value="name-desc">Z → A</option>
                <option value="newest">Plus récents</option>
              </select>

              {/* View toggle */}
              <div className="flex bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 p-1 gap-0.5">
                {[['grid', FiGrid], ['list', FiList]].map(([mode, Icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`sr-btn w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      viewMode===mode ? 'bg-[#00b894] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    <Icon size={14}/>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active chips */}
          {activeFilterCount > 0 && (
            <div className="sr-fadeIn flex flex-wrap gap-2 mb-5">
              {inStockOnly && (
                <FilterChip label="En stock" onRemove={() => { setInStockOnly(false); setPage(1); }}/>
              )}
              {(appliedRange[0] > minPriceReal || appliedRange[1] < maxPriceReal) && (
                <FilterChip
                  label={`${appliedRange[0].toFixed(0)} – ${appliedRange[1].toFixed(0)} DT`}
                  onRemove={() => { setAppliedRange([minPriceReal, maxPriceReal]); setPage(1); }}
                />
              )}
              {selectedSellers.map(id => {
                const s = sellers.find(x=>x._id===id);
                return s ? <FilterChip key={id} label={s.name} onRemove={() => handleSellerToggle(id)}/> : null;
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={viewMode==='grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
              : 'flex flex-col gap-3'}>
              {Array(8).fill(0).map((_,i) => viewMode==='grid'
                ? <SkeletonCard key={i}/>
                : <div key={i} className="sr-shimmer rounded-2xl h-28"/>
              )}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="sr-scaleIn text-center py-20 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
              <FiAlertCircle size={28} className="text-red-400 mx-auto mb-3"/>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{error}</p>
              <button onClick={() => window.location.reload()}
                className="sr-btn px-5 py-2.5 bg-[#00b894] text-white rounded-xl text-sm font-semibold transition">Réessayer</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && products.length === 0 && (
            <div className="sr-scaleIn text-center py-20 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiSearch size={22} className="text-gray-400"/>
              </div>
              <p className="font-black text-gray-800 dark:text-white text-lg mb-1">Aucun résultat</p>
              <p className="text-gray-400 text-sm mb-6">Ajustez les filtres ou essayez d'autres mots-clés</p>
              <div className="flex gap-3 justify-center">
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters}
                    className="sr-btn px-5 py-2.5 rounded-xl bg-[#00b894] text-white font-semibold text-sm transition">
                    Effacer les filtres
                  </button>
                )}
                <button onClick={() => navigate('/')}
                  className="sr-btn flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <FiHome size={13}/> Accueil
                </button>
              </div>
            </div>
          )}

          {/* Products */}
          {!loading && !error && products.length > 0 && (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p,i) => (
                  <ProductCard key={p._id} product={p} index={i}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={toggleWishlist}
                    onAddToCart={addToCart}/>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map((p,i) => (
                  <ProductRow key={p._id} product={p} index={i}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={toggleWishlist}
                    onAddToCart={addToCart}/>
                ))}
              </div>
            )
          )}

          {/* Pagination */}
          {!loading && total > limit && (
            <div className="sr-fadeUp flex items-center justify-center gap-2 mt-10 flex-wrap">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="sr-btn flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm transition disabled:opacity-40">
                <FiChevronLeft size={14}/> Précédent
              </button>
              {(() => {
                const pageNums = [];
                const s = Math.max(1, page-2), e = Math.min(pagesCount, page+2);
                if (s > 1)         { pageNums.push(1); if (s > 2) pageNums.push('…'); }
                for (let n=s;n<=e;n++) pageNums.push(n);
                if (e < pagesCount){ if (e < pagesCount-1) pageNums.push('…'); pageNums.push(pagesCount); }
                return pageNums.map((n,i) => n==='…'
                  ? <span key={`d${i}`} className="px-2 text-gray-400">…</span>
                  : <button key={n} onClick={()=>setPage(n)}
                      className={`sr-btn w-10 h-10 rounded-xl font-bold text-sm transition ${
                        page===n
                          ? 'bg-[#00b894] text-white shadow-md'
                          : 'bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 text-gray-600 dark:text-gray-300 hover:ring-[#00b894] hover:text-[#00b894]'
                      }`}>{n}</button>
                );
              })()}
              <button onClick={() => setPage(p=>Math.min(pagesCount,p+1))} disabled={page===pagesCount}
                className="sr-btn flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm transition disabled:opacity-40">
                Suivant <FiChevronRight size={14}/>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="sr-fadeIn fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <div className="sr-slideIn relative ml-auto w-80 max-w-[90vw] h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiSliders size={15} className="text-[#00b894]"/> Filtres
              </h2>
              <button onClick={() => setSidebarOpen(false)}
                className="sr-btn w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FiX size={18}/>
              </button>
            </div>
            <SidebarContent/>
            <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-gray-900 mt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setSidebarOpen(false)}
                className="sr-btn w-full py-3 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-bold text-sm transition shadow-lg">
                Voir {total} résultat{total!==1?'s':''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}