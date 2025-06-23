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

const Header = () => {
  const [isSell, setIsSell] = useState(false);

  const handleSellClick = () => {
    setIsSell(!isSell);
  };
  const handlecloseModal = () => {
    setIsSell(false);
  };
  return (
    <header className=" text-white">
      <div className=" px-[16px] bg-secondary  md:px-[42px] lg:px-[80px] border-b-[0.5px] border-[#E2E8F0]  text-center py-2 text-sm lg:text-base font-medium flex justify-between items-center">
        <span>Welcome to Mprimo online store...</span>
        <p className="hidden lg:block">
          Get up to{" "}
          <span className="text-base md:text-lg lg:text-xl font-semibold">
            50% OFF
          </span>{" "}
          everything
        </p>
        <Button
          variant="link"
          className="text-[#121212] py-2 lg:py-3 w-[100px] lg:w-[180px] rounded-md bg-white  font-normal h-auto"
        >
          Sale
        </Button>
      </div>

      {/* Main header */}
      <div className=" bg-secondary md:px-[42px] lg:px-[80px] px-4 py-2 md:py-4">
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

              <button className="py-[4px] font-normal md:py-2 w-[80px] text-xs md:w-[120px] lg:w-[150px] bg-secondary placeholder:text-xs  rounded-4xl mr-1  ">
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
                  2
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
                  <DropdownMenuItem>
                    Spnaish
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Navigation */}
      </div>

      <nav className="md:px-[42px] lg:px-[80px] text-[13px] md:text-base overflow-x-scroll px-4 py-2 md:py-4 font-normal border-b border-[#E2E8F0] ">
        <div className="flex items-center ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="bg-transparent text-[#121212] hover:bg-[#E2E8F0] hover:text-[#121212] "
              >
                All Categories <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-36" align="start">
              <DropdownMenuItem>
                Spnaish
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            className="bg-transparent text-[#121212] hover:bg-[#E2E8F0] hover:text-[#121212]  font-normal"
          >
            <MapPinned /> Track Order
          </Button>
          <Button
            variant="ghost"
            onClick={handleSellClick}
            className="bg-transparent text-[#121212] hover:bg-[#E2E8F0] hover:text-[#121212] font-normal"
          >
            <svg
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.4999 7.25H19.5719C19.7577 7.25018 19.9368 7.31933 20.0745 7.44403C20.2123 7.56874 20.2988 7.74013 20.3174 7.925L20.7749 12.5H19.2659L18.8909 8.75H16.4999V11C16.4999 11.1989 16.4209 11.3897 16.2802 11.5303C16.1396 11.671 15.9488 11.75 15.7499 11.75C15.551 11.75 15.3602 11.671 15.2195 11.5303C15.0789 11.3897 14.9999 11.1989 14.9999 11V8.75H8.99987V11C8.99987 11.1989 8.92086 11.3897 8.7802 11.5303C8.63955 11.671 8.44879 11.75 8.24987 11.75C8.05096 11.75 7.8602 11.671 7.71954 11.5303C7.57889 11.3897 7.49987 11.1989 7.49987 11V8.75H5.10737L3.90737 20.75H11.9999V22.25H3.07787C2.97312 22.2499 2.86955 22.2278 2.77383 22.1853C2.67812 22.1427 2.59238 22.0806 2.52215 22.0028C2.45192 21.9251 2.39874 21.8335 2.36606 21.734C2.33337 21.6345 2.3219 21.5292 2.33237 21.425L3.68237 7.925C3.70095 7.74013 3.78749 7.56874 3.92522 7.44403C4.06296 7.31933 4.24207 7.25018 4.42787 7.25H7.49987V6.7265C7.49987 4.1255 9.50387 2 11.9999 2C14.4959 2 16.4999 4.1255 16.4999 6.7265V7.2515V7.25ZM14.9999 7.25V6.7265C14.9999 4.9355 13.6469 3.5 11.9999 3.5C10.3529 3.5 8.99987 4.9355 8.99987 6.7265V7.2515H14.9999V7.25ZM19.7204 18.59L17.9999 16.871V22.25C17.9999 22.4489 17.9209 22.6397 17.7802 22.7803C17.6396 22.921 17.4488 23 17.2499 23C17.051 23 16.8602 22.921 16.7195 22.7803C16.5789 22.6397 16.4999 22.4489 16.4999 22.25V16.871L14.7809 18.59C14.7117 18.6616 14.6289 18.7188 14.5374 18.7581C14.4459 18.7974 14.3475 18.8181 14.2479 18.8189C14.1483 18.8198 14.0496 18.8008 13.9574 18.7631C13.8652 18.7254 13.7815 18.6697 13.7111 18.5993C13.6407 18.5289 13.585 18.4451 13.5473 18.353C13.5095 18.2608 13.4906 18.162 13.4914 18.0625C13.4923 17.9629 13.513 17.8644 13.5523 17.7729C13.5916 17.6814 13.6487 17.5987 13.7204 17.5295L16.7204 14.5295C16.861 14.3889 17.0517 14.3099 17.2506 14.3099C17.4495 14.3099 17.6402 14.3889 17.7809 14.5295L20.7809 17.5295C20.8525 17.5987 20.9096 17.6814 20.9489 17.7729C20.9883 17.8644 21.0089 17.9629 21.0098 18.0625C21.0107 18.162 20.9917 18.2608 20.954 18.353C20.9163 18.4451 20.8606 18.5289 20.7902 18.5993C20.7197 18.6697 20.636 18.7254 20.5438 18.7631C20.4517 18.8008 20.3529 18.8198 20.2533 18.8189C20.1537 18.8181 20.0553 18.7974 19.9638 18.7581C19.8723 18.7188 19.7896 18.6616 19.7204 18.59Z"
                fill="black"
              />
            </svg>
            Sell{" "}
          </Button>
          <Button
            variant="ghost"
            className="bg-transparent text-[#121212] hover:bg-[#E2E8F0] hover:text-[#121212] font-normal"
          >
            <CalendarArrowUp /> Today's Deal
          </Button>

          <Button
            variant="ghost"
            className="bg-transparent text-[#121212] hover:bg-[#E2E8F0] hover:text-[#121212] font-normal "
          >
            <svg
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.4999 7.25H19.5719C19.7577 7.25018 19.9368 7.31933 20.0745 7.44403C20.2123 7.56874 20.2988 7.74013 20.3174 7.925L20.7749 12.5H19.2659L18.8909 8.75H16.4999V11C16.4999 11.1989 16.4209 11.3897 16.2802 11.5303C16.1396 11.671 15.9488 11.75 15.7499 11.75C15.551 11.75 15.3602 11.671 15.2195 11.5303C15.0789 11.3897 14.9999 11.1989 14.9999 11V8.75H8.99987V11C8.99987 11.1989 8.92086 11.3897 8.7802 11.5303C8.63955 11.671 8.44879 11.75 8.24987 11.75C8.05096 11.75 7.8602 11.671 7.71954 11.5303C7.57889 11.3897 7.49987 11.1989 7.49987 11V8.75H5.10737L3.90737 20.75H11.9999V22.25H3.07787C2.97312 22.2499 2.86955 22.2278 2.77383 22.1853C2.67812 22.1427 2.59238 22.0806 2.52215 22.0028C2.45192 21.9251 2.39874 21.8335 2.36606 21.734C2.33337 21.6345 2.3219 21.5292 2.33237 21.425L3.68237 7.925C3.70095 7.74013 3.78749 7.56874 3.92522 7.44403C4.06296 7.31933 4.24207 7.25018 4.42787 7.25H7.49987V6.7265C7.49987 4.1255 9.50387 2 11.9999 2C14.4959 2 16.4999 4.1255 16.4999 6.7265V7.2515V7.25ZM14.9999 7.25V6.7265C14.9999 4.9355 13.6469 3.5 11.9999 3.5C10.3529 3.5 8.99987 4.9355 8.99987 6.7265V7.2515H14.9999V7.25ZM19.7204 18.59L17.9999 16.871V22.25C17.9999 22.4489 17.9209 22.6397 17.7802 22.7803C17.6396 22.921 17.4488 23 17.2499 23C17.051 23 16.8602 22.921 16.7195 22.7803C16.5789 22.6397 16.4999 22.4489 16.4999 22.25V16.871L14.7809 18.59C14.7117 18.6616 14.6289 18.7188 14.5374 18.7581C14.4459 18.7974 14.3475 18.8181 14.2479 18.8189C14.1483 18.8198 14.0496 18.8008 13.9574 18.7631C13.8652 18.7254 13.7815 18.6697 13.7111 18.5993C13.6407 18.5289 13.585 18.4451 13.5473 18.353C13.5095 18.2608 13.4906 18.162 13.4914 18.0625C13.4923 17.9629 13.513 17.8644 13.5523 17.7729C13.5916 17.6814 13.6487 17.5987 13.7204 17.5295L16.7204 14.5295C16.861 14.3889 17.0517 14.3099 17.2506 14.3099C17.4495 14.3099 17.6402 14.3889 17.7809 14.5295L20.7809 17.5295C20.8525 17.5987 20.9096 17.6814 20.9489 17.7729C20.9883 17.8644 21.0089 17.9629 21.0098 18.0625C21.0107 18.162 20.9917 18.2608 20.954 18.353C20.9163 18.4451 20.8606 18.5289 20.7902 18.5993C20.7197 18.6697 20.636 18.7254 20.5438 18.7631C20.4517 18.8008 20.3529 18.8198 20.2533 18.8189C20.1537 18.8181 20.0553 18.7974 19.9638 18.7581C19.8723 18.7188 19.7896 18.6616 19.7204 18.59Z"
                fill="black"
              />
            </svg>
            Best Seller
          </Button>

          <Button
            variant="ghost"
            className="bg-transparent text-[#121212] hover:bg-[#E2E8F0] hover:text-[#121212] font-normal "
          >
            <Headset /> Customer Support
          </Button>
        </div>
      </nav>

      <Modal
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
      </Modal>
    </header>
  );
};

export default Header;
