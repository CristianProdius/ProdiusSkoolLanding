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
  email: "cristian@prodiusenterprise.com",
  telephone: "+373 68 200 722", // Example Romanian format
  socials: {
    // Add or remove platforms as desired
    twitter: "https://twitter.com/Twitter",
    facebook: "https://facebook.com",
    linkedin: "https://www.linkedin.com",
    instagram: "https://www.instagram.com",
  },
};
