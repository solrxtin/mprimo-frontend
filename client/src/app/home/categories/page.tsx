"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  Globe,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categoriesConfig } from "@/lib/categories-config";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/queries";
import { Category } from "@/types/product.type";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useQuery } from "@tanstack/react-query";

const categories = Object.values(categoriesConfig);

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [filter, setFilter] = useState({
    name: "",
    priceRange: [0, 1000],
    rating: 0,
    sortBy: "relevance",
  });

 

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Shop by Categories", href: null },
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

  // Fetch categories
  const fetchCategories = async () => {
    const response = await fetchWithAuth('http://localhost:5800/api/v1/categories?');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data; // Return the entire response object
  };
  
  const useCategories = useQuery({
      queryKey: ['categories'],
      queryFn: fetchCategories,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 1 day
      refetchOnWindowFocus: false,
      retry: 1
    });
  

  console.log(
    "Category Data:",
    useCategories?.data?.categories?.filter((item: any) => item.level === 1)
  );
  const categories =
    useCategories?.data?.categories?.filter((item: any) => item.level === 1) ||
    [];

  return (
    <div className="min-h-screen body-padding bg-gray-50">
      <main className="">
        <nav className="pt-3">
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />
        </nav>

        {/* Page Header */}
        <div className="mb-8 grid grid-cols-3">
          <h1 className="text-xl md:text-3xl font-bold mb-4 col-span-1 ">
            Shop by Categories
          </h1>

          <div className="flex flex-col  gap-4 col-span-1">
            <div className="flex-1 font-normal hidden md:block">
              <div className=" flex w-full  bg-white  py-[5px] border border-[#ADADAD] rounded-3xl">
                <button className=" border-r px-2 ">
                  <Search className="w-2 h-2 md:w-4 md:h-4" color="black" />
                </button>
                <input
                  placeholder="Search category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="flex-1 border-0 px-2 w-full pl-[2px] outline-0 text-[#121212] placeholder:text-sm"
                />

                <button className="py-[4px] font-normal md:py-2 w-[80px] text-xs md:w-[90px] lg:w-[100px] bg-secondary text-white placeholder:text-xs  rounded-4xl mr-1  ">
                  Search
                </button>
              </div>
            </div>

            {/* Active Filters */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-600 whitespace-nowrap">
                Active Filters:
              </span>
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                Household ×
              </Badge>
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                Fashion ×
              </Badge>
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                Phones & Tablets ×
              </Badge>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 lg:gap-6 pb-12">
          {categories.map((card: Category) => (
            <Link key={card._id} href={`/home/categories/${card.slug}`}>
              <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow p-4 lg:p-6 text-center group cursor-pointer">
                <div className="mb-3 lg:mb-4">
                  <div>
                    <img
                      src={card?.image}
                      alt={card?.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto"
                    />
                  </div>
                </div>
                <h3 className="font-medium text-sm lg:text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                  {card.name}
                </h3>
                {/* <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {category.description}
                </p> */}
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-2 mb-12">
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
      </main>
    </div>
  );
}
