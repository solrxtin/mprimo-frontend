"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Modal from "./Modal";
import { SelectInput } from "./SelectInput";
import FullButton from "./FullButton";

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  subtotal: number;
  status: "Ongoing" | "Ended";
  image: string;
  badge?: string;
}

interface BidItem {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  timestamp: string;
  isHighest?: boolean;
  isUser?: boolean;
}

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionItem: CartItem;
}

export function BidModal({ isOpen, onClose, auctionItem }: BidModalProps) {
  const [currentStep, setCurrentStep] = useState<"bid" | "details">("bid");
  const [customBid, setCustomBid] = useState("");
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 23,
    minutes: 22,
    seconds: 23,
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [shippingData, setShippingData] = useState({
    country: "",
    state: "",
    postalCode: "",
    useDefaultAddress: true,
  });

  // Sample bid data
  const [bids, setBids] = useState<BidItem[]>([
    {
      id: "1",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
      isHighest: true,
    },
    {
      id: "2",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
    },
    {
      id: "3",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
    },
    {
      id: "4",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
    },
  ]);

  const [userBid, setUserBid] = useState<BidItem | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleQuickBid = (amount: number) => {
    setCustomBid(amount.toString());
  };

  const handleSubmitBid = () => {
    if (!customBid) return;

    const newBid: BidItem = {
      id: Date.now().toString(),
      type: "outgoing",
      amount: Number.parseInt(customBid),
      timestamp: new Date().toLocaleString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      isHighest: true,
      isUser: true,
    };

    setUserBid(newBid);
    setCurrentStep("details");
  };

  const handleNext = () => {
    // Handle form submission logic here
    console.log("Bid submitted with details:", { paymentMethod, shippingData });
    onClose();
  };

  const handleBack = () => {
    setCurrentStep("bid");
  };

  const formatCurrency = (amount: number) => {
    return `₦ ${amount.toLocaleString()}`;
  };

  const formatTime = (time: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }) => {
    return `${time.days}d : ${time.hours}h : ${time.minutes}m : ${time.seconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {currentStep === "bid" ? (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Place Bid</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Auction Item Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex space-x-4">
                <div className="relative">
                  <Image
                    src="/placeholder.svg?height=120&width=160"
                    alt="Samsung TV"
                    width={160}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    98"
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Auction Item:</span>
                    <h3 className="font-semibold">
                      Samsung 98 inch Crystal UHD Smart TV
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">
                        Starting Price:
                      </span>
                      <p className="font-bold">{formatCurrency(1700000)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Highest Bid:
                      </span>
                      <p className="font-bold">
                        {formatCurrency(userBid ? userBid.amount : 1750000)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Time Left:</span>
                    <p className="font-bold text-red-600">
                      {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Auction Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold">Live Auction</span>
              </div>
              <span className="text-sm text-gray-600">14 Bids Made</span>
            </div>

            {/* Bid History */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {userBid && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="w-5 h-5 text-red-500">↗</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        Outgoing Bid {formatCurrency(userBid.amount)}
                      </span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Highest bidder
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{userBid.timestamp}</p>
                  </div>
                </div>
              )}
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        Incoming Bid {formatCurrency(bid.amount)}
                      </span>
                      {bid.isHighest && !userBid && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          High bidder
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{bid.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Bid Buttons */}
            <div className="flex space-x-3 mb-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBid(1800000)}
              >
                ₦ 1.8m
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBid(2000000)}
              >
                ₦ 2m
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBid(3000000)}
              >
                ₦ 3m
              </Button>
            </div>

            {/* Custom Bid Input */}
            <div className="flex space-x-3">
              <Input
                placeholder="Enter bid higher than ₦1.8m"
                value={customBid}
                onChange={(e) => setCustomBid(e.target.value)}
                className="flex-1"
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-8"
                onClick={handleSubmitBid}
                disabled={!customBid}
              >
                Submit Bid
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-2">
              <div className="w-1 h-32 bg-blue-600 rounded-full"></div>
              <div className="text-blue-600">▲</div>
              <div className="w-1 h-32 bg-gray-300 rounded-full"></div>
              <div className="text-gray-400">▼</div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Make a bid</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-8">
              To make a bid, provide your preferred payment method and shipping
              address details before you bid. You will be charged only if you
              win
            </p>

            {/* Payment Method */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Payment Method</h3>
              <div className="relative">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full bg-gray-100 border-0 h-12">
                    <SelectValue placeholder="Choose your preferred method of payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="wallet">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Shipping Address</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={shippingData.country}
                    onValueChange={(value) =>
                      setShippingData((prev) => ({ ...prev, country: value }))
                    }
                  >
                    <SelectTrigger className="w-full bg-gray-100 border-0 h-12 mt-1">
                      <SelectValue placeholder="Choose your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                      <SelectItem value="ghana">Ghana</SelectItem>
                      <SelectItem value="kenya">Kenya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={shippingData.state}
                      onValueChange={(value) =>
                        setShippingData((prev) => ({ ...prev, state: value }))
                      }
                    >
                      <SelectTrigger className="w-full bg-gray-100 border-0 h-12 mt-1">
                        <SelectValue placeholder="Choose your country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lagos">Lagos</SelectItem>
                        <SelectItem value="abuja">Abuja</SelectItem>
                        <SelectItem value="kano">Kano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium">
                      Postal Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder="Enter Postal Code"
                      value={shippingData.postalCode}
                      onChange={(e) =>
                        setShippingData((prev) => ({
                          ...prev,
                          postalCode: e.target.value,
                        }))
                      }
                      className="bg-gray-100 border-0 h-12 mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="defaultAddress"
                    checked={shippingData.useDefaultAddress}
                    onCheckedChange={(checked) =>
                      setShippingData((prev) => ({
                        ...prev,
                        useDefaultAddress: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="defaultAddress" className="text-sm">
                    Use default address
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold"
                onClick={handleNext}
              >
                Next
              </Button>
              <Button
                variant="outline"
                className="w-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 h-12 text-lg font-semibold"
                onClick={handleBack}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface BidModal1Props {
  isBid: boolean;
  closeBid: () => void;
}

export const BidModal1 = ({ isBid, closeBid }: BidModal1Props) => {
  const [paymentMethod, setPaymentMethod] = useState("");
    const [customBid, setCustomBid] = useState("");
    const [auctionModal, setAuctionModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 23,
    minutes: 22,
    seconds: 23,
  });

  const [shippingData, setShippingData] = useState({
    country: "",
    state: "",
    postalCode: "",
    useDefaultAddress: true,
  });
  const formatCurrency = (amount: number) => {
    return `₦ ${amount.toLocaleString()}`;
  };

  const formatTime = (time: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }) => {
    return `${time.days}d : ${time.hours}h : ${time.minutes}m : ${time.seconds}s`;
  };
  // Sample bid data
  const [bids, setBids] = useState<BidItem[]>([
    {
      id: "1",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
      isHighest: true,
    },
    {
      id: "2",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
    },
    {
      id: "3",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
    },
    {
      id: "4",
      type: "incoming",
      amount: 2000000,
      timestamp: "Tue 11:34 PM 12/12/2025",
    },
  ]);

  const [userBid, setUserBid] = useState<BidItem | null>(null);

  // Countdown timer effect
  useEffect(() => {
    // if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleQuickBid = (amount: number) => {
    setCustomBid(amount.toString());
  };

  const handleSubmitBid = () => {
    if (!customBid) return;

    const newBid: BidItem = {
      id: Date.now().toString(),
      type: "outgoing",
      amount: Number.parseInt(customBid),
      timestamp: new Date().toLocaleString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      isHighest: true,
      isUser: true,
    };

    setUserBid(newBid);
  };
  const handleClose =()=> {
    closeBid()
    setAuctionModal(false)

  }

  const [step, setStep] =useState(1)

  return (
    <>
      <Modal
        isOpen={isBid} // Replace with your state management for modal visibility
        onClose={handleClose} // Replace with your state management for closing the modal
      >
       {step === 1 && ( <div className="inline-block overflow-hidden text-left pb-4  px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-[white] rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-[620px] sm:w-full">
          <div className="py-4 flex justify-between  ">
            <h3 className="text-[18px] flex-1   md:text-[20px] md:leading-[24px]  text-dark font-semibold">
              Make a bid
            </h3>

            <X
              // onClick={handlecloseModal}
              className="cursor-pointer text-black"
              size={20}
            />
          </div>

          <p className="text-gray-600 mb-8 text-xs md:text-sm">
            To make a bid, provide your preferred payment method and shipping
            address details before you bid. You will be charged only if you win
          </p>

          <div className="grid grid-cols-2 gap-4 md:gap-5 ">
            <p className="text-base md:text-lg font-medium text-dark">
              Payment Method
            </p>
            <div className="col-span-2">
              <SelectInput
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target?.value)}
                placeholder="Choose your preferred method of payment"
                data={[
                  { value: "card", name: "Credit/Debit Card" },
                  { value: "bank", name: "Bank Transfer" },
                  { value: "wallet", name: "Digital Wallet" },
                ]}
              />
            </div>

            <p className="text-base md:text-lg font-medium text-dark">
              Shipping Address
            </p>

            <div className="col-span-2">
              <label className="text-sm md:text-base font-medium text-dark">
                Country<span className="text-red-500">*</span>
              </label>
              <SelectInput
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target?.value)}
                placeholder="CChoose your country"
                data={[
                  { value: "card", name: "Credit/Debit Card" },
                  { value: "bank", name: "Bank Transfer" },
                  { value: "wallet", name: "Digital Wallet" },
                ]}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm md:text-base font-medium text-dark">
                Country<span className="text-red-500">*</span>
              </label>
              <SelectInput
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target?.value)}
                placeholder="CChoose your country"
                data={[
                  { value: "card", name: "Credit/Debit Card" },
                  { value: "bank", name: "Bank Transfer" },
                  { value: "wallet", name: "Digital Wallet" },
                ]}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm md:text-base font-medium text-dark">
                Postal Code<span className="text-red-500">*</span>
              </label>
              <SelectInput
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target?.value)}
                placeholder="Choose your country"
                data={[
                  { value: "card", name: "Credit/Debit Card" },
                  { value: "bank", name: "Bank Transfer" },
                  { value: "wallet", name: "Digital Wallet" },
                ]}
              />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="text-sm md:text-base font-medium text-dark">
                Phone Number<span className="text-red-500">*</span>
              </label>
              <SelectInput
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target?.value)}
                placeholder="Choose your country"
                data={[
                  { value: "card", name: "Credit/Debit Card" },
                  { value: "bank", name: "Bank Transfer" },
                  { value: "wallet", name: "Digital Wallet" },
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <input type="checkbox" /> <p>Use Default Address</p>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            {" "}
            <FullButton name="Next" action={() => setAuctionModal(true)} color="blue" />
            <FullButton name="Back" action={() => {}} color="yellow" />
          </div>
        </div>
    )}{step === 2 && ( 
        <div className="inline-block overflow-hidden text-left pb-4  px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-[white] rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-[620px] sm:w-full">
          <div className="py-4 flex justify-between  ">
            <h3 className="text-[18px] flex-1   md:text-[20px] md:leading-[24px]  text-dark font-semibold">
              Place bid
            </h3>

            <X
              // onClick={handlecloseModal}
              className="cursor-pointer text-black"
              size={20}
            />
          </div>


          <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex space-x-4">
                <div className="relative">
                  <Image
                    src="/images/tv.png"
                    alt="Samsung TV"
                    width={160}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    98"
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Auction Item:</span>
                    <h3 className="font-semibold">
                      Samsung 98 inch Crystal UHD Smart TV
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">
                        Starting Price:
                      </span>
                      <p className="font-bold">{formatCurrency(1700000)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Highest Bid:
                      </span>
                      <p className="font-bold">
                        {formatCurrency(userBid ? userBid.amount : 1750000)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Time Left:</span>
                    <p className="font-bold text-red-600">
                      {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Auction Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold">Live Auction</span>
              </div>
              <span className="text-sm text-gray-600">14 Bids Made</span>
            </div>

            {/* Bid History */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {userBid && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="w-5 h-5 text-red-500">↗</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        Outgoing Bid {formatCurrency(userBid.amount)}
                      </span>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Highest bidder
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{userBid.timestamp}</p>
                  </div>
                </div>
              )}
              {bids.map((bid, index) => (
                <div
                  key={bid.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        Incoming Bid {formatCurrency(bid.amount)}
                      </span>
                      {bid.isHighest && !userBid && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          High bidder
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{bid.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Bid Buttons */}
            <div className="flex space-x-3 mb-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBid(1800000)}
              >
                ₦ 1.8m
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBid(2000000)}
              >
                ₦ 2m
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBid(3000000)}
              >
                ₦ 3m
              </Button>
            </div>

            {/* Custom Bid Input */}
            <div className="flex space-x-3">
              <Input
                placeholder="Enter bid higher than ₦1.8m"
                value={customBid}
                onChange={(e) => setCustomBid(e.target.value)}
                className="flex-1"
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-8"
                onClick={handleSubmitBid}
                disabled={!customBid}
              >
                Submit Bid
              </Button>
            </div>

         
          </div>)}
      </Modal>
    </>
  );
};
