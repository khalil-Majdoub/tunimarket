// frontend/src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTruck, FiCheckCircle, FiShoppingCart } from 'react-icons/fi'; // ← FIXED HERE

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });

  // Load cart from API
  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Veuillez vous connecter pour passer commande');
        navigate('/');
        return;
      }

      try {
        const res = await axios.get('/api/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Safety: ensure total is a number
        const safeTotal = Number(res.data.total) || 0;
        setCart({
          ...res.data,
          total: safeTotal
        });
      } catch (err) {
        console.error('Erreur chargement panier:', err);
        toast.error('Impossible de charger le panier');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.address || !formData.city || !formData.postalCode || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setSubmitting(true);

    const token = localStorage.getItem('token');

    try {
      const orderData = {
        items: cart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.price
        })),
        total: cart.total,
        shippingAddress: formData
      };

      const res = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Commande passée avec succès !', {
        duration: 5000,
        position: 'top-right'
      });

      // Clear cart after success
      await axios.post('/api/cart/clear', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('cartUpdate'));

      navigate('/order-success', { state: { orderId: res.data.orderId } });
    } catch (err) {
      console.error('Erreur commande:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-tm-teal mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-red-600 mb-6">Panier vide</h1>
          <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
            Ajoutez des produits avant de passer commande
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-tm-teal text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-tm-teal/90 transition shadow-lg"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 text-tm-teal hover:underline flex items-center gap-2 font-medium text-lg"
      >
        <FiArrowLeft /> Retour au panier
      </button>

      <h1 className="text-4xl md:text-5xl font-extrabold mb-12 text-center md:text-left brand-gradient">
        Finaliser votre commande
      </h1>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 order-2 md:order-1">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FiShoppingCart className="text-tm-teal" /> Récapitulatif
          </h2>

          <div className="space-y-6">
            {cart.items.map((item) => (
              <div key={item._id} className="flex gap-4 border-b pb-4 last:border-0">
                <img
                  src={item.productId?.image || '/assets/logo.png'}
                  alt={item.productId?.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-lg">{item.productId?.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.quantity} × {item.productId?.price?.toFixed(2) || 0} TND
                  </p>
                </div>
                <p className="font-bold text-tm-orange">
                  {item.quantity * (item.productId?.price || 0).toFixed(2)} TND
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span className="text-tm-orange">
              {Number(cart.total || 0).toFixed(2)} TND
            </span>
          </div>
        </div>

        {/* Shipping Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 order-1 md:order-2">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FiTruck className="text-tm-teal" /> Informations de livraison
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Adresse *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ville *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Code postal *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Téléphone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || cart.total <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-3 ${
                submitting || cart.total <= 0
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-gradient-to-r from-tm-teal to-tm-orange hover:shadow-xl text-white'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <FiCheckCircle size={20} />
                  Passer la commande
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}