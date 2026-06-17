import { PrismaClient, AppRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [{ name: AppRole.ADMIN }, { name: AppRole.USER }],
    skipDuplicates: true,
  });

  console.info("Seed complete: roles ADMIN and USER");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
