"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/Home/Header";
import { Sidebar } from "@/components/SideBar";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { useUserProfile, useRecentViews, useRecomendations } from "@/hooks/useUser";
import Link from "next/link";
import ProductCard from "./(components)/ProductCard";

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
    description:
      "Successfully made and offer of N20,000 for Used Iphone 12 Pro Max",
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
];

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [recentViewsPage, setRecentViewsPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const itemsPerPage = 4;
  const router = useRouter();

  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const { data: recentViewsData, isLoading: viewsLoading } = useRecentViews(8);
  const { data: recomendationsData, isLoading: recomendationsLoading } = useRecomendations(8, true);

  const recentViews = recentViewsData?.recentViews || [];

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "My Account", href: "/home/user/settings" },
    { label: "Dashboard", href: "/home" },
    { label: "Overview", href: null },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={manualBreadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-4"
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Hello, {profileData?.user?.profile?.firstName || "User"}
        </h1>
        <p className="text-gray-600">
          Welcome to your Shopping Command Centre! Easily manage your orders,
          wishlist, and explore tailored deals in one convenient hub.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Account Info */}
        <Card className="p-0 rounded-none ">
          <CardContent className="p-0 rounded-none">
            <div className="flex items-center justify-between mb-4 p-2 bg-[#E2E8F0]">
              <h3 className="font-medium text-sm md:text-base">ACCOUNT INFO</h3>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 p-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Name:</span>
                <p className="">
                  {profileData?.user?.profile?.firstName}{" "}
                  {profileData?.user?.profile?.lastName}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Email:</span>
                <p className="">{profileData?.user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="p-0 rounded-none ">
          <CardContent className="p-0 rounded-none">
            <div className="flex items-center justify-between mb-4 p-2 bg-[#E2E8F0]">
              <h3 className="font-medium text-sm md:text-base">
                SHIPPING ADDRESS
              </h3>

              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 p-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Name:</span>
                <p className="">
                  {profileData?.user?.profile?.firstName}{" "}
                  {profileData?.user?.profile?.lastName}
                </p>
              </div>
              {profileData?.shippingDefaultAddress && (
                <div className="flex  gap-1">
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="">
                    `${profileData.shippingDefaultAddress.street}, $
                    {profileData.shippingDefaultAddress.city}, $
                    {profileData.shippingDefaultAddress.state}`
                  </p>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="">
                  {profileData?.user?.profile?.phoneNumber || "Not provided"}
                </p>
              </div>
            </div>
          </CardContent>
          {!profileData?.shippingDefaultAddress && (
            <div className="p-2 border-t">
              <Button
                className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/home/user/settings")}
              >
                Add Shipping Address
              </Button>
            </div>
          )}
        </Card>

        {/* Credit Balance */}
        <Card className="p-0 rounded-none relative">
          <CardContent className="p-0 rounded-none">
            <div className="flex items-center justify-between mb-4 p-2 bg-[#E2E8F0]">
              <h3 className="font-medium text-sm md:text-base">
                CREDIT BALANCE
              </h3>
            </div>
            <div className="space-y-2 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <p className="font-bold text-lg">
                    {showBalance
                      ? `₦ ${profileData?.fiatWallet?.toLocaleString() || "0"}`
                      : "₦ ******"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Button
                className="cursor-pointer w-[95%] bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded absolute bottom-2 left-1/2 transform -translate-x-1/2"
                onClick={() => setShowAddFundsModal(true)}
              >
                Add Funds
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="mb-8">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h3 className="font-bold text-lg">Recent Activities</h3>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 self-start sm:self-auto"
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
                  <th className="pb-3 hidden sm:table-cell">TIME</th>
                  <th className="pb-3 hidden sm:table-cell">DATE</th>
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
                        <div className="flex flex-col">
                          <span className="text-sm">{activity.description}</span>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {activity.time} • {activity.date}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm hidden sm:table-cell">{activity.time}</td>
                    <td className="py-3 text-sm hidden sm:table-cell">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Views */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h3 className="font-bold text-lg">Recent Views</h3>
          {recentViews.length > itemsPerPage && (
            <Button variant="link" className="text-blue-600 hover:text-blue-800 self-start sm:self-auto">
            See All →
          </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {recentViews.slice((recentViewsPage - 1) * itemsPerPage, recentViewsPage * itemsPerPage).map((product:any) => (
            <div key={product._id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {recentViews.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={recentViewsPage === 1}
              onClick={() => setRecentViewsPage(prev => prev - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: Math.ceil(recentViews.length / itemsPerPage) }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={recentViewsPage === i + 1 ? "default" : "ghost"}
                className={recentViewsPage === i + 1 ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                onClick={() => setRecentViewsPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={recentViewsPage === Math.ceil(recentViews.length / itemsPerPage)}
              onClick={() => setRecentViewsPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* You Might Like */}
      {!recomendationsLoading && recomendationsData && recomendationsData.products?.length > 0 &&(
        <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h3 className="font-bold text-lg">You Might Like</h3>
          <Button variant="link" className="text-blue-600 hover:text-blue-800 self-start sm:self-auto">
            See All →
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {recomendationsData.products.slice((recommendationsPage - 1) * itemsPerPage, recommendationsPage * itemsPerPage).map((product: any) => (
            <div key={product._id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {recomendationsData.products.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={recommendationsPage === 1}
              onClick={() => setRecommendationsPage(prev => prev - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: Math.ceil(recomendationsData.products.length / itemsPerPage) }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={recommendationsPage === i + 1 ? "default" : "ghost"}
                className={recommendationsPage === i + 1 ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                onClick={() => setRecommendationsPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={recommendationsPage === Math.ceil(recomendationsData.products.length / itemsPerPage)}
              onClick={() => setRecommendationsPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      </>
      )}

      {/* <ActivitiesModal isOpen={showActivitiesModal} onClose={() => setShowActivitiesModal(false)} />
      <AddFundsModal isOpen={showAddFundsModal} onClose={() => setShowAddFundsModal(false)} /> */}
    </div>
  );
}