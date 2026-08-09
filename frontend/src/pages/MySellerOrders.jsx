// frontend/src/pages/MySellerOrders.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function MySellerOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerId, setSellerId] = useState(null);

  useEffect(() => {
    const fetchMyOrders = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }

      try {
        // Get logged seller
        const userRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const currentSellerId =
          userRes.data.id || userRes.data._id;

        setSellerId(currentSellerId);

        console.log("Seller ID:", currentSellerId);

        // Get seller orders
        const ordersRes = await axios.get('/api/orders/seller', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Raw orders:", ordersRes.data);

        // Filter seller items
        const filteredOrders = ordersRes.data
          .map(order => {
            const sellerItems = order.items.filter(item =>
              item.productId?.seller?.toString() === currentSellerId
            );

            if (sellerItems.length === 0) return null;

            const sellerTotal = sellerItems.reduce(
              (sum, item) =>
                sum + item.quantity * item.price,
              0
            );

            return {
              ...order,
              sellerItems,
              sellerTotal
            };
          })
          .filter(Boolean);

        setOrders(filteredOrders);

      } catch (err) {
        console.error(err);

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          setError("Accès réservé aux vendeurs");
          navigate('/');
        } else {
          setError(
            "Erreur lors du chargement de vos commandes"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [navigate]);

  // =======================
  // LOADING
  // =======================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-tm-teal mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Chargement de vos commandes...
          </p>
        </div>
      </div>
    );
  }

  // =======================
  // ERROR
  // =======================
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-8">
          Erreur
        </h1>
        <p className="text-xl mb-10">{error}</p>

        <button
          onClick={() => navigate('/')}
          className="bg-tm-teal text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-tm-teal/90"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // =======================
  // UI
  // =======================
  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-12 text-center brand-gradient">
        Mes Commandes Clients
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-inner">
          <div className="text-6xl mb-6">📦</div>

          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            Aucune commande pour vos produits
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Dès qu'un client commande l'un de vos produits,
            elle apparaîtra ici avec vos articles uniquement.
          </p>

          <button
            onClick={() => navigate('/seller-dashboard')}
            className="bg-tm-teal text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-tm-teal/90 transition shadow-lg"
          >
            Retour au tableau de bord vendeur
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map(order => (
            <div
              key={order._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border hover:shadow-2xl transition-shadow"
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">
                    Commande #{order._id.slice(-8).toUpperCase()}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(
                      order.createdAt
                    ).toLocaleString('fr-TN')}
                  </p>
                </div>

                <span className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-200">
                  {order.status}
                </span>
              </div>

              {/* CLIENT */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    Client
                  </h3>
                  <p>
                    {order.userId?.name} (
                    {order.userId?.email})
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Livraison
                  </h3>
                  <p>
                    Tél: {order.shippingAddress?.phone}
                  </p>
                  <p>
                    {order.shippingAddress?.address},{" "}
                    {order.shippingAddress?.city}
                  </p>
                </div>
              </div>

              {/* PRODUCTS */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">
                  Vos produits
                </h3>

                {order.sellerItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 pb-4 border-b"
                  >
                    <img
                      src={
                        item.productId?.image ||
                        "/assets/logo.png"
                      }
                      alt={item.productId?.title}
                      className="w-24 h-24 object-cover rounded"
                    />

                    <div className="flex-1">
                      <p className="font-medium text-lg">
                        {item.productId?.title}
                      </p>

                      <p>
                        {item.quantity} ×{" "}
                        {item.price.toFixed(2)} TND
                      </p>
                    </div>

                    <div className="font-bold text-lg">
                      {(
                        item.quantity * item.price
                      ).toFixed(2)}{" "}
                      TND
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="mt-6 text-xl font-bold flex justify-between">
                <span>Total vendeur</span>
                <span>
                  {order.sellerTotal.toFixed(2)} TND
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
