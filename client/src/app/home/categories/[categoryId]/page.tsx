"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  Globe,
  Home,
  Star,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";

const brands = [
  "Apple",
  "Asus",
  "BlackBerry",
  "Gionee",
  "Google",
  "HTC",
  "Huawei",
  "Infinix",
  "Itel",
  "LG",
  "Nokia",
  "OnePlus",
  "Oppo",
  "Redmi",
  "Samsung",
  "Sony",
  "ZTE",
];

const galaxyModels = [
  "Galaxy A15 5G",
  "Galaxy A35 5G",
  "Galaxy A56 5G",
  "Galaxy S24",
  "Galaxy S24+",
  "Galaxy S25 Ultra",
  "Galaxy S25 Edge",
  "Galaxy Z Flip 6",
  "Galaxy Z Flip 7",
  "Galaxy Z Fold 6",
  "Galaxy Z Fold 7",
];

const products = [
  {
    id: "1",
    name: "Samsung S10 Smartphone 256GB Rom 24GB Ram",
    condition: "Refurbished",
    price: 25000,
    originalPrice: 50000,
    rating: 4,
    reviews: 234,
    image: "/placeholder.svg?height=200&width=200",
    badge: "50% OFF",
    isWishlisted: false,
  },
  {
    id: "2",
    name: "Cannon 40 Pro Dual Sim Emerald Lake Green 128GB Ram 256GB 5G",
    condition: "New",
    price: 125000,
    rating: 4,
    reviews: 156,
    image: "/placeholder.svg?height=200&width=200",
    badge: "NEW",
    isWishlisted: false,
  },
  {
    id: "3",
    name: "Samsung S21 Ultra Dual Sim Black 12GB Ram 256GB 5G",
    condition: "Used",
    price: 200000,
    rating: 4,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=200",
    isWishlisted: false,
  },
  {
    id: "4",
    name: "Apple Iphone X 256GB 12GB Ram Armond Screen Ray",
    condition: "Refurbished",
    price: 125000,
    originalPrice: 200000,
    rating: 4,
    reviews: 234,
    image: "/placeholder.svg?height=200&width=200",
    badge: "38% OFF",
    isWishlisted: false,
  },
  {
    id: "5",
    name: "Samsung S21 Ultra Dual Sim Black 12GB Ram 256GB 5G",
    condition: "Used",
    price: 200000,
    rating: 4,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=200",
    isWishlisted: false,
  },
  {
    id: "6",
    name: "Samsung S21 Ultra Dual Sim Black 12GB Ram 256GB 5G",
    condition: "Used",
    price: 200000,
    rating: 4,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=200",
    isWishlisted: false,
  },
  {
    id: "7",
    name: "Apple Iphone X 256GB 12GB Ram Armond Screen Ray",
    condition: "Refurbished",
    price: 125000,
    originalPrice: 200000,
    rating: 4,
    reviews: 234,
    image: "/placeholder.svg?height=200&width=200",
    badge: "38% OFF",
    isWishlisted: false,
  },
  {
    id: "8",
    name: "Samsung S21 Ultra Dual Sim Black 12GB Ram 256GB 5G",
    condition: "Used",
    price: 200000,
    rating: 4,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=200",
    isWishlisted: false,
  },
  {
    id: "9",
    name: "Apple Iphone X 256GB 12GB Ram Armond Screen Ray",
    condition: "Refurbished",
    price: 125000,
    originalPrice: 200000,
    rating: 4,
    reviews: 234,
    image: "/placeholder.svg?height=200&width=200",
    badge: "38% OFF",
    isWishlisted: false,
  },
];

