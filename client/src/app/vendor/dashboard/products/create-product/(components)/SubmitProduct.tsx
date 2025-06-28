import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useCategories } from "@/hooks/queries";
import { useCountries } from "@/hooks/useCountries";


export const useProductMapper = () => {
  const { productDetails } = useProductListing();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];
  const { data:countries } = useCountries()

  const country = countries?.find((country) => country.name === productDetails.shippingDetails?.productLocation)

  // Find category IDs by name
  const findCategoryIdByName = (name: string) => {
    const category = categories.find((cat: any) => cat.name === name);
    return category?._id || null;
  };

  const mapProductDetailsToSchema = () => {
    // Get main category ID
    const mainCategoryId = findCategoryIdByName(productDetails.category);

    // Get subcategory IDs
    const subCategoryIds = [
      productDetails.subCategory,
      productDetails.subCategory2,
      productDetails.subCategory3,
      productDetails.subCategory4,
      productDetails.subCategory5,
    ]
      .filter(Boolean) // Filter out undefined/null/empty values
      .map(findCategoryIdByName)
      .filter(Boolean); // Filter out any null IDs

    const subcategoryNames = [
      productDetails.subCategory5,
      productDetails.subCategory4,
      productDetails.subCategory3,
      productDetails.subCategory2,
      productDetails.subCategory,
    ].find(Boolean);

    // Get the category object for the deepest subcategory
    const deepestCategory = subcategoryNames
      ? categories.find((cat: any) => cat.name === subcategoryNames)
      : categories.find((cat: any) => cat.name === productDetails.category);

    // Use the path from the deepest category, or an empty array if not found
    const categoryPath = deepestCategory?.path || [];

    return {
      name: productDetails.productName,
      brand: productDetails.brandName,
      description: productDetails.description,
      condition: productDetails.condition?.toLowerCase() as
        | "new"
        | "used"
        | "refurbished",
      conditionDescription: productDetails.conditionDescription,
      category: {
        main: mainCategoryId,
        sub: subCategoryIds,
        path: categoryPath,
      },
      country: country?._id!,
      inventory: {
        lowStockAlert: 2,
        listing: {
          type:
            productDetails.pricingInformation?.listingType === "auction"
              ? ("auction" as const)
              : ("instant" as const),
          instant:
            productDetails.pricingInformation?.listingType === "instantSale"
              ? {
                  acceptOffer: Boolean(
                    productDetails.pricingInformation?.instantSale?.acceptOffer
                  ),
                  price: Number(
                    productDetails.pricingInformation?.instantSale?.price
                  ),
                  salePrice: Number(
                    productDetails.pricingInformation?.instantSale?.salePrice
                  ),
                  quantity: Number(
                    productDetails.pricingInformation?.storeQuantity
                  ),
                }
              : undefined,
          auction:
            productDetails.pricingInformation?.listingType === "auction"
              ? {
                  startBidPrice: Number(
                    productDetails.pricingInformation?.auction?.startPrice
                  ),
                  reservePrice: Number(
                    productDetails.pricingInformation?.auction?.reservePrice
                  ),
                  buyNowPrice: productDetails.pricingInformation?.auction
                    ?.buyNowPrice
                    ? Number(
                        productDetails.pricingInformation?.auction?.buyNowPrice
                      )
                    : undefined,
                  startTime: new Date(
                    productDetails.pricingInformation?.auction?.startTime
                  ),
                  endTime: new Date(
                    productDetails.pricingInformation?.auction?.endTime
                  ),
                  quantity: Number(
                    productDetails.pricingInformation?.storeQuantity
                  ),
                  bidIncrement: 1.0,
                }
              : undefined,
        },
      },
      images: productDetails.images || [],
      specifications: productDetails.productSpecifications 
        ? Object.entries(productDetails.productSpecifications).map(([key, value]) => ({
            key,
            value: String(value), // Convert value to string to match the expected type
          }))
        : [],
      shipping: {
        weight: Number(productDetails.shippingDetails?.productWeight),
        unit: productDetails.shippingDetails?.weightUnit as "kg" | "lbs",
        dimensions: {
          length: Number(
            productDetails.shippingDetails?.productDimensions?.length
          ),
          width: Number(
            productDetails.shippingDetails?.productDimensions?.width
          ),
          height: Number(
            productDetails.shippingDetails?.productDimensions?.height
          ),
        },
        restrictions: ["none"],
      },
      variants: productDetails.variants?.map((variant: any) => ({
        name: variant.name,
        options: variant.options.map((option: any) => ({
          value: option.value,
          price: Number(option.price),
          inventory: Number(option.inventory),
        })),
      })),
    };
  };
  return { mapProductDetailsToSchema };
};
