import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

export default function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Veuillez vous connecter pour voir vos favoris');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('/api/wishlist', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setWishlistProducts(response.data.products || []);
      } catch (err) {
        console.error('Erreur wishlist:', err);
        if (err.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setError('Une erreur est survenue lors du chargement des favoris');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600 dark:text-gray-400 animate-pulse">
          Chargement de vos favoris...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center brand-gradient">
        Mes Favoris
      </h1>

      {error ? (
        <div className="text-center py-16">
          <p className="text-xl text-red-600 dark:text-red-400 mb-6">{error}</p>
          {!error.includes('connecter') && (
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez réessayer plus tard ou contacter le support.
            </p>
          )}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Votre liste de favoris est vide
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Cliquez sur l'étoile ♥ sur un produit pour l'ajouter ici !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {wishlistProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
}