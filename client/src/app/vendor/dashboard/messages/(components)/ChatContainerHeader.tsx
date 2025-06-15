import { ArrowLeft, Phone } from "lucide-react";
import React from "react";
import { Message } from "../page";

type Props = {
  message: Message;
  closeChat: () => void;
};

const ChatContainerHeader = (props: Props) => {
  return (
    <div>
      {/* Chat container header */}
      <div className="py-4 bg-[#eff3fd] rounded-t-2xl px-2 lg:rounded-none lg:px-0">
        <div className="flex justify-between items-center lg:px-2">
          <div className="flex gap-x-2 items-center">
            <ArrowLeft
              size={20}
              onClick={props.closeChat}
              className="opacity-80 lg:hidden"
            />
            <div className="size-10 rounded-full bg-gray-300" />
            <div className="flex flex-col gap-y-1 items-start">
              <h1 className="font-semibold text-sm opacity-80">
                {props.message?.senderName}
              </h1>
              <div className="text-xs">
                {props.message?.onlineStatus ? (
                  <div className="relative">
                    <p className="bg-green-100 text-green-800 p-1 px-2 rounded-md">
                      online
                    </p>
                    <div className="absolute size-2 rounded-full right-[-1] top-0 bg-green-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="relative opacit-70">
                    <p className="bg-red-100 text-red-800 p-1 px-2 rounded-md">
                      offline
                    </p>
                    <div className="absolute size-2 rounded-full right-[-1] top-0 bg-red-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-x-2">
            <div className="flex items-center bg-[#8baff9] rounded-full p-2 justify-center">
              <Phone size={20} strokeWidth={2} className="text-white fill-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainerHeader;
