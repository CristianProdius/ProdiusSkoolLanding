"use client";
import Image from "next/image";
import Link from "next/link"; // <--- Make sure to import Link if you use Next.js
import clsx from "clsx";
import { motion, Variants } from "framer-motion";

import BenefitBullet from "./BenefitBullet";
import SectionTitle from "../SectionTitle";
import { IBenefit } from "@/types";

interface Props {
  benefit: IBenefit;
  imageAtRight?: boolean;
}

/* Container-level animation for the entire benefit section */
const containerVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 100,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 0.9,
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

/* Child-level animation for individual items */
export const childVariants = {
  offscreen: {
    opacity: 0,
    x: -50,
  },
  onscreen: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 1,
    },
  },
};

const BenefitSection: React.FC<Props> = ({ benefit, imageAtRight }: Props) => {
  const { title, description, imageSrc, bullets } = benefit;

  return (
    <section className="benefit-section relative">
      <motion.div
        className="flex flex-col-reverse lg:flex-row lg:flex-nowrap 
                   items-center justify-center gap-10 md:gap-20 mb-24"
        variants={containerVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true }}
      >
        {/* Text / Bullet Points */}
        <div
          className={clsx(
            "w-full max-w-lg flex flex-col",
            imageAtRight ? "lg:order-1" : "lg:order-2"
          )}
        >
          <motion.div className="flex flex-col w-full" variants={childVariants}>
            <SectionTitle>
              <h3 className="lg:max-w-2xl leading-tight font-semibold text-2xl sm:text-3xl">
                {title}
              </h3>
            </SectionTitle>
            <p className="mt-2 text-base sm:text-lg leading-normal text-foreground-accent">
              {description}
            </p>
          </motion.div>

          {/* Bullet Items */}
          <div className="mt-4">
            {bullets.map((item, index) => (
              <BenefitBullet
                key={index}
                title={item.title}
                icon={item.icon}
                description={item.description}
              />
            ))}
          </div>

          {/* CTA to Book a Trial Class */}
          <motion.div variants={childVariants} className="mt-8 md:mt-6">
            <Link
              href="/programeaza-lectia-demo"
              className="inline-block rounded-full bg-primary text-black 
                         px-6 py-3 text-sm sm:text-base font-semibold 
                         hover:bg-primary-accent transition-colors"
            >
              Programează lecția gratuită
            </Link>
          </motion.div>
        </div>

        {/* Image Section */}
        <div
          className={clsx(
            "relative w-fit",
            imageAtRight ? "lg:order-2" : "lg:order-1"
          )}
        >
          <Image
            src={imageSrc}
            alt={title}
            width={384}
            height={762}
            quality={100}
            className="mx-auto lg:mx-0"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default BenefitSection;
