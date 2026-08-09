// frontend/src/components/CartDrawer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiX, FiShoppingCart, FiTrash2, FiMinus, FiPlus,
  FiShoppingBag, FiArrowRight, FiAlertCircle, FiCheck,
  FiTag
} from 'react-icons/fi';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.cd-root  { font-family: 'DM Sans', sans-serif; }
.cd-mono  { font-family: 'DM Mono', monospace; }

@keyframes cd-slideIn  { from{transform:translateX(100%);opacity:.6} to{transform:translateX(0);opacity:1} }
@keyframes cd-fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes cd-fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes cd-spin     { to{transform:rotate(360deg)} }
@keyframes cd-shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes cd-slideOut { to{opacity:0;transform:translateX(36px) scale(.94)} }

.cd-drawer  { animation: cd-slideIn .32s cubic-bezier(.22,1,.36,1) both }
.cd-overlay { animation: cd-fadeIn  .22s ease both }
.cd-fadeUp  { animation: cd-fadeUp  .3s cubic-bezier(.22,1,.36,1) both }
.cd-spin    { animation: cd-spin .8s linear infinite }
.cd-slideOut{ animation: cd-slideOut .25s cubic-bezier(.22,1,.36,1) forwards }

.cd-shimmer {
  background: linear-gradient(90deg,#f5f5f5 25%,#ebebeb 50%,#f5f5f5 75%);
  background-size: 400px 100%;
  animation: cd-shimmer 1.3s infinite linear;
}
.dark .cd-shimmer {
  background: linear-gradient(90deg,#1f2937 25%,#374151 50%,#1f2937 75%);
  background-size: 400px 100%;
}

.cd-btn {
  transition: transform .15s cubic-bezier(.22,1,.36,1),
              background .15s ease, opacity .15s ease;
}
.cd-btn:hover:not(:disabled)  { transform: translateY(-1px); }
.cd-btn:active:not(:disabled) { transform: scale(.95); }
.cd-btn:disabled { opacity: .45; cursor: not-allowed; }

.cd-item {
  transition: opacity .25s ease, box-shadow .2s ease;
}
.cd-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }

.cd-qty-btn {
  transition: background .14s ease, transform .12s ease;
}
.cd-qty-btn:hover:not(:disabled) { transform: scale(1.14); }
.cd-qty-btn:active:not(:disabled){ transform: scale(.9); }
.cd-qty-btn:disabled { opacity: .35; cursor: not-allowed; }

.cd-scrollbar::-webkit-scrollbar        { width: 4px; }
.cd-scrollbar::-webkit-scrollbar-track  { background: transparent; }
.cd-scrollbar::-webkit-scrollbar-thumb  { background: #e5e7eb; border-radius: 4px; }
.dark .cd-scrollbar::-webkit-scrollbar-thumb { background: #374151; }
`;

// ─── Skeleton item ────────────────────────────────────────────────────────────
function SkeletonItem() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
      <div className="w-20 h-20 cd-shimmer rounded-xl flex-shrink-0"/>
      <div className="flex-1 space-y-2.5 pt-1">
        <div className="h-3.5 cd-shimmer rounded-lg w-3/4"/>
        <div className="h-3   cd-shimmer rounded-lg w-1/2"/>
        <div className="h-5   cd-shimmer rounded-lg w-1/3"/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CartItem component
// ─────────────────────────────────────────────────────────────────────────────
function CartItem({ item, onRemove, onQuantityChange, removing }) {
  const prod       = item.productId || {};
  const productId  = String(prod._id || item.productId || '');
  const [qtyLoading, setQtyLoading] = useState(false);

  // Discount-aware pricing
  const unitPrice   = prod.discountedPrice ?? prod.price ?? 0;
  const lineTotal   = (unitPrice * (item.quantity || 1)).toFixed(2);
  const hasDiscount = prod.discount > 0;

  const handleQty = async (delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) return;
    if (prod.stock && newQty > prod.stock) {
      toast.error(`Stock limité à ${prod.stock}`);
      return;
    }
    setQtyLoading(true);
    await onQuantityChange(productId, newQty);
    setQtyLoading(false);
  };

  return (
    <div
      className={`cd-item flex gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 ring-1 ring-gray-100 dark:ring-gray-700/50 ${
        removing === productId ? 'cd-slideOut' : ''
      }`}
    >
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white dark:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-600">
        <img
          src={prod.image || 'https://placehold.co/80x80?text=?'}
          alt={prod.title || 'Produit'}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = 'https://placehold.co/80x80?text=?'; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">
          {prod.title || 'Produit'}
        </p>

        {/* Price line */}
        {hasDiscount ? (
          <div className="flex items-center gap-2 mb-2">
            <span className="cd-mono text-xs text-gray-400 line-through">
              {(prod.price || 0).toFixed(2)} DT
            </span>
            <span className="cd-mono text-xs font-bold text-red-500">
              {unitPrice.toFixed(2)} DT
            </span>
            <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-black px-1.5 py-0.5 rounded-lg">
              -{prod.discount}%
            </span>
          </div>
        ) : (
          <p className="cd-mono text-xs text-gray-400 mb-2">
            {(prod.price || 0).toFixed(2)} DT / unité
          </p>
        )}

        {/* Qty + total + remove */}
        <div className="flex items-center justify-between mt-auto">
          {/* Quantity controls */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 p-1">
            <button
              onClick={() => handleQty(-1)}
              disabled={item.quantity <= 1 || qtyLoading}
              className="cd-qty-btn w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
            >
              <FiMinus size={11}/>
            </button>

            <span className="cd-mono font-bold text-sm text-gray-900 dark:text-white w-6 text-center select-none">
              {qtyLoading
                ? <div className="w-3 h-3 border-2 border-[#00b894]/30 border-t-[#00b894] rounded-full cd-spin mx-auto"/>
                : item.quantity
              }
            </span>

            <button
              onClick={() => handleQty(1)}
              disabled={qtyLoading || (prod.stock > 0 && item.quantity >= prod.stock)}
              className="cd-qty-btn w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
            >
              <FiPlus size={11}/>
            </button>
          </div>

          {/* Line total + remove */}
          <div className="flex items-center gap-2">
            <span className="cd-mono font-black text-[#00b894] text-base">{lineTotal} DT</span>
            <button
              onClick={() => onRemove(productId)}
              className="cd-btn w-8 h-8 rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title="Supprimer"
            >
              <FiTrash2 size={13}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// mergeCartKeepOrder
//
// THE FIX for "item jumps to top when quantity changes".
//
// Root cause: the backend does remove+add to update quantity, which changes
// the order of items[] in MongoDB. When we setCart(res.data), React sees a
// different order and remounts items at wrong positions.
//
// Solution: after every quantity-change sync, we re-sort the backend response
// to match the order the user currently sees. Items stay in place.
// ─────────────────────────────────────────────────────────────────────────────
function mergeCartKeepOrder(prevItems, newItems) {
  // Build a lookup from productId → new item data
  const lookup = {};
  newItems.forEach(item => {
    const id = String(item.productId?._id || item.productId || '');
    if (id) lookup[id] = item;
  });

  // Walk prevItems in their current order and substitute updated data
  const merged = prevItems
    .map(prev => {
      const id = String(prev.productId?._id || prev.productId || '');
      return lookup[id] ?? null;   // null = item was removed
    })
    .filter(Boolean);              // drop nulls

  // Append any brand-new items (added from a different tab, edge case)
  const prevIds = new Set(prevItems.map(i => String(i.productId?._id || i.productId || '')));
  newItems.forEach(item => {
    const id = String(item.productId?._id || item.productId || '');
    if (id && !prevIds.has(id)) merged.push(item);
  });

  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main CartDrawer
// ─────────────────────────────────────────────────────────────────────────────
export default function CartDrawer({ onClose, onCheckout }) {
  const [cart,     setCart]     = useState({ items: [], total: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [removing, setRemoving] = useState(null);   // productId string being removed
  const [clearing, setClearing] = useState(false);
  const navigate  = useNavigate();
  const drawerRef = useRef(null);

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById('cd-styles')) {
      const el = document.createElement('style');
      el.id = 'cd-styles';
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // ── Fetch cart from API ─────────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCart({ items: [], total: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data);
    } catch (err) {
      console.error('[CartDrawer] fetchCart error:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError('Impossible de charger le panier');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Remove item ──────────────────────────────────────────────────────────────
  const removeItem = async productId => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRemoving(String(productId));

    // Wait for slide-out animation
    setTimeout(async () => {
      try {
        const res = await axios.post(
          '/api/cart/remove',
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCart(res.data);
        window.dispatchEvent(new Event('cartUpdate'));
      } catch (err) {
        console.error('[CartDrawer] removeItem error:', err);
        toast.error('Erreur lors de la suppression');
        fetchCart();
      } finally {
        setRemoving(null);
      }
    }, 230);
  };

  // ── Quantity change ─────────────────────────────────────────────────────────
  // FIX: we keep item positions stable via mergeCartKeepOrder.
  const handleQuantityChange = async (productId, newQty) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (newQty <= 0) {
      await removeItem(productId);
      return;
    }

    // ── Step 1: Optimistic local update (only quantity, order unchanged) ───────
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const id = String(item.productId?._id || item.productId || '');
        return id === String(productId) ? { ...item, quantity: newQty } : item;
      }),
    }));

    try {
      // ── Step 2: Sync with backend (remove then re-add) ──────────────────────
      await axios.post('/api/cart/remove', { productId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.post('/api/cart/add', { productId, quantity: newQty }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ── Step 3: Apply backend response but PRESERVE the current item order ───
      setCart(prev => ({
        ...res.data,
        items: mergeCartKeepOrder(prev.items, res.data.items || []),
      }));

      window.dispatchEvent(new Event('cartUpdate'));

    } catch (err) {
      console.error('[CartDrawer] handleQuantityChange error:', err);
      fetchCart(); // Fall back to server state on error
    }
  };

  // ── Clear cart ───────────────────────────────────────────────────────────────
  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setClearing(true);
    try {
      const res = await axios.post('/api/cart/clear', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data);
      window.dispatchEvent(new Event('cartUpdate'));
    } catch {
      fetchCart();
    } finally {
      setClearing(false);
    }
  };

  // ── Computed totals ──────────────────────────────────────────────────────────
  const calculatedTotal = cart.items.reduce((sum, item) => {
    const unitPrice = item.productId?.discountedPrice ?? item.productId?.price ?? 0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  const displayTotal = cart.total != null
    ? parseFloat(cart.total)
    : calculatedTotal;

  const itemCount = cart.items.reduce((s, i) => s + (i.quantity || 1), 0);

  const hasAnyDiscount = cart.items.some(
    item => (item.productId?.discount || 0) > 0
  );

  const originalTotal = cart.items.reduce((sum, item) => {
    return sum + (item.productId?.price || 0) * (item.quantity || 1);
  }, 0);

  const totalSavings = originalTotal - displayTotal;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="cd-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="cd-drawer cd-root fixed top-0 right-0 h-full w-full max-w-[420px] bg-white dark:bg-gray-950 z-50 flex flex-col shadow-2xl"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00b894]/10 rounded-xl flex items-center justify-center">
                <FiShoppingCart size={18} className="text-[#00b894]"/>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                  Mon Panier
                </h2>
                {!loading && cart.items.length > 0 && (
                  <p className="cd-mono text-xs text-gray-400 mt-0.5">
                    {itemCount} article{itemCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="cd-btn w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <FiX size={18}/>
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto cd-scrollbar px-6 py-4">

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <SkeletonItem key={i}/>)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="cd-fadeUp flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl ring-1 ring-red-100 dark:ring-red-800/30 mt-4">
              <FiAlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Erreur</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Empty cart */}
          {!loading && !error && cart.items.length === 0 && (
            <div className="cd-fadeUp flex flex-col items-center justify-center h-full text-center py-16 px-4">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-5">
                <FiShoppingBag size={32} className="text-gray-400"/>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                Votre panier est vide
              </h3>
              <p className="text-gray-400 text-sm mb-7 max-w-[220px] leading-relaxed">
                Ajoutez des produits pour commencer vos achats
              </p>
              <button
                onClick={onClose}
                className="cd-btn flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg"
                style={{
                  background:  'linear-gradient(135deg,#00b894,#00997f)',
                  boxShadow:   '0 6px 18px rgba(0,184,148,.28)',
                }}
              >
                <FiShoppingBag size={15}/>
                Continuer les achats
              </button>
            </div>
          )}

          {/* Cart items */}
          {!loading && !error && cart.items.length > 0 && (
            <div className="space-y-3">
              {cart.items.map(item => {
                // ── STABLE KEY: always the product's _id, never array index ──
                // This is critical — using index as key caused the "jumping" bug
                const stableKey = String(item.productId?._id || item.productId || Math.random());

                return (
                  <CartItem
                    key={stableKey}
                    item={item}
                    removing={removing}
                    onRemove={removeItem}
                    onQuantityChange={handleQuantityChange}
                  />
                );
              })}

              {/* Savings banner (shown when any item has discount) */}
              {hasAnyDiscount && totalSavings > 0.01 && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/10 rounded-2xl ring-1 ring-red-100 dark:ring-red-800/30">
                  <div className="w-8 h-8 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiTag size={14} className="text-red-500"/>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">
                      Vous économisez {totalSavings.toFixed(2)} DT grâce aux remises !
                    </p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Prix original : {originalTotal.toFixed(2)} DT
                    </p>
                  </div>
                </div>
              )}

              {/* Clear cart button */}
              <button
                onClick={clearCart}
                disabled={clearing}
                className="cd-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-300 hover:text-red-400 dark:hover:border-red-800 dark:hover:text-red-400 text-sm font-semibold transition mt-2"
              >
                {clearing
                  ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full cd-spin"/>
                  : <FiTrash2 size={13}/>
                }
                Vider le panier
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        {!loading && !error && cart.items.length > 0 && (
          <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">

            {/* Order summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
                <span className="cd-mono font-semibold text-gray-700 dark:text-gray-300">
                  {displayTotal.toFixed(2)} DT
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Livraison</span>
                <span className="text-emerald-500 font-semibold">Gratuite</span>
              </div>
              {hasAnyDiscount && totalSavings > 0.01 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-500 font-semibold">Économies</span>
                  <span className="cd-mono font-bold text-red-500">-{totalSavings.toFixed(2)} DT</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 mt-2.5 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white text-sm">Total</span>
                <span className="cd-mono font-black text-[#00b894] text-2xl">
                  {displayTotal.toFixed(2)} DT
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => { onClose(); onCheckout(); }}
              className="cd-btn w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-base shadow-xl"
              style={{
                background: 'linear-gradient(135deg,#00b894,#00997f)',
                boxShadow:  '0 8px 24px rgba(0,184,148,.32)',
              }}
            >
              <FiCheck size={18}/>
              Passer la commande
              <FiArrowRight size={16}/>
            </button>

            <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              🔒 Paiement sécurisé · Livraison rapide
            </p>
          </div>
        )}
      </div>
    </>
  );
}