"use client";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";
import { motion, AnimatePresence } from "framer-motion";

export default function Stepper() {
  const { step, totalSteps, mobileTotalSteps } = useProductListing();
  const { isMobileOrTablet } = useResponsive();
  // Update to use 7 steps for mobile to account for the new variants step
  const updatedMobileTotalSteps = 7;
  const steps = isMobileOrTablet ? Array.from({ length: updatedMobileTotalSteps }, (_, i) => `Step ${i + 1}`) : Array.from({ length: totalSteps }, (_, i) => `Step ${i + 1}`);

  return (
    <div className="flex items-center justify-between gap-x-2 relative">
      {steps.map((label, index) => {
        const isActive = index + 1 === step;
        const isCompleted = index + 1 < step;

        return (
          <div
            key={label}
            className="flex-1 flex flex-col items-center relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  isActive
                    ? "active" + index
                    : isCompleted
                    ? "done" + index
                    : "idle" + index
                }
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`h-2 flex items-center justify-center rounded-full
                ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-500 text-white"
                    : "bg-gray-400 text-black"
                } ${isActive ? "w-10" : "w-8"}`}
              >
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
