import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Checkout() {
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    prenom: '', nom: '', societe: '', tva: '', adresse: '', complement: '', codePostal: '', ville: '', telephone: '',
  });
  const [useForBilling, setUseForBilling] = useState(true);

  useEffect(() => {
    // Load Google Maps script (add your API key in .env as VITE_GOOGLE_MAPS_API_KEY)
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);

    // Auto-detect location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        if (data.results[0]) {
          const addr = data.results[0].formatted_address;
          setAddress(prev => ({ ...prev, adresse: addr }));
        }
      });
    }
  }, []);

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock submit: Alert success, clear cart, navigate home
    alert('Order placed with payment on delivery!');
    // axios.post('/api/orders', { address, useForBilling, payment: 'on_delivery' }); // Add in prod
    navigate('/');
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Paiement</h1>
      <p className="mb-4">L'adresse sélectionnée sera utilisée à la fois comme adresse personnelle (pour la facturation) et comme adresse de livraison.</p>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <label>Prénom *</label>
        <input name="prenom" value={address.prenom} onChange={handleChange} required className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Nom *</label>
        <input name="nom" value={address.nom} onChange={handleChange} required className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Société</label>
        <input name="societe" value={address.societe} onChange={handleChange} className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Numéro de TVA</label>
        <input name="tva" value={address.tva} onChange={handleChange} className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Adresse *</label>
        <input name="adresse" value={address.adresse} onChange={handleChange} required className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Complément d'adresse</label>
        <input name="complement" value={address.complement} onChange={handleChange} className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Code postal *</label>
        <input name="codePostal" value={address.codePostal} onChange={handleChange} required className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Ville *</label>
        <input name="ville" value={address.ville} onChange={handleChange} required className="w-full mb-4 px-4 py-2 rounded border" />
        
        <label>Téléphone *</label>
        <input name="telephone" value={address.telephone} onChange={handleChange} required className="w-full mb-4 px-4 py-2 rounded border" />
        
        <div className="mb-4">
          <input type="checkbox" checked={useForBilling} onChange={() => setUseForBilling(!useForBilling)} />
          <label className="ml-2">Utiliser aussi cette adresse pour la facturation</label>
        </div>
        
        <p className="mb-4">Méthode de paiement: Paiement à la livraison</p>
        
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded border border-gray-300">Annuler</button>
          <button type="submit" className="btn-primary">Confirmer</button>
        </div>
      </form>
      <Footer />
    </div>
  );
}