// frontend/src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiStar, FiShoppingCart } from 'react-icons/fi';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
        setError('Produit non trouvé');
      } finally {
        setLoading(false);
      }
    };

    const checkFavorite = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get('/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorited(res.data.products.some(p => p._id === id));
      } catch (err) {
        console.warn('Wishlist check failed');
      }
    };

    fetchProduct();
    checkFavorite();
  }, [id]);

  const toggleFavorite = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Veuillez vous connecter');
      return;
    }

    const endpoint = isFavorited ? '/remove' : '/add';

    try {
      await axios.post(`/api/wishlist${endpoint}`, { productId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorited(!isFavorited);
    } catch (err) {
      alert('Erreur favoris');
    }
  };

  const addToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Veuillez vous connecter');
      return;
    }

    try {
      await axios.post('/api/cart/add', {
        productId: id,
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ajouté au panier !');
    } catch (err) {
      alert('Erreur ajout panier');
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (error || !product) return <div className="p-8 text-center text-red-600">{error || 'Produit introuvable'}</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 text-tm-teal hover:underline flex items-center gap-2"
      >
        ← Retour
      </button>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={product.image || '/assets/logo.png'}
            alt={product.title}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Details */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl font-extrabold text-tm-orange">
              {product.price} TND
            </span>
            <span className="text-xl text-gray-600 dark:text-gray-400">
              Stock : {product.stock}
            </span>
          </div>

          {/* Seller Name - SHOW HERE */}
          <p className="text-lg mb-6">
            Vendu par : <span className="font-bold text-gray-800 dark:text-gray-200">
              {product.seller?.name || 'Vendeur'}
            </span>
          </p>

          <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>

            <button
              onClick={addToCart}
              className="flex-1 bg-tm-teal hover:bg-tm-teal/90 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3"
            >
              <FiShoppingCart size={22} />
              Ajouter au panier
            </button>
          </div>

          <button
            onClick={toggleFavorite}
            className="w-full flex items-center justify-center gap-3 py-4 border-2 border-yellow-500 text-yellow-500 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition"
          >
            <FiStar size={24} className={isFavorited ? 'fill-yellow-500 text-yellow-500' : ''} />
            {isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>
        </div>
      </div>
    </div>
  );
}