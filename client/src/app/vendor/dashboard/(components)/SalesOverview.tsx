"use client";

import { Plus } from "lucide-react";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  currentData: {
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    productCount: number;
  };
  dailySales: any[];
};

const data = [
  { name: "Mon", sales: 4000 },
  { name: "Tue", sales: 3000 },
  { name: "Wed", sales: 5000 },
  { name: "Thu", sales: 2780 },
  { name: "Fri", sales: 1890 },
  { name: "Sat", sales: 6390 },
  { name: "Sun", sales: 3490 },
];

const SalesOverview = (props: Props) => {
  const [timeRange, setTimeRange] = useState("7");
  const [analytics, setAnalytics] = useState({
    totalRevenue: props.currentData.totalRevenue || 0,
    totalSales: props.currentData.totalRevenue || 0,
    averageRating: props.currentData.totalRevenue || 0,
    productCount: props.currentData.totalRevenue || 0,
  });

  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="font-bold text-xl md:text-2xl text-gray-600">
          Sales Overview
        </h1>
        <select
          className="border rounded-full px-3 py-1 text-sm bg-gray-100 text-gray-600 outline-none w-full sm:w-auto cursor-pointer"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 1 month</option>
          <option value="180">Last 6 months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 border-b border-b-gray-100 pb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-xl md:text-2xl font-bold">
            ${analytics.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-xl md:text-2xl font-bold">
            {analytics.productCount}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Avg. Order Value</p>
          <p className="text-xl md:text-2xl font-bold">
            {analytics.totalSales !== 0 && analytics.totalRevenue !== 0
              ? `${(analytics.totalRevenue / analytics.totalSales).toFixed(2)}`
              : "0.00"}
          </p>
        </div>
      </div>

      {props.dailySales && props.dailySales.length > 0 ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={props.dailySales}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-10 px-4 animate-fade-in">
          <p className="text-lg font-semibold text-gray-700 mb-1">
            No sales made yet
          </p>
          <p className="text-sm text-gray-500">
            Keep an eye out—we’ll notify you when things get moving!
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesOverview;
