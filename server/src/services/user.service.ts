import { prisma } from "../lib/prisma.js";
import { resolveAccessRole, getPermissions } from "../lib/access-role.js";
import { AppError } from "../utils/errors.js";
import type { AuthUser } from "../types/auth.js";

export async function buildAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userRoles: { include: { role: true } },
    },
  });

  if (!user?.profile) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const isAdmin = roles.includes("ADMIN");
  const isMember =
    isAdmin ||
    (roles.includes("USER") && user.profile.isApproved && user.profile.status === "ACTIVE");
  const accessRole = resolveAccessRole({
    roles,
    isApproved: user.profile.isApproved,
    status: user.profile.status,
  });

  return {
    id: user.id,
    email: user.email,
    roles,
    accessRole,
    permissions: [...getPermissions(accessRole)],
    emailVerified: Boolean(user.emailVerifiedAt),
    isApproved: user.profile.isApproved,
    isAdmin,
    isMember,
    status: user.profile.status,
    fullName: user.profile.fullName,
    phone: user.profile.phone,
  };
}

export async function updateProfile(
  userId: string,
  input: { fullName: string; phone?: string | null }
): Promise<AuthUser> {
  const data: { fullName: string; phone?: string | null } = {
    fullName: input.fullName,
  };

  if (input.phone !== undefined) {
    data.phone = input.phone;
  }

  await prisma.profile.update({
    where: { userId },
    data,
  });

  return buildAuthUser(userId);
}
