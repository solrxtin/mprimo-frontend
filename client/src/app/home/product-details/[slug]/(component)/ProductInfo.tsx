"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { Star, Heart, X } from "lucide-react";
import { BidModal1 } from "@/components/BidModal";
import { ProductType } from "@/types/product.type";
import { NumericFormat } from "react-number-format";
import { useCartStore } from "@/stores/cartStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";

type ProductInfoProps = {
  productData: ProductType;
};

const ProductInfo: React.FC<ProductInfoProps> = ({ productData }) => {
  const { addToCart, isLoading } = useCartStore();
  const { openModal } = useAuthModalStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
    const [quantity, setQuantity] = useState(1);

  const [selectedVariant, setSelectedVariant] = useState<
    ProductType["variants"][0] | undefined
  >(productData?.variants?.[0]);

  const [selectedOptions, setSelectedOptions] = useState<{
    [variantId: string]: string;
  }>(() => {
    const initial: { [variantId: string]: string } = {};
    productData?.variants?.forEach((variant) => {
      const defaultOption =
        variant.options.find((opt) => opt.isDefault) || variant.options[0];
      if (defaultOption)
        initial[variant.id || variant._id] =
          defaultOption.id || defaultOption._id;
    });
    return initial;
  });

  useEffect(() => {
    // Reset selected options when productData changes
    const initial: { [variantId: string]: string } = {};
    productData?.variants?.forEach((variant) => {
      const defaultOption =
        variant.options.find((opt) => opt.isDefault) || variant.options[0];
      if (defaultOption)
        initial[variant.id || variant._id] =
          defaultOption.id || defaultOption._id;
    });
    setSelectedOptions(initial);
  }, [productData]);

  useEffect(() => {
    setSelectedVariant(productData?.variants?.[0]);
  }, [productData]);

  const getSelectedOption = (variant: any) => {
    const optionId = selectedOptions[variant.id || variant._id];
    return variant.options.find((opt: any) => (opt.id || opt._id) === optionId);
  };

    const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };


  const saleType = productData?.inventory?.listing?.type;
  const acceptOffer = productData?.inventory?.listing?.instant?.acceptOffer;
 const handleAddToCart = async () => {
    if (!productData) return;

    // If there are variants, build the selectedVariant object for the first variant
    let selectedVariantObj;
    if (productData.variants && productData.variants.length > 0) {
      const variant = productData.variants[0];
      const optionId = selectedOptions[variant.id || variant._id];
      const option = variant.options.find(
        (opt: any) => (opt.id || opt._id) === optionId
      );
      if (option) {
        selectedVariantObj = {
          variantId: variant.id || variant._id,
          optionId: option.id || option._id,
          variantName: variant.name,
          optionValue: option.value,
          price: option.price,
        };
      }
    }

    await addToCart(productData, quantity, selectedVariantObj);
  };

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
    <div className="md:px-[42px] lg:px-[80px] px-4  mt-8 md:mt-10 lg:mt-14  ">
      <div className=" p-3 md:p-5 lg:p-6   border border-[#ADADAD4D]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images Section */}
          <div className="space-y-4">
            <div
              className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg  h-48 md:h-64 lg:h-96 flex items-center justify-center overflow-hidden`}
            >
              <img
                src={productData?.images?.[0] || ""}
                alt={productData?.name}
                className={` h-28 sm:h-36 md:h-52 lg:h-64
                group-hover:scale-105 transition-transform duration-300`}
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {productData?.images && productData.images.length > 1 &&
                productData.images
                  .slice(1)
                  .map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === i ? "border-primary" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={item}
                        alt={productData?.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(productData?.rating || 0)}</div>
              <span className="text-sm font-medium text-gray-700">
                {productData?.rating} Seller Star Rating
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
              {productData?.name}
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
              {productData?.description}
            </p>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex gap-1">
                  <span className="text-gray-600">Seller:</span>
                  <span className="text-blue-600 font-medium">
                    Mr Johnson Ebuka
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-blue-600 font-medium">
                    {productData?.category?.sub.length > 0
                      ? productData?.category?.sub[
                          productData.category.sub?.length - 1
                        ]?.name
                      : productData?.category?.main?.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-600">Quantity Left:</span>
                  <span className="font-medium">
                    {productData?.inventory?.listing?.type === "instant"
                      ? productData?.inventory?.listing?.instant?.quantity
                      : productData?.inventory?.listing?.auction?.quantity}{" "}
                  </span>
                </div>
                {saleType === "instant" && acceptOffer && (
                  <div className="flex gap-1">
                    <span className="text-gray-600">Total offers:</span>
                    <span className="text-blue-600 font-medium">
                      {productData?.offers?.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-1">
                  <span className="text-gray-600">Brand:</span>
                  <span className="text-blue-600 font-medium">
                    {productData?.brand}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-600">Sale Method:</span>
                  <span className="text-blue-600 font-medium">
                    {productData?.inventory?.listing?.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-600">Business Kind:</span>
                  <span className="font-medium">Wholesale</span>
                </div>
                <div className="flex gap-1">
                  {productData?.variants?.map((variant) => (
                    <div
                      className="flex gap-2 items-center mb-2"
                      key={variant.id || variant._id}
                    >
                      <span className="text-gray-600">{variant.name}:</span>
                      <select
                        className="border rounded px-2 py-1"
                        value={selectedOptions[variant.id || variant._id] || ""}
                        onChange={(e) => {
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [variant.id || variant._id]: e.target.value,
                          }));
                        }}
                      >
                        {variant.options.map((option: any) => (
                          <option
                            value={option.id || option._id}
                            key={option.id || option._id}
                          >
                            {option.value}{" "}
                            {option.price ? `- ₦${option.price}` : ""}
                          </option>
                        ))}
                      </select>
                      {/* Optionally show price or other info */}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price and Wishlist */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                  {saleType === "instant" ? (
                    <NumericFormat
                      value={selectedVariant?.options[0]?.salePrice}
                      displayType={"text"}
                      thousandSeparator={true}
                      prefix={"₦"}
                      decimalScale={2}
                      fixedDecimalScale={true}
                    />
                  ) : (
                    <NumericFormat
                      value={selectedVariant?.options[0]?.price}
                      displayType={"text"}
                      thousandSeparator={true}
                      prefix={"₦"}
                      decimalScale={2}
                      fixedDecimalScale={true}
                    />
                  )}
                </div>
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
                    isFavorited ? "text-red-500 fill-current" : "text-gray-400"
                  } transition-colors`}
                />
              </button>
            </div>

              {/* Quantity Selector */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gray-600">Quantity:</span>
              <button
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100"
                onClick={handleDecrease}
                aria-label="Decrease quantity"
                type="button"
              >
                -
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100"
                onClick={handleIncrease}
                aria-label="Increase quantity"
                type="button"
              >
                +
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
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 bg-orange-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Add To Cart'}
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
    </div>
  );
};

export default ProductInfo;
