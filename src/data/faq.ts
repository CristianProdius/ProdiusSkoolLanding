// /data/faq.ts
import { IFAQ } from "@/types";
import { siteDetails } from "./siteDetails";

export const faqs: IFAQ[] = [
  {
    question: "Cum mă înscriu la o lecție gratuită?",
    answer:
      "Este foarte simplu! Apasă pe butonul “Programează lecția gratuită” de pe site și completează formularul. Vei primi un e-mail cu toate detaliile necesare.",
  },
  {
    question: "Lecțiile sunt live sau înregistrate?",
    answer:
      "Oferim atât lecții live cu profesor, cât și înregistrări. Dacă nu poți participa la sesiunea live, vei avea acces la materialele video oricând dorești.",
  },
  {
    question: `Care este costul unui curs complet la ${siteDetails.siteName}?`,
    answer:
      "Un curs standard (20 de lecții) costă 500 RON. Pachetul include acces la platforma noastră, materiale de studiu, teste și suport din partea profesorilor.",
  },
  {
    question: "Pot recupera lecțiile pierdute?",
    answer:
      "Da! Toate lecțiile sunt înregistrate și disponibile pe platformă. Astfel, poți revedea conținutul oricând, fără să pierzi nimic din program.",
  },
  {
    question: "Cum pot primi ajutor suplimentar dacă nu înțeleg ceva?",
    answer:
      "Ne poți scrie în orice moment pe chat-ul platformei sau pe e-mail. Echipa noastră de suport și profesorii sunt gata să te ajute cu explicații suplimentare și îndrumări.",
  },
];
