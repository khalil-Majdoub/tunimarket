// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiSearch, FiUser, FiShoppingCart, FiHeart, FiSun, FiMoon,
  FiLogOut, FiChevronDown, FiShoppingBag, FiTrash2, FiX,
  FiPackage, FiSettings, FiAlertTriangle
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.nb-root { font-family:'DM Sans',sans-serif; }
.nb-mono { font-family:'DM Mono',monospace; }

@keyframes nb-fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
@keyframes nb-fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes nb-scaleIn  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
@keyframes nb-spin     { to{transform:rotate(360deg)} }
@keyframes nb-slideIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

/* Badge: no scale-from-zero to prevent white-box flicker in dark mode */
@keyframes nb-badgeFade { from{opacity:0} to{opacity:1} }

.nb-fadeDown { animation: nb-fadeDown .22s cubic-bezier(.22,1,.36,1) both }
.nb-fadeIn   { animation: nb-fadeIn   .2s ease both }
.nb-scaleIn  { animation: nb-scaleIn  .22s cubic-bezier(.22,1,.36,1) both }
.nb-spin     { animation: nb-spin .8s linear infinite }
.nb-slideIn  { animation: nb-slideIn  .18s ease both }
.nb-badge    { animation: nb-badgeFade .2s ease both }

.nb-btn { transition:transform .14s cubic-bezier(.22,1,.36,1),background .14s ease; }
.nb-btn:hover  { transform:translateY(-1px); }
.nb-btn:active { transform:scale(.95); }

