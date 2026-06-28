import { Prisma } from "../../../generated/prisma/client"
import type { getInviteType, InviteType } from "../../db/invitation.schema"
import { canWorkspace } from "../../utility/Authorization/Permissions"
import { ApiError } from "../../utility/errorHandling/ApiError"
import { UnauthorizedAccessError, NotFoundError, ForbiddenError, ConfilctError, BadRequestError, ResourceGoneError } from "../../utility/errorHandling/customErrors"
import { loggers } from "../../utility/logger/serviceLoggers"
import { authRepository } from "../Auth/auth.repository"
import { workspaceRepository } from "../Workspace/workspace.repository"
import { inviteRepository } from "./invitation.repository"


class InviteService {
    async createWorkspaceInvite(Invite: { workspaceId: string, actorId: string, email: string }) {
        const Member = await workspaceRepository.memberExists(Invite.actorId, Invite.workspaceId)
        const receiver = await authRepository.findUserByEmail(Invite.email)

        if (!Member) throw new UnauthorizedAccessError("You are not member of this workspace")
        if (!receiver) throw new NotFoundError("User not Found")
        if (!canWorkspace(Member.role, 'workspaceMember', "invite")) throw new ForbiddenError("You are not authorized to perform this action.")


        const wsMember = await workspaceRepository.memberExists(receiver.id, Invite.workspaceId)

        if (wsMember) throw new ConfilctError("User Already an Member of this Workspace")

        const invite = { ...Invite, receiverId: receiver?.id }
        try {

            const workspaceInvite = await inviteRepository.createWorkspaceInvite(invite)
            return workspaceInvite
        } catch (err) {

            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {

                throw new ConfilctError("User Is already Invited")
            }
            throw err
        }


    }

    async listAllInvites(InviteeId: string, inviteType: getInviteType,pagination:{page:number,limit:number}) {
        try {
          let invites;
  if (inviteType.type === "sent") {
    invites = await inviteRepository.getSentInvites(InviteeId, inviteType.status,pagination);
  } else {
    invites = await inviteRepository.getReceivedInvites(InviteeId, inviteType.status,pagination);
  }

  return invites;

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("Invites not Found")
            }
            throw err 
        }
    }
    async acceptInvite(receiverId: string, inviteId: string) {

        const invite = await inviteRepository.getInvite(inviteId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (receiverId !== invite.receiverId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== "PENDING") throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)

        try {
            const now = Date.now()
            if (invite.expiresAt.getTime() < now ) {
                await inviteRepository.expireInvite(inviteId)
                throw new ResourceGoneError("Invite has Expired")
            }
            const acceptedInvite = await inviteRepository.acceptInvite(receiverId, invite.workspaceId)
            return acceptedInvite

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ConfilctError("Invite Not Found")
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new NotFoundError("You are Already Member of this Workspace")
            }
          throw err
        }


    }
    async rejectInvite(receiverId: string, inviteId: string) {
        const invite = await inviteRepository.getInvite(inviteId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (receiverId !== invite.receiverId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== "PENDING") throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
        try {
            const rejectedInvite = await inviteRepository.rejectInvite(receiverId, invite.workspaceId)
            return rejectedInvite

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ConfilctError("Invite Not Found")
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new NotFoundError("You are Already Member of this Workspace")
            }

        }
    }
    async cancelInvite(actorId: string, inviteId: string) {
        const invite = await inviteRepository.getInvite(inviteId)

        if (!invite) throw new NotFoundError("Invite Not Found")

        if (actorId !== invite.actorId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== "PENDING") throw new ConfilctError(`Can't cancel invite as the invite is already ${invite.status}`)
        try {
            const cancelledInvite = await inviteRepository.cancelInvite(invite.receiverId, invite.workspaceId)
            return cancelledInvite

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new ConfilctError("Invite Not Found")
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new NotFoundError("You are Already Member of this Workspace")
            }

        }
    }

}

export const inviteService = new InviteService()

