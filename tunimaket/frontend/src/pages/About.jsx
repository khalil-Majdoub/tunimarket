// New frontend/src/pages/About.jsx
import React from 'react';
import Footer from '../components/Footer';

export default function About() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">About TuniMarket</h1>
      <p className="text-lg mb-4">TuniMarket is a platform for small businesses in Tunisia to sell their products online. We provide delivery, customer support, and more to make selling easy.</p>
      {/* Add more content */}
      <Footer />
    </div>
  );
}