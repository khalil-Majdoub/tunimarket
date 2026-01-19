import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthModal({ onClose, onSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isSignup ? '/api/auth/register' : '/api/auth/login';
    const data = isSignup 
      ? { name: formData.name, email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password };

    try {
      const res = await axios.post(url, data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  // Handle Google success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post('/api/auth/google', {
        token: credentialResponse.credential
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError('Erreur connexion Google');
    }
  };

  const handleGoogleError = () => {
    setError('Échec connexion Google');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignup ? 'Créer un compte' : 'Se connecter'}
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Google Login */}
        <div className="mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            text={isSignup ? "signup_with" : "signin_with"}
            shape="rectangular"
            theme="filled_black"
            size="large"
            width="100%"
          />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              ou
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Nom complet</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1 text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
            />
          </div>

          <button type="submit" className="w-full bg-tm-teal text-white py-3 rounded-lg font-medium hover:bg-tm-teal/90 transition">
            {isSignup ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          {isSignup ? 'Déjà un compte ?' : 'Pas de compte ?'}{' '}
          <button 
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-tm-teal hover:underline font-medium"
          >
            {isSignup ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </div>
    </div>
  );
}