// MessageBubble.tsx
import React from "react";
import { Check, CheckCheck } from "lucide-react";

interface MessageProps {
  message: {
    id: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
  };
  isSent: boolean;
}

const MessageBubble: React.FC<MessageProps> = ({ message, isSent }) => {
  // Format time to display as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
          isSent 
            ? 'bg-[#8baff9] text-white rounded-tr-none' 
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isSent ? 'text-white/80' : 'text-gray-500'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {isSent && (
            message.isRead ? (
              <CheckCheck size={14} />
            ) : (
              <Check size={14} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;