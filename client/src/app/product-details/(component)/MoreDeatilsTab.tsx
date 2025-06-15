"use client";

import React, { useState } from "react";
import {
  Star,
  Shield,
  Truck,
  Headphones,
  CreditCard,
  Facebook,
  Twitter,
  Instagram,
  Mail,
} from "lucide-react";

const ProductDetailsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: "Description" },
    { id: 1, label: "Specifications" },
    { id: 2, label: "Additional Information" },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
            ? "text-yellow-400 fill-current opacity-50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const DescriptionTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 ">
      {/* Description Column */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
        <div className="space-y-4 text-gray-600 leading-relaxed text-xs md:text-sm ">
          <p>
            The Samsung 98 Inch Crystal UHD Smart TV is a massive display with
            impressive features and immersive viewing experience with its
            massive display. Crystal UHD technology, advanced features like
            Motion Xcelerator 120Hz for smooth motion, Q-Symphony for enhanced
            audio, and seamless smart TV capabilities through Samsung's Tizen
            OS, providing access to a wide range of apps, games, and streaming
            services.
          </p>
          <p>
            The Samsung 98 Inch Crystal UHD Smart TV is a massive display with
            impressive features and immersive viewing experience with its
            massive display.
          </p>
        </div>
      </div>

      {/* Features Column */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">Free 1 Year Warranty</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">
              Safe Shipping & Fasted Delivery
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">24/7 Customer support</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">Secure payment method</span>
          </div>
        </div>
      </div>

      {/* Shipping Details Column */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Shipping Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-1">
            <span className="text-gray-600">Courier:</span>
            <span className="text-gray-900 font-medium">
              2 - 4 days, free shipping
            </span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-600">Local Shipping:</span>
            <span className="text-gray-900 font-medium">up to one week</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-600">UPS Ground Shipping:</span>
            <span className="text-gray-900 font-medium">4 - 6 days</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-600">Unishop Global Export:</span>
            <span className="text-gray-900 font-medium">3 - 4 days</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SpecificationsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Key Features */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-xl font-medium text-gray-900 mb-4">Key Features</h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">
              Crystal UHD Display:
            </span>
            <span className="text-gray-600 ml-2">Enjoy lifelike colours</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">
              Supersize Picture Enhancer:
            </span>
            <span className="text-gray-600 ml-2">Optimize picture quality</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">
              Motion Xcelerator:
            </span>
            <span className="text-gray-600 ml-2">Smooth motion</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Q-Symphony:</span>
            <span className="text-gray-600 ml-2">Sound enhancement</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Samsung Tizen OS:</span>
            <span className="text-gray-600 ml-2">Access to Applications</span>
          </div>
        </div>
      </div>

      {/* Display and Audio */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          Display and Audio
        </h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">Screen Size:</span>
            <span className="text-gray-600 ml-2">98 inches</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Resolution:</span>
            <span className="text-gray-600 ml-2">
              4K Ultra HD (3840 * 2160)
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Refresh Rate:</span>
            <span className="text-gray-600 ml-2">
              120Hz (Motion Xcelerator)
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Sound Output:</span>
            <span className="text-gray-600 ml-2">20W (2 Channel)</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Adaptive Sound</span>
          </div>
        </div>
      </div>

      {/* Smart Features */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-xl font-medium text-gray-900 mb-4">Smart Features</h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">
              SmartThings Compatible:
            </span>
            <span className="text-gray-600 ml-2">Smart device control</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">
              Built-in Voice Assistant:
            </span>
            <span className="text-gray-600 ml-2">Voice command</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Multi-View:</span>
            <span className="text-gray-600 ml-2">Two video watch</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Apple Airplay:</span>
            <span className="text-gray-600 ml-2">Good for streaming</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Adaptive Sound</span>
          </div>
        </div>
      </div>
    </div>
  );

  const AdditionalInfoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Business Information */}
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          Business Information
        </h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">Business Name:</span>
            <span className="text-gray-600 ml-2">Johnson Communication</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Business Address:</span>
            <span className="text-gray-600 ml-2">
              41 Brazil Road, Abuja, Nigeria
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">
              Registration Number:
            </span>
            <span className="text-gray-600 ml-2">#233442</span>
          </div>
        </div>
      </div>

      {/* Seller Information */}
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-4">
          Seller Information
        </h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">Name:</span>
            <span className="text-blue-600 ml-2 font-medium">
              Mr Johnson Ebuka
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">Rating:</span>
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(4.7)}</div>
              <span className="text-sm text-gray-600 ml-1">
                4.7 Seller Star Rating
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Seller */}
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-4">Contact Seller</h3>
        <div className="flex gap-3">
          <button className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
            <Facebook size={20} />
          </button>
          <button className="w-10 h-10 bg-blue-400 text-white rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
            <Twitter size={20} />
          </button>
          <button className="w-10 h-10 bg-pink-600 text-white rounded-lg flex items-center justify-center hover:bg-pink-700 transition-colors">
            <Instagram size={20} />
          </button>
          <button className="w-10 h-10 bg-gray-600 text-white rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
            <Mail size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <DescriptionTab />;
      case 1:
        return <SpecificationsTab />;
      case 2:
        return <AdditionalInfoTab />;
      default:
        return <DescriptionTab />;
    }
  };

  return (
    <div className="md:px-[42px] lg:px-[80px] px-4  mt-2 md:mt-3 lg:mt-5   ">
      {/* Tab Navigation */}
      <div className="border">
        <div className="flex flex-wrap justify-center gap-8 mb-4 lg:mb-8 border-b border-gray-200 p-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 font-medium text-base transition-colors relative ${
                activeTab === tab.id
                  ? "text-gray-900 border-b-2 border-orange-400"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-4">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ProductDetailsTabs;
