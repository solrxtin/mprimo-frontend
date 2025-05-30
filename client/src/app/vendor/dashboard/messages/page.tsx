"use client";
import React, { useState } from "react";
import { ArrowLeft, Phone, Search } from "lucide-react";
import ChatContainerHeader from "./(components)/ChatContainerHeader";
import Messages from "./(components)/Messages";
import SendMessage from "./(components)/SendMessage";

export interface Message {
  id: string;
  senderId: string; // Unique sender ID
  senderName: string;
  timestamp: Date;
  onlineStatus: boolean;
  isRead: boolean;
  content: string;
  unreadCount?: number;
}

interface UserMessages {
  userId: string;
  messages: Message[];
}

// Sample data with messages grouped per user
// Define the current user ID (vendor/admin)
const currentUserId = "vendor1";

// Sample data with messages grouped per user
const userMessages: UserMessages[] = [
  {
    userId: "user1",
    messages: [
      {
        id: "1",
        senderId: "user1", // Message from user
        senderName: "John Doe",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        onlineStatus: true,
        isRead: true,
        content: "Hello, I have some questions about your product.",
      },
      {
        id: "2",
        senderId: currentUserId, // Message from vendor
        senderName: "Vendor",
        timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000), // 1.9 hours ago
        onlineStatus: true,
        isRead: true,
        content:
          "Hi John! I'd be happy to answer your questions. What would you like to know?",
      },
      {
        id: "3",
        senderId: "user1", // Message from user
        senderName: "John Doe",
        timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000), // 1.8 hours ago
        onlineStatus: true,
        isRead: false,
        content:
          "Thanks for the quick response! Does this product come with a warranty?",
      },
    ],
  },
  {
    userId: "user2",
    messages: [
      {
        id: "4",
        senderId: "user2",
        senderName: "Mike Johnson",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        onlineStatus: true,
        isRead: true,
        content: "When will my order be shipped?",
      },
      {
        id: "5",
        senderId: currentUserId,
        senderName: "Vendor",
        timestamp: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000), // 1.9 days ago
        onlineStatus: true,
        isRead: true,
        content:
          "Your order has been processed and will ship tomorrow. You'll receive a tracking number via email.",
      },
    ],
  },
  {
    userId: "user3",
    messages: [
      {
        id: "6",
        senderId: "user3",
        senderName: "Emma Thompson",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        onlineStatus: true,
        isRead: false,
        content: "I'd like to return my purchase. How do I proceed?",
      },
      // No response yet from vendor
    ],
  },
  {
    userId: "user4",
    messages: [
      {
        id: "7",
        senderId: "user4",
        senderName: "David Wilson",
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        onlineStatus: false,
        isRead: true,
        content: "Do you offer international shipping?",
      },
      {
        id: "8",
        senderId: currentUserId,
        senderName: "Vendor",
        timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
        onlineStatus: true,
        isRead: false,
        content:
          "Yes, we do offer international shipping to most countries. Shipping costs vary by location. Where are you located?",
      },
    ],
  },
  {
    userId: "user5",
    messages: [
      {
        id: "9",
        senderId: "user5",
        senderName: "Olivia Martinez",
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // Yesterday
        onlineStatus: true,
        isRead: true,
        content: "Can you provide more details about the warranty?",
      },
      {
        id: "10",
        senderId: currentUserId,
        senderName: "Vendor",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        onlineStatus: true,
        isRead: true,
        content:
          "Our products come with a 1-year standard warranty that covers manufacturing defects. Would you like me to send you the full warranty terms?",
      },
      {
        id: "11",
        senderId: "user5",
        senderName: "Olivia Martinez",
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        onlineStatus: true,
        isRead: false,
        content:
          "Yes, please send me the full warranty terms. Also, is the warranty international?",
      },
    ],
  }
];

// Helper function to format dates for display
export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
};

// First, get the latest message timestamp for each user conversation
const userChatsWithLatestTimestamp = userMessages.map((user) => {
  // Find the latest message in the conversation (from any sender)
  const latestMessageTimestamp = Math.max(
    ...user.messages.map((msg) => msg.timestamp.getTime())
  );

  // Get the latest message from the user (not from vendor)
  const userMessages = user.messages.filter(
    (msg) => msg.senderId !== currentUserId
  );
  const latestUserMessage = userMessages.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )[0];

  // Count unread messages from this user
  const unreadCount = userMessages.filter((msg) => !msg.isRead).length;

  return {
    ...latestUserMessage,
    unreadCount,
    latestTimestamp: latestMessageTimestamp, // Used for sorting
  };
});

// Sort conversations by the latest message timestamp (newest first)
const latestUserMessages = userChatsWithLatestTimestamp.sort(
  (a, b) => b.latestTimestamp - a.latestTimestamp
);
console.log(latestUserMessages);

const Page = () => {
  const [chatMessages, setChatMessages] =
    useState<Message[]>(latestUserMessages);
  const [selectedButton, setSelectedButton] = useState<"All" | "Unread">("All");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleButtonClicked = (button: "All" | "Unread") => {
    setSelectedButton(button);
    if (button === "All") {
      setChatMessages(latestUserMessages);
    } else if (button === "Unread") {
      const filteredMessages = latestUserMessages.filter(
        (message) => !message.isRead
      );
      setChatMessages(filteredMessages);
    }
  };

  const handleChatClicked = (message: Message) => {
    setSelectedMessage(message);

    if (window.innerWidth <= 850) {
      setIsChatOpen(true);
    }
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg py-4 xl:p-6 min-h-screen">
      <div className="px-2 md:px-3 lg:px-6 xl:px-5">
        <div className="hidden md:block md:mb-5 ">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-semibold text-xl">My messages</h1>
              <p className="text-sm opacity-70">Everything is here!</p>
            </div>
            <div className="flex gap-x-2 items-center border rounded-sm border-gray-400 p-2">
              <Search size={18} strokeWidth={4} className="text-gray-600" />
              <input
                className="xl:w-md"
                type="search"
                placeholder="Search Conversations"
              />
            </div>
          </div>
        </div>
        <div className={`flex gap-x-2  ${isChatOpen ? "h-0" : "h-[80vh]"}`}>
          <div
            className={`${
              isChatOpen ? "hidden lg:block" : "block"
            } mx-2 md:mx-0 lg:m-0 w-full lg:w-[45%] xl:w-[40%] border rounded-2xl lg:rounded-none border-blue-300 lg:p-2 bg-white`}
          >
            <h1 className="hidden lg:block text-center font-semibold">
              Messages
            </h1>
            <div className="flex gap-x-2 items-center border rounded-sm border-gray-400 p-2 m-4 lg:m-2 md:hidden">
              <Search size={18} strokeWidth={4} className="text-gray-600" />
              <input
                className="w-full"
                type="search"
                placeholder="Search Conversations"
              />
            </div>
            <div className="flex gap-x-4 w-full justify-between items-center px-3 md:mt-3 lg:mt-0">
              <button
                className={`${
                  selectedButton === "All" ? "bg-[#f5f9ff]" : "bg-gray-50"
                } p-2 rounded-md w-full`}
                onClick={() => handleButtonClicked("All")}
              >
                All
              </button>
              <button
                className={`${
                  selectedButton === "Unread" ? "bg-[#f5f9ff]" : "bg-gray-50"
                } p-2 rounded-md w-full`}
                onClick={() => handleButtonClicked("Unread")}
              >
                Unread
              </button>
            </div>
            {/* Chat List */}
            <div className="flex flex-col gap-y-2 w-full h-[calc(100%-80px)] overflow-y-auto mt-2 px-2">
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500">
                  No messages available.
                </p>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`grid grid-cols-12 items-center cursor-pointer rounded relative p-2 ${
                      message.isRead
                        ? "bg-white pl-3.5"
                        : "border-l-6 border-blue-400 rounded-none"
                    }`}
                    onClick={() => handleChatClicked(message)}
                  >
                    <div className="col-span-2 md:col-span-1 lg:col-span-2 size-12 md:size-11 rounded-full bg-gray-300" />
                    <div className="col-span-10 md:col-span-11 lg:col-span-10 flex flex-col gap-y-1">
                      <h1 className="font-semibold text-sm">
                        {message.senderName}
                      </h1>
                      <p className="text-xs truncate">{message.content}</p>
                    </div>
                    <div
                      className={`absolute ${
                        message.unreadCount! > 0 ? "right-6" : "right-2"
                      } top-1`}
                    >
                      <p className="text-xs opacity-70 relative">
                        {formatMessageTime(message.timestamp)}
                      </p>
                      {message.unreadCount! > 0 && (
                        <div className="absolute right-[-18px] top-0 bg-[#8baff9] size-4 rounded-full flex items-center justify-center">
                          <p className="text-xs text-white">
                            {message.unreadCount}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="hidden lg:block lg:w-[55%] xl:w-[60%] border border-blue-300 bg-white">
            {selectedMessage ? (
              <div className="w-full h-full flex flex-col">
                <ChatContainerHeader
                  message={selectedMessage}
                  closeChat={() => setIsChatOpen(false)}
                />
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <Messages
                      messages={
                        userMessages.find(
                          (u) => u.userId === selectedMessage.senderId
                        )?.messages || []
                      }
                      currentUserId={currentUserId}
                    />
                  </div>
                  <SendMessage
                    userId={selectedMessage.senderId}
                    onSend={(message) => {
                      console.log(
                        `Sending message to ${selectedMessage.senderName}: ${message}`
                      );
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="bg-gray-50 rounded-lg p-6 text-center w-full max-w-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Conversation Selected
                  </h3>
                  <p className="text-gray-500">
                    Select a message from the list to view your conversation
                    history.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {isChatOpen && (
          <div className="lg:hidden h-[80vh] p-2">
            <div className="bg-white border rounded-2xl border-blue-300 w-full h-full flex flex-col">
              {/* Chat container header */}
              {selectedMessage && (
                <ChatContainerHeader
                  message={selectedMessage}
                  closeChat={() => setIsChatOpen(false)}
                />
              )}
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedMessage ? (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <Messages
                        messages={
                          userMessages.find(
                            (u) => u.userId === selectedMessage.senderId
                          )?.messages || []
                        }
                        currentUserId={currentUserId}
                      />
                    </div>
                    <SendMessage
                      userId={selectedMessage.senderId}
                      onSend={(message) => {
                        console.log(
                          `Sending message to ${selectedMessage.senderName}: ${message}`
                        );
                      }}
                    />
                  </>
                ) : (
                  <p className="text-gray-500">
                    Select a message to view details.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
