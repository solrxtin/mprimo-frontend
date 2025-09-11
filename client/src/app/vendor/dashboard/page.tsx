"use client";

import React, { useEffect, useState } from "react";
import AnalyticsCard from "./(components)/AnalyticsCard";
import AnalyticsCardSkeleton from "./(components)/skeletons/AnalyticsCardSkeleton";
import SalesOverview from "./(components)/SalesOverview";
import SalesOverviewSkeleton from "./(components)/skeletons/SalesOverviewSkeleton";
import SalesActivity from "./(components)/SalesActivity";
import SalesActivitySkeleton from "./(components)/skeletons/SalesActivitySkeleton";
import RecentOrders from "./(components)/RecentOrders";
import RecentOrdersSkeleton from "./(components)/skeletons/RecentOrdersSkeleton";
import { useProductStore } from "@/stores/useProductStore";
import { useSocket } from "@/hooks/useSocket";
import { useUserNotifications, useVendorAnalytics } from "@/hooks/queries";

type Props = {};

const Page = (props: Props) => {
  const { vendor } = useProductStore();
  const socket = useSocket();
  const { data, isLoading } = useVendorAnalytics(vendor?._id!);

  const [vendorCurrency] = useState(data?.dashboard?.salesTotal?.currency || "")

  useUserNotifications();

  useEffect(() => {
    if (!vendor || !socket) return;

    const handleConnect = () => {
      socket.emit("registerVendor", vendor._id);
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, vendor]);

  return (
    <div className="bg-[#f6f6f6] font-[family-name:var(--font-alexandria)]">
      <div className="p-4 md:p-10">
        <h1 className="font-bold text-2xl mb-2 md:mb-0">Dashboard</h1>
        <p className="mb-5 font-[family-name:var(--font-poppins)]">
          Welcome back, Bovie! Here's what is happening with your store today.
        </p>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {isLoading ? (
            <>
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
            </>
          ) : (
            <>
              <AnalyticsCard 
                title="Sales Total" 
                percentageIncrease={data?.dashboard?.salesTotal} 
                amount={data?.dashboard?.salesTotal?.value}
                currency={data?.dashboard?.salesTotal?.currency}
              />
              <AnalyticsCard 
                title="Total Orders" 
                percentageIncrease={data?.dashboard?.totalOrders} 
                value={data?.dashboard?.totalOrders?.value}
              />
              <AnalyticsCard 
                title="Total Products" 
                value={data?.dashboard?.totalProducts?.value}
              />
            </>
          )}
        </div>

        {/* Sales Overview & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">
          <div className="col-span-1 xl:col-span-8">
            {isLoading ? <SalesOverviewSkeleton /> : <SalesOverview vendorId={vendor?._id!} />}
          </div>
          <div className="col-span-1 xl:col-span-4">
            {isLoading ? <SalesActivitySkeleton /> : <SalesActivity />}
          </div>
        </div>

        {/* Recent Orders */}
        <RecentOrders currency={vendorCurrency} />
      </div>
    </div>
  );
};

export default Page;