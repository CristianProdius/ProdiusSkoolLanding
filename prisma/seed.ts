import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) Create subjects
  const math = await prisma.subject.create({
    data: { name: "Matematică" },
  });

  const romanian = await prisma.subject.create({
    data: { name: "Română" },
  });

  // 2) Create teachers referencing subjectId
  await prisma.teacher.createMany({
    data: [
      {
        name: "Prof. Popescu",
        email: "popescu@example.com",
        subjectId: math.id,
      },
      {
        name: "Prof. Ionescu",
        email: "ionescu@example.com",
        subjectId: math.id,
      },
      {
        name: "Prof. Matei",
        email: "matei@example.com",
        subjectId: romanian.id,
      },
      {
        name: "Prof. Radulescu",
        email: "radulescu@example.com",
        subjectId: romanian.id,
      },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
