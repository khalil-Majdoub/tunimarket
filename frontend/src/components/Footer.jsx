// New frontend/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-8 px-4 md:px-8 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <img src="/assets/logo.png" alt="TuniMarket" className="h-12 mb-4" />
          <p className="text-sm">Empowering small businesses in Tunisia with easy selling and buying.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Links</h4>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-tm-teal">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-tm-teal">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Follow Us</h4>
          <div className="flex gap-4">
            <a href="#"><FaWhatsapp size={24} className="hover:text-tm-teal" /></a>
            <a href="#"><FaFacebook size={24} className="hover:text-tm-teal" /></a>
            <a href="#"><FaInstagram size={24} className="hover:text-tm-teal" /></a>
            <a href="#"><FaYoutube size={24} className="hover:text-tm-teal" /></a>
          </div>
        </div>
      </div>
      <p className="text-center text-sm mt-8">© 2026 TuniMarket. All rights reserved.</p>
    </footer>
  );
}