"use client"

import { useState } from "react"
import {
  Search,
  Bell,
  Home,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  Star,
  Wallet,
  LogOut,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const sidebarItems = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: Package, label: "Products", id: "products" },
  { icon: ShoppingCart, label: "Orders", id: "orders" },
  { icon: MessageSquare, label: "Messages", id: "messages" },
  { icon: Settings, label: "Settings", id: "settings", active: true },
  { icon: Star, label: "Reviews", id: "reviews" },
  { icon: Wallet, label: "Wallets", id: "wallets" },
]

const settingsNavItems = [
  { label: "My Profile", id: "profile" },
  { label: "Store", id: "store" },
  { label: "Notifications", id: "notifications" },
  { label: "Security", id: "security" },
  { label: "Help & Support", id: "help" },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile")
  const [isAvailable, setIsAvailable] = useState(true)

  const renderProfileSection = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-normal text-gray-900">My Profile</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-normal text-[#000]">Available</span>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Profile" />
          <AvatarFallback>BW</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">Bovie Wealth</h3>
          <p className="text-[#797979]">Vendor since 2023</p>
          <Button variant="outline" size="sm" className="mt-2">
            Change Photo
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="space-y-3  border rounded-md p-2">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Personal Information</h4>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 font-poppins  text-[#797979] gap-6 ">
          <div>
            <Label className="text-sm text-[#797979]">First Name</Label>
            <p className="text-xs">Bovie</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Last Name</Label>
            <p className="text-xs">Wealth</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Bio</Label>
            <p className="text-xs">I'm a vendor specializing in handcrafted home goods and accessories</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Email Address</Label>
            <p className="text-xs">Boviewealth@gmail.com</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Phone Number</Label>
            <p className="text-xs">+234 706 387 0050</p>
          </div>
        </div>
      </div>

      <div className="space-y-3  border rounded-md p-2">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium">Business Information</h4>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 font-poppins  text-[#797979] gap-6 ">
          <div>
            <Label className="text-sm text-[#797979]">Business Name</Label>
            <p className="text-xs">Bovie</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Business Address</Label>
            <p className="text-xs">Wealth</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Social Media Handles</Label>
            <p className="text-xs">Boviewealth1</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Business Email Address</Label>
            <p className="text-xs">Boviewealth@gmail.com</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Business Number</Label>
            <p className="text-xs">+234 706 387 0050</p>
          </div>
        </div>
      </div>

      <div className="space-y-3  border rounded-md p-2">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Address Information</h4>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 font-poppins  text-[#797979] gap-6">
          <div>
            <Label className="text-sm text-[#797979]">Country</Label>
            <p className="text-xs">Bovie</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">City/ State</Label>
            <p className="text-xs">Wealth</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Street Name & Number</Label>
            <p className="text-xs">Boviewealth1</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Postal Code</Label>
            <p className="text-xs">Boviewealth@gmail.com</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Tax ID</Label>
            <p className="text-xs">+234 706 387 0050</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )

  const renderStoreSection = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Store Settings</h2>
        <p className="text-[#797979] mt-1">Configure your store details and preferences</p>
      </div>

      <div className="space-y-3  border rounded-md p-2">
        <div className="flex items-center justify-between">
          <h4 className="text-base md:text-lg font-medium">Store Information</h4>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 font-poppins  text-[#797979] gap-6 ">
          <div>
            <Label className="text-sm text-[#797979]">Business Name</Label>
            <p className="text-xs">Bovie</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Business Address</Label>
            <p className="text-xs">Wealth</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Social Media Handles</Label>
            <p className="text-xs">Boviewealth1</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Business Email Address</Label>
            <p className="text-xs">Boviewealth@gmail.com</p>
          </div>
          <div>
            <Label className="text-sm text-[#797979]">Business Number</Label>
            <p className="text-xs">+234 706 387 0050</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Preferences</h4>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 font-poppins  text-[#797979] gap-6 ">
          <div>
            <Label className="text-sm text-[#797979] mb-2 block">Currency</Label>
            <Select defaultValue="naira">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naira">Naira ₦</SelectItem>
                <SelectItem value="usd">USD $</SelectItem>
                <SelectItem value="eur">EUR €</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-[#797979] mb-2 block">Time Zone</Label>
            <Select defaultValue="eastern">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eastern">Eastern Time (Lagos state)</SelectItem>
                <SelectItem value="central">Central Time</SelectItem>
                <SelectItem value="pacific">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox id="vacation" />
            <div className="space-y-1">
              <Label htmlFor="vacation" className="text-xs">
                Vacation Mode
              </Label>
              <p className="text-sm text-[#797979]">
                When enabled, your store will be temporarily closed and customers will see a vacation message.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-[#002F7A]">Save Changes</Button>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
        <p className="text-[#797979] mt-1">Configure how and when you receive notification</p>
      </div>

      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-medium mb-4">Email Notifications</h4>
          <div className="space-y-4 font-poppins text-[#797979] ">
            <div className="flex items-start space-x-3">
              <Checkbox id="new-orders" defaultChecked />
              <div className="space-y-1">
                <Label htmlFor="new-orders" className="text-sm">
                  New orders
                </Label>
                <p className="text-sm text-[#797979]">Receive an email when a new order is placed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="order-status" defaultChecked />
              <div className="space-y-1">
                <Label htmlFor="order-status" className="text-sm">
                  Order status updates
                </Label>
                <p className="text-sm text-[#797979]">Receive an email when an order status changed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="low-stock" defaultChecked />
              <div className="space-y-1">
                <Label htmlFor="low-stock" className="text-sm">
                  Low stock alerts
                </Label>
                <p className="text-sm text-[#797979]">Receive an email when a product is running low on stock</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="payment-received" defaultChecked />
              <div className="space-y-1">
                <Label htmlFor="payment-received" className="text-sm">
                  Payment received
                </Label>
                <p className="text-sm text-[#797979]">Receive an email when a payment is processed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="product-review" />
              <div className="space-y-1">
                <Label htmlFor="product-review" className="text-xs">
                  Product review
                </Label>
                <p className="text-sm text-[#797979]">Receive an email when a customer review your product</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium mb-4">Push Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox id="push-new-orders" defaultChecked />
              <div className="space-y-1">
                <Label htmlFor="push-new-orders" className="text-sm">
                  New orders
                </Label>
                <p className="text-sm text-[#797979]">Receive a push notification when a new order is placed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="push-new-messages" defaultChecked />
              <div className="space-y-1">
                <Label htmlFor="push-new-messages" className="text-sm">
                  New Messages
                </Label>
                <p className="text-sm text-[#797979]">Receive a push notification when you get a new messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-[#002F7A]">Save Changes</Button>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Security Settings</h2>
        <p className="text-[#000] font-poppins  mt-1">Manage your account security and authentication settings</p>
      </div>

      <div className="space-y-8">
        <div className="rounded-md border p-2 font-poppins ">
          <h4 className="text-lg font-medium mb-4">Change Password</h4>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="current-password" className="mb-1">Enter Current password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div>
              <Label htmlFor="new-password" className="mb-1">Enter New password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-1">Confirm New password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button className="bg-[#002F7A]">Update Password</Button>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium">Two factor authentication</h4>
          <p className="text-[#797979] text-sm mb-4">Add an extra layer of security to your account</p>
        </div>

        <div className="rounded-md border p-2 ">
          <h4 className="text-base md:text-lg font-medium mb-4">Active sessions</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-[#F3F6FD]">
              <div>
                <p className="text-xs">Chrome on Macbook pro</p>
                <p className="text-sm text-[#797979]">Last active : Just now Lagos state, Nigeria</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Current</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-[#F3F6FD]">
              <div>
                <p className="text-xs">Safari on iphone</p>
                <p className="text-sm text-[#797979]">Last active : 2hrs ago Lagos state, Nigeria</p>
              </div>
              <Button variant="destructive" size="sm">
                Revoke
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-[#002F7A]">Save Changes</Button>
      </div>
    </div>
  )

  const renderHelpSection = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-700">Help & Support</h2>
        <p className="text-[#797979] mt-1 ">Find answers to common questions and get support</p>
      </div>

      <div className="space-y-6">
        <h4 className="text-base md:text-lg font-medium">Frequently Asked Question</h4>

        <div className="space-y-4">
          <div className="bg-[#F3F6FD] font-poppins rounded-lg p-4">
            <h5 className="font-medium mb-2">How do I process a refund</h5>
            <p className="text-sm font-poppins  text-[#797979]">
              To process a refund, go to the order details page, click on "action" button and select issues refund,
              follow the prompt to process a refund.
            </p>
          </div>
          <div className="bg-[#F3F6FD] font-poppins rounded-lg p-4">
            <h5 className="font-medium mb-2">How do I add a new product?</h5>
            <p className="text-sm font-poppins  text-[#797979]">
              To process a refund, go to the order details page, click on "action" button and select issues refund,
              follow the prompt to process a refund.
            </p>
          </div>
          <div className="bg-[#F3F6FD] rounded-lg font-poppins p-4">
            <h5 className="font-medium mb-2">How do I change my store settings</h5>
            <p className="text-sm   text-[#797979]">
              To process a refund, go to the order details page, click on "action" button and select issues refund,
              follow the prompt to process a refund.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-base md:text-lg font-medium">Help & Support</h4>
          <p className="text-[#797979] text-sm">
            Need help with something not covered in the FAQs? Our support team is here to help you.
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="What can we help you with?" />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Please describe your issues in detail" rows={4} />
          </div>
          <Button className="bg-[#002F7A]">Send Message</Button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection()
      case "store":
        return renderStoreSection()
      case "notifications":
        return renderNotificationsSection()
      case "security":
        return renderSecuritySection()
      case "help":
        return renderHelpSection()
      default:
        return renderProfileSection()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
   

      <div className="flex">
      

        <main className="flex-1">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
                <p className="text-sm text-[#797979]">Everything is here</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search" className="pl-10 w-64" />
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {/* Settings Navigation */}
              <div className="">
                <nav className="flex items-center gap-2 mb-4">
                  {settingsNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={` text-center py-2 px-2 md:px-3 lg:px-4 rounded-lg text-sm font-medium ${
                        activeSection === item.id ? "bg-blue-100 text-blue-700" : "text-[#797979] hover:bg-gray-300 bg-gray-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 bg-white rounded-lg p-8">{renderContent()}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
