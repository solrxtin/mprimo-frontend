"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { Star, Heart, X, MessageSquare } from "lucide-react";
import { BidModal1 } from "@/components/BidModal";
import { ProductType, VariantType } from "@/types/product.type";
import { NumericFormat } from "react-number-format";
import { useCartStore } from "@/stores/cartStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWishlist } from "@/hooks/useWishlist";
import Wishlist from "@/components/client-component/Wishlist";
import SocketService from "@/utils/socketService";
import { useRouter } from "next/navigation";

export const AuctionCountdown = ({ auction }: { auction: any }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const startTime = new Date(auction.startTime).getTime();
      const endTime = new Date(auction.endTime).getTime();

      if (!auction.isStarted) {
        const diff = startTime - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Starts in ${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft("Auction starting...");
        }
      } else if (!auction.isExpired) {
        const diff = endTime - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Ends in ${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft("Auction ended");
        }
      } else {
        setTimeLeft("Auction ended");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  return (
    <div className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
      {timeLeft}
    </div>
  );
};

type ProductInfoProps = {
  productData: ProductType;
};

const ProductInfo: React.FC<ProductInfoProps> = ({ productData }) => {
  const { addToCart, isLoading } = useCartStore();
  const { openModal } = useAuthModalStore();
  const { user } = useUserStore();
  const router = useRouter();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isAddingToWishlist,
  } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [selectedVariant, setSelectedVariant] = useState<
    VariantType | undefined
  >(undefined);

  const [selectedOptions, setSelectedOptions] = useState<{
    [variantId: string]: string;
  }>({});
  const [isJoiningChat, setIsJoiningChat] = useState(false);

  useEffect(() => {
    if (productData?.variants) {
      const initial: { [variantId: string]: string } = {};
      productData.variants.forEach((variant) => {
        const firstOption = variant.options[0];
        if (firstOption) {
          initial[variant.id || variant._id] =
            firstOption.id || firstOption._id;
        }
      });
      setSelectedOptions(initial);
    }
  }, [productData]);

  useEffect(() => {
    if (productData?.variants && productData.variants.length > 0) {
      setSelectedVariant(productData.variants[0]);
    }
  }, [productData]);

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      const socket = SocketService.connect(user._id);
      socket.emit("authenticate", { userId: user._id });
    }
  }, [user?._id]);

  const getSelectedOption = (variant: any) => {
    const optionId = selectedOptions[variant.id || variant._id];
    return variant.options.find((opt: any) => (opt.id || opt._id) === optionId);
  };

  const getSelectedOptionPrice = () => {
    if (!productData?.variants?.[0]) return 0;
    const variant = productData.variants[0];
    const optionId = selectedOptions[variant.id || variant._id];
    const option = variant.options.find(
      (opt: any) => (opt.id || opt._id) === optionId
    );
    return option?.displayPrice || option?.price || 0;
  };

  const getSelectedOptionCurrency = () => {
    if (!productData?.variants?.[0]) return "₦";
    const variant = productData.variants[0];
    const optionId = selectedOptions[variant.id || variant._id];
    const option = variant.options.find(
      (opt: any) => (opt.id || opt._id) === optionId
    );
    return option?.currencySymbol || "₦";
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  let totalQuantity;
  if (productData?.variants && productData?.variants.length > 0) {
    const variants = productData.variants;

    totalQuantity = variants.reduce((sum, variant) => {
      return (
        sum +
        variant.options.reduce(
          (optionSum, option) => optionSum + option.quantity,
          0
        )
      );
    }, 0);
  }

  let totalUserOffers;
  if (productData?.offers && productData.offers?.length > 0) {
    totalUserOffers = productData.offers.reduce((count, offerGroup) => {
      return count + offerGroup.userOffers.length;
    }, 0);
  }

  const saleType = productData?.inventory?.listing?.type;
  const acceptOffer = productData?.inventory?.listing?.instant?.acceptOffer;
  const auction = productData?.inventory?.listing?.auction;
  const handleMessageSeller = async () => {
    if (!user) {
      openModal();
      return;
    }

    setIsJoiningChat(true);
    const socket = SocketService.getSocket();
    if (socket) {
      const payload = {
        userId: user._id,
        chatId: null, // Will create new chat if doesn't exist
        product: productData,
      };

      socket.emit("join-chat", payload);

      // Listen for chat-joined event
      socket.once("chat-joined", ({ chatId }) => {
        // Store chatId in localStorage for messages page to pick up
        localStorage.setItem("focusedChatId", chatId);
        // Navigate to messages page
        router.push("/home/user/messages");
        setIsJoiningChat(false);
      });
    }
  };

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

  const handleBuyNow = async () => {

  }

  const handlePlaceBidClicked = async () => {
    router.push(`/home/auction/${productData._id}`);
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Product Images Section */}
          <div className="space-y-4 lg:col-span-2">
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-64 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden border border-gray-200">
              <img
                src={
                  productData?.images?.[selectedImage] ||
                  productData?.images?.[0]
                }
                alt={productData?.name}
                className="max-h-full max-w-full object-cover p-3 hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 right-4">
                <Wishlist
                  productData={productData}
                  price={
                    selectedVariant?.options?.[0]?.salePrice ||
                    selectedVariant?.options?.[0]?.price ||
                    0
                  }
                  user={user}
                />
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-3 overflow-x-auto pb-2 mt-8">
              {productData?.images?.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === i
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
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

          <div className="space-y-4 lg:space-y-6 lg:col-span-3">
            <div className="flex items-center gap-2">
              <div className="flex">
                {renderStars(productData?.rating || 0)}
              </div>
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
            <div className="space-y-3 border-b border-gray-400 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-blue-600 font-medium">
                    {productData?.category?.main?.name}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Quantity Left:</span>
                  <span className="font-medium">
                    {totalQuantity ? totalQuantity : 1}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Subcategory:</span>
                  <span className="text-blue-600 font-medium">
                    {
                      productData?.category?.sub[
                        productData?.category?.sub.length - 1
                      ]?.name
                    }
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Product ID:</span>
                  <span className="font-medium truncate">
                    {productData?._id}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Seller's Account Type:</span>
                  <span className="text-blue-600 font-medium">
                    {(productData?.vendorId as any)?.accountType
                      ?.charAt(0)
                      .toUpperCase() +
                      (productData?.vendorId as any)?.accountType?.slice(1)}
                  </span>
                </div>
                {productData?.inventory?.listing?.type === "auction" ? (
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Total Bids:</span>
                    <span className="font-medium">
                      {productData.bids ? productData.bids.length : 0}
                    </span>
                  </div>
                ) : acceptOffer &&
                  productData.offers &&
                  productData.offers.length > 0 ? (
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Total Offers:</span>
                    <span className="font-medium">{totalUserOffers}</span>
                  </div>
                ) : (
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Total View:</span>
                    <span className="font-medium">
                      {productData?.analytics?.views}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {productData?.inventory?.listing?.type !== "auction" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-4">
                  {productData?.variants?.map((variant) => (
                    <div key={variant.id || variant._id}>
                      <span className="text-gray-600 text-sm">
                        {variant.name}:
                      </span>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={selectedOptions[variant.id || variant._id] || ""}
                        onChange={(e) => {
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [variant.id || variant._id]: e.target.value,
                          }));
                        }}
                      >
                        {variant.options?.map((option: any) => (
                          <option
                            value={option.id || option._id}
                            key={option.id || option._id}
                          >
                            {option.value}{" "}
                            {option.displayPrice
                              ? `- ${option.currencySymbol}${option.displayPrice}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Quantity:</p>
                  <div className="flex items-center gap-3">
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
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* <button
                onClick={() => {
                  if (!user) {
                    openModal();
                    return;
                  }
                  const price =
                    selectedVariant?.options?.[0]?.salePrice ||
                    selectedVariant?.options?.[0]?.price ||
                    0;
                  if (isInWishlist(productData._id!)) {
                    removeFromWishlist(productData._id!);
                  } else {
                    addToWishlist({ productId: productData._id!, price });
                  }
                }}
                disabled={isAddingToWishlist}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                aria-label="Add to wishlist"
              >
                <Heart
                  size={24}
                  className={`${
                    isInWishlist(productData?._id!)
                      ? "text-red-500 fill-current"
                      : "text-gray-400"
                  } transition-colors`}
                />
              </button> */}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                {/* Price and Actions */}
                <div>
                  <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">
                    {saleType === "instant" ? (
                      <NumericFormat
                        value={getSelectedOptionPrice()}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={getSelectedOptionCurrency()}
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    ) : (
                      <NumericFormat
                        value={productData?.priceInfo?.displayPrice || 0}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={
                          (productData?.country as any)?.currencySymbol || "$"
                        }
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    Buy now
                  </div>
                </div>
                {productData?.inventory?.listing?.type !== "auction" && (
                  <div className="flex items-center gap-2">
                    <Wishlist
                      productData={productData}
                      price={
                        selectedVariant?.options?.[0]?.salePrice ||
                        selectedVariant?.options?.[0]?.price ||
                        0
                      }
                      user={user}
                    />
                    <span className="text-gray-600 text-sm">
                      Add to Wishlist
                    </span>
                  </div>
                )}
                {productData?.inventory?.listing?.type !== "auction" && (
                  <div className="flex items-center gap-2">
                    <div
                      onClick={isJoiningChat ? undefined : handleMessageSeller}
                      className={`p-2 rounded-sm hover:bg-orange-100 bg-orange-50 transition-colors ${
                        isJoiningChat
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5 text-orange-300" />
                    </div>
                    <span className="text-gray-600 text-sm">
                      Message Seller
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Auction Countdown */}
            {productData?.inventory?.listing?.type === "auction" && (
              <AuctionCountdown
                auction={productData.inventory.listing.auction}
              />
            )}

            {/* Action Buttons */}
            {productData?.inventory?.listing?.type !== "auction" ? (
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                <button
                  onClick={handleMessageSeller}
                  disabled={isJoiningChat}
                  className="bg-white border-2 border-orange-300 text-orange-300 px-4 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2 cursor-pointer"
                >
                  {isJoiningChat ? "Joining..." : "Message"}
                </button>
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors sm:col-span-3 cursor-pointer">
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="bg-orange-400 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2 cursor-pointer"
                >
                  {isLoading ? "Adding..." : "Add To Cart"}
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isLoading ||
                    productData.inventory.listing.auction?.isExpired
                  }
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors 
                    ${
                      isLoading ||
                      productData.inventory.listing.auction?.isExpired
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-orange-400 hover:bg-orange-500 cursor-pointer text-white"
                    }`}
                >
                  {isLoading ? "Adding..." : "Buy Now"}
                </button>

                <button
                  onClick={handlePlaceBidClicked}
                  disabled={
                    isLoading ||
                    productData.inventory.listing.auction?.isExpired ||
                    !productData.inventory.listing.auction?.isStarted
                  }
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors 
                  ${
                    isLoading ||
                    productData.inventory.listing.auction?.isExpired ||
                    !productData.inventory.listing.auction?.isStarted
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-blue-600 hover:bg-blue-700 cursor-pointer text-white"
                  }`}
                >
                  {isLoading ? "Bidding..." : "Place Bid"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
