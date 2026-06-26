import { Prisma } from "../../../generated/prisma/client"
import { canWorkspace } from "../../utility/Authorization/Permissions"
import { UnauthorizedAccessError, NotFoundError, ForbiddenError, ConfilctError } from "../../utility/errorHandling/customErrors"
import { authRepository } from "../auth/auth.repository"
import { workspaceRepository } from "../Workspace/workspace.repository"
import { inviteRepository } from "./invite.repository"


class InviteService{
    async createWorkspaceInvite(Invite: { workspaceId: string, actorId: string, email: string }) {
        const Member = await workspaceRepository.memberExists(Invite.actorId, Invite.workspaceId)
        const receiver = await authRepository.findUserByEmail(Invite.email)
        if (!Member) throw new UnauthorizedAccessError("You are not member of this workspace")
        if (!receiver) throw new NotFoundError("User not Found")

        if (!canWorkspace(Member.role, 'workspaceMember', "invite")) throw new ForbiddenError("You are not authorized to perform this action.")

        const invite = { ...Invite, receiverId: receiver?.id }
        try {
            const workspaceInvite = await inviteRepository.createWorkspaceInvite(invite)
            return workspaceInvite
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new ConfilctError("User Is already Invited")
            }
            return
        }


    }
}

export const inviteService = new InviteService()

    