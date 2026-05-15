"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function TextReveal({
  text,
  className,
  delay = 0,
  as: Tag = "p",
}: TextRevealProps) {
  const words = text.split(" ");

  return (
    <Tag className={cn("overflow-hidden", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: "100%" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: delay + i * 0.05,
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
