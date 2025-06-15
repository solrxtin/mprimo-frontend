import { useProductListing } from '@/contexts/ProductLisitngContext';
import { useCreateProduct } from '@/hooks/useCreateProduct';

export const useSubmitProduct = () => {
  const { productDetails } = useProductListing();
  const createProductMutation = useCreateProduct();

  const handleSubmit = async () => {
    try {
      const mappedData = {
        name: productDetails.basicDetails?.name,
        brand: productDetails.basicDetails?.brand,
        description: productDetails.basicDetails?.description,
        condition: productDetails.basicDetails?.condition as 'new' | 'used' | 'refurbished',
        conditionDescription: productDetails.basicDetails?.conditionDescription,
        category: {
          main: productDetails.category?.main,
          sub: productDetails.category?.sub || [],
          path: productDetails.category?.path || [],
        },
        country: productDetails.shippingDetails?.productLocation,
        inventory: {
          lowStockAlert: 2,
          listing: {
            type: productDetails.pricingInformation?.listingType === 'auction' ? 'auction' as const : 'instant' as const,
            instant: productDetails.pricingInformation?.listingType === 'instantSale' ? {
              acceptOffer: Boolean(productDetails.pricingInformation?.instantSale?.acceptOffer),
              price: Number(productDetails.pricingInformation?.instantSale?.price),
              salePrice: Number(productDetails.pricingInformation?.instantSale?.salePrice),
              quantity: Number(productDetails.pricingInformation?.storeQuantity),
            } : undefined,
            auction: productDetails.pricingInformation?.listingType === 'auction' ? {
              startBidPrice: Number(productDetails.pricingInformation?.auction?.startPrice),
              reservePrice: Number(productDetails.pricingInformation?.auction?.reservePrice),
              buyNowPrice: productDetails.pricingInformation?.auction?.buyNowPrice ? 
                Number(productDetails.pricingInformation?.auction?.buyNowPrice) : undefined,
              startTime: new Date(productDetails.pricingInformation?.auction?.startTime),
              endTime: new Date(productDetails.pricingInformation?.auction?.endTime),
              quantity: Number(productDetails.pricingInformation?.storeQuantity),
              bidIncrement: 1.00,
            } : undefined,
          },
        },
        images: productDetails.images || [],
        specifications: productDetails.productSpecifications?.map((spec: any) => ({
          key: spec.name,
          value: spec.value,
        })) || [],
        shipping: {
          weight: Number(productDetails.shippingDetails?.productWeight),
          unit: productDetails.shippingDetails?.weightUnit as 'kg' | 'lbs',
          dimensions: {
            length: Number(productDetails.shippingDetails?.productDimensions?.length),
            width: Number(productDetails.shippingDetails?.productDimensions?.width),
            height: Number(productDetails.shippingDetails?.productDimensions?.height),
          },
          restrictions: ['none'],
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
      
      return await createProductMutation.mutateAsync(mappedData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  return {
    handleSubmit,
    isLoading: createProductMutation.isPending,
    isError: createProductMutation.isError,
    isSuccess: createProductMutation.isSuccess,
    error: createProductMutation.error
  };
};