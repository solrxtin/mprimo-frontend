"use client";
import {
  Box,
  CreditCard,
  HomeIcon,
  LogOut,
  MessageCircleMore,
  Settings,
  ShoppingBasket,
  StarIcon,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";

const navItems = [
  { name: "Dashboard", href: "/vendor/dashboard", icon: <HomeIcon /> },
  { name: "Products", href: "/vendor/dashboard/products", icon: <Box /> },
  {
    name: "Orders",
    href: "/vendor/dashboard/orders",
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [lastTapped, setLastTapped] = useState<string | null>(null);

  // Refs for the nav items
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (link: string) => {
    // Set loading state
    setIsLoading(true);
    setLoadingPath(link);
    // Navigate to the link
    router.push(link);
  };

  // Handle tap on tablet
  const handleTabletTap = (item: { name: string; href: string }) => {
    // If this is a tablet (md breakpoint)
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      // If tapping the same item again, navigate
      if (lastTapped === item.name) {
        handleClick(item.href);
        setActiveTooltip(null);
        setLastTapped(null);
      } else {
        // First tap, show tooltip
        setActiveTooltip(item.name);
        setLastTapped(item.name);
      }
    } else {
      // On mobile or desktop, navigate directly
      handleClick(item.href);
    }
  };

  const handleCancleClicked = () => {
    setLastTapped(null)
    setActiveTooltip(null)
  }
  // Reset loading when pathname changes (navigation completes)
  useEffect(() => {
    setIsLoading(false);
    setLoadingPath("");
    setActiveTooltip(null);
    setLastTapped(null);
  }, [pathname]);

  return (
    <div
      className={`
      fixed md:static top-0 left-0 h-full bg-white shadow-md z-40
      w-64 md:w-32 lg:w-64 transform transition-transform duration-300 ease-in-out font-[family-name:var(--font-alexandria)]
      ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
    `}
    >
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
              const isItemLoading = isLoading && loadingPath === item.href;
              const isTooltipActive = activeTooltip === item.name;

              return (
                <li key={item.name} className="relative">
                  <button
                    onClick={() => handleTabletTap(item)}
                    disabled={isLoading || isActive}
                    className={`w-full cursor-pointer p-2 rounded flex md:justify-center lg:justify-start gap-x-2 items-center disabled:cursor-not-allowed 
                      ${
                        isActive
                          ? "bg-[#dce7fd] text-blue-600"
                          : "text-gray-700"
                      } 
                      ${isItemLoading ? "opacity-70" : ""}
                      ${isTooltipActive ? "bg-gray-200" : ""}
                      active:bg-gray-200 hover:bg-gray-100
                      transition-colors duration-150
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isItemLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-blue-500 rounded-full"></div>
                      ) : (
                        item.icon
                      )}
                    </div>
                    <div className="text-sm md:hidden lg:block">
                      {item.name}
                    </div>
                  </button>

                  {/* Tooltip - visible on tap for md screens */}
                  {isTooltipActive && (
                    <div className="hidden md:flex lg:hidden absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 pr-4 whitespace-nowrap z-50 items-center">
                      <div className="relative">
                        <span>{item.name}</span>
                        <span className="ml-1 text-xs opacity-70">
                          (tap again to navigate)
                        </span>
                      </div>
                      <div className="absolute top-[-6] left-[96%]">
                      <button className="bg-red-200 rounded" onClick={handleCancleClicked}>
                        <X className="size-4 text-red-800 font-bold" strokeWidth={4} />
                      </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="absolute bottom-20 left-5">
        <button className="flex gap-x-2 items-center cursor-pointer active:bg-gray-200 p-2 rounded transition-colors duration-150">
          <LogOut />
          <p className="md:hidden lg:inline">Log Out</p>
        </button>
      </div>
    </div>
  );
}
