// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext'; // We'll create this next

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider> {/* Wraps the entire app with auth context */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#1f2937',     // dark bg for dark mode
          color: '#f3f4f6',
          border: '1px solid #374151',
          padding: '16px',
          maxWidth: '400px',
        },
        success: {
          style: {
            background: '#10b981',
            color: 'white',
          },
        },
        error: {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        },
      }}
    />
  </React.StrictMode>
);