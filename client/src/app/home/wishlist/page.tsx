"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import Header from "@/components/Home/Header"
import { useRouter } from "next/navigation"

interface WishlistItem {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: string
  status: "Available" | "Ongoing" | "Unavailable"
  image: string
  badge?: string
}

const wishlistItems: WishlistItem[] = [
  {
    id: "1",
    name: "Men Minimalist Large Capacity Laptop Backpack",
    description: "Refurbished",
    price: 45000,
    discount: "-50%",
    status: "Available",
  image: "/images/tv.png",     badge: "Buy Now",
  },
  {
    id: "2",
    name: "iMosi QX7 Smart Watch 1.85 inch Smart Watch",
    description: "New",
    price: 45000,
    discount: "Starting",
    status: "Ongoing",
  image: "/images/tv.png",     badge: "Auction",
  },
  {
    id: "3",
    name: "MOVSSOU E7 Noise Cancellation Headphone",
    description: "Used",
    price: 105000,
    status: "Unavailable",
  image: "/images/tv.png",     badge: "Offer",
  },
  {
    id: "4",
    name: "Men Minimalist Large Capacity Laptop Backpack",
    description: "Refurbished",
    price: 45000,
    discount: "-50%",
    status: "Available",
  image: "/images/tv.png",     badge: "Buy Now",
  },
  {
    id: "5",
    name: "iMosi QX7 Smart Watch 1.85 inch Smart Watch",
    description: "New",
    price: 45000,
    discount: "Starting",
    status: "Ongoing",
  image: "/images/tv.png",     badge: "Auction",
  },
  {
    id: "6",
    name: "MOVSSOU E7 Noise Cancellation Headphone",
    description: "Used",
    price: 105000,
    status: "Unavailable",
  image: "/images/tv.png",     badge: "Offer",
  },
]

export default function WishlistPage() {
  const [items, setItems] = useState(wishlistItems)
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const addToCart = (id: string) => {
    // Add to cart logic here
    console.log("Added to cart:", id)
  }

  const removeAll = () => {
    setItems([])
  }
    const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/my-cart" },
    { label: "Auction", href: null},
    // { label: "Laptops", href: "/prod
    ]
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


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "text-green-600"
      case "Ongoing":
        return "text-green-600"
      case "Unavailable":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

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
            <h1 className="text-2xl font-bold">My Wishlist</h1>
            <span className="text-gray-600">{items.length} Items</span>
          </div>
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
            onClick={removeAll}
          >
            Remove All
          </Button>
        </div>

        {/* Wishlist Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
            <div className="col-span-5">Products</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Actions</div>
          </div>

          {/* Items */}
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                      {item.badge && (
                        <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-orange-100 text-orange-800 hover:bg-orange-100">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">₦ {item.price.toLocaleString()}</span>
                      {item.discount && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                          {item.discount}
                        </Badge>
                      )}
                    </div>
                    <span className={`text-sm ${getStatusColor(item.status)}`}>{item.status}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => addToCart(item.id)}
                      disabled={item.status === "Unavailable"}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add To Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      {item.badge && (
                        <Badge className="absolute -bottom-1 -right-1 text-xs px-2 py-1 bg-orange-100 text-orange-800 hover:bg-orange-100">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">₦ {item.price.toLocaleString()}</span>
                      {item.discount && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{item.discount}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={getStatusColor(item.status)}>{item.status}</span>
                  </div>
                  <div className="col-span-3 flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => addToCart(item.id)}
                      disabled={item.status === "Unavailable"}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add To Cart
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button variant="ghost" size="sm" disabled>
            Prev
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
            1
          </Button>
          <Button variant="ghost" size="sm">
            2
          </Button>
          <Button variant="ghost" size="sm">
            3
          </Button>
          <span className="text-gray-500">...</span>
          <Button variant="ghost" size="sm">
            10
          </Button>
          <Button variant="ghost" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}
