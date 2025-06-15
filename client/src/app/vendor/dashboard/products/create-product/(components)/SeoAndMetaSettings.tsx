import Input from "./Input";
import React from "react";
import NavigationButtons from "./NavigationButtons";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";

type Props = {
  onSaveDraft?: () => void;
};

const SeoAndMetaSettings = (props: Props) => {
  const { updateProductDetails, productDetails } = useProductListing();
  const [seoDetails, setSeoDetails] = React.useState({
    slug: productDetails?.seo?.slug || "",
    metaTitle: productDetails?.seo?.metaTitle || "",
    metaDescription: productDetails?.seo?.metaDescription || "",
  });
  const { isMobileOrTablet } = useResponsive();

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full">
      <h1 className="text-[14px] mb-4 xl:text-center">Seo and Metadata</h1>
      {/* Available shipping methods */}
      <div className="flex flex-col gap-y-3">
        <Input
          label="Slug (URL Name"
          placeholder="Nike-baseball-cap"
          value={seoDetails.slug}
          onChange={(e) => {
            setSeoDetails({
              ...seoDetails,
              slug: e.target.value,
            });
            updateProductDetails("seo", {
              slug: e.target.value,
            });
          }}
          type="text"
          helperText="Auto-generated"
        />
        <Input
          label="Meta Title"
          placeholder="Buy Nike Baseball Cap Online | Mprimo"
          value={seoDetails.metaTitle}
          onChange={(e) => {
            setSeoDetails({
              ...seoDetails,
              metaTitle: e.target.value,
            });
            updateProductDetails("seo", {
              metaTitle: e.target.value,
            });
          }}
          type="text"
          helperText="Shown on search engine result."
        />
        <Input
          label="Warranty Period"
          placeholder="2 years"
          value={seoDetails.metaDescription}
          onChange={(e) => {
            setSeoDetails({
              ...seoDetails,
              metaDescription: e.target.value,
            });
            updateProductDetails("seo", {
              metaDescription: e.target.value,
            });
          }}
          type="text"
          helperText="Shown on search engine result."
        />
      </div>
      {isMobileOrTablet && (
        <div className="mt-4">
          <NavigationButtons onSaveDraft={props.onSaveDraft}/>
        </div>
      )}
    </div>
  );
};

export default SeoAndMetaSettings;
