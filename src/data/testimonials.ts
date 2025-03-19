// /data/testimonials.ts
import { ITestimonial } from "@/types";
import { siteDetails } from "./siteDetails";

export const testimonials: ITestimonial[] = [
  {
    name: "Andreea Popescu",
    role: "Elevă la Liceul Național",
    message: `Datorită platformei ${siteDetails.siteName}, am învățat să lucrez eficient și să-mi organizez mai bine timpul de studiu. Am obținut o notă excelentă la examenul național la Matematică!`,
    avatar: "/images/testimonial-1.webp",
  },
  {
    name: "Mihai Ionescu",
    role: "Absolvent curs Bac Română",
    message: `Am trecut de anxietatea examenului cu ajutorul sesiunilor de pregătire oferite de ${siteDetails.siteName}. Lecțiile video și testele practice m-au ajutat să înțeleg materia mai ușor.`,
    avatar: "/images/testimonial-2.webp",
  },
  {
    name: "Oana Maria",
    role: "Mamă mulțumită",
    message: `Fiica mea a reușit să-și îmbunătățească notele într-un timp scurt. Profesionalismul și suportul oferite de echipa ${siteDetails.siteName} au făcut toată diferența!`,
    avatar: "/images/testimonial-3.webp",
  },
];
