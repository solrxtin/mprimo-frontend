import StarRating from '@/app/vendor/dashboard/products/create-product/(component)/StarRating';
import { Heart } from 'lucide-react';
import React, { useState } from 'react'


interface Product {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount: number;
  condition: "Brand New" | "Used" | "Refurbished";
  category: "Wholesale" | "Personal";
  description?: string;
}
const ProductCard = ({
  product,
  isLarge = false,
}: {
  product: Product;
  isLarge?: boolean;
}) => {
  const [isLiked, setIsLiked] = useState(false);

  const formatPrice = (price: number) => {
    return `₦ ${price.toLocaleString()}`;
  };

  return (
    <div
      className={`group bg-gradient-to-br from-gray-100 to-gray-200 rounded-md shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        isLarge ? "p-4 md:p-6" : "p-2 md:p-3"
      } border border-[#ADADAD4D] relative`}
    >
      {/* Discount Badge */}
      {product.discount > 0 && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-yellow-400 text-black px-2 py-1 rounded text-xs sm:text-sm font-normal z-10">
          -{product.discount}%
        </div>
      )}

      <div className="relative mb-3 sm:mb-4">
        <div
          className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${
            isLarge ? "h-48 sm:h-64" : "h-24 md:h-34"
          } flex items-center justify-center overflow-hidden`}
        >
          <img
            src={product.image}
            alt={product.name}
            className={`${
              isLarge
                ? " h-14 sm:h-20 md:h-46 lg:h-52"
                : " h-14 sm:h-20 md:h-36 lg:h-32"
            }  group-hover:scale-105 transition-transform duration-300`}
          />
        </div>

        {/* Heart Icon */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Heart
            size={16}
            className={`sm:w-[18px] sm:h-[18px] ${
              isLiked ? "fill-red-500 text-red-500" : "text-gray-400"
            } transition-colors duration-200`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {!isLarge && (
          <StarRating
            rating={product.rating}
            maxRating={product.reviewCount}
          />
        )}

        <h3
          className={`font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors ${
            isLarge ? "text-sm mg:text-lg mb-2 sm:mb-4" : "text-sm sm:text-base"
          }`}
        >
          {product.name}{" "}
          {!isLarge && (
            <span className={`text-xs pl-1 text-gray-400 font-normal  `}>
              {product.condition}
            </span>
          )}
        </h3>

        {isLarge && (
          <>
            <div className="flex items-center">
              {" "}
              <StarRating
                rating={product.rating}
                maxRating={product.reviewCount}
              />{" "}
              <span
                className={`text-xs pl-1 text-gray-400 font-normal hidden lg:block  `}
              >
                {product.condition}
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 hidden sm:block">
              {product.description}
            </p>
          </>
        )}

        {/* <div className="flex items-center gap-2 mb-2 sm:mb-3">
         
        </div> */}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <span
              className={`font-bold text-gray-900 ${
                isLarge ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs sm:text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 sm:px-3 py-1 rounded-full ${
                product.category === "Wholesale"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {product.category}
            </span>
          </div>
        </div>

        {isLarge && (
          <button className="w-full mt-3 sm:mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 transform hover:scale-105">
            View Details
          </button>
        )}
      </div>
    </div>
  );
};


export default ProductCard