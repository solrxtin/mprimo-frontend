"use client";

import type React from "react";

import ProductInfo from "./(component)/ProductInfo";
import ProductDetailsTabs from "./(component)/MoreDeatilsTab";
import ReviewsPage from "./(component)/Review";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAProducts } from "@/hooks/queries";

const ProductPage: React.FC = () => {
  const { slug } = useParams();

  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchAProducts(slug as string),
    enabled: !!slug,

  });


  return (
  <div className=" font-roboto">

      <ProductInfo productData={productData?.product}/>
      <ProductDetailsTabs productData={productData?.product}/>
      <ReviewsPage />
    </div>
  );
};

export default ProductPage;
