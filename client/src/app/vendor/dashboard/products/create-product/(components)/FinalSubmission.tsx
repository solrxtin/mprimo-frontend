import React, { useState } from 'react';
import { useProductListing } from '@/contexts/ProductLisitngContext';
import { useProductMapper } from './SubmitProduct';
import { useCreateProduct } from '@/hooks/useCreateProduct';
import { useProductValidation } from '@/hooks/useProductValidation';
import { useRefreshProducts } from '@/hooks/useRefreshProducts';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { toastConfigSuccess, toastConfigError } from '@/app/config/toast.config';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onSaveDraft?: () => void;
}

export default function FinalSubmission({ onSaveDraft }: Props) {
  const { productDetails, setProductDetails, setStep } = useProductListing();
  const { mapProductDetailsToSchema } = useProductMapper();
  const createProduct = useCreateProduct();
  const { validateProduct, errors, hasErrors } = useProductValidation();
  const { refreshProducts } = useRefreshProducts();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Map product details to backend schema
      const mappedData = mapProductDetailsToSchema();
      console.log('Mapped product data:', mappedData);
      
      // Validate the mapped data
      const validation = validateProduct(mappedData);
      
      if (!validation.isValid) {
        toast.error('Please fix validation errors before submitting', toastConfigError);
        console.log('Validation errors:', validation.errors);
        return;
      }

      // Submit to backend
      const result = await createProduct.mutateAsync(mappedData);
      
      if (result.success) {
        toast.success('Product created successfully!', toastConfigSuccess);
        
        // Refresh products list
        refreshProducts();
        
        // Clear form data
        setProductDetails({});
        setStep(1);
        
        // Redirect to products page
        router.push('/vendor/dashboard/products');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.', toastConfigError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationSummary = () => {
    const mappedData = mapProductDetailsToSchema();
    const validation = validateProduct(mappedData);
    return validation;
  };

  const validationSummary = getValidationSummary();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Review & Submit Product</h2>
      
      {/* Validation Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border ${
          validationSummary.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {validationSummary.isValid ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
            <h3 className={`font-semibold ${
              validationSummary.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationSummary.isValid ? 'Ready to Submit' : 'Validation Issues Found'}
            </h3>
          </div>
          
          {!validationSummary.isValid && (
            <div className="space-y-1">
              {validationSummary.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">
                  • {error.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Summary */}
      <div className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold">Product Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <p className="text-sm text-gray-900">{productDetails.productName || 'Not specified'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <p className="text-sm text-gray-900">{productDetails.brandName || 'Not specified'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <p className="text-sm text-gray-900">{productDetails.category || 'Not specified'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <p className="text-sm text-gray-900">{productDetails.condition || 'Not specified'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Listing Type</label>
            <p className="text-sm text-gray-900">
              {productDetails.pricingInformation?.listingType === 'auction' ? 'Auction' : 'Instant Sale'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <p className="text-sm text-gray-900">
              {productDetails.images?.length || 0} image(s) uploaded
            </p>
          </div>
        </div>

        {/* Variants Summary */}
        {productDetails.variants && productDetails.variants.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>
            <div className="space-y-2">
              {productDetails.variants.map((variant: any, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{variant.name}</p>
                  <p className="text-sm text-gray-600">
                    {variant.options?.length || 0} option(s)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {productDetails.pricingInformation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
            <div className="bg-gray-50 p-3 rounded">
              {productDetails.pricingInformation.listingType === 'instantSale' ? (
                <div>
                  <p>Price: ${productDetails.pricingInformation.instantSale?.price}</p>
                  {productDetails.pricingInformation.instantSale?.salePrice && (
                    <p>Sale Price: ${productDetails.pricingInformation.instantSale.salePrice}</p>
                  )}
                  <p>Quantity: {productDetails.pricingInformation.storeQuantity}</p>
                </div>
              ) : (
                <div>
                  <p>Start Bid: ${productDetails.pricingInformation.auction?.startPrice}</p>
                  <p>Reserve Price: ${productDetails.pricingInformation.auction?.reservePrice}</p>
                  {productDetails.pricingInformation.auction?.buyNowPrice && (
                    <p>Buy Now: ${productDetails.pricingInformation.auction.buyNowPrice}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        {onSaveDraft && (
          <button
            onClick={onSaveDraft}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Save as Draft
          </button>
        )}
        
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Back to Edit
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!validationSummary.isValid || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="animate-spin" size={16} />}
          {isSubmitting ? 'Creating Product...' : 'Create Product'}
        </button>
      </div>
    </div>
  );
}