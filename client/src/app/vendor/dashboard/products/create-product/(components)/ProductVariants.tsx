import React, { useState, useEffect, useRef } from "react";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { Plus, Trash2, TriangleAlert, X } from "lucide-react";
import NavigationButtons from "./NavigationButtons";
import { useResponsive } from "@/hooks/useResponsive";
import Input from "@/components/Input";

type VariantOption = {
  value: string;
  price: number;
  inventory: number;
};

type Variant = {
  name: string;
  options: VariantOption[];
};

type Props = {
  onSaveDraft?: () => void;
};

export default function ProductVariants({ onSaveDraft }: Props) {
  const { productDetails, updateProductDetails } = useProductListing();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { isMobileOrTablet } = useResponsive();
  const initialRenderRef = useRef(true);

  // Initialize variants from context if they exist - only on mount
  useEffect(() => {
    if (productDetails.variants && Array.isArray(productDetails.variants)) {
      setVariants(JSON.parse(JSON.stringify(productDetails.variants)));
    }
  }, []);

  // Update context when variants change, but only after initial render
  // Using useRef to track previous variants to prevent infinite loops
  const prevVariantsRef = useRef<string>("");
  
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      prevVariantsRef.current = JSON.stringify(variants);
      return;
    }

    const currentVariantsStr = JSON.stringify(variants);
    
    // Only update if variants have changed from previous render
    if (currentVariantsStr !== prevVariantsRef.current) {
      prevVariantsRef.current = currentVariantsStr;
      updateProductDetails("variants", JSON.parse(JSON.stringify(variants)));
    }
  }, [variants, updateProductDetails]);

  // Add a new variant
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: "",
        options: [{ value: "", price: 0, inventory: 0 }],
      },
    ]);
  };

  // Remove a variant
  const removeVariant = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  // Update variant name
  const updateVariantName = (index: number, name: string) => {
    const updatedVariants = [...variants];
    updatedVariants[index].name = name;
    setVariants(updatedVariants);

    // Clear error if exists
    if (errors[`variant-${index}-name`]) {
      setErrors({ ...errors, [`variant-${index}-name`]: "" });
    }
  };

  // Add option to variant
  const addOption = (variantIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].options.push({
      value: "",
      price: 0,
      inventory: 0,
    });
    setVariants(updatedVariants);
  };

  // Remove option from variant
  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].options.splice(optionIndex, 1);
    setVariants(updatedVariants);
  };

  // Update option value
  const updateOptionValue = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOption,
    value: string | number
  ) => {
    const updatedVariants = [...variants];

    if (field === "price" || field === "inventory") {
      updatedVariants[variantIndex].options[optionIndex][field] = Number(value);
    } else {
      updatedVariants[variantIndex].options[optionIndex][field] =
        value as string;
    }

    setVariants(updatedVariants);

    // Clear error if exists
    if (errors[`variant-${variantIndex}-option-${optionIndex}-${field}`]) {
      setErrors({
        ...errors,
        [`variant-${variantIndex}-option-${optionIndex}-${field}`]: "",
      });
    }
  };

  // Validate variants
  const validateVariants = () => {
    const newErrors: { [key: string]: string } = {};

    variants.forEach((variant, variantIndex) => {
      // Validate variant name
      if (!variant.name.trim()) {
        newErrors[`variant-${variantIndex}-name`] = "Variant name is required";
      } else if (variant.name.length > 50) {
        newErrors[`variant-${variantIndex}-name`] =
          "Variant name cannot exceed 50 characters";
      }

      // Validate options
      variant.options.forEach((option, optionIndex) => {
        if (!option.value.trim()) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-value`] =
            "Option value is required";
        } else if (option.value.length > 50) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-value`] =
            "Option value cannot exceed 50 characters";
        }

        if (option.price < 0.01) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-price`] =
            "Price must be at least 0.01";
        }

        if (option.inventory < 0) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-inventory`] =
            "Inventory cannot be negative";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add validation event listener
  useEffect(() => {
    const handleValidateEvent = () => {
      const isValid = validateVariants();
      document.dispatchEvent(
        new CustomEvent("variantsValidated", {
          detail: { isValid },
        })
      );
    };

    document.addEventListener("validateVariants", handleValidateEvent);

    return () => {
      document.removeEventListener("validateVariants", handleValidateEvent);
    };
  }, [variants]);

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full font-[family-name:var(--font-alexandria)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="">Product Variants</h3>
        <button
          type="button"
          onClick={addVariant}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-md text-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Variant</span>
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
          <div className="flex gap-x-2 items-center text-blue-500 justify-center p-2">
            <TriangleAlert size={16} />
            <p className="text-xs">
              No variants added yet. Add variants if your product comes in
              different options like sizes or colors.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, variantIndex) => (
            <div
              key={variantIndex}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="">
                <label className="block text-xs mb-2">
                  Variant Name (e.g., Size, Color)
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      id={`variant-${variantIndex}-name`}
                      label="Variant Name"
                      type="text"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariantName(variantIndex, e.target.value)
                      }
                      placeholder="Enter variant name"
                      error={errors[`variant-${variantIndex}-name`]}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md mb-5 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-1">
                <label className="block text-sm mb-2">Options</label>
                <div className="space-y-1">
                  {variant.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex flex-wrap gap-2 items-end"
                    >
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-value`}
                          label="Option Value"
                          type="text"
                          value={option.value}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="Option value (e.g., Small, Red)"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-value`
                            ]
                          }
                        />
                      </div>
                      <div className="w-[120px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-price`}
                          label="Price"
                          type="number"
                          value={option.price.toString()}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "price",
                              e.target.value
                            )
                          }
                          placeholder="Price"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-price`
                            ]
                          }
                        />
                      </div>
                      <div className="w-[120px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-inventory`}
                          label="Inventory"
                          type="number"
                          value={option.inventory.toString()}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "inventory",
                              e.target.value
                            )
                          }
                          placeholder="Inventory"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-inventory`
                            ]
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(variantIndex, optionIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md mb-5 cursor-pointer"
                        disabled={variant.options.length <= 1}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOption(variantIndex)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-gray-50 rounded-md text-sm cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Option</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isMobileOrTablet && (
        <div className="mt-6">
          <NavigationButtons
            onNext={validateVariants}
            onSaveDraft={onSaveDraft}
          />
        </div>
      )}
    </div>
  );
}
