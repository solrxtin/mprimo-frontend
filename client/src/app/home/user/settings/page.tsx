"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, Edit, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"

type SettingsSection = "main" | "account" | "shipping" | "payment" | "notifications" | "security"

const settingsNavigation = [
  { id: "account", label: "Account Information", hasBack: true },
  { id: "shipping", label: "Shipping Information", hasBack: true },
  { id: "payment", label: "Payment Information", hasBack: true },
  { id: "notifications", label: "Notifications", hasBack: true },
  { id: "security", label: "Security", hasBack: true },
]

export default function SettingsPage() {
  const [currentSection, setCurrentSection] = useState<SettingsSection>("main")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "Dickson",
    middleName: "Dickson",
    lastName: "Dickson",
    email: "Thisismyemil@gmail.com",
    address: "Thisismyemil@gmail.com",
    country: "Nigeria",
    state: "Abuja",
    city: "Wuse",
    postalCode: "001234",
    phoneNumber: "+10928475788",
    notifications: {
      newStockAlert: true,
      lowStockAlert: true,
      orderStatusAlert: true,
      pendingReviews: false,
      paymentAlert: false,
    },
  })

    const router = useRouter()

  

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/my-cart" },
    { label: "Auction", href: null},
  
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
     router.push(item?.href);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: checked },
    }))
  }

  const renderMainSettings = () => (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Panel - Navigation */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-6">Settings</h2>
          <div className="space-y-2">
            {settingsNavigation.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-between text-left"
                onClick={() => setCurrentSection(item.id as SettingsSection)}
              >
                {item.label}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Quick View */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Account Information</h3>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">First Name</Label>
                <p className="font-medium">{formData.firstName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Middle Name</Label>
                <p className="font-medium">{formData.middleName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Last Name</Label>
                <p className="font-medium">{formData.lastName}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Email Address</Label>
              <p className="font-medium">{formData.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAccountSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentSection("main")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Account Information</h2>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-gray-100 border-0 mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderShippingSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentSection("main")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Shipping Information</h2>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="address">Shipping Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="bg-gray-100 border-0 mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="bg-gray-100 border-0 mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPaymentSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentSection("main")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Payment Information</h2>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Payment Method</h3>
            <Button variant="link" className="text-blue-600">
              Add Card
            </Button>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm font-medium">Card Payment</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">
              MC
            </div>
            <span className="text-sm">123 **** **** **** **65</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderNotificationSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentSection("main")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold ml-4">Notifications</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Email Notification</h3>
            <Switch defaultChecked />
          </div>

          <div className="space-y-4">
            {[
              { key: "newStockAlert", label: "New Stock Alert" },
              { key: "lowStockAlert", label: "Low Stock Alert" },
              { key: "orderStatusAlert", label: "Order Status Alert" },
              { key: "pendingReviews", label: "Pending Reviews" },
              { key: "paymentAlert", label: "Payment Alert" },
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.notifications[item.key as keyof typeof formData.notifications]}
                  onCheckedChange={(checked) => handleNotificationChange(item.key, checked as boolean)}
                />
                <Label className="text-sm">{item.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSecuritySettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentSection("main")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Security</h2>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
            Change
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value="*******"
                className="bg-gray-100 border-0 pr-10"
                readOnly
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "account":
        return renderAccountSettings()
      case "shipping":
        return renderShippingSettings()
      case "payment":
        return renderPaymentSettings()
      case "notifications":
        return renderNotificationSettings()
      case "security":
        return renderSecuritySettings()
      default:
        return renderMainSettings()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
  <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />
          <div>

                 {renderCurrentSection()}
          </div>

     
    
    </div>
  )
}
