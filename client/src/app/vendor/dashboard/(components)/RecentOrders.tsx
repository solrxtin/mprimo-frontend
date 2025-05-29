"use client";
import { ArrowRight } from "lucide-react";
import React from "react";
import { FaEye } from "react-icons/fa";

type Order = {
  id: string;
  customer: string;
  amount: number;
  address: string;
  status: "Pending" | "Processing" | "Delivered" | "Cancelled";
  items: string[];
  date: string;
};

const orders: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    amount: 125.99,
    address: "123 Main St, City, State",
    status: "Delivered",
    items: ["Product A", "Product B"],
    date: "18-05-25, 12:35"
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    amount: 89.50,
    address: "456 Oak Ave, Town, State",
    status: "Processing",
    items: ["Product C"],
    date: "18-05-25, 12:35"
  },
  {
    id: "ORD-003",
    customer: "Robert Johnson",
    amount: 210.75,
    address: "789 Pine Rd, Village, State",
    status: "Pending",
    items: ["Product D", "Product E", "Product F"],
    date: "18-05-25, 12:35"
  },
];

const RecentOrders = () => {
  return (
    <div className="bg-white px-6 py-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl text-gray-600">Recent Orders</h1>
        <button className="flex cursor-pointer text-blue-600 text-sm items-center ">
          <div>View All</div>
          <ArrowRight size={16} className="ml-1"/>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customer}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${order.amount.toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.date}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                  {order.address}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "Processing"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.items.length} item(s)
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-900">
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{order.id}</span>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${
                  order.status === "Delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "Processing"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Customer:</span> {order.customer}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Amount:</span> ${order.amount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Address:</span> {order.address}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">{order.items.length} items</span> 
            </div>
            <div className="mt-2 flex justify-end">
              <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm">
                <FaEye size={14} /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
