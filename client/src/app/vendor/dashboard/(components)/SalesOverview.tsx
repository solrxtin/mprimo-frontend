"use client";
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

type Props = {};

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

  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);

  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="font-bold text-xl md:text-2xl text-gray-600">
          Sales Overview
        </h1>
        <select
          className="border rounded-full px-3 py-1 text-sm bg-gray-300 text-gray-600 outline-none w-full sm:w-auto"
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
            ${(totalSales / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-xl md:text-2xl font-bold">24</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Avg. Order Value</p>
          <p className="text-xl md:text-2xl font-bold">
            ${(totalSales / 2400).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              width={50}
              tickFormatter={(value) => `${value}`}
              domain={[0, "dataMax + 500"]}
            />
            <Tooltip />
            <Bar dataKey="sales" fill="#002f7a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesOverview;
