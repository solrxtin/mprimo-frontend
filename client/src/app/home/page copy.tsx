"use client"

import BestDeals from "@/components/Home/BestDeals";
import ShopCategoriesComponent from "@/components/Home/ByCategory";
import ComputerAccessories from "@/components/Home/ComputerAccessories";
import Cta from "@/components/Home/Cta";
import FeaturedProducts from "@/components/Home/FeaturedProduct";
import MarketplaceSection from "@/components/Home/Hero";
import CustomerReviews from "@/components/Home/Review";
import React from "react";

type HomepageProps = {
  children?: React.ReactNode;
};



const Page = ({ children }: HomepageProps) => {
  return (
    <div className=" font-roboto">
      <MarketplaceSection />
      <BestDeals />
      <ShopCategoriesComponent />
      <FeaturedProducts />
      <ComputerAccessories />
      <CustomerReviews />
      <Cta />
    </div>
  );
};

export default Page;
