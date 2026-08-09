// frontend/src/pages/About.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiTruck, FiShield, FiStar,
  FiUsers, FiMapPin, FiArrowRight, FiCheck
} from 'react-icons/fi';
import Footer from '../components/Footer';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.ab-root    { font-family:'DM Sans',sans-serif; }
.ab-display { font-family:'Sora',sans-serif; }
.ab-mono    { font-family:'DM Mono',monospace; }

@keyframes ab-fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
@keyframes ab-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes ab-scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes ab-spin    { to{transform:rotate(360deg)} }
@keyframes ab-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes ab-countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

.ab-fadeUp  { animation:ab-fadeUp  .55s cubic-bezier(.22,1,.36,1) both }
.ab-fadeIn  { animation:ab-fadeIn  .4s ease both }
.ab-scaleIn { animation:ab-scaleIn .35s cubic-bezier(.22,1,.36,1) both }
.ab-float   { animation:ab-float 3.5s ease-in-out infinite }
.ab-countUp { animation:ab-countUp .5s ease both }

.ab-card { transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease; }
.ab-card:hover { transform:translateY(-5px); box-shadow:0 20px 44px rgba(0,0,0,.1); }
.dark .ab-card:hover { box-shadow:0 20px 44px rgba(0,0,0,.4); }

.ab-btn { transition:transform .15s cubic-bezier(.22,1,.36,1),box-shadow .15s ease; }
.ab-btn:hover { transform:translateY(-2px); }
.ab-btn:active { transform:scale(.97); }

.ab-value-icon {
  transition:transform .2s cubic-bezier(.22,1,.36,1);
}
.ab-card:hover .ab-value-icon { transform:scale(1.12) rotate(-4deg); }

/* Timeline connector */
.ab-timeline-line { position:absolute;left:19px;top:44px;bottom:0;width:2px;background:linear-gradient(to bottom,#00b894,rgba(0,184,148,0)); }
`;

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1500 }) {
  const [val, setVal]   = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [visible, to, duration]);

  return (
    <span ref={ref} className="ab-mono font-black text-4xl md:text-5xl" style={{ color:'#00b894' }}>
      {val.toLocaleString('fr-TN')}{suffix}
    </span>
  );
}

// ─── Team members ─────────────────────────────────────────────────────────────
const TEAM = [
  { name:'Khalil Majdoub', role:'Fondateur & CEO', emoji:'👨‍💻', color:'#00b894', desc:'Passionné par le commerce local et la tech, Khalil a fondé TuniMarket pour connecter vendeurs et acheteurs tunisiens.' },
  { name:'Équipe Tech',    role:'Développement',   emoji:'⚙️',  color:'#6366f1', desc:'Notre équipe développe et maintient la plateforme pour garantir la meilleure expérience utilisateur possible.' },
  { name:'Support Client', role:'Service client',  emoji:'💬',  color:'#f59e0b', desc:'Disponible 7j/7 pour répondre à vos questions et résoudre vos problèmes rapidement.' },
];

// ─── Values ───────────────────────────────────────────────────────────────────
const VALUES = [
  { icon:FiHeart,      title:'Local d\'abord',      desc:'Nous croyons au pouvoir du commerce local pour dynamiser l\'économie tunisienne et créer des emplois.', color:'#ef4444' },
  { icon:FiShield,     title:'Confiance & Sécurité', desc:'Chaque vendeur est vérifié. Paiement à la livraison pour votre tranquillité d\'esprit totale.', color:'#00b894' },
  { icon:FiStar,       title:'Qualité garantie',     desc:'Système d\'avis authentiques pour vous aider à choisir les meilleurs produits et vendeurs.', color:'#f59e0b' },
  { icon:FiTruck,      title:'Livraison rapide',      desc:'Réseau de livraison couvrant toute la Tunisie, avec des délais parmi les plus courts du marché.', color:'#6366f1' },
  { icon:FiUsers,      title:'Communauté',            desc:'Plus qu\'une marketplace, une communauté de vendeurs et acheteurs qui se font confiance.', color:'#8b5cf6' },
  { icon:FiShoppingBag,title:'Choix infini',          desc:'Des milliers de produits dans toutes les catégories pour répondre à tous vos besoins.', color:'#06b6d4' },
];

// ─── Timeline ─────────────────────────────────────────────────────────────────
const TIMELINE = [
  { year:'2023', title:'La naissance', desc:'TuniMarket est fondé avec une vision simple : créer la meilleure marketplace tunisienne.' },
  { year:'2024', title:'Croissance', desc:'Nous atteignons 500+ vendeurs et 10 000+ produits sur la plateforme. Lancement de la livraison gratuite.' },
  { year:'2025', title:'Expansion', desc:'Nouveau système de paiement, application mobile, et couverture livraison dans toutes les wilayas.' },
  { year:'Futur', title:'Notre vision', desc:'Devenir la référence incontournable du e-commerce tunisien et accompagner chaque vendeur local.' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function About() {
  useEffect(() => {
    if (!document.getElementById('ab-styles')) {
      const el = document.createElement('style');
      el.id = 'ab-styles'; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div className="ab-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background:'radial-gradient(circle,#00b894,transparent 70%)' }}/>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-[0.04]"
            style={{ background:'radial-gradient(circle,#6366f1,transparent 70%)' }}/>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 md:px-10 py-20 text-center">
          <div className="ab-fadeUp inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background:'rgba(0,184,148,.1)', color:'#00b894', border:'1px solid rgba(0,184,148,.2)' }}>
            🇹🇳 Notre histoire
          </div>
          <h1 className="ab-display ab-fadeUp text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6"
            style={{ animationDelay:'60ms' }}>
            On construit la marketplace<br/>
            <span style={{ background:'linear-gradient(135deg,#00b894,#00c9a7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              dont la Tunisie a besoin.
            </span>
          </h1>
          <p className="ab-fadeUp text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10"
            style={{ animationDelay:'120ms' }}>
            TuniMarket est né d'une conviction simple : les commerçants tunisiens méritent une plateforme de vente en ligne fiable, simple et accessible, conçue pour eux, par des Tunisiens.
          </p>
          <div className="ab-fadeUp flex items-center justify-center gap-4" style={{ animationDelay:'180ms' }}>
            <Link to="/search"
              className="ab-btn flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg"
              style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.32)' }}>
              <FiShoppingBag size={16}/> Explorer la boutique
            </Link>
            <Link to="/contact"
              className="ab-btn flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00b894] hover:text-[#00b894] transition-colors">
              Nous contacter <FiArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 space-y-20">

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { to:500,    suffix:'+', label:'Vendeurs actifs',     icon:'🏪' },
            { to:10000,  suffix:'+', label:'Produits disponibles',icon:'📦' },
            { to:50000,  suffix:'+', label:'Clients satisfaits',  icon:'😊' },
            { to:24,     suffix:'h', label:'Support disponible',  icon:'💬' },
          ].map((s, i) => (
            <div key={i}
              className="ab-card ab-scaleIn bg-white dark:bg-gray-900 rounded-2xl p-6 text-center shadow-lg ring-1 ring-gray-100 dark:ring-gray-800"
              style={{ animationDelay:`${i*80}ms` }}>
              <div className="text-3xl mb-3">{s.icon}</div>
              <Counter to={s.to} suffix={s.suffix}/>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── Mission ─────────────────────────────────────────────────────── */}
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="ab-fadeUp text-[#00b894] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <FiHeart size={12}/> Notre mission
            </p>
            <h2 className="ab-display ab-fadeUp text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-5" style={{ animationDelay:'50ms' }}>
              Rendre le e-commerce accessible à tous les Tunisiens
            </h2>
            <div className="ab-fadeUp space-y-4 text-gray-500 dark:text-gray-400" style={{ animationDelay:'100ms' }}>
              <p className="leading-relaxed">
                Que vous soyez artisan, commerçant, ou particulier, TuniMarket vous donne les outils pour vendre en ligne sans frais excessifs ni complexité technique.
              </p>
              <p className="leading-relaxed">
                Pour les acheteurs, nous garantissons une expérience sécurisée avec paiement à la livraison, des avis authentiques, et une livraison rapide partout en Tunisie.
              </p>
            </div>
            <div className="ab-fadeUp mt-7 space-y-3" style={{ animationDelay:'150ms' }}>
              {[
                'Inscription gratuite pour les vendeurs',
                'Paiement à la livraison — zéro risque',
                'Support client 7j/7',
                'Livraison dans toutes les wilayas',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00b894]/15 flex items-center justify-center flex-shrink-0">
                    <FiCheck size={11} className="text-[#00b894]"/>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side visual */}
          <div className="ab-fadeUp relative" style={{ animationDelay:'80ms' }}>
            <div className="relative bg-gradient-to-br from-[#00b894]/10 to-[#6366f1]/10 dark:from-[#00b894]/5 dark:to-[#6366f1]/5 rounded-3xl p-8 ring-1 ring-gray-100 dark:ring-gray-800">
              <div className="ab-float text-7xl text-center mb-4">🇹🇳</div>
              <div className="text-center">
                <p className="ab-display text-2xl font-black text-gray-900 dark:text-white mb-2">Made in Tunisia</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Conçu, développé et maintenu par des Tunisiens pour les Tunisiens</p>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl px-4 py-3 ring-1 ring-gray-100 dark:ring-gray-800">
                <p className="ab-mono font-black text-[#00b894] text-lg">100%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Local</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl px-4 py-3 ring-1 ring-gray-100 dark:ring-gray-800">
                <p className="text-lg">🚚</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Livraison gratuite</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ──────────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-12">
            <p className="ab-fadeUp text-[#00b894] text-xs font-bold uppercase tracking-widest mb-3">Ce qui nous guide</p>
            <h2 className="ab-display ab-fadeUp text-3xl md:text-4xl font-black text-gray-900 dark:text-white" style={{ animationDelay:'50ms' }}>
              Nos valeurs
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <div key={i}
                className="ab-card ab-fadeUp bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg ring-1 ring-gray-100 dark:ring-gray-800"
                style={{ animationDelay:`${i*70}ms` }}>
                <div className="ab-value-icon w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background:`${v.color}18` }}>
                  <v.icon size={22} style={{ color:v.color }}/>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ────────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-12">
            <p className="ab-fadeUp text-[#00b894] text-xs font-bold uppercase tracking-widest mb-3">Notre parcours</p>
            <h2 className="ab-display ab-fadeUp text-3xl md:text-4xl font-black text-gray-900 dark:text-white" style={{ animationDelay:'50ms' }}>
              L'histoire de TuniMarket
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            {TIMELINE.map((item, i) => (
              <div key={i} className="ab-fadeUp relative flex gap-5 pb-10 last:pb-0" style={{ animationDelay:`${i*90}ms` }}>
                {/* Line */}
                {i < TIMELINE.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5"
                    style={{ background:'linear-gradient(to bottom,#00b894,rgba(0,184,148,0))' }}/>
                )}
                {/* Dot */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-gray-50 dark:ring-gray-950 z-10"
                  style={{ background: item.year === 'Futur' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#00b894,#00997f)' }}>
                  <span className="text-white text-xs font-black">{item.year === 'Futur' ? '✦' : i + 1}</span>
                </div>
                {/* Content */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="ab-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: item.year === 'Futur' ? 'rgba(99,102,241,.12)' : 'rgba(0,184,148,.12)', color: item.year === 'Futur' ? '#6366f1' : '#00b894' }}>
                      {item.year}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ────────────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-12">
            <p className="ab-fadeUp text-[#00b894] text-xs font-bold uppercase tracking-widest mb-3">Les gens derrière TuniMarket</p>
            <h2 className="ab-display ab-fadeUp text-3xl md:text-4xl font-black text-gray-900 dark:text-white" style={{ animationDelay:'50ms' }}>
              Notre équipe
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <div key={i}
                className="ab-card ab-scaleIn bg-white dark:bg-gray-900 rounded-2xl p-7 text-center shadow-lg ring-1 ring-gray-100 dark:ring-gray-800"
                style={{ animationDelay:`${i*90}ms` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background:`${member.color}18` }}>
                  {member.emoji}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">{member.name}</h3>
                <p className="text-xs font-semibold mb-3 px-3 py-1 rounded-full inline-block"
                  style={{ background:`${member.color}15`, color:member.color }}>
                  {member.role}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="ab-fadeUp bg-white dark:bg-gray-900 rounded-3xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-lg overflow-hidden">
          <div className="relative p-10 md:p-14 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.06]"
                style={{ background:'radial-gradient(circle,#00b894,transparent 70%)' }}/>
            </div>
            <div className="ab-float text-5xl mb-5">🚀</div>
            <h2 className="ab-display text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Rejoignez TuniMarket
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
              Que vous souhaitiez vendre ou acheter, TuniMarket est la plateforme qu'il vous faut. Gratuit, simple, et 100% tunisien.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/search"
                className="ab-btn flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg"
                style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.32)' }}>
                <FiShoppingBag size={16}/> Commencer à acheter
              </Link>
              <Link to="/contact"
                className="ab-btn flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00b894] hover:text-[#00b894] transition-colors">
                Nous contacter <FiArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer/>
    </div>
  );
}