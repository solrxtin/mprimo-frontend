import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Package, Shield, ShoppingCart, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import {ProductProps} from "../../types/product.type"

interface MarketplaceSectionProps {
  product: ProductProps;
}

const MarketplaceSection = ({ product }: MarketplaceSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  
  const carouselItems = [
    {
      title: "The Best Place to Buy",
      subtitle: "PS5",
      description: "Bid now on this PS5 in immaculate condition - unleash your gaming potential",
      buttonText: "Buy Now",
      image: "/images/ps5.png",
      badge: "Starting ₦200K"
    },
    {
      title: "Premium Gaming Setup",
      subtitle: "Xbox Series X",
      description: "Experience next-gen gaming with this pristine Xbox Series X console",
      buttonText: "Buy Now",
          image: "/images/ps5.png",

      badge: "Starting ₦180K"
    },
    {
      title: "Gaming Essentials",
      subtitle: "Nintendo Switch",
      description: "Portable gaming at its finest - perfect condition Nintendo Switch",
      buttonText: "Buy Now",
      image: "/images/ps5.png",
      badge: "Starting ₦120K"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 4000); 

    return () => clearInterval(interval);
  }, [isAutoPlaying, carouselItems.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false); 
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false); 
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index:number) => {
    setIsAutoPlaying(false); 
    setCurrentSlide(index);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const features = [
    {
      icon: <Package className="w-8 h-8 text-orange-500" />,
      title: "Global Delivery Options",
      description: "Fast & Reliable Shipping",
      image: "/images/delivery.png"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Secure Payment",
      description: "Easy international payment",
      image: "/images/payment.png"

    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-yellow-500" />,
      title: "Buy New or Used Items",
      description: "Eco-friendly experience",
      image: "/images/buy.png"

    },
    {
      icon: <MapPin className="w-8 h-8 text-purple-500" />,
      title: "Real Time Tracking",
      description: "Keep track of your item",
      image: "/images/track.png"

    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Open to Everyone",
      description: "Great experience for all",
      image: "/images/everyone.png"

    }
  ];

  return (
    <div className="md:px-[42px] lg:px-[80px] px-4  py-10 md:py-14 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Carousel Section */}
        <div className="lg:col-span-2 ">
          <div className="bg-gradient-to-br flex from-[#E2E8F0] to-[#e5eaf0] rounded-md p-4 md:p-6 lg:p-8 relative overflow-hidden">
            <div className="relative z-10 w-[55%]">
              <div className="text-blue-600 font-medium text-sm mb-2 flex items-center">
                → {carouselItems[currentSlide].title}
              </div>
              <h2 className="text-lg md:text-2xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-4">
                {carouselItems[currentSlide].subtitle}
              </h2>
              <p className="text-gray-600 text-sm lg:text-base mb-3 md:mb-6 leading-relaxed max-w-[80%] whitespace-normal">
                {carouselItems[currentSlide].description}
              </p>
              <button className=" bg-secondary hover:bg-blue-700 font-normal text-white px-8 py-2 md:py-3 rounded-md transition-colors duration-200 shadow-lg hover:shadow-xl">
                {carouselItems[currentSlide].buttonText}
              </button>
              
              {/* Pagination Dots */}
              <div className="flex space-x-2 mt-4 md:mt-8">
                {carouselItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                      currentSlide === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

             <div className="flex items-center justify-center relative w-[45%]">
            <img 
              src={carouselItems[currentSlide].image}
              alt="PS5 Console with Controllers"
              className="w-[100px] md:w-[80px] lg:w-[160px] h-[180px] md:h-[220px] lg:h-[300px] object-contain rounded-lg"
            />
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {carouselItems[currentSlide].badge}
            </div>
          </div>
            
            {/* <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button> */}
          </div>
        </div>

       

        {/* Product Cards */}
        <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
        

          <div className="bg-gray-900 border border-gray-200 rounded-md p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
             
              <div className="flex-1">
                <h3 className="font- text-yellow-500 mb-3">AUCTION FRIDAY</h3>
                <div className="text-sm lg:text-base font-medium text-white mb-4">Fairly Used Apple iPad 28GB
5G Tablet </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm  transition-colors duration-200">
                  View Details
                </button>
              </div>
               <img 
                src="/images/image.png" 
                alt="AirPods Max"
                className="w-16 h-16 object-contain rounded-lg"
              />
            </div>
          </div>

           <div className="bg-[#E2E8F0] border border-gray-200 rounded-md p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/image.png" 
                alt="AirPods Max"
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div className="flex-1">
                <h3 className=" text-gray-900 mb-3">Apple Airpods Max - Silver</h3>
                <div className="text-sm lg:text-base font-medium  text-gray-900 mb-3">₦770,000</div>
               <Link href="/product-details">
                 <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm  transition-colors duration-200">
                   View Details
                 </button>
               </Link>
              </div>
            </div>
          </div> 
        </div>
      </div>

      <div className="grid  grid-cols-5 items-center overflow-x-scroll  mt-2 md:mt-2 lg:mt-4 w-full">
        {features.map((feature, index) => (
          <div key={index} className="bg-[#E2E8F0] rounded-md py-1 lg:py-[6px] px-2 md:px-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-2 md:space-x-4">
             
              <img src={feature?.image} alt="" className='h-[30px] md:h-[40px] lg:h-[50px] rounded-md' />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1 text-xs whitespace-nowrap">{feature.title}</h4>
                <p className="text-gray-600 text-[10px] leading-relaxed whitespace-nowrap">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceSection;