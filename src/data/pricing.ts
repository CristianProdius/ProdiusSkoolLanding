// /data/pricing.ts
import { IPricing } from "@/types";

export const tiers: IPricing[] = [
  {
    name: "Pachet Start",
    price: 300, // RON
    features: [
      "10 lecții interactive",
      "Acces la materiale PDF și video",
      "Teste practice săptămânale",
      "Suport prin e-mail",
    ],
  },
  {
    // The highlighted tier with 20 lectures @ 500 RON
    name: "Pachet Plus",
    price: 500, // RON
    features: [
      "20 lecții interactive (live sau înregistrate)",
      "Acces la fișe de lucru avansate și simulări de examen",
      "Rapoarte de progres personalizate",
      "Asistență prioritară prin e-mail și chat",
    ],
  },
  {
    name: "Pachet Premium",
    price: 700, // RON
    features: [
      "30 lecții interactive + sesiuni Q&A individuale",
      "Toate materialele și testele practice disponibile non-stop",
      "Mentorat 1-la-1 cu profesori specializați",
      "Suport dedicat prin e-mail, chat și telefon",
      "Revizuiri și recomandări personalizate suplimentare",
    ],
  },
];
