import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) Create each subject with fields:
  //    - name
  //    - nrCursuri (nr de cursuri)
  //    - nrLectii (numarul de lectii)
  //    - maxCapacity (limita elevi)

  const engleza = await prisma.subject.create({
    data: {
      name: "Engleza",
      nrCursuri: 1,
      nrLectii: 20,
      maxCapacity: 12,
    },
  });

  const istoriaNationala = await prisma.subject.create({
    data: {
      name: "Istoria națională",
      nrCursuri: 1,
      nrLectii: 20,
      maxCapacity: 15,
    },
  });

  const romana = await prisma.subject.create({
    data: {
      name: "Limba şi Literatura Română",
      nrCursuri: 1,
      nrLectii: 25,
      maxCapacity: 15,
    },
  });

  const geografie = await prisma.subject.create({
    data: {
      name: "Geografie",
      nrCursuri: 1, // or 26 if you interpret "Nr. de cursuri: 26"
      nrLectii: 26,
      maxCapacity: 15,
    },
  });

  const informatica = await prisma.subject.create({
    data: {
      name: "Informatica - limbajul C++",
      nrCursuri: 1,
      nrLectii: 20,
      maxCapacity: 12,
    },
  });

  const biologia = await prisma.subject.create({
    data: {
      name: "Biologia",
      nrCursuri: 1,
      nrLectii: 23,
      maxCapacity: 15,
    },
  });

  // For Matematica, we have 4 sub-profiles or possibly the same subject with
  // multiple teachers. We'll treat it as one subject with 4 different teachers
  // if that's your approach.
  const matematica = await prisma.subject.create({
    data: {
      name: "Matematica",
      nrCursuri: 4,
      nrLectii: 20,
      maxCapacity: 10,
    },
  });

  // Additional courses (AI, Cambridge):
  const aiPython = await prisma.subject.create({
    data: {
      name: "AI - bazele Machine Learning în Python",
      nrCursuri: 1,
      nrLectii: 25,
      maxCapacity: 10,
    },
  });

  const cambridge = await prisma.subject.create({
    data: {
      name: "Curs Cambridge",
      nrCursuri: 1,
      nrLectii: 25,
      maxCapacity: 12,
    },
  });

  // 2) Create teachers referencing each subject

  // "Engleza" teacher
  await prisma.teacher.create({
    data: {
      name: "Gabriela Cucereavîi",
      email: "gabiiii2018.md@gmail.com",
      subjectId: engleza.id,
    },
  });

  // "Istoria națională" teachers
  await prisma.teacher.createMany({
    data: [
      {
        name: "Daniela Voicu",
        email: "voicudaniela16@yahoo.com",
        subjectId: istoriaNationala.id,
      },
      {
        name: "Adriana Mocan",
        email: "mocanadriana1@gmail.com",
        subjectId: istoriaNationala.id,
      },
    ],
  });

  // "Limba şi Literatura Română" teachers
  await prisma.teacher.createMany({
    data: [
      {
        name: "Denisa Cazan",
        email: "biancadenisac03@yahoo.com",
        subjectId: romana.id,
      },
      {
        name: "Gurban Diana",
        email: "diana_gurban@yahoo.com",
        subjectId: romana.id,
      },
    ],
  });

  // "Geografie"
  await prisma.teacher.create({
    data: {
      name: "Constantin Bogdan Mircea",
      email: "bogdanbcm99@yahoo.ro",
      subjectId: geografie.id,
    },
  });

  // "Informatica - limbajul C++"
  await prisma.teacher.create({
    data: {
      name: "Ana Maria Stegărescu",
      // no email given in snippet? We'll guess:
      email: "ana.stegarescu@example.com",
      subjectId: informatica.id,
    },
  });

  // "Biologia"
  await prisma.teacher.create({
    data: {
      name: "Irina Vleju",
      email: "i.vleju@yahoo.com",
      subjectId: biologia.id,
    },
  });

  // "Matematica" teachers
  await prisma.teacher.createMany({
    data: [
      {
        name: "Tihon Aurelian-Mihai",
        email: "aurelian-mihai.tihon@isa.utm.md",
        subjectId: matematica.id,
      },
      {
        name: "Gavril Lucian-Andrian",
        email: "lucianadrian10@gmail.com",
        subjectId: matematica.id,
      },
      // If you want more teachers for the 4 profiles, add them here
    ],
  });
  // The snippet mentions "Profilele" for Matematica, but that might just be info.

  // "AI - bazele Machine Learning în Python"
  await prisma.teacher.create({
    data: {
      name: "Ana Maria Stegărescu",
      email: "ana.stegarescu+ai@example.com",
      subjectId: aiPython.id,
    },
  });

  // "Curs Cambridge"
  await prisma.teacher.create({
    data: {
      name: "Denisa Cazan",
      email: "biancadenisac03@yahoo.com", // same teacher as for Romana?
      subjectId: cambridge.id,
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
