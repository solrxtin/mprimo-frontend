"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter, useSearchParams } from "next/navigation"
import { useUserOrders, useCancelOrder } from "@/hooks/useOrders"
import { Loader2, Package, Truck, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "shipped":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "processing":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "pending":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100"
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return <CheckCircle className="w-4 h-4" />
    case "shipped":
      return <Truck className="w-4 h-4" />
    case "processing":
    case "pending":
      return <Package className="w-4 h-4" />
    case "cancelled":
    case "failed":
      return <XCircle className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

 

  



export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  
  const { data: ordersData, isLoading, error } = useUserOrders(currentPage, 10, statusFilter)
  const cancelOrderMutation = useCancelOrder()

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/home" },
    { label: "My Orders", href: null },
  ];
  
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrderMutation.mutateAsync({ orderId });
    }
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/home/user/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load orders</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const orders = ordersData?.data?.orders || [];
  const totalPages = ordersData?.data?.totalPages || 1;
  return (
    <div className="min-h-screen bg-gray-50">
   <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          <div className="mb-6">
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div className="col-span-1">SN</div>
              <div className="col-span-4">PRODUCT</div>
              <div className="col-span-2">CONDITION</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">DATE</div>
              <div className="col-span-1">ACTIONS</div>
            </div>

            {/* Orders */}
            <div className="divide-y">
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                orders.map((order: any, index: number) => {
                  const firstItem = order.items[0];
                  const itemCount = order.items.length;
                  
                  return (
                    <div key={order._id} className="p-4">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex space-x-3">
                          <Image
                            src={firstItem?.productId?.images?.[0] || "/placeholder.svg"}
                            alt={firstItem?.productId?.name || "Product"}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm leading-tight">
                              {firstItem?.productId?.name}
                              {itemCount > 1 && ` +${itemCount - 1} more`}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">#{order._id.slice(-8)}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {order.shipping?.trackingNumber}
                              </span>
                              <Badge className={getStatusColor(order.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="text-blue-600"
                              onClick={() => handleViewDetails(order._id)}
                            >
                              View Details
                            </Button>
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <Button 
                                size="sm" 
                                variant="link" 
                                className="text-red-600"
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={cancelOrderMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 text-center">{(currentPage - 1) * 10 + index + 1}</div>
                        <div className="col-span-4 flex items-center space-x-3">
                          <Image
                            src={firstItem?.productId?.images?.[0] || "/placeholder.svg"}
                            alt={firstItem?.productId?.name || "Product"}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-medium">
                              {firstItem?.productId?.name}
                              {itemCount > 1 && ` +${itemCount - 1} more`}
                            </h3>
                            <p className="text-sm text-gray-500">#{order._id.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="bg-gray-100 px-3 py-1 rounded text-sm">
                            {order.shipping?.trackingNumber}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <Badge className={getStatusColor(order.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="col-span-1 flex gap-1">
                          <Button 
                            variant="link" 
                            className="text-blue-600 text-sm p-0"
                            onClick={() => handleViewDetails(order._id)}
                          >
                            View
                          </Button>
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <Button 
                              variant="link" 
                              className="text-red-600 text-sm p-0"
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={cancelOrderMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button 
                    key={page}
                    size="sm" 
                    variant={currentPage === page ? "default" : "ghost"}
                    className={currentPage === page ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-gray-500">...</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
    
    </div>
  )
}
