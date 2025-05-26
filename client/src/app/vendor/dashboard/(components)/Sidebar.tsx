// components/Sidebar.tsx
"use client";
import {
  Box,
  CreditCard,
  HomeIcon,
  LogOut,
  MessageCircleMore,
  MessageSquareDot,
  Settings,
  ShoppingBasket,
  StarIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTimes } from "react-icons/fa";

const navItems = [
  { name: "Dashboard", href: "/vendor/dashboard", icon: <HomeIcon /> },
  { name: "Products", href: "/vendor/dashboard/products", icon: <Box /> },
  {
    name: "Orders",
    href: "/node_modulesvendor/dashboard/orders",
    icon: <ShoppingBasket />,
  },
  {
    name: "Messages",
    href: "/vendor/dashboard/messages",
    icon: <MessageCircleMore />,
  },
  { name: "Settings", href: "/vendor/dashboard/settings", icon: <Settings /> },
  { name: "Reviews", href: "/vendor/dashboard/reviews", icon: <StarIcon /> },
  { name: "Wallets", href: "/vendor/dashboard/wallets", icon: <CreditCard /> },
];

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = true, onClose }: Props) {
  const pathname = usePathname();

  return (
    <div
      className={`
      fixed md:static top-0 left-0 h-full bg-white shadow-md z-40
      w-64 md:w-32 lg:w-64 transform transition-transform duration-300 ease-in-out font-[family-name:var(--font-alexandria)]
      ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
    `}
    >
      {/* <div className="p-4 flex justify-between items-center border-b md:hidden">
        <h2 className="font-bold text-xl">Menu</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500">
            <FaTimes size={20} />
          </button>
        )}
      </div> */}

      <div className="p-6">
        <div className="flex justify-between items-center md:hidden mb-10">
          <h1 className="text-xl font-semibold">Mprimo</h1>
          {onClose && (
            <button onClick={onClose} className="text-gray-500">
              <FaTimes size={20} />
            </button>
          )}
        </div>
        <h1 className="text-xl font-semibold mb-10 hidden md:block">Mprimo</h1>
        <nav>
          <ul className="space-y-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`block p-2 rounded flex md:justify-center lg:justify-start gap-x-2 items-center ${
                      isActive
                        ? "bg-[#dce7fd]"
                        : "hover:bg-gray-700 hover:text-gray-100"
                    }`}
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    <div className="text-sm md:hidden lg:block">
                      {item.name}
                    </div>
                  </Link>
                  {/* Tooltip - only visible on md screens when text is hidden */}
                  <div className="hidden md:block lg:hidden absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="absolute bottom-20 left-5">
        <button className="flex gap-x-2 items-center cursor-pointer">
          <LogOut />
          <p>Log Out</p>
        </button>
      </div>
    </div>
  );
}
