import { prisma } from "../../config/prisma"


class InviteRepository {
     async createWorkspaceInvite(Invite: { workspaceId: string, actorId: string, email: string, receiverId: string }) {
    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: Invite.workspaceId,
        actorId: Invite.actorId,
        receiverEmail: Invite.email,
        receiverId: Invite.receiverId,
        expiresAt: new Date(Date.now() + 7 * 60 * 60 * 24 * 1000)
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

  async acceptWorkspaceInvite(){

  }
  async rejectWorkspaceInvite(){

  }
}


export const inviteRepository = new InviteRepository()