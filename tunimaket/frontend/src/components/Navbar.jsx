// frontend/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiUser, 
  FiShoppingCart, 
  FiStar, 
  FiSun, 
  FiMoon, 
  FiLogOut 
} from 'react-icons/fi';
import axios from 'axios';

export default function Navbar({
  onCartClick,
  onAuthClick,
  onToggleDark,
  isDarkMode,
  user,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

  const fetchWishlistCount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setWishlistCount(0);
      return;
    }

    try {
      const res = await axios.get('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const count = res.data.products?.length || 0;
      setWishlistCount(count);
    } catch (err) {
      console.warn('Wishlist count fetch failed:', err);
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    fetchWishlistCount(); // Initial load

    // Update when tab is focused
    const handleFocus = () => fetchWishlistCount();
    window.addEventListener('focus', handleFocus);

    // Listen for custom event from ProductCard (add/remove)
    const handleWishlistUpdate = () => fetchWishlistCount();
    window.addEventListener('wishlistUpdate', handleWishlistUpdate);

    // Optional: poll every 10s as safety (removes need for reload)
    const interval = setInterval(fetchWishlistCount, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/assets/logo.png" 
            alt="TuniMarket" 
            className="h-12 md:h-14 w-auto object-contain"
          />
          <h1 className="text-2xl md:text-3xl font-extrabold brand-gradient hidden sm:block">
            TuniMarket
          </h1>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full px-5 py-3 pl-12 pr-5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal transition-all"
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={20} />
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Dark mode */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDarkMode ? <FiSun size={22} className="text-yellow-400" /> : <FiMoon size={22} />}
          </button>

          {/* User */}
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.name?.split(' ')[0] || 'Utilisateur'}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <FiLogOut size={20} />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <button onClick={onAuthClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <FiUser size={22} />
            </button>
          )}

          {/* Cart */}
          <button onClick={onCartClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition relative">
            <FiShoppingCart size={22} />
          </button>

          {/* Wishlist - Dynamic star + count badge */}
          <button
            onClick={() => navigate('/wishlist')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
          >
            <FiStar 
              size={26} 
              className={`transition-all duration-300 ${
                wishlistCount > 0 
                  ? 'text-yellow-500 fill-yellow-500 scale-110' 
                  : 'text-gray-400'
              }`}
            />

            {/* Badge with count */}
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-md animate-pulse">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}