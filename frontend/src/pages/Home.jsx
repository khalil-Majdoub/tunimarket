// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import toast from 'react-hot-toast';
import {
  FiShoppingCart, FiHeart, FiArrowRight, FiSearch,
  FiTrendingUp, FiZap, FiPackage, FiChevronRight
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../components/Footer';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.hm-root    { font-family:'DM Sans',sans-serif; }
.hm-display { font-family:'Sora',sans-serif; }
.hm-mono    { font-family:'DM Mono',monospace; }

@keyframes hm-fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes hm-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes hm-cardIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes hm-spin    { to{transform:rotate(360deg)} }

/* Shimmer works in both light and dark */
@keyframes hm-shimmer-light { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

.hm-fadeUp { animation:hm-fadeUp .5s cubic-bezier(.22,1,.36,1) both }
.hm-fadeIn { animation:hm-fadeIn .38s ease both }
.hm-cardIn { animation:hm-cardIn .44s cubic-bezier(.22,1,.36,1) both }
.hm-spin   { animation:hm-spin .8s linear infinite }

/* Light shimmer */
.hm-shimmer-light {
  background:linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%);
  background-size:600px 100%;
  animation:hm-shimmer-light 1.4s infinite linear;
}
/* Dark shimmer — separate class applied via JS/class */
.dark .hm-shimmer-light {
  background:linear-gradient(90deg,#1f2937 25%,#2d3748 50%,#1f2937 75%);
  background-size:600px 100%;
  animation:hm-shimmer-light 1.4s infinite linear;
}

.hm-card { transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease; }
.hm-card:hover { transform:translateY(-4px); }
.hm-card:hover { box-shadow:0 16px 40px rgba(0,0,0,.10); }
.dark .hm-card:hover { box-shadow:0 16px 40px rgba(0,0,0,.45); }

.hm-img-zoom { transition:transform .5s cubic-bezier(.22,1,.36,1); }
.hm-card:hover .hm-img-zoom { transform:scale(1.06); }

.hm-btn { transition:transform .14s cubic-bezier(.22,1,.36,1),background .14s ease,opacity .14s ease; }
.hm-btn:hover:not(:disabled)  { transform:translateY(-2px); }
.hm-btn:active:not(:disabled) { transform:scale(.96); }
.hm-btn:disabled { opacity:.4;cursor:not-allowed; }

.hm-hero-input:focus {
  outline:none;
  border-color:rgba(255,255,255,.7);
  box-shadow:0 0 0 3px rgba(255,255,255,.15);
}

/* Swiper */
.hm-swiper .swiper-button-next,
.hm-swiper .swiper-button-prev {
  width:36px;height:36px;
  border-radius:10px;
  box-shadow:0 3px 12px rgba(0,0,0,.14);
  color:#374151;
  background:white;
}
.dark .hm-swiper .swiper-button-next,
.dark .hm-swiper .swiper-button-prev { background:#1f2937;color:#e5e7eb; }
.hm-swiper .swiper-button-next::after,
.hm-swiper .swiper-button-prev::after { font-size:13px;font-weight:800; }
.hm-swiper .swiper-pagination-bullet { background:#d1d5db;opacity:1;width:6px;height:6px; }
.hm-swiper .swiper-pagination-bullet-active { background:#00b894;width:20px;border-radius:3px; }

/* Trending rank badge */
.hm-rank {
  position:absolute;top:10px;left:10px;
  width:26px;height:26px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-weight:900;font-size:12px;color:white;
  font-family:'DM Mono',monospace;
  z-index:2;
}
.hm-rank-1 { background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 2px 8px rgba(245,158,11,.5); }
.hm-rank-2 { background:linear-gradient(135deg,#6b7280,#4b5563); }
.hm-rank-3 { background:linear-gradient(135deg,#b45309,#92400e); }
.hm-rank-n { background:rgba(0,0,0,.45); }

/* Category pill */
.hm-cat-pill {
  transition:transform .15s ease,box-shadow .15s ease,background .15s ease;
}
.hm-cat-pill:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,.1); }
.dark .hm-cat-pill:hover { box-shadow:0 8px 20px rgba(0,0,0,.4); }
`;

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, size=12 }) {
  const full=Math.floor(rating),half=rating%1>=0.5,empty=5-full-(half?1:0);
  return (
    <span className="flex items-center gap-px">
      {Array(full).fill(0).map((_,i)  => <FaStar key={`f${i}`} size={size} className="text-amber-400"/>)}
      {half && <FaStarHalfAlt size={size} className="text-amber-400"/>}
      {Array(empty).fill(0).map((_,i) => <FaRegStar key={`e${i}`} size={size} className="text-gray-300 dark:text-gray-600"/>)}
    </span>
  );
}

// ─── Skeleton cards — use hm-shimmer-light so dark mode works ────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm">
      <div className="h-52 hm-shimmer-light"/>
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 hm-shimmer-light rounded-lg w-3/4"/>
        <div className="h-3 hm-shimmer-light rounded-lg w-1/2"/>
        <div className="flex justify-between items-center mt-3">
          <div className="h-5 hm-shimmer-light rounded-lg w-1/3"/>
          <div className="h-9 hm-shimmer-light rounded-xl w-9"/>
        </div>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, index, wishlistIds, onToggleWishlist, onAddToCart, rank }) {
  const [isFav, setIsFav]             = useState(wishlistIds?.has(product._id)||false);
  const [favAnim, setFavAnim]         = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setIsFav(wishlistIds?.has(product._id)||false); }, [wishlistIds, product._id]);

  const handleFav = (e) => {
    e.stopPropagation();
    setFavAnim(true); setTimeout(()=>setFavAnim(false),350);
    setIsFav(f=>!f);
    onToggleWishlist?.(product._id, isFav);
  };
  const handleCart = async (e) => {
    e.stopPropagation();
    if (cartLoading||product.stock===0) return;
    setCartLoading(true);
    await onAddToCart?.(product);
    setCartLoading(false);
  };

  return (
    <div onClick={()=>navigate(`/product/${product._id}`)}
      className="hm-card hm-cardIn bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm flex flex-col cursor-pointer group"
      style={{ animationDelay:`${index*45}ms` }}>

      <div className="relative h-52 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        <img src={product.image||'https://placehold.co/400x400?text=Produit'} alt={product.title}
          className="hm-img-zoom w-full h-full object-cover"
          onError={e=>e.target.src='https://placehold.co/400x400?text=?'}/>

        {/* Rank badge */}
        {rank !== undefined && (
          <div className={`hm-rank ${rank===0?'hm-rank-1':rank===1?'hm-rank-2':rank===2?'hm-rank-3':'hm-rank-n'}`}>
            {rank+1}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

        {/* Stock */}
        {product.stock===0 && <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-lg">Rupture</span>}
        {product.stock>0&&product.stock<=5 && <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg">Limité</span>}

        {/* Wishlist */}
        <button onClick={handleFav}
          className={`absolute bottom-10 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center shadow transition-all duration-200
            ${isFav?'bg-red-500 text-white opacity-100':'bg-white/90 dark:bg-gray-900/90 text-gray-400 opacity-0 group-hover:opacity-100'}`}>
          <FiHeart size={13} className={`${isFav?'fill-white':''}`} style={favAnim?{transform:'scale(1.4)'}:{}}/>
        </button>

        {/* Cart overlay button */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={handleCart} disabled={product.stock===0||cartLoading}
            className="hm-btn w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-400 transition">
            {cartLoading?<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full hm-spin"/>:<FiShoppingCart size={12}/>}
            {cartLoading?'Ajout…':product.stock===0?'Rupture':'Ajouter au panier'}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1.5 group-hover:text-[#00b894] transition-colors leading-snug flex-1">
          {product.title}
        </h3>
        {product.averageRating>0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars rating={product.averageRating}/>
            <span className="hm-mono text-xs text-gray-400">({product.ratingCount||0})</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-100 dark:border-gray-800">
          <span className="hm-mono font-black text-[#00b894] text-lg">
            {product.price?.toFixed(2)}<span className="text-xs opacity-60 ml-0.5">DT</span>
          </span>
          <button onClick={handleCart} disabled={product.stock===0||cartLoading}
            className="hm-btn w-9 h-9 bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition shadow-sm">
            {cartLoading?<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full hm-spin"/>:<FiShoppingCart size={13}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ badge, title, linkTo, linkLabel }) {
  return (
    <div className="hm-fadeUp flex items-end justify-between mb-7">
      <div>
        <p className="flex items-center gap-1.5 text-[#00b894] text-xs font-bold uppercase tracking-widest mb-2">{badge}</p>
        <h2 className="hm-display text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="hm-btn flex items-center gap-1 text-sm text-[#00b894] font-semibold hover:underline transition">
          {linkLabel} <FiChevronRight size={14}/>
        </Link>
      )}
    </div>
  );
}

// ─── Categories (visual large cards) ─────────────────────────────────────────
const CATS = [
  {name:'Électronique',emoji:'📱',from:'#3b82f6',to:'#1d4ed8'},
  {name:'Vêtements',   emoji:'👗',from:'#ec4899',to:'#be185d'},
  {name:'Maison',      emoji:'🏠',from:'#f59e0b',to:'#b45309'},
  {name:'Sport',       emoji:'⚽',from:'#10b981',to:'#047857'},
  {name:'Beauté',      emoji:'💄',from:'#8b5cf6',to:'#6d28d9'},
  {name:'Alimentation',emoji:'🥗',from:'#06b6d4',to:'#0e7490'},
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts]             = useState([]);
  const [bestSellers, setBestSellers]       = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [wishlistIds, setWishlistIds]       = useState(new Set());
  const [heroSearch, setHeroSearch]         = useState('');

  useEffect(() => {
    if (!document.getElementById('hm-styles')) {
      const el=document.createElement('style');el.id='hm-styles';el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const token=localStorage.getItem('token'); if(!token) return;
    axios.get('/api/wishlist',{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>setWishlistIds(new Set((r.data.products||[]).map(p=>p._id))))
      .catch(()=>{});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/products');
        console.log('Raw API response:', res.data);
        let all = Array.isArray(res.data) ? res.data : (res.data?.products||[]);
        console.log('Processed products count:', all.length);
        setProducts(all);
        setBestSellers([...all].sort((a,b)=>(b.sales||0)-(a.sales||0)).slice(0,10));
        setRandomProducts([...all].sort(()=>0.5-Math.random()).slice(0,12));
      } catch(e) {
        console.error('Failed to load products:', e);
      } finally { setLoading(false); }
    })();
  }, []);

  const toggleWishlist = async (productId, isFav) => {
    const token=localStorage.getItem('token');
    if(!token){toast.error('Veuillez vous connecter');return;}
    setWishlistIds(prev=>{const n=new Set(prev);isFav?n.delete(productId):n.add(productId);return n;});
    try {
      await axios.post(isFav?'/api/wishlist/remove':'/api/wishlist/add',{productId},{headers:{Authorization:`Bearer ${token}`}});
      window.dispatchEvent(new Event('wishlistUpdate'));
      toast.success(isFav?'Retiré des favoris':'Ajouté aux favoris ❤️');
    } catch {
      setWishlistIds(prev=>{const n=new Set(prev);isFav?n.add(productId):n.delete(productId);return n;});
      toast.error('Erreur favoris');
    }
  };

  const addToCart = async (product) => {
    const token=localStorage.getItem('token');
    if(!token){toast.error('Veuillez vous connecter');return;}
    try {
      await axios.post('/api/cart/add',{productId:product._id,quantity:1},{headers:{Authorization:`Bearer ${token}`}});
      window.dispatchEvent(new Event('cartUpdate'));
      const n=product.title?.substring(0,26);
      toast.success(`"${n}${product.title?.length>26?'…':''}" ajouté !`);
    } catch { toast.error('Erreur ajout panier'); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    // pt-[104px] = 60px main bar + 44px category bar
    <div className="hm-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px]">

      {/* ── Hero — clean split design ──────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* Left text */}
            <div className="flex-1 text-center md:text-left">
              <div className="hm-fadeUp inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background:'rgba(0,184,148,.1)', color:'#00b894', border:'1px solid rgba(0,184,148,.2)' }}>
                🇹🇳 Marketplace 100% tunisienne
              </div>
              <h1 className="hm-display hm-fadeUp text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4"
                style={{ animationDelay:'60ms' }}>
                Trouvez tout<br/>
                <span style={{ background:'linear-gradient(135deg,#00b894,#00c9a7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  ce dont vous
                </span><br/>
                avez besoin.
              </h1>
              <p className="hm-fadeUp text-gray-500 dark:text-gray-400 text-base mb-7 max-w-md leading-relaxed" style={{ animationDelay:'120ms' }}>
                Des milliers de produits de vendeurs tunisiens locaux — paiement à la livraison, livraison rapide.
              </p>

              {/* Search bar */}
              <div className="hm-fadeUp flex gap-3 max-w-md" style={{ animationDelay:'180ms' }}>
                <div className="relative flex-1">
                  <FiSearch size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <input
                    value={heroSearch}
                    onChange={e=>setHeroSearch(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&heroSearch.trim()){ navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`); setHeroSearch(''); } }}
                    placeholder="Rechercher un produit…"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00b894] focus:bg-white dark:focus:bg-gray-900 transition-all"
                  />
                </div>
                <button onClick={()=>{ if(heroSearch.trim()) navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`); }}
                  className="hm-btn px-5 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 6px 18px rgba(0,184,148,.35)' }}>
                  <FiSearch size={16}/>
                </button>
              </div>

              {/* Trust row */}
              <div className="hm-fadeUp flex flex-wrap items-center gap-4 mt-6 text-xs text-gray-400 dark:text-gray-500" style={{ animationDelay:'240ms' }}>
                {['🚚 Livraison gratuite','💳 Paiement à la livraison','↩️ Retour 7 jours'].map((t,i)=>(
                  <span key={i} className="flex items-center gap-1.5">{t}</span>
                ))}
              </div>
            </div>

            {/* Right — animated stats + top product preview */}
            <div className="hm-fadeUp flex-shrink-0 grid grid-cols-2 gap-3 max-w-xs w-full" style={{ animationDelay:'150ms' }}>
              {/* Stats */}
              {[
                { val:`${products.length}+`, label:'Produits', icon:'📦', color:'#00b894' },
                { val:'100%',                label:'Tunisien', icon:'🇹🇳', color:'#3b82f6' },
                { val:'0 DT',                label:'Livraison', icon:'🚚', color:'#f59e0b' },
                { val:'24h',                 label:'Délai moyen', icon:'⚡', color:'#8b5cf6' },
              ].map((s,i)=>(
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 ring-1 ring-gray-100 dark:ring-gray-700 text-center"
                  style={{ animation:`hm-fadeUp .5s cubic-bezier(.22,1,.36,1) ${i*60+150}ms both` }}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="hm-mono font-black text-xl" style={{ color:s.color }}>{s.val}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 space-y-14">

        {/* ── Trending — 10 products with rank badges ──────────────────────── */}
        <section>
          <SectionHeader
            badge={<><FiTrendingUp size={12}/> Tendances</>}
            title="🔥 Produits en vogue"
            linkTo="/search?sort=newest"
            linkLabel="Voir tout"
          />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array(10).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          ) : bestSellers.length > 0 ? (
            <div className="hm-swiper">
              <Swiper
                modules={[Pagination, Navigation, Autoplay]}
                spaceBetween={14}
                loop={bestSellers.length > 4}
                autoplay={{ delay:3000, disableOnInteraction:false, pauseOnMouseEnter:true }}
                pagination={{ clickable:true }}
                navigation
                breakpoints={{
                  0:    { slidesPerView:2 },
                  640:  { slidesPerView:3 },
                  900:  { slidesPerView:4 },
                  1200: { slidesPerView:5 },
                }}
                className="pb-10"
              >
                {bestSellers.map((p,i)=>(
                  <SwiperSlide key={p._id}>
                    <ProductCard product={p} index={i} rank={i}
                      wishlistIds={wishlistIds}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={addToCart}/>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Aucun produit disponible</p>
            </div>
          )}
        </section>

        {/* ── Category cards ───────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            badge={<><FiPackage size={12}/> Explorer</>}
            title="Parcourir par catégorie"
          />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {CATS.map((cat,i)=>(
              <button key={cat.name} onClick={()=>navigate(`/search?q=${cat.name}`)}
                className="hm-cat-pill hm-cardIn group relative overflow-hidden rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm"
                style={{ animationDelay:`${i*55}ms`, background:`linear-gradient(135deg,${cat.from}15,${cat.to}25)`, border:`1px solid ${cat.from}25` }}>
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.emoji}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{cat.name}</span>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background:`linear-gradient(135deg,${cat.from}20,${cat.to}35)` }}/>
              </button>
            ))}
          </div>
        </section>

        {/* ── Discover — 12 products grid ──────────────────────────────────── */}
        <section>
          <SectionHeader
            badge={<><FiZap size={12}/> Pour vous</>}
            title="Découvrez plus"
            linkTo="/search"
            linkLabel="Tout voir"
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array(12).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          ) : randomProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {randomProducts.map((p,i)=>(
                <ProductCard key={p._id} product={p} index={i}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={addToCart}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiSearch size={22} className="text-gray-400"/>
              </div>
              <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm">Aucun produit trouvé</p>
            </div>
          )}
        </section>

        {/* ── Value props ──────────────────────────────────────────────────── */}
        <section className="hm-fadeUp bg-white dark:bg-gray-900 rounded-3xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
            {[
              { emoji:'🚚', title:'Livraison gratuite',      desc:'Partout en Tunisie, sans minimum' },
              { emoji:'💳', title:'Paiement à la livraison', desc:'Payez quand vous recevez votre commande' },
              { emoji:'↩️', title:'Retour facile',            desc:'Retour sous 7 jours, sans question' },
            ].map((v,i)=>(
              <div key={i} className="flex items-center gap-4 px-8 py-7"
                style={{ animation:`hm-fadeUp .52s cubic-bezier(.22,1,.36,1) ${i*80}ms both` }}>
                <span className="text-3xl flex-shrink-0">{v.emoji}</span>
                <div>
                  <p className="hm-display font-black text-gray-900 dark:text-white text-base">{v.title}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer/>
    </div>
  );
}