// frontend/src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiStar, FiShoppingCart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProductCard({ 
  product, 
  isInWishlist = false,      // ← Passed from Wishlist page
  onRemove                   // ← Passed from Wishlist page for instant removal
}) {
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();

  // Check if this product is in wishlist (for normal pages)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/wishlist', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const favorited = res.data.products.some(p => p._id === product._id);
        setIsFavorited(favorited);
      })
      .catch(err => console.warn('Wishlist check failed:', err.message));
  }, [product._id]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      return;
    }

    // Special behavior on Wishlist page: instant remove
    if (isInWishlist && onRemove) {
      onRemove();  // This removes it from UI instantly (called from Wishlist.jsx)
      return;
    }

    // Normal behavior on other pages: toggle add/remove
    const endpoint = isFavorited ? '/remove' : '/add';

    try {
      await axios.post(`/api/wishlist${endpoint}`, { productId: product._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorited(!isFavorited);
      window.dispatchEvent(new Event('wishlistUpdate'));
      toast.success(isFavorited ? 'Retiré des favoris' : 'Ajouté aux favoris');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      return;
    }

    try {
      await axios.post('/api/cart/add', {
        productId: product._id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('cartUpdate'));
      toast.success('Ajouté au panier !');
    } catch (err) {
      toast.error('Erreur ajout panier');
    }
  };

  const goToDetail = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div 
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={goToDetail}
    >
      {/* Image container */}
      <div className="relative h-64 md:h-72 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden aspect-square">
        <img
          src={product.image || '/assets/logo.png'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Heart / Star button */}
        <button
          onClick={toggleFavorite}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition ${
            isFavorited 
              ? 'bg-red-100 text-red-500 hover:bg-red-200' 
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          <FiStar
            size={22}
            className={isFavorited ? 'fill-current text-red-500' : ''}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {product.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 flex-1">
          {product.description}
        </p>

        {/* Price & Add to cart */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-2xl font-extrabold text-[#00b894]">
            {product.price} DT
          </span>
          <button
            onClick={addToCart}
            className="bg-[#00b894] hover:bg-[#00997f] text-white px-5 py-2 rounded-full flex items-center gap-2 transition"
          >
            <FiShoppingCart size={18} />
            Panier
          </button>
        </div>
      </div>
    </div>
  );
}