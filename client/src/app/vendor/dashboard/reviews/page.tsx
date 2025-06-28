import { ArrowDown, ArrowUp, Search } from "lucide-react";
import React from "react";
import ReviewsTable from "./(components)/ReviewsTable";

type Props = {};

const page = (props: Props) => {
  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 lg:px-5">
        <div className="flex flex-col-reverse md:flex-row gap-y-4 justify-between items-center mb-5">
          <div className="self-start">
            <h1 className="text-lg font-semibold">Review Overview</h1>
            <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
              Everything in here
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-sm lg:w-md pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-8 lg:grid-cols-12 gap-5 mt-5">
          <div className="col-span-4">
            <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
              <div className="flex justify-between mb-4">
                <p className="font-[family-name:var(--font-poppins)] text-gray-500">
                  Review Ratings
                </p>
                <div className="rounded-full size-12.5 bg-green-500 flex items-center justify-center">
                  <div className="rounded-full size-10 bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-y-2">
                <p className="font-[family-name:var(--font-alexandria)] text-[#211f1f] font-bold text-xl md:text-2xl lg:text-3xl truncate">
                  4.5
                </p>
                <div className="flex gap-x-2 items-center">
                  <div
                    className={`font-[family-name:var(--font-poppins)] text-[#211f1f] px-2 py-1 rounded-full flex items-center bg-[#a8ffdc]`}
                  >
                    <ArrowUp size={12} />
                    <div className="text-xs ml-1">12.8%</div>
                  </div>
                  <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
                    Vs last week
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-4">
            <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
              <div className="flex justify-between mb-4">
                <p className="font-[family-name:var(--font-poppins)] text-gray-500">
                  All feedbacks
                </p>
                <div>
                  <div className="relative h-12">
                    <div className="absolute top-2 left-[-20] h-10 w-2.5 rounded-full bg-gray-300 "></div>
                    <div className="absolute top-0 left-0 h-12 w-2.5 rounded-full bg-green-700 "></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-y-2">
                <p className="font-[family-name:var(--font-alexandria)] text-[#211f1f] font-bold text-xl md:text-2xl lg:text-3xl truncate">
                  1340
                </p>
                <div className="flex gap-x-2 items-center">
                  <div
                    className={`font-[family-name:var(--font-poppins)] text-[#211f1f] px-2 py-1 rounded-full flex items-center bg-[#a8ffdc]`}
                  >
                    <ArrowUp size={12} />
                    <div className="text-xs ml-1">6.4%</div>
                  </div>
                  <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
                    From this week
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-4">
            <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
              <div className="flex justify-between mb-4">
                <p className="font-[family-name:var(--font-poppins)] text-gray-500">
                  Average Satisfaction
                </p>
              </div>
              <div className="mb-5 h-12">
                <div className="relative w-full h-4 rounded-full bg-gray-300">
                  <div className="absolute w-1/5 h-4 bg-red-500 left-0 top-0 rounded-l-full" />
                  <div className="absolute w-1/4 h-4 bg-gray-300 left-[20%] top-0" />
                  <div className="absolute w-[55%] h-4 bg-green-500 left-[45%] top-0 rounded-r-full"/>
                  <p className="absolute text-gray-400 text-xs top-6 left-[10%]">20%</p>
                  <p className="absolute text-gray-400 text-xs top-6 left-[30%]">25%</p>
                  <p className="absolute text-gray-400 text-xs top-6 left-[75%]">55%</p>
                </div>
              </div>
              <div className="flex gap-x-2 items-center">
                <div
                  className={`font-[family-name:var(--font-poppins)] text-[#211f1f] px-2 py-1 rounded-full flex items-center bg-[#a8ffdc]`}
                >
                  <ArrowUp size={12} />
                  <div className="text-xs ml-1">12.8%</div>
                </div>
                <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
                  Vs last week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <ReviewsTable />
      </div>
    </div>
  );
};

export default page;
