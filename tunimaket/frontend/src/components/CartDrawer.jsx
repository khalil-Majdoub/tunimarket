// frontend/src/components/CartDrawer.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ onClose, onCheckout }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Fetch cart
  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCart({ items: [], total: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(res.data);
    } catch (err) {
      console.error('Erreur chargement panier:', err);
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError('Impossible de charger le panier');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const removeItem = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.post(
        '/api/cart/remove',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(res.data);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.post('/api/cart/clear', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(res.data);
    } catch (err) {
      console.error('Erreur vidage panier:', err);
      alert('Erreur lors du vidage du panier');
    }
  };

  // Calculate fallback total
  const calculatedTotal = cart.items.reduce((sum, item) => {
    const price = item.productId?.price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0).toFixed(2);

  const displayTotal = cart.total !== undefined && cart.total !== null 
    ? parseFloat(cart.total).toFixed(2) 
    : calculatedTotal;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl text-center shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tm-teal mx-auto mb-4"></div>
          <p className="text-lg font-medium">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overlay - clicking it closes the drawer */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Mon Panier
            </h2>
            <button 
              onClick={onClose}
              className="text-3xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 leading-none"
            >
              ×
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6 text-center">
              {error}
            </div>
          )}

          {/* Empty cart */}
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-7xl mb-6">🛒</div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Votre panier est vide
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Ajoutez des produits pour commencer vos achats !
              </p>
              <button
                onClick={onClose}
                className="bg-tm-teal hover:bg-tm-teal/90 text-white px-10 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl"
              >
                Continuer vos achats
              </button>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="space-y-6 mb-12">
                {cart.items.map((item) => {
                  const prod = item.productId || {};
                  return (
                    <div 
                      key={prod._id || item.productId}
                      className="flex gap-5 bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      {/* Image */}
                      <div className="w-28 h-28 flex-shrink-0 bg-white dark:bg-gray-700 rounded-lg overflow-hidden border">
                        <img
                          src={prod.image || 'https://via.placeholder.com/150?text=Produit'}
                          alt={prod.title || 'Produit'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=Image+Manquante';
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1 line-clamp-2">
                          {prod.title || 'Produit'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {(prod.price || 0).toFixed(2)} TND × {item.quantity || 1}
                        </p>
                        <p className="text-base font-bold text-tm-orange">
                          {((prod.price || 0) * (item.quantity || 1)).toFixed(2)} TND
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(prod._id || item.productId)}
                        className="self-start text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-2 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Summary & Actions */}
              <div className="border-t pt-8 sticky bottom-0 bg-white dark:bg-gray-900 pb-6">
                <div className="flex justify-between items-center text-2xl font-bold mb-8">
                  <span>Total</span>
                  <span className="text-tm-orange">
                    {displayTotal} TND
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onCheckout();
                  }}
                  className="w-full bg-gradient-to-r from-tm-teal to-tm-orange text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition mb-4"
                >
                  Passer la commande
                </button>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  Vider le panier
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}