// frontend/src/pages/Contact.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiMail, FiPhone, FiMapPin, FiSend, FiMessageCircle,
  FiCheck, FiAlertCircle, FiClock, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import Footer from '../components/Footer';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.ct-root    { font-family:'DM Sans',sans-serif; }
.ct-display { font-family:'Sora',sans-serif; }
.ct-mono    { font-family:'DM Mono',monospace; }

@keyframes ct-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes ct-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes ct-scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes ct-spin    { to{transform:rotate(360deg)} }
@keyframes ct-checkPop{ 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }

.ct-fadeUp  { animation:ct-fadeUp  .52s cubic-bezier(.22,1,.36,1) both }
.ct-fadeIn  { animation:ct-fadeIn  .35s ease both }
.ct-scaleIn { animation:ct-scaleIn .3s  cubic-bezier(.22,1,.36,1) both }
.ct-spin    { animation:ct-spin .8s linear infinite }
.ct-checkPop{ animation:ct-checkPop .35s cubic-bezier(.22,1,.36,1) both }

.ct-card { transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s ease; }
.ct-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.1); }
.dark .ct-card:hover { box-shadow:0 16px 40px rgba(0,0,0,.38); }

.ct-btn { transition:transform .15s cubic-bezier(.22,1,.36,1),box-shadow .15s ease,background .15s ease,opacity .15s ease; }
.ct-btn:hover:not(:disabled) { transform:translateY(-2px); }
.ct-btn:active:not(:disabled){ transform:scale(.97); }
.ct-btn:disabled { opacity:.5;cursor:not-allowed; }

.ct-input:focus {
  outline:none;
  box-shadow:0 0 0 3px rgba(0,184,148,.18);
  border-color:#00b894;
  background:white;
}
.dark .ct-input:focus { background:#111827; }
.ct-input.error { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.12); }

.ct-field-icon {
  position:absolute;left:13px;top:50%;transform:translateY(-50%);
  color:#9ca3af;pointer-events:none;transition:color .15s ease;
}
.ct-field:focus-within .ct-field-icon { color:#00b894; }

.ct-faq-item { transition:background .15s ease; }
`;

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQS = [
  { q:'Comment devenir vendeur sur TuniMarket ?', a:'Il suffit de créer un compte, puis de nous contacter via ce formulaire ou WhatsApp pour activer votre statut vendeur. C\'est gratuit et rapide !' },
  { q:'Quel est le délai de livraison ?',         a:'La livraison prend généralement 24 à 72 heures selon votre wilaya. Tunis et les grandes villes sont livrées le lendemain.' },
  { q:'Comment fonctionne le paiement ?',        a:'Nous proposons le paiement à la livraison : vous payez uniquement quand vous recevez votre commande. Aucun risque.' },
  { q:'Puis-je retourner un produit ?',           a:'Oui, vous avez 7 jours pour retourner un produit qui ne vous convient pas. Contactez notre support pour initier le retour.' },
  { q:'Comment contacter un vendeur ?',          a:'Chaque fiche produit permet de contacter directement le vendeur. Vous pouvez aussi nous contacter si vous avez un problème.' },
];

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="ct-field relative">
        <span className="ct-field-icon"><Icon size={14}/></span>
        {children}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{error}</p>}
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ct-faq-item ct-fadeUp bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800 overflow-hidden`}
      style={{ animationDelay:`${index*60}ms` }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left group">
        <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4 group-hover:text-[#00b894] transition-colors">{q}</span>
        <div className={`flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 ${open?'bg-[#00b894] text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
          {open ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
        </div>
      </button>
      {open && (
        <div className="ct-fadeIn px-6 pb-5">
          <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4"/>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Contact() {
  const [form, setForm]       = useState({ name:'', email:'', subject:'', message:'' });
  const [errors, setErrors]   = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  useEffect(() => {
    if (!document.getElementById('ct-styles')) {
      const el = document.createElement('style');
      el.id = 'ct-styles'; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const setField = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = {...p}; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Nom requis';
    if (!form.email.trim())   e.email   = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.subject.trim()) e.subject = 'Sujet requis';
    if (!form.message.trim()) e.message = 'Message requis';
    else if (form.message.trim().length < 20) e.message = 'Message trop court (min 20 caractères)';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Veuillez corriger les erreurs'); return; }

    setSending(true);
    // Simulate send (replace with your email API if needed)
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    toast.success('Message envoyé ! Nous vous répondrons sous 24h.');
    setForm({ name:'', email:'', subject:'', message:'' });
  };

  const CONTACT_CARDS = [
    {
      icon: FiMessageCircle,
      title: 'WhatsApp',
      desc: 'Réponse rapide 7j/7',
      value: '+216 92 006 969',
      color: '#25D366',
      action: () => window.open('https://wa.me/21692006969', '_blank'),
      actionLabel: 'Ouvrir WhatsApp',
    },
    {
      icon: FiMail,
      title: 'Email',
      desc: 'Réponse sous 24h',
      value: 'majdoubek@gmail.com',
      color: '#00b894',
      action: () => window.open('mailto:majdoubek@gmail.com', '_blank'),
      actionLabel: 'Envoyer un email',
    },
    {
      icon: FiMapPin,
      title: 'Localisation',
      desc: 'Sfax, Tunisie',
      value: 'Sfax 3000',
      color: '#6366f1',
      action: null,
      actionLabel: null,
    },
    {
      icon: FiClock,
      title: 'Horaires',
      desc: 'Support disponible',
      value: 'Lun – Sam : 8h – 20h',
      color: '#f59e0b',
      action: null,
      actionLabel: null,
    },
  ];

  return (
    <div className="ct-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background:'radial-gradient(circle,#00b894,transparent 70%)' }}/>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-[0.04]"
            style={{ background:'radial-gradient(circle,#6366f1,transparent 70%)' }}/>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 md:px-10 py-16 text-center">
          <div className="ct-fadeUp inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background:'rgba(0,184,148,.1)', color:'#00b894', border:'1px solid rgba(0,184,148,.2)' }}>
            💬 On est là pour vous
          </div>
          <h1 className="ct-display ct-fadeUp text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4"
            style={{ animationDelay:'60ms' }}>
            Contactez-nous
          </h1>
          <p className="ct-fadeUp text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto leading-relaxed"
            style={{ animationDelay:'120ms' }}>
            Une question, un problème, ou simplement envie de nous parler ? Notre équipe vous répond rapidement.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 space-y-14">  

        {/* ── Contact cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CONTACT_CARDS.map((card, i) => (
            <div key={i}
              className="ct-card ct-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800 flex flex-col"
              style={{ animationDelay:`${i*70}ms` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ background:`${card.color}15` }}>
                <card.icon size={20} style={{ color:card.color }}/>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{card.title}</p>
              <p className="text-xs text-gray-400 mb-2">{card.desc}</p>
              <p className="ct-mono text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex-1">{card.value}</p>
              {card.action && (
                <button onClick={card.action}
                  className="ct-btn w-full py-2.5 rounded-xl text-white text-xs font-bold transition shadow-md"
                  style={{ background:`linear-gradient(135deg,${card.color},${card.color}cc)`, boxShadow:`0 4px 14px ${card.color}40` }}>
                  {card.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Main grid: Form + Info ─────────────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Form — 3 cols */}
          <div className="lg:col-span-3">
            <div className="ct-fadeUp bg-white dark:bg-gray-900 rounded-3xl shadow-xl ring-1 ring-gray-100 dark:ring-gray-800 overflow-hidden">
              {/* Form header */}
              <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="ct-display font-black text-gray-900 dark:text-white text-xl">Envoyer un message</h2>
                <p className="text-sm text-gray-400 mt-1">Nous vous répondrons sous 24 heures</p>
              </div>

              {sent ? (
                <div className="px-8 py-16 text-center">
                  <div className="ct-checkPop w-16 h-16 bg-[#00b894]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FiCheck size={28} className="text-[#00b894]"/>
                  </div>
                  <h3 className="ct-display font-black text-gray-900 dark:text-white text-xl mb-2">Message envoyé !</h3>
                  <p className="text-gray-400 text-sm mb-6">Nous vous répondrons dans les plus brefs délais.</p>
                  <button onClick={() => setSent(false)}
                    className="ct-btn px-6 py-3 rounded-xl bg-[#00b894] hover:bg-[#00997f] text-white font-bold text-sm transition">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Votre nom" icon={FiMessageCircle} error={errors.name} required>
                      <input value={form.name} onChange={e=>setField('name',e.target.value)}
                        placeholder="Khalil Majdoub"
                        className={`ct-input w-full pl-9 pr-4 py-3 rounded-xl border ${errors.name?'error':'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all`}/>
                    </Field>
                    <Field label="Adresse email" icon={FiMail} error={errors.email} required>
                      <input type="email" value={form.email} onChange={e=>setField('email',e.target.value)}
                        placeholder="vous@email.com"
                        className={`ct-input w-full pl-9 pr-4 py-3 rounded-xl border ${errors.email?'error':'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all`}/>
                    </Field>
                  </div>

                  <Field label="Sujet" icon={FiSend} error={errors.subject} required>
                    <input value={form.subject} onChange={e=>setField('subject',e.target.value)}
                      placeholder="De quoi s'agit-il ?"
                      className={`ct-input w-full pl-9 pr-4 py-3 rounded-xl border ${errors.subject?'error':'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all`}/>
                  </Field>

                  {/* Subject category chips */}
                  <div className="flex flex-wrap gap-2">
                    {['Commande','Livraison','Vendeur','Remboursement','Autre'].map(s=>(
                      <button type="button" key={s}
                        onClick={()=>setField('subject',s)}
                        className={`ct-btn px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${form.subject===s?'bg-[#00b894] text-white border-[#00b894]':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#00b894] hover:text-[#00b894]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea value={form.message} onChange={e=>setField('message',e.target.value)}
                      rows={5} placeholder="Décrivez votre demande en détail…"
                      className={`ct-input w-full px-4 py-3 rounded-xl border ${errors.message?'error':'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none transition-all`}/>
                    {errors.message && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={11}/>{errors.message}</p>}
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length} caractères</p>
                  </div>

                  <button type="submit" disabled={sending}
                    className="ct-btn w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-base transition shadow-xl disabled:shadow-none"
                    style={{ background: sending ? '#9ca3af' : 'linear-gradient(135deg,#00b894,#00997f)', boxShadow: sending ? 'none' : '0 10px 28px rgba(0,184,148,.32)' }}>
                    {sending
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full ct-spin"/> Envoi en cours…</>
                      : <><FiSend size={18}/> Envoyer le message</>
                    }
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right info — 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            {/* WhatsApp quick action */}
            <div className="ct-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800"
              style={{ animationDelay:'100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(37,211,102,.15)' }}>
                  <FiPhone size={18} style={{ color:'#25D366' }}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Réponse instantanée</p>
                  <p className="text-xs text-gray-400">Via WhatsApp</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Besoin d'une réponse rapide ? Contactez-nous directement sur WhatsApp pour une assistance immédiate.
              </p>
              <button onClick={() => window.open('https://wa.me/21692006969?text=Bonjour%20TuniMarket%2C%20j\'ai%20une%20question.', '_blank')}
                className="ct-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition"
                style={{ background:'linear-gradient(135deg,#25D366,#128C7E)', boxShadow:'0 6px 18px rgba(37,211,102,.3)' }}>
                <FiMessageCircle size={16}/> Ouvrir WhatsApp
              </button>
            </div>

            {/* Hours */}
            <div className="ct-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800"
              style={{ animationDelay:'150ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(245,158,11,.15)' }}>
                  <FiClock size={18} style={{ color:'#f59e0b' }}/>
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Heures d'ouverture</p>
              </div>
              <div className="space-y-2">
                {[
                  { day:'Lundi – Vendredi', h:'8h00 – 20h00' },
                  { day:'Samedi',           h:'9h00 – 18h00' },
                  { day:'Dimanche',         h:'Fermé' },
                ].map((r,i)=>(
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{r.day}</span>
                    <span className={`ct-mono text-xs font-bold px-2.5 py-1 rounded-lg ${r.h==='Fermé'?'bg-red-50 dark:bg-red-900/20 text-red-500':'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>{r.h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="ct-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800"
              style={{ animationDelay:'200ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(99,102,241,.15)' }}>
                  <FiMapPin size={18} style={{ color:'#6366f1' }}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Nous trouver</p>
                  <p className="text-xs text-gray-400">Sfax, Tunisie</p>
                </div>
              </div>
              {/* Map placeholder */}
              <div className="h-36 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-center overflow-hidden">
                <div>
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sfax, Tunisie</p>
                  <p className="text-xs text-gray-400 mt-0.5">Code postal 3000</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <p className="ct-fadeUp text-[#00b894] text-xs font-bold uppercase tracking-widest mb-3">Questions fréquentes</p>
            <h2 className="ct-display ct-fadeUp text-3xl md:text-4xl font-black text-gray-900 dark:text-white" style={{ animationDelay:'50ms' }}>
              On répond à vos questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} index={i}/>
            ))}
          </div>
          <div className="ct-fadeUp text-center mt-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Vous ne trouvez pas ce que vous cherchez ?{' '}
              <button onClick={() => window.open('https://wa.me/21692006969', '_blank')}
                className="text-[#00b894] font-semibold hover:underline">
                Contactez-nous directement →
              </button>
            </p>
          </div>
        </section>
      </div>

      <Footer/>
    </div>
  );
}