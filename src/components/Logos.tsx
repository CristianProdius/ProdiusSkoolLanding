"use client";

import Image from "next/image";
import React from "react";

const Logos: React.FC = () => {
  return (
    <section id="logos" className="py-32 px-5 bg-background">
      {/* Updated localized text */}
      <p className="text-lg font-medium text-center">
        Peste <span className="text-secondary">2.000</span> de elevi ne-au ales
        deja. Si stii unde sunt ei acum? La aceste facultati:
      </p>

      {/* Demo logos section */}
      <div className="mt-5 w-full flex flex-wrap flex-row items-center justify-evenly gap-5 sm:gap-10 opacity-45 logos-container">
        {/* Minerva University */}
        <div className="w-12 sm:w-16 md:w-20 lg:w-24">
          <Image
            src="/universtiy/minerva.svg"
            alt="Minerva University"
            layout="responsive"
            width={48}
            height={30}
          />
        </div>

        {/* Babes University */}
        <div className="w-12 sm:w-16 md:w-20 lg:w-24">
          <Image
            src="/universtiy/babes.svg"
            alt="Babes University"
            layout="responsive"
            width={48}
            height={30}
          />
        </div>

        {/* Bucuresti University */}
        <div className="w-12 sm:w-16 md:w-20 lg:w-24">
          <Image
            src="/universtiy/bucuresti.svg"
            alt="Bucuresti University"
            layout="responsive"
            width={48}
            height={30}
          />
        </div>

        {/* utm University */}
        <div className="w-12 sm:w-16 md:w-20 lg:w-24">
          <Image
            src="/universtiy/utm.png"
            alt="utm University"
            layout="responsive"
            width={48}
            height={30}
          />
        </div>

        {/* Babes University */}
        <div className="w-12 sm:w-16 md:w-20 lg:w-24">
          <Image
            src="/universtiy/babes.svg"
            alt="Babes University"
            layout="responsive"
            width={48}
            height={30}
          />
        </div>
      </div>
    </section>
  );
};

export default Logos;
