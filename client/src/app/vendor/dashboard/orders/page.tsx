"use client";

import React from "react";
import AnalyticsCard from "../(components)/AnalyticsCard";
import OrderTable from "./(components)/OrderTable";
import { useVendorOrders, useVendorAnalytics } from "@/hooks/useVendor";
import { useProductStore } from "@/stores/useProductStore";
import AnalyticsCardSkeleton from "../(components)/skeletons/AnalyticsCardSkeleton";

type Props = {};

const page = (props: Props) => {
  const { vendor } = useProductStore();

  if (!vendor) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
        <div className="px-2 lg:px-5">
          <h1 className="text-lg font-semibold">My Orders</h1>
          <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
            Please login to view your orders.
          </p>
        </div>
      </div>
    );
  }

  const { data: analyticsData, isLoading: analyticsLoading } = useVendorAnalytics(vendor?._id!);
  const { data: ordersData, isLoading: ordersLoading } = useVendorOrders(vendor?._id!, 1, 10);

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 lg:px-5">
        <h1 className="text-lg font-semibold">My Orders</h1>
        <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
          Latest orders in real time
        </p>
        <div className="grid md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-12 gap-4 mt-5">
          {analyticsLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="col-span-3">
                  <AnalyticsCardSkeleton />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Total Orders"
                  value={analyticsData?.data?.dashboard?.totalOrders?.value || 0}
                  percentageIncrease={analyticsData?.data?.dashboard?.totalOrders?.percentageChange || 0}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Completed Orders"
                  value={ordersData?.data?.orders?.filter((o: any) => o.status === 'delivered').length || 0}
                  percentageIncrease={5.2}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Pending Orders"
                  value={ordersData?.data?.orders?.filter((o: any) => ['pending', 'processing'].includes(o.status)).length || 0}
                  percentageIncrease={-2.1}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Failed Orders"
                  value={ordersData?.data?.orders?.filter((o: any) => ['cancelled', 'failed'].includes(o.status)).length || 0}
                  percentageIncrease={-8.5}
                />
              </div>
            </>
          )}
        </div>

        {/* Orders Table */}
        <OrderTable orders={ordersData?.data?.orders || []} loading={ordersLoading} />
      </div>
    </div>
  );
};

export default page;
