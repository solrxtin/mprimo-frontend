import React from 'react';

const ProductDetailsSkeleton = () => {
  return (
    <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Skeleton */}
        <div className="space-y-3">
          <div className="w-full h-72 bg-gray-200 rounded-xl animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-4">
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="flex gap-2 mb-3">
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Pricing Skeleton */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="flex items-center justify-between pt-3 border-t border-green-200">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Product Details Grid Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description Skeleton */}
      <div className="bg-blue-50 p-4 rounded-xl">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;