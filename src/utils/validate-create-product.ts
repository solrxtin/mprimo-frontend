import mongoose from "mongoose";
import Category from "../models/category.model";

export const validateProductData = async (productData: any) => {
  try {
    const {
      name,
      brand,
      description,
      condition,
      category,
      country,
      inventory,
      images,
      specifications,
      shipping,
      variants,
    } = productData;

    // Basic validation for required fields
    if (
      !name ||
      !brand ||
      !description ||
      !condition ||
      !category?.main ||
      !country ||
      !inventory?.listing?.type ||
      !images ||
      !shipping
    ) {
      throw new Error("Missing required fields");
    }

    // Validate listing type and required fields
    const listingType = inventory.listing.type;
    if (listingType === "instant") {
      // Instant listings must have variants with pricing
      if (!Array.isArray(variants) || variants.length === 0) {
        throw new Error("Instant listing requires at least one variant");
      }
    } else if (listingType === "auction") {
      const { startBidPrice, reservePrice, startTime, endTime, bidIncrement } =
        inventory.listing.auction || {};
      if (
        !startBidPrice ||
        !reservePrice ||
        !startTime ||
        !endTime ||
        !bidIncrement
      ) {
        throw new Error(
          "Auction listing requires startBidPrice, reservePrice, startTime, endTime, and bidIncrement"
        );
      }

      // Validate auction dates
      const now = new Date();
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      if (startDate <= now) {
        throw new Error("Auction start time must be in the future");
      }

      if (endDate <= startDate) {
        throw new Error("Auction end time must be after start time");
      }

      const minDurationMs = 24 * 60 * 60 * 1000; // 24 hours
      if (endDate.getTime() - startDate.getTime() < minDurationMs) {
        throw new Error("Auction duration must be at least 24 hours");
      }
    } else {
      throw new Error("Invalid listing type");
    }

    // Validate category exists
    const mainCategory = await Category.findById(category.main);
    if (!mainCategory) {
      throw new Error("Category not found");
    }

    // Validate specifications against category attributes
    const requiredAttributes = mainCategory.attributes.filter(
      (attr) => attr.required
    );

    // Check if specifications array exists
    if (
      !specifications ||
      !Array.isArray(specifications) ||
      specifications.length === 0
    ) {
      throw new Error("Specifications are required");
    }

    // Check for required attributes
    for (const attr of requiredAttributes) {
      const hasAttribute = specifications.some(
        (spec) => spec.key === attr.name
      );
      if (!hasAttribute) {
        throw new Error(
          `Required attribute "${attr.name}" is missing from specifications`
        );
      }
    }

    // Validate specification values based on attribute types
    for (const spec of specifications) {
      const matchingAttr = mainCategory.attributes.find(
        (attr) => attr.name === spec.key
      );
      if (matchingAttr) {
        switch (matchingAttr.type) {
          case "number":
            if (isNaN(Number(spec.value))) {
              throw new Error(`Specification "${spec.key}" must be a number`);
            }
            break;
          case "boolean":
            if (spec.value !== "true" && spec.value !== "false") {
              throw new Error(
                `Specification "${spec.key}" must be a boolean (true/false)`
              );
            }
            break;
          case "select":
            if (
              matchingAttr.options &&
              !matchingAttr.options.includes(spec.value)
            ) {
              throw new Error(
                `Specification "${
                  spec.key
                }" must be one of: ${matchingAttr.options.join(", ")}`
              );
            }
            break;
        }
      }
    }

    let selectedCategory;

    if (category.sub?.length > 0)
      selectedCategory = await Category.findById(
        category.sub[category.sub.length - 1]
      );
    else selectedCategory = mainCategory;

    if (selectedCategory && selectedCategory.productDimensionsRequired) {
      if (
        !shipping.dimensions?.length ||
        !shipping.dimensions?.width ||
        !shipping.dimensions?.height
      ) {
        throw new Error(
          "Shipping information is incomplete: Product dimensions required"
        );
      }
    }

    if (selectedCategory && selectedCategory.productWeightRequired) {
      if (!shipping.weight) {
        throw new Error(
          "Shipping information is incomplete: Product weight required for this product"
        );
      }
    }

    // Validate images
    if (!Array.isArray(images) || images.length < 1 || images.length > 10) {
      throw new Error("Must have between 1 and 10 images");
    }

    // Validate variants if provided
    if (variants && variants.length > 0) {
      const variantNames = new Set();
      for (const variant of variants) {
        // Check for duplicate variant names
        if (variantNames.has(variant.name)) {
          throw new Error(`Duplicate variant name: ${variant.name}`);
        }
        variantNames.add(variant.name);

        // Validate options
        if (!Array.isArray(variant.options) || variant.options.length < 1) {
          throw new Error(
            `Variant ${variant.name} must have at least one option`
          );
        }

        const optionValues = new Set();
        for (const option of variant.options) {
          if (optionValues.has(option.value)) {
            throw new Error(
              `Duplicate option value ${option.value} in variant ${variant.name}`
            );
          }
          optionValues.add(option.value);

          // Validate option price and quantity
          if (!option.price || option.price < 0.01) {
            throw new Error(
              `Option price must be at least 0.01 for ${option.value}`
            );
          }

          if (!option.salePrice || option.salePrice < 0.01) {
            throw new Error(
              `Option sale price must be at least 0.01 for ${option.value}`
            );
          }

          if (option.quantity === undefined || option.quantity < 0) {
            throw new Error(
              `Option quantity cannot be negative for ${option.value}`
            );
          }

          // Validate required SKU
          if (!option.sku || option.sku.trim() === "") {
            throw new Error(`Option SKU is required for ${option.value}`);
          }
        }
      }
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};
