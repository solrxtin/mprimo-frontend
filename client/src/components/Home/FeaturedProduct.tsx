import React, { useState } from "react";
import { Heart, Star, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { AllProduct } from "@/utils/config";
import { ProductType } from "@/types/product.type";
import Link from "next/link";

const navCategories = [
  "All Products",
  "Auction",
  "Furniture",
  "Offer",
  "Buy Now",
];

const StarRating = ({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) => {
  const safeRating = rating || 0;
  const safeReviewCount = reviewCount || 0;

  return (
    <div className="flex items-center gap-1 mb-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={`${
            index < Math.floor(safeRating)
              ? "fill-yellow-400 text-yellow-400"
              : index < safeRating
              ? "fill-yellow-200 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">
        ({safeReviewCount.toLocaleString()})
      </span>
    </div>
  );
};

const ProductCard = ({
  product,
  isLarge = false,
}: {
  product: ProductType;
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
      {/* {product.discount > 0 && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-yellow-400 text-black px-2 py-1 rounded text-xs sm:text-sm font-normal z-10">
          -{product.discount}%
        </div>
      )} */}

      <div className="relative mb-3 sm:mb-4">
        <div
          className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${
            isLarge ? "h-48 sm:h-64" : "h-24 md:h-34"
          } flex items-center justify-center overflow-hidden`}
        >
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className={`${
                isLarge
                  ? " h-14 sm:h-20 md:h-46 lg:h-52"
                  : " h-14 sm:h-20 md:h-36 lg:h-32"
              }  group-hover:scale-105 transition-transform duration-300`}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-200">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
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

      <Link
        href={{
          pathname: "/home/product-details/[slug]",
          query: {
            slug: product.slug,
            productData: JSON.stringify(product), // Pass full product data
          },
        }}
        as={`/home/product-details/${product.slug}`} // Clean URL in browser
        className=""
      >
        {!isLarge && (
          <StarRating
            rating={product.rating || 0}
            reviewCount={product?.reviews?.length || 0}
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
              <StarRating
                rating={product.rating || 0}
                reviewCount={product.reviews?.length || 0}
              />
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
              {product.inventory?.listing?.type === "instant"
                ? formatPrice(
                    product?.variants?.find((item) => item?.name === "Default")?.options?.[0]?.price ?? 0
                  )
                : ""}
            </span>
            {/* {product.inventory?.listing?.type === "instant" && (
              <span className="text-xs sm:text-sm text-gray-500 line-through">
                {formatPrice(product.inventory?.listing?.instant?.price ?? 0)}
              </span>
            )} */}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 sm:px-3 py-1 rounded-full ${
                product.category?.main?.name === "Wholesale"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {product?.category?.sub && product?.category?.sub.length > 0
                ? product?.category?.sub[product.category.sub?.length - 1]?.name
                : product?.category?.main?.name || "General"}
            </span>
          </div>
        </div>

        {isLarge && (
          <button className="w-full mt-3 sm:mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 transform hover:scale-105">
            View Details
          </button>
        )}
      </Link>
    </div>
  );
};

export default function FeaturedProducts() {
  const fetchAllProducts = async () => {
    const response = await fetchWithAuth(`${AllProduct}?page=1&limit=12`);
    if (!response.ok) {
      throw new Error("Failed to fetch featured products");
    }
    const data = await response.json();
    return data.products;
  };

  const {
    data: allProductData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: fetchAllProducts,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="md:px-[42px] lg:px-[80px] px-4 py-8 md:py-14 lg:py-18">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading featured products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="md:px-[42px] lg:px-[80px] px-4 py-8 md:py-14 lg:py-18">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Failed to load featured products
            </p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:px-[42px] lg:px-[80px] px-4 py-8 md:py-14 lg:py-18 ">
      {/* Header */}
      <div className="flex flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <h1 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
            Featured Products
          </h1>
        </div>
        {/* Navigation */}
        <div className="flex items-center gap-2">
          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center">
            {navCategories.map((category, index) => (
              <button
                key={category}
                className={`px-2 py-2 font-medium transition-colors ${
                  index === 0
                    ? "text-gray-900 border-b-2 border-yellow-500"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <Link href="/home/categories">
            <button className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Browse All Products
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      {allProductData.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-gray-600 mb-2">No featured products available</p>
            <p className="text-gray-500 text-sm">Check back later for new products</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {allProductData.map((product: ProductType) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
