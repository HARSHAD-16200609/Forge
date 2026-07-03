import { Prisma, Status, Visibility } from "../../../generated/prisma/client"
import { channelInviteDTO, channelParamsDTO } from "../../db/channel.schema"
import type { getInviteType, InviteType } from "../../db/invitation.schema"
import { canWorkspace } from "../../utility/Authorization/Permissions"
import { ApiError } from "../../utility/errorHandling/ApiError"
import { UnauthorizedAccessError, NotFoundError, ForbiddenError, ConfilctError, BadRequestError, ResourceGoneError } from "../../utility/errorHandling/customErrors"
import { loggers } from "../../utility/logger/serviceLoggers"
import { authRepository } from "../Auth/auth.repository"
import { channelRepository } from "../Channel/channel.repository"
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

    async listAllInvites(InviteeId: string, inviteType: getInviteType) {

        const pagination = {
            page: inviteType.page,
            limit: inviteType.limit
        }

        try {
            let invites;
            if (inviteType.type === "sent") {
                invites = await inviteRepository.getSentInvites(InviteeId, inviteType.status, pagination);
            } else {
                invites = await inviteRepository.getReceivedInvites(InviteeId, inviteType.status, pagination);
            }


            return invites;

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("Invites not Found")
            }
            throw err
        }
    }
    async acceptWsInvite(receiverId: string, inviteId: string) {

        const invite = await inviteRepository.getWsInvite(inviteId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (receiverId !== invite.receiverId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== Status.PENDING) throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
        const workspaceMember = await workspaceRepository.memberExists(receiverId, invite.workspaceId)
        if (workspaceMember) throw new ConfilctError("You are Already an member of this Workspace")
        try {
            const now = Date.now()
            if (invite.expiresAt.getTime() < now) {
                await inviteRepository.expireWsInvite(inviteId)
                throw new ResourceGoneError("Invite has Expired")
            }
            const acceptedInvite = await inviteRepository.acceptWsInvite(receiverId, invite.workspaceId)
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
    async rejectWsInvite(receiverId: string, inviteId: string) {
        const invite = await inviteRepository.getWsInvite(inviteId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (receiverId !== invite.receiverId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== Status.PENDING) throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
        try {
            const rejectedInvite = await inviteRepository.rejectWsInvite(receiverId, invite.workspaceId)
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
    async cancelWsInvite(actorId: string, inviteId: string) {
        const invite = await inviteRepository.getWsInvite(inviteId)

        if (!invite) throw new NotFoundError("Invite Not Found")

        if (actorId !== invite.actorId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== Status.PENDING) throw new ConfilctError(`Can't cancel invite as the invite is already ${invite.status}`)
        try {
            const cancelledInvite = await inviteRepository.cancelWsInvite(invite.receiverId, invite.workspaceId)
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
    async createChannelInvite(
        actorId: string,
        Channel: channelParamsDTO,
        email: string
    ) {

        const workspaceMember = await workspaceRepository.memberExists(
            actorId,
            Channel.workspaceId
        );

        if (!workspaceMember) {
            throw new ForbiddenError(
                "You are not a member of this workspace."
            );
        }


        const channel = await channelRepository.channelExists(
            Channel.channelId,
            Channel.workspaceId
        );

        if (!channel) {
            throw new NotFoundError("Channel not found.");
        }


        if (channel.visibility === Visibility.PUBLIC) {
            throw new BadRequestError(
                "Public channels do not require invitations."
            );
        }


        const actorChannelMember = await channelRepository.memberExists(
            workspaceMember.id,
            Channel.channelId
        );

        if (!actorChannelMember) {
            throw new ForbiddenError(
                "You are not a member of this private channel."
            );
        }


        const receiver = await authRepository.findUserByEmail(email);

        if (!receiver) {
            throw new NotFoundError("User not found.");
        }


        if (receiver.id === actorId) {
            throw new BadRequestError(
                "You cannot invite yourself."
            );
        }


        const receiverWorkspaceMember =
            await workspaceRepository.memberExists(
                receiver.id,
                Channel.workspaceId
            );

        if (!receiverWorkspaceMember) {
            throw new BadRequestError(
                "User is not a member of this workspace."
            );
        }

        const receiverChannelMember =
            await channelRepository.memberExists(
                receiverWorkspaceMember.id,
                Channel.channelId
            );

        if (receiverChannelMember) {
            throw new ConfilctError(
                "User is already a member of this channel."
            );
        }

        const inviteData = {
            actorId,
            receiverId: receiver.id,
            receiverEmail: email,
            channelId: Channel.channelId,
        };

        try {
            return await inviteRepository.createChannelInvite(inviteData);
        } catch (err) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002"
            ) {
                throw new ConfilctError(
                    "A pending invitation already exists."
                );
            }

            throw err;
        }
    }
    async listAllChannelInvites(InviteeId: string, inviteType: getInviteType) {
        const pagination = {
            page: inviteType.page,
            limit: inviteType.limit
        }

        try {
            let invites;
            if (inviteType.type === "sent") {
                invites = await inviteRepository.getSentChannelInvites(InviteeId, inviteType.status, pagination);
            } else {
                invites = await inviteRepository.getReceivedChannelInvites(InviteeId, inviteType.status, pagination);
            }


            return invites;

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new NotFoundError("Invites not Found")
            }
            throw err
        }
    }

    async acceptChannelInvite(receiverId: string, Invite: channelInviteDTO) {
        const invite = await inviteRepository.getChannelInvite(Invite.inviteId)
        const workspaceMember = await workspaceRepository.memberExists(receiverId, Invite.workspaceId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspce")
        if (receiverId !== invite.receiverId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== Status.PENDING) throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
        try {
            const now = Date.now()
            if (invite.expiresAt.getTime() < now) {
                await inviteRepository.expireChannelInvite(Invite.inviteId)
                throw new ResourceGoneError("Invite has Expired")
            }
            const acceptedInvite = await inviteRepository.acceptChannelInvite(workspaceMember.id, invite.channelId, Invite.inviteId)
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
    async rejectChannelInvite(receiverId: string, Invite: channelInviteDTO) {
        const invite = await inviteRepository.getChannelInvite(Invite.inviteId)
        const workspaceMember = await workspaceRepository.memberExists(receiverId, Invite.workspaceId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspce")
        if (receiverId !== invite.receiverId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== Status.PENDING) throw new ConfilctError(`Can't reject invite as the invite is already ${invite.status}`)
        try {
            const now = Date.now()
            if (invite.expiresAt.getTime() < now) {
                await inviteRepository.expireChannelInvite(Invite.inviteId)
                throw new ResourceGoneError("Invite has Expired")
            }
            const rejectedInvite = await inviteRepository.rejectChannelInvite(Invite.inviteId)
            return rejectedInvite

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
    async cancelChannelInvite(actorId: string, Invite: channelInviteDTO) {
        const invite = await inviteRepository.getChannelInvite(Invite.inviteId)
        const workspaceMember = await workspaceRepository.memberExists(actorId, Invite.workspaceId)

        if (!invite) throw new NotFoundError("Invite Not Found")
        if (!workspaceMember) throw new ForbiddenError("You are not an member of this Workspce")
        if (actorId !== invite.actorId) throw new ForbiddenError("You are Not Allowed to perform this Action")
        if (invite.status !== Status.PENDING) throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
        try {
            const now = Date.now()
            if (invite.expiresAt.getTime() < now) {
                await inviteRepository.expireChannelInvite(Invite.inviteId)
                throw new ResourceGoneError("Invite has Expired")
            }
            const revokedInvite = await inviteRepository.cancelChannelInvite(Invite.inviteId)
            return revokedInvite

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

}

export const inviteService = new InviteService()

