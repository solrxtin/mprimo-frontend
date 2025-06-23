"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { Star, Heart, MessageCircle } from "lucide-react";
import ProductInfo from "./(component)/ProductInfo";
import Header from "@/components/Home/Header";
import ProductDetailsTabs from "./(component)/MoreDeatilsTab";
import ReviewsPage from "./(component)/Review";

const ProductPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const productImages = [
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
    "/api/placeholder/600/400",
  ];

  const colors = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#DC2626" },
    { name: "Blue", value: "#2563EB" },
    { name: "Burgundy", value: "#7C2D12" },
  ];

  const paymentMethods = [
    { name: "Visa", color: "bg-blue-600" },
    { name: "Mastercard", color: "bg-red-500" },
    { name: "Discover", color: "bg-gray-700" },
    { name: "Amex", color: "bg-gray-500" },
    { name: "Diners", color: "bg-purple-600" },
    { name: "JCB", color: "bg-blue-700" },
    { name: "Maestro", color: "bg-red-600" },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={`${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
            ? "text-yellow-400 fill-current opacity-50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
  <div className=" font-roboto">

      <ProductInfo />
      <ProductDetailsTabs/>
      <ReviewsPage />
    </div>
  );
};

export default ProductPage;
