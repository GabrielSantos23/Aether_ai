import { motion } from "framer-motion";
import React, { useRef, useState, useEffect, type ReactNode } from "react";

interface ScrollableFadeProps {
  children: ReactNode;
  className?: string;
}

export const ScrollableHorizontalFade: React.FC<ScrollableFadeProps> = ({
  children,
  className = "",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowingLeft, setIsOverflowingLeft] = useState(false);
  const [isOverflowingRight, setIsOverflowingRight] = useState(false);

  const checkOverflow = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setIsOverflowingLeft(scrollLeft > 0);
      setIsOverflowingRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkOverflow();

    container.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkOverflow);
    });
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(checkOverflow);
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      container.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(checkOverflow);
  }, [children]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollContainerRef}
        className="no-scrollbar relative flex gap-2 overflow-x-auto"
      >
        {children}
      </div>

      <motion.div
        className="fade-gradient-left"
        animate={{ opacity: isOverflowingLeft ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="fade-gradient-right"
        animate={{ opacity: isOverflowingRight ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};
