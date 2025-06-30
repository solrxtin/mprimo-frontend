"use client"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, ShoppingBag, MessageCircle, Wallet, Heart, Star, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define the base path for your user section
const BASE_PATH = "/home/user"

const navigation = [
  { name: "Overview", href: "", icon: LayoutDashboard }, // Empty string for base path
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Wishlists", href: "/wishlist", icon: Heart },
  { name: "Needs Reviews", href: "/reviews", icon: Star },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname() 
  const router = useRouter();
  
  const handleClick = (link: string) => {
    router.push(link);
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2">
      {navigation.map((item) => {
        // Construct full path
        const fullPath = BASE_PATH + item.href
        const isActive = pathname === fullPath
        
        return (
          <Button
            variant="ghost"
            key={item.name}
            onClick={() => handleClick(fullPath)}
            className={cn(
              "w-full justify-start text-left font-normal",
              isActive ? "bg-blue-100 text-blue-700 border-l-4 border-blue-700" : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </Button>
        )
      })}
      <Button
        variant="ghost"
        className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100 mt-8"
      >
        <LogOut className="mr-3 h-4 w-4" />
        Logout
      </Button>
    </div>
  )
}