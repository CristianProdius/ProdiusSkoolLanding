"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { BiMinus, BiPlus } from "react-icons/bi";

import SectionTitle from "./SectionTitle";
import { faqs } from "@/data/faq";

const FAQ: React.FC = () => {
  return (
    <section id="faq" className="py-10 lg:py-20">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Column - Title & Contact Info */}
        <div>
          <p className="hidden lg:block text-foreground-accent uppercase tracking-widest">
            ÎNTREBĂRI
          </p>
          <SectionTitle>
            <h2 className="my-3 !leading-snug lg:max-w-sm text-center lg:text-left">
              Întrebări frecvente
            </h2>
          </SectionTitle>
          <p className="lg:mt-10 text-foreground-accent text-center lg:text-left">
            Ai alte întrebări?
          </p>
          {/* Update the email as desired */}
          <a
            href="mailto:contact@prodiusskool"
            className="mt-3 block text-xl lg:text-3xl text-secondary font-semibold hover:underline text-center lg:text-left"
          >
            contact@prodiusskool
          </a>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:max-w-2xl mx-auto border-b border-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-7">
              <Disclosure>
                {({ open }) => (
                  <>
                    <DisclosureButton
                      className="flex items-center justify-between w-full
                                 px-4 py-5 text-left bg-white
                                 rounded-md shadow-sm
                                 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg md:text-xl font-semibold">
                        {faq.question}
                      </span>
                      {open ? (
                        <BiMinus className="w-5 h-5 text-secondary" />
                      ) : (
                        <BiPlus className="w-5 h-5 text-secondary" />
                      )}
                    </DisclosureButton>

                    <DisclosurePanel
                      className="px-4 pt-3 pb-4 text-foreground-accent
                                 bg-white rounded-b-md shadow-sm
                                 border-l border-r border-b border-gray-200"
                    >
                      {faq.answer}
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
