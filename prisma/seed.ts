import { PrismaClient } from "../server/node_modules/.prisma/client/index.js";
import argon2 from "argon2";

const prisma = new PrismaClient();

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function seedRoles() {
  await prisma.role.createMany({
    data: [{ name: "ADMIN" }, { name: "USER" }],
    skipDuplicates: true,
  });
}

async function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Site Admin";
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim() || null;

  if (!email || !password) {
    console.info(
      "Bootstrap admin skipped (set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env to create one)"
    );
    return;
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  const userRole = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!adminRole || !userRole) {
    throw new Error("ADMIN/USER roles missing after seed");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  });

  if (existing) {
    const hasAdmin = existing.userRoles.some((ur) => ur.role.name === "ADMIN");
    if (!hasAdmin) {
      await prisma.userRole.create({
        data: { userId: existing.id, roleId: adminRole.id },
      });
    }
    await prisma.profile.update({
      where: { userId: existing.id },
      data: { isApproved: true, status: "ACTIVE" },
    });
    await prisma.user.update({
      where: { id: existing.id },
      data: { emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
    });
    console.info(`Bootstrap admin updated: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          fullName,
          phone,
          isApproved: true,
          status: "ACTIVE",
        },
      },
      userRoles: {
        create: [{ roleId: adminRole.id }, { roleId: userRole.id }],
      },
    },
  });

  console.info(`Bootstrap admin created: ${email}`);
  console.info("Sign in at /auth/login — you will land on /admin");
}

async function main() {
  await seedRoles();
  await bootstrapAdmin();
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
