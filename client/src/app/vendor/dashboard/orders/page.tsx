import React from "react";
import AnalyticsCard from "../(components)/AnalyticsCard";
import OrderTable from "./(components)/OrderTable";

type Props = {};

const page = (props: Props) => {
  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 lg:px-5">
        <h1 className="text-lg font-semibold">My Orders</h1>
        <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
          Latest orders in real time
        </p>
        <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-4 mt-5">
          <div className="col-span-3">
            <AnalyticsCard
              title="Total Orders"
              value={2000000}
              percentageIncrease={12.8}
            />
          </div>
          <div className="col-span-3">
            <AnalyticsCard
              title="Successful Orders"
              value={1640}
              percentageIncrease={6.4}
            />
          </div>
          <div className="col-span-3">
            <AnalyticsCard
              title="Pending Orders"
              value={340}
              percentageIncrease={6.2}
            />
          </div>
          <div className="col-span-3">
            <AnalyticsCard
              title="Order Refunded"
              value={56}
              percentageIncrease={-12.8}
            />
          </div>
        </div>

        {/* Orders Table */}
        <OrderTable />
      </div>
    </div>
  );
};

export default page;
