// New frontend/src/pages/SearchResults.jsx - Display search results
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query) {
      axios.get(`/api/products?query=${encodeURIComponent(query)}`)
        .then(res => setResults(res.data))
        .catch(() => setResults([]));
    }
  }, [query]);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Search Results for "{query}"</h1>
      {results.length === 0 ? (
        <p className="text-lg text-gray-600 dark:text-gray-300">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {results.map(product => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
      <Footer />
    </div>
  );
}