// frontend/src/pages/ProductDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FiHeart, FiShoppingCart, FiStar, FiArrowLeft, FiShare2,
  FiChevronRight, FiMinus, FiPlus, FiUser, FiPackage,
  FiTruck, FiShield, FiRefreshCw, FiCheck,
} from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../components/Footer';

/* ─── Design tokens ────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --bg:       #f8f8f6;
  --card:     #ffffff;
  --border:   #e8e8e4;
  --text-1:   #0f172a;
  --text-2:   #475569;
  --text-3:   #94a3b8;
  --green:    #00b894;
  --green-dk: #00976e;
  --red:      #e11d48;
  --amber:    #d97706;
}
.dark {
  --bg:     #0f0f0f;
  --card:   #1a1a1a;
  --border: #2a2a2a;
  --text-1: #f1f5f9;
  --text-2: #94a3b8;
  --text-3: #475569;
}

.pd-root    { font-family:'DM Sans',sans-serif; background:var(--bg); color:var(--text-1); }
.pd-display { font-family:'Sora',sans-serif; }
.pd-mono    { font-family:'DM Mono',monospace; }

/* Animations — subtle, purposeful */
@keyframes pd-in   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes pd-fade { from{opacity:0} to{opacity:1} }
@keyframes pd-spin { to{transform:rotate(360deg)} }
@keyframes pd-pop  { 0%{transform:scale(1)} 35%{transform:scale(1.28)} 70%{transform:scale(.95)} 100%{transform:scale(1)} }
@keyframes pd-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

.pd-in    { animation:pd-in   .4s cubic-bezier(.22,1,.36,1) both }
.pd-fade  { animation:pd-fade .3s ease both }
.pd-spin  { animation:pd-spin .8s linear infinite }
.pd-pop   { animation:pd-pop  .35s cubic-bezier(.22,1,.36,1) }

.pd-shimmer {
  background:linear-gradient(90deg,#f0f0ee 25%,#e8e8e4 50%,#f0f0ee 75%);
  background-size:600px 100%;
  animation:pd-shimmer 1.5s infinite linear;
}
.dark .pd-shimmer {
  background:linear-gradient(90deg,#1e1e1e 25%,#2a2a2a 50%,#1e1e1e 75%);
  background-size:600px 100%;
}

/* Thumbnail image */
.pd-thumb {
  cursor:pointer;
  border:2px solid transparent;
  border-radius:10px;
  overflow:hidden;
  transition:border-color .15s,transform .15s,opacity .15s;
  opacity:.65;
}
.pd-thumb:hover  { opacity:.9; transform:translateY(-1px); }
.pd-thumb.active { border-color:var(--green); opacity:1; }

/* CTA buttons */
.pd-btn-primary {
  background:var(--green);
  color:#fff;
  border:none;
  border-radius:12px;
  font-family:'DM Sans',sans-serif;
  font-weight:700;
  font-size:15px;
  padding:14px 24px;
  cursor:pointer;
  display:flex;align-items:center;gap:8px;justify-content:center;
  transition:background .15s,transform .12s,box-shadow .15s,opacity .15s;
  box-shadow:0 4px 14px rgba(0,184,148,.3);
}
.pd-btn-primary:hover:not(:disabled)  { background:var(--green-dk); transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,184,148,.4); }
.pd-btn-primary:active:not(:disabled) { transform:scale(.97); }
.pd-btn-primary:disabled { opacity:.5;cursor:not-allowed; }

.pd-btn-secondary {
  background:var(--card);
  color:var(--text-1);
  border:1.5px solid var(--border);
  border-radius:12px;
  font-family:'DM Sans',sans-serif;
  font-weight:600;
  font-size:15px;
  padding:13px 24px;
  cursor:pointer;
  display:flex;align-items:center;gap:8px;justify-content:center;
  transition:border-color .15s,transform .12s,background .15s,color .15s;
}
.pd-btn-secondary:hover { border-color:var(--green);color:var(--green);background:rgba(0,184,148,.04); transform:translateY(-1px); }
.pd-btn-secondary.active { border-color:var(--red);color:var(--red);background:rgba(225,29,72,.04); }

/* Qty stepper */
.pd-qty-btn {
  width:36px;height:36px;border-radius:8px;
  border:1.5px solid var(--border);
  background:var(--card);
  color:var(--text-1);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;
  transition:border-color .15s,background .15s,transform .12s;
}
.pd-qty-btn:hover:not(:disabled) { border-color:var(--green);background:rgba(0,184,148,.06);transform:scale(1.08); }
.pd-qty-btn:disabled { opacity:.35;cursor:not-allowed; }

/* Colour swatch */
.pd-swatch {
  width:30px;height:30px;border-radius:50%;
  border:2.5px solid transparent;
  cursor:pointer;
  transition:transform .15s,box-shadow .15s,border-color .15s;
  position:relative;
}
.pd-swatch:hover    { transform:scale(1.15); }
.pd-swatch.selected { border-color:var(--text-1); box-shadow:0 0 0 2px var(--card), 0 0 0 4px var(--text-1); }

/* Review star */
.pd-star-btn { font-size:24px;cursor:pointer;transition:transform .1s; line-height:1; }
.pd-star-btn:hover { transform:scale(1.2); }

/* Trust pill */
.pd-trust { display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:var(--bg);font-size:13px;color:var(--text-2);font-weight:500; }

.pd-scrollbar::-webkit-scrollbar { width:4px; }
.pd-scrollbar::-webkit-scrollbar-thumb { background:var(--border);border-radius:4px; }
`;

/* ─── Stars component ──────────────────────────────────────────────────────── */
function Stars({ rating, size = 13 }) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5, empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5">
      {Array(full).fill(0).map((_, i)  => <FaStar        key={`f${i}`} size={size} style={{ color:'#f59e0b' }}/>)}
      {half && <FaStarHalfAlt size={size} style={{ color:'#f59e0b' }}/>}
      {Array(empty).fill(0).map((_, i) => <FaRegStar     key={`e${i}`} size={size} style={{ color:'#d1d5db' }}/>)}
    </span>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="pd-root min-h-screen pt-[112px]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="pd-shimmer rounded-2xl" style={{ aspectRatio:'1', height:'460px' }}/>
            <div className="flex gap-3 mt-4">
              {[1,2,3,4].map(i => <div key={i} className="pd-shimmer rounded-xl w-20 h-20"/>)}
            </div>
          </div>
          <div className="space-y-5 pt-4">
            <div className="pd-shimmer h-4 rounded-lg w-1/3"/>
            <div className="pd-shimmer h-8 rounded-xl w-5/6"/>
            <div className="pd-shimmer h-8 rounded-xl w-3/4"/>
            <div className="pd-shimmer h-12 rounded-2xl w-1/2"/>
            <div className="pd-shimmer h-36 rounded-2xl"/>
            <div className="pd-shimmer h-14 rounded-xl"/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Review card ──────────────────────────────────────────────────────────── */
function ReviewCard({ review, index }) {
  const initials = (review.userName || 'A').charAt(0).toUpperCase();
  const hue      = (review.userName?.charCodeAt(0) || 65) * 137 % 360;
  const date     = new Date(review.createdAt).toLocaleDateString('fr-TN', { day:'numeric', month:'short', year:'numeric' });

  return (
    <div className="pd-in" style={{ animationDelay:`${index * 60}ms` }}>
      <div className="flex gap-4 p-5 rounded-2xl" style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background:`hsl(${hue}deg,55%,52%)` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold text-sm" style={{ color:'var(--text-1)' }}>{review.userName}</p>
            <span className="text-xs" style={{ color:'var(--text-3)' }}>{date}</span>
          </div>
          <div className="mb-2"><Stars rating={review.rating} size={11}/></div>
          {review.comment && (
            <p className="text-sm leading-relaxed" style={{ color:'var(--text-2)' }}>{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [product,     setProduct]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeImg,   setActiveImg]   = useState(0);
  const [activeSwatch,setActiveSwatch]= useState(null);
  const [qty,         setQty]         = useState(1);
  const [isFav,       setIsFav]       = useState(false);
  const [favAnim,     setFavAnim]     = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Review form
  const [reviewRating,  setReviewRating]  = useState(0);
  const [hoverRating,   setHoverRating]   = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);
  const [reviews,       setReviews]       = useState([]);

  // Inject CSS
  useEffect(() => {
    if (!document.getElementById('pd-styles')) {
      const el = document.createElement('style'); el.id='pd-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
    window.scrollTo({ top:0, behavior:'instant' });
  }, []);

  // Fetch product
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data);
        // Hydrate reviews from embedded array if present
        if (res.data.reviews?.length) setReviews(res.data.reviews);
        // Pre-select first colour variant
        if (res.data.colorVariants?.length) setActiveSwatch(0);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Produit introuvable' : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Check wishlist
  useEffect(() => {
    const token = localStorage.getItem('token'); if (!token || !id) return;
    axios.get('/api/wishlist', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => setIsFav((r.data.products || []).some(p => String(p._id || p) === id)))
      .catch(() => {});
  }, [id]);

  // All images (main + variant images)
  const allImages = (() => {
    if (!product) return [];
    const main = product.image ? [product.image] : [];
    const variantImgs = activeSwatch !== null
      ? (product.colorVariants?.[activeSwatch]?.images || [])
      : [];
    const extras = product.images || [];
    const combined = [...new Set([...variantImgs, ...main, ...extras])];
    return combined.filter(Boolean);
  })();

  const currentImage = allImages[activeImg] || 'https://placehold.co/600x600?text=Produit';

  const hasDiscount     = product?.discount > 0;
  const discountedPrice = hasDiscount
    ? (product.discountedPrice ?? product.price * (1 - product.discount / 100))
    : null;

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    if (product.stock === 0) { toast.error('Ce produit est épuisé'); return; }
    setCartLoading(true);
    try {
      await axios.post('/api/cart/add', { productId: id, quantity: qty }, {
        headers: { Authorization:`Bearer ${token}` }
      });
      window.dispatchEvent(new Event('cartUpdate'));
      toast.success(`"${product.title?.substring(0,28)}…" ajouté au panier`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur ajout panier');
    } finally { setCartLoading(false); }
  };

  const handleToggleFav = async () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    setFavAnim(true); setTimeout(() => setFavAnim(false), 400);
    const newFav = !isFav;
    setIsFav(newFav);
    try {
      await axios.post(newFav ? '/api/wishlist/add' : '/api/wishlist/remove', { productId: id }, {
        headers: { Authorization:`Bearer ${token}` }
      });
      window.dispatchEvent(new Event('wishlistUpdate'));
      toast.success(newFav ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris');
    } catch {
      setIsFav(!newFav);
      toast.error('Erreur favoris');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) { toast.error('Choisissez une note'); return; }
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Veuillez vous connecter'); return; }
    setSubmittingRev(true);
    try {
      await axios.post(`/api/products/${id}/review`, {
        rating:  reviewRating,
        comment: reviewComment.trim(),
      }, { headers: { Authorization:`Bearer ${token}` } });
      toast.success('Avis publié !');
      setReviewRating(0); setReviewComment('');
      // Refresh product
      const res = await axios.get(`/api/products/${id}`);
      setProduct(res.data);
      if (res.data.reviews?.length) setReviews(res.data.reviews);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi avis');
    } finally { setSubmittingRev(false); }
  };

  if (loading) return <Skeleton/>;

  if (error) return (
    <div className="pd-root min-h-screen pt-[112px] flex items-center justify-center">
      <div className="text-center p-12 rounded-3xl" style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
        <p className="text-5xl mb-4">😕</p>
        <p className="font-semibold text-lg mb-1" style={{ color:'var(--text-1)' }}>{error}</p>
        <button onClick={() => navigate(-1)} className="mt-6 pd-btn-primary" style={{ display:'inline-flex', padding:'10px 24px' }}>
          <FiArrowLeft size={15}/> Retour
        </button>
      </div>
    </div>
  );

  if (!product) return null;

  const stock      = product.stock ?? 0;
  const stockLabel = stock === 0 ? 'Épuisé' : stock <= 5 ? `${stock} restants` : 'En stock';
  const stockColor = stock === 0 ? 'var(--red)' : stock <= 5 ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="pd-root min-h-screen pt-[112px]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">

        {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
        <nav className="pd-fade flex items-center gap-2 text-xs mb-8" style={{ color:'var(--text-3)' }}>
          <Link to="/" className="hover:text-green-500 transition-colors">Accueil</Link>
          <FiChevronRight size={11}/>
          {product.category && (
            <>
              <Link to={`/search?q=${product.category}`} className="hover:text-green-500 transition-colors">{product.category}</Link>
              <FiChevronRight size={11}/>
            </>
          )}
          <span className="truncate max-w-[200px]" style={{ color:'var(--text-2)' }}>{product.title}</span>
        </nav>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">

          {/* ── Left: Image gallery ─────────────────────────────────────────── */}
          <div className="pd-in">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl" style={{ background:'var(--card)', border:'1px solid var(--border)', aspectRatio:'1' }}>
              <img
                src={currentImage}
                alt={product.title}
                className="w-full h-full object-cover"
                style={{ transition:'opacity .2s ease' }}
                onError={e => { e.target.src='https://placehold.co/600x600?text=?'; }}
              />

              {/* Discount badge */}
              {hasDiscount && (
                <div className="absolute top-4 left-4 text-white text-sm font-black px-3 py-1.5 rounded-xl"
                  style={{ background:'var(--red)', boxShadow:'0 4px 12px rgba(225,29,72,.4)' }}>
                  -{product.discount}%
                </div>
              )}

              {/* Share */}
              <button onClick={handleShare}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background:'rgba(255,255,255,.9)', color:'var(--text-2)', backdropFilter:'blur(8px)' }}>
                <FiShare2 size={15}/>
              </button>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <div key={i} className={`pd-thumb flex-shrink-0 w-20 h-20 ${activeImg === i ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.src='https://placehold.co/80x80?text=?'; }}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ─────────────────────────────────────────── */}
          <div className="pd-in flex flex-col" style={{ animationDelay:'80ms' }}>

            {/* Title */}
            <h1 className="pd-display text-2xl md:text-3xl font-bold leading-snug mb-1" style={{ color:'var(--text-1)' }}>
              {product.title}
            </h1>

            {/* Rating row */}
            {product.ratingCount > 0 && (
              <div className="flex items-center gap-2 mt-2 mb-4">
                <Stars rating={product.averageRating} size={14}/>
                <span className="pd-mono text-sm" style={{ color:'var(--text-2)' }}>
                  {product.averageRating?.toFixed(1)}
                </span>
                <span className="text-sm" style={{ color:'var(--text-3)' }}>
                  ({product.ratingCount} avis)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-end gap-3 mt-2 mb-5">
              {hasDiscount ? (
                <>
                  <span className="pd-mono font-black text-4xl" style={{ color:'var(--red)', lineHeight:1 }}>
                    {discountedPrice?.toFixed(2)} <span className="text-xl font-semibold opacity-70">DT</span>
                  </span>
                  <span className="pd-mono text-lg line-through pb-0.5" style={{ color:'var(--text-3)' }}>
                    {product.price?.toFixed(2)} DT
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background:'rgba(225,29,72,.1)', color:'var(--red)' }}>
                    Vous économisez {(product.price - discountedPrice).toFixed(2)} DT
                  </span>
                </>
              ) : (
                <span className="pd-mono font-black text-4xl" style={{ color:'var(--green)', lineHeight:1 }}>
                  {product.price?.toFixed(2)} <span className="text-xl font-semibold opacity-70">DT</span>
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full" style={{ background:stockColor }}/>
              <span className="text-sm font-semibold" style={{ color:stockColor }}>{stockLabel}</span>
            </div>

            {/* Colour variants */}
            {product.colorVariants?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3" style={{ color:'var(--text-2)' }}>
                  Couleur — <span style={{ color:'var(--text-1)' }}>{product.colorVariants[activeSwatch ?? 0]?.name}</span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {product.colorVariants.map((v, i) => (
                    <button
                      key={i}
                      title={v.name}
                      className={`pd-swatch ${activeSwatch === i ? 'selected' : ''}`}
                      style={{ background: v.hex }}
                      onClick={() => { setActiveSwatch(i); setActiveImg(0); }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3" style={{ color:'var(--text-2)' }}>Quantité</p>
              <div className="flex items-center gap-3">
                <button className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q-1))} disabled={qty <= 1}>
                  <FiMinus size={14}/>
                </button>
                <span className="pd-mono font-bold text-lg w-10 text-center" style={{ color:'var(--text-1)' }}>{qty}</span>
                <button className="pd-qty-btn" onClick={() => setQty(q => Math.min(stock, q+1))} disabled={qty >= stock || stock === 0}>
                  <FiPlus size={14}/>
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-8">
              <button className="pd-btn-primary flex-1" onClick={handleAddToCart} disabled={stock === 0 || cartLoading}>
                {cartLoading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full pd-spin"/> Ajout…</>
                  : <><FiShoppingCart size={16}/> {stock === 0 ? 'Épuisé' : 'Ajouter au panier'}</>
                }
              </button>
              <button
                className={`pd-btn-secondary ${isFav ? 'active' : ''}`}
                style={{ minWidth:'52px', padding:'13px 16px' }}
                onClick={handleToggleFav}
              >
                <FiHeart size={17} style={{ ...(isFav ? { fill:'var(--red)', color:'var(--red)' } : {}), ...(favAnim ? { animation:'pd-pop .35s cubic-bezier(.22,1,.36,1)' } : {}) }}/>
              </button>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { icon:FiTruck,   label:'Livraison gratuite' },
                { icon:FiShield,  label:'Paiement à la livraison' },
                { icon:FiPackage, label:'Emballage soigné' },
                { icon:FiRefreshCw, label:'Retour 7 jours' },
              ].map((t, i) => (
                <div key={i} className="pd-trust">
                  <t.icon size={14} style={{ color:'var(--green)', flexShrink:0 }}/>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>

            {/* Seller link */}
            {product.seller && (
              <Link
                to={`/seller/${product.seller._id || product.seller}`}
                className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                style={{ background:'var(--bg)', border:'1px solid var(--border)' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background:`hsl(${((product.seller.name || 'V').charCodeAt(0) * 137) % 360}deg,55%,52%)` }}>
                  {(product.seller.name || 'V').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color:'var(--text-3)' }}>Vendu par</p>
                  <p className="text-sm font-semibold truncate" style={{ color:'var(--text-1)' }}>{product.seller.name}</p>
                </div>
                <FiChevronRight size={14} style={{ color:'var(--text-3)' }}/>
              </Link>
            )}
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────────────── */}
        {product.description && (
          <section className="mb-14">
            <h2 className="pd-display text-xl font-bold mb-5" style={{ color:'var(--text-1)' }}>Description</h2>
            <div className="prose-sm leading-relaxed max-w-3xl" style={{ color:'var(--text-2)', lineHeight:1.85 }}>
              {product.description.split('\n').map((line, i) => (
                <p key={i} className="mb-3">{line}</p>
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="pd-display text-xl font-bold" style={{ color:'var(--text-1)' }}>Avis clients</h2>
              {product.ratingCount > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Stars rating={product.averageRating} size={14}/>
                  <span className="pd-mono text-sm font-bold" style={{ color:'var(--text-1)' }}>{product.averageRating?.toFixed(1)}</span>
                  <span className="text-sm" style={{ color:'var(--text-3)' }}>sur 5 · {product.ratingCount} avis</span>
                </div>
              )}
            </div>
          </div>

          {/* Review form */}
          <div className="p-6 rounded-2xl mb-8" style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color:'var(--text-1)' }}>Laisser un avis</h3>

            {/* Star picker */}
            <div className="flex gap-2 mb-5">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  className="pd-star-btn"
                  style={{ color: star <= (hoverRating || reviewRating) ? '#f59e0b' : '#d1d5db' }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setReviewRating(star)}
                >
                  ★
                </button>
              ))}
              {reviewRating > 0 && (
                <span className="text-sm font-medium self-center ml-2" style={{ color:'var(--text-2)' }}>
                  {['','Mauvais','Passable','Bien','Très bien','Excellent'][reviewRating]}
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce produit…"
              className="w-full px-4 py-3 text-sm rounded-xl resize-none transition-all outline-none"
              style={{
                background:'var(--bg)', border:'1.5px solid var(--border)',
                color:'var(--text-1)', fontFamily:'DM Sans, sans-serif',
              }}
              onFocus={e => { e.target.style.borderColor='var(--green)'; }}
              onBlur={e  => { e.target.style.borderColor='var(--border)'; }}
            />

            <button onClick={handleSubmitReview} disabled={submittingRev || !reviewRating}
              className="mt-3 pd-btn-primary"
              style={{ width:'auto', padding:'10px 22px', fontSize:'14px', display:'inline-flex' }}>
              {submittingRev
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full pd-spin"/> Envoi…</>
                : <><FiCheck size={14}/> Publier</>
              }
            </button>
          </div>

          {/* Review list */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r, i) => <ReviewCard key={r._id || i} review={r} index={i}/>)}
            </div>
          ) : (
            <div className="text-center py-10 rounded-2xl" style={{ background:'var(--bg)', border:'1px solid var(--border)' }}>
              <p className="text-4xl mb-3">💬</p>
              <p className="font-medium text-sm" style={{ color:'var(--text-2)' }}>Aucun avis pour l'instant</p>
              <p className="text-xs mt-1" style={{ color:'var(--text-3)' }}>Soyez le premier à laisser un avis</p>
            </div>
          )}
        </section>
      </div>

      <Footer/>
    </div>
  );
}