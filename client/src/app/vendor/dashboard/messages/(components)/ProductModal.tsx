import React from 'react';
import { X } from 'lucide-react';
import { useFetchProductById } from '@/hooks/queries';
import ProductDetailsSkeleton from './ProductDetailsSkeleton';

interface ProductModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
}

const ProductModal = ({ isOpen, product, onClose }: ProductModalProps) => {
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  
  const {data: fetchedProduct, isLoading} = useFetchProductById(product?._id);

  React.useEffect(() => {
    if (fetchedProduct) {
      setSelectedProduct(fetchedProduct.product);
    }
  }, [fetchedProduct]);

  if (!isOpen || !product) return null;
  console.log("Product details:", product);

  // Get pricing from priceInfo for vendors (originalPrice and originalCurrency)
  const getPrice = () => {
    if (selectedProduct?.priceInfo) {
      return {
        price: selectedProduct.priceInfo.originalPrice,
        salePrice: selectedProduct.priceInfo.originalPrice,
        currency: selectedProduct.priceInfo.originalCurrency
      };
    }
    return {
      price: 0,
      salePrice: 0,
      currency: 'USD'
    };
  };

  const getStock = () => {
    if (product.variants?.length > 0) {
      return product.variants[0]?.options?.[0]?.quantity || 0;
    }
    return product.inventory?.listing?.instant?.quantity || 0;
  };

  const pricing = getPrice();
  const stock = getStock();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Product Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <ProductDetailsSkeleton />
        ) : (
        <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Images */}
            <div className="space-y-3">
              <img
                src={product.images?.[0] || '/placeholder.png'}
                alt={product.name}
                className="w-full h-72 object-cover rounded-xl shadow-lg"
              />
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.slice(1, 5).map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.name} ${idx + 2}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedProduct?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedProduct?.status || 'N/A'}
                  </span>
                  {selectedProduct?.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">{selectedProduct.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-200">
                <p className="text-sm text-gray-600 mb-2">Original Price</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-purple-600">
                    {pricing.currency} {pricing.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                  <span className="text-sm text-gray-600">Stock Available</span>
                  <span className={`text-lg font-bold ${
                    stock < 5 ? 'text-red-600' : stock < 20 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stock} units
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Brand</span>
                  <p className="text-sm font-semibold text-gray-900">{selectedProduct?.brand || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Condition</span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{selectedProduct?.condition || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Category</span>
                  <p className="text-sm font-semibold text-gray-900">{selectedProduct?.category?.main?.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">SKU</span>
                  <p className="text-sm font-semibold text-gray-900">{selectedProduct?.inventory?.sku || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {selectedProduct?.description && (
            <div className="bg-blue-50 p-4 rounded-xl">
              <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
              <p className="text-gray-700 text-sm leading-relaxed">{selectedProduct.description}</p>
            </div>
          )}

          

        </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;