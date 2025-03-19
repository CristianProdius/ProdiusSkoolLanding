// /data/footer.ts
import { IMenuItem, ISocials } from "@/types";

export const footerDetails: {
  subheading: string;
  quickLinks: IMenuItem[];
  email: string;
  telephone: string;
  socials: ISocials;
} = {
  subheading:
    "Ajutăm elevii să se pregătească pentru examenele naționale prin soluții online interactive.",
  quickLinks: [
    {
      text: "Caracteristici",
      url: "#features",
    },
    {
      text: "Prețuri",
      url: "#pricing",
    },
    {
      text: "Testimoniale",
      url: "#testimonials",
    },
  ],
  email: "contact@prodiusskool",
  telephone: "+40 123 456 789", // Example Romanian format
  socials: {
    // Add or remove platforms as desired
    twitter: "https://twitter.com/Twitter",
    facebook: "https://facebook.com",
    linkedin: "https://www.linkedin.com",
    instagram: "https://www.instagram.com",
  },
};
