import { Role, Status } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"
import { channelInviteDTO } from "../../db/channel.schema";
import { ApiError } from "../../utility/errorHandling/ApiError";


class InviteRepository {
  async createWorkspaceInvite(Invite: { workspaceId: string, actorId: string, email: string, receiverId: string }) {
    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: Invite.workspaceId,
        actorId: Invite.actorId,
        receiverEmail: Invite.email,
        receiverId: Invite.receiverId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }, select: {
        id: true,
        status: true,
        sentAt: true,
        actorId: true,
        receiverId: true,
        workspaceId: true,
        receiverEmail: true,
        expiresAt: true,
      }
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

  async acceptWsInvite(receiverId: string, workspaceId: string) {
    return prisma.$transaction(async (tx) => {

      const member = await tx.workspaceMember.create({
        data: {
          role: Role.MEMBER,
          workspaceId,
          userId: receiverId,
        },
      });

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
          workspaceMemberId: member.id,
          isCreator: false,
        },
      });

      const invite = await tx.workspaceInvite.update({
        where: {
          receiverId_workspaceId: {
            receiverId,
            workspaceId,
          }
        },
        data: {
          status: Status.ACCEPTED,
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
  async rejectWsInvite(receiverId: string, workspaceId: string) {
    await prisma.workspaceInvite.update({
      where: {
        receiverId_workspaceId: {
          receiverId,
          workspaceId,
        }
      },
      data: {
        status: Status.REJECTED,
      },

    });
  }
  async cancelWsInvite(receiverId: string, workspaceId: string) {
    await prisma.workspaceInvite.update({
      where: {
        receiverId_workspaceId: {
          receiverId,
          workspaceId,
        }
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

  async createChannelInvite(channelInvite: { actorId: string, channelId: string, receiverEmail: string, receiverId: string }) {
    const invite = await prisma.channelInvite.create({
      data: {
        actorId: channelInvite.actorId,
        channelId: channelInvite.channelId,
        receiverEmail: channelInvite.receiverEmail,
        receiverId: channelInvite.receiverId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    })
    return invite
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
          status: Status.ACCEPTED
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
}


export const inviteRepository = new InviteRepository()