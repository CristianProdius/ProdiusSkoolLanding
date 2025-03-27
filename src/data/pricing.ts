// data/courses.ts
import { ICourse } from "@/types";

export const courses: ICourse[] = [
  {
    name: "Engleza",
    price: 1800,
    nrCursuri: 1,
    nrLectii: 20,
    maxCapacity: 15,
    features: [
      "1 lecție = 1 oră de studiu",
      "Teste intermediare",
      "Accent pe conversație și vocabular",
    ],
  },
  {
    name: "Istoria națională",
    price: 1800,
    nrCursuri: 1,
    nrLectii: 20,
    maxCapacity: 15,
    features: [
      "1 lecție = 1 oră de studiu",
      "Focalizare pe evenimentele-cheie ale istoriei naționale",
      "Exerciții și dezbateri tematice",
    ],
  },
  {
    name: "Limba şi Literatura Română",
    price: 1800,
    nrCursuri: 1,
    nrLectii: 25,
    maxCapacity: 15,
    features: [
      "1 lecție = 1 oră de studiu",
      "Analize literare și eseuri",
      "Focus pe gramatică și stil",
    ],
  },
  {
    name: "Geografie",
    price: 1800,
    nrCursuri: 1,
    nrLectii: 26,
    maxCapacity: 15,
    features: [
      "1 lecție = 1 oră de studiu",
      "Hărți și studii de caz",
      "Aplicații practice despre regiuni",
    ],
  },
  {
    name: "Informatica - limbajul C++",
    price: 2000,
    nrCursuri: 1,
    nrLectii: 20,
    maxCapacity: 12,
    features: [
      "1 lecție = 1 oră de studiu",
      "Exerciții de programare în C++",
      "Proiecte practice la fiecare modul",
    ],
  },
  {
    name: "Biologia",
    price: 1800,
    nrCursuri: 1,
    nrLectii: 23,
    maxCapacity: 15,
    features: [
      "1 lecție = 1 oră de studiu",
      "Exemple și experimente practice",
      "Teste periodice și recapitulări",
    ],
  },
  {
    name: "Matematica",
    price: 2000,
    nrCursuri: 4,
    nrLectii: 20,
    maxCapacity: 12,
    features: [
      "1 lecție = 1 oră de studiu",
      "4 sub-cursuri (profil real, etc.)",
      "Probleme și exerciții practice",
    ],
  },
  {
    name: "AI - bazele Machine Learning în Python",
    price: 4000,
    nrCursuri: 1,
    nrLectii: 25,
    maxCapacity: 10,
    features: [
      "Fiecare lecție durează ~2 ore",
      "Proiect de final pentru evaluare",
      "Studii de caz Machine Learning",
    ],
  },
  {
    name: "Curs Cambridge",
    price: 2000,
    nrCursuri: 1,
    nrLectii: 25,
    maxCapacity: 12,
    features: [
      "1 lecție = 1 oră de studiu",
      "Simulări examen Cambridge",
      "Feedback individualizat",
    ],
  },
];
