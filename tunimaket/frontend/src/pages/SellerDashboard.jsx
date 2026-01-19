import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const navigate = useNavigate();

  const [isSeller, setIsSeller] = useState(null); // null = loading, false = not seller
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    image: '',
    stock: 10
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Cloudinary config (use your real values)
  const CLOUD_NAME = 'dqv1ron4b';
  const UPLOAD_PRESET = 'tunimarket_unsigned'; // ← Change ONLY if your preset name is different

  useEffect(() => {
    const checkSellerAndLoad = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Veuillez vous connecter');
        navigate('/');
        return;
      }

      try {
        // 1. Get current user to check isSeller
        const userRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!userRes.data.isSeller) {
          setIsSeller(false);
          setError('Accès réservé aux vendeurs. Contactez l\'administrateur pour devenir vendeur.');
          setLoading(false);
          return;
        }

        setIsSeller(true);

        // 2. Load seller's products
        const prodRes = await axios.get('/api/seller/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(prodRes.data);
      } catch (err) {
        console.error('Dashboard init error:', err);
        if (err.response?.status === 401) {
          alert('Session expirée');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        } else {
          setError('Erreur lors du chargement');
        }
      } finally {
        setLoading(false);
      }
    };

    checkSellerAndLoad();
  }, [navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Real Cloudinary image upload (client-side, unsigned preset)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', UPLOAD_PRESET); // Must match your preset name

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: data
        }
      );

      const result = await response.json();

      console.log('Cloudinary full response:', result); // Debug: check this in console!

      if (response.ok && result.secure_url) {
        setFormData(prev => ({ ...prev, image: result.secure_url }));
        alert('Image téléchargée avec succès !');
      } else {
        const errMsg = result.error?.message || 'Erreur inconnue';
        alert(`Erreur Cloudinary: ${errMsg}`);
        console.error('Cloudinary error details:', result);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Erreur de connexion à Cloudinary. Vérifiez votre connexion internet.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit form (add or update product)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!formData.title || !formData.price || !formData.image) {
      alert('Veuillez remplir les champs obligatoires : titre, prix, image');
      return;
    }

    try {
      if (editingId) {
        // Update
        await axios.put(`/api/seller/products/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create
        await axios.post('/api/seller/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Refresh product list
      const res = await axios.get('/api/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);

      // Reset form
      setFormData({ title: '', description: '', price: '', image: '', stock: 10 });
      setEditingId(null);
      alert(editingId ? 'Produit mis à jour !' : 'Produit ajouté avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'opération');
    }
  };

  // Load product for editing
  const handleEdit = (product) => {
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      image: product.image,
      stock: product.stock
    });
    setEditingId(product._id);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh list
      const res = await axios.get('/api/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
      alert('Produit supprimé');
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Vérification en cours...</div>;

  if (isSeller === false || error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-8">
          Accès Refusé
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-10">
          {error || 'Vous n\'êtes pas autorisé à accéder à cette page.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-tm-teal text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-tm-teal/90 transition"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-12 text-center brand-gradient">
        Tableau de bord Vendeur
      </h1>

      {/* Add / Edit Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold mb-10 text-center">
          {editingId ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Title */}
          <div>
            <label className="block mb-3 font-medium text-lg">Titre *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal transition"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block mb-3 font-medium text-lg">Prix (TND) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.1"
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal transition"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block mb-3 font-medium text-lg">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal transition"
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block mb-3 font-medium text-lg">Image du produit</label>

            {uploadingImage && (
              <div className="text-tm-teal text-center py-4">
                Téléchargement en cours... Ne fermez pas la page.
              </div>
            )}

            {formData.image && (
              <div className="mb-6">
                <img
                  src={formData.image}
                  alt="Aperçu du produit"
                  className="max-h-64 mx-auto rounded-xl shadow-lg object-contain border"
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-tm-teal file:text-white hover:file:bg-tm-teal/90 transition cursor-pointer"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block mb-3 font-medium text-lg">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-tm-teal transition"
            />
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 mt-10">
            <button
              type="submit"
              disabled={uploadingImage}
              className="flex-1 bg-gradient-to-r from-tm-teal to-tm-orange text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Mettre à jour le produit' : 'Ajouter le produit'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ title: '', description: '', price: '', image: '', stock: 10 });
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg transition"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* My Products List */}
      <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
        Mes Produits ({products.length})
      </h2>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Vous n'avez pas encore ajouté de produits.
          </p>
          <p className="text-lg mt-4 text-gray-500 dark:text-gray-400">
            Commencez en ajoutant votre premier produit ci-dessus !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="h-56 bg-gray-100 dark:bg-gray-700 relative">
                <img
                  src={product.image || 'https://via.placeholder.com/600x400?text=Pas+d\'image'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=Image+Manquante';
                  }}
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-bold mb-3 line-clamp-2">
                  {product.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm md:text-base">
                  {product.description || 'Aucune description'}
                </p>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl md:text-3xl font-extrabold text-tm-orange">
                    {product.price} TND
                  </span>
                  <span className="text-base md:text-lg font-medium text-gray-500 dark:text-gray-400">
                    Stock : {product.stock}
                  </span>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}