"use client";
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  Wallet,
  Search,
  ArrowRight,
  CircleDollarSign,
  Landmark,
  Plus,
  Bitcoin,
  Coins,
  Copy,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Props = {};

type WalletType = "fiat" | "crypto";

type Transaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  date: string;
  description: string;
  status: "completed" | "pending" | "failed";
};

type CryptoTransaction = {
  id: string;
  type: "send" | "receive";
  amount: number;
  token: string;
  date: string;
  address: string;
  status: "confirmed" | "pending" | "failed";
  hash: string;
};

const transactions: Transaction[] = [
  {
    id: "TRX-001",
    type: "credit",
    amount: 2500.0,
    date: "2023-11-28",
    description: "Payment for Order #12345",
    status: "completed",
  },
  {
    id: "TRX-002",
    type: "debit",
    amount: 1200.5,
    date: "2023-11-25",
    description: "Withdrawal to Bank Account",
    status: "completed",
  },
  {
    id: "TRX-003",
    type: "credit",
    amount: 750.25,
    date: "2023-11-20",
    description: "Payment for Order #12340",
    status: "completed",
  },
  {
    id: "TRX-004",
    type: "debit",
    amount: 500.0,
    date: "2023-11-15",
    description: "Platform Fee",
    status: "completed",
  },
  {
    id: "TRX-005",
    type: "credit",
    amount: 1800.75,
    date: "2023-11-10",
    description: "Payment for Order #12335",
    status: "pending",
  },
];

const cryptoTransactions: CryptoTransaction[] = [
  {
    id: "CTX-001",
    type: "receive",
    amount: 0.25,
    token: "BTC",
    date: "2023-11-28",
    address: "0x3a8b7c9d2e1f4a5b6c8d9e0f1a2b3c4d5e6f7a8b",
    status: "confirmed",
    hash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
  },
  {
    id: "CTX-002",
    type: "send",
    amount: 0.15,
    token: "BTC",
    date: "2023-11-25",
    address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    status: "confirmed",
    hash: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b7a8b9c0d1e2f3a4b5c6d7e8f",
  },
  {
    id: "CTX-003",
    type: "receive",
    amount: 1.5,
    token: "ETH",
    date: "2023-11-20",
    address: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    status: "confirmed",
    hash: "0xc6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
  },
  {
    id: "CTX-004",
    type: "send",
    amount: 0.75,
    token: "ETH",
    date: "2023-11-15",
    address: "0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    status: "pending",
    hash: "0xe8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
  },
  {
    id: "CTX-005",
    type: "receive",
    amount: 500,
    token: "USDT",
    date: "2023-11-10",
    address: "0x9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    status: "confirmed",
    hash: "0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
  },
];

const WalletPage = (props: Props) => {
  const [activeWallet, setActiveWallet] = useState<WalletType>("fiat");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [displayedTransactions, setDisplayedTransactions] = useState<
    Transaction[]
  >([]);
  const [totalPages, setTotalPages] = useState(0);

  // Pagination state for crypto transactions
  const [cryptoCurrentPage, setCryptoCurrentPage] = useState(1);
  const [displayedCryptoTransactions, setDisplayedCryptoTransactions] =
    useState<CryptoTransaction[]>([]);
  const [cryptoTotalPages, setCryptoTotalPages] = useState(0);

  // Calculate pagination on mount and when filters change
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(transactions.length / itemsPerPage);
    setTotalPages(total);

    // Get current transactions
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayedTransactions(
      transactions.slice(indexOfFirstItem, indexOfLastItem)
    );
  }, [currentPage, itemsPerPage]);

  // Calculate pagination for crypto transactions
  useEffect(() => {
    const total = Math.ceil(cryptoTransactions.length / itemsPerPage);
    setCryptoTotalPages(total);

    const indexOfLastItem = cryptoCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayedCryptoTransactions(
      cryptoTransactions.slice(
        indexOfFirstItem,
        indexOfFirstItem + itemsPerPage
      )
    );
  }, [cryptoCurrentPage, itemsPerPage]);

  // Handle page changes
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle page changes for crypto
  const goToCryptoPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= cryptoTotalPages) {
      setCryptoCurrentPage(pageNumber);
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

  // Navigation functions for crypto
  const nextCryptoPage = () => {
    if (cryptoCurrentPage < cryptoTotalPages) {
      setCryptoCurrentPage(cryptoCurrentPage + 1);
    }
  };

  const prevCryptoPage = () => {
    if (cryptoCurrentPage > 1) {
      setCryptoCurrentPage(cryptoCurrentPage - 1);
    }
  };

  // Generate page numbers for display
  const getPageNumbers = (current: number, total: number) => {
    const pageNumbers = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      if (current > 3) {
        pageNumbers.push("...");
      }

      const startPage = Math.max(2, current - 1);
      const endPage = Math.min(total - 1, current + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (current < total - 2) {
        pageNumbers.push("...");
      }

      if (total > 1) {
        pageNumbers.push(total);
      }
    }

    return pageNumbers;
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("Text copied");
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg py-4 md:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 md:px-3 lg:px-5">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">My Wallet</h1>
            <p className="text-sm text-gray-500">
              Manage your wallet and track your income
            </p>
          </div>
          <button className="flex px-7.5 py-4 items-center gap-2 bg-[#002f7a] text-white rounded-md ml-2">
            <div>Wallet</div>
            <svg
              width="20"
              height="15"
              viewBox="0 0 20 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.399902 2.5C0.399902 1.11929 1.51919 0 2.8999 0H12.8999C14.2806 0 15.3999 1.11929 15.3999 2.5V4H16.8999C18.2806 4 19.3999 5.11929 19.3999 6.5V12.5C19.3999 13.8807 18.2806 15 16.8999 15H6.8999C5.51919 15 4.3999 13.8807 4.3999 12.5V11H2.8999C1.51919 11 0.399902 9.88071 0.399902 8.5V2.5ZM5.3999 12.5C5.3999 13.3284 6.07148 14 6.8999 14H16.8999C17.7283 14 18.3999 13.3284 18.3999 12.5V6.5C18.3999 5.67157 17.7283 5 16.8999 5H6.8999C6.07148 5 5.3999 5.67157 5.3999 6.5V12.5ZM14.3999 4H6.8999C5.51919 4 4.3999 5.11929 4.3999 6.5V10H2.8999C2.07148 10 1.3999 9.32843 1.3999 8.5V2.5C1.3999 1.67157 2.07148 1 2.8999 1H12.8999C13.7283 1 14.3999 1.67157 14.3999 2.5V4ZM11.8999 8C11.0715 8 10.3999 8.67157 10.3999 9.5C10.3999 10.3284 11.0715 11 11.8999 11C12.7283 11 13.3999 10.3284 13.3999 9.5C13.3999 8.67157 12.7283 8 11.8999 8ZM9.3999 9.5C9.3999 8.11929 10.5192 7 11.8999 7C13.2806 7 14.3999 8.11929 14.3999 9.5C14.3999 10.8807 13.2806 12 11.8999 12C10.5192 12 9.3999 10.8807 9.3999 9.5Z"
                fill="#FDFDFD"
              />
            </svg>
          </button>
        </div>

        {/* Wallet Type Selector */}
        <div className="flex flex-wrap justify-between md:justify-start md:gap-4 mb-6">
          <button
            className={`flex cursor-pointer items-center gap-2 px-4 md:px-6 py-3 rounded-lg shadow-sm transition-colors duration-150 ${
              activeWallet === "fiat"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => setActiveWallet("fiat")}
          >
            <Wallet size={20} />
            <span className="font-medium">Fiat Wallet</span>
          </button>
          <button
            className={`flex cursor-pointer items-center gap-2 px-4 md:px-6 py-3 rounded-lg shadow-sm transition-colors duration-150 ${
              activeWallet === "crypto"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => setActiveWallet("crypto")}
          >
            <Image
              src="/images/wallet.png"
              height={20}
              width={20}
              alt="crypto wallet"
              className="object-contain"
            />
            <span className="font-medium">Crypto Wallet</span>
          </button>
        </div>

        {activeWallet === "fiat" ? (
          <>
            {/* Wallet Balance Card */}
            <div className="grid md:grid-cols-6 xl:grid-cols-12 gap-y-5 xl:gap-x-5 mb-8 ">
              <div className="w-full md:col-span-8 bg-white rounded-xl p-2 sm:p-6 text-white shadow-lg text-gray-600 order-2 xl:order-1">
                <div className="flex flex-col gap-y-5">
                  <div>
                    <p className="text-gray-800 mb-1">Available Balance</p>
                    <div className="relative w-80">
                      <h2 className="text-gray-600 text-2xl md:text-3xl font-semibold">
                        £8,350.50
                      </h2>
                      <p className="text-green-500 text-xs absolute top-4 left-[40%] md:left-[50%]">
                        + £2,000.00 this month
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-y-4 md:gap-x-10 md:items-center">
                    <div className="bg-gray-100 text-gray-800 px-5 py-2 pb-5 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2 border border-blue-300 shadow-sm">
                      <div className="relative bg-blue-50 rounded-full h-10 w-10 flex items-center justify-center">
                        <CreditCard size={24} className="text-blue-300" />
                      </div>
                      <div>
                        <p className="text-sm">Pending Withdrawal</p>
                        <p className="text-gray-500 text-xl">£1,500.00</p>
                      </div>
                    </div>
                    <div className="bg-gray-100 text-gray-800 px-5 py-2 pb-5 rounded-lg font-medium hover:bg-blue-50 border border-blue-300 shadow-sm transition-colors flex items-center gap-2">
                      <div className="relative bg-[#198754]/20 rounded-full h-10 w-10 flex items-center justify-center">
                        <CircleDollarSign
                          size={24}
                          className="text-[#198754]"
                        />
                      </div>
                      <div>
                        <p className="text-sm">Monthly Earnings</p>
                        <p className="text-gray-500 text-xl">£10,500.00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:col-span-5 md:col-start-3 lg:col-span-4 lg:col-start-4 xl:col-start-9 order-1 xl:order-2">
                <div className="p-2 border rounded-lg border-blue-300">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                    <h1 className="text-lg text-gray-500">Payment Methods</h1>
                    <button className="flex items-center text-green-800">
                      <Plus size={16} />
                      <p className="ml-1 text-md">Add New</p>
                    </button>
                  </div>
                  <div className="flex flex-col mt-4 gap-y-4">
                    <div className="flex py-2 pl-4 pr-1 justify-between border rounded-lg border-blue-300">
                      <div className="flex gap-x-2 items-center">
                        <div className="relative bg-blue-50 rounded-full h-10 w-10 flex items-center justify-center">
                          <Landmark size={24} className="text-blue-300" />
                        </div>
                        <div>
                          <h1>Bank Account</h1>
                          <p className="text-sm text-gray-400">
                            Access Bank 072****813
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#198754]/20 px-4 py-1 rounded-full self-start">
                        <p className="text-xs text-[#198754]">Default</p>
                      </div>
                    </div>
                    <div className="flex py-2 pl-4 pr-1 justify-between border rounded-lg border-blue-300">
                      <div className="flex gap-x-2 items-center">
                        <div className="relative bg-blue-50 rounded-full h-10 w-10 flex items-center justify-center">
                          <Landmark size={24} className="text-blue-300" />
                        </div>
                        <div>
                          <h1>Bank Account</h1>
                          <p className="text-sm text-gray-400">
                            Access Bank 072****813
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-gray-800">£5,050.00</p>
                <p className="text-green-500 text-sm flex items-center mt-1">
                  12.5% from last month
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">Total Withdrawals</p>
                <p className="text-2xl font-bold text-gray-800">£1,700.50</p>
                <p className="text-red-500 text-sm flex items-center mt-1">
                  5.2% from last month
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-800">£1,800.75</p>
                <p className="text-yellow-500 text-sm mt-1">
                  Expected by Dec 5
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="grid grid-cols-6 xl:grid-cols-12 gap-5 mt-5 px-4">
                <div className="relative col-span-6 xl:col-span-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search"
                  />
                </div>

                <div className="relative col-span-6 md:col-span-3">
                  <input
                    type="date"
                    className="border border-gray-200 rounded-md px-3 py-2 w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="relative col-span-6 md:col-span-3 md:justify-self-center">
                  <button className="bg-[#002f7a] text-white px-4 py-2 rounded-xl">
                    Download Statement
                  </button>
                </div>
              </div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Transaction History</h2>
                <button className="flex cursor-pointer text-sm text-blue-600 items-center ">
                  <div>View All</div>
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Transaction ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={
                              transaction.type === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {transaction.type === "credit" ? "+" : "-"}£
                            {transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === "credit"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.type === "credit" ? "Credit" : "Debit"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Transaction List */}
              <div className="md:hidden">
                {displayedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.date}
                        </p>
                      </div>
                      <span
                        className={`font-medium ${
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}£
                        {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">{transaction.id}</p>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          transactions.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{transactions.length}</span>{" "}
                      transactions
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

                      {getPageNumbers(currentPage, totalPages).map(
                        (pageNumber, index) =>
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
          </>
        ) : (
          <>
            {/* Crypto Wallet Content */}
            <div className="grid md:grid-cols-6 xl:grid-cols-12 gap-5 mb-8 md:justify-items-end">
              <div className="w-full md:col-span-8 bg-gradient-to-r from-blue-600 to-[#002f7a] rounded-xl p-6 text-white shadow-lg md:order-2 xl:order-1">
                <div className="flex flex-col gap-y-5">
                  <div>
                    <p className="mb-1">Total Crypto Balance</p>
                    <div className="relative">
                      <h2 className="text-white text-2xl md:text-3xl font-semibold">
                        $12,450.75
                      </h2>
                      <p className="text-green-300 text-xs absolute top-4 left-[40%] md:left-[32%] lg:left-[26%] xl:left-[30%]">
                        + $3,245.50 this month
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-y-4 md:gap-x-10 md:items-center">
                    <div className="bg-white/10 backdrop-blur-sm text-white px-5 py-2 pb-5 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20 shadow-sm">
                      <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center">
                        <Image
                          src="/images/Virtual-Coin-Crypto-Tether--Streamline-Ultimate.png"
                          width={24}
                          height={24}
                          alt="usdt image"
                          className="text-white"
                        />
                      </div>
                      <div>
                        <p className="text-sm">USDT</p>
                        <p className="text-white text-xl">1001 USDT</p>
                        <p className="text-xs text-gray-100">≈ $1000.08</p>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm text-white px-5 py-2 pb-5 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20 shadow-sm">
                      <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center">
                        <Image
                          src="/images/Virtual-Coin-Crypto-Usd--Streamline-Ultimate.png"
                          width={24}
                          height={24}
                          alt="usdt image"
                          className="text-blue-400"
                        />
                      </div>
                      <div>
                        <p className="text-sm">USDC</p>
                        <p className="text-white text-xl">2500 USDC</p>
                        <p className="text-xs text-gray-100">≈ $2500.50</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:col-span-4 md:order-1 xl:order-2 self-end">
                <div className="p-4 border rounded-lg border-blue-300 bg-white">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                    <h1 className="text-lg text-gray-700">Wallet Address</h1>
                  </div>
                  <div className="flex flex-col mt-4 gap-y-4">
                    <div className="p-4 border rounded-lg border-blue-200 bg-blue-50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center">
                            <Image
                              src="/images/Virtual-Coin-Crypto-Tether--Streamline-Ultimate.png"
                              width={24}
                              height={24}
                              alt="usdt image"
                              className="text-white"
                            />
                          </div>
                          <span className="font-medium">USDT</span>
                        </div>
                        <div className="bg-green-100 px-2 py-0.5 rounded-full">
                          <p className="text-xs text-green-700">Active</p>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate w-48">
                          0x3a8b7c9d2e1f4a5b6c8d9e0f1a2b3c4d5e6f7a8b
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                "0x3a8b7c9d2e1f4a5b6c8d9e0f1a2b3c4d5e6f7a8b"
                              )
                            }
                            className="text-gray-500 hover:text-indigo-600"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg border-blue-300 bg-blue-50">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center">
                            <Image
                              src="/images/Virtual-Coin-Crypto-Usd--Streamline-Ultimate.png"
                              width={24}
                              height={24}
                              alt="usdt image"
                              className="text-blue-400"
                            />
                          </div>
                          <span className="font-medium">USDC</span>
                        </div>
                        <div className="bg-green-100 px-2 py-0.5 rounded-full">
                          <p className="text-xs text-green-700">Active</p>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate w-48">
                          0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b"
                              )
                            }
                            className="text-gray-500 hover:text-indigo-600"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Crypto Transaction History */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="grid grid-cols-6 xl:grid-cols-12 gap-5 mt-5 px-4">
                <div className="relative col-span-6 xl:col-span-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search transactions"
                  />
                </div>

                <div className="relative col-span-6 md:col-span-3">
                  <input
                    type="date"
                    className="border border-gray-200 rounded-md px-3 py-2 w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="relative col-span-6 md:col-span-3 md:justify-self-center">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl">
                    Export Transactions
                  </button>
                </div>
              </div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Crypto Transactions</h2>
                <button className="flex cursor-pointer text-sm text-indigo-600 items-center">
                  <div>View All</div>
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>

              {/* Desktop Crypto Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Transaction ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Address
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedCryptoTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tx.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={
                              tx.type === "receive"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {tx.type === "receive" ? "+" : "-"}
                            {tx.amount} {tx.token}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === "receive"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.type === "receive" ? "Receive" : "Send"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          <div className="flex items-center">
                            <span className="truncate max-w-[150px]">
                              {tx.address}
                            </span>
                            <button
                              onClick={() => copyToClipboard(tx.address)}
                              className="ml-2 text-gray-400 hover:text-indigo-600"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              tx.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.status.charAt(0).toUpperCase() +
                              tx.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Crypto Transaction List */}
              <div className="md:hidden">
                {displayedCryptoTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{tx.id}</p>
                        <p className="text-xs text-gray-500">{tx.date}</p>
                      </div>
                      <span
                        className={`font-medium ${
                          tx.type === "receive"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "receive" ? "+" : "-"}
                        {tx.amount} {tx.token}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {tx.address}
                        </p>
                        <button
                          onClick={() => copyToClipboard(tx.address)}
                          className="ml-1 text-gray-400"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          tx.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === "receive"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type === "receive" ? "Receive" : "Send"}
                      </span>
                      <button className="text-xs text-indigo-600">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Crypto Pagination */}
              <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(cryptoCurrentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          cryptoCurrentPage * itemsPerPage,
                          cryptoTransactions.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {cryptoTransactions.length}
                      </span>{" "}
                      transactions
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={prevCryptoPage}
                        disabled={cryptoCurrentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          cryptoCurrentPage === 1
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

                      {getPageNumbers(cryptoCurrentPage, cryptoTotalPages).map(
                        (pageNumber, index) =>
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
                              onClick={() =>
                                goToCryptoPage(pageNumber as number)
                              }
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                                cryptoCurrentPage === pageNumber
                                  ? "bg-indigo-50 text-indigo-600"
                                  : "bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          )
                      )}

                      <button
                        onClick={nextCryptoPage}
                        disabled={cryptoCurrentPage === cryptoTotalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          cryptoCurrentPage === cryptoTotalPages
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

                {/* Mobile crypto pagination */}
                <div className="flex items-center justify-between w-full sm:hidden">
                  <button
                    onClick={prevCryptoPage}
                    disabled={cryptoCurrentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      cryptoCurrentPage === 1
                        ? "text-gray-300 bg-gray-50"
                        : "text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-700">
                    Page{" "}
                    <span className="font-medium">{cryptoCurrentPage}</span> of{" "}
                    <span className="font-medium">{cryptoTotalPages}</span>
                  </div>
                  <button
                    onClick={nextCryptoPage}
                    disabled={cryptoCurrentPage === cryptoTotalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      cryptoCurrentPage === cryptoTotalPages
                        ? "text-gray-300 bg-gray-50"
                        : "text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
