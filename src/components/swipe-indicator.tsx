"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeIndicatorProps {
  direction: "left" | "right";
  show: boolean;
}

export default function SwipeIndicator({
  direction,
  show,
}: SwipeIndicatorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`fixed top-1/2 transform -translate-y-1/2 z-50 ${
            direction === "left" ? "left-4" : "right-4"
          }`}
        >
          <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg">
            {direction === "left" ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
