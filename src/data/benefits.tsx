import {
  FiBookOpen,
  FiCheckSquare,
  FiBarChart2,
  FiPlayCircle,
  FiEdit,
  FiUsers,
  FiLifeBuoy,
  FiMessageSquare,
  FiUserCheck,
} from "react-icons/fi";

import { IBenefit } from "@/types";

export const benefits: IBenefit[] = [
  {
    title: "Tehnici de învățare rapide și eficiente",
    description:
      "Maximizează-ți potențialul cu metode verificate științific. Ne concentrăm pe lacunele tale, astfel încât să devii mai bun(ă) într-un timp record!",
    bullets: [
      {
        title: "Plan de studiu personalizat",
        description:
          "Creăm un program de învățare care se adaptează nevoilor și obiectivelor tale.",
        icon: <FiBookOpen size={26} />,
      },
      {
        title: "Testare la cerere",
        description:
          "Evaluează-ți cunoștințele oricând pentru a-ți urmări progresul în timp real.",
        icon: <FiCheckSquare size={26} />,
      },
      {
        title: "Feedback și rapoarte detaliate",
        description:
          "Obține analize clare și obiective, astfel încât să știi exact unde să te concentrezi.",
        icon: <FiBarChart2 size={26} />,
      },
    ],
    imageSrc: "/images/benefit-1.svg",
  },
  {
    title: "Platformă interactivă și resurse multimedia",
    description:
      "Acces instant la lecții video, fișe de lucru, quiz-uri și simulări de examen, toate într-un singur loc. Programează-ți lecția gratuită și începe să înveți eficient!",
    bullets: [
      {
        title: "Lecții video clare",
        description:
          "Explicații pas cu pas, ușor de urmărit și revizuit oricând ai nevoie.",
        icon: <FiPlayCircle size={26} />,
      },
      {
        title: "Simulări de examen",
        description:
          "Exersează în condiții similare cu cele reale pentru a-ți reduce emoțiile din ziua testării.",
        icon: <FiEdit size={26} />,
      },
      {
        title: "Sesiuni Q&A live",
        description:
          "Intră în legătură cu profesori și colegi, adresează întrebări și primește răspunsuri rapide.",
        icon: <FiUsers size={26} />,
      },
    ],
    imageSrc: "/images/benefit-2.svg",
  },
  {
    title: "Suport dedicat și consiliere permanentă",
    description:
      "Nu ești niciodată singur(ă) în călătoria ta. Echipa noastră de mentori îți oferă îndrumare pas cu pas, de la înscriere până la examen.",
    bullets: [
      {
        title: "Comunitate activă",
        description:
          "Alătură-te unui grup de elevi motivați și schimbă idei într-un mediu de sprijin reciproc.",
        icon: <FiMessageSquare size={26} />,
      },
      {
        title: "Asistență 24/7",
        description:
          "Ai întrebări târziu în noapte? Suntem aici să te ajutăm, indiferent de oră!",
        icon: <FiLifeBuoy size={26} />,
      },
      {
        title: "Recomandări personalizate",
        description:
          "Sfaturi punctuale și resurse adaptate la nivelul tău, pentru a te ajuta să progresezi mai rapid.",
        icon: <FiUserCheck size={26} />,
      },
    ],
    imageSrc: "/images/benefit-3.svg",
  },
];
