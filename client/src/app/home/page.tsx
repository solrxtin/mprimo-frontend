"use client"

import BestDeals from "@/components/Home/BestDeals";
import ShopCategoriesComponent from "@/components/Home/ByCategory";
import ComputerAccessories from "@/components/Home/ComputerAccessories";
import Cta from "@/components/Home/Cta";
import FeaturedProducts from "@/components/Home/FeaturedProduct";
import MarketplaceSection from "@/components/Home/Hero";
import CustomerReviews from "@/components/Home/Review";
import { AllProduct } from "@/utils/config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useQuery } from "@tanstack/react-query";
import React from "react";

type HomepageProps = {
  children?: React.ReactNode;
};

const Page = ({ children }: HomepageProps) => {

const fetchAllProducts = async () => {
  const response = await fetchWithAuth(`${AllProduct}?page=2`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  console.log("Vendor products:", data);
  return data.products;
};

const useAllProducts =  useQuery({
    queryKey: ['useAllProducts'],
    queryFn: fetchAllProducts,
    // enabled: !!vendorId, // ensures it won't run if vendorId is undefined/null
    refetchOnWindowFocus: false,
    retry: 1,
  });


  console.log("all Products", useAllProducts)



  return (
    <div className=" font-roboto">
     
      <MarketplaceSection product={useAllProducts.data} />
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
