// frontend/src/pages/SellerProfile.jsx
// Route: /seller/:id
// Also add to App.jsx: <Route path="/seller/:id" element={<SellerProfile />} />
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiShoppingCart, FiHeart, FiStar,
  FiPackage, FiAlertCircle, FiMessageCircle, FiUser
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../components/Footer';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.sp-root    { font-family:'DM Sans',sans-serif; }
.sp-display { font-family:'Sora',sans-serif; }
.sp-mono    { font-family:'DM Mono',monospace; }

@keyframes sp-fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes sp-cardIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes sp-spin    { to{transform:rotate(360deg)} }
@keyframes sp-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes sp-heartPop{ 0%{transform:scale(1)} 40%{transform:scale(1.4)} 100%{transform:scale(1)} }

.sp-fadeUp { animation:sp-fadeUp .5s cubic-bezier(.22,1,.36,1) both }
.sp-cardIn { animation:sp-cardIn .44s cubic-bezier(.22,1,.36,1) both }
.sp-spin   { animation:sp-spin .8s linear infinite }

.sp-shimmer {
  background:linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%);
  background-size:600px 100%;
  animation:sp-shimmer 1.4s infinite linear;
}
.dark .sp-shimmer {
  background:linear-gradient(90deg,#1f2937 25%,#2d3748 50%,#1f2937 75%);
  background-size:600px 100%;
}

.sp-card { transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease; }
.sp-card:hover { transform:translateY(-4px); box-shadow:0 16px 36px rgba(0,0,0,.1); }
.dark .sp-card:hover { box-shadow:0 16px 36px rgba(0,0,0,.38); }

.sp-img-zoom { transition:transform .45s cubic-bezier(.22,1,.36,1); }
.sp-card:hover .sp-img-zoom { transform:scale(1.06); }

.sp-btn { transition:transform .14s cubic-bezier(.22,1,.36,1),background .14s ease; }
.sp-btn:hover:not(:disabled) { transform:translateY(-2px); }
.sp-btn:active:not(:disabled){ transform:scale(.96); }
.sp-btn:disabled { opacity:.4;cursor:not-allowed; }
`;

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

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800">
      <div className="h-48 sp-shimmer"/>
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 sp-shimmer rounded-lg w-3/4"/>
        <div className="h-5 sp-shimmer rounded-lg w-1/3"/>
      </div>
    </div>
  );
}

function ProductCard({ product, index, wishlistIds, onToggleWishlist, onAddToCart }) {
  const [isFav, setIsFav]             = useState(wishlistIds?.has(product._id)||false);
  const [favAnim, setFavAnim]         = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setIsFav(wishlistIds?.has(product._id)||false); }, [wishlistIds, product._id]);

  const handleFav = (e) => {
    e.stopPropagation(); setFavAnim(true); setTimeout(()=>setFavAnim(false),350);
    setIsFav(f=>!f); onToggleWishlist?.(product._id, isFav);
  };
  const handleCart = async (e) => {
    e.stopPropagation(); if(cartLoading||product.stock===0) return;
    setCartLoading(true); await onAddToCart?.(product); setCartLoading(false);
  };

  return (
    <div onClick={()=>navigate(`/product/${product._id}`)}
      className="sp-card sp-cardIn bg-white dark:bg-gray-900 rounded-2xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm flex flex-col cursor-pointer group"
      style={{ animationDelay:`${index*50}ms` }}>
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        <img src={product.image||'https://placehold.co/400x400?text=Produit'} alt={product.title}
          className="sp-img-zoom w-full h-full object-cover"
          onError={e=>e.target.src='https://placehold.co/400x400?text=?'}/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
        {product.stock===0 && <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-lg">Rupture</span>}
        <button onClick={handleFav}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center shadow transition-all duration-200
            ${isFav?'bg-red-500 text-white opacity-100':'bg-white/90 dark:bg-gray-900/90 text-gray-400 opacity-0 group-hover:opacity-100'}`}>
          <FiHeart size={13} className={`${isFav?'fill-white':''}`} style={favAnim?{transform:'scale(1.4)'}:{}}/>
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCart} disabled={product.stock===0||cartLoading}
            className="sp-btn w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-400 transition">
            {cartLoading?<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full sp-spin"/>:<FiShoppingCart size={12}/>}
            {cartLoading?'Ajout…':product.stock===0?'Rupture':'Ajouter au panier'}
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1.5 group-hover:text-[#00b894] transition-colors flex-1">{product.title}</h3>
        {product.averageRating>0 && (
          <div className="flex items-center gap-1.5 mb-2"><Stars rating={product.averageRating}/><span className="sp-mono text-xs text-gray-400">({product.ratingCount||0})</span></div>
        )}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <span className="sp-mono font-black text-[#00b894] text-lg">{product.price?.toFixed(2)}<span className="text-xs opacity-60 ml-0.5">DT</span></span>
          <button onClick={handleCart} disabled={product.stock===0||cartLoading}
            className="sp-btn w-8 h-8 bg-[#00b894] hover:bg-[#00997f] disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition">
            {cartLoading?<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full sp-spin"/>:<FiShoppingCart size={13}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [seller, setSeller]   = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    if (!document.getElementById('sp-styles')) {
      const el=document.createElement('style');el.id='sp-styles';el.textContent=STYLES;
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
        // Fetch seller products via search filtered by seller id
        const res = await axios.get(`/api/sellers/${id}/profile`);
        setSeller(res.data.seller);
        setProducts(res.data.products || []);
      } catch (err) {
        if (err.response?.status === 404) setError('Vendeur introuvable');
        else setError('Impossible de charger le profil');
      } finally { setLoading(false); }
    })();
  }, [id]);

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
      toast.success(`"${product.title?.substring(0,26)}…" ajouté !`);
    } catch { toast.error('Erreur ajout panier'); }
  };

  if (loading) return (
    <div className="sp-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="w-24 h-8 sp-shimmer rounded-xl mb-8"/>
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 sp-shimmer rounded-3xl flex-shrink-0"/>
          <div className="flex-1 space-y-3">
            <div className="h-6 sp-shimmer rounded-xl w-1/3"/>
            <div className="h-4 sp-shimmer rounded-lg w-1/2"/>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="sp-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px] flex items-center justify-center">
      <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-3xl shadow-xl max-w-sm w-full">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle size={22} className="text-red-500"/>
        </div>
        <p className="font-bold text-gray-900 dark:text-white mb-4">{error}</p>
        <button onClick={()=>navigate(-1)} className="sp-btn px-6 py-3 bg-[#00b894] text-white rounded-xl font-bold text-sm transition">Retour</button>
      </div>
    </div>
  );

  const avgRating = products.length
    ? (products.reduce((s,p)=>s+(p.averageRating||0),0)/products.length).toFixed(1)
    : '0.0';

  return (
    <div className="sp-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px]">

      {/* Header */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
          <button onClick={()=>navigate(-1)}
            className="sp-btn flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#00b894] mb-7 transition">
            <FiArrowLeft size={15}/> Retour
          </button>

          <div className="sp-fadeUp flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black flex-shrink-0 shadow-xl"
              style={{ background:`hsl(${(seller?.name?.charCodeAt(0)||65)*137}deg,60%,52%)` }}>
              {(seller?.name||'V').charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="sp-display text-3xl font-black text-gray-900 dark:text-white">{seller?.name||'Vendeur'}</h1>
                <span className="px-3 py-1 bg-[#00b894]/10 text-[#00b894] text-xs font-bold rounded-full">✓ Vendeur vérifié</span>
              </div>
              {seller?.email && (
                <p className="text-sm text-gray-400 mb-3">{seller.email}</p>
              )}
              <div className="flex flex-wrap gap-5">
                <div className="text-center">
                  <p className="sp-mono font-black text-[#00b894] text-xl">{products.length}</p>
                  <p className="text-xs text-gray-400">Produits</p>
                </div>
                <div className="text-center">
                  <p className="sp-mono font-black text-amber-500 text-xl">{avgRating}</p>
                  <p className="text-xs text-gray-400">Note moy.</p>
                </div>
                <div className="text-center">
                  <p className="sp-mono font-black text-[#6366f1] text-xl">{products.filter(p=>p.stock>0).length}</p>
                  <p className="text-xs text-gray-400">En stock</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <button onClick={()=>window.open('https://wa.me/21692006969','_blank')}
              className="sp-btn flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm transition shadow-lg flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#25D366,#128C7E)', boxShadow:'0 6px 18px rgba(37,211,102,.3)' }}>
              <FiMessageCircle size={15}/> Contacter
            </button>
          </div>
        </div>
      </section>

      {/* Products */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="sp-fadeUp flex items-center justify-between mb-7">
          <div>
            <p className="text-[#00b894] text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <FiPackage size={11}/> Catalogue
            </p>
            <h2 className="sp-display text-2xl font-black text-gray-900 dark:text-white">
              Produits de {seller?.name||'ce vendeur'}
            </h2>
          </div>
          <p className="text-sm text-gray-400">{products.length} produit{products.length!==1?'s':''}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiPackage size={22} className="text-gray-400"/>
            </div>
            <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm">Aucun produit disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p,i) => (
              <ProductCard key={p._id} product={p} index={i}
                wishlistIds={wishlistIds}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}/>
            ))}
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}