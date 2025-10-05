"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

interface Notification {
  id: string;
  type: "payment" | "offer" | "bid" | "message";
  title: string;
  message: string;
  date: string;
  time: string;
  avatar: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "payment",
    title: "Payment made Successful",
    message: "Your N25,000 payment for Apple iPad was Successful",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/ipad.jpg"
  },
  {
    id: "2",
    type: "offer",
    title: "Counter Offer Received",
    message: "You have a countered offer of N20,000 for Apple Ipad",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/ipad.jpg"
  },
  {
    id: "3",
    type: "bid",
    title: "Bid Rejected",
    message: "Your N25,000 payment for Apple iPad was Rejected",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/ipad.jpg"
  },
  {
    id: "4",
    type: "message",
    title: "Message Inbox",
    message: "You have new message from a vendor",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/message-icon.png"
  },
  {
    id: "5",
    type: "payment",
    title: "Payment made Successful",
    message: "Your N25,000 payment for Apple iPad was Successful",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/ipad.jpg"
  },
  {
    id: "6",
    type: "payment",
    title: "Payment made Successful",
    message: "Your N25,000 payment for Apple iPad was Successful",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/ipad.jpg"
  },
  {
    id: "7",
    type: "payment",
    title: "Payment made Successful",
    message: "Your N25,000 payment for Apple iPad was Successful",
    date: "February 12th, 2025",
    time: "1:30pm",
    avatar: "/images/ipad.jpg"
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/home" },
    { label: "Notifications", href: null },
  ];

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleRemoveAll = () => {
    setNotifications([]);
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleViewNotification = (id: string) => {
    console.log("View notification:", id);
  };

  const getNotificationIcon = (type: string, avatar: string) => {
    if (type === "message") {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
        <img 
          src={avatar} 
          alt="notification" 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={manualBreadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-4"
      />
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <Button 
              onClick={handleRemoveAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Remove All
            </Button>
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No notifications to display</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {getNotificationIcon(notification.type, notification.avatar)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm text-gray-500">
                      <p>{notification.date}</p>
                      <p>{notification.time}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleViewNotification(notification.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                      >
                        View
                      </Button>
                      <Button 
                        onClick={() => handleRemoveNotification(notification.id)}
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded text-sm"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}