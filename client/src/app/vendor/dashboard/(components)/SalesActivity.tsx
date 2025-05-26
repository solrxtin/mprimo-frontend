import React from "react";
import {
  TriangleAlert,
  ShoppingBag,
  CircleCheck,
  ArrowRight,
} from "lucide-react";

type Activity = {
  id: string;
  type: "new-order" | "payment-received" | "low-stock";
  title: string;
  description: string;
  time: string;
};

const activities: Activity[] = [
  {
    id: "act-1",
    type: "new-order",
    title: "New Order Received",
    description: "Order #12345 for Wireless Headphones",
    time: "10 minutes ago",
  },
  {
    id: "act-2",
    type: "payment-received",
    title: "Payment Received",
    description: "£250.00 payment for Order #12340",
    time: "2 hours ago",
  },
  {
    id: "act-3",
    type: "low-stock",
    title: "Low Stock Alert",
    description: "Smart Watch (Black) - Only 3 left",
    time: "5 hours ago",
  },
  {
    id: "act-4",
    type: "new-order",
    title: "New Order Received",
    description: "Order #12339 for Bluetooth Speaker",
    time: "1 day ago",
  },
  {
    id: "act-5",
    type: "payment-received",
    title: "Payment Received",
    description: "£120.50 payment for Order #12335",
    time: "1 day ago",
  },
];

const ActivityIcon = ({ type }: { type: Activity["type"] }) => {
  switch (type) {
    case "new-order":
      return (
        <div className="p-2 bg-blue-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="text-blue-500" size={24} />
        </div>
      );
    case "payment-received":
      return (
        <div className="p-2 bg-green-100 rounded-full flex items-center justify-center">
          <CircleCheck className="text-green-500" size={24} />
        </div>
      );
    case "low-stock":
      return (
        <div className="p-2 bg-yellow-100 rounded-full flex items-center justify-center">
          <TriangleAlert className="text-yellow-500" size={24} />
        </div>
      );
    default:
      return null;
  }
};

const SalesActivity = () => {
  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-xl md:text-2xl text-gray-600">
          Sales Activity
        </h1>
        <button className="flex cursor-pointer text-blue-600 text-sm items-center ">
          <div>View All</div>
          <ArrowRight size={16} className="ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex md:flex-col lg:flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex gap-x-2 items-center">
              <ActivityIcon type={activity.type} />
              <div className="">
                <h3 className="font-medium text-sm">{activity.title}</h3>
                <p className="text-gray-500 text-xs mt-1">
                  {activity.description}
                </p>
                <p className="text-gray-400 text-xs whitespace-nowrap">
                  {activity.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesActivity;
