"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, ShoppingBag, MessageCircle, Wallet, Heart, Star, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Overview", href: "/user", icon: LayoutDashboard },
  { name: "Orders", href: "/user/orders", icon: ShoppingBag },
  { name: "Messages", href: "/user/messages", icon: MessageCircle },
  { name: "Wallet", href: "/user/wallet", icon: Wallet },
  { name: "Wishlists", href: "/user/wishlists", icon: Heart },
  { name: "Needs Reviews", href: "/user/reviews", icon: Star },
  { name: "Settings", href: "/user/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-2">
      {navigation.map((item) => {
        const isActive = pathname === item.href 
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-normal",
                isActive ? "bg-blue-100 text-blue-700 border-l-4 border-blue-700" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
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
