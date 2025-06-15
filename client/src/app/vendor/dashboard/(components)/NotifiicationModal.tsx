"use client";
import React, { useState } from "react";
import { X, Box, ShoppingBag, MessageSquare, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useNotifications } from "@/contexts/NotificationContext";

type NotificationType = "review" | "order" | "product-listed" | "message";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  time: string;
  read: boolean;
  product?: {
    productName?: string;
    productImage?: string;
    productId: string;
  };
  sender?: {
    name: string;
    profileImg: string;
    message?: string;
    comment?: string;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "product-listed",
    title: "Product Listed",
    message: "Your product has been successfully listed",
    time: "8 min ago",
    read: true,
    product: {
      productId: "xyz",
      productName: "Bluetooth Speaker",
      productImage: "/images/bluetooth-speaker.png",
    },
  },
  {
    id: "2",
    type: "message",
    title: "New Message",
    message: "Sent you a message about your product",
    time: "17 min ago",
    read: true,
    product: {
      productName: "Fitness Tracker",
      productImage: "/images/smart-watch.png",
      productId: "abc",
    },
    sender: {
      name: "Edward Curry",
      profileImg: "/images/edward-curry.jpg",
      message:
        "Hello, I'm interested in your product. Can you provide more details?",
    },
  },
  {
    id: "3",
    type: "message",
    title: "New Message",
    message: "You have unread messages from Maria Hill",
    time: "45 min ago",
    read: false,
    product: {
      productId: "def",
      productName: "Wireless Headphones",
      productImage: "/images/wireless-headset.png",
    },
    sender: {
      name: "Maria Hill",
      profileImg: "/images/maria-hill.jpg",
      message:
        "Hey, how's it going? I'm interested in your product. Can you provide more details?",
      comment: "I'm interested in your product. Can you provide more details?",
    },
  },
  {
    id: "4",
    type: "review",
    title: "New Review",
    message: "Left a 5-star review on your product",
    time: "1 day ago",
    read: false,
    product: {
      productId: "ghi",
      productName: "Wireless Headphones",
      productImage: "/images/wireless-headset.png",
    },
    sender: {
      name: "Bovie Wealth",
      profileImg: "/images/vendor-image.jpg",
      comment:
        "This is a nice bag! the color, the size, the material! They are all super nice. I am definatelly getting more of this cool bag......and yeah, the delivery was swift. ",
    },
  },
  {
    id: "5",
    type: "order",
    title: "New Order",
    message: "You received a new order #12345",
    time: "6 hour ago",
    read: false,
    product: {
      productId: "tuv",
      productName: "Smart Watch",
      productImage: "/images/smart-watch.png",
    },
  },
];

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case "review":
      return <Box className="text-yellow-500" size={18} />;
    case "order":
      return <ShoppingBag className="text-blue-500" size={18} />;
    case "product-listed":
      return <Box className="text-green-500" size={18} />;
    case "message":
      return <MessageSquare className="text-purple-500" size={18} />;
    default:
      return null;
  }
};

const NotificationModal = ({
  isOpen,
  onClose,
  anchorEl,
}: NotificationModalProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const getPosition = () => {
    if (!anchorEl) return {};

    const rect = anchorEl.getBoundingClientRect();
    return {
      top: `${rect.bottom + window.scrollY + 10}px`,
      right: `${window.innerWidth - rect.right - window.scrollX}px`,
    };
  };

  const position = getPosition();

  return (
    <div className="fixed inset-0 z-50 font-[family-name:var(--font-poppins)]">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="fixed z-50 bg-white w-full max-w-md max-h-[80vh] overflow-auto border border-gray-300 shadow-lg"
        style={{
          top: position.top || "60px",
          right: window.innerWidth < 768 ? "0" : position.right || "16px",
          left: window.innerWidth < 768 ? "0" : "auto",
          height: window.innerWidth < 768 ? "calc(100vh - 60px)" : "auto",
          maxHeight: window.innerWidth < 768 ? "none" : "80vh",
        }}
      >
        {/* Triangle pointer at top */}
        <div className="sticky top-0 bg-white z-50 border-b border-b-[#dcdee4] font-[family-name:var(--font-inter)]">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-x-1">
              <h2 className="text-lg font-bold">Notifications</h2>
              {unreadCount > 0 && (
                <div className="relative bg-blue-600 p-2 rounded-full">
                  <p className="text-sm text-gray-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {unreadCount}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4 items-center">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-50 hover:text-gray-700 bg-red-500 rounded-full p-0.5 "
              >
                <X size={16} strokeWidth={4}/>
              </button>
            </div>
          </div>
        </div>

        <div className="">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-b-[#dcdee4] ${
                    notification.read ? "bg-[#fafbff]" : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="rounded-full flex items-center justify-center flex-shrink-0">
                      {notification?.sender?.name ? (
                        <Image
                          src={notification.sender.profileImg}
                          alt={notification.sender.name}
                          width={32}
                          height={32}
                          className="object-cover rounded-full"
                        />
                      ) : (
                        <NotificationIcon type={notification.type} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center font-[family-name:var(--font-alexandria)] ">
                        {notification?.sender?.name && (
                          <p>{notification.sender.name}</p>
                        )}
                        <p className="font-medium text-xs text-blue-800 bg-blue-100 p-1">
                          {notification.title}
                        </p>
                      </div>
                      <div className="flex gap-x-2">
                        <div className="font-[family-name:var(--font-alexandria)] ">
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-600">
                            {notification.time}
                          </span>
                        </div>
                        {notification?.product?.productName && (
                          <div className="mt-2 flex items-center gap-x-2 bg-gray-50 rounded font-[family-name:var(--font-poppins)] flex-shrink-0">
                            {notification.product.productImage && (
                              <div className="size-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                                <Image
                                  src={notification.product.productImage}
                                  alt={notification.product.productName}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                  onError={(e) => {
                                    // Fallback for missing images
                                    (e.target as HTMLImageElement).src =
                                      "https://via.placeholder.com/32";
                                  }}
                                />
                              </div>
                            )}
                            <span className="text-xs">
                              {notification?.product.productName}
                            </span>
                          </div>
                        )}
                      </div>

                      {notification.type === "message" && (
                        <div className="mt-3 flex gap-2">
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                            View
                          </button>
                          <button
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
