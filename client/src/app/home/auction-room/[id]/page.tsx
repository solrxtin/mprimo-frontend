"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFetchProductById } from "@/hooks/queries";
import { useUserStore } from "@/stores/useUserStore";
import socketService from "@/utils/socketService";
import { getBids } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Gavel } from "lucide-react";

export default function AuctionRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUserStore();
  const { data: productData, isLoading } = useFetchProductById(id as string);
  const [bids, setBids] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const product = productData?.product;
  const auction = product?.inventory?.listing?.auction;
  const currencySymbol = product?.priceInfo?.currencySymbol || "$";
  const exchangeRate = product?.priceInfo?.exchangeRate || 1;
  const startBidPrice = (auction?.startBidPrice || 0) * exchangeRate;
  const currentHighestBid = bids.length > 0 ? Math.max(...bids.map((b: any) => b.currentAmount)) : startBidPrice;

  // Countdown timer
  useEffect(() => {
    if (!auction) return;
    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.endTime).getTime();
      const diff = endTime - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  // Load bids and setup socket listeners
  useEffect(() => {
    if (!id || !user?._id) return;

    getBids(id as string)
      .then((response) => setBids(response.bids || []))
      .catch(() => setBids([]));

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join_room', id as string, user._id);

      socket.on('place_bid', (bidData: any) => {
        setBids((prevBids) => {
          const existingIndex = prevBids.findIndex(b => b.userId === bidData.userId);
          if (existingIndex > -1) {
            const updated = [...prevBids];
            updated[existingIndex] = { ...updated[existingIndex], currentAmount: bidData.amount, createdAt: new Date() };
            return updated;
          }
          return [{ userId: bidData.userId, currentAmount: bidData.amount, createdAt: new Date() }, ...prevBids];
        });
      });

      socket.on('auction_ended', () => {
        alert('Auction has ended!');
      });

      return () => {
        socket.off('place_bid');
        socket.off('auction_ended');
        socket.emit('leave_room', id as string);
      };
    }
  }, [id, user?._id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product || !auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Auction not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const formatTime = (time: typeof timeLeft) => 
    `${time.days}d : ${time.hours}h : ${time.minutes}m : ${time.seconds}s`;

  const formatCurrency = (amount: number) => `${currencySymbol} ${amount.toFixed(2)}`;
  const formatUSD = (amount: number) => `$ ${amount.toFixed(2)}`;

  const userBid = bids.find((b: any) => b.userId?._id === user?._id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Auction
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-900 font-semibold">LIVE AUCTION</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Auction Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Showcase */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition"></div>
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="relative w-full md:w-80 h-80 object-cover rounded-xl shadow-lg border border-gray-200"
                  />
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-3">LOT #{id}</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
                    <p className="text-gray-600 text-lg">{product.description}</p>
                  </div>
                  
                  {/* Current Bid Display */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="text-sm text-green-700 font-medium mb-2">CURRENT HIGHEST BID</div>
                    <div className="text-5xl font-bold text-gray-900 mb-2">{formatUSD(currentHighestBid)}</div>
                    <div className="text-gray-600">Starting at {formatCurrency(startBidPrice)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-900 font-semibold text-lg">AUCTION ENDS IN</span>
                </div>
                <div className="flex items-center space-x-4 text-gray-900">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.days}</div>
                    <div className="text-xs text-gray-600">DAYS</div>
                  </div>
                  <div className="text-2xl">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-600">HOURS</div>
                  </div>
                  <div className="text-2xl">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-600">MINS</div>
                  </div>
                  <div className="text-2xl">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.seconds}</div>
                    <div className="text-xs text-gray-600">SECS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Bidding Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Live Bids</h2>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">{bids.length} BIDS</Badge>
                </div>
                <div className="text-sm text-gray-600">Real-time bidding activity</div>
              </div>

              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {userBid && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-blue-900">YOUR BID</span>
                      {userBid.isWinning && (
                        <Badge className="bg-green-600 text-white flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> WINNING
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{formatUSD(userBid.currentAmount)}</div>
                    <div className="text-xs text-gray-600">{new Date(userBid.createdAt).toLocaleString()}</div>
                  </div>
                )}

                {bids
                  .filter((b: any) => b.userId !== user?._id)
                  .sort((a: any, b: any) => b.currentAmount - a.currentAmount)
                  .map((bid: any, index: number) => (
                    <div key={bid._id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">Bidder #{index + 1}</span>
                        {index === 0 && !userBid?.isWinning && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">HIGHEST</Badge>
                        )}
                      </div>
                      <div className="text-xl font-bold text-gray-900 mb-1">{formatUSD(bid.currentAmount)}</div>
                      <div className="text-xs text-gray-600">{new Date(bid.createdAt).toLocaleString()}</div>
                    </div>
                  ))}

                {bids.length === 0 && (
                  <div className="text-center py-12">
                    <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-700 text-lg font-semibold">No bids yet</p>
                    <p className="text-gray-500 text-sm mt-2">Be the first to place a bid!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
