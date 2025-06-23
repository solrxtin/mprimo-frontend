'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Minus, Plus, X, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Home/Header";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from 'next/navigation'
import { BidModal } from "@/components/BidModal";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  subtotal: number;
  status: "Ongoing" | "Ended";
  image: string;
  badge?: string;
}

const initialCartItems: CartItem[] = [
  {
    id: "1",
    name: "Men Minimalist Large Capacity Laptop Backpack",
    description: "Refurbished",
    price: 45000,
    quantity: 1,
    subtotal: 45000,
    status: "Ongoing",
  image: "/images/tv.png",    badge: "Starting",
  },
  {
    id: "2",
    name: "iMosi QX7 Smart Watch 1.85 inch smart watch",
    description: "New",
    price: 45000,
    quantity: 2,
    subtotal: 90000,
    status: "Ended",
  image: "/images/tv.png",    badge: "Starting",
  },
  {
    id: "3",
    name: "iMosi QX7 Smart Watch 1.85 inch smart watch",
    description: "New",
    price: 45000,
    quantity: 2,
    subtotal: 90000,
    status: "Ongoing",
  image: "/images/tv.png",    badge: "Starting",
  },
];

const buyNowItems: CartItem[] = [
  {
    id: "4",
    name: "Men Minimalist Large Capacity Laptop Backpack",
    description: "Refurbished",
    price: 45000,
    quantity: 1,
    subtotal: 45000,
    status: "Ongoing",
  image: "/images/tv.png",    badge: "-50%",
  },
  {
    id: "5",
    name: "iMosi QX7 Smart Watch 1.85 inch smart watch",
    description: "New",
    price: 45000,
    quantity: 2,
    subtotal: 90000,
    status: "Ongoing",
  image: "/images/tv.png",     badge: "-50%",
  },
  {
    id: "6",
    name: "iMosi QX7 Smart Watch 1.85 inch smart watch",
    description: "New",
    price: 45000,
    quantity: 2,
    subtotal: 90000,
    status: "Ongoing",
  image: "/images/tv.png",     badge: "-50%",
  },
];

export default function CartPage() {
  const [auctionItems, setAuctionItems] = useState(initialCartItems);
  const [buyItems, setBuyItems] = useState(buyNowItems);
  const [activeTab, setActiveTab] = useState(0);
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedAuctionItem, setSelectedAuctionItem] = useState<CartItem | null>(null)

  const handleBidNow = (item: CartItem) => {
    setSelectedAuctionItem(item)
    setShowBidModal(true)
  }


  const tabs = [
    { id: 0, label: "Auction" },
    { id: 1, label: "Buy Now" },
    { id: 2, label: "Offers" },
  ];

  const updateQuantity = (
    id: string,
    newQuantity: number,
    isAuction = true
  ) => {
    if (newQuantity < 1) return;

    const updateItems = (items: CartItem[]) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.price * newQuantity,
            }
          : item
      );

    if (isAuction) {
      setAuctionItems(updateItems(auctionItems));
    } else {
      setBuyItems(updateItems(buyItems));
    }
  };

  const removeItem = (id: string, isAuction = true) => {
    if (isAuction) {
      setAuctionItems(auctionItems.filter((item) => item.id !== id));
    } else {
      setBuyItems(buyItems.filter((item) => item.id !== id));
    }
  };

  const removeAll = () => {
    if (activeTab === 0) {
      setAuctionItems([]);
    } else {
      setBuyItems([]);
    }
  };
  //   interface BreadcrumbItem {
  //   label: string;
  //   href: string | null;
  //   isActive?: boolean;
  //   isEllipsis?: boolean;
  // }
  const router = useRouter()

  

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/my-cart" },
    { label: "Auction", href: null},
  
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
     router.push(item?.href);
    }
  };

  const calculateTotal = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = 50000;
    const discount = 5000;
    const tax = 5000;
    const total = subtotal + shipping - discount + tax;
    return { subtotal, shipping, discount, tax, total };
  };

  const buyNowTotal = calculateTotal(buyItems);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <Auction />;
      case 1:
        return <BuyNow />;
      case 2:
        return <Offer />;
      default:
        return <Auction />;
    }
  };

  const Auction = () => {
    return (
      <div>
        <div className="bg-white   rounded-lg border overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
            <div className="col-span-4">Products</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Sub Total</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Action</div>
          </div>

          {/* Items */}
          <div className="divide-y">
            {auctionItems.map((item) => (
              <div key={item.id} className="p-4">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-3 flex-1">
                      <div className="relative">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        {item.badge && (
                          <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="font-bold text-sm">
                            ₦ {item.price.toLocaleString()}
                          </span>
                          {item.badge && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 p-1"
                      onClick={() => removeItem(item.id)}
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
                          updateQuantity(item.id, item.quantity - 1)
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
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        ₦ {item.subtotal.toLocaleString()}
                      </div>
                      <div
                        className={`text-xs ${
                          item.status === "Ongoing"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.status}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Gavel className="w-4 h-4 mr-1" />
                    Bid Now
                  </Button>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 p-1"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      {item.badge && (
                        <Badge className="absolute -bottom-1 -right-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">
                        ₦ {item.price.toLocaleString()}
                      </span>
                      {item.badge && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
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
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold">
                      ₦ {item.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span
                      className={
                        item.status === "Ongoing"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="col-span-1">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleBidNow(item)}>
                      <Gavel className="w-4 h-4 mr-1" />
                      Bid Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const BuyNow = () => {
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
                  <div key={item.id} className="p-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-3 flex-1">
                          <div className="relative">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                            {item.badge && (
                              <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm leading-tight">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="font-bold text-sm">
                                ₦ {item.price.toLocaleString()}
                              </span>
                              {item.badge && (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => removeItem(item.id, false)}
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
                              updateQuantity(item.id, item.quantity - 1, false)
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
                              updateQuantity(item.id, item.quantity + 1, false)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="font-bold text-sm">
                          ₦ {item.subtotal.toLocaleString()}
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
                          onClick={() => removeItem(item.id, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="relative">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                          {item.badge && (
                            <Badge className="absolute -bottom-1 -right-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">
                            ₦ {item.price.toLocaleString()}
                          </span>
                          {item.badge && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1, false)
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
                              updateQuantity(item.id, item.quantity + 1, false)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold">
                          ₦ {item.subtotal.toLocaleString()}
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
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Cart Total</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sub Total:</span>
                    <span>N {buyNowTotal.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>N {buyNowTotal.shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>N {buyNowTotal.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>N {buyNowTotal.tax.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL:</span>
                    <span>₦ {buyNowTotal.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  <Link href="/checkout">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Checkout
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const Offer = () => {
    return (
      <div>
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">No offers available</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />

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
              <span className="text-gray-600">123 Items</span>
            </div>
             <div className="flex flex-wrap justify-center gap-8  border-gray-200 p-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 font-medium text-base transition-colors relative ${
                  activeTab === tab.id
                    ? "text-gray-900 border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
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
        <div className="py-4">{renderTabContent()}</div>

        {selectedAuctionItem && (
          <BidModal isOpen={showBidModal} onClose={() => setShowBidModal(false)} auctionItem={selectedAuctionItem} />
        )}
      </div>
    </>
  );
}
