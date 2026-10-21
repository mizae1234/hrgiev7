import { prisma } from "./prisma";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}) {
  try {
    const detailsString =
      typeof details === "object" && details !== null ? JSON.stringify(details) : details;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsString || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
