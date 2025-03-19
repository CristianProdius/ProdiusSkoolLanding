"use client";

import Link from "next/link";
import React from "react";

import { siteDetails } from "@/data/siteDetails";
import { footerDetails } from "@/data/footer";
import { getPlatformIconByName } from "@/utils";
import Image from "next/image";

const Footer: React.FC = () => {
  return (
    <footer className="bg-hero-background text-foreground py-10">
      <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left Column: Logo & Subheading */}
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image
              className="min-w-fit w-5 h-5 md:w-16 md:h-16"
              src="/logo.svg"
              width={24}
              height={20}
              alt={""}
            />
            <h3 className="manrope text-xl font-semibold cursor-pointer">
              {siteDetails.siteName}
            </h3>
          </Link>
          <p className="mt-3.5 text-foreground-accent">
            {footerDetails.subheading}
          </p>
        </div>

        {/* Middle Column: Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Link-uri rapide</h4>
          <ul className="text-foreground-accent">
            {footerDetails.quickLinks.map((link) => (
              <li key={link.text} className="mb-2">
                <Link href={link.url} className="hover:text-foreground">
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Contact Info & Socials */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contactează-ne</h4>

          {footerDetails.email && (
            <a
              href={`mailto:${footerDetails.email}`}
              className="block text-foreground-accent hover:text-foreground"
            >
              Email: {footerDetails.email}
            </a>
          )}

          {footerDetails.telephone && (
            <a
              href={`tel:${footerDetails.telephone}`}
              className="block text-foreground-accent hover:text-foreground mt-2"
            >
              Telefon: {footerDetails.telephone}
            </a>
          )}

          {footerDetails.socials && (
            <div className="mt-5 flex items-center gap-5 flex-wrap">
              {Object.keys(footerDetails.socials).map((platformName) => {
                if (
                  platformName &&
                  footerDetails.socials[
                    platformName as keyof typeof footerDetails.socials
                  ]
                ) {
                  return (
                    <Link
                      href={
                        footerDetails.socials[
                          platformName as keyof typeof footerDetails.socials
                        ]!
                      }
                      key={platformName}
                      aria-label={platformName}
                    >
                      {getPlatformIconByName(platformName)}
                    </Link>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-8 md:text-center text-foreground-accent px-6">
        <p>
          &copy; {new Date().getFullYear()} {siteDetails.siteName}. Toate
          drepturile rezervate.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
