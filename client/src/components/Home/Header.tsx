import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  ChevronDown,
  MapPin,
  MapPinned,
  CalendarArrowUp,
  Headset,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "../Modal";
import { useState } from "react";
import FullButton from "../FullButton";
import Link from "next/link";
import Modal2 from "../Modal2";
import { useCartLength } from "@/stores/cartHook";
import AuthenticationModal from "@/app/(auth)/authenticationModal";
import { useAuthModalStore } from "@/stores/useAuthModalStore";

const Header = () => {
  const [isSell, setIsSell] = useState(false);
  const cartLength = useCartLength();
  const { openModal } = useAuthModalStore();

  const handleSellClick = () => {
    setIsSell(!isSell);
  };
  const handlecloseModal = () => {
    setIsSell(false);
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
    <header className=" text-white">
      <div className=" px-[16px] bg-primary  md:px-[42px] lg:px-[80px] border-b-[0.5px] border-[#E2E8F0]  text-center py-2 text-sm lg:text-base font-medium flex justify-between items-center">
        <span>Welcome to Mprimo online store...</span>

        <div className="md:flex items-center gap-3 font-normal hidden">
          {pages.map((page, index) => (
            <Link href={page?.link || "#"} key={index}>
              <span className="mx-2">{page.name}</span>
            </Link>
          ))}
        </div>
        <Button
          variant="link"
                      onClick={handleSellClick}

          className="text-[#121212] py-2 lg:py-3 w-[100px] lg:w-[180px] rounded-md bg-white  font-normal h-auto"
        >
          Sale
        </Button>
      </div>

      {/* Main header */}
      <div className=" bg-primary md:px-[42px] lg:px-[80px] px-4 py-2 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/home">
            <div className="flex items-center gap-2">
              <img
                src="/images/mprimoLogo.png"
                alt="mprimoLogo image"
                className=" h-[32px] md:h-[42px] lg:h-[48px] w-[90px] md:w-[110px] lg:w-[180px]"
              />
            </div>
          </Link>

          {/* Search bar */}
          <div className="flex-1 font-normal hidden md:block">
            <div className=" flex mx-auto max-w-2xl  bg-white  py-[5px] rounded-4xl">
              <button className=" border-r px-2 ">
                <Search className="w-3 h-3 md:w-4 md:h-4" color="black" />
              </button>
              <input
                placeholder="Search for anything..."
                className="flex-1 border-0  pl-[2px] outline-0 text-[#121212]"
              />

              <button className="py-[4px] font-normal md:py-2 w-[80px] text-xs md:w-[120px] lg:w-[150px] bg-primary placeholder:text-xs  rounded-4xl mr-1  ">
                Search
              </button>
            </div>
          </div>

          {/* Right menu */}
          <div className="flex items-center gap-4">
            <button className="text-white hover:bg-blue-700 md:hidden">
              <Search className="w-5 h-5 " />
            </button>
            <Link href="/home/user">
              {" "}
              <button className="text-white hover:bg-blue-700">
                <User className="w-5 h-5 " />
              </button>
            </Link>
            <Link href="/home/wishlist">
              {" "}
              <button className="text-white hover:bg-blue-700">
                <Heart className="w-5 h-5 mr-2" />
              </button>
            </Link>
            <Link href="/home/my-cart">
              {" "}
              <button className="text-white hover:bg-blue-700 relative">
                <ShoppingCart className="w-5 h-5 mr-2" />

                <span className="absolute -top-2 right-0 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartLength}
                </span>
              </button>
            </Link>
            {/* <Button
              variant="ghost"
              className="lg:hidden text-white hover:bg-blue-700"
            >
              <Menu className="w-5 h-5" />
            </Button> */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-transparent hover:bg-white hover:text-[#121212] text-white">
                    ENG <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-36" align="start">
                  <DropdownMenuItem onClick={() => openModal()}>
                    Spnaish
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

    

      <Modal2
        isOpen={isSell} // Replace with your state management for modal visibility
        onClose={handlecloseModal} // Replace with your state management for closing the modal
      >
        <div className="inline-block overflow-hidden text-left pb-4  px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-[white] rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-[620px] sm:w-full">
          <div className="py-4 flex justify-between  ">
            <h3 className="text-[18px] flex-1 text-center  md:text-[20px] md:leading-[24px]  text-gray-700 font-semibold">
              Sell on Mprimo
            </h3>

            <X
              onClick={handlecloseModal}
              className="cursor-pointer text-black"
              size={20}
            />
          </div>

          <p className="text-center text-xs md:text-sm text-tdark">
            Welcome to Mprimo sales platform. To continue, choose your preferred
            selling option
          </p>
          <img
            src="/images/amico.png"
            alt="sell on mprimo"
            className="mx-auto h-[200px] object-cover mt-4 mb-2"
          />

          <div className="mb-6 md:mb-9 mt-5 md:mt-8">
            <FullButton
              action={() => {}}
              color="blue"
              name="Business Enterprise"
            />
            <button className="text-center mt-6 w-full text-tdark">
              Personal Sales
            </button>
          </div>
        </div>
      </Modal2>
    </header>
  );
};

export default Header;
