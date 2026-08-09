// frontend/src/App.jsx
// Changes from your current version:
//   1. Import SellerProfile and NotFound
//   2. Add route /seller/:id
//   3. Change * to use NotFound instead of Navigate

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import SearchResults from './pages/SearchResults';
import SellerDashboard from './pages/SellerDashboard';
import SellerOrders from './pages/SellerOrders';
import MySellerOrders from './pages/MySellerOrders';
import ProductDetail from './pages/ProductDetail';
import OrderSuccess from './pages/OrderSuccess';
import SellerProfile from './pages/Sellerprofile';   // ← NEW
import NotFound from './pages/NotFound';              // ← NEW
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, requireAdmin = false, user, loading }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/', { replace: true });
      else if (requireAdmin && !user.isAdmin) navigate('/dashboard', { replace: true });
    }
  }, [loading, user, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Chargement de votre session...
      </div>
    );
  }

  if (!user || (requireAdmin && !user.isAdmin)) return null;
  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode]   = useState(false);
  const [isCartOpen, setIsCartOpen]   = useState(false);
  const [isAuthOpen, setIsAuthOpen]   = useState(false);
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── Global axios interceptor — auto-logout on expired token ────────────────
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error.response?.status === 401) {
          const msg = error.response?.data?.message || '';
          if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/');
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [navigate]);

  // ── Load user from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const token      = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log('[App] User loaded — isAdmin:', parsed.isAdmin);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // ── Dark mode ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // ── Auth handlers ────────────────────────────────────────────────────────────
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onToggleDark={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        user={user}
        onLogout={handleLogout}
      />

      {/* ── No padding here — each page adds pt-[104px] for dual navbar ── */}
      <main className="w-full">
        <Routes>
          {/* Public pages */}
          <Route path="/"               element={<Home />} />
          <Route path="/about"          element={<About />} />
          <Route path="/contact"        element={<Contact />} />
          <Route path="/search"         element={<SearchResults />} />
          <Route path="/product/:id"    element={<ProductDetail />} />
          <Route path="/seller/:id"     element={<SellerProfile />} />   {/* ← NEW */}
          <Route path="/wishlist"       element={<Wishlist />} />
          <Route path="/order-success"  element={<OrderSuccess />} />

          {/* Auth-required */}
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/checkout"       element={<Checkout />} />

          {/* Seller pages */}
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/my-seller-orders" element={<MySellerOrders />} />

          {/* Admin only */}
          <Route path="/seller-orders"
            element={
              <ProtectedRoute requireAdmin={true} user={user} loading={loading}>
                <SellerOrders />
              </ProtectedRoute>
            }
          />

          {/* 404 — was Navigate to "/" before */}
          <Route path="*" element={<NotFound />} />              {/* ← CHANGED */}
        </Routes>
      </main>

      {isCartOpen && (
        <CartDrawer onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout}/>
      )}
      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={handleLoginSuccess}/>
      )}
    </div>
  );
}