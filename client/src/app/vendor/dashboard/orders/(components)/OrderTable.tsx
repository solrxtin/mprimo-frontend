"use client";

import { ChevronDown, Eye, Search } from "lucide-react";
import React, { useState } from "react";

type Props = {};

interface OrderType {
  orderId: string;
  customer: string;
  amount: number;
  date: string;
  address: string;
  orderStatus:
    | "pending"
    | "delivered"
    | "processing"
    | "cancelled"
    | "refunded";
  items: string[];
}

const orders: OrderType[] = [
  {
    orderId: "ORD-001",
    customer: "John Doe",
    amount: 125.99,
    date: "2023-11-15",
    address: "123 Main St, City, State",
    orderStatus: "delivered",
    items: ["Red Nike Cap", "Puma T-shirt"],
  },
  {
    orderId: "ORD-002",
    customer: "Jane Smith",
    amount: 89.5,
    date: "2023-11-18",
    address: "456 Oak Ave, Town, State",
    orderStatus: "processing",
    items: ["Wireless Headphones"],
  },
  {
    orderId: "ORD-003",
    customer: "Robert Johnson",
    amount: 210.75,
    date: "2023-11-20",
    address: "789 Pine Rd, Village, State",
    orderStatus: "pending",
    items: ["Leather Wallet", "Smart Watch", "Denim Jacket"],
  },
  {
    orderId: "ORD-004",
    customer: "Emily Davis",
    amount: 45.25,
    date: "2023-11-22",
    address: "101 Elm St, Suburb, State",
    orderStatus: "delivered",
    items: ["Sunglasses"],
  },
  {
    orderId: "ORD-005",
    customer: "Michael Wilson",
    amount: 320.0,
    date: "2023-11-25",
    address: "202 Maple Ave, County, State",
    orderStatus: "cancelled",
    items: ["Bluetooth Speaker", "Running Shoes"],
  },
  {
    orderId: "ORD-006",
    customer: "Sarah Brown",
    amount: 75.5,
    date: "2023-11-28",
    address: "303 Cedar Rd, District, State",
    orderStatus: "refunded",
    items: ["Backpack"],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "refunded":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderTable = (props: Props) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  return (
    <div className="mt-8 rounded-lg shadow-sm">
      <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-4 p-5 border-b border-gray-200 bg-white">
        <div className="relative col-span-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search orders"
          />
        </div>

        <div className="relative col-span-3">
          <input
            type="date"
            className="border border-gray-200 rounded-md px-3 py-2 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="relative col-span-3">
          <div
            className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span className="text-sm mr-2">Status</span>
            {!showStatusDropdown ? (
              <ChevronDown size={16} className="ml-2 text-gray-400" />
            ) : (
              <ChevronDown
                size={16}
                className="ml-2 text-gray-400 rotate-180"
              />
            )}
          </div>

          {showStatusDropdown && (
            <div className="absolute mt-1 w-36 md:w-48  bg-white border border-gray-200 rounded-md shadow-lg z-10 ">
              <ul className="py-1">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200">
                  Completed
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                  Ready for shipping
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                  Shipped
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                  Pending
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                  Processing
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                  Cancelled
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                  Rejected
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                  Refunded
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-5 shadow-md">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-[#f2f7ff] text-black">
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
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.orderId} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderId}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customer}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  £{order.amount.toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.date}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                  {order.address}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus.charAt(0).toUpperCase() +
                      order.orderStatus.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.items.length} item(s)
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-4">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{order.orderId}</span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                  order.orderStatus
                )}`}
              >
                {order.orderStatus.charAt(0).toUpperCase() +
                  order.orderStatus.slice(1)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Customer:</span> {order.customer}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Amount:</span> £
              {order.amount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Date:</span> {order.date}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Address:</span> {order.address}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Items:</span>{" "}
              {order.items.join(", ")}
            </div>
            <div className="mt-3 flex justify-end">
              <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                <Eye size={16} />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTable;
