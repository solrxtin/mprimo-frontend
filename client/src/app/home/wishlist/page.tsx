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
import { useWishlistStore } from "@/stores/useWishlistStore"
import { useAddToCart } from "@/stores/cartHook"

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore()
  const { addToCart } = useAddToCart()
  const router = useRouter()

  const handleAddToCart = (item: any) => {
    const selectedVariant = item.product.variants?.[0]?.options?.[0] ? {
      variantId: item.product.variants[0]._id,
      optionId: item.product.variants[0].options[0]._id,
      variantName: item.product.variants[0].name,
      optionValue: item.product.variants[0].options[0].value,
      price: item.product.variants[0].options[0].price,
    } : undefined
    
    addToCart(item.product, 1, selectedVariant)
  }
    const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "My-Wishlist", href: "/home/wishlist" },
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
            <h1 className="text-2xl font-bold">My Wishlist</h1>
            <span className="text-gray-600">{items.length} Items</span>
          </div>
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
            onClick={clearWishlist}
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
              <div key={item.product._id} className="p-4">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Image
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight">{item.product.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.product.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">₦ {item.product.variants?.[0]?.options?.[0]?.price?.toLocaleString()}</span>
                    </div>
                    <span className="text-sm text-green-600">Available</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add To Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                      onClick={() => removeFromWishlist(item.product._id!)}
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
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.product.description}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">₦ {item.product.variants?.[0]?.options?.[0]?.price?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-green-600">Available</span>
                  </div>
                  <div className="col-span-3 flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add To Cart
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                      onClick={() => removeFromWishlist(item.product._id!)}
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
