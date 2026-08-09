// frontend/src/pages/OrderSuccess.jsx
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiCheck, FiPackage, FiShoppingBag, FiHome, FiPhone } from 'react-icons/fi';
import Footer from '../components/Footer';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.os-root    { font-family:'DM Sans',sans-serif; }
.os-display { font-family:'Sora',sans-serif; }
.os-mono    { font-family:'DM Mono',monospace; }

@keyframes os-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes os-checkIn { 0%{transform:scale(0) rotate(-45deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes os-ringPop { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
@keyframes os-confetti{ 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(60px) rotate(360deg);opacity:0} }
@keyframes os-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes os-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(0,184,148,.4)} 70%{box-shadow:0 0 0 16px rgba(0,184,148,0)} }

.os-fadeUp  { animation:os-fadeUp  .55s cubic-bezier(.22,1,.36,1) both }
.os-checkIn { animation:os-checkIn .6s cubic-bezier(.22,1,.36,1) both }
.os-ringPop { animation:os-ringPop .55s cubic-bezier(.22,1,.36,1) both }
.os-float   { animation:os-float 3s ease-in-out infinite }
.os-pulse   { animation:os-pulse 2s ease-in-out infinite }

.os-btn { transition:transform .15s cubic-bezier(.22,1,.36,1),box-shadow .15s ease; }
.os-btn:hover { transform:translateY(-2px); }
.os-btn:active { transform:scale(.97); }

/* Confetti pieces */
.os-confetti-piece {
  position:absolute;width:8px;height:8px;border-radius:2px;
  animation:os-confetti 1.2s ease-out forwards;
}
`;

const CONFETTI_COLORS = ['#00b894','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899'];

export default function OrderSuccess() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const orderId    = state?.orderId;
  const confettiRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById('os-styles')) {
      const el = document.createElement('style'); el.id='os-styles'; el.textContent=STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Spawn confetti
  useEffect(() => {
    if (!confettiRef.current) return;
    const container = confettiRef.current;
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'os-confetti-piece';
      piece.style.cssText = `
        left:${Math.random()*100}%;
        top:${Math.random()*30}%;
        background:${CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)]};
        animation-delay:${Math.random()*0.8}s;
        animation-duration:${0.8+Math.random()*0.8}s;
        transform:rotate(${Math.random()*360}deg);
      `;
      container.appendChild(piece);
    }
    return () => { while (container.firstChild) container.removeChild(container.firstChild); };
  }, []);

  // Auto redirect to dashboard after 10s
  useEffect(() => {
    const t = setTimeout(() => navigate('/dashboard'), 10000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="os-root min-h-screen bg-gray-50 dark:bg-gray-950 pt-[104px] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">

          {/* Confetti container */}
          <div ref={confettiRef} className="relative h-0 overflow-visible pointer-events-none"/>

          {/* Success ring + check */}
          <div className="os-fadeUp flex items-center justify-center mb-8">
            <div className="os-ringPop relative w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-[#00b894]/15 os-pulse"/>
              <div className="absolute inset-3 rounded-full bg-[#00b894]/25"/>
              <div className="absolute inset-0 rounded-full bg-[#00b894] flex items-center justify-center shadow-2xl"
                style={{ boxShadow:'0 20px 60px rgba(0,184,148,.5)' }}>
                <FiCheck size={42} className="os-checkIn text-white" style={{ animationDelay:'200ms' }}/>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="os-display os-fadeUp text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3"
            style={{ animationDelay:'150ms' }}>
            Commande confirmée !
          </h1>
          <p className="os-fadeUp text-gray-500 dark:text-gray-400 text-lg mb-2"
            style={{ animationDelay:'220ms' }}>
            Merci pour votre commande 🎉
          </p>

          {/* Order ID */}
          {orderId && (
            <div className="os-fadeUp inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm mb-8"
              style={{ animationDelay:'280ms' }}>
              <FiPackage size={15} className="text-[#00b894]"/>
              <span className="text-sm text-gray-500 dark:text-gray-400">Commande</span>
              <span className="os-mono font-black text-gray-900 dark:text-white">#{String(orderId).slice(-8).toUpperCase()}</span>
            </div>
          )}

          {/* Info cards */}
          <div className="os-fadeUp grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" style={{ animationDelay:'340ms' }}>
            {[
              { emoji:'📦', title:'Préparation',   desc:'Votre commande est en cours de préparation par le vendeur.' },
              { emoji:'🚚', title:'Livraison',      desc:'Vous serez livré sous 24–72h selon votre wilaya.' },
              { emoji:'💳', title:'Paiement',       desc:'Paiement à la livraison — payez à la réception.' },
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                <div className="text-3xl mb-2 os-float" style={{ animationDelay:`${i*0.3}s` }}>{card.emoji}</div>
                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{card.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* WhatsApp note */}
          <div className="os-fadeUp flex items-center gap-3 bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 mb-8 ring-1 ring-green-100 dark:ring-green-800/30 text-left"
            style={{ animationDelay:'400ms' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(37,211,102,.15)' }}>
              <FiPhone size={18} style={{ color:'#25D366' }}/>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Confirmation WhatsApp envoyée</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Notre équipe a été notifiée et vous contactera si nécessaire.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="os-fadeUp flex flex-col sm:flex-row gap-3 justify-center" style={{ animationDelay:'460ms' }}>
            <Link to="/dashboard"
              className="os-btn flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg"
              style={{ background:'linear-gradient(135deg,#00b894,#00997f)', boxShadow:'0 8px 20px rgba(0,184,148,.32)' }}>
              <FiPackage size={16}/> Suivre ma commande
            </Link>
            <Link to="/"
              className="os-btn flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00b894] hover:text-[#00b894] transition-colors">
              <FiHome size={15}/> Retour à l'accueil
            </Link>
          </div>

          <p className="os-fadeUp text-xs text-gray-400 mt-6" style={{ animationDelay:'520ms' }}>
            Redirection automatique vers vos commandes dans 10 secondes…
          </p>
        </div>
      </div>

      <Footer/>
    </div>
  );
}