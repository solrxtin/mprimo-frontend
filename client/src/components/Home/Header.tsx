import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  ChevronDown,

  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import Modal from "../Modal";
import { useState, useRef, useEffect } from "react";
import FullButton from "../FullButton";
import Link from "next/link";
import Modal2 from "../Modal2";
import { useCartLength } from "@/stores/cartHook";
import AuthenticationModal from "@/app/(auth)/authenticationModal";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchSuggestion } from "@/types/search.types";

const Header = () => {
  const [isSell, setIsSell] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const cartLength = useCartLength();
  const { openModal } = useAuthModalStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: suggestionsData } = useSearchSuggestions(debouncedQuery, 5);

  const handleSellClick = () => {
    setIsSell(!isSell);
  };
  const handlecloseModal = () => {
    setIsSell(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      window.location.href = `/home/search?q=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const pages = [
    {
      name: "Shop",
      // link: "/home",
    },
    {
      name: "Best Deals",
      link: "/about",
    },
    {
      name: "Sell",
      link: "/contact",
    },
    {
      name: "Track Order ",
      link: "/contact",
    },
    {
      name: "Customer Care",
      link: "/contact",
    },
  ];
  return (
    <header className="text-white">
      {/* Top banner - responsive */}
      <div className="container-responsive bg-primary border-b-[0.5px] border-[#E2E8F0] text-center py-2 text-xs sm:text-sm lg:text-base font-medium flex justify-between items-center">
        <span className="truncate flex-1 mr-2">
          Welcome to Mprimo online store...
        </span>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-3 font-normal">
          {pages.map((page, index) => (
            <Link href={page?.link || "#"} key={index}>
              <span className="mx-2 hover:underline">{page.name}</span>
            </Link>
          ))}
        </div>

        <Button
          variant="link"
          onClick={handleSellClick}
          className="text-[#121212] py-2 px-3 sm:px-4 lg:py-3 w-[80px] sm:w-[100px] lg:w-[180px] rounded-md bg-white font-normal h-auto text-xs sm:text-sm lg:text-base"
        >
          Sale
        </Button>
      </div>

      {/* Main header */}
      <div className="container-responsive bg-primary py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="lg:hidden text-white hover:bg-blue-700 p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col space-y-4 mt-6">
                <h2 className="text-lg font-semibold mb-4">Menu</h2>
                {pages.map((page, index) => (
                  <Link
                    href={page?.link || "#"}
                    key={index}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="block py-2 px-4 hover:bg-gray-100 rounded">
                      {page.name}
                    </span>
                  </Link>
                ))}
                <div className="pt-4 border-t">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full justify-between">
                        ENG <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => openModal()}>
                        Spanish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/home" className="flex-shrink-0">
            <div className="flex items-center">
              <img
                src="/images/mprimoLogo.png"
                alt="mprimoLogo image"
                className="h-[28px] w-[80px] sm:h-[36px] sm:w-[100px] md:h-[42px] md:w-[120px] lg:h-[48px] lg:w-[180px]"
              />
            </div>
          </Link>

          {/* Desktop Search bar */}
          <div className="flex-1 font-normal hidden lg:block mx-4 relative">
            <div className="flex mx-auto max-w-2xl bg-white py-[5px] rounded-full">
              <button className="border-r px-3">
                <Search className="w-4 h-4" color="black" />
              </button>
              <input
                placeholder="Search for anything..."
                className="flex-1 border-0 px-3 outline-0 text-[#121212] text-sm"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
              />
              <button
                onClick={handleSearchSubmit}
                className="py-2 px-4 text-xs bg-primary text-white rounded-full mr-1 hover:bg-blue-700"
              >
                Search
              </button>
            </div>
            
            {showSuggestions && searchQuery &&  (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-2xl mx-auto">
                <div className="py-2">
                  { suggestionsData?.suggestions && suggestionsData.suggestions.map((suggestion) => (
                    <Link
                      key={suggestion._id}
                      href={`/home/product-details/${suggestion.slug}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0">
                        {suggestion.images?.[0] && (
                          <img
                            src={suggestion.images[0]}
                            alt={suggestion.name}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {suggestion.category?.main?.name}
                        </p>
                      </div>
                      {suggestion.variants?.[0]?.options?.[0]?.price && (
                        <div className="text-sm font-semibold text-gray-900">
                          ₦{suggestion.variants[0].options[0].price.toLocaleString()}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile search button */}
            <button
              onClick={toggleSearch}
              className="text-white hover:bg-blue-700 lg:hidden p-2 rounded"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link href="/home/user">
              <button className="text-white hover:bg-blue-700 p-2 rounded">
                <User className="w-5 h-5" />
              </button>
            </Link>

            <Link href="/home/wishlist">
              <button className="text-white hover:bg-blue-700 p-2 rounded">
                <Heart className="w-5 h-5" />
              </button>
            </Link>

            <Link href="/home/my-cart">
              <button className="text-white hover:bg-blue-700 relative p-2 rounded">
                <ShoppingCart className="w-5 h-5" />
                {cartLength > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center text-white">
                    {cartLength}
                  </span>
                )}
              </button>
            </Link>

            {/* Desktop language selector */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-transparent hover:bg-white hover:text-[#121212] text-white">
                    ENG <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-36" align="end">
                  <DropdownMenuItem onClick={() => openModal()}>
                    Spanish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {isSearchOpen && (
          <div className="mt-4 lg:hidden relative">
            <div className="flex items-center bg-white py-[2px] px-3 rounded-full">
              <Search className="w-4 h-4 text-gray-500 mr-2 mt-1" />
              <input
                placeholder="Search for anything..."
                className="flex-1 border-0 outline-0 text-[#121212] text-sm"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
                autoFocus
              />
              <button
                onClick={handleSearchSubmit}
                className=" px-3 text-[10px] h-[9px] leading-tight bg-primary text-white rounded-md ml-2"
              >
                Search
              </button>
            </div>
            
            {showSuggestions && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  {suggestionsData?.suggestions && suggestionsData.suggestions.map((suggestion) => (
                    <Link
                      key={suggestion._id}
                      href={`/home/product-details/${suggestion.slug}`}
                      onClick={() => {
                        handleSuggestionClick(suggestion);
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0">
                        {suggestion.images?.[0] && (
                          <img
                            src={suggestion.images[0]}
                            alt={suggestion.name}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {suggestion.category?.main?.name}
                        </p>
                      </div>
                      {suggestion.variants?.[0]?.options?.[0]?.price && (
                        <div className="text-xs font-semibold text-gray-900">
                          ₦{suggestion.variants[0].options[0].price.toLocaleString()}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal2 isOpen={isSell} onClose={handlecloseModal}>
        <div className="inline-block overflow-hidden text-left pb-4 px-4 sm:px-6 lg:px-7 relative align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-[90vw] sm:max-w-[620px] sm:w-full">
          <div className="py-4 flex justify-between items-center">
            <h3 className="text-lg sm:text-xl md:text-2xl flex-1 text-center text-gray-700 font-semibold">
              Sell on Mprimo
            </h3>
            <X
              onClick={handlecloseModal}
              className="cursor-pointer text-black hover:text-gray-600"
              size={20}
            />
          </div>

          <p className="text-center text-sm sm:text-base text-tdark px-2">
            Welcome to Mprimo sales platform. To continue, choose your preferred
            selling option
          </p>

          <img
            src="/images/amico.png"
            alt="sell on mprimo"
            className="mx-auto h-[150px] sm:h-[200px] object-cover mt-4 mb-2"
          />

          <div className="mb-6 md:mb-9 mt-5 md:mt-8 space-y-4">
            <FullButton
              action={() => {
                handlecloseModal();
              }}
              name="Sell as Individual"
            />

            <FullButton
              action={() => {
                handlecloseModal();
              }}
              name=" Sell as Business"
              type="button"
            />
          </div>
        </div>
      </Modal2>

      <AuthenticationModal isOpen={isSell} close={handlecloseModal} />
    </header>
  );
};

export default Header;
