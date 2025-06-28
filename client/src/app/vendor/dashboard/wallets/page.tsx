"use client";
import {
  Wallet,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import CryptoWallet from "./(components)/CryptoWallet";
import FiatWallet from "./(components)/FiatWallet";

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



const WalletPage = (props: Props) => {
  const [activeWallet, setActiveWallet] = useState<WalletType>("fiat");

  return (
    <div className="bg-[#f6f6f6] rounded-lg py-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 md:px-4 lg:px-5">
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
        <div className="flex items-center gap-x-2 mb-6 ">
          <button
            className={`flex w-1/2 md:w-auto cursor-pointer items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg shadow-sm transition-colors duration-150 ${
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
            className={`flex cursor-pointer w-1/2 md:w-auto items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg shadow-sm transition-colors duration-150 ${
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
          <FiatWallet transactions={transactions} />
        ) : (
          <CryptoWallet />
        )}          
      </div>
    </div>
  );
};

export default WalletPage;
