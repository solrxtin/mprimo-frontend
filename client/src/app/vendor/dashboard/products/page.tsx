"use client";

import { Plus, ChevronDown, Filter, Search, Calendar } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

type Props = {};

interface ProductType {
  date: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  acceptOffer: boolean;
  bidding: boolean;
  status: "active" | "draft" | "unavailable";
}

interface ProductType {
  date: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  acceptOffer: boolean;
  bidding: boolean;
  status: "active" | "draft" | "unavailable";
}

const products: ProductType[] = [
  {
    name: "Red Nike Cap",
    date: "2023-01-01, 12:35",
    category: "Fashion",
    price: 100,
    stock: 10,
    acceptOffer: true,
    bidding: false,
    status: "active",
  },
  {
    name: "Puma T-shirt",
    date: "2023-02-15, 09:20",
    category: "Sport wear",
    price: 45.99,
    stock: 25,
    acceptOffer: false,
    bidding: false,
    status: "active",
  },
  {
    name: "Wireless Headphones",
    date: "2023-03-10, 14:45",
    category: "Electronics",
    price: 199.99,
    stock: 8,
    acceptOffer: true,
    bidding: true,
    status: "active",
  },
  {
    name: "Leather Wallet",
    date: "2023-04-05, 11:30",
    category: "Accessories",
    price: 79.5,
    stock: 15,
    acceptOffer: true,
    bidding: false,
    status: "active",
  },
  {
    name: "Smart Watch",
    date: "2023-05-20, 16:15",
    category: "Electronics",
    price: 299.99,
    stock: 5,
    acceptOffer: false,
    bidding: true,
    status: "active",
  },
  {
    name: "Running Shoes",
    date: "2023-06-12, 08:45",
    category: "Sport wear",
    price: 129.99,
    stock: 0,
    acceptOffer: false,
    bidding: false,
    status: "unavailable",
  },
  {
    name: "Denim Jacket",
    date: "2023-07-08, 13:20",
    category: "Fashion",
    price: 89.99,
    stock: 12,
    acceptOffer: true,
    bidding: false,
    status: "active",
  },
  {
    name: "Bluetooth Speaker",
    date: "2023-08-25, 10:10",
    category: "Electronics",
    price: 149.99,
    stock: 7,
    acceptOffer: true,
    bidding: true,
    status: "active",
  },
  {
    name: "Sunglasses",
    date: "2023-09-30, 15:40",
    category: "Accessories",
    price: 59.99,
    stock: 20,
    acceptOffer: false,
    bidding: false,
    status: "draft",
  },
  {
    name: "Backpack",
    date: "2023-10-15, 17:25",
    category: "Accessories",
    price: 75.5,
    stock: 18,
    acceptOffer: true,
    bidding: false,
    status: "draft",
  },
];

const categories = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
  "Automobile & Parts",
  "Industrial & Business",
  "Baby, Kids & Toys",
  "Sport & Outdoors",
  "Food & Groceries",
  "Others & Miscellaneous",
];

const ProductsPage = () => {
  const [productList, setProductList] = useState<ProductType[]>(products);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState<ProductType[]>([]);

  // Calculate pagination on mount and when filters change
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(productList.length / itemsPerPage);
    setTotalPages(total);

    // Get current products
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayedProducts(productList.slice(indexOfFirstItem, indexOfLastItem));
  }, [currentPage, productList, itemsPerPage]);

  // Handle page changes
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Show dots or pages
      if (currentPage > 3) {
        pageNumbers.push("...");
      }

      // Show current page and neighbors
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Show dots or pages
      if (currentPage < totalPages - 2) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const toggleOffer = (index: number) => {
    const updatedProducts = [...productList];
    updatedProducts[index].acceptOffer = !updatedProducts[index].acceptOffer;
    setProductList(updatedProducts);
  };

  const toggleBidding = (index: number) => {
    const updatedProducts = [...productList];
    updatedProducts[index].bidding = !updatedProducts[index].bidding;
    setProductList(updatedProducts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-[#f6f6f6] font-[family-name:var(--font-alexandria)]">
      <div className="p-4 md:p-6 lg:p-10">
        <div className="flex flex-col md:flex-col-reverse lg:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <div className="w-full">
            <div className="flex overflow-x-auto scrollbar-hide gap-x-2 lg:gap-x-4 items-center text-[#b5b4b4] mb-1">
              <div
                className={`text-sm md:text-lg whitespace-nowrap border-r pr-2 md:pr-4 cursor-pointer ${
                  activeTab === "all"
                    ? "text-[#002f7a] font-semibold"
                    : "text-[#797979]"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All products
              </div>
              <div
                className={`text-sm md:text-lg whitespace-nowrap border-r px-2 md:px-4 cursor-pointer ${
                  activeTab === "active" ? "text-[#002f7a] font-semibold" : ""
                }`}
                onClick={() => setActiveTab("active")}
              >
                Active Listings
              </div>
              <div
                className={`text-sm md:text-lg whitespace-nowrap border-r px-2 md:px-4 cursor-pointer ${
                  activeTab === "outOfStock"
                    ? "text-[#002f7a] font-semibold"
                    : ""
                }`}
                onClick={() => setActiveTab("outOfStock")}
              >
                Out of Stock
              </div>
              <div
                className={`text-sm md:text-lg whitespace-nowrap px-2 md:px-4 cursor-pointer ${
                  activeTab === "draft" ? "text-[#002f7a] font-semibold" : ""
                }`}
                onClick={() => setActiveTab("draft")}
              >
                Draft
              </div>
            </div>
            <p className="font-[family-name:var(--font-poppins)] text-xs md:text-sm text-[#323232]">
              Welcome back, Bovie! Here's what is happening with your store
              today.
            </p>
          </div>
          <Link href="/vendor/dashboard/products/create-product">
          <div className="bg-[#002f7a] text-white px-4 md:px-6 py-2 md:py-3 rounded-md flex gap-x-2 items-center cursor-pointer hover:bg-[#00245a] transition-colors w-full md:w-auto justify-center md:self-end">
            <button className="whitespace-nowrap">Add Product</button>
            <Plus size={18} />
          </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-4 p-5 border-b border-gray-300 items-center">
            <div className="relative col-span-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search products"
              />
            </div>

            <div className="col-span-2">
              <input
                type="date"
                className="w-full border border-gray-200 rounded-md px-3 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="relative col-span-2">
              <div
                className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span className="text-sm">Category</span>
                {!showCategoryDropdown ? (
                  <ChevronDown size={16} className="ml-2 text-gray-400" />
                ) : (
                  <ChevronDown
                    size={16}
                    className="ml-2 text-gray-400 rotate-180"
                  />
                )}
              </div>

              {showCategoryDropdown && (
                <div className="absolute mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <ul className="py-1">
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      All Categories
                    </li>
                    {categories.map((option: string) => (
                      <li
                        key={option}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                        onClick={() => {
                          setCategory(option);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative col-span-2">
              <div
                className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <span className="text-sm">Status</span>
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
                <div className="absolute mt-1 w-40 md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <ul className="py-1">
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      All Statuses
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                      <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>
                      Active
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                      Draft
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      Unavailable
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="relative col-span-2">
              <div
                className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <span className="text-sm mr-2">Filter</span>
                <Filter size={18} className="text-gray-400" />
                {!showFilterDropdown ? (
                  <ChevronDown size={16} className="ml-2 text-gray-400" />
                ) : (
                  <ChevronDown
                    size={16}
                    className="ml-2 text-gray-400 rotate-180"
                  />
                )}
              </div>

              {showFilterDropdown && (
                <div className="absolute mt-1 w-40 md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 ">
                  <ul className="py-1">
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b">
                      Filter By
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                      Category
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                      Status
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                      Date
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                      Recently Added
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Tablet and Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#f2f7ff] text-black">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Accept Offer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Bidding
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productList.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock > 0 ? (
                        product.stock
                      ) : (
                        <span className="text-red-500">Out of stock</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div
                        className={`w-12 h-6 rounded-full flex items-center cursor-pointer ${
                          product.acceptOffer
                            ? "bg-blue-600 justify-end"
                            : "bg-gray-300 justify-start"
                        }`}
                        onClick={() => toggleOffer(index)}
                      >
                        <div className="w-5 h-5 bg-white rounded-full mx-0.5"></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div
                        className={`w-12 h-6 rounded-full flex items-center cursor-pointer ${
                          product.bidding
                            ? "bg-blue-600 justify-end"
                            : "bg-gray-300 justify-start"
                        }`}
                        onClick={() => toggleBidding(index)}
                      >
                        <div className="w-5 h-5 bg-white rounded-full mx-0.5"></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status.charAt(0).toUpperCase() +
                          product.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4 p-4">
            {productList.map((product, index) => (
              <div
                key={index}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{product.name}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                      product.status
                    )}`}
                  >
                    {product.status.charAt(0).toUpperCase() +
                      product.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Date:</span> {product.date}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Category:</span>{" "}
                  {product.category}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Price:</span> £
                  {product.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Stock:</span>{" "}
                  {product.stock > 0 ? (
                    product.stock
                  ) : (
                    <span className="text-red-500">Out of stock</span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Accept Offer:</span>
                    <div
                      className={`w-10 h-5 rounded-full flex items-center cursor-pointer ${
                        product.acceptOffer
                          ? "bg-blue-600 justify-end"
                          : "bg-gray-300 justify-start"
                      }`}
                      onClick={() => toggleOffer(index)}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Bidding:</span>
                    <div
                      className={`w-10 h-5 rounded-full flex items-center cursor-pointer ${
                        product.bidding
                          ? "bg-blue-600 justify-end"
                          : "bg-gray-300 justify-start"
                      }`}
                      onClick={() => toggleBidding(index)}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="px-4 py-5 bg-white border-t border-gray-200 sm:px-6 flex items-center justify-between">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, productList.length)}
                </span>{" "}
                of <span className="font-medium">{productList.length}</span>{" "}
                products
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {getPageNumbers().map((pageNumber, index) =>
                  pageNumber === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${pageNumber}`}
                      onClick={() => goToPage(pageNumber as number)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === pageNumber
                          ? "bg-blue-50 text-blue-600"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                )}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>

          {/* Mobile pagination */}
          <div className="flex items-center justify-between w-full sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? "text-gray-300 bg-gray-50"
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </div>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? "text-gray-300 bg-gray-50"
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
