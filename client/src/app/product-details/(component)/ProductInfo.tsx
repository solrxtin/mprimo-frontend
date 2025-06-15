"use client";

import type React from "react";



import { useState, useCallback } from "react";
import { Star, Heart, MessageCircle, X } from 'lucide-react';
import { BidModal1 } from "@/components/BidModal";

const ProductInfo: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const productImages = [
    '/api/placeholder/600/400',
    '/api/placeholder/600/400',
    '/api/placeholder/600/400',
    '/api/placeholder/600/400',
    '/api/placeholder/600/400'
  ];

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Burgundy', value: '#7C2D12' }
  ];

  const paymentMethods = [
    { name: 'Visa', color: 'bg-blue-600' },
    { name: 'Mastercard', color: 'bg-red-500' },
    { name: 'Discover', color: 'bg-gray-700' },
    { name: 'Amex', color: 'bg-gray-500' },
    { name: 'Diners', color: 'bg-purple-600' },
    { name: 'JCB', color: 'bg-blue-700' },
    { name: 'Maestro', color: 'bg-red-600' }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={`${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="md:px-[42px] lg:px-[80px] px-4  mt-8 md:mt-10 lg:mt-14  ">
    <div className=" p-3 md:p-5 lg:p-6   border border-[#ADADAD4D]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images Section */}
        <div className="space-y-4">
          {/* Main Image */}

           <div
          className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg  h-48 md:h-64 lg:h-96 flex items-center justify-center overflow-hidden`}
        >
          <img
            src="https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=400&fit=crop"
              alt="Samsung 98 inch TV"
            className={` h-28 sm:h-36 md:h-52 lg:h-64
                group-hover:scale-105 transition-transform duration-300`}
          />
        </div>

          
          {/* Thumbnail Images */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === i ? 'border-orange-400' : 'border-gray-200'
                }`}
              >
                <img
                  src={i === 0 
                    ? "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=80&h=60&fit=crop"
                    : i === 1
                    ? "https://images.unsplash.com/photo-1571901850049-d8536d6c4f6e?w=80&h=60&fit=crop"
                    : i === 2
                    ? "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=80&h=60&fit=crop"
                    : i === 3
                    ? "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=80&h=60&fit=crop"
                    : "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=80&h=60&fit=crop"
                  }
                  alt={`TV view ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex">
              {renderStars(4.7)}
            </div>
            <span className="text-sm font-medium text-gray-700">4.7 Seller Star Rating</span>
          </div>

          {/* Product Title */}
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
            Samsung 98 inch Crystal UHD DU9000 4k Tizen OS Smart TV 2024 - Black, 98
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
            Samsung 98 inch Crystal Smart TV delivers stunning, vibrant visuals with smart connectivity, 
            providing an immersive home entertainment experience for you and your family.
          </p>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex gap-1">
                <span className="text-gray-600">Seller:</span>
                <span className="text-blue-600 font-medium">Mr Johnson Ebuka</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-600">Category:</span>
                <span className="text-blue-600 font-medium">TV</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-600">Quantity Left:</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-600">Total offers:</span>
                <span className="text-blue-600 font-medium">17 Offers</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-1">
                <span className="text-gray-600">Brand:</span>
                <span className="text-blue-600 font-medium">Samsung</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-600">Sale Method:</span>
                <span className="text-blue-600 font-medium">Auction</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-600">Business Kind:</span>
                <span className="font-medium">Wholesale</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-gray-600">Colour:</span>
                <div className="flex gap-1">
                  {colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(index)}
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedColor === index ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.value }}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Price and Wishlist */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">₦1,700,000</div>
              <div className="text-xs md:text-sm text-gray-500">Buy now</div>
            </div>
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart
                size={24}
                className={`${
                  isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'
                } transition-colors`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 bg-white border-2 border-orange-300 text-orange-300 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
              {/* <MessageCircle size={20} /> */}
              Message
            </button>
            <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Buy Now
            </button>
            <button className="flex-1 bg-orange-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-500 transition-colors">
              Add To Cart
            </button>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">
              100% Guarantee Safe and Easy Checkout
            </div>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method, index) => (
                <div
                  key={index}
                  className={`${method.color} w-8 h-6 rounded text-xs text-white flex items-center justify-center font-bold`}
                  title={method.name}
                >
                  {method.name.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
<BidModal1 isBid={true} closeBid={()=>{}}/>

   

    </div>
  );
};

export default ProductInfo;