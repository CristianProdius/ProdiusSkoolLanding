"use client";

import React from "react";
import Image from "next/image";

interface HeroDetails {
  heading: string;
  subheading: string;
  centerImageSrc: string;
}

export const heroDetails: HeroDetails = {
  heading: "Pregătește-te pentru examenul național cu succes!",
  subheading:
    "Cursurile noastre interactive te ajută să înveți mai ușor, să-ți consolidezi cunoștințele și să fii pregătit(ă) pentru orice provocare. Rezervă-ți acum lecția gratuită!",
  centerImageSrc: "/images/hero-mockup.svg",
};

const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative flex items-center justify-center px-5 pb-0 pt-32 md:pt-40 overflow-hidden"
    >
      {/* 
        1. Subtle patterned background 
           (optional: you can keep or remove the grid effect)
      */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 h-full w-full 
                        bg-hero-background 
                        bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),
                           linear-gradient(to_bottom,#80808012_1px,transparent_1px)]
                        bg-[size:40px_40px] 
                        [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
        ></div>
      </div>

      {/*
        2. Bottom gradient overlay for depth
      */}
      <div
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-40 
                      bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.5)] to-[rgba(202,208,230,0.5)]
                      backdrop-blur-[2px]"
      ></div>

      <div className="text-center relative z-10">
        {/*
          3. Animated Headline 
             (Add "animate-fadeInUp" for the fade+up effect)
        */}
        <h1 className="animate-fadeInUp text-4xl md:text-6xl md:leading-tight font-extrabold text-foreground max-w-lg md:max-w-2xl mx-auto">
          {heroDetails.heading}
        </h1>

        {/*
          4. Animated Subheading
        */}
        <p className="animate-fadeInUp mt-4 text-foreground max-w-lg mx-auto text-lg md:text-xl">
          {heroDetails.subheading}
        </p>

        {/*
          5. CTA to book a free trial lesson 
             (Add some animation delay so it appears slightly after the text)
        */}
        <div className="animate-fadeInUp mt-8 flex justify-center">
          <a
            href="/programeaza-lectia-demo"
            className="bg-primary text-black font-semibold px-8 py-3 rounded-full 
                       hover:bg-primary-accent transition-colors"
            style={{ animationDelay: "0.15s" }}
          >
            Programează lecția gratuită
          </a>
        </div>

        {/*
          6. Center Image with float or subtle scale animation
        */}
        <Image
          src={heroDetails.centerImageSrc}
          width={384}
          height={340}
          quality={100}
          sizes="(max-width: 768px) 100vw, 384px"
          priority
          unoptimized
          alt="Prezentare curs"
          className="mx-auto mt-12 md:mt-16
                     animate-fadeInUp 
                     transition-transform duration-500
                     hover:scale-105"
          style={{ animationDelay: "0.25s" }}
        />
      </div>
    </section>
  );
};

export default Hero;
