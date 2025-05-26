"use client";

import Image from "next/image";
import React, { useState, useRef } from "react";
import { Search } from "lucide-react";
import { FaBars } from "react-icons/fa";
import NotificationModal from "./NotifiicationModal";

type Props = {
  onOpenSidebar?: () => void;
};

const Header = (props: Props) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationBellRef = useRef<HTMLButtonElement>(null);

  const unreadNotificationsCount = 2;

  return (
    <header className="sticky w-full flex justify-between px-4 md:px-10 py-4 md:py-8">
      <div className="flex items-center gap-x-4">
        <button
          className="md:hidden text-gray-700"
          onClick={props.onOpenSidebar}
        >
          <FaBars size={20} />
        </button>

        <div
          className={`${
            showSearch ? "flex" : "hidden md:flex"
          } w-full gap-x-3 border border-gray-200 items-center px-4 py-2 font-[family-name:var(--font-poppins)]`}
        >
          <Search className="text-gray-300 font-light" size={16} />
          <input
            type="text"
            placeholder="Search"
            className="lg:w-md outline-none text-[#323232]"
          />
        </div>
      </div>
      <div className="flex gap-x-4 md:gap-x-8 p-1 items-center">
        <button
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="text-gray-700" size={18} />
        </button>
        <div className="relative">
          <button
            ref={notificationBellRef}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 17V15H2V8C2 6.61667 2.41667 5.39167 3.25 4.325C4.08333 3.24167 5.16667 2.53333 6.5 2.2V1.5C6.5 1.08333 6.64167 0.733333 6.925 0.449999C7.225 0.15 7.58333 0 8 0C8.41667 0 8.76667 0.15 9.05 0.449999C9.35 0.733333 9.5 1.08333 9.5 1.5V2.2C10.8333 2.53333 11.9167 3.24167 12.75 4.325C13.5833 5.39167 14 6.61667 14 8V15H16V17H0ZM8 20C7.45 20 6.975 19.8083 6.575 19.425C6.19167 19.025 6 18.55 6 18H10C10 18.55 9.8 19.025 9.4 19.425C9.01667 19.8083 8.55 20 8 20ZM4 15H12V8C12 6.9 11.6083 5.95833 10.825 5.175C10.0417 4.39167 9.1 4 8 4C6.9 4 5.95833 4.39167 5.175 5.175C4.39167 5.95833 4 6.9 4 8V15Z"
                fill="#1D1B20"
              />
            </svg>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationModal
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              anchorEl={notificationBellRef.current}
            />
          )}
        </div>
        <div className="h-8 w-8 overflow-hidden rounded-full">
          <Image
            src="/images/vendor-image.jpg"
            alt="vendor's image"
            className="object-cover h-full w-full"
            width={32}
            height={32}
            priority
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