export default function PhonesTabletsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [sortBy, setSortBy] = useState("Most Popular");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices");
  const [showGalaxyFilter, setShowGalaxyFilter] = useState(false);
  const [selectedGalaxyModel, setSelectedGalaxyModel] = useState("");
  const [wishlistedItems, setWishlistedItems] = useState<string[]>([]);

  const toggleWishlist = (productId: string) => {
    setWishlistedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Shop by Categories", href: "/home/categories" },
    { label: "Phone and Tablets", href: null },
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

  const SidebarContent = ({ type }: { type: string }) => (
    <div  className={` space-y-6`}>
      {/* Categories */}
      <div >
        <h3 className="font-bold text-sm  lg:text-lg mb-4">CATEGORIES</h3>
        <div className="space-y-2 bg-white">
          <Button
            variant="ghost"
            className="w-full justify-start text-left font-normal"
          >
            All
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between text-left font-normal"
          >
            Mobile Phones
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between text-left font-normal"
          >
            Tablets
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between text-left font-normal"
          >
            Accessories
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-sm  lg:text-lg mb-4">PRICE RANGE</h3>
        <div className="space-y-4 bg-white p-3">
          <div className="">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={1000000}
              step={10000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Min</span>
              <span>Max</span>
            </div>
          </div>
          <RadioGroup
            value={selectedPriceRange}
            onValueChange={setSelectedPriceRange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="All Prices" id="all-prices" />
              <Label htmlFor="all-prices">All Prices</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Under N1,000" id="under-1000" />
              <Label htmlFor="under-1000">Under N1,000</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="N1k to N10k" id="1k-10k" />
              <Label htmlFor="1k-10k">N1k to N10k</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="N10k to N100k" id="10k-100k" />
              <Label htmlFor="10k-100k">N10k to N100k</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="N100k to N1M" id="100k-1m" />
              <Label htmlFor="100k-1m">N100k to N1M</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="N1M and Above" id="1m-above" />
              <Label htmlFor="1m-above">N1M and Above</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-bold text-sm  lg:text-lg mb-4">BRANDS</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto bg-white p-3">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={brand}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={brand} className="text-sm">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 body-padding">
      {/* Header */}
      <nav className="mt-3">
        <Breadcrumbs
          items={manualBreadcrumbs}
          onItemClick={handleBreadcrumbClick}
          className="mb-4"
        />
      </nav>

      <div className="flex w-full">
        <div className="w-[30%] md:block hidden">
          <h1 className="text-xl md:text-3xl font-bold mb-4 col-span-1 ">
            Phones & Tablets
          </h1>
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className=" rounded-lg p-6 sticky top-6">
              <SidebarContent type="large" />
            </div>
          </div>
        </div>
   {/* Main Content */}
         <div className="w-[70%] w-full ">
        <div className="mb-8 grid grid-cols-2">
          <div className="flex flex-col  gap-4 col-span-1">
            <div className="flex-1 font-normal hidden md:block">
              <div className=" flex w-full  bg-white  py-[5px] border border-[#ADADAD] rounded-3xl">
                <button className=" border-r px-2 ">
                  <Search className="w-2 h-2 md:w-4 md:h-4" color="black" />
                </button>
                <input
                  placeholder="Search category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="flex-1 border-0 px-2 w-full pl-[2px] outline-0 text-[#121212] placeholder:text-sm"
                />

                <button className="py-[4px] font-normal md:py-2 w-[80px] text-xs md:w-[90px] lg:w-[100px] bg-secondary text-white placeholder:text-xs  rounded-4xl mr-1  ">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="col-span-1  w-full flex  justify-end">
            <div className="flex  items-center space-x-2 ">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Sort by:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[140px] justify-between"
                  >
                    {sortBy}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => setSortBy("Most Popular")}>
                    Most Popular
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("Price: Low to High")}
                  >
                    Price: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("Price: High to Low")}
                  >
                    Price: High to Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("Newest")}>
                    Newest
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("Customer Rating")}
                  >
                    Customer Rating
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("Type");
                      setShowGalaxyFilter(true);
                    }}
                  >
                    Type
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("Condition")}>
                    Condition
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Galaxy Filter Dropdown */}
              {showGalaxyFilter && (
                <div className="mb-4">
                  <DropdownMenu
                    open={showGalaxyFilter}
                    onOpenChange={setShowGalaxyFilter}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-w-[200px] justify-between"
                      >
                        {selectedGalaxyModel || "Select Galaxy Model"}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                      <DropdownMenuItem
                        onClick={() => setSelectedGalaxyModel("")}
                      >
                        All
                      </DropdownMenuItem>
                      {galaxyModels.map((model) => (
                        <DropdownMenuItem
                          key={model}
                          onClick={() => setSelectedGalaxyModel(model)}
                        >
                          {model}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex ">
       
          <div className="flex-1">


            <div className="flex items-center space-x-4 w-full lg:w-auto">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <div className="py-6">
                    <SidebarContent  type="mobile"/>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters and Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F1F4F9] rounded-md py-[6px] px-2 mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Active Filters:</span>
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-700"
                >
                  Household ×
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-700"
                >
                  Fashion ×
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-bold">37,848</span> Results
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6 mb-8">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {product.badge && (
                        <Badge className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          {product.badge}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        onClick={() => toggleWishlist(product.id)}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            wishlistedItems.includes(product.id)
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < product.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        ({product.reviews})
                      </span>
                      <Button
                        variant="link"
                        className="text-xs text-blue-600 ml-auto p-0 h-auto"
                      >
                        View Ratings
                      </Button>
                    </div>

                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {product.condition}
                    </p>

                    <div className="flex items-center space-x-2 mb-4">
                      <span className="font-bold text-lg">
                        ₦ {product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₦ {product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mb-8">
              <Button variant="ghost" size="sm" disabled>
                Prev
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                1
              </Button>
              <Button variant="ghost" size="sm">
                2
              </Button>
              <Button variant="ghost" size="sm">
                3
              </Button>
              <span className="text-gray-500">...</span>
              <Button variant="ghost" size="sm">
                100
              </Button>
              <Button variant="ghost" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>


      </div>

        <div>

        </div>
      </div>

      {/* Main Content */}
     
    </div>
  );
}
