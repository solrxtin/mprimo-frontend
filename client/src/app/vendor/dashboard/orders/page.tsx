"use client";

import React from "react";
import AnalyticsCard from "../(components)/AnalyticsCard";
import OrderTable from "./(components)/OrderTable";
import { useFetchVendorOrderMetrics } from "@/hooks/queries";
import { useProductStore } from "@/stores/useProductStore";
import AnalyticsCardSkeleton from "./(components)/AnalyticsCardSkeleton";

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

  const { data, isLoading } = useFetchVendorOrderMetrics(vendor?._id!);
  console.log("Data is: ", data)

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 lg:px-5">
        <h1 className="text-lg font-semibold">My Orders</h1>
        <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
          Latest orders in real time
        </p>
        <div className="grid md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-12 gap-4 mt-5">
          {isLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => {
                return (
                  <div key={i} className="col-span-3">
                    <AnalyticsCardSkeleton />
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {data && data.metrics && (
                <>
                  <div className="col-span-3">
                    <AnalyticsCard
                      title={data.metrics.totalOrders.title}
                      value={data.metrics.totalOrders.rawValue}
                      percentageIncrease={{
                        changePercent: data.metrics.totalOrders.change,
                        changeAmount: data.metrics.totalOrders.rawValue,
                      }}
                      period={data.period}
                    />
                  </div>
                  <div className="col-span-3">
                    <AnalyticsCard
                      title={data.metrics.successfulOrders.title}
                      value={data.metrics.successfulOrders.rawValue}
                      percentageIncrease={{
                        changePercent: data.metrics.successfulOrders.change,
                        changeAmount: data.metrics.successfulOrders.rawValue,
                      }}
                      period={data.period}
                    />
                  </div>
                  <div className="col-span-3">
                    <AnalyticsCard
                      title={data.metrics.pendingOrders.title}
                      value={data.metrics.pendingOrders.rawValue}
                      percentageIncrease={{
                        changePercent: data.metrics.pendingOrders.change,
                        changeAmount: data.metrics.pendingOrders.rawValue,
                      }}
                      period={data.period}
                    />
                  </div>
                  <div className="col-span-3">
                    <AnalyticsCard
                      title={data.metrics.failedOrders.title}
                      value={data.metrics.failedOrders.rawValue}
                      percentageIncrease={{
                        changePercent: data.metrics.failedOrders.change,
                        changeAmount: data.metrics.failedOrders.rawValue,
                      }}
                      period={data.period}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Orders Table */}
        <OrderTable />
      </div>
    </div>
  );
};

export default page;
