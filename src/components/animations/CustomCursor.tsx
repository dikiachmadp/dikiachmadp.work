"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isHovering, setIsHovering] = useState(false);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  const dotX = useSpring(cursorX, {
    damping: 35,
    stiffness: 500,
  });

  const dotY = useSpring(cursorY, {
    damping: 35,
    stiffness: 500,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX - 12);
      cursorY.set(e.clientY - 12);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a") ||
        target.closest("button") ||
        target.tagName === "A" ||
        target.tagName === "BUTTON"
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 z-9999 pointer-events-none mix-blend-difference"
        style={{ x: springX, y: springY }}
        animate={{ scale: isHovering ? 2 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-white opacity-80" />
      </motion.div>

      <motion.div
        className="fixed top-0 left-0 z-9999 pointer-events-none mix-blend-difference"
        style={{
          x: dotX,
          y: dotY,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white translate-x-3 translate-y-3" />
      </motion.div>
    </>
  );
}
