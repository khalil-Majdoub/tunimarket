import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Slider from 'react-slick';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);

  useEffect(() => {
    axios.get('/api/products')
      .then(res => {
        const allProducts = res.data;
        setProducts(allProducts);

        // Sort by sales for best sellers (top 5)
        const sortedBest = allProducts
          .sort((a, b) => (b.sales || 0) - (a.sales || 0))
          .slice(0, 5);
        setBestSellers(sortedBest);

        // Random 8 for discover more
        setRandomProducts(allProducts.sort(() => 0.5 - Math.random()).slice(0, 8));
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setProducts([]);
      });
  }, []);

  // Carousel settings – THIS WAS MISSING!
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000, // Change every 3 seconds
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <div className="space-y-16">
      {/* Carousel for Best Sellers */}
      <section>
        <h2 className="text-4xl font-bold text-center mb-8 brand-gradient">
          Best Sellers This Week
        </h2>
        {bestSellers.length > 0 ? (
          <Slider {...carouselSettings}>
            {bestSellers.map(product => (
              <div key={product._id} className="px-4">
                <ProductCard product={product} />
              </div>
            ))}
          </Slider>
        ) : (
          <p className="text-center text-gray-500">Loading best sellers...</p>
        )}
      </section>

      {/* Welcome Header */}
      <header className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold brand-gradient mb-4">
          Welcome to TuniMarket
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Discover amazing products from local Tunisian businesses. We handle delivery and support!
        </p>
      </header>

      {/* Discover More */}
      <section>
        <h2 className="text-4xl font-bold text-center mb-8">Discover More</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {randomProducts.length > 0 ? (
            randomProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">No products found</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}