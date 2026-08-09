// New frontend/src/pages/Dashboard.jsx - Simple dashboard for sellers
import React from 'react';
import { Navigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Dashboard({ isLoggedIn }) {
  if (!isLoggedIn) return <Navigate to="/" />;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Seller Dashboard</h1>
      <p className="text-lg mb-4">Manage your products, view sales, and more.</p>
      {/* Add dashboard features: product list, add product form, etc. */}
      <Footer />
    </div>
  );
}