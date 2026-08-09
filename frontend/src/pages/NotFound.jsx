// frontend/src/pages/NotFound.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiSearch, FiArrowLeft } from 'react-icons/fi';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.nf-root    { font-family:'DM Sans',sans-serif; }
.nf-display { font-family:'Sora',sans-serif; }
.nf-mono    { font-family:'DM Mono',monospace; }

@keyframes nf-fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes nf-float   { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-14px) rotate(3deg)} }
@keyframes nf-glitch1 { 0%,100%{clip-path:inset(0 0 95% 0)} 20%{clip-path:inset(30% 0 50% 0)} 40%{clip-path:inset(60% 0 20% 0)} 60%{clip-path:inset(10% 0 80% 0)} 80%{clip-path:inset(70% 0 5% 0)} }
@keyframes nf-glitch2 { 0%,100%{clip-path:inset(80% 0 0 0);transform:translate(-2px,0)} 25%{clip-path:inset(10% 0 70% 0);transform:translate(2px,0)} 50%{clip-path:inset(50% 0 30% 0);transform:translate(-1px,0)} 75%{clip-path:inset(90% 0 5% 0);transform:translate(1px,0)} }
@keyframes nf-spin    { to{transform:rotate(360deg)} }

.nf-fadeUp { animation:nf-fadeUp .52s cubic-bezier(.22,1,.36,1) both }
.nf-float  { animation:nf-float 4s ease-in-out infinite }
.nf-glitch { position:relative;display:inline-block; }
.nf-glitch::before,.nf-glitch::after {
  content:attr(data-text);
  position:absolute;inset:0;
  font-family:'Sora',sans-serif;font-weight:900;
}
.nf-glitch::before { color:#00b894;animation:nf-glitch1 2.5s infinite; }
.nf-glitch::after  { color:#6366f1;animation:nf-glitch2 2.5s infinite; }

.nf-btn { transition:transform .15s cubic-bezier(.22,1,.36,1),box-shadow .15s ease; }
.nf-btn:hover { transform:translateY(-2px); }
.nf-btn:active { transform:scale(.96); }

.nf-search:focus {
  outline:none;
  box-shadow:0 0 0 3px rgba(0,184,148,.18);
  border-color:#00b894;
}
`;

export default function NotFound() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [count, setCount]   = useState(5);

  useEffect(() => {
    if (!document.getElementById('nf-styles')) {
      const el=document.createElement('style');el.id='nf-styles';el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Countdown redirect
  useEffect(() => {
    if (count <= 0) { navigate('/'); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="nf-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px] flex flex-col items-center justify-center px-6 py-16 text-center">

      {/* 404 glitch number */}
      <div className="nf-float mb-6">
        <h1
          className="nf-display nf-glitch text-[140px] md:text-[180px] font-black leading-none select-none"
          data-text="404"
          style={{
            background:'linear-gradient(135deg,#00b894,#6366f1)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
          }}>
          404
        </h1>
      </div>

      {/* Text */}
      <div className="nf-fadeUp max-w-md" style={{ animationDelay:'100ms' }}>
        <h2 className="nf-display text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">
          Page introuvable
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed">
          Oups ! La page que vous cherchez n'existe pas ou a été déplacée. Pas de panique — on vous aide à retrouver votre chemin.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-7">
          <div className="relative flex-1">
            <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Chercher un produit…"
              className="nf-search w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-all"/>
          </div>
          <button type="submit"
            className="nf-btn px-5 py-3 rounded-xl text-white font-bold text-sm shadow-lg"
            style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 6px 18px rgba(0,184,148,.32)' }}>
            <FiSearch size={16}/>
          </button>
        </form>

        {/* Quick links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link to="/"
            className="nf-btn flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg"
            style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 6px 18px rgba(0,184,148,.28)' }}>
            <FiHome size={15}/> Retour à l'accueil
          </Link>
          <button onClick={()=>navigate(-1)}
            className="nf-btn flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00b894] hover:text-[#00b894] transition-colors">
            <FiArrowLeft size={15}/> Page précédente
          </button>
        </div>

        {/* Popular links */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[
            {label:'🛍️ Boutique', to:'/search'},
            {label:'❤️ Favoris',  to:'/wishlist'},
            {label:'📦 Commandes',to:'/dashboard'},
            {label:'📞 Contact',  to:'/contact'},
          ].map((l,i)=>(
            <Link key={i} to={l.to}
              className="nf-btn px-4 py-2 rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:ring-[#00b894] hover:text-[#00b894] transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Countdown */}
        <p className="text-xs text-gray-400">
          Redirection automatique dans{' '}
          <span className="nf-mono font-bold text-[#00b894]">{count}s</span>
        </p>
      </div>
    </div>
  );
}