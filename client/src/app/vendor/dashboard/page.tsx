
import React from "react";
import AnalyticsCard from "./(components)/AnalyticsCard";
import SalesOverview from "./(components)/SalesOverview";
import RecentOrders from "./(components)/RecentOrders";
import SalesActivity from "./(components)/SalesActivity";

type Props = {};

const page = (props: Props) => {
  return (
    <div className="bg-[#f6f6f6] font-[family-name:var(--font-alexandria)]">
      <div className="p-4 md:p-10">
        <h1 className="font-bold text-2xl mb-2 md:mb-0">Dashboard</h1>
        <p className="mb-5 font-[family-name:var(--font-poppins)]">
          Welcome back, Bovie! Here's what is happening with your store today.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <AnalyticsCard
            title="Sales Total"
            percentageIncrease={12.8}
            amount={200000000}
          />
          <AnalyticsCard
            title="Total Orders"
            percentageIncrease={6.4}
            value={1340}
          />
          <AnalyticsCard
            title="Total Products"
            percentageIncrease={-12.8}
            value={256}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
          <div className="col-span-1 lg:col-span-8">
            <SalesOverview />
          </div>
          <div className="col-span-1 lg:col-span-4">
            <SalesActivity />
          </div>
        </div>
        <div className="">
          <RecentOrders />
        </div>
      </div>
    </div>
  );
};

export default page;
