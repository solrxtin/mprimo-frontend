"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"

const orders = [
  {
    id: "1",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Brand New",
    status: "Delivered",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "2",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Refurbished",
    status: "Ongoing",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "3",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Used",
    status: "Failed",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "4",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Brand New",
    status: "Delivered",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "5",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Refurbished",
    status: "Ongoing",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "6",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Used",
    status: "Failed",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "7",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Brand New",
    status: "Delivered",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "8",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Refurbished",
    status: "Ongoing",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
  {
    id: "9",
    product: "Fairly Used Apple iPad Tablet 234GB ROM 24GB RAM",
    code: "#Z123GDTE",
    condition: "Used",
    status: "Failed",
    date: "3/12/25 9:30",
    image: "/images/tv.png",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "Ongoing":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "Failed":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

 

  



export default function OrdersPage() {
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
              {orders.map((order, index) => (
                <div key={order.id} className="p-4">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex space-x-3">
                      <Image
                        src={order.image || "/placeholder.svg"}
                        alt={order.product}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight">{order.product}</h3>
                        <p className="text-xs text-gray-500 mt-1">{order.code}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{order.condition}</span>
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{order.date}</span>
                      <Button size="sm" variant="link" className="text-blue-600">
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center">{index + 1}</div>
                    <div className="col-span-4 flex items-center space-x-3">
                      <Image
                        src={order.image || "/placeholder.svg"}
                        alt={order.product}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{order.product}</h3>
                        <p className="text-sm text-gray-500">{order.code}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="bg-gray-100 px-3 py-1 rounded text-sm">{order.condition}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm">{order.date}</span>
                    </div>
                    <div className="col-span-1">
                      <Button variant="link" className="text-blue-600 text-sm p-0">
                        View Details
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
              100
            </Button>
            <Button variant="ghost" size="sm">
              Next
            </Button>
          </div>
    
    </div>
  )
}
