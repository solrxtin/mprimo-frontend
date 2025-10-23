"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {  Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useCreateOrder, useCreatePaymentIntent, useValidateCart } from "@/hooks/useCheckout";
import { toast } from "react-hot-toast";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("bank-transfer");
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    country: "",
    state: "",
    postalCode: "",
    homeAddress: "",
  });

  const { items: cartItems, summary: cartSummary, clearCart } = useCartStore();
  const createOrderMutation = useCreateOrder();
  const createPaymentIntentMutation = useCreatePaymentIntent();
 

  const subtotal = cartSummary.subtotal;
  const shipping = 50000;
  const discount = 5000;
  const tax = 5000;
  const total = subtotal + shipping - discount + tax;

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    // Validate form
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.country ||
      !formData.homeAddress
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order data
      const validatedItems = cartItems.map((item) => ({
        productId: item.product._id!,
        quantity: item.quantity,
        price: Number(item.selectedVariant?.price ?? item.product.price ?? 0),
        variantId: item.selectedVariant?.optionId,
      }));

      const orderData = {
        validatedItems,
        pricing: {
          subtotal,
          shipping,
          tax,
          discount,
          total,
          currency: "NGN",
        },
        paymentData: {
          type: paymentMethod as "stripe" | "crypto" | "bank-transfer",
          amount: total,
        },
        address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          country: formData.country,
          state: formData.state,
          postalCode: formData.postalCode,
          homeAddress: formData.homeAddress,
          isDefault: true,
        },
      };

      // Handle different payment methods
      if (paymentMethod === "stripe") {
        // Create payment intent first
        const paymentIntent = await createPaymentIntentMutation.mutateAsync({
          amount: total,
          currency: "ngn",
        });
        // orderData.paymentData.paymentIntentId = paymentIntent.data.id;
      }

      // Create order
      const result = await createOrderMutation.mutateAsync(orderData);

      if (result.success) {
        setOrderId(result.data._id);
        await clearCart();
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/home/my-cart" },
    { label: "Checkout", href: null },
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

  const paymentMethods = [
    { id: "bank-transfer", name: "Bank Transfer", icon: "🏦" },
    { id: "card", name: "Card Payment", icon: "💳" },
    { id: "wallet", name: "Wallet", icon: "🔴" },
    { id: "crypto", name: "Crypto", icon: "₿" },
    { id: "applepay", name: "ApplePay", icon: "🍎" },
  ];

  return (
    <>
      <div className="min-h-screen font-roboto bg-gray-50 body-padding">
        <div className="max-w-7xl px-6 md:px-8  mx-auto pt-4">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Billing Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-2">Billing Information</h2>
                <p className="text-gray-600 mb-6">
                  Provide your billing information to proceed
                </p>

                <div className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleName">
                        Middle Name{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </Label>
                      <Input
                        id="middleName"
                        placeholder="Enter your middle name"
                        value={formData.middleName}
                        onChange={(e) =>
                          handleInputChange("middleName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Address Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) =>
                          handleInputChange("country", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose your country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nigeria">Nigeria</SelectItem>
                          <SelectItem value="ghana">Ghana</SelectItem>
                          <SelectItem value="kenya">Kenya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="Enter your State"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        placeholder="Enter your Postal Code"
                        value={formData.postalCode}
                        onChange={(e) =>
                          handleInputChange("postalCode", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Home Address */}
                  <div>
                    <Label htmlFor="homeAddress">Home Address</Label>
                    <Input
                      id="homeAddress"
                      placeholder="Input your home address"
                      value={formData.homeAddress}
                      onChange={(e) =>
                        handleInputChange("homeAddress", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-2">Payment Method</h3>
                  <p className="text-gray-600 mb-6">
                    Choose your preferred payment method
                  </p>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      {paymentMethods.map((method) => (
                        <div key={method.id}>
                          <RadioGroupItem
                            value={method.id}
                            id={method.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={method.id}
                            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                          >
                            <div className="text-2xl mb-2">{method.icon}</div>
                            <span className="text-sm font-medium text-center">
                              {method.name}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Bank Transfer Details */}
                  {paymentMethod === "bank-transfer" && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="text-center mb-4">
                        <p className="font-medium">
                          Transfer ₦{total.toLocaleString()} to Vendor's
                          Checkout
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Bank Name
                          </Label>
                          <div className="mt-1 p-3 bg-white rounded border">
                            Vendor's Account
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Account Number
                          </Label>
                          <div className="mt-1 p-3 bg-white rounded border flex items-center justify-between">
                            <span>0202020202020</span>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Amount</Label>
                          <div className="mt-1 p-3 bg-white rounded border flex items-center justify-between">
                            <span>₦ {total.toLocaleString()}</span>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-600 mt-4">
                        This account is for this transaction only and expires in
                        29:00
                      </p>
                    </div>
                  )}

                  {/* Card Payment Details */}
                  {paymentMethod === "card" && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Card Payment</h4>
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto"
                        >
                          Change
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                        <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          MC
                        </div>
                        <span>123 **** **** **** **65</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Order Summary</h3>

                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div
                        key={
                          item.product._id +
                          (item.selectedVariant?.optionId || "")
                        }
                        className="flex items-center space-x-3"
                      >
                        <Image
                          src={item.product.images[0] || "/placeholder.svg"}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {item.quantity} x ₦{" "}
                            {item.selectedVariant?.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Sub Total:</span>
                      <span>₦ {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>₦ {shipping.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>₦ {discount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₦ {tax.toLocaleString()}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL:</span>
                      <span>₦ {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mt-6">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || cartItems.length === 0}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Success Modal */}
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent className="sm:max-w-md">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Order Placed Successfully
                </h3>
                <p className="text-gray-600 mb-6">
                  Your Order has been placed successfully. Click Track Order to
                  check progress
                </p>
                <div className="space-y-3 w-full">
                  <Link
                    href={`/home/user/orders${
                      orderId ? `?orderId=${orderId}` : ""
                    }`}
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Track Order
                    </Button>
                  </Link>
                  <Link href="/home">
                    <Button
                      variant="outline"
                      className="w-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
