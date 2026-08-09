import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import SearchResults from './pages/SearchResults';
import SellerDashboard from './pages/SellerDashboard';      // ← Fixed here
import ProductDetail from './pages/ProductDetail';          // ← Fixed here (new)
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';

export default function App() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
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

      <main className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/product/:id" element={<ProductDetail />} /> {/* ← This line is now valid */}
        </Routes>
      </main>

      {isCartOpen && (
        <CartDrawer 
          onClose={() => setIsCartOpen(false)} 
          onCheckout={handleCheckout} 
        />
      )}

      {isAuthOpen && (
        <AuthModal 
          onClose={() => setIsAuthOpen(false)} 
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}