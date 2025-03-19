"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Transition } from "@headlessui/react";
import { HiOutlineXMark, HiBars3 } from "react-icons/hi2";

import Container from "./Container";
import { siteDetails } from "@/data/siteDetails";
import { menuItems } from "@/data/menuItems";
import Image from "next/image";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <Container className="!px-0">
        {/* 
                    For a premium, translucent effect, 
                    we apply bg-white/80, backdrop-blur-sm, 
                    and shadow-md on desktop screens.
                */}
        <nav
          className="mx-auto flex items-center justify-between 
                                py-2 px-5 bg-white shadow-md
                                md:shadow-none md:bg-white/0 md:backdrop-blur-sm 
                                md:py-10 transition-colors"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              className="text-foreground min-w-fit w-10 h-12 object-contain"
              src="/logo.svg"
              alt="logo"
              width={64}
              height={64}
            />
            <span className="manrope text-xl font-semibold text-foreground cursor-pointer flex items-center">
              {siteDetails.siteName}
            </span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.url}
                  className="text-foreground hover:text-foreground-accent transition-colors"
                >
                  {item.text}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/programeaza-lectia-demo"
                className="text-black bg-primary hover:bg-primary-accent 
                                           px-8 py-3 rounded-full transition-colors"
              >
                Programează lecția demo
              </Link>
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-primary text-black focus:outline-none rounded-full 
                                       w-10 h-10 flex items-center justify-center"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <HiOutlineXMark className="h-6 w-6" aria-hidden="true" />
              ) : (
                <HiBars3 className="h-6 w-6" aria-hidden="true" />
              )}
              <span className="sr-only">Deschide/Închide meniul</span>
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile Menu with Transition */}
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div id="mobile-menu" className="md:hidden bg-white shadow-lg">
          <ul className="flex flex-col space-y-4 pt-1 pb-6 px-6">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.url}
                  className="text-foreground hover:text-primary block"
                  onClick={toggleMenu}
                >
                  {item.text}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/programeaza-lectia-demo"
                className="text-black bg-primary hover:bg-primary-accent 
                                           px-5 py-2 rounded-full block w-fit"
                onClick={toggleMenu}
              >
                Programează lecția demo
              </Link>
            </li>
          </ul>
        </div>
      </Transition>
    </header>
  );
};

export default Header;
