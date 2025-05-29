"use client";
import React, { useState } from "react";
import {Search} from "lucide-react";

interface Message {
  id: string;
  senderName: string;
  time: string;
  onlineStatus: boolean;
  isRead: boolean;
  content: string;
}

const messages: Message[] = [
  {
    id: "1",
    senderName: "John Doe",
    time: "10:30 AM",
    onlineStatus: true,
    isRead: false,
    content: "Hello, I have a question about your product.",
  },
  {
    id: "2",
    senderName: "Jane Smith",
    time: "Yesterday",
    onlineStatus: false,
    isRead: true,
    content: "Thanks for the quick response!",
  },
  {
    id: "3",
    senderName: "Mike Johnson",
    time: "2 days ago",
    onlineStatus: true,
    isRead: true,
    content: "When will my order be shipped?",
  },
  {
    id: "4",
    senderName: "Sarah Williams",
    time: "3 days ago",
    onlineStatus: false,
    isRead: false,
    content: "Is this item still available?",
  },
];

const page = () => {
  return (
    <div className="bg-[#f6f6f6] rounded-lg py-4 md:p-6 min-h-screen">
      <div className="px-2 md:px-3 lg:px-5">
        <div className="flex justify-between items-center">
          <div className="hidden md:block">
            <h1 className="font-semibold text-xl">My messages</h1>
            <p className="text-sm opacity-70">Everything is here!</p>
          </div>
          
          <div className="flex gap-x-2 items-center rounded-sm border-gray-400">
            <Search />
            <input 
            className="xl:w-md p-2"
            type="search"
            placeholder="Search"
          />
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
