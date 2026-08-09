// frontend/src/pages/SellerOrders.jsx
// Admin page — sees ALL orders, can update any status
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiPackage, FiSearch, FiFilter, FiChevronDown, FiChevronUp,
  FiCheck, FiTruck, FiClock, FiX, FiRefreshCw, FiDownload,
  FiAlertCircle, FiMapPin, FiPhone, FiUser, FiCalendar, FiPercent
} from 'react-icons/fi';

/* ─── Design tokens (matches rest of site) ─────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
:root {
  --bg:#f8f8f6;--card:#ffffff;--border:#e8e8e4;
  --text-1:#0f172a;--text-2:#475569;--text-3:#94a3b8;
  --green:#00b894;--green-lt:rgba(0,184,148,.08);
  --red:#e11d48;--amber:#d97706;--blue:#3b82f6;--purple:#7c3aed;
}
.dark{--bg:#0f0f0f;--card:#1a1a1a;--border:#2a2a2a;--text-1:#f1f5f9;--text-2:#94a3b8;--text-3:#475569;}
.so-root{font-family:'DM Sans',sans-serif;background:var(--bg);min-height:100vh;}
.so-mono{font-family:'DM Mono',monospace;}
.so-display{font-family:'Sora',sans-serif;}
@keyframes so-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes so-fade{from{opacity:0}to{opacity:1}}
@keyframes so-spin{to{transform:rotate(360deg)}}
@keyframes so-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
.so-in  {animation:so-in   .4s cubic-bezier(.22,1,.36,1) both}
.so-fade{animation:so-fade .3s ease both}
.so-spin{animation:so-spin .8s linear infinite}
.so-shimmer{
  background:linear-gradient(90deg,#f0f0ee 25%,#e8e8e4 50%,#f0f0ee 75%);
  background-size:600px 100%;animation:so-shimmer 1.5s infinite linear;
}
.dark .so-shimmer{
  background:linear-gradient(90deg,#1e1e1e 25%,#2a2a2a 50%,#1e1e1e 75%);
  background-size:600px 100%;
}
.so-row{border-bottom:1px solid var(--border);transition:background .15s;}
.so-row:hover{background:rgba(0,184,148,.03);}
.so-row:last-child{border-bottom:none;}
.so-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;
  border:1.5px solid var(--border);background:var(--card);color:var(--text-2);
  cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;
}
.so-btn:hover{border-color:var(--green);color:var(--green);background:var(--green-lt);}
.so-btn.primary{background:var(--green);color:#fff;border-color:var(--green);box-shadow:0 3px 10px rgba(0,184,148,.3);}
.so-btn.primary:hover{background:#00976e;border-color:#00976e;}
.so-search{
  padding:9px 14px 9px 38px;border-radius:10px;
  border:1.5px solid var(--border);background:var(--card);
  color:var(--text-1);font-family:'DM Sans',sans-serif;font-size:14px;
  transition:border-color .15s,box-shadow .15s;outline:none;width:100%;
}
.so-search:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(0,184,148,.15);}
.so-select{
  padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);
  background:var(--card);color:var(--text-1);font-family:'DM Sans',sans-serif;
  font-size:13px;cursor:pointer;outline:none;transition:border-color .15s;
}
.so-select:focus{border-color:var(--green);}
`;

/* ─── Status config ─────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  pending:    { label:'En attente',    icon:FiClock,     color:'#d97706', bg:'rgba(217,119,6,.1)',   text:'#92400e' },
  processing: { label:'En traitement', icon:FiRefreshCw, color:'#3b82f6', bg:'rgba(59,130,246,.1)', text:'#1e40af' },
  shipped:    { label:'Expédiée',      icon:FiTruck,     color:'#7c3aed', bg:'rgba(124,58,237,.1)', text:'#4c1d95' },
  delivered:  { label:'Livrée',        icon:FiCheck,     color:'#00b894', bg:'rgba(0,184,148,.1)',  text:'#065f46' },
  cancelled:  { label:'Annulée',       icon:FiX,         color:'#e11d48', bg:'rgba(225,29,72,.1)',  text:'#9f1239' },
};
const STATUS_ORDER = ['pending','processing','shipped','delivered','cancelled'];

function StatusBadge({ status }) {
  const cfg  = STATUS_CFG[status] || STATUS_CFG.pending;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
      style={{ background:cfg.bg, color:cfg.text }}>
      <Icon size={11}/>{cfg.label}
    </span>
  );
}

function StatusSelect({ orderId, current, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const handleChange = async (e) => {
    const next = e.target.value;
    if (next === current) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/orders/${orderId}/status`, { status: next }, {
        headers: { Authorization:`Bearer ${token}` }
      });
      toast.success('Statut mis à jour');
      onUpdate(orderId, next);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mise à jour');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full so-spin"/>
        </div>
      )}
      <select value={current} onChange={handleChange} disabled={loading}
        className="so-select pr-8 text-xs font-semibold" style={{ appearance:'none' }}>
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>{STATUS_CFG[s].label}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="so-row flex items-center gap-4 px-6 py-4">
      <div className="so-shimmer h-4 rounded-lg w-32 flex-shrink-0"/>
      <div className="so-shimmer h-4 rounded-lg flex-1"/>
      <div className="so-shimmer h-4 rounded-lg w-24 flex-shrink-0"/>
      <div className="so-shimmer h-4 rounded-lg w-20 flex-shrink-0"/>
      <div className="so-shimmer h-7 rounded-lg w-28 flex-shrink-0"/>
    </div>
  );
}

/* ─── Order detail panel ────────────────────────────────────────────────────── */
function OrderDetail({ order }) {
  const addr = order.shippingAddress || {};
  return (
    <div className="so-fade px-6 pb-6 pt-0 grid md:grid-cols-2 gap-6"
      style={{ borderTop:`1px dashed var(--border)`, paddingTop:'20px' }}>

      {/* Items */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--text-3)' }}>
          Articles ({order.items?.length || 0})
        </p>
        <div className="space-y-2">
          {(order.items || []).map((item, i) => {
            const prod = item.product || {};
            const hasDiscount = item.price < (prod.price || item.price);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
                <img src={prod.image || item.productImage || 'https://placehold.co/40x40?text=?'}
                  alt={prod.title || item.productTitle}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={e=>{e.target.src='https://placehold.co/40x40?text=?';}}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color:'var(--text-1)' }}>
                    {prod.title || item.productTitle || 'Produit'}
                  </p>
                  <p className="so-mono text-xs mt-0.5" style={{ color:'var(--text-3)' }}>
                    {item.price?.toFixed(2)} DT × {item.quantity}
                  </p>
                </div>
                <p className="so-mono text-sm font-bold flex-shrink-0" style={{ color:'var(--green)' }}>
                  {(item.price * item.quantity).toFixed(2)} DT
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:'var(--text-3)' }}>
          Livraison
        </p>
        <div className="p-4 rounded-xl space-y-2.5" style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
          {[
            { icon:FiUser,    val:addr.fullName },
            { icon:FiPhone,   val:addr.phone },
            { icon:FiMapPin,  val:[addr.address, addr.city, addr.postalCode, addr.country].filter(Boolean).join(', ') },
          ].map((row, i) => row.val && (
            <div key={i} className="flex items-start gap-2.5">
              <row.icon size={13} style={{ color:'var(--green)', flexShrink:0, marginTop:2 }}/>
              <span className="text-sm" style={{ color:'var(--text-2)' }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="mt-3 p-4 rounded-xl" style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
          <div className="flex justify-between text-sm mb-1.5">
            <span style={{ color:'var(--text-2)' }}>Méthode de paiement</span>
            <span className="font-medium capitalize" style={{ color:'var(--text-1)' }}>{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm mb-1.5">
            <span style={{ color:'var(--text-2)' }}>Paiement</span>
            <span className="font-medium capitalize" style={{ color: order.paymentStatus === 'paid' ? 'var(--green)' : 'var(--amber)' }}>
              {order.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 mt-1" style={{ borderTop:'1px solid var(--border)' }}>
            <span className="font-bold" style={{ color:'var(--text-1)' }}>Total</span>
            <span className="so-mono font-black" style={{ color:'var(--green)' }}>{order.totalAmount?.toFixed(2)} DT</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Order row ─────────────────────────────────────────────────────────────── */
function OrderRow({ order, index, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const orderId = String(order._id).slice(-8).toUpperCase();
  const date    = new Date(order.createdAt).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' });
  const client  = order.user?.name || order.shippingAddress?.fullName || '—';

  return (
    <div className="so-in" style={{ animationDelay:`${index*40}ms` }}>
      {/* Main row */}
      <div className="so-row">
        <div className="flex items-center gap-4 px-6 py-4">
          {/* ID */}
          <div className="flex-shrink-0 w-24">
            <p className="so-mono text-xs font-bold" style={{ color:'var(--text-1)' }}>#{orderId}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <FiCalendar size={9} style={{ color:'var(--text-3)' }}/>
              <p className="text-xs" style={{ color:'var(--text-3)' }}>{date}</p>
            </div>
          </div>

          {/* Client */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color:'var(--text-1)' }}>{client}</p>
            <p className="text-xs truncate mt-0.5" style={{ color:'var(--text-3)' }}>
              {order.user?.email || '—'}
            </p>
          </div>

          {/* Items count */}
          <div className="flex-shrink-0 hidden md:block">
            <p className="text-xs font-medium text-center" style={{ color:'var(--text-2)' }}>
              {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>

          {/* Total */}
          <div className="flex-shrink-0 w-24 text-right">
            <p className="so-mono font-bold text-sm" style={{ color:'var(--text-1)' }}>
              {order.totalAmount?.toFixed(2)} DT
            </p>
          </div>

          {/* Status selector */}
          <div className="flex-shrink-0">
            <StatusSelect orderId={order._id} current={order.status} onUpdate={onUpdateStatus}/>
          </div>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: expanded ? 'var(--green-lt)' : 'var(--bg)', color: expanded ? 'var(--green)' : 'var(--text-3)' }}>
            {expanded ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
          </button>
        </div>
      </div>

      {/* Detail panel */}
      {expanded && (
        <div style={{ borderBottom:`1px solid var(--border)` }}>
          <OrderDetail order={order}/>
        </div>
      )}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function SellerOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!document.getElementById('so-styles')) {
      const el = document.createElement('style'); el.id='so-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
    window.scrollTo({ top:0, behavior:'instant' });
  }, []);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Session expirée'); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const res = await axios.get('/api/orders/seller', {
        headers: { Authorization:`Bearer ${token}` }
      });
      setOrders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  // CSV export
  const exportCSV = () => {
    const rows = [
      ['ID','Date','Client','Email','Téléphone','Articles','Total (DT)','Statut','Adresse'],
      ...filtered.map(o => [
        String(o._id).slice(-8).toUpperCase(),
        new Date(o.createdAt).toLocaleDateString('fr-TN'),
        o.user?.name || o.shippingAddress?.fullName || '—',
        o.user?.email || '—',
        o.shippingAddress?.phone || '—',
        o.items?.length || 0,
        o.totalAmount?.toFixed(2),
        STATUS_CFG[o.status]?.label || o.status,
        [o.shippingAddress?.address, o.shippingAddress?.city].filter(Boolean).join(', '),
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  // Filtered orders
  const filtered = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') result = result.filter(o => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        String(o._id).toLowerCase().includes(q) ||
        (o.user?.name  || '').toLowerCase().includes(q) ||
        (o.user?.email || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.fullName || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.phone   || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filterStatus, search]);

  // Stats
  const stats = useMemo(() => ({
    total:     orders.length,
    revenue:   orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.totalAmount||0),0),
    pending:   orders.filter(o=>o.status==='pending').length,
    delivered: orders.filter(o=>o.status==='delivered').length,
  }), [orders]);

  return (
    <div className="so-root pt-[112px]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-sm font-medium mb-1" style={{ color:'var(--text-3)' }}>Administration</p>
          <h1 className="so-display text-3xl font-bold" style={{ color:'var(--text-1)' }}>Gestion des commandes</h1>
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label:'Total commandes',  val:stats.total,                    color:'var(--blue)'   },
            { label:'Revenus (DT)',      val:stats.revenue.toFixed(0)+' DT', color:'var(--green)'  },
            { label:'En attente',        val:stats.pending,                   color:'var(--amber)'  },
            { label:'Livrées',           val:stats.delivered,                 color:'var(--purple)' },
          ].map((s, i) => (
            <div key={i} className="so-in p-5 rounded-2xl" style={{ background:'var(--card)', border:'1px solid var(--border)', animationDelay:`${i*60}ms` }}>
              <p className="so-mono text-2xl font-black" style={{ color:s.color }}>{s.val}</p>
              <p className="text-xs font-medium mt-1" style={{ color:'var(--text-3)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-3)', pointerEvents:'none' }}/>
            <input
              type="text"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Rechercher par ID, client, email, téléphone…"
              className="so-search"
            />
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="so-select">
            <option value="all">Tous les statuts</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>

          {/* Actions */}
          <button onClick={fetchOrders} className="so-btn">
            <FiRefreshCw size={13}/> Actualiser
          </button>
          <button onClick={exportCSV} className="so-btn primary">
            <FiDownload size={13}/> Exporter CSV
          </button>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background:'var(--card)', border:'1px solid var(--border)' }}>

          {/* Table header */}
          <div className="flex items-center gap-4 px-6 py-3" style={{ borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
            <div className="w-24 flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Commande</p>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Client</p>
            </div>
            <div className="w-16 flex-shrink-0 hidden md:block text-center">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Articles</p>
            </div>
            <div className="w-24 flex-shrink-0 text-right">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Total</p>
            </div>
            <div className="flex-shrink-0 w-36">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Statut</p>
            </div>
            <div className="w-8 flex-shrink-0"/>
          </div>

          {/* Loading */}
          {loading && (
            <div className="divide-y" style={{ '--tw-divide-color':'var(--border)' }}>
              {Array(6).fill(0).map((_, i) => <SkeletonRow key={i}/>)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiAlertCircle size={28} style={{ color:'var(--red)' }} className="mb-3"/>
              <p className="font-semibold text-sm" style={{ color:'var(--text-1)' }}>{error}</p>
              <button onClick={fetchOrders} className="so-btn mt-4">Réessayer</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-5xl mb-4">📦</p>
              <p className="font-semibold text-sm" style={{ color:'var(--text-1)' }}>
                {search || filterStatus !== 'all' ? 'Aucune commande correspond à votre recherche' : 'Aucune commande pour l\'instant'}
              </p>
              {(search || filterStatus !== 'all') && (
                <button onClick={() => { setSearch(''); setFilterStatus('all'); }} className="so-btn mt-4">Réinitialiser</button>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading && !error && filtered.length > 0 && (
            <div>
              {filtered.map((order, i) => (
                <OrderRow key={order._id} order={order} index={i} onUpdateStatus={handleUpdateStatus}/>
              ))}
            </div>
          )}
        </div>
                                    
        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs mt-3 text-right" style={{ color:'var(--text-3)' }}>
            {filtered.length} commande{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            {filterStatus !== 'all' || search ? ` (filtrées sur ${orders.length} total)` : ''}
          </p>
        )}
      </div>
    </div>
  );
}