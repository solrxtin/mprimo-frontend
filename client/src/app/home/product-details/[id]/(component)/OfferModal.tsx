"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { ProductType } from "@/types/product.type";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productData: ProductType;
  onSubmitOffer: (amount: number, optionId: string, variantId: string) => void;
  isSubmitting: boolean;
  selectedOptionId: string;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  productData,
  onSubmitOffer,
  isSubmitting,
  selectedOptionId,
}) => {
  const [offerAmount, setOfferAmount] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedOptionIdState, setSelectedOptionIdState] = useState<string>(selectedOptionId || "");
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);

  if (!isOpen) return null;

  const priceInfo = (productData as any)?.priceInfo;
  const currencySymbol = priceInfo?.currencySymbol || "₦";
  const exchangeRate = priceInfo?.exchangeRate || 1;

  // Get selected variant and option
  const selectedVariant = productData?.variants?.find(v => v._id === selectedVariantId);
  const selectedOption = selectedVariant?.options?.find(o => o._id === selectedOptionIdState);
  
  // Calculate price: (salePrice or price) * exchangeRate
  const optionPrice = selectedOption?.salePrice || selectedOption?.price || 0;
  const currentPrice = optionPrice * exchangeRate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(offerAmount);
    if (amount > 0 && selectedVariantId && selectedOptionIdState) {
      onSubmitOffer(amount, selectedOptionIdState, selectedVariantId);
    }
  };

  const handleVariantSelect = (variantId: string, optionId: string) => {
    setSelectedVariantId(variantId);
    setSelectedOptionIdState(optionId);
    setShowVariantDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Make an Offer</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={productData?.images?.[0]}
              alt={productData?.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h3 className="font-medium text-sm">{productData?.name}</h3>
              <p className="text-gray-600 text-sm">
                Current Price: {currencySymbol}{currentPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Variant Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Variant
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400"
                disabled={isSubmitting}
              >
                <span className="text-sm">
                  {selectedVariant && selectedOption
                    ? `${selectedVariant.name}: ${selectedOption.value}`
                    : "Select a variant"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showVariantDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {productData?.variants?.map((variant) =>
                    variant.options?.map((option) => (
                      <button
                        key={`${variant._id}-${option._id}`}
                        type="button"
                        onClick={() => handleVariantSelect(variant._id!, option._id!)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center"
                      >
                        <span>{variant.name}: {option.value}</span>
                        <span className="text-gray-600">
                          {currencySymbol}{((option.salePrice || option.price || 0) * exchangeRate).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Offer Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your best offer for this item
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !offerAmount || parseFloat(offerAmount) <= 0 || !selectedVariantId || !selectedOptionIdState}
            >
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferModal;