"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Minus, Plus, X, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Home/Header";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { BidModal } from "@/components/BidModal";
import { useCartStore } from "@/stores/cartStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useCartSync } from "@/hooks/useCartSync";
import { useValidateCart } from "@/hooks/useCheckout";
import { CartValidationModal } from "@/components/CartValidationModal";
import { CartValidationResponse } from "@/utils/checkoutService";

export default function CartPage() {
  const {
    items: cartItem,
    summary: cartSummary,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,
  } = useCartStore();

  const { user } = useUserStore();
  const isLoggedIn = !!user;
  const { openModal } = useAuthModalStore();

  console.log("the carts", cartItem);

  useCartSync();

  useEffect(() => {
    if (isLoggedIn) {
      loadCart();
    }
  }, [isLoggedIn, loadCart]);

  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedAuctionItem, setSelectedAuctionItem] = useState<any>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationData, setValidationData] = useState<CartValidationResponse | null>(null);
  
  const { refetch: validateCart, isLoading: isValidating } = useValidateCart();

 
  const buyItems = cartItem || [];



  const removeAll = async () => {
    await clearCart();
  };

  const handleRemove = async (item: any) => {
    const productId = item?.product?._id;
    const variantKey = item?.selectedVariant
      ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
      : undefined;
    await removeFromCart(productId, variantKey);
  };

  const handleUpdateQuantity = async (item: any, newQuantity: number) => {
    if (newQuantity < 1) return;
    const productId = item?.product?._id;
    const variantKey = item?.selectedVariant
      ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
      : undefined;
    await updateQuantity(productId, newQuantity, variantKey);
  };


  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/home/my-cart" },
    { label: "Buy Now", href: null },
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item?.href);
    }
  };

 

  const BuyNow = () => {
    const subtotal = cartSummary.subtotal;
    const shipping = 50000;
    const discount = 5000;
    const tax = 5000;
    const total = subtotal + shipping - discount + tax;
    return (
      <div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:grid md:grid-cols-10 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
                <div className="col-span-4">Products</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Sub Total</div>
              </div>

              {/* Items */}
              <div className="divide-y">
                {buyItems.map((item) => (
                  <div
                    key={
                      item.product?._id + (item.selectedVariant?.optionId || "")
                    }
                    className="p-4"
                  >
                    {/* ...mobile layout... */}
                    <div className="md:hidden space-y-3">
                      <div className="flex justify-between items-start">
                        <Link
                          href={{
                            pathname: "/home/product-details/[slug]",
                            query: {
                              slug: item?.product.slug,
                              productData: JSON.stringify(item?.product), // Pass full product data
                            },
                          }}
                          as={`/home/product-details/${item?.product.slug}`} // Clean URL in browser
                          className=""
                        >
                          {" "}
                          <div className="flex space-x-3 flex-1">
                            <div className="relative">
                              <Image
                                src={
                                  item?.product?.images?.[0] || "/placeholder.svg"
                                }
                                alt={item?.product?.name || "product image"}
                                width={60}
                                height={60}
                                className="rounded-lg object-cover"
                              />
                              {/* {item.badge && (
                              <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                {item.badge}
                              </Badge>
                            )} */}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm leading-tight">
                                {item?.product?.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {item?.product?.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="font-bold text-sm">
                                  ₦{" "}
                                  {item.selectedVariant?.price.toLocaleString()}
                                </span>
                                {/* {item.badge && (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                                  {item.badge}
                                </Badge>
                              )} */}
                              </div>
                            </div>
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => handleRemove(item)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity - 1)
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity.toString().padStart(2, "0")}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity + 1)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="font-bold text-sm">
                          ₦ {(item.selectedVariant?.price ?? 0) * item.quantity}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-10 gap-4 items-center">
                      <div className="col-span-4 flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => handleRemove(item)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Link
                          href={{
                            pathname: "/home/product-details/[slug]",
                            query: {
                              slug: item?.product.slug,
                              productData: JSON.stringify(item?.product), // Pass full product data
                            },
                          }}
                          as={`/home/product-details/${item?.product.slug}`} // Clean URL in browser
                          className="flex items-center space-x-3"
                        >
                          {" "}
                          <div className="relative">
                            <Image
                              src={
                                item?.product?.images?.[0] || "/placeholder.svg"
                              }
                              alt={item?.product?.name || "product image"}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                            
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {item?.product?.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item?.product?.description}{" "}
                            </p>
                          </div>
                        </Link>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">
                            ₦ {item.selectedVariant?.price.toLocaleString()}
                          </span>
                         
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity - 1)
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity.toString().padStart(2, "0")}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity + 1)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold">
                          ₦ {(item.selectedVariant?.price ?? 0) * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Total Sidebar */}
          <div className="lg:col-span-1">
            <div>
              <div className="">
                <h3 className="font-semibold text-center text-lg mb-4">
                  Cart Total
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sub Total:</span>
                    <span>₦ {cartSummary.subtotal.toLocaleString()}</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>₦ {shipping.toLocaleString()}</span>
                  </div> */}
                  {/* <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>₦ {discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₦ {tax.toLocaleString()}</span>
                  </div> */}
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL:</span>
                    <span>₦ {total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  <Button
                    onClick={async () => {
                      if (!user) {
                        openModal();
                        return;
                      }
                      
                      const result = await validateCart();
                      if (result.data) {
                        setValidationData(result.data);
                        setShowValidationModal(true);
                      }
                    }}
                    disabled={isValidating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isValidating ? 'Validating...' : 'Checkout'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-secondary text-black border-orange-200 hover:bg-orange-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <>
      <div className="min-h-screen font-roboto bg-gray-50 body-padding">
        <div className=" mx-auto pt-4">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold">My Cart</h1>
              <span className="text-gray-600">
                {cartSummary.totalItems} Items
              </span>
            </div>

            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
              onClick={removeAll}
            >
              Remove All
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          <BuyNow />
        </div>

        {selectedAuctionItem && (
          <BidModal
            isOpen={showBidModal}
            onClose={() => setShowBidModal(false)}
            auctionItem={selectedAuctionItem}
          />
        )}
        
        <CartValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          validationData={validationData}
          onProceed={() => {
            setShowValidationModal(false);
            router.push('/home/checkout');
          }}
        />
      </div>
    </>
  );
}
