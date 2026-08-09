// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FiPackage, FiClock, FiTruck, FiCheck, FiX, FiRefreshCw,
  FiChevronDown, FiChevronUp, FiShoppingBag, FiMapPin,
  FiPhone, FiCalendar, FiAlertCircle, FiUser
} from 'react-icons/fi';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.db-root    { font-family:'DM Sans',sans-serif; }
.db-display { font-family:'Sora',sans-serif; }
.db-mono    { font-family:'DM Mono',monospace; }

@keyframes db-fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes db-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes db-scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes db-spin    { to{transform:rotate(360deg)} }
@keyframes db-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes db-slideDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

.db-fadeUp   { animation:db-fadeUp  .5s cubic-bezier(.22,1,.36,1) both }
.db-fadeIn   { animation:db-fadeIn  .35s ease both }
.db-scaleIn  { animation:db-scaleIn .3s  cubic-bezier(.22,1,.36,1) both }
.db-spin     { animation:db-spin .8s linear infinite }
.db-slideDown{ animation:db-slideDown .28s cubic-bezier(.22,1,.36,1) both }

.db-shimmer {
  background:linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%);
  background-size:600px 100%;
  animation:db-shimmer 1.4s infinite linear;
}
.dark .db-shimmer {
  background:linear-gradient(90deg,#1f2937 25%,#2d3748 50%,#1f2937 75%);
  background-size:600px 100%;
}

.db-card { transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease; }
.db-card:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(0,0,0,.09); }
.dark .db-card:hover { box-shadow:0 14px 36px rgba(0,0,0,.38); }

.db-btn { transition:transform .14s cubic-bezier(.22,1,.36,1),background .14s ease; }
.db-btn:hover { transform:translateY(-1px); }
.db-btn:active { transform:scale(.96); }
`;

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:    { label:'En attente',    icon:FiClock,     color:'#f59e0b', bg:'bg-amber-50 dark:bg-amber-900/20',    text:'text-amber-700 dark:text-amber-300' },
  processing: { label:'En traitement', icon:FiRefreshCw, color:'#6366f1', bg:'bg-indigo-50 dark:bg-indigo-900/20',  text:'text-indigo-700 dark:text-indigo-300' },
  shipped:    { label:'Expédiée',      icon:FiTruck,     color:'#8b5cf6', bg:'bg-violet-50 dark:bg-violet-900/20',  text:'text-violet-700 dark:text-violet-300' },
  delivered:  { label:'Livrée',        icon:FiCheck,     color:'#10b981', bg:'bg-emerald-50 dark:bg-emerald-900/20',text:'text-emerald-700 dark:text-emerald-300' },
  cancelled:  { label:'Annulée',       icon:FiX,         color:'#ef4444', bg:'bg-red-50 dark:bg-red-900/20',        text:'text-red-600 dark:text-red-400' },
};
const getStatus = (s) => STATUS[s] || STATUS.pending;

// ─── Progress steps ────────────────────────────────────────────────────────────
const STEPS = ['pending','processing','shipped','delivered'];
const STEP_LABELS = ['Commandée','En traitement','Expédiée','Livrée'];

function OrderProgress({ status }) {
  if (status === 'cancelled') return (
    <div className="flex items-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
      <FiX size={14} className="text-red-500"/><span className="text-sm text-red-600 dark:text-red-400 font-semibold">Commande annulée</span>
    </div>
  );
  const cur = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
              ${i < cur ? 'bg-[#00b894] border-[#00b894]' : i === cur ? 'bg-[#00b894] border-[#00b894] ring-4 ring-[#00b894]/20' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
              {i < cur
                ? <FiCheck size={13} className="text-white"/>
                : i === cur
                ? React.createElement(getStatus(s).icon, { size:13, className:'text-white' })
                : <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"/>
              }
            </div>
            <span className={`text-[10px] font-semibold ${i<=cur?'text-[#00b894]':'text-gray-400 dark:text-gray-500'}`}>{STEP_LABELS[i]}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${i<cur?'bg-[#00b894]':'bg-gray-200 dark:bg-gray-700'}`}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ order, index }) {
  const [expanded, setExpanded] = useState(false);
  const st = getStatus(order.status);
  const Icon = st.icon;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  return (
    <div className="db-card db-fadeUp bg-white dark:bg-gray-900 rounded-2xl shadow-md ring-1 ring-gray-100 dark:ring-gray-800 overflow-hidden"
      style={{ animationDelay:`${index*60}ms` }}>
      <div className="h-1 w-full" style={{ background:st.color }}/>

      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${st.color}18` }}>
              <Icon size={17} style={{ color:st.color }}/>
            </div>
            <div>
              <p className="db-mono font-bold text-gray-900 dark:text-white text-sm">#{String(order._id).slice(-8).toUpperCase()}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                <FiCalendar size={10}/>{date}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:st.color }}/>
              {st.label}
            </span>
            <span className="db-mono font-black text-[#00b894] text-lg">{(order.totalAmount||0).toFixed(2)} DT</span>
            <button onClick={() => setExpanded(e=>!e)}
              className="db-btn w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              {expanded ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
            </button>
          </div>
        </div>

        {/* Compact preview */}
        {!expanded && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-1.5">
              {(order.items||[]).slice(0,4).map((item,i)=>(
                <img key={i} src={item.product?.image||'https://placehold.co/32x32?text=?'} alt=""
                  className="w-9 h-9 rounded-lg object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-900"
                  style={{ marginLeft:i>0?'-6px':0 }}
                  onError={e=>e.target.src='https://placehold.co/32x32?text=?'}/>
              ))}
              {(order.items||[]).length>4 && (
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-xs text-gray-500 font-bold" style={{ marginLeft:'-6px' }}>
                  +{(order.items||[]).length-4}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">{(order.items||[]).length} article{(order.items||[]).length>1?'s':''}</span>
          </div>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="db-slideDown border-t border-gray-100 dark:border-gray-800 p-5 space-y-5">
          {/* Progress */}
          <OrderProgress status={order.status}/>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FiPackage size={11}/> Articles ({(order.items||[]).length})
            </p>
            <div className="space-y-2">
              {(order.items||[]).map((item,i)=>(
                <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <img src={item.product?.image||'https://placehold.co/48x48?text=?'} alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-gray-200 flex-shrink-0"
                    onError={e=>e.target.src='https://placehold.co/48x48?text=?'}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {item.product?.title||'Produit supprimé'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{(item.price||0).toFixed(2)} DT × {item.quantity}</p>
                  </div>
                  <span className="db-mono font-bold text-[#00b894] text-sm">
                    {((item.price||0)*(item.quantity||0)).toFixed(2)} DT
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FiMapPin size={11}/> Livraison
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.shippingAddress?.fullName||'—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <FiPhone size={10}/>{order.shippingAddress?.phone||'—'}
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {[order.shippingAddress?.address,order.shippingAddress?.city,order.shippingAddress?.postalCode].filter(Boolean).join(', ')||'—'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Récapitulatif</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                  <span className="db-mono font-semibold text-gray-700 dark:text-gray-300">{(order.totalAmount||0).toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Livraison</span>
                  <span className="text-emerald-500 font-semibold">Gratuite</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">Total</span>
                  <span className="db-mono font-black text-[#00b894]">{(order.totalAmount||0).toFixed(2)} DT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonOrder() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800 overflow-hidden">
      <div className="h-1 db-shimmer"/>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 db-shimmer rounded-xl"/>
          <div className="space-y-2 flex-1">
            <div className="h-3.5 db-shimmer rounded-lg w-1/3"/>
            <div className="h-3 db-shimmer rounded-lg w-1/4"/>
          </div>
          <div className="h-7 db-shimmer rounded-full w-24"/>
          <div className="h-7 db-shimmer rounded-lg w-20"/>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useEffect(() => {
    if (!document.getElementById('db-styles')) {
      const el = document.createElement('style'); el.id='db-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); toast.error('Veuillez vous connecter'); return; }
      try {
        const res = await axios.get('/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data || []);
      } catch (err) {
        if (err.response?.status === 401) { navigate('/'); return; }
        setError('Impossible de charger vos commandes');
      } finally { setLoading(false); }
    };
    fetchOrders();
  }, [navigate]);

  const FILTERS = [
    { key:'all',        label:'Toutes',       count:orders.length },
    { key:'pending',    label:'En attente',   count:orders.filter(o=>o.status==='pending').length },
    { key:'processing', label:'En traitement',count:orders.filter(o=>o.status==='processing').length },
    { key:'shipped',    label:'Expédiées',    count:orders.filter(o=>o.status==='shipped').length },
    { key:'delivered',  label:'Livrées',      count:orders.filter(o=>o.status==='delivered').length },
    { key:'cancelled',  label:'Annulées',     count:orders.filter(o=>o.status==='cancelled').length },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const totalSpent = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.totalAmount||0),0);

  return (
    <div className="db-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px]">

      {/* Header */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="db-fadeUp">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                  style={{ background:`hsl(${(user?.name?.charCodeAt(0)||65)*137}deg,60%,52%)` }}>
                  {(user?.name||'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Bienvenue,</p>
                  <h1 className="db-display text-2xl font-black text-gray-900 dark:text-white">{user?.name||'Mon compte'}</h1>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{orders.length} commande{orders.length!==1?'s':''} passée{orders.length!==1?'s':''}</p>
            </div>

            {/* Stats */}
            {!loading && orders.length > 0 && (
              <div className="db-fadeUp flex gap-4" style={{ animationDelay:'80ms' }}>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-5 py-4 text-center ring-1 ring-gray-100 dark:ring-gray-700">
                  <p className="db-mono font-black text-[#00b894] text-2xl">{orders.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Commandes</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-5 py-4 text-center ring-1 ring-gray-100 dark:ring-gray-700">
                  <p className="db-mono font-black text-[#00b894] text-2xl">{totalSpent.toFixed(0)}<span className="text-sm opacity-70"> DT</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">Total dépensé</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">

        {/* Filter pills */}
        {!loading && orders.length > 0 && (
          <div className="db-fadeUp flex flex-wrap gap-2 mb-6">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`db-btn flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  filter===f.key
                    ? 'bg-[#00b894] text-white shadow-md shadow-[#00b894]/20'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-[#00b894] hover:text-[#00b894]'
                }`}>
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter===f.key?'bg-white/20':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {Array(3).fill(0).map((_,i) => <SkeletonOrder key={i}/>)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="db-scaleIn text-center py-20 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
            <FiAlertCircle size={28} className="text-red-400 mx-auto mb-3"/>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <button onClick={() => window.location.reload()}
              className="db-btn px-5 py-2.5 bg-[#00b894] text-white rounded-xl font-semibold text-sm transition">Réessayer</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="db-scaleIn text-center py-24 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="text-5xl mb-5">🛍️</div>
            <h2 className="db-display font-black text-gray-900 dark:text-white text-2xl mb-3">Aucune commande</h2>
            <p className="text-gray-400 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
              Vous n'avez pas encore passé de commande. Découvrez nos produits !
            </p>
            <Link to="/search"
              className="db-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg"
              style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.32)' }}>
              <FiShoppingBag size={16}/> Explorer la boutique
            </Link>
          </div>
        )}

        {/* No filter results */}
        {!loading && !error && orders.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
            <p className="text-gray-400 text-sm">Aucune commande dans cette catégorie</p>
            <button onClick={() => setFilter('all')}
              className="db-btn mt-3 px-5 py-2 rounded-xl bg-[#00b894] text-white text-sm font-semibold transition">
              Voir toutes les commandes
            </button>
          </div>
        )}

        {/* Orders */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((order, i) => (
              <OrderCard key={order._id} order={order} index={i}/>
            ))}
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}