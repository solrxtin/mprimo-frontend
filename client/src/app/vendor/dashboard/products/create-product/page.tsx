"use client";

import { useEffect, useState } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import Navigator from "./(components)/Navigator";
import Stepper from "./(components)/Stepper";
import ProductImages from "./(components)/ProductImages";
import ProductDetailForm from "./(components)/ProductDetailForm";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import ProductSpecifications from "./(components)/ProductSpecifications";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  toastConfigError,
  toastConfigInfo,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { useCategories } from "@/hooks/queries";

import ShippingDetails from "./(components)/ShippingDetails";
import SeoAndMetaSettings from "./(components)/SeoAndMetaSettings";
import PricingInformation from "./(components)/PricingInformation";
import NavigationButtons from "./(components)/NavigationButtons";
import Preview from "./(components)/Preview";
import Drafts from "./(components)/Drafts";
import { useSaveDraft } from "@/hooks/mutations";
import ProductVariants from "./(components)/ProductVariants";
import FinalSubmission from "./(components)/FinalSubmission";

type Props = {};

const Page = (props: Props) => {
  const [activeTab, setActiveTab] = useState<"drafts" | "addProduct">(
    "addProduct"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    action: () => {},
  });
  const router = useRouter();
  const { mutate: saveDraftToServer } = useSaveDraft();
  useCategories();

  const {
    step,
    productDetails,
    totalAttributePages,
    setProductDetails,
    setStep,
    setDraftId
  } = useProductListing();

  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();

  const handleSaveDraft = async () => {
    try {
      // Get existing drafts or initialize empty array
      const existingDrafts = JSON.parse(
        localStorage.getItem("productDrafts") || "[]"
      );
      const existingDraft = productDetails.productName
        ? existingDrafts.find(
            (d: any) =>
              d.productDetails?.productName === productDetails.productName
          )
        : null;
      const draftId = existingDraft?.draftId || `draft-${Date.now()}`;
      const filteredDrafts = existingDrafts.filter(
        (d: any) => d.draftId !== draftId
      );

      // Save to local storage first (immediate, no network delay)
      const draft = {
        draftId,
        productDetails,
        step,
        lastUpdated: new Date().toISOString(),
        savedOnMobile: isMobileOrTablet,
      };

      // Add new draft
      localStorage.setItem(
        "productDrafts",
        JSON.stringify([...filteredDrafts, draft])
      );
      setActiveTab("drafts");
      setProductDetails({});
      setStep(1);
      setDraftId(draftId)

      // Also save to database for persistence across devices
      saveDraftToServer(draft, {
        onSuccess: () => {
          toast.success("Draft saved successfully", toastConfigSuccess);
        },
        onError: () => {
          toast.info(
            "Draft saved locally, but could not be saved to your account",
            toastConfigInfo
          );
        },
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Error saving draft", toastConfigError);
    }
  };

  const handleEditDraft = (draft: any) => {
    setProductDetails(draft.productDetails);
    setActiveTab("addProduct");
    setShowForm(true);
    setShowPreview(false);
    draft.step && setStep(draft.step);
    setDraftId(draft.draftId)

    // Handle step conversion between mobile and desktop
    if (draft.savedOnMobile && !isMobileOrTablet) {
      // Convert from mobile (8 steps) to desktop (4 steps)
      const mobileStep = draft.step;
      let desktopStep = 1;

      // Mobile steps 1-2 → Desktop step 1
      // Mobile steps 3-5 → Desktop step 2
      // Mobile steps 6-7 → Desktop step 3
      // Mobile step 8 → Desktop step 4
      if (mobileStep <= 2) desktopStep = 1;
      else if (mobileStep <= 5) desktopStep = 2;
      else if (mobileStep <= 7) desktopStep = 3;
      else desktopStep = 4;

      setStep(desktopStep);
    } else if (!draft.savedOnMobile && isMobileOrTablet) {
      // Convert from desktop (4 steps) to mobile (8 steps)
      const desktopStep = draft.step;
      let mobileStep = 1;

      // Desktop step 1 → Mobile step 1
      // Desktop step 2 → Mobile step 3 (specs) or 4 (variants)
      // Desktop step 3 → Mobile step 6
      // Desktop step 4 → Mobile step 8
      if (desktopStep === 1) mobileStep = 1;
      else if (desktopStep === 2) {
        // If variants exist in the draft, go to variants step
        if (
          draft.productDetails?.variants &&
          draft.productDetails.variants.length > 0
        ) {
          mobileStep = 4; // Variants step
        } else {
          mobileStep = 3; // Specifications step
        }
      } else if (desktopStep === 3) mobileStep = 6;
      else mobileStep = 8;

      setStep(mobileStep);
    } else {
      // Same device type, no conversion needed
      setStep(draft.step);
    }
  };

  const validateDesktopStep1 = async () => {
    const imageErrors: { [key: string]: string } = {};
    const { images } = productDetails;

    // Validate images
    if (!images || images.length < 1) {
      imageErrors.imagesError = "Main product image is required";
    }
    if (images && images.length > 6) {
      imageErrors.imagesError =
        "You can only upload a maximum of 6 images in total";
    }

    return new Promise<boolean>((resolve) => {
      let detailValidated = false;

      const handleDetailsValidated = (e: Event) => {
        const event = e as CustomEvent<{ isValid: boolean }>;
        detailValidated = event.detail.isValid;
        console.log("DetailValid", detailValidated);

        document.removeEventListener(
          "detailsValidated",
          handleDetailsValidated
        );

        const imagesValid = Object.keys(imageErrors).length === 0;

        if (imagesValid && detailValidated) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      // Attach listener for validation result first
      document.addEventListener("detailsValidated", handleDetailsValidated);

      // Then dispatch events
      setTimeout(() => {
        document.dispatchEvent(
          new CustomEvent("imageErrors", { detail: imageErrors })
        );
        document.dispatchEvent(new CustomEvent("validateDetails"));
      }, 100);

      // Timeout fallback
      setTimeout(() => {
        document.removeEventListener(
          "detailsValidated",
          handleDetailsValidated
        );
        resolve(false);
      }, 5000); // Reduced from 60000 to 5000 for consistency
    });
  };

  const validateDesktopStep2 = async () => {
    console.log("Starting validateDesktopStep2");
    console.log("Current productDetails:", productDetails);

    return new Promise<boolean>((resolve) => {
      let specificationValid = false;
      let pricingValid = false;
      let variantsValid = true; // Default to true since variants are optional
      let specChecked = false;
      let pricingChecked = false;
      let variantsChecked = true; // Default to true since variants are optional

      // Handler for specifications validation
      const handleSpecificationsResult = (e: Event) => {
        console.log("Received specificationsValidated event");
        const event = e as CustomEvent<{ isValid: boolean }>;
        specificationValid = event.detail.isValid;
        specChecked = true;
        console.log("SpecValid", specificationValid);
        checkAllResults();
      };

      // Handler for pricing validation
      const handlePricingResult = (e: Event) => {
        console.log("Received pricingValidated event");
        const event = e as CustomEvent<{ isValid: boolean }>;
        pricingValid = event.detail.isValid;
        pricingChecked = true;
        console.log("PricingValid", pricingValid);
        checkAllResults();
      };

      // Handler for variants validation (only if variants exist)
      const handleVariantsResult = (e: Event) => {
        console.log("Received variantsValidated event");
        const event = e as CustomEvent<{ isValid: boolean }>;
        variantsValid = event.detail.isValid;
        variantsChecked = true;
        console.log("VariantsValid", variantsValid);
        checkAllResults();
      };

      // Only resolve when all results are in
      const checkAllResults = () => {
        console.log(
          `Checking results: specChecked=${specChecked}, pricingChecked=${pricingChecked}, variantsChecked=${variantsChecked}`
        );
        if (specChecked && pricingChecked && variantsChecked) {
          // Remove event listeners before resolving
          document.removeEventListener(
            "specificationsValidated",
            handleSpecificationsResult as EventListener
          );
          document.removeEventListener(
            "pricingValidated",
            handlePricingResult as EventListener
          );
          // Only remove variants listener if it was added
          if (productDetails.variants && productDetails.variants.length > 0) {
            document.removeEventListener(
              "variantsValidated",
              handleVariantsResult as EventListener
            );
          }

          const result = specificationValid && pricingValid && variantsValid;
          console.log(`Resolving with result: ${result}`);
          resolve(result);
        }
      };

      // Add event listeners BEFORE dispatching events
      document.addEventListener(
        "specificationsValidated",
        handleSpecificationsResult as EventListener
      );
      document.addEventListener(
        "pricingValidated",
        handlePricingResult as EventListener
      );
      // Only add variants listener if variants exist
      if (productDetails.variants && productDetails.variants.length > 0) {
        document.addEventListener(
          "variantsValidated",
          handleVariantsResult as EventListener
        );
      }

      // Now dispatch events to trigger validation in all components
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("validateSpecifications"));
        document.dispatchEvent(new CustomEvent("validatePricing"));

        // Only validate variants if they exist
        if (productDetails.variants && productDetails.variants.length > 0) {
          document.dispatchEvent(new CustomEvent("validateVariants"));
          variantsChecked = false; // Reset to false since we're expecting a response
        }
      }, 100);

      // Timeout in case events never come back
      setTimeout(() => {
        console.log(
          `Timeout reached. specChecked=${specChecked}, pricingChecked=${pricingChecked}, variantsChecked=${variantsChecked}`
        );
        document.removeEventListener(
          "specificationsValidated",
          handleSpecificationsResult as EventListener
        );
        document.removeEventListener(
          "pricingValidated",
          handlePricingResult as EventListener
        );
        // Only remove variants listener if it was added
        if (productDetails.variants && productDetails.variants.length > 0) {
          document.removeEventListener(
            "variantsValidated",
            handleVariantsResult as EventListener
          );
        }
        resolve(false);
      }, 5000); // 5 second timeout
    });
  };

  const validateDesktopStep3 = () => {
    return new Promise<boolean>((resolve) => {
      let shippingValid = false;

      // Handler for shipping validation
      const handleShippingResult = (e: CustomEvent) => {
        document.removeEventListener(
          "shippingValidated",
          handleShippingResult as EventListener
        );
        shippingValid = e.detail.isValid;
        // Resolve the promise with the validation result
        resolve(shippingValid);
      };

      // Add event listeners first
      document.addEventListener(
        "shippingValidated",
        handleShippingResult as EventListener
      );

      // Then dispatch event
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("validateShipping"));
      }, 100);

      // Timeout in case events never comes back
      setTimeout(() => {
        document.removeEventListener(
          "shippingValidated",
          handleShippingResult as EventListener
        );
        resolve(false);
      }, 5000); // Increased from 500ms to 5000ms for consistency
    });
  };

  const handleShowPreviewClicked = () => {
    setShowForm(false);
    setShowPreview(true);
  };

  const handleHidePreviewClicked = () => {
    setShowForm(true);
    setShowPreview(false);
  };

  const renderStepContent = () => {
    if (isMobile || isTablet) {
      switch (step) {
        case 1:
          return <ProductImages onSaveDraft={handleSaveDraft} />;
        case 2:
          return <ProductDetailForm onSaveDraft={handleSaveDraft} />;
        case 3:
          return <ProductSpecifications onSaveDraft={handleSaveDraft} />;
        case 4:
          return <ProductVariants onSaveDraft={handleSaveDraft} />;
        case 5:
          return <PricingInformation onSaveDraft={handleSaveDraft} />;
        case 6:
          return <ShippingDetails onSaveDraft={handleSaveDraft} />;
        case 7:
          return <SeoAndMetaSettings onSaveDraft={handleSaveDraft} />;
        case 8:
          return <FinalSubmission onSaveDraft={handleSaveDraft} />;
        default:
          return null;
      }
    } else {
      switch (step) {
        case 1:
          return (
            <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
              {/* Product Images */}
              <ProductImages />
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                <ProductDetailForm />
                <NavigationButtons
                  onNext={async () => {
                    const isValid = await validateDesktopStep1();
                    if (!isValid) {
                      toast.error(
                        "Please fix the errors before proceeding.",
                        toastConfigError
                      );
                      return false;
                    }
                    return true;
                  }}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            </div>
          );
        case 2:
          return totalAttributePages === 2 ? (
            <ProductSpecifications />
          ) : (
            <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                {/* Product Specifications */}
                <ProductSpecifications />
              </div>
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                {/* Pricing Information */}
                <PricingInformation />
                {/* Product Variants */}
                <ProductVariants />
                <NavigationButtons
                  onNext={async () => {
                    const isValid = await validateDesktopStep2();
                    if (!isValid) {
                      toast.error(
                        "Please fix the errors before proceeding.",
                        toastConfigError
                      );
                      return false;
                    }
                    return true;
                  }}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            </div>
          );
        case 3:
          return (
            <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
              <ShippingDetails />
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                <SeoAndMetaSettings />
                <NavigationButtons
                  onNext={async () => {
                    const isValid = await validateDesktopStep3();
                    if (!isValid) {
                      toast.error(
                        "Please fix the errors before proceeding.",
                        toastConfigError
                      );
                      return false;
                    }
                    return true;
                  }}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            </div>
          );
        case 4:
          return <FinalSubmission onSaveDraft={handleSaveDraft} />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="bg-[#f6f6f6] max-w-full overflow-x-hidden min-h-screen">
      <div className="p-2 sm:p-4 xl:p-10">
        <div className="flex flex-col-reverse lg:flex-row justify-between items-start md:items-center mb-5 gap-x-4">
          <div className="w-full">
            <div className="flex overflow-x-auto scrollbar-hide gap-x-2 lg:gap-x-4 items-center text-[#b5b4b4] mb-1">
              <div
                className={`text-sm md:text-lg whitespace-nowrap border-r pr-2 md:pr-4 cursor-pointer ${
                  activeTab === "drafts" ? "text-[#002f7a] font-semibold" : ""
                }`}
                onClick={() => setActiveTab("drafts")}
              >
                Drafts
              </div>
              <div
                className={`text-sm md:text-lg whitespace-nowrap px-2 md:px-4 cursor-pointer ${
                  activeTab === "addProduct"
                    ? "text-[#002f7a] font-semibold"
                    : ""
                }`}
                onClick={() => setActiveTab("addProduct")}
              >
                Add Product
              </div>
            </div>
            <p className="font-[family-name:var(--font-poppins)] text-xs md:text-sm text-[#323232]">
              Welcome back, Bovie! Here's what is happening with your store
              today.
            </p>
          </div>
          <div className="flex justify-end gap-x-4 items-center h-[10%] w-full lg:mt-4">
            {activeTab === "addProduct" && !showPreview && <Navigator />}
            {activeTab === "addProduct" && !showPreview && <Stepper />}
          </div>
        </div>
        {activeTab === "addProduct" ? (
          <>
            {showPreview && <Preview onHide={handleHidePreviewClicked} />}
            {showForm && (
              <div className="bg-white rounded-xl">
                <div className="p-4 flex justify-between items-center border-b border-gray-300">
                  <div className="flex gap-x-2 items-center text-gray-500">
                    <ArrowLeft
                      size={16}
                      onClick={() => {
                        setModalConfig({
                          title: "Go Back",
                          message:
                            "Are you sure you want to go to the previous page?",
                          action: () => router.back(),
                        });
                        setIsModalOpen(true);
                      }}
                      className="cursor-pointer hover:text-red-800"
                    />
                    <p className="text-sm">Add new product</p>
                  </div>
                  <p
                    className="text-sm primary cursor-pointer hover:underline"
                    onClick={handleShowPreviewClicked}
                  >
                    See live preview
                  </p>
                </div>
                {/* Forms */}

                <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
                  {/* Forms */}
                  {renderStepContent()}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {activeTab === "drafts" && <Drafts onEditDraft={handleEditDraft} />}
          </>
        )}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalConfig.title}
          onConfirm={modalConfig.action}
          confirmText="Continue"
        >
          <p>{modalConfig.message}</p>
        </Modal>
      </div>
    </div>
  );
};

export default Page;
