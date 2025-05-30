"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Search,
  Bell,
  ArrowLeft,
  Plus,
  X,
  Trash2,
  Check,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StarRating from "./(component)/StarRating";
import cap1 from "@/app/vendor/dashboard/assets/cap1.png";
import cap2 from "@/app/vendor/dashboard/assets/cap2.png";

interface ProductFormData {
  brandName: string;
  productPrice: string;
  negotiationPrice: string;
  productName: string;
  productDescription: string;
  categories: string;
  subcategory: string;
  productCondition: string;
  sku: string;
  storeQuantity: string;
  storeStatus: string;
  allowBidding: string;
  colors: string[];
  size: string;
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  images: File[];
  videos: File[];
}

const initialFormData: ProductFormData = {
  brandName: "",
  productPrice: "",
  negotiationPrice: "",
  productName: "Nike Baseball Cap",
  productDescription:
    "Elevate your everyday style with the Nike Baseball Cap. Made with high-quality cotton and an adjustable strap, this cap combines fashion with function.\n✅ 100% breathable cotton\n✅ Adjustable back strap for all sizes\n✅ Embroidered Nike logo\nCare Instructions:\n- Hand wash with cold water",
  categories: "",
  subcategory: "",
  productCondition: "",
  sku: "",
  storeQuantity: "200pcs",
  storeStatus: "",
  allowBidding: "",
  colors: ["White", "Green", "Red"],
  size: "",
  seoTitle: "4",
  metaTitle: "Buy Nike Baseball Cap - Stylish Everyday Cap | MPRIMO",
  metaDescription:
    "Shop the original Nike Baseball Cap online. Durable, stylish, and perfect for all-day wear. Available now on MPRIMO.",
  images: [],
  videos: [],
};

const DropZone = ({
  onDrop,
  accept,
  multiple = true,
  children,
}: {
  onDrop: (files: File[]) => void;
  accept: Record<string, string[]>;
  multiple?: boolean;
  children: React.ReactNode;
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} />
      {children}
    </div>
  );
};

const SuccessNotification = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed top-4 right-4 bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
      <Check className="w-4 h-4 text-white" />
    </div>
    <span className="text-sm text-gray-700">{message}</span>
    <Button variant="ghost" size="sm" onClick={onClose}>
      <X className="w-4 h-4" />
    </Button>
  </div>
);

export default function AddProductPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [showSuccessNotification, setShowSuccessNotification] = useState<
    string | null
  >(null);

  const updateFormData = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageDrop = useCallback((acceptedFiles: File[]) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...acceptedFiles],
    }));
  }, []);

  const handleVideoDrop = useCallback((acceptedFiles: File[]) => {
    setFormData((prev) => ({
      ...prev,
      videos: [...prev.videos, ...acceptedFiles],
    }));
  }, []);

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeColor = (color: string) => {
    updateFormData(
      "colors",
      formData.colors.filter((c) => c !== color)
    );
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveToDraft = () => {
    setShowSuccessNotification("Your product has been added to draft.");
  };

  const handlePublishProduct = () => {
    setShowSuccessNotification("Your product has been publish successfully!");
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
//   const renderStepOne = () => (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//       {/* Product Images - Left Side */}
//       <div className="bg-white rounded-lg border overflow-hidden">
//         <div className="p-6 border-b">
//           <h2 className="text-base md:text-lg font-medium">Product Images</h2>
//         </div>
//         <div className="p-4 space-y-4">
//           <DropZone
//             onDrop={handleImageDrop}
//             accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
           
//           >
//             <div className=" bg-gray-100 max-h-[227px] w-full rounded-lg overflow-hidden flex items-center justify-center">
//               {formData.images.length > 0 ? (
//                 <img
//                   src={URL.createObjectURL(formData.images[0])}
//                   alt="Product"
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="flex flex-col items-center justify-center font-light text-gray-400">
//                   <Plus className="w-8 h-8 mb-2" />
//                   <p>Click or drag to upload main image</p>
//                 </div>
//               )}
//             </div>
//           </DropZone>

//           <div className="flex gap-3">
//             {formData.images.slice(0, 2).map((image, index) => (
//               <div key={index} className="relative w-10 h-10">
//                 <img
//                   src={URL.createObjectURL(image)}
//                   alt={`Thumbnail ${index + 1}`}
//                   className="w-full h-full object-cover rounded-lg"
//                 />
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeImage(index);
//                   }}
//                   className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
//                 >
//                   <X className="w-3 h-3 text-white" />
//                 </button>
//               </div>
//             ))}

//             {formData.images.length < 2 && (
//               <DropZone
//                 onDrop={handleImageDrop}
//                 accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
//               >
//                 <div className="w-10 h-10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center bg-blue-50">
//                   <Plus className="w-4 h-4 text-blue-500" />
//                 </div>
//               </DropZone>
//             )}
//           </div>

//           {/* Video Upload */}
//           <DropZone
//             onDrop={handleVideoDrop}
//             accept={{ "video/*": [".mp4", ".mov", ".avi"] }}
//           >
//             <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 bg-blue-50">
//               {formData.videos.length > 0 ? (
//                 <div className="relative">
//                   <video controls className="w-full">
//                     <source src={URL.createObjectURL(formData.videos[0])} />
//                   </video>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setFormData((prev) => ({
//                         ...prev,
//                         videos: [],
//                       }));
//                     }}
//                     className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
//                   >
//                     <X className="w-3 h-3 text-white" />
//                   </button>
//                 </div>
//               ) : (
//                 <>
//                   <Plus className="w-8 h-8 text-blue-500 mx-auto mb-2" />
//                   <p className="text-sm text-blue-600 font-medium">
//                     Click or Drag to add video
//                   </p>
//                 </>
//               )}
//             </div>
//           </DropZone>
//         </div>
//       </div>

//       <div>
//         <div className="bg-white rounded-lg border">
//           <div className="p-6 border-b">
//             <h2 className="text-base md:text-lg font-medium">Product Details</h2>
//           </div>
//           <div className="p-4 md:p-6 space-y-4">
//             <div>
//               <Label
//                 htmlFor="productName"
//                 className="text-sm font-medium text-gray-700 mb-2 block"
//               >
//                 Product Name
//               </Label>
//               <Input
//                 id="productName"
//                 placeholder="Nike Baseball Cap"
//                 value={formData.productName}
//                 onChange={(e) => updateFormData("productName", e.target.value)}
//                 className="text-light placeholder:font-light"
//               />
//             </div>

//             <div>
//               <Label
//                 htmlFor="productDescription"
//                 className="text-sm font-medium text-gray-700 mb-2 block"
//               >
//                 Product Description
//               </Label>
//               <Textarea
//                 id="productDescription"
//                 placeholder="Elevate your everyday style with the Nike Baseball Cap..."
//                 value={formData.productDescription}
//                 onChange={(e) =>
//                   updateFormData("productDescription", e.target.value)
//                 }
//                 rows={6}
//                 className="text-sm"
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                   Categories
//                 </Label>
//                 <Select
//                   value={formData.categories}
//                   onValueChange={(value) => updateFormData("categories", value)}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Nike Baseball Cap" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="caps">Baseball Caps</SelectItem>
//                     <SelectItem value="clothing">Clothing</SelectItem>
//                     <SelectItem value="accessories">Accessories</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div>
//                 <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                   Product Condition
//                 </Label>
//                 <Select
//                   value={formData.productCondition}
//                   onValueChange={(value) =>
//                     updateFormData("productCondition", value)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="New" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="new">New</SelectItem>
//                     <SelectItem value="used">Used</SelectItem>
//                     <SelectItem value="refurbished">Refurbished</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                   Subcategory
//                 </Label>
//                 <Select
//                   value={formData.subcategory}
//                   onValueChange={(value) =>
//                     updateFormData("subcategory", value)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Nike" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="nike">Nike</SelectItem>
//                     <SelectItem value="adidas">Adidas</SelectItem>
//                     <SelectItem value="puma">Puma</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div>
//                 <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                   Detailed condition description
//                 </Label>
//                 <Input placeholder="Additional notes on the condition..." />
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                   Brand Name
//                 </Label>
//                 <Input
//                   placeholder="Nike"
//                   value={formData.brandName}
//                   onChange={(e) => updateFormData("brandName", e.target.value)}
//                 />
//               </div>

//               <div>
//                 <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                   SKU (Stock Keeping Unit)
//                 </Label>
//                 <Input
//                   placeholder="NIKE-CAP-BLACK-001"
//                   value={formData.sku}
//                   onChange={(e) => updateFormData("sku", e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="lg:col-span-2 gap-1 flex justify-between mt-3">
//           <Button variant="outline" onClick={handleBack} className="flex-1">
//             Back
//           </Button>
//           <Button
//             onClick={handleNext}
//             className="bg-[#002F7A] hover:bg-blue-700 flex-1"
//           >
//             Next
//           </Button>
//         </div>
//       </div>

//       {/* Action Buttons */}
//     </div>
//   );
const renderStepOne = () => (
  <div className="grid grid-cols-1 overflow-y-auto lg:grid-cols-2 gap-8 max-w-full overflow-hidden">
    <div className="bg-white rounded-lg border overflow-hidden min-w-0">
      <div className="p-6 border-b">
        <h2 className="text-base md:text-lg font-medium">Product Images</h2>
      </div>
      <div className="p-4 space-y-4 font-poppins ">
        <DropZone
          onDrop={handleImageDrop}
          accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
        >
          <div className="bg-gray-100 h-[227px] w-full rounded-lg overflow-hidden flex items-center justify-center">
            {formData.images.length > 0 ? (
              <img
                src={URL.createObjectURL(formData.images[0])}
                alt="Product"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center font-light text-gray-400 p-4">
                <Plus className="w-8 h-8 mb-2 flex-shrink-0" />
                <p className="text-center text-sm">Click or drag to upload main image</p>
              </div>
            )}
          </div>
        </DropZone>

        {/* Thumbnail Images Row */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {formData.images.slice(0, 2).map((image, index) => (
            <div key={index} className="relative w-10 h-10 flex-shrink-0">
              <img
                src={URL.createObjectURL(image)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}

          {formData.images.length < 2 && (
            <DropZone
              onDrop={handleImageDrop}
              accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
            >
              <div className="w-10 h-10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center bg-[#FDF8F3] hover:bg-blue-100 transition-colors flex-shrink-0">
                <Plus className="w-4 h-4 text-blue-500" />
              </div>
            </DropZone>
          )}
        </div>

        {/* Video Upload */}
        <DropZone
          onDrop={handleVideoDrop}
          accept={{ "video/*": [".mp4", ".mov", ".avi"] }}
        >
          <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 bg-[#FDF8F3] hover:bg-blue-100 transition-colors">
            {formData.videos.length > 0 ? (
              <div className="relative w-full">
                <video 
                  controls 
                  className="w-full max-h-48 rounded"
                  style={{ maxWidth: '100%' }}
                >
                  <source src={URL.createObjectURL(formData.videos[0])} />
                </video>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((prev) => ({
                      ...prev,
                      videos: [],
                    }));
                  }}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Plus className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-blue-600 font-medium">
                  Click or Drag to add video
                </p>
              </div>
            )}
          </div>
        </DropZone>
      </div>
    </div>

    {/* Product Details - Right Side */}
    <div className="min-w-0">
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-base md:text-lg font-medium">Product Details</h2>
        </div>
        <div className="p-4 md:p-6 space-y-4 text-[#797979] font-poppins">
          <div>
            <Label
              htmlFor="productName"
              className="text-sm font-medium  mb-2 block"
            >
              Product Name
            </Label>
            <Input
              id="productName"
              placeholder="Nike Baseball Cap"
              value={formData.productName}
              onChange={(e) => updateFormData("productName", e.target.value)}
              className="text-light placeholder:font-light w-full"
            />
          </div>

          <div>
            <Label
              htmlFor="productDescription"
              className="text-sm font-medium  mb-2 block"
            >
              Product Description
            </Label>
            <Textarea
              id="productDescription"
              placeholder="Elevate your everyday style with the Nike Baseball Cap..."
              value={formData.productDescription}
              onChange={(e) =>
                updateFormData("productDescription", e.target.value)
              }
              rows={6}
              className="text-sm w-full resize-vertical"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-medium  mb-2 block">
                Categories
              </Label>
              <Select
                value={formData.categories}
                onValueChange={(value) => updateFormData("categories", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nike Baseball Cap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caps">Baseball Caps</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <Label className="text-sm font-medium  mb-2 block">
                Product Condition
              </Label>
              <Select
                value={formData.productCondition}
                onValueChange={(value) =>
                  updateFormData("productCondition", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="New" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-medium  mb-2 block">
                Subcategory
              </Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) =>
                  updateFormData("subcategory", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nike" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nike">Nike</SelectItem>
                  <SelectItem value="adidas">Adidas</SelectItem>
                  <SelectItem value="puma">Puma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <Label className="text-sm font-medium  mb-2 block">
                Detailed condition description
              </Label>
              <Input 
                placeholder="Additional notes on the condition..." 
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label className="text-sm font-medium  mb-2 block">
                Brand Name
              </Label>
              <Input
                placeholder="Nike"
                value={formData.brandName}
                onChange={(e) => updateFormData("brandName", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="min-w-0">
              <Label className="text-sm font-medium mb-2 block">
                SKU (Stock Keeping Unit)
              </Label>
              <Input
                placeholder="NIKE-CAP-BLACK-001"
                value={formData.sku}
                onChange={(e) => updateFormData("sku", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          className="flex-1 w-full"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#002F7A] hover:bg-blue-700 flex-1 w-full"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
);

  const renderStepTwo = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Details - Left Side */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Product Details</h2>
        </div>
        <div className="p-6 space-y-6 text-[#797979]">
          <div>
            <Label
              htmlFor="productPrice"
              className="text-sm font-medium  mb-2 block"
            >
              Product Price
            </Label>
            <Input
              id="productPrice"
              placeholder="₦5,500"
              value={formData.productPrice}
              onChange={(e) => updateFormData("productPrice", e.target.value)}
            />
          </div>

          <div>
            <Label
              htmlFor="negotiationPrice"
              className="text-sm font-medium  mb-2 block"
            >
              Negotiation Price
            </Label>
            <Input
              id="negotiationPrice"
              placeholder="₦5,500"
              value={formData.negotiationPrice}
              onChange={(e) =>
                updateFormData("negotiationPrice", e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium  mb-2 block">
                Store Quantity
              </Label>
              <Input
                placeholder="200pcs"
                value={formData.storeQuantity}
                onChange={(e) =>
                  updateFormData("storeQuantity", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium  mb-2 block">
                Store Status
              </Label>
              <Select
                value={formData.storeStatus}
                onValueChange={(value) => updateFormData("storeStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="In Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium  mb-2 block">
              Allow Bidding
            </Label>
            <Select
              value={formData.allowBidding}
              onValueChange={(value) => updateFormData("allowBidding", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Allowed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allowed">Allowed</SelectItem>
                <SelectItem value="not-allowed">Not Allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              Product Variant
            </Label>

            <div className="mb-4">
              <Label className="text-sm  mb-2 block">
                Colours
              </Label>
              <div className="flex gap-2 mb-2">
                {formData.colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded border"
                  >
                    <span className="text-sm">{color}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-4 h-4 p-0 hover:bg-red-100"
                      onClick={() => removeColor(color)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-dashed"
                onClick={() => {
                  const color = prompt("Enter color name:");
                  if (color && !formData.colors.includes(color)) {
                    updateFormData("colors", [...formData.colors, color]);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Colour
              </Button>
            </div>

            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Size</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => updateFormData("size", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="One size fits all" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-size">One size fits all</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">SEO & Meta Settings</h2>
          </div>
          <div className="p-6 space-y-6 text-[#797979]">
            <div>
              <Label
                htmlFor="seoTitle"
                className="text-sm font-medium  mb-2 block"
              >
                SEO Title
              </Label>
              <Input
                id="seoTitle"
                placeholder="4"
                value={formData.seoTitle}
                onChange={(e) => updateFormData("seoTitle", e.target.value)}
              />
            </div>

            <div>
              <Label
                htmlFor="metaTitle"
                className="text-sm font-medium  mb-2 block"
              >
                Meta Title
              </Label>
              <Input
                id="metaTitle"
                placeholder="Buy Nike Baseball Cap - Stylish Everyday Cap | MPRIMO"
                value={formData.metaTitle}
                onChange={(e) => updateFormData("metaTitle", e.target.value)}
              />
              <p className="text-xs text-blue-600 mt-1">
                Shown on search engine results
              </p>
            </div>

            <div>
              <Label
                htmlFor="metaDescription"
                className="text-sm font-medium  mb-2 block"
              >
                Meta Description
              </Label>
              <Textarea
                id="metaDescription"
                placeholder="Shop the original Nike Baseball Cap online. Durable, stylish, and perfect for all-day wear. Available now on MPRIMO."
                value={formData.metaDescription}
                onChange={(e) =>
                  updateFormData("metaDescription", e.target.value)
                }
                rows={4}
              />
              <p className="text-xs text-blue-600 mt-1">
                Shown on search engine results
              </p>
            </div>
          </div>
        </div>

        <div className=" flex justify-between mt-6 gap-1">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            Back
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSaveToDraft}
          >
            Save to Draft
          </Button>
          <Button
            onClick={handlePublishProduct}
            className="bg-[#002F7A] hover:bg-blue-700 flex-1"
          >
            Publish Product
          </Button>
        </div>
      </div>
    </div>
  );
  const images = [cap1, cap2];
  const [selectedColor, setSelectedColor] = useState("navy");
  const [selectedSize, setSelectedSize] = useState("one-size");

  const colors = [
    { name: "green", value: "#22C55E", label: "Green" },
    { name: "red", value: "#EF4444", label: "Red" },
    { name: "yellow", value: "#EAB308", label: "Yellow" },
    { name: "orange", value: "#F97316", label: "Orange" },
    { name: "blue", value: "#3B82F6", label: "Blue" },
  ];

  const renderStepThree = () => (
    <div className="">
      <div className="bg-white ">
        <div className="flex pt-6">
          <div className="w-full flex md:flex lg:w-[45%] p-2 md:p-4">
            <div className="flex flex-col gap-1 ">
            {images.map((image, index) => (
              <button
                className={` hover:shadow-md max-w-[100px] max-h-[100px] flex justify-center items-center p-3  bg-[#E4E4EE33] rounded-xl overflow-hidden transition-all duration-200 `}
              >
                <img
                  src={typeof image === "string" ? image : image.src}
                  alt={`Nike Baseball Cap view ${index + 1}`}
                  className="w-full ma object-cover"
                />
              </button>
            ))}
            </div>

            <div className="aspect-square max-w-[270px] max-h-[300px] flex justify-center items-center bg-white overflow-hidden">
              <img
                src={typeof images[1] === "string" ? images[1] : images[1].src}
                alt="Nike Baseball Cap"
                className=" "
              />
            </div>
          </div>

          <div className="space-y-6 w-full md:w-[55%] font-poppins ">
            {/* Product Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nike Baseball Cap
              </h1>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">
                  $175,000
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Tax included.</p>
                <p>Free shipping.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Condition:</span>
                <Badge variant="secondary" className="bg-gray-100">
                  New
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <StarRating rating={4.5} />
                <span className="text-sm text-gray-600">4.5/5</span>
              </div>

              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm transition-colors">
                <MessageCircle className="w-4 h-4" />
                Message Seller
              </button>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Select Color
              </h3>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Select Size
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedSize("one-size")}
                  className={`w-full px-4 py-3 text-left border rounded-lg transition-all duration-200 ${
                    selectedSize === "one-size"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  One size fit all
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button className="w-full bg-[#002F7A] hover:bg-blue-700 text-white py-3 text-base font-medium">
                Add to Cart
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="bg-orange-400 hover:bg-orange-500 text-white border-orange-400 hover:border-orange-500"
                >
                  Negotiate
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Make a Bid
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className=" h-screen overflow-y-scroll bg-gray-50">
      {showSuccessNotification && (
        <SuccessNotification
          message={showSuccessNotification}
          onClose={() => setShowSuccessNotification(null)}
        />
      )}

     
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">Draft</span>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-semibold">Add New Product</h1>
          </div>
          <Button className="bg-[#002F7A] hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
        <p className="text-gray-600 mt-1">
          Welcome back, Bovie! Here's what is happening with your store today.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Add New Product</span>
          </div>
          <Button variant="link" className="text-blue-600 p-0">
            See live preview
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-8">
        {currentStep === 1 && renderStepOne()}
        {currentStep === 2 && renderStepTwo()}
        {currentStep === 3 && renderStepThree()}
      </main>
    </div>
  );
}
