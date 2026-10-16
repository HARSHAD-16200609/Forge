import { Prisma } from "../../../generated/prisma/client"
import { Role, Status } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"
import { ApiError } from "../../utility/errorHandling/ApiError";
import { ConfilctError } from "../../utility/errorHandling/customErrors";

export const INVITE_TTL_DAYS = 7;
export const INVITE_LINK_TTL_DAYS = 30;

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

class InviteRepository {
  private inviteExpiry() {
    return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  private async addMemberToDefaultChannel(
    tx: TransactionClient,
    workspaceId: string,
    workspaceMemberId: string
  ) {
    const generalChannel = await tx.channel.findFirst({
      where: {
        workspaceId,
        isDefault: true,
      },
      select: {
        id: true,
      },
    });

    if (!generalChannel) {
      throw new ApiError(404, "Default channel not found.");
    }

    await tx.channelMember.create({
      data: {
        channelId: generalChannel.id,
        workspaceMemberId,
        isCreator: false,
      },
    });
  }

  async createWorkspaceInvite(Invite: {
    workspaceId: string;
    actorId: string;
    email: string;
    receiverId: string | null;
    token: string;
  }) {
    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: Invite.workspaceId,
        actorId: Invite.actorId,
        receiverEmail: Invite.email,
        receiverId: Invite.receiverId,
        token: Invite.token,
        expiresAt: this.inviteExpiry(),
      },
      select: {
        id: true,
        status: true,
        sentAt: true,
        actorId: true,
        receiverId: true,
        workspaceId: true,
        receiverEmail: true,
        token: true,
        expiresAt: true,
      },
    })
    return invite
  }
  async getSentInvites(actorId: string, status?: Status, pagination?: { page: number, limit: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      actorId,
      ...(status ? { status } : {}),
    };

    const [invites, total] = await Promise.all([
      prisma.workspaceInvite.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          workspace: { select: { workspaceName: true } },
        },
      }),
      prisma.workspaceInvite.count({ where }),
    ]);

    return { invites, hasMore: skip + invites.length < total, total };
  }
  async getReceivedInvites(receiverId: string, status?: Status, pagination?: { page: number, limit: number }) {

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      receiverId,
      ...(status ? { status } : {}),
    };

    const [invites, total] = await Promise.all([
      prisma.workspaceInvite.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workspaceInvite.count({ where }),
    ]);

    return { invites, hasMore: skip + invites.length < total, total };
  }

  async acceptWsInvite(receiverId: string, workspaceId: string, inviteId: string) {
    return prisma.$transaction(async (tx) => {

      const member = await tx.workspaceMember.create({
        data: {
          role: Role.MEMBER,
          workspaceId,
          userId: receiverId,
        },
      });

      await this.addMemberToDefaultChannel(tx, workspaceId, member.id);

      const invite = await tx.workspaceInvite.update({
        where: {
          id: inviteId,
        },
        data: {
          status: Status.ACCEPTED,
          acceptedAt: new Date(),
          receiverId,
        },
      });

      return invite;
    });
  }

  async getWsInvite(inviteId: string) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: {

        id: inviteId

      },
    })
    return invite
  }
  async getWsInviteByToken(token: string) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: {
        token,
      },
    })
    return invite
  }
  async rejectWsInvite(inviteId: string) {
    await prisma.workspaceInvite.update({
      where: {
        id: inviteId,
      },
      data: {
        status: Status.REJECTED,
      },

    });
  }
  async cancelWsInvite(inviteId: string) {
    await prisma.workspaceInvite.update({
      where: {
        id: inviteId,
      },
      data: {
        status: Status.REVOKED,
      },

    });
  }
  async expireWsInvite(inviteId: string) {
    await prisma.workspaceInvite.update({
      where: {
        id: inviteId,

      },
      data: {
        status: Status.EXPIRED,
      },

    });
  }

  async getWorkspaceEmailContext(workspaceId: string) {
    return prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { workspaceName: true },
    })
  }

  async getWorkspaceMemberCount(workspaceId: string) {
    return prisma.workspaceMember.count({ where: { workspaceId } })
  }

  async createChannelInvite(channelInvite: {
    actorId: string;
    channelId: string;
    receiverEmail: string;
    receiverId: string | null;
    token: string;
  }) {
    const invite = await prisma.channelInvite.create({
      data: {
        actorId: channelInvite.actorId,
        channelId: channelInvite.channelId,
        receiverEmail: channelInvite.receiverEmail,
        receiverId: channelInvite.receiverId,
        token: channelInvite.token,
        expiresAt: this.inviteExpiry(),
      },
      select: {
        id: true,
        status: true,
        sentAt: true,
        actorId: true,
        receiverId: true,
        channelId: true,
        receiverEmail: true,
        token: true,
        expiresAt: true,
      }
    })
    return invite
  }

  async getChannelEmailContext(channelId: string) {
    return prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        channelName: true,
        workspace: {
          select: { id: true, workspaceName: true },
        },
      },
    })
  }

  async getSentChannelInvites(actorId: string, status?: Status, pagination?: { page: number, limit: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      actorId,
      ...(status ? { status } : {}),
    };
    const invites = await prisma.channelInvite.findMany({
      where,
      skip,
      take: limit
    })
    return invites
  }
  async getReceivedChannelInvites(receiverId: string, status?: Status, pagination?: { page: number, limit: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      receiverId,
      ...(status ? { status } : {}),
    };
    const invites = await prisma.channelInvite.findMany({
      where,
      skip,
      take: limit

    })
    return invites
  }
  async acceptChannelInvite(workspaceMemberId: string, channelId: string, channelInviteId: string) {

    return await prisma.$transaction(async (tx) => {

      const member = await tx.channelMember.create({
        data: {
          channelId,
          workspaceMemberId
        }
      })

      await tx.channelInvite.update({
        where: {
          id: channelInviteId
        },
        data: {
          status: Status.ACCEPTED,
          acceptedAt: new Date(),
        }
      })


      return member
    })
  }

  async expireChannelInvite(inviteId: string) {
    await prisma.channelInvite.update({
      where: {
        id: inviteId,

      },
      data: {
        status: Status.EXPIRED,
      },

    });

  }

  async getChannelInvite(inviteId: string) {
    const invite = await prisma.channelInvite.findUnique({
      where: {

        id: inviteId

      },
    })
    return invite
  }

  async getChannelInviteByToken(token: string) {
    const invite = await prisma.channelInvite.findUnique({
      where: {
        token,
      },
    })
    return invite
  }

  async rejectChannelInvite(channelInviteId: string) {
    const rejectedInvite = await prisma.channelInvite.update({
      where: {
        id: channelInviteId
      },
      data: {
        status: Status.REJECTED
      }
    })
    return rejectedInvite
  }

  async cancelChannelInvite(channelInviteId: string) {
    const revokedInvite = await prisma.channelInvite.update({
      where: {
        id: channelInviteId
      },
      data: {
        status: Status.REVOKED
      }
    })
    return revokedInvite
  }

  async linkPendingInvitesByEmail(userId: string, email: string) {
    return prisma.$transaction(async (tx) => {
      const wsInvites = await tx.workspaceInvite.findMany({
        where: {
          receiverEmail: { equals: email, mode: "insensitive" },
          receiverId: null,
          status: Status.PENDING,
          expiresAt: { gt: new Date() },
        },
      });

      const channelInvites = await tx.channelInvite.findMany({
        where: {
          receiverEmail: { equals: email, mode: "insensitive" },
          receiverId: null,
          status: Status.PENDING,
          expiresAt: { gt: new Date() },
        },
      });

      if (wsInvites.length > 0) {
        await tx.workspaceInvite.updateMany({
          where: { id: { in: wsInvites.map((invite) => invite.id) } },
          data: { receiverId: userId },
        });
      }

      if (channelInvites.length > 0) {
        await tx.channelInvite.updateMany({
          where: { id: { in: channelInvites.map((invite) => invite.id) } },
          data: { receiverId: userId },
        });
      }

      return { wsInvites, channelInvites };
    });
  }

  async getActiveWorkspaceInviteLink(workspaceId: string) {
    return prisma.workspaceInviteLink.findFirst({
      where: {
        workspaceId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createWorkspaceInviteLink(input: {
    workspaceId: string;
    createdById: string;
    token: string;
    expiresAt: Date;
    maxUses?: number | null;
  }) {
    return prisma.workspaceInviteLink.create({
      data: {
        workspaceId: input.workspaceId,
        createdById: input.createdById,
        token: input.token,
        expiresAt: input.expiresAt,
        maxUses: input.maxUses ?? null,
      },
    });
  }

  async revokeActiveWorkspaceInviteLinks(workspaceId: string) {
    return prisma.workspaceInviteLink.updateMany({
      where: {
        workspaceId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeWorkspaceInviteLinkById(id: string) {
    return prisma.workspaceInviteLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async getWorkspaceInviteLinkByToken(token: string) {
    return prisma.workspaceInviteLink.findUnique({
      where: { token },
    });
  }

  async joinWorkspaceViaLink(input: {
    linkId: string;
    userId: string;
    workspaceId: string;
    maxUses: number | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
      });

      if (existingMember) {
        return { member: existingMember, alreadyMember: true };
      }

      const consumed = await tx.workspaceInviteLink.updateMany({
        where: {
          id: input.linkId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          ...(input.maxUses !== null ? { useCount: { lt: input.maxUses } } : {}),
        },
        data: {
          useCount: { increment: 1 },
        },
      });

      if (consumed.count === 0) {
        throw new ConfilctError("This invite link is no longer valid.");
      }

      const member = await tx.workspaceMember.create({
        data: {
          role: Role.MEMBER,
          workspaceId: input.workspaceId,
          userId: input.userId,
        },
      });

      await this.addMemberToDefaultChannel(tx, input.workspaceId, member.id);

      return { member, alreadyMember: false };
    });
  }
}


export const inviteRepository = new InviteRepository()