.nb-search-input:focus {
  outline:none;
  box-shadow:0 0 0 3px rgba(0,184,148,.18);
  border-color:#00b894;
  background:white;
}
.dark .nb-search-input:focus { background:#111827; }

.nb-cat-pill {
  transition: background .15s ease, color .15s ease, transform .15s ease;
  white-space: nowrap;
}
.nb-cat-pill:hover { color:#00b894; background:rgba(0,184,148,.08); transform:translateY(-1px); }
.nb-cat-pill.active { color:#00b894; background:rgba(0,184,148,.12); font-weight:700; }

.nb-scrollbar::-webkit-scrollbar { width:4px; }
.nb-scrollbar::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
.dark .nb-scrollbar::-webkit-scrollbar-thumb { background:#374151; }
`;

const CATS = [
  { name:'Tous', emoji:'🛍️' },
  { name:'Électronique', emoji:'📱' },
  { name:'Vêtements',    emoji:'👗' },
  { name:'Maison',       emoji:'🏠' },
  { name:'Sport',        emoji:'⚽' },
  { name:'Beauté',       emoji:'💄' },
  { name:'Alimentation', emoji:'🥗' },
  { name:'Jouets',       emoji:'🧸' },
  { name:'Livres',       emoji:'📚' },
  { name:'Autre',        emoji:'🛍️' },
];

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="nb-fadeIn fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="nb-scaleIn bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-7 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiAlertTriangle size={22} className="text-red-500"/>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Supprimer le compte ?</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          Cette action supprimera définitivement votre compte et tous vos produits.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function Navbar({ onCartClick, onAuthClick, onToggleDark, isDarkMode, user, onLogout }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [searchQuery, setSearchQuery]           = useState('');
  const [suggestions, setSuggestions]           = useState([]);
  const [showSuggestions, setShowSuggestions]   = useState(false);
  const [searchLoading, setSearchLoading]       = useState(false);
  const [cartCount, setCartCount]               = useState(0);
  const [wishlistCount, setWishlistCount]       = useState(0);
  const [showUserMenu, setShowUserMenu]         = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [scrolled, setScrolled]                 = useState(false);
  const searchRef  = useRef(null);
  const debounceRef= useRef(null);

  // Active category from URL
  const params = new URLSearchParams(location.search);
  const activeCat = params.get('q') || '';

  useEffect(() => {
    if (!document.getElementById('nb-styles')) {
      const el = document.createElement('style');
      el.id='nb-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setCartCount(0); setWishlistCount(0); return; }
      try {
        const [c, w] = await Promise.all([
          axios.get('/api/cart',     { headers:{ Authorization:`Bearer ${token}` } }),
          axios.get('/api/wishlist', { headers:{ Authorization:`Bearer ${token}` } })
        ]);
        setCartCount(c.data.items?.length || 0);
        setWishlistCount(w.data.products?.length || 0);
      } catch { setCartCount(0); setWishlistCount(0); }
    };
    fetchCounts();
    ['focus','cartUpdate','wishlistUpdate'].forEach(ev => window.addEventListener(ev, fetchCounts));
    return () => ['focus','cartUpdate','wishlistUpdate'].forEach(ev => window.removeEventListener(ev, fetchCounts));
  }, [user]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const r = await axios.get(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        setSuggestions(r.data.products || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') { setShowSuggestions(false); setShowUserMenu(false); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const submitSearch = (q) => {
    if (!q.trim()) return;
    setShowSuggestions(false); setSearchQuery('');
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token'); if (!token) return;
    try {
      await axios.delete('/api/auth/me', { headers:{ Authorization:`Bearer ${token}` } });
      toast.success('Compte supprimé'); onLogout();
    } catch { toast.error('Erreur suppression'); }
    finally { setShowDeleteModal(false); }
  };

  return (
    <>
      {/* ── Fixed wrapper for both bars ───────────────────────────────────── */}
      <div className={`nb-root fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${scrolled?'shadow-lg':''}`}>

        {/* ── Main bar ────────────────────────────────────────────────────── */}
        <div className="bg-white/96 dark:bg-gray-950/96 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-15 flex items-center gap-3" style={{ height:'60px' }}>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <img src="/assets/logo.png" alt="TuniMarket"
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"/>
            </Link>

            {/* Search */}
            <div className="flex-1 relative" ref={searchRef}>
              <div className="relative">
                <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input type="text"
                  placeholder="Rechercher un produit…"
                  value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                  onKeyDown={e=>e.key==='Enter' && submitSearch(searchQuery)}
                  onFocus={() => searchQuery.trim().length>=2 && setShowSuggestions(true)}
                  className="nb-search-input w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 text-gray-900 dark:text-white text-sm transition-all"
                />
                {searchLoading
                  ? <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#00b894]/30 border-t-[#00b894] rounded-full nb-spin"/>
                  : searchQuery && (
                    <button onClick={()=>{setSearchQuery('');setShowSuggestions(false);}}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      <FiX size={13}/>
                    </button>
                  )
                }
              </div>

              {/* Suggestions */}
              {showSuggestions && (
                <div className="nb-fadeDown absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 nb-scrollbar overflow-y-auto">
                  {suggestions.length > 0 ? (
                    <>
                      <p className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Suggestions</p>
                      {suggestions.map((p,i)=>(
                        <div key={p._id} onClick={()=>{ setShowSuggestions(false); setSearchQuery(''); navigate(`/product/${p._id}`); }}
                          className="nb-slideIn flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group"
                          style={{ animationDelay:`${i*25}ms` }}>
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <img src={p.image||'https://placehold.co/40x40?text=?'} alt={p.title}
                              className="w-full h-full object-cover" onError={e=>e.target.src='https://placehold.co/40x40?text=?'}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#00b894] transition-colors">{p.title}</p>
                            <p className="text-xs text-gray-400">{p.category||'—'}</p>
                          </div>
                          <span className="nb-mono font-black text-[#00b894] text-sm flex-shrink-0">{p.price?.toFixed(2)} DT</span>
                        </div>
                      ))}
                      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                        <button onClick={()=>submitSearch(searchQuery)}
                          className="text-xs text-[#00b894] font-semibold hover:underline">
                          Voir tous les résultats pour "{searchQuery}" →
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-gray-400">Aucun résultat pour <strong>"{searchQuery}"</strong></p>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Dark mode */}
              <button onClick={onToggleDark}
                className="nb-btn w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                {isDarkMode ? <FiSun size={17} className="text-amber-400"/> : <FiMoon size={17}/>}
              </button>

              {/* Wishlist */}
              <button onClick={()=>navigate('/wishlist')}
                className="nb-btn relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FiHeart size={17} className={wishlistCount>0?'text-rose-500 fill-rose-500':''}/>
                {wishlistCount>0 && (
                  <span key={wishlistCount} className="nb-badge absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 leading-none">
                    {wishlistCount>9?'9+':wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button onClick={onCartClick}
                className="nb-btn relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FiShoppingCart size={17}/>
                {cartCount>0 && (
                  <span key={cartCount} className="nb-badge absolute -top-1 -right-1 bg-[#00b894] text-white text-[9px] font-black rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 leading-none">
                    {cartCount>9?'9+':cartCount}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative ml-1">
                  <button onClick={()=>setShowUserMenu(v=>!v)}
                    className="nb-btn flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background:`hsl(${(user.name?.charCodeAt(0)||65)*137}deg,60%,52%)` }}>
                      {(user.name||'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-sm font-semibold text-gray-700 dark:text-gray-200 max-w-[80px] truncate">
                      {user.name?.split(' ')[0]||'Moi'}
                    </span>
                    <FiChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${showUserMenu?'rotate-180':''}`}/>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={()=>setShowUserMenu(false)}/>
                      <div className="nb-fadeDown absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                              style={{ background:`hsl(${(user.name?.charCodeAt(0)||65)*137}deg,60%,52%)` }}>
                              {(user.name||'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {user.isSeller && <span className="px-2 py-0.5 bg-[#00b894]/10 text-[#00b894] text-xs font-semibold rounded-lg">Vendeur</span>}
                            {user.isAdmin  && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 text-xs font-semibold rounded-lg">Admin</span>}
                          </div>
                        </div>
                        <div className="py-1">
                          {user.isSeller && <>
                            <Link to="/seller-dashboard" onClick={()=>setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                              <FiShoppingBag size={14} className="text-[#00b894]"/> Tableau de bord
                            </Link>
                            <Link to="/my-seller-orders" onClick={()=>setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                              <FiPackage size={14} className="text-[#00b894]"/> Mes commandes
                            </Link>
                          </>}
                          {user.isAdmin && (
                            <Link to="/seller-orders" onClick={()=>setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                              <FiSettings size={14} className="text-indigo-500"/> Administration
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                          <button onClick={()=>{setShowUserMenu(false);setShowDeleteModal(true);}}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            <FiTrash2 size={14}/> Supprimer le compte
                          </button>
                          <button onClick={()=>{onLogout();setShowUserMenu(false);}}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            <FiLogOut size={14}/> Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button onClick={onAuthClick}
                  className="nb-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-semibold text-sm transition shadow-md shadow-[#00b894]/20 ml-1">
                  <FiUser size={14}/> Connexion
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Category sub-bar ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2"
              style={{ scrollbarWidth:'none', msOverflowStyle:'none' }}>
              {CATS.map((cat) => {
                const isActive = cat.name==='Tous'
                  ? location.pathname==='/' && !activeCat
                  : activeCat.toLowerCase()===cat.name.toLowerCase();
                return (
                  <button key={cat.name}
                    onClick={() => cat.name==='Tous' ? navigate('/') : navigate(`/search?q=${cat.name}`)}
                    className={`nb-cat-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all
                      ${isActive
                        ? 'bg-[#00b894]/12 text-[#00b894] dark:bg-[#00b894]/15 dark:text-[#00b894]'
                        : 'text-gray-600 dark:text-gray-400 hover:text-[#00b894] hover:bg-[#00b894]/8 dark:hover:bg-[#00b894]/10'
                      }`}>
                    <span className="text-sm">{cat.emoji}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── No spacer here — pages add pt-[104px] themselves ──────────────── */}

      {showDeleteModal && <DeleteModal onConfirm={handleDeleteAccount} onCancel={()=>setShowDeleteModal(false)}/>}
    </>
  );
}