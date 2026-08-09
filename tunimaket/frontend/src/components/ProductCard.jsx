// frontend/src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/wishlist', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setIsFavorited(res.data.products.some(p => p._id === product._id));
      })
      .catch(err => console.warn('Wishlist check failed:', err.message));
  }, [product._id]);

  const toggleFavorite = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    const endpoint = isFavorited ? '/remove' : '/add';

    try {
      await axios.post(`/api/wishlist${endpoint}`, { productId: product._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
      } else {
        alert('Erreur lors de la mise à jour des favoris');
      }
    }
    window.dispatchEvent(new Event('wishlistUpdate'));
  };

  const addToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Veuillez vous connecter pour ajouter au panier');
      return;
    }

    try {
      await axios.post('/api/cart/add', {
        productId: product._id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    
    } catch (err) {
      console.error(err);
    
    }
  };

  // Click on card → go to product detail page
  const goToDetail = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div 
      className="card flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={goToDetail}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when clicking star
          toggleFavorite();
        }}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition"
      >
        <FiStar
          size={22}
          className={`transition-colors ${
            isFavorited
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-gray-400 group-hover:text-yellow-400'
          }`}
        />
      </button>

      {/* Image */}
      <div className="h-56 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        <img
          src={product.image || '/assets/logo.png'}
          alt={product.title}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {product.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 flex-1">
          {product.description}
        </p>

        {/* Price & Cart - No seller name here anymore */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-2xl font-extrabold text-tm-orange">
            {product.price} TND
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card navigation when clicking button
              addToCart();
            }}
            className="bg-tm-teal hover:bg-tm-teal/90 text-white px-5 py-2 rounded-full flex items-center gap-2 transition"
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}