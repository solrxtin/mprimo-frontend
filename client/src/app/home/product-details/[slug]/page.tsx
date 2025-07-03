"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { Star, Heart, MessageCircle } from "lucide-react";
import ProductInfo from "./(component)/ProductInfo";
import Header from "@/components/Home/Header";
import ProductDetailsTabs from "./(component)/MoreDeatilsTab";
import ReviewsPage from "./(component)/Review";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProductType } from "@/types/product.type";
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
      <ProductDetailsTabs/>
      <ReviewsPage />
    </div>
  );
};

export default ProductPage;
