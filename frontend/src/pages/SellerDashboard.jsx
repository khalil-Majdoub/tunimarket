// frontend/src/pages/SellerDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  FiPlus, FiX, FiCheck, FiChevronLeft, FiChevronRight,
  FiTrash2, FiEdit2, FiUpload, FiImage, FiDroplet,
  FiPackage, FiDollarSign, FiHeart, FiStar, FiTrendingUp,
  FiBarChart2, FiDownload, FiShoppingBag, FiAlertCircle,
  FiPercent, FiEye, FiTag,
} from 'react-icons/fi';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.sd-root    { font-family:'DM Sans',sans-serif; }
.sd-display { font-family:'Sora',sans-serif; }
.sd-mono    { font-family:'DM Mono',monospace; }

@keyframes sd-fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes sd-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes sd-scaleIn { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
@keyframes sd-slideIn { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
@keyframes sd-spin    { to{transform:rotate(360deg)} }
@keyframes sd-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

.sd-fadeUp  { animation:sd-fadeUp  .52s cubic-bezier(.22,1,.36,1) both }
.sd-fadeIn  { animation:sd-fadeIn  .35s ease both }
.sd-scaleIn { animation:sd-scaleIn .32s cubic-bezier(.22,1,.36,1) both }
.sd-slideIn { animation:sd-slideIn .28s ease both }
.sd-spin    { animation:sd-spin .8s linear infinite }

.sd-shimmer {
  background:linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%);
  background-size:600px 100%;
  animation:sd-shimmer 1.4s infinite linear;
}
.dark .sd-shimmer {
  background:linear-gradient(90deg,#1f2937 25%,#2d3748 50%,#1f2937 75%);
  background-size:600px 100%;
}

.sd-card { transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease; }
.sd-card:hover { transform:translateY(-4px);box-shadow:0 18px 40px rgba(0,0,0,.1); }
.dark .sd-card:hover { box-shadow:0 18px 40px rgba(0,0,0,.4); }

.sd-btn { transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .16s ease,background .16s ease; }
.sd-btn:hover:not(:disabled) { transform:translateY(-2px); }
.sd-btn:active:not(:disabled){ transform:scale(.97); }
.sd-btn:disabled { opacity:.5;cursor:not-allowed; }

.sd-input:focus {
  outline:none;
  box-shadow:0 0 0 3px rgba(0,184,148,.2);
  border-color:#00b894;
  background:white;
}
.dark .sd-input:focus { background:#111827; }
.sd-input.error { border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.15); }

.sd-overlay { animation:sd-fadeIn .22s ease both; }
.sd-modal   { animation:sd-scaleIn .32s cubic-bezier(.22,1,.36,1) both; }

.sd-upload-zone {
  border:2px dashed #d1d5db;border-radius:14px;
  transition:border-color .2s ease,background .2s ease;cursor:pointer;
}
.dark .sd-upload-zone { border-color:#374151; }
.sd-upload-zone:hover,.sd-upload-zone.drag {
  border-color:#00b894;background:rgba(0,184,148,.04);
}
.sd-upload-zone input[type=file] { display:none; }

.sd-swatch { transition:transform .15s ease,box-shadow .15s ease;cursor:pointer; }
.sd-swatch:hover  { transform:scale(1.15); }
.sd-swatch.active { transform:scale(1.22); }

/* Discount badge */
.sd-discount-badge {
  background:linear-gradient(135deg,#ef4444,#dc2626);
  box-shadow:0 3px 10px rgba(239,68,68,.4);
}
`;

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target, duration = 1300, decimals = 0) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const n = parseFloat(target) || 0;
    if (!n) { setVal(0); return; }
    let start = null;
    const tick = ts => {
      if (!start) start = ts;
      const p    = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((ease * n).toFixed(decimals)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);
  return val;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0, isRevenue, isStar }) {
  const n       = parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;
  const counted = useCounter(n, 1400, isStar ? 1 : 0);
  const display = isRevenue
    ? `${counted.toLocaleString('fr-TN')} DT`
    : isStar
    ? `${counted.toFixed(1)} ★`
    : counted.toLocaleString('fr-TN');

  return (
    <div className="sd-card sd-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-[.06]" style={{ background: color }}/>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}1a` }}>
          <Icon style={{ color }} size={18}/>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</span>
      </div>
      <p className="sd-mono text-3xl font-bold mb-0.5" style={{ color }}>{display}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
    </div>
  );
}

// ─── Image upload zone ────────────────────────────────────────────────────────
function ImageUploadZone({ files, onFilesChange, maxFiles = 6 }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = newFiles => {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    onFilesChange([...files, ...valid].slice(0, maxFiles));
  };

  return (
    <div className="space-y-3">
      <div
        className={`sd-upload-zone ${drag ? 'drag' : ''} p-5 text-center`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)}/>
        <div className="flex flex-col items-center gap-2 py-1">
          <div className="w-11 h-11 bg-[#00b894]/10 rounded-xl flex items-center justify-center">
            <FiUpload size={20} className="text-[#00b894]"/>
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Glissez des photos ou <span className="text-[#00b894] underline">parcourir</span>
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP — max {maxFiles} fichier{maxFiles > 1 ? 's' : ''}</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl ring-2 ring-gray-200 dark:ring-gray-700"/>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
              >
                <FiX size={10}/>
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-[#00b894] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Colour presets ───────────────────────────────────────────────────────────
const COLOUR_PRESETS = [
  { name: 'Noir',   hex: '#1a1a1a' }, { name: 'Blanc',  hex: '#f5f5f0' },
  { name: 'Rouge',  hex: '#e63946' }, { name: 'Bleu',   hex: '#457b9d' },
  { name: 'Vert',   hex: '#2d6a4f' }, { name: 'Jaune',  hex: '#f4d35e' },
  { name: 'Orange', hex: '#f77f00' }, { name: 'Rose',   hex: '#e91e8c' },
  { name: 'Violet', hex: '#7b2d8b' }, { name: 'Gris',   hex: '#9e9e9e' },
  { name: 'Marron', hex: '#795548' }, { name: 'Beige',  hex: '#d4a574' },
];

const CATEGORIES = [
  'Électronique', 'Vêtements', 'Maison & Jardin', 'Sport',
  'Beauté', 'Alimentation', 'Jouets', 'Livres', 'Autre',
];

// ─── Discount preview ─────────────────────────────────────────────────────────
function DiscountPreview({ price, discount }) {
  const pct = Math.min(99, Math.max(0, parseFloat(discount) || 0));
  if (!pct || !price) return null;
  const discounted = (parseFloat(price) * (1 - pct / 100)).toFixed(2);
  return (
    <div className="flex items-center gap-3 mt-2.5 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl ring-1 ring-red-100 dark:ring-red-800/30">
      <span className="sd-discount-badge text-white text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0">
        -{pct}%
      </span>
      <div className="flex items-center gap-2">
        <span className="line-through text-sm text-gray-400">{parseFloat(price).toFixed(2)} DT</span>
        <span className="font-black text-red-500 text-lg">{discounted} DT</span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
        Économie : {(parseFloat(price) - parseFloat(discounted)).toFixed(2)} DT
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD PRODUCT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddProductModal({ onClose, onSuccess }) {
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '', category: '', discount: 0,
  });

  // Images (no colour variants)
  const [mainFiles,  setMainFiles]  = useState([]);

  // Colour variants
  const [variants,   setVariants]   = useState([]);  // [{hex, name, files:[File]}]
  const [curColour,  setCurColour]  = useState({ hex: '#1a1a1a', name: 'Noir', files: [] });
  const [customHex,  setCustomHex]  = useState('');

  const STEPS = ['Informations', 'Photos & Couleurs', 'Aperçu'];

  const setField = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate1 = () => {
    const e = {};
    if (!form.title.trim()) e.title    = 'Titre requis';
    if (!form.price)        e.price    = 'Prix requis';
    if (form.stock === '')  e.stock    = 'Stock requis';
    if (!form.category)     e.category = 'Catégorie requise';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const applyCustomHex = () => {
    const full = customHex.startsWith('#') ? customHex : `#${customHex}`;
    if (/^#[0-9a-fA-F]{6}$/.test(full)) {
      setCurColour(p => ({ ...p, hex: full, name: 'Personnalisé' }));
    } else {
      toast.error('Format invalide — entrez 6 caractères hex, ex: FF5733');
    }
  };

  const addVariant = () => {
    if (!curColour.files.length) { toast.error('Ajoutez au moins une photo pour cette couleur'); return; }
    setVariants(prev => {
      const idx   = prev.findIndex(v => v.hex === curColour.hex);
      const entry = { hex: curColour.hex, name: curColour.name, files: curColour.files };
      if (idx >= 0) return prev.map((v, i) => (i === idx ? entry : v));
      return [...prev, entry];
    });
    toast.success(`Variante "${curColour.name}" ajoutée`);
    setCurColour({ hex: '#1a1a1a', name: 'Noir', files: [] });
  };

  const previewUrl = f => (f instanceof File ? URL.createObjectURL(f) : null);

  const submit = async () => {
    const hasImages = variants.length > 0
      ? variants.some(v => v.files.length > 0)
      : mainFiles.length > 0;

    if (!hasImages) { toast.error('Ajoutez au moins une photo'); return; }

    const token = localStorage.getItem('token');
    if (!token) { toast.error('Session expirée'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('price',       form.price);
      fd.append('stock',       form.stock);
      fd.append('category',    form.category);
      fd.append('discount',    form.discount);

      if (variants.length > 0) {
        const meta = variants.map((v, vi) => {
          v.files.forEach((f, fi) => fd.append(`variant_${vi}_${fi}`, f));
          return { hex: v.hex, name: v.name, count: v.files.length };
        });
        fd.append('variantMeta', JSON.stringify(meta));
      } else {
        mainFiles.forEach((f, i) => fd.append(`image_${i}`, f));
        fd.append('imageCount', mainFiles.length);
      }

      await axios.post('/api/seller/products', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Produit publié avec succès !');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sd-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="sd-modal bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouveau produit</h2>
            <p className="text-xs text-gray-400 mt-0.5">Étape {step}/{STEPS.length} — {STEPS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="sd-btn w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <FiX size={20}/>
          </button>
        </div>

        {/* Progress */}
        <div className="px-7 pt-4 pb-2 flex gap-2 flex-shrink-0">
          {STEPS.map((l, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${step > i ? 'bg-[#00b894]' : 'bg-gray-100 dark:bg-gray-800'}`}/>
              <p className={`text-[10px] mt-1 font-semibold ${step === i + 1 ? 'text-[#00b894]' : 'text-gray-400'}`}>{l}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">

          {/* ── STEP 1: Informations ── */}
          {step === 1 && (
            <div className="sd-slideIn space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Titre du produit <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="Ex: Sneakers Air Jordan…"
                  className={`sd-input w-full px-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.title ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Décrivez votre produit en détail…"
                  className="sd-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none transition"
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Prix (DT) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">DT</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.price}
                      onChange={e => setField('price', e.target.value)}
                      placeholder="0.00"
                      className={`sd-input w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.price ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={form.stock}
                    onChange={e => setField('stock', e.target.value)}
                    placeholder="Quantité disponible"
                    className={`sd-input w-full px-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.stock ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                  {errors.stock && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.stock}</p>}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => setField('category', e.target.value)}
                  className={`sd-input w-full px-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.category ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <option value="">Sélectionner une catégorie…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.category}</p>}
              </div>

              {/* ── DISCOUNT SECTION ── */}
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 ring-1 ring-orange-100 dark:ring-orange-800/30">
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-2">
                  <FiPercent size={14} className="text-red-500"/>
                  Remise promotionnelle
                  <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Définissez un pourcentage de réduction. Le prix barré et le prix remisé s'afficheront automatiquement sur la boutique.
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number" min="0" max="99" step="1"
                      value={form.discount}
                      onChange={e => setField('discount', Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                      placeholder="0"
                      className="sd-input w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition font-bold text-lg"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">%</span>
                  </div>
                  {/* Quick presets */}
                  <div className="flex gap-2">
                    {[10, 20, 30, 50].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setField('discount', pct)}
                        className={`sd-btn px-3 py-2 rounded-xl text-xs font-bold transition border ${
                          form.discount === pct
                            ? 'bg-red-500 text-white border-red-500 shadow-md'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-400 hover:text-red-500'
                        }`}
                      >
                        -{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live discount preview */}
                <DiscountPreview price={form.price} discount={form.discount}/>

                {form.discount === 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Entrez un pourcentage ou cliquez sur un preset ci-dessus pour activer la remise.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Photos & Colours ── */}
          {step === 2 && (
            <div className="sd-slideIn space-y-6">

              {/* Existing variants */}
              {variants.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Variantes ajoutées ({variants.length})
                  </p>
                  <div className="space-y-2">
                    {variants.map(v => (
                      <div key={v.hex} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 border-2 border-white shadow-sm" style={{ background: v.hex }}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{v.name}</p>
                          <p className="text-xs text-gray-400">{v.files.length} photo{v.files.length > 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {v.files.slice(0, 3).map((f, i) => (
                            <img key={i} src={previewUrl(f)} className="w-9 h-9 rounded-lg object-cover bg-gray-200" alt=""/>
                          ))}
                        </div>
                        <button onClick={() => setVariants(p => p.filter(x => x.hex !== v.hex))}
                          className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <FiTrash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colour picker */}
              <div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <FiDroplet size={13} className="text-[#00b894]"/>
                  Couleur du produit
                  <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COLOUR_PRESETS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => setCurColour(p => ({ ...p, hex: c.hex, name: c.name }))}
                      className={`sd-swatch w-8 h-8 rounded-full border-2 ${curColour.hex === c.hex ? 'active' : 'border-transparent'}`}
                      style={{
                        background: c.hex,
                        boxShadow:  curColour.hex === c.hex ? `0 0 0 3px ${c.hex}55` : 'none',
                        borderColor: curColour.hex === c.hex ? 'white' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                {/* Custom hex */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
                    <input
                      value={customHex.replace('#', '')}
                      onChange={e => setCustomHex(e.target.value)}
                      maxLength={6}
                      placeholder="ex: FF5733"
                      className="sd-input w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition"
                    />
                  </div>
                  <button type="button" onClick={applyCustomHex}
                    className="sd-btn px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    Appliquer
                  </button>
                  <div className="w-11 h-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-inner" style={{ background: curColour.hex }}/>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Couleur sélectionnée : <span className="font-bold text-gray-700 dark:text-gray-300">{curColour.name}</span>
                  <span className="font-mono ml-1 text-gray-400">{curColour.hex}</span>
                </p>
              </div>

              {/* Upload for current colour */}
              <div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <FiImage size={13} className="text-[#00b894]"/>
                  {variants.length > 0
                    ? <>Photos pour la couleur <span className="font-black" style={{ color: curColour.hex }}>{curColour.name}</span></>
                    : 'Photos du produit'}
                </p>
                <ImageUploadZone
                  files={curColour.files}
                  onFilesChange={f => setCurColour(p => ({ ...p, files: f }))}
                  maxFiles={6}
                />
              </div>

              {/* Add variant button */}
              {curColour.files.length > 0 && (
                <button type="button" onClick={addVariant}
                  className="sd-btn w-full py-3 rounded-xl border-2 border-dashed border-[#00b894] text-[#00b894] font-semibold text-sm hover:bg-[#00b894]/5 transition flex items-center justify-center gap-2">
                  <FiPlus size={15}/> Enregistrer cette variante de couleur
                </button>
              )}

              {/* Plain images (no colour variants) */}
              {variants.length === 0 && curColour.files.length === 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FiImage size={13} className="text-[#00b894]"/>
                    Photos principales
                    <span className="text-xs font-normal text-gray-400">(sans variante de couleur)</span>
                  </p>
                  <ImageUploadZone files={mainFiles} onFilesChange={setMainFiles} maxFiles={8}/>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Preview ── */}
          {step === 3 && (
            <div className="sd-slideIn space-y-5">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Aperçu avant publication</p>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600">
                    {(() => {
                      const firstFile = variants[0]?.files[0] || mainFiles[0];
                      return firstFile
                        ? <img src={previewUrl(firstFile)} className="w-full h-full object-cover" alt=""/>
                        : <FiImage size={24} className="text-gray-400"/>;
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 mb-2">{form.title || '—'}</p>

                    {/* Price display with discount */}
                    {form.discount > 0 && form.price ? (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="sd-discount-badge text-white text-xs font-black px-2.5 py-1 rounded-lg">
                          -{form.discount}%
                        </span>
                        <span className="line-through text-gray-400 text-sm">{parseFloat(form.price).toFixed(2)} DT</span>
                        <span className="font-black text-red-500 text-xl">
                          {(parseFloat(form.price) * (1 - form.discount / 100)).toFixed(2)} DT
                        </span>
                      </div>
                    ) : (
                      <p className="sd-mono font-black text-[#00b894] text-xl mb-2">
                        {form.price ? `${parseFloat(form.price).toFixed(2)} DT` : '—'}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-lg font-semibold">{form.category || '—'}</span>
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg font-semibold">Stock: {form.stock || '—'}</span>
                    </div>
                  </div>
                </div>

                {form.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Variant preview */}
              {variants.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    {variants.length} variante{variants.length > 1 ? 's' : ''} de couleur
                  </p>
                  <div className="space-y-3">
                    {variants.map(v => (
                      <div key={v.hex} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 mt-0.5" style={{ background: v.hex }}/>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {v.name} <span className="sd-mono text-xs text-gray-400">{v.hex}</span>
                          </p>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {v.files.map((f, i) => (
                              <img key={i} src={previewUrl(f)} className="w-12 h-12 rounded-lg object-cover bg-gray-200" alt=""/>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {variants.length === 0 && mainFiles.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">{mainFiles.length} photo{mainFiles.length > 1 ? 's' : ''}</p>
                  <div className="flex gap-2 flex-wrap">
                    {mainFiles.map((f, i) => (
                      <img key={i} src={previewUrl(f)} className="w-16 h-16 rounded-xl object-cover bg-gray-100 ring-2 ring-gray-200 dark:ring-gray-700" alt=""/>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 flex-shrink-0">
          {step > 1
            ? <button type="button" onClick={() => setStep(s => s - 1)}
                className="sd-btn flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <FiChevronLeft size={15}/> Retour
              </button>
            : <button type="button" onClick={onClose}
                className="sd-btn px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Annuler
              </button>
          }

          {step < 3
            ? <button type="button"
                onClick={() => { if (step === 1 && !validate1()) return; setStep(s => s + 1); }}
                className="sd-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-bold text-sm transition shadow-lg shadow-[#00b894]/20">
                Suivant <FiChevronRight size={15}/>
              </button>
            : <button type="button" onClick={submit} disabled={saving}
                className="sd-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-bold text-sm transition shadow-lg shadow-[#00b894]/20 disabled:opacity-60">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full sd-spin"/> Upload en cours…</>
                  : <><FiCheck size={15}/> Publier le produit</>
                }
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT PRODUCT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [newImageFiles, setNewImageFiles] = useState([]);

  const [form, setForm] = useState({
    title:       product.title       || '',
    description: product.description || '',
    price:       product.price       || '',
    stock:       product.stock       ?? '',
    category:    product.category    || '',
    discount:    product.discount    || 0,
  });

  const setField = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title    = 'Titre requis';
    if (!form.price)        e.price    = 'Prix requis';
    if (form.stock === '')  e.stock    = 'Stock requis';
    if (!form.category)     e.category = 'Catégorie requise';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Veuillez corriger les erreurs'); return; }
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Session expirée'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('price',       form.price);
      fd.append('stock',       form.stock);
      fd.append('category',    form.category);
      fd.append('discount',    form.discount);

      if (newImageFiles.length > 0) {
        fd.append('image_0', newImageFiles[0]);
      }

      await axios.put(`/api/seller/products/${product._id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Produit mis à jour avec succès !');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sd-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="sd-modal bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiEdit2 size={17} className="text-[#00b894]"/> Modifier le produit
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.title}</p>
          </div>
          <button onClick={onClose} className="sd-btn w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <FiX size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              className={`sd-input w-full px-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.title ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              className="sd-input w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none transition"
            />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Prix (DT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">DT</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={e => setField('price', e.target.value)}
                  className={`sd-input w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.price ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
              </div>
              {errors.price && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="0"
                value={form.stock}
                onChange={e => setField('stock', e.target.value)}
                className={`sd-input w-full px-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.stock ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.stock}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => setField('category', e.target.value)}
              className={`sd-input w-full px-4 py-3 rounded-xl border text-sm transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${errors.category ? 'error border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <option value="">Sélectionner…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.category}</p>}
          </div>

          {/* ── DISCOUNT SECTION (same as Add modal) ── */}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 ring-1 ring-orange-100 dark:ring-orange-800/30">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center gap-2">
              <FiPercent size={14} className="text-red-500"/>
              Remise promotionnelle
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Mettez 0 pour désactiver. Le prix barré et le badge s'afficheront automatiquement.
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number" min="0" max="99" step="1"
                  value={form.discount}
                  onChange={e => setField('discount', Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="sd-input w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition font-bold text-lg"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">%</span>
              </div>
              <div className="flex gap-2">
                {[0, 10, 20, 30, 50].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setField('discount', pct)}
                    className={`sd-btn px-3 py-2 rounded-xl text-xs font-bold transition border ${
                      form.discount === pct
                        ? pct === 0 ? 'bg-gray-500 text-white border-gray-500' : 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-red-400 hover:text-red-500'
                    }`}
                  >
                    {pct === 0 ? 'Aucune' : `-${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <DiscountPreview price={form.price} discount={form.discount}/>

            {form.discount === 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                <FiCheck size={11}/> Aucune remise — le produit s'affichera au prix normal
              </p>
            )}
          </div>

          {/* New image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <FiImage size={13} className="text-[#00b894]"/>
              Remplacer la photo principale
              <span className="text-xs font-normal text-gray-400">(optionnel)</span>
            </label>
            {/* Current image */}
            {product.image && newImageFiles.length === 0 && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <img src={product.image} alt="" className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                  onError={e => { e.target.src = 'https://placehold.co/64x64?text=?'; }}/>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Photo actuelle</p>
                  <p className="text-xs text-gray-400">Uploadez une nouvelle photo pour la remplacer</p>
                </div>
              </div>
            )}
            <ImageUploadZone files={newImageFiles} onFilesChange={setNewImageFiles} maxFiles={1}/>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="sd-btn px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Annuler
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="sd-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-bold text-sm transition shadow-lg shadow-[#00b894]/20 disabled:opacity-60">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full sd-spin"/> Enregistrement…</>
              : <><FiCheck size={15}/> Enregistrer les modifications</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="sd-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="sd-modal bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiTrash2 size={22} className="text-red-500"/>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Supprimer le produit ?</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 line-clamp-1 font-medium">"{product.title}"</p>
        <p className="text-gray-400 text-xs mb-6">Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="sd-btn flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="sd-btn flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full sd-spin"/> : <FiTrash2 size={14}/>}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────
function downloadReport(products, stats) {
  const rows = [
    ['=== RAPPORT VENDEUR TuniMarket ===', '', '', '', '', ''],
    ['Date', new Date().toLocaleDateString('fr-TN'), '', '', '', ''],
    ['', '', '', '', '', ''],
    ['--- STATISTIQUES ---', '', '', '', '', ''],
    ['Revenus totaux (DT)', stats.totalRevenue || 0, '', '', '', ''],
    ['Total commandes',     stats.totalOrders  || 0, '', '', '', ''],
    ['Favoris reçus',       stats.wishlistCount|| 0, '', '', '', ''],
    ['', '', '', '', '', ''],
    ['--- PRODUITS ---', '', '', '', '', ''],
    ['Titre', 'Prix original (DT)', 'Remise (%)', 'Prix remisé (DT)', 'Stock', 'Catégorie'],
    ...products.map(p => [
      p.title,
      p.price,
      p.discount || 0,
      p.discount ? (p.price * (1 - p.discount / 100)).toFixed(2) : p.price,
      p.stock,
      p.category || '—',
    ]),
  ];

  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `rapport_tunimarket_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Rapport CSV téléchargé !');
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const [products,     setProducts]     = useState([]);
  const [stats,        setStats]        = useState({ overallRating: 0, wishlistCount: 0, totalRevenue: 0, totalOrders: 0, dailyOrders: [], weeklyOrders: [] });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editProduct,  setEditProduct]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    if (!document.getElementById('sd-styles')) {
      const el = document.createElement('style'); el.id = 'sd-styles'; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Session expirée'); setLoading(false); return; }

    try {
      setLoading(true); setError(null);
      const cfg = { headers: { Authorization: `Bearer ${token}` } };

      const [pRes, sRes] = await Promise.allSettled([
        axios.get('/api/seller/products', cfg),
        axios.get('/api/seller/stats',    cfg),
      ]);

      if (pRes.status === 'fulfilled') setProducts(pRes.value.data || []);
      else { toast.error('Erreur chargement produits'); setProducts([]); }

      if (sRes.status === 'fulfilled') setStats(p => ({ ...p, ...sRes.value.data }));
      else toast('Statistiques indisponibles', { icon: '⚠️' });

    } catch { setError('Erreur de chargement du tableau de bord'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem('token');
    setDeleting(true);
    try {
      await axios.delete(`/api/seller/products/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Produit supprimé');
      setDeleteTarget(null);
      fetchAll();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setDeleting(false); }
  };

  // ── Chart config ────────────────────────────────────────────────────────────
  const last7    = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  });
  const last4    = ['Sem. −3', 'Sem. −2', 'Sem. −1', 'Cette sem.'];
  const hasDaily = stats.dailyOrders?.length > 0;
  const hasWeekly= stats.weeklyOrders?.length > 0;

  const tooltipStyle = {
    backgroundColor: 'rgba(17,24,39,.95)',
    titleColor:      '#f9fafb',
    bodyColor:       '#d1d5db',
    padding:         12,
    cornerRadius:    10,
    borderColor:     'rgba(255,255,255,.08)',
    borderWidth:     1,
  };

  const lineData = {
    labels: hasDaily ? stats.dailyOrders.map(o => o._id || 'N/A') : last7,
    datasets: [
      {
        label:                'Commandes',
        data:                 hasDaily ? stats.dailyOrders.map(o => o.count || 0) : Array(7).fill(0),
        borderColor:          '#00b894',
        backgroundColor:      'rgba(0,184,148,.1)',
        pointBackgroundColor: '#00b894',
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
        pointRadius:          5,
        pointHoverRadius:     8,
        tension:              0.45,
        fill:                 true,
        yAxisID:              'y',
      },
      {
        label:                'Revenu (DT)',
        data:                 hasDaily ? stats.dailyOrders.map(o => o.revenue || 0) : Array(7).fill(0),
        borderColor:          '#6366f1',
        backgroundColor:      'rgba(99,102,241,.08)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
        pointRadius:          5,
        tension:              0.45,
        fill:                 true,
        yAxisID:              'y1',
      },
    ],
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation:   { duration: 1000, easing: 'easeInOutQuart' },
    plugins: {
      legend:  { position: 'top', labels: { color: '#6b7280', font: { size: 12, weight: '600' }, usePointStyle: true, padding: 20 } },
      tooltip: tooltipStyle,
    },
    scales: {
      x:  { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
      y:  { beginAtZero: true, grid: { color: 'rgba(156,163,175,.1)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
      y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
    },
  };

  const bv = hasWeekly ? stats.weeklyOrders.map(o => o.revenue || 0) : [0, 0, 0, 0];
  const barData = {
    labels: hasWeekly ? stats.weeklyOrders.map(o => `Sem. ${o._id}`) : last4,
    datasets: [{
      label:           'Revenu (DT)',
      data:            bv,
      backgroundColor: bv.map((_, i, a) => i === a.length - 1 ? 'rgba(0,184,148,.9)' : 'rgba(0,184,148,.3)'),
      borderColor:     bv.map((_, i, a) => i === a.length - 1 ? '#00b894' : 'rgba(0,184,148,.5)'),
      borderWidth:     2,
      borderRadius:    10,
      borderSkipped:   false,
    }],
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    animation:  { duration: 1000, easing: 'easeInOutQuart' },
    plugins: {
      legend:  { display: false },
      tooltip: { ...tooltipStyle, callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString('fr-TN')} DT` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 12, weight: '600' } }, border: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(156,163,175,.1)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
    },
  };

  // ── KPIs derived from products ─────────────────────────────────────────────
  const avgPrice    = products.length ? (products.reduce((s, p) => s + p.price, 0) / products.length).toFixed(0) : 0;
  const totalStock  = products.reduce((s, p) => s + (p.stock || 0), 0);
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const onSale      = products.filter(p => p.discount > 0).length;
  const inStock     = products.filter(p => p.stock > 0).length;

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="sd-root min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-4">
      <div className="w-14 h-14 rounded-full border-4 border-[#00b894]/20 border-t-[#00b894] sd-spin"/>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Chargement du tableau de bord…</p>
    </div>
  );

  if (error) return (
    <div className="sd-root min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="sd-scaleIn text-center p-10 bg-white dark:bg-gray-900 rounded-3xl shadow-xl max-w-md w-full">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle size={24} className="text-red-500"/>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erreur de chargement</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={fetchAll}
          className="sd-btn px-8 py-3 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-bold text-sm transition shadow-lg shadow-[#00b894]/20">
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="sd-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[112px]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#00b894 0%,#00997f 50%,#007a66 100%)' }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,255,255,.12),transparent 70%)' }}/>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full border border-white/10"/>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-28">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="sd-fadeUp">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20">
                <span className="w-2 h-2 bg-green-300 rounded-full inline-block" style={{ boxShadow: '0 0 6px #86efac' }}/>
                Tableau de bord vendeur
              </div>
              <h1 className="sd-display text-4xl md:text-5xl font-black text-white tracking-tight">Bienvenue 👋</h1>
              <p className="text-white/70 mt-2 text-sm">
                {products.length} produit{products.length !== 1 ? 's' : ''} en ligne
                {onSale > 0 && ` · ${onSale} en promotion`}
              </p>
            </div>

            <div className="sd-fadeUp flex gap-4" style={{ animationDelay: '80ms' }}>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-center">
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">Revenus totaux</p>
                <p className="sd-mono text-3xl font-black text-white">{(stats.totalRevenue || 0).toLocaleString('fr-TN')}<span className="text-base font-semibold opacity-70 ml-1">DT</span></p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-center">
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">Commandes</p>
                <p className="sd-mono text-3xl font-black text-white">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-16 pb-16 relative">

        {/* ── Stat cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={FiStar}        label="Note globale"   value={stats.overallRating || 0} sub="Moyenne des avis"     color="#f59e0b" delay={0}   isStar/>
          <StatCard icon={FiHeart}       label="Favoris"        value={stats.wishlistCount || 0} sub="Ajouts aux favoris"   color="#ef4444" delay={80}/>
          <StatCard icon={FiShoppingBag} label="Commandes"      value={stats.totalOrders   || 0} sub="Total des commandes"  color="#6366f1" delay={160}/>
          <StatCard icon={FiDollarSign}  label="Revenus (DT)"   value={stats.totalRevenue  || 0} sub="Chiffre d'affaires"   color="#00b894" delay={240} isRevenue/>
        </div>

        {/* ── Charts ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="sd-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800" style={{ animationDelay: '280ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Activité quotidienne</h3>
                <p className="text-xs text-gray-400 mt-0.5">7 derniers jours</p>
              </div>
              <div className="w-9 h-9 bg-[#00b894]/10 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="text-[#00b894]" size={15}/>
              </div>
            </div>
            {!hasDaily && <p className="text-xs text-center text-gray-400 italic mb-2">Aucune commande récente</p>}
            <div className="h-60"><Line data={lineData} options={lineOpts}/></div>
          </div>

          <div className="sd-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800" style={{ animationDelay: '360ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Revenus hebdomadaires</h3>
                <p className="text-xs text-gray-400 mt-0.5">4 dernières semaines</p>
              </div>
              <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                <FiBarChart2 className="text-indigo-500" size={15}/>
              </div>
            </div>
            {!hasWeekly && <p className="text-xs text-center text-gray-400 italic mb-2">Aucune donnée disponible</p>}
            <div className="h-60"><Bar data={barData} options={barOpts}/></div>
          </div>
        </div>

        {/* ── Mini KPIs ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Prix moyen',     val: `${avgPrice} DT`,  icon: FiTag,         color: '#00b894' },
            { label: 'Stock total',    val: totalStock,         icon: FiPackage,     color: '#6366f1' },
            { label: 'Stock faible',   val: lowStock,           icon: FiAlertCircle, color: '#f59e0b' },
            { label: 'En promotion',   val: onSale,             icon: FiPercent,     color: '#ef4444' },
            { label: 'En stock',       val: inStock,            icon: FiEye,         color: '#10b981' },
          ].map((k, i) => (
            <div key={i} className="sd-fadeUp bg-white dark:bg-gray-900 rounded-xl p-4 shadow ring-1 ring-gray-100 dark:ring-gray-800 flex items-center gap-3"
              style={{ animationDelay: `${440 + i * 50}ms` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${k.color}18` }}>
                <k.icon size={14} style={{ color: k.color }}/>
              </div>
              <div>
                <p className="sd-mono font-bold text-gray-900 dark:text-white text-sm">{k.val}</p>
                <p className="text-xs text-gray-400">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Products table ─────────────────────────────────────────────────── */}
        <div className="sd-fadeUp bg-white dark:bg-gray-900 rounded-2xl shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 mb-6" style={{ animationDelay: '680ms' }}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Vos produits</h3>
              <p className="text-xs text-gray-400 mt-0.5">{products.length} produit{products.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="sd-btn flex items-center gap-2 bg-[#00b894] hover:bg-[#00997f] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-[#00b894]/20">
              <FiPlus size={14}/> Ajouter un produit
            </button>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <FiPackage size={24} className="text-gray-400"/>
              </div>
              <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm mb-1">Aucun produit pour l'instant</p>
              <p className="text-xs text-gray-400 mb-5">Ajoutez votre premier produit pour commencer à vendre</p>
              <button onClick={() => setShowAdd(true)}
                className="sd-btn flex items-center gap-2 bg-[#00b894] hover:bg-[#00997f] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                <FiPlus size={14}/> Ajouter un produit
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Produit', 'Prix', 'Remise', 'Stock', 'Catégorie', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition group">
                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || '/placeholder.jpg'}
                            alt={p.title}
                            className="w-11 h-11 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700"
                            onError={e => { e.target.src = 'https://placehold.co/44x44?text=?'; }}
                          />
                          <span className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-[180px]">{p.title}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        {p.discount > 0 ? (
                          <div>
                            <p className="line-through text-xs text-gray-400 sd-mono">{p.price} DT</p>
                            <p className="font-black text-red-500 sd-mono text-sm">{(p.price * (1 - p.discount / 100)).toFixed(2)} DT</p>
                          </div>
                        ) : (
                          <span className="sd-mono font-bold text-[#00b894] text-sm">{p.price} DT</span>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="px-6 py-4">
                        {p.discount > 0 ? (
                          <span className="inline-flex items-center gap-1 sd-discount-badge text-white text-xs font-black px-2.5 py-1 rounded-xl">
                            <FiPercent size={9}/>{p.discount}%
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          p.stock === 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : p.stock <= 5
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        }`}>
                          {p.stock === 0 ? 'Épuisé' : `${p.stock} unités`}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{p.category || '—'}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="sd-btn w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                            title="Modifier"
                          >
                            <FiEdit2 size={13}/>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="sd-btn w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                            title="Supprimer"
                          >
                            <FiTrash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────────────────────────────── */}
        <div className="sd-fadeUp grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animationDelay: '780ms' }}>
          <button onClick={() => setShowAdd(true)}
            className="sd-btn flex items-center justify-center gap-3 text-white py-5 rounded-2xl font-bold text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg,#00b894,#00997f)', boxShadow: '0 8px 24px rgba(0,184,148,.28)' }}>
            <FiPlus size={18}/> Ajouter un produit
          </button>
          <button onClick={() => downloadReport(products, stats)}
            className="sd-btn flex items-center justify-center gap-3 text-white py-5 rounded-2xl font-bold text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 8px 24px rgba(139,92,246,.28)' }}>
            <FiDownload size={18}/> Télécharger rapport CSV
          </button>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onSuccess={fetchAll}/>
      )}
      {editProduct && (
        <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSuccess={fetchAll}/>
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}