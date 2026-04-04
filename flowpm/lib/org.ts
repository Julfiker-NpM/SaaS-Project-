import { prisma } from "@/lib/prisma";

export async function getMembershipForUser(userId: string) {
  return prisma.orgMember.findFirst({
    where: { userId },
    include: { org: true },
    orderBy: { joinedAt: "asc" },
  });
}
