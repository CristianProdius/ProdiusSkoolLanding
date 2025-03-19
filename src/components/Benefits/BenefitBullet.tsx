import React from "react";
import { motion } from "framer-motion";
import { childVariants } from "./BenefitSection";
import { IBenefitBullet } from "@/types";

const BenefitBullet: React.FC<IBenefitBullet> = ({
  title,
  description,
  icon,
}) => {
  return (
    <motion.div
      className="mt-6 flex flex-col items-center gap-3 
                 lg:flex-row lg:items-start"
      variants={childVariants}
    >
      <div className="flex-shrink-0 flex justify-center mb-2 lg:mb-0">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-base text-foreground-accent">{description}</p>
      </div>
    </motion.div>
  );
};

export default BenefitBullet;
