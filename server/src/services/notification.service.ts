import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/errors.js";
import type { NotificationType } from "@prisma/client";

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export async function listNotifications(
  userId: string,
  options?: { read?: boolean; type?: string; limit?: number }
): Promise<NotificationView[]> {
  const where: {
    userId: string;
    read?: boolean;
    type?: NotificationType;
  } = { userId };

  if (options?.read !== undefined) {
    where.read = options.read;
  }
  if (options?.type) {
    where.type = options.type as NotificationType;
  }

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });

  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt?.toISOString() ?? null,
  }));
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<NotificationView> {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    throw new AppError(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });

  return {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    body: updated.body,
    read: updated.read,
    createdAt: updated.createdAt.toISOString(),
    readAt: updated.readAt?.toISOString() ?? null,
  };
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });
  return result.count;
}
