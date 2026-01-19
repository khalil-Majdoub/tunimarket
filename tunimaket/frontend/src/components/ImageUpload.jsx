import React, { useState } from 'react';

export default function ImageUpload({ onImageUpload, initialImage = '' }) {
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'tunimarket_preset'); // Create this preset in Cloudinary

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload`, // Replace YOUR_CLOUD_NAME
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        onImageUpload(data.secure_url); // Send URL to parent (form)
      } else {
        alert('Erreur lors de l\'upload');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion à Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div>
        <label className="block mb-2 font-medium">
          {imageUrl ? 'Changer l\'image' : 'Ajouter une image'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 border rounded dark:bg-gray-700"
        />
        {uploading && <p className="text-tm-teal mt-2">Téléchargement en cours...</p>}
      </div>
    </div>
  );
}