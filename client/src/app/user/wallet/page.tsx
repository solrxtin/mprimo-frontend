"use client"

import { useState } from "react"
import { Eye, EyeOff, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"
// import { AddFundsModal } from "@/components/modals/add-funds-modal"

const walletActivities = [
  {
    id: "1",
    description: "Funded Wallet using VISA Credit Card",
    amount: 125000,
    date: "Today",
    icon: "💳",
  },
  {
    id: "2",
    description: "Paid for Used Samsung Smart TV HDMI Home Version",
    amount: -125000,
    date: "Yesterday",
    icon: "📺",
  },
  {
    id: "3",
    description: "Paid 3 Items Ordere",
    amount: -125000,
    date: "3rd June, 2025",
    icon: "🛍️",
  },
  {
    id: "4",
    description: "Paid 3 Items Ordere",
    amount: -125000,
    date: "3rd June, 2025",
    icon: "🛍️",
  },
  {
    id: "5",
    description: "Paid for Used Samsung Smart TV HDMI Home Version",
    amount: -125000,
    date: "24th May, 2025",
    icon: "📺",
  },
  {
    id: "6",
    description: "Funded Wallet using VISA Credit Card",
    amount: 125000,
    date: "24th May, 2025",
    icon: "💳",
  },
  {
    id: "7",
    description: "Funded Wallet using VISA Credit Card",
    amount: 125000,
    date: "24th May, 2025",
    icon: "💳",
  },
  {
    id: "8",
    description: "Funded Wallet using VISA Credit Card",
    amount: 125000,
    date: "24th May, 2025",
    icon: "💳",
  },
  {
    id: "9",
    description: "Funded Wallet using VISA Credit Card",
    amount: 125000,
    date: "24th May, 2025",
    icon: "💳",
  },
  {
    id: "10",
    description: "Funded Wallet using VISA Credit Card",
    amount: 125000,
    date: "24th May, 2025",
    icon: "💳",
  },
]

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(false)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [timeFilter, setTimeFilter] = useState("This Week")

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

          {/* Credit Balance Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">My Credit Balance</h2>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-lg">
                    <span className="text-2xl font-bold">₦</span>
                    <span className="text-xl">{showBalance ? " 0" : " * * * * * * 0"}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddFundsModal(true)}>
                  Fund Wallet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Activities */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Wallet Activities</h3>
                <div className="flex items-center space-x-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-2">
                        {timeFilter}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setTimeFilter("This Week")}>This Week</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("This Month")}>This Month</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("Last Month")}>Last Month</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="link" className="text-blue-600 hover:text-blue-800">
                    See All →
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-t-lg font-medium text-gray-700">
                  <div className="col-span-1">SN</div>
                  <div className="col-span-6">ACTIVITIES</div>
                  <div className="col-span-3">AMOUNT</div>
                  <div className="col-span-2">DATE</div>
                </div>

                {/* Activities */}
                <div className="divide-y border rounded-b-lg md:rounded-t-none">
                  {walletActivities.map((activity, index) => (
                    <div key={activity.id} className="p-4">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-gray-500">{activity.date}</p>
                          </div>
                          <div
                            className={`font-bold text-lg ${activity.amount > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {activity.amount > 0 ? "+" : ""}₦ {Math.abs(activity.amount).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 text-center">{index + 1}</div>
                        <div className="col-span-6 flex items-center space-x-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <span className="text-sm">{activity.description}</span>
                        </div>
                        <div className="col-span-3">
                          <span className={`font-bold ${activity.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                            {activity.amount > 0 ? "+" : ""}₦ {Math.abs(activity.amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">{activity.date}</span>
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
            </CardContent>
          </Card>


      {/* <AddFundsModal isOpen={showAddFundsModal} onClose={() => setShowAddFundsModal(false)} /> */}
    </div>
  )
}
