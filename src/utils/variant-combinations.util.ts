// src/utils/variant-combinations.util.ts

export interface CombinationInput {
  values: Record<string, string>; // {"Color": "Black", "Size": "Small"}
  price: number;
  salePrice?: number;
  quantity: number;
}

export interface ProcessedCombination {
  value: string; // "Black Small"
  sku: string;
  price: number;
  salePrice?: number;
  quantity: number;
  isDefault: boolean;
  dimensions: Record<string, string>;
}

export class VariantCombinationUtil {
  /**
   * Generate all possible combinations from variant dimensions
   * Used for frontend matrix generation
   */
  static generateAllCombinations(
    dimensions: Record<string, string[]>
  ): Record<string, string>[] {
    const keys = Object.keys(dimensions);
    const values = keys.map(key => dimensions[key]);
    
    const combinations: Record<string, string>[] = [];
    
    function generateRecursive(current: Record<string, string>, index: number) {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }
      
      const key = keys[index];
      for (const value of values[index]) {
        current[key] = value;
        generateRecursive(current, index + 1);
      }
    }
    
    generateRecursive({}, 0);
    return combinations;
  }

  /**
   * Process combinations for database storage
   */
  static processCombinations(
    combinations: CombinationInput[],
    productName: string
  ): ProcessedCombination[] {
    return combinations.map((combo, index) => {
      // Generate SKU from combination values
      const skuParts = Object.values(combo.values).map(v => 
        v.toString().substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')
      );
      const baseSku = productName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const sku = `${baseSku}-${skuParts.join('-')}-${String(index).padStart(2, '0')}`;
      
      return {
        value: Object.values(combo.values).join(" "), // "Black Small"
        sku,
        price: combo.price,
        salePrice: combo.salePrice,
        quantity: combo.quantity,
        isDefault: index === 0,
        dimensions: combo.values
      };
    });
  }

  /**
   * Find available options for cascading dropdowns
   */
  static getAvailableOptions(
    combinations: ProcessedCombination[],
    selectedDimensions: Record<string, string> = {}
  ): Record<string, string[]> {
    const availableOptions: Record<string, string[]> = {};
    
    // Filter combinations based on selected dimensions
    const filteredCombinations = combinations.filter(combo => {
      return Object.entries(selectedDimensions).every(([key, value]) => 
        combo.dimensions[key] === value
      );
    });
    
    // Extract available options for each dimension
    filteredCombinations.forEach(combo => {
      Object.entries(combo.dimensions).forEach(([key, value]) => {
        if (!availableOptions[key]) {
          availableOptions[key] = [];
        }
        if (!availableOptions[key].includes(value)) {
          availableOptions[key].push(value);
        }
      });
    });
    
    return availableOptions;
  }

  /**
   * Find combination by dimension values
   */
  static findCombination(
    combinations: ProcessedCombination[],
    selectedDimensions: Record<string, string>
  ): ProcessedCombination | null {
    return combinations.find(combo => {
      return Object.entries(selectedDimensions).every(([key, value]) => 
        combo.dimensions[key] === value
      );
    }) || null;
  }

  /**
   * Validate combination limits
   */
  static validateCombinations(
    combinations: CombinationInput[],
    variantDimensions: string[]
  ): { valid: boolean; error?: string } {
    if (variantDimensions.length > 3) {
      return {
        valid: false,
        error: "Maximum 3 variant dimensions allowed"
      };
    }
    
    if (combinations.length > 100) {
      return {
        valid: false,
        error: "Maximum 100 combinations allowed"
      };
    }
    
    if (combinations.length === 0) {
      return {
        valid: false,
        error: "At least one combination is required"
      };
    }
    
    // Check for duplicate combinations
    const seen = new Set();
    for (const combo of combinations) {
      const key = JSON.stringify(combo.values);
      if (seen.has(key)) {
        return {
          valid: false,
          error: `Duplicate combination found: ${Object.values(combo.values).join(" ")}`
        };
      }
      seen.add(key);
    }
    
    return { valid: true };
  }
}