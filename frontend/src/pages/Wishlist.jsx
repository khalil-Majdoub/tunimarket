// frontend/src/pages/Wishlist.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiHeart, FiShoppingCart, FiTrash2, FiGrid, FiList,
  FiArrowLeft, FiAlertCircle, FiShoppingBag, FiShare2,
  FiCheck, FiX
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.wl-root    { font-family: 'DM Sans', sans-serif; }
.wl-display { font-family: 'Playfair Display', serif; }
.wl-mono    { font-family: 'DM Mono', monospace; }

@keyframes wl-fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes wl-fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes wl-scaleIn  { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
@keyframes wl-cardIn   { from{opacity:0;transform:translateY(16px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes wl-spin     { to{transform:rotate(360deg)} }
@keyframes wl-shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes wl-heartBeat{ 0%,100%{transform:scale(1)} 15%{transform:scale(1.35)} 30%{transform:scale(1)} 45%{transform:scale(1.2)} 60%{transform:scale(1)} }
@keyframes wl-slideOut { to{opacity:0;transform:scale(.88) translateY(-8px)} }
@keyframes wl-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes wl-ripple   { from{transform:scale(0);opacity:.6} to{transform:scale(2.5);opacity:0} }

.wl-fadeUp  { animation: wl-fadeUp  .5s cubic-bezier(.22,1,.36,1) both }
.wl-fadeIn  { animation: wl-fadeIn  .35s ease both }
.wl-scaleIn { animation: wl-scaleIn .3s  cubic-bezier(.22,1,.36,1) both }
.wl-cardIn  { animation: wl-cardIn  .45s cubic-bezier(.22,1,.36,1) both }
.wl-spin    { animation: wl-spin .8s linear infinite }
.wl-heartBeat{ animation: wl-heartBeat .6s cubic-bezier(.22,1,.36,1) }
.wl-float   { animation: wl-float 3s ease-in-out infinite }
.wl-slideOut{ animation: wl-slideOut .3s cubic-bezier(.22,1,.36,1) forwards }

.wl-shimmer {
  background: linear-gradient(90deg,#f5f5f5 25%,#ebebeb 50%,#f5f5f5 75%);
  background-size: 600px 100%;
  animation: wl-shimmer 1.4s infinite linear;
}
.dark .wl-shimmer {
  background: linear-gradient(90deg,#1f2937 25%,#374151 50%,#1f2937 75%);
  background-size: 600px 100%;
}

.wl-btn {
  transition: transform .16s cubic-bezier(.22,1,.36,1),
              box-shadow .16s ease, background .16s ease, opacity .16s ease;
}
.wl-btn:hover:not(:disabled)  { transform: translateY(-2px); }
.wl-btn:active:not(:disabled) { transform: scale(.96); }
.wl-btn:disabled { opacity:.5; cursor:not-allowed; }

.wl-card {
  transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease;
}
.wl-card:hover { transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,.11); }

.wl-img-zoom { transition: transform .5s cubic-bezier(.22,1,.36,1); }
.wl-card:hover .wl-img-zoom { transform: scale(1.07); }

.wl-delete-btn {
  transition: transform .15s ease, background .15s ease, color .15s ease;
}
.wl-delete-btn:hover { transform: scale(1.1); }

.wl-ripple-wrap { position:relative; overflow:hidden; }
.wl-ripple-wrap::after {
  content:''; position:absolute; inset:0; border-radius:inherit;
  background: radial-gradient(circle, rgba(255,255,255,.3) 0%, transparent 60%);
  transform:scale(0); opacity:0;
  transition: transform .4s ease, opacity .4s ease;
}
.wl-ripple-wrap:active::after { animation: wl-ripple .4s ease; }

/* Heart bg decoration */
.wl-hero-heart {
  position:absolute;
  opacity:.06;
  font-size:280px;
  line-height:1;
  right:-30px;
  top:-20px;
  user-select:none;
  pointer-events:none;
}
`;

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 12 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-px">
      {Array(full).fill(0).map((_,i)  => <FaStar key={`f${i}`} size={size} className="text-amber-400"/>)}
      {half && <FaStarHalfAlt size={size} className="text-amber-400"/>}
      {Array(empty).fill(0).map((_,i) => <FaRegStar key={`e${i}`} size={size} className="text-gray-300 dark:text-gray-600"/>)}
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800">
      <div className="h-56 wl-shimmer"/>
      <div className="p-4 space-y-3">
        <div className="h-4 wl-shimmer rounded-lg w-3/4"/>
        <div className="h-3 wl-shimmer rounded-lg w-1/2"/>
        <div className="flex justify-between mt-4">
          <div className="h-6 wl-shimmer rounded-lg w-1/3"/>
          <div className="h-8 wl-shimmer rounded-xl w-1/4"/>
        </div>
      </div>
    </div>
  );
}

// ─── Product card (grid) ──────────────────────────────────────────────────────
function WishlistCard({ product, index, onRemove, onAddToCart, removing }) {
  const [cartLoading, setCartLoading] = useState(false);
  const [heartAnim, setHeartAnim]     = useState(false);
  const navigate = useNavigate();

  const handleCart = async (e) => {
    e.stopPropagation();
    if (cartLoading || product.stock === 0) return;
    setCartLoading(true);
    await onAddToCart(product);
    setCartLoading(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setHeartAnim(true);
    setTimeout(() => onRemove(product._id), 200);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className={`wl-card wl-cardIn bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 shadow-md flex flex-col cursor-pointer group ${removing===product._id?'wl-slideOut':''}`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* Image */}
      <div className="relative h-56 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        <img
          src={product.image || 'https://placehold.co/400x400?text=Produit'}
          alt={product.title}
          className="wl-img-zoom w-full h-full object-cover"
          onError={e => e.target.src='https://placehold.co/400x400?text=?'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

        {/* Stock badge */}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow">Rupture</span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow">Stock limité</span>
        )}

        {/* Remove btn */}
        <button onClick={handleRemove}
          className="wl-delete-btn absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-gray-900/90 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-all">
          <FiTrash2 size={14} className={heartAnim ? 'wl-heartBeat text-red-500' : ''}/>
        </button>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCart}
            disabled={product.stock === 0 || cartLoading}
            className="wl-ripple-wrap wl-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-400 transition"
          >
            {cartLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full wl-spin"/>
              : <FiShoppingCart size={13}/>}
            {cartLoading ? 'Ajout…' : product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1.5 group-hover:text-[#00b894] transition-colors leading-snug flex-1">
          {product.title}
        </h3>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars rating={product.averageRating}/>
            <span className="wl-mono text-xs text-gray-400">({product.ratingCount || 0})</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="wl-mono font-black text-[#00b894] text-xl">
            {product.price?.toFixed(2)}<span className="text-xs opacity-60 ml-0.5">DT</span>
          </span>
          <button
            onClick={handleCart}
            disabled={product.stock === 0 || cartLoading}
            className="wl-btn w-9 h-9 bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition shadow-md shadow-[#00b894]/20"
          >
            {cartLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full wl-spin"/>
              : <FiShoppingCart size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product row (list view) ──────────────────────────────────────────────────
function WishlistRow({ product, index, onRemove, onAddToCart, removing }) {
  const [cartLoading, setCartLoading] = useState(false);
  const navigate = useNavigate();

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
      className={`wl-card wl-cardIn bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-md flex items-center gap-4 p-4 group cursor-pointer ${removing===product._id?'wl-slideOut':''}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        <img src={product.image||'https://placehold.co/96x96?text=?'} alt={product.title}
          className="wl-img-zoom w-full h-full object-cover"
          onError={e=>e.target.src='https://placehold.co/96x96?text=?'}/>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-[#00b894] transition-colors">
          {product.title}
        </h3>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Stars rating={product.averageRating}/>
            <span className="wl-mono text-xs text-gray-400">({product.ratingCount||0})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {product.stock === 0
            ? <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold">Rupture</span>
            : product.stock <= 5
            ? <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg font-semibold">Stock limité</span>
            : <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-semibold">En stock</span>
          }
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="wl-mono font-black text-[#00b894] text-xl">
          {product.price?.toFixed(2)}<span className="text-xs opacity-60 ml-0.5">DT</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onRemove(product._id); }}
            className="wl-delete-btn w-9 h-9 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-xl flex items-center justify-center transition">
            <FiTrash2 size={14}/>
          </button>
          <button onClick={handleCart} disabled={product.stock===0||cartLoading}
            className="wl-btn w-9 h-9 bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition">
            {cartLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full wl-spin"/>
              : <FiShoppingCart size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [removing, setRemoving]                 = useState(null);
  const [viewMode, setViewMode]                 = useState('grid');
  const [addingAll, setAddingAll]               = useState(false);
  const navigate = useNavigate();

  // Inject CSS
  useEffect(() => {
    if (!document.getElementById('wl-styles')) {
      const el = document.createElement('style');
      el.id='wl-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, []);

  // ── Fetch (same API) ────────────────────────────────────────────────────
  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour voir vos favoris');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistProducts(res.data.products || []);
    } catch (err) {
      console.error('Erreur wishlist:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        setError('Erreur lors du chargement des favoris');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Remove (optimistic, same API) ───────────────────────────────────────
  const handleRemoveFromWishlist = async (productId) => {
    const previous = [...wishlistProducts];
    setRemoving(productId);

    // Wait for exit animation
    setTimeout(() => {
      setWishlistProducts(prev => prev.filter(p => p._id !== productId));
      setRemoving(null);
    }, 280);

    const toastId = toast.loading('Retrait en cours…');
    try {
      await axios.post('/api/wishlist/remove', { productId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.dismiss(toastId);
      toast.success('Retiré des favoris');
      window.dispatchEvent(new Event('wishlistUpdate'));
    } catch (err) {
      setWishlistProducts(previous);
      setRemoving(null);
      toast.dismiss(toastId);
      toast.error('Erreur lors du retrait');
    }
  };

  // ── Add to cart ─────────────────────────────────────────────────────────
  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    try {
      await axios.post('/api/cart/add', { productId: product._id, quantity: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('cartUpdate'));
      const name = product.title?.length > 28 ? product.title.substring(0,28)+'…' : product.title;
      toast.success(`"${name}" ajouté au panier !`);
    } catch { toast.error('Erreur ajout panier'); }
  };

  // ── Add ALL to cart ─────────────────────────────────────────────────────
  const handleAddAllToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    const inStock = wishlistProducts.filter(p => p.stock > 0);
    if (!inStock.length) { toast.error('Aucun produit en stock'); return; }
    setAddingAll(true);
    try {
      await Promise.all(inStock.map(p =>
        axios.post('/api/cart/add', { productId: p._id, quantity: 1 }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      window.dispatchEvent(new Event('cartUpdate'));
      toast.success(`${inStock.length} produit${inStock.length>1?'s':''} ajouté${inStock.length>1?'s':''} au panier !`);
    } catch { toast.error('Erreur ajout au panier'); }
    finally { setAddingAll(false); }
  };

  // ── Clear all ───────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!wishlistProducts.length) return;
    const token = localStorage.getItem('token');
    const previous = [...wishlistProducts];
    setWishlistProducts([]);
    try {
      await Promise.all(previous.map(p =>
        axios.post('/api/wishlist/remove', { productId: p._id }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      window.dispatchEvent(new Event('wishlistUpdate'));
      toast.success('Liste de favoris vidée');
    } catch {
      setWishlistProducts(previous);
      toast.error('Erreur lors de la suppression');
    }
  };

  const totalValue = wishlistProducts.reduce((s,p) => s + (p.price||0), 0);
  const inStockCount = wishlistProducts.filter(p => p.stock > 0).length;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="wl-root min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#e84393 0%,transparent 70%)' }}/>
        <div className="absolute -bottom-10 left-1/4 w-60 h-60 rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#00b894 0%,transparent 70%)' }}/>
        <span className="wl-hero-heart select-none">♥</span>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-28">
          <button onClick={() => navigate(-1)}
            className="wl-btn flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-8 transition">
            <FiArrowLeft size={15}/> Retour
          </button>

          <div className="wl-fadeUp flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/15">
                <FiHeart size={11} className="text-rose-400"/> Ma liste de favoris
              </div>
              <h1 className="wl-display text-5xl md:text-6xl font-bold text-white leading-tight">
                Mes Favoris
              </h1>
              {!loading && wishlistProducts.length > 0 && (
                <p className="text-white/60 mt-3 text-base">
                  {wishlistProducts.length} produit{wishlistProducts.length>1?'s':''} · Valeur estimée{' '}
                  <span className="wl-mono font-bold text-white/90">{totalValue.toFixed(2)} DT</span>
                </p>
              )}
            </div>

            {/* Action bar */}
            {!loading && wishlistProducts.length > 0 && (
              <div className="wl-fadeUp flex flex-wrap gap-3" style={{ animationDelay:'100ms' }}>
                <button onClick={handleAddAllToCart} disabled={addingAll || inStockCount===0}
                  className="wl-btn flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition shadow-lg"
                  style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.3)' }}>
                  {addingAll
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full wl-spin"/>
                    : <FiShoppingBag size={15}/>}
                  Tout ajouter au panier
                </button>
                <button onClick={handleClearAll}
                  className="wl-btn flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition border border-white/20">
                  <FiTrash2 size={14}/> Vider la liste
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-16 pb-16 relative">

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="wl-scaleIn text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle size={24} className="text-red-500"/>
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">{error}</p>
            {error.includes('connecter') ? (
              <button onClick={() => navigate('/')}
                className="wl-btn mt-4 px-6 py-3 bg-[#00b894] text-white rounded-xl font-semibold text-sm transition">
                Retour à l'accueil
              </button>
            ) : (
              <button onClick={fetchWishlist}
                className="wl-btn mt-4 px-6 py-3 bg-[#00b894] text-white rounded-xl font-semibold text-sm transition">
                Réessayer
              </button>
            )}
          </div>
        )}

        {/* ── Empty ────────────────────────────────────────────────────────── */}
        {!loading && !error && wishlistProducts.length === 0 && (
          <div className="wl-scaleIn text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-xl ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="wl-float inline-block text-6xl mb-6">🤍</div>
            <h2 className="wl-display text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Votre liste est vide
            </h2>
            <p className="text-gray-400 mb-8 text-sm max-w-xs mx-auto leading-relaxed">
              Parcourez notre boutique et cliquez sur ♥ pour sauvegarder vos coups de cœur ici.
            </p>
            <Link to="/"
              className="wl-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition shadow-lg"
              style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.28)' }}>
              <FiShoppingBag size={15}/> Découvrir des produits
            </Link>
          </div>
        )}

        {/* ── Products ─────────────────────────────────────────────────────── */}
        {!loading && !error && wishlistProducts.length > 0 && (
          <>
            {/* Toolbar */}
            <div className="wl-fadeUp flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="wl-mono font-bold text-gray-900 dark:text-white">{wishlistProducts.length}</span> favori{wishlistProducts.length>1?'s':''}
                  </span>
                </div>
                {inStockCount < wishlistProducts.length && (
                  <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg font-semibold ring-1 ring-amber-100 dark:ring-amber-800/30">
                    {wishlistProducts.length - inStockCount} en rupture
                  </span>
                )}
              </div>

              {/* View toggle */}
              <div className="flex bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 p-1 gap-0.5 shadow-sm">
                {[['grid', FiGrid], ['list', FiList]].map(([mode, Icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`wl-btn w-9 h-9 rounded-lg flex items-center justify-center transition ${
                      viewMode===mode ? 'bg-[#00b894] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    <Icon size={15}/>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {wishlistProducts.map((p, i) => (
                  <WishlistCard key={p._id} product={p} index={i}
                    removing={removing}
                    onRemove={handleRemoveFromWishlist}
                    onAddToCart={handleAddToCart}/>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {wishlistProducts.map((p, i) => (
                  <WishlistRow key={p._id} product={p} index={i}
                    removing={removing}
                    onRemove={handleRemoveFromWishlist}
                    onAddToCart={handleAddToCart}/>
                ))}
              </div>
            )}

            {/* Summary footer */}
            <div className="wl-fadeUp mt-10 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Valeur totale des favoris</p>
                <p className="wl-mono font-black text-3xl text-gray-900 dark:text-white mt-0.5">
                  {totalValue.toFixed(2)}<span className="text-base font-semibold text-gray-400 ml-1">DT</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{inStockCount} produit{inStockCount>1?'s':''} disponible{inStockCount>1?'s':''}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleAddAllToCart} disabled={addingAll || inStockCount===0}
                  className="wl-btn flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition shadow-lg"
                  style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.25)' }}>
                  {addingAll
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full wl-spin"/>
                    : <FiShoppingCart size={15}/>}
                  Tout ajouter ({inStockCount})
                </button>
                <Link to="/"
                  className="wl-btn flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Continuer mes achats
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}