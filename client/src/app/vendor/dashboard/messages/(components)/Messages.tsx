import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  isRead: boolean;
}

interface MessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
}

const Messages = ({ messages, currentUserId }: MessagesProps) => {
  const [shouldScroll, setShouldScroll] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if content height exceeds container height
    if (messagesRef.current) {
      const container = messagesRef.current;
      setShouldScroll(container.scrollHeight > container.clientHeight);
    }
  }, [messages]);

  return (
    <div
      ref={messagesRef}
      className={`flex-1 p-4 ${
        shouldScroll ? "overflow-y-auto" : "overflow-y-hidden"
      }`}
      style={{
        minHeight: "200px", // Minimum height to prevent tiny chat area
        maxHeight: "calc(100vh - 180px)", // Maximum height to prevent overflow
      }}
    >
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">No messages yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSent={message.senderId === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
