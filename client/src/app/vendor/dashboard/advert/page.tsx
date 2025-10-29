"use client";

import { getCurrencySymbol } from "@/utils/currency";
import React, { useState, useEffect } from "react";
import { useVendorProducts } from "@/hooks/queries";
import { ChevronDown, Plus } from "lucide-react";
import PlanCard from "./(componets)/PlanCard";
import ProductSelector from "./(componets)/ProductSelector";
import { ProductType } from "@/types/product.type";
import { useVendorStore } from "@/stores/useVendorStore";

const plans = [
  {
    name: "Basic",
    amount: 20000,
    priviledges: [
      "Free listing of 5 products",
      "Free listing of 5 products",
      "Free listing of 5 products",
      "Free listing of 5 products",
    ],
    currency: "NGN",
  },
  {
    name: "Standard",
    amount: 50000,
    priviledges: [
      "Free listing of 5 products",
      "Free listing of 5 products",
      "Free listing of 5 products",
      "Free listing of 5 products",
    ],
    currency: "NGN",
  },
  {
    name: "Premium",
    amount: 30000,
    priviledges: [
      "Free listing of 5 products",
      "Free listing of 5 products",
      "Free listing of 5 products",
      "Free listing of 5 products",
    ],
    currency: "NGN",
  },
];

type Props = {};

const page = (props: Props) => {
  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [promoPrice, setPromoPrice] = useState<number | "">("");

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const { vendor } = useVendorStore();
  const { data: vendorProducts } = useVendorProducts(vendor?._id!);
  console.log(vendorProducts);

  const paymentMethods = [
    { id: "bank", name: "Bank Transfer", icon: "🏦" },
    { id: "card", name: "Card Payment", icon: "💳" },
    { id: "wallet", name: "Wallet", icon: "👛" },
    { id: "crypto", name: "Crypto", icon: "₿" },
    { id: "applepay", name: "ApplePay", icon: "🍎" },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (selectedPlan && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedPlan, timeLeft]);

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)] text-xs">
      <div className="px-2 lg:px-5">
        <h1 className="text-lg font-semibold">Advertisement</h1>
        <p className="text-xs text-gray-600">
          Provide your product details to show case your product to thousands of
          buyers
        </p>
        <div className="mt-6">
          <h3 className="text-sm mb-2">Product Selection</h3>

          <div className="border border-gray-300 p-4 rounded-md shadow-sm space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Product Selection */}
              <div className="col-span-6 flex flex-col gap-y-2">
                <label
                  htmlFor="product"
                  className="flex justify-between items-center"
                >
                  <span className="font-medium">Product</span>
                  <button
                    type="button"
                    className="text-[#004aad] text-xs flex gap-x-1 items-center hover:underline"
                  >
                    + Add New Product
                  </button>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 border border-gray-300 rounded-md p-2 flex justify-between items-center"
                    onClick={() => setShowSelector((prev) => !prev)}
                  >
                    <span>
                      {selectedProduct
                        ? selectedProduct.name
                        : "Choose your product"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`${showSelector ? "rotate-180" : ""} `}
                    />
                  </button>
                </div>

                {showSelector && (
                  <div className="">
                    <ProductSelector
                      products={vendorProducts}
                      onSelect={(p) => {
                        setSelectedProduct(p);
                        setShowSelector(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Promo Price */}
              <div className="col-span-6 flex flex-col gap-y-2">
                <label htmlFor="price" className="font-medium">
                  Promo Price
                </label>
                <input
                  type="number"
                  id="price"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={promoPrice}
                  disabled={useDefaultPrice}
                  onChange={(e) => setPromoPrice(Number(e.target.value) || "")}
                  placeholder="Enter amount"
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="default"
                    checked={useDefaultPrice}
                    onChange={(e) => {
                      setUseDefaultPrice(e.target.checked);
                      if (e.target.checked && selectedProduct) {
                        // gvgvgvgv
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor="default">Use default price</label>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex flex-col gap-y-2">
              <label htmlFor="description" className="font-medium">
                Additional Information
              </label>
              <textarea
                id="description"
                className="w-full border border-gray-300 rounded-md p-2 resize-none"
                placeholder="Write additional information for your Item."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-gray-600 text-end">
                {description.length}/400
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm mb-2">Promotion Plans</h3>
          <div className="border border-gray-300 p-2">
            <div className="grid grid-cols-12 gap-4 mb-4">
              {plans.map((plan: any) => (
                <div key={plan.name} className="col-span-4">
                  <PlanCard
                    plan={plan}
                    selectedPlan={selectedPlan}
                    setSelectedPlan={setSelectedPlan}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        {selectedPlan && (
          <div className="mt-4">
            <h3 className="text-sm mb-2">Choose Your Payment Method</h3>
            <div className="border border-gray-300 p-4 bg-white rounded-md">
              <p className="text-xs text-gray-600 mb-4">
                Select one of the payment methods below to complete your
                purchase of ₦{selectedPlan.amount.toLocaleString()}.<br />
                Each option is secure, fast, and tailored to suit your
                preferences.
              </p>

              <div className="mb-4">
                <h4 className="text-xs font-medium mb-2">Available Methods:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) =>
                          setSelectedPaymentMethod(e.target.value)
                        }
                        className="mr-3"
                      />
                      <span className="mr-2">{method.icon}</span>
                      <span className="text-xs">{method.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-600">
                  Once you've selected your preferred option, tap "Next" to
                  proceed.
                  <br />
                  Need to change your selection? Simply tap a different method.
                </p>
                <div className="text-xs text-orange-600">
                  ⏳ {formatTime(timeLeft)} minutes remaining
                </div>
              </div>

              {selectedPaymentMethod === "bank" && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md border">
                  <h4 className="text-sm font-medium mb-2">🏦 Bank Transfer</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Please transfer ₦{selectedPlan.amount.toLocaleString()} to
                    the account below to complete your purchase.
                    <br />
                    This account is exclusive to this transaction and will
                    expire in {formatTime(timeLeft)} minutes.
                  </p>
                  <div className="bg-white p-3 rounded border text-xs space-y-1">
                    <div>
                      <strong>Bank Name:</strong> Mprimo's Account
                    </div>
                    <div>
                      <strong>Account Number:</strong> 02020202020
                    </div>
                    <div>
                      <strong>Account Holder:</strong> Mprimo Checkout
                    </div>
                    <div>
                      <strong>Amount:</strong> ₦
                      {selectedPlan.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="bg-green-600 text-white px-4 py-2 rounded text-xs">
                      ✅ Transfer Complete - Next
                    </button>
                    <button
                      onClick={() => setSelectedPaymentMethod("")}
                      className="bg-red-600 text-white px-4 py-2 rounded text-xs"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod && selectedPaymentMethod !== "bank" && (
                <div className="mt-4">
                  <button className="bg-[#004aad] text-white px-6 py-2 rounded text-xs">
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
