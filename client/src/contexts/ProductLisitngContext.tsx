"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type AttributeOption = string;

type Attribute = {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: AttributeOption[];
};

type ProductListingContextType = {
  step: number;
  setStep: (step: number) => void;
  totalSteps: number;
  mobileTotalSteps: number;
  attributes: Attribute[];
  setAttributes: (attributes: Attribute[]) => void;
  currentAttributePage: number;
  setCurrentAttributePage: (page: number) => void;
  totalAttributePages: number;
  productDetails: Record<string, any>;
  updateProductDetails: (key: string, value: any) => void;
  setProductDetails: (details: Record<string, any>) => void;
  draftId: string;
  setDraftId: (draft: string) => void;
};

const ProductListingContext = createContext<ProductListingContextType | undefined>(undefined);

export const ProductListingProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState(1);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [ draftId, setDraftId ] = useState("")
  const [currentAttributePage, setCurrentAttributePage] = useState(1);
  const [totalAttributePages, setTotalAttributePages] = useState(1);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});

  // Calculate total steps based on attributes
  const totalSteps = 3;
  const mobileTotalSteps = 7; // Updated to include variants step

  // Calculate attribute pages based on screen size and attributes
  useEffect(() => {
    if (attributes.length === 0) return;
    
    const calculatePages = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      const attributesPerPage = isMobile  ? 7 : isTablet ? 16 : 16;
      const pages = Math.ceil((attributes.length + 2) / attributesPerPage);
      
      setTotalAttributePages(pages);
    };

    calculatePages();
    window.addEventListener('resize', calculatePages);
    
    return () => window.removeEventListener('resize', calculatePages);
  }, [attributes]);

  const updateProductDetails = (key: string, value: any) => {
    setProductDetails(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ProductListingContext.Provider 
      value={{ 
        step, 
        setStep, 
        totalSteps, 
        mobileTotalSteps,
        attributes, 
        setAttributes,
        currentAttributePage,
        setCurrentAttributePage,
        totalAttributePages,
        productDetails,
        setProductDetails,
        updateProductDetails,
        draftId,
        setDraftId,
      }}
    >
      {children}
    </ProductListingContext.Provider>
  );
};

export const useProductListing = () => {
  const context = useContext(ProductListingContext);
  if (!context) {
    throw new Error("useProductListing must be used within ProductListingProvider");
  }
  return context;
};
