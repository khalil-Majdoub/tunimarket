import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthModal({ onClose, onSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Normal login / registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Phone is required only when registering
      if (isSignup && !formData.phone.trim()) {
        setError('Numéro de téléphone requis');
        setLoading(false);
        return;
      }

      const url = isSignup
        ? '/api/auth/register'
        : '/api/auth/login';

      const data = isSignup
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const res = await axios.post(url, data);

      // Store authentication data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Notify parent
      onSuccess(res.data.user);
      onClose();
    } catch (err) {
      console.error('Authentication error:', err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Une erreur est survenue'
      );
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setGoogleLoading(true);

    try {
      console.log('Google credential received');

      if (!credentialResponse?.credential) {
        throw new Error('Google credential manquante');
      }

      /*
       * The Vite proxy will forward:
       *
       * /api/auth/google
       *
       * to:
       *
       * http://localhost:5000/api/auth/google
       */
      const res = await axios.post('/api/auth/google', {
        credential: credentialResponse.credential,
      });

      console.log('Google authentication successful');

      // Store authentication data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Notify parent
      onSuccess(res.data.user);
      onClose();
    } catch (err) {
      console.error('Google authentication error:', err);

      if (err.response) {
        console.error('Backend response:', err.response.data);
        console.error('Backend status:', err.response.status);
      }

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Erreur lors de la connexion avec Google'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google login failed
  const handleGoogleError = () => {
    console.error('Google Login Failed');
    setError('Échec de la connexion avec Google');
  };

  // Switch between login and signup
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md relative shadow-xl">
        
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignup ? 'Créer un compte' : 'Se connecter'}
        </h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Google Login - Login mode only */}
        {!isSignup && (
          <div className="mb-6 w-full flex justify-center">
            {googleLoading ? (
              <div className="text-sm text-gray-500">
                Connexion avec Google...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                shape="rectangular"
                theme="filled_black"
                size="large"
                width="350"
              />
            )}
          </div>
        )}

        {/* Separator */}
        {!isSignup && (
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
        )}

        {/* Login / Signup form */}
        <form onSubmit={handleSubmit}>

          {/* Name - Signup only */}
          {isSignup && (
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block mb-1 text-sm font-medium"
              >
                Nom complet
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tm-teal"
              />
            </div>
          )}

          {/* Phone - Signup only */}
          {isSignup && (
            <div className="mb-4">
              <label
                htmlFor="phone"
                className="block mb-1 text-sm font-medium"
              >
                Téléphone
              </label>

              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
                placeholder="+216xxxxxxxx"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tm-teal"
              />
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="exemple@email.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tm-teal"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium"
            >
              Mot de passe
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-tm-teal"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tm-teal text-white py-3 rounded-lg font-medium hover:bg-tm-teal/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Chargement...'
              : isSignup
              ? "S'inscrire"
              : 'Se connecter'}
          </button>
        </form>

        {/* Switch login/signup */}
        <p className="text-center mt-6 text-sm">
          {isSignup ? 'Déjà un compte ?' : 'Pas de compte ?'}{' '}

          <button
            type="button"
            onClick={toggleMode}
            className="text-tm-teal hover:underline font-medium"
          >
            {isSignup ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </div>
    </div>
  );
}