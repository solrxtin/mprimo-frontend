"use client"

import { useState } from "react"
import Image from "next/image"
import { Edit, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Header from "@/components/Home/Header"
import { Sidebar } from "@/components/SideBar"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"
// import { ActivitiesModal } from "@/components/modals/activities-modal"
// import { AddFundsModal } from "@/components/modals/add-funds-modal"

const recentActivities = [
  {
    id: "1",
    description: "Won the Bid for Apple Ipad Pro 234GB ROM 24GB RAM",
    time: "12:24pm",
    date: "Today",
    icon: "🏆",
  },
  {
    id: "2",
    description: "Successfully made and offer of N20,000 for Used Iphone 12 Pro Max",
    time: "2:30pm",
    date: "Yesterday",
    icon: "💰",
  },
  {
    id: "3",
    description: "Purchased Samsung Smart TV HD for N1.M",
    time: "2:30pm",
    date: "3rd June, 2025",
    icon: "📺",
  },
]

const recentViews = [
  {
    id: "1",
    name: "Logitech Bluetooth 3.0 Ultra Slim Keyboard",
    price: 25000,
    rating: 4,
 image: "/images/tv.png",  },
  {
    id: "2",
    name: "Logitech Bluetooth 3.0 Ultra Slim Keyboard",
    price: 25000,
    rating: 4,
 image: "/images/tv.png",  },
  {
    id: "3",
    name: "Logitech Bluetooth 3.0 Ultra Slim Keyboard",
    price: 25000,
    rating: 4,
 image: "/images/tv.png",  },
  {
    id: "4",
    name: "Logitech Bluetooth 3.0 Ultra Slim Keyboard",
    price: 25000,
    rating: 4,
 image: "/images/tv.png",  },
]

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(false)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Hello, Uche</h1>
            <p className="text-gray-600">
              Welcome to your Shopping Command Centre! Easily manage your orders, wishlist, and explore tailored deals
              in one convenient hub.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Account Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">ACCOUNT INFO</h3>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">Daniel Uchenna</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">Thisismyemail@gmail.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">SHIPPING ADDRESS</h3>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">Daniel Uchenna</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Address:</span>
                    <p className="font-medium">Warehouse No23 Wuye Ultra Wuye Abuja-Wuye, Federal Capital Territory</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <p className="font-medium">+2348100000000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Balance */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">CREDIT BALANCE</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Balance:</span>
                    <p className="font-bold text-lg">{showBalance ? "₦ 200,000" : "₦ ******"}</p>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddFundsModal(true)}>
                    Add Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Recent Activities</h3>
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => setShowActivitiesModal(true)}
                >
                  See All →
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-600">
                      <th className="pb-3">SN</th>
                      <th className="pb-3">ACTIVITIES</th>
                      <th className="pb-3">TIME</th>
                      <th className="pb-3">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((activity, index) => (
                      <tr key={activity.id} className="border-b">
                        <td className="py-3">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{activity.icon}</span>
                            <span className="text-sm">{activity.description}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm">{activity.time}</td>
                        <td className="py-3 text-sm">{activity.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Views */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Recent Views</h3>
              <Button variant="link" className="text-blue-600 hover:text-blue-800">
                See All →
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentViews.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < product.rating ? "text-yellow-400" : "text-gray-300"}`}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(23)</span>
                    </div>
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                    <p className="font-bold text-lg mb-3">₦ {product.price.toLocaleString()}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Add to Cart
                      </Button>
                      <Button size="sm" variant="ghost">
                        ♡
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

          {/* You Might Like */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">You Might Like</h3>
              <Button variant="link" className="text-blue-600 hover:text-blue-800">
                See All →
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentViews.map((product) => (
                <Card key={`might-like-${product.id}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < product.rating ? "text-yellow-400" : "text-gray-300"}`}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(23)</span>
                    </div>
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                    <p className="font-bold text-lg mb-3">₦ {product.price.toLocaleString()}</p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Add to Cart
                      </Button>
                      <Button size="sm" variant="ghost">
                        ♡
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

          {/* Newsletter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-bold text-lg mb-2">Join our newsletter</h3>
                  <p className="text-gray-600">Get all the latest Mprimo news and updates delivered to your inbox.</p>
                </div>
                <div className="flex space-x-3">
                  <Input placeholder="Email address" className="min-w-[250px]" />
                  <Button className="bg-blue-600 hover:bg-blue-700">Subscribe</Button>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* <ActivitiesModal isOpen={showActivitiesModal} onClose={() => setShowActivitiesModal(false)} />
      <AddFundsModal isOpen={showAddFundsModal} onClose={() => setShowAddFundsModal(false)} /> */}
    </div>
  )
}
