"use client";

import {
  useFetchProductAnalytics,
  useFetchProductBySlug,
} from "@/hooks/queries";
import React from "react";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import { ArrowLeftIcon, Edit, Trash } from "lucide-react";
import Image from "next/image";

type Props = {
  slug: string;
};

type InformationProps = {
  label: string;
  value: string | number;
};

const InformationCard = (props: InformationProps) => {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-secondary">{props.label}</p>
      <p className="text-sm text-primary">{props.value}</p>
    </div>
  );
};

const ProductDetail = ({ slug }: Props) => {
  const {
    data: productData,
    isError: productError,
    error: productErrorData,
    isLoading: productLoading,
  } = useFetchProductBySlug(slug);

  const product = productData?.product;
  const productId = product?._id;

  const {
    data: analyticsData,
    isError: analyticsError,
    error: analyticsErrorData,
    isLoading: analyticsLoading,
  } = useFetchProductAnalytics(productId, "monthly");

  if (productLoading || (productId && analyticsLoading)) {
    return <ProductDetailSkeleton />;
  }

  if (productError) {
    return <div>Error loading product: {productErrorData?.message}</div>;
  }

  if (analyticsError) {
    return <div>Error loading analytics: {analyticsErrorData?.message}</div>;
  }

  return (
    <div className="bg-white rounded-lg p-4 text-primary">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 flex flex-col gap-y-5">
          <div className="">
            {/* Render product details */}
            {product && (
              <div className="rounded-lg border border-gray-200 p-4 text-sm">
                <div className="flex gap-x-2">
                  <ArrowLeftIcon />
                  <div>
                    <h3>Product Details</h3>
                    <p>{product?.name}</p>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 h-[280px] rounded-md p-2 flex items-center justify-center">
                  <Image
                    src={product?.images[0]}
                    alt="product image"
                    width={300}
                    height={300}
                    style={{ width: "auto", height: "auto" }}
                    className="object-contain w-full h-auto max-h-[300px]"
                  />
                </div>
                <div className="flex mt-2 items-center justify-between">
                  <div className="bg-[#d3e1fe] rounded-full px-4 py-2">
                    {product?.category?.sub.length > 0 ? (
                      <p>
                        {
                          product?.category?.sub[
                            product?.category?.sub.length - 1
                          ].name
                        }
                      </p>
                    ) : (
                      <p>{product?.category?.main?.name}</p>
                    )}
                  </div>
                  {product?.inventory?.listing?.type === "instant" && (
                    <p>
                      {product.country.currency}{" "}
                      {product.inventory.listing.instant.price.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm">{product?.name}</p>
                  <p className="text-xs mt-1 text-secondary">
                    {product?.description}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Render product analytics */}
          {analyticsData && (
            <div>
              <h2>Analytics (Monthly)</h2>
              <pre>{JSON.stringify(analyticsData, null, 2)}</pre>
            </div>
          )}
        </div>
        <div className="col-span-5">
          <div className="flex justify-end mb-4">
            <button className="bg-red-500 cursor-pointer text-white px-2 py-1 flex gap-x-2 items-center rounded-md">
              <Trash />
              Delete
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg mb-12">
            <p className="py-4 px-8 border-b border-gray-200">
              Product Information
            </p>
            <div className="px-2 py-4 flex flex-col gap-y-2">
              <InformationCard
                label={"Category"}
                value={product.category.main.name}
              />
              <InformationCard label={"Brand"} value={product.brand} />
              <InformationCard
                label="Status"
                value={
                  product.status.charAt(0).toUpperCase() +
                  product.status.slice(1)
                }
              />
              <InformationCard
                label="Sales method"
                value={
                  product.inventory.listing.type.charAt(0).toUpperCase() +
                  product.inventory.listing.type.slice(1)
                }
              />
              {product.inventory.listing.type === "instant" ? (
                <InformationCard
                  label={"Quantity"}
                  value={product.inventory.listing.instant.quantity}
                />
              ) : (
                <InformationCard label={"Quantity"} value={1} />
              )}
              <InformationCard
                label="Created"
                value={new Date(product.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg">
            <p className="py-4 px-8 border-b border-gray-200">
              Sales Summary
            </p>
            <div className="px-2 py-8 pb-12 flex flex-col gap-y-2">
              <InformationCard
                label={"Category"}
                value={product.category.main.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
