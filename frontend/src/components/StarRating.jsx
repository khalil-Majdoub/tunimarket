import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function StarRating({ rating, onRate, interactive = false }) {
  const stars = [];

  // Full stars
  for (let i = 1; i <= Math.floor(rating); i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-yellow-400 text-2xl" />);
  }

  // Half star if needed
  if (rating % 1 >= 0.5) {
    stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 text-2xl" />);
  }

  // Empty stars to make 5 total
  const remaining = 5 - stars.length;
  for (let i = 1; i <= remaining; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300 text-2xl" />);
  }

  // Interactive version
  if (interactive) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            {star <= rating ? (
              <FaStar className="text-yellow-400 text-3xl" />
            ) : (
              <FaRegStar className="text-gray-300 text-3xl" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Read-only
  return <div className="flex gap-1">{stars}</div>;
}