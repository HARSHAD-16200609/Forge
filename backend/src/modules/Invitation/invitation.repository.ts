import { Role, Status } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"


class InviteRepository {
  async createWorkspaceInvite(Invite: { workspaceId: string, actorId: string, email: string, receiverId: string }) {
    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: Invite.workspaceId,
        actorId: Invite.actorId,
        receiverEmail: Invite.email,
        receiverId: Invite.receiverId,
        expiresAt: new Date(Date.now() + 7 * 60 * 60 * 24 * 1000),
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
  async getSentInvites(InviteeId: string,status?:Status) {
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        actorId: InviteeId,
         ...(status ? { status } : {})
      }
    })
    return invites
  }
  async getReceivedInvites(InviteedId: string,status?:Status) {
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        receiverId: InviteedId,
         ...(status ? { status } : {})
      }
    })
    return invites
  }

  async acceptInvite(receiverId: string, workspaceId: string) {
    return prisma.$transaction(async (tx) => {

      await tx.workspaceMember.create({
        data: {
          role: "MEMBER",
          workspaceId,
          userId: receiverId,
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
          status: "ACCEPTED",
        },
      });

      return invite;
    });
  }

  async getInvite(inviteId: string) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: {

        id: inviteId

      }, select: {
        actorId: true,
        workspaceId: true,
        receiverId: true,
        status: true,
        expiresAt:true
      }
    })
    return invite
  }
  async rejectInvite(receiverId: string, workspaceId: string) {
    await prisma.workspaceInvite.update({
      where: {
        receiverId_workspaceId: {
          receiverId,
          workspaceId,
        }
      },
      data: {
        status: "REJECTED",
      },

    });
  }
  async cancelInvite(receiverId: string, workspaceId: string) {
    await prisma.workspaceInvite.update({
      where: {
        receiverId_workspaceId: {
          receiverId,
          workspaceId,
        }
      },
      data: {
        status: "REVOKED",
      },

    });
  }
  async expireInvite(inviteId:string){
    await  prisma.workspaceInvite.update({
      where: {
       id : inviteId,
     
      },
      data: {
        status: "EXPIRED",
      },

    });
  }
 
}


export const inviteRepository = new InviteRepository()