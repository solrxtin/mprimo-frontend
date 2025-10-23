"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import SocketService from "@/utils/socketService";
import { NumericFormat } from "react-number-format";

interface Bid {
  user: string;
  maxAmount: number;
  currentAmount: number;
  isWinning: boolean;
}

const AuctionPage = () => {
  const { id } = useParams();
  const { user } = useUserStore();
  const [bidAmount, setBidAmount] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  useEffect(() => {
    if (user?._id && id) {
      const socket = SocketService.connect(user._id);
      
      // Join auction room
      socket.emit("join_room", id);
      
      // Listen for bid updates
      socket.on("bid:final", (data: any) => {
        setCurrentBid(data.currentBid);
        setHighestBidder(data.highestBidder);
        setBidHistory(data.bidHistory);
      });

      return () => {
        socket.off("bid:final");
      };
    }
  }, [user?._id, id]);

  const handlePlaceBid = () => {
    if (!user || !bidAmount || isPlacingBid) return;
    
    const amount = parseFloat(bidAmount);
    if (amount <= currentBid) return;

    setIsPlacingBid(true);
    const socket = SocketService.getSocket();
    if (socket) {
      socket.emit("place_bid", {
        productId: id,
        userId: user._id,
        amount: amount
      });
    }
    
    setTimeout(() => {
      setIsPlacingBid(false);
      setBidAmount("");
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Live Auction</h1>
        
        {/* Current Bid Display */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Current Highest Bid</p>
            <div className="text-3xl font-bold text-blue-600">
              <NumericFormat
                value={currentBid}
                displayType="text"
                thousandSeparator={true}
                prefix="₦"
                decimalScale={2}
                fixedDecimalScale={true}
              />
            </div>
            {highestBidder && (
              <p className="text-sm text-gray-500 mt-2">
                Leading bidder: {highestBidder === user?._id ? "You" : "Anonymous"}
              </p>
            )}
          </div>
        </div>

        {/* Bid Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Bid Amount
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Minimum: ₦${currentBid + 1}`}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              min={currentBid + 1}
            />
            <button
              onClick={handlePlaceBid}
              disabled={isPlacingBid || !bidAmount || parseFloat(bidAmount) <= currentBid}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPlacingBid ? "Placing..." : "Place Bid"}
            </button>
          </div>
        </div>

        {/* Bid History */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Bid History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bidHistory.map((bid, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  bid.isWinning ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {bid.user === user?._id ? "You" : "Anonymous"}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold">
                      <NumericFormat
                        value={bid.currentAmount}
                        displayType="text"
                        thousandSeparator={true}
                        prefix="₦"
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    </div>
                    {bid.isWinning && (
                      <span className="text-xs text-green-600 font-medium">Winning</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;