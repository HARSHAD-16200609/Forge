import { Prisma, Status, Visibility } from "../../../generated/prisma/client"
import { EntityType, NotificationType } from "../../../generated/prisma/enums"
import { buildInviteUrl, generateInviteToken, maskEmail, parseInviteToken } from "../../utility/auth/inviteTokens"
import { canWorkspace } from "../../utility/Authorization/Permissions"
import { ApiError } from "../../utility/errorHandling/ApiError"
import { UnauthorizedAccessError, NotFoundError, ForbiddenError, ConfilctError, BadRequestError, ResourceGoneError } from "../../utility/errorHandling/customErrors"
import { loggers } from "../../utility/logger/serviceLoggers"
import { mailerService } from "../../services/email/mailer"
import { workspaceInviteTemplate } from "../../services/email/templates/workspaceInvite"
import { channelInviteTemplate } from "../../services/email/templates/channelInvite"
import { authRepository } from "../Auth/auth.repository"
import { channelRepository } from "../Channel/channel.repository"
import { notificationRepository } from "../Notifications/notifications.repository"
import { workspaceRepository } from "../Workspace/workspace.repository"
import { INVITE_LINK_TTL_DAYS, INVITE_TTL_DAYS, inviteRepository } from "./invitation.repository"
import { channelInviteDTO, channelParamsDTO, createChannelInviteDTO } from "../../db/channel.schema"
import type { getInviteType } from "../../db/invitation.schema"

export interface InvitePreview {
    kind: "workspace_invite" | "channel_invite" | "workspace_link"
    status: Status | "EXPIRED"
    workspaceId: string
    workspaceName: string
    channelName?: string | undefined
    inviterName?: string | undefined
    email?: string | undefined
    memberCount?: number | undefined
    expiresAt: Date
}

class InviteService {
    async createWorkspaceInvite(Invite: { workspaceId: string, actorId: string, email: string }) {
        const email = Invite.email.trim().toLowerCase()
        const Member = await workspaceRepository.memberExists(Invite.actorId, Invite.workspaceId)

        if (!Member) throw new UnauthorizedAccessError("You are not member of this workspace")
        if (!canWorkspace(Member.role, 'workspaceMember', "invite")) throw new ForbiddenError("You are not authorized to perform this action.")

        const receiver = await authRepository.findUserByEmailInsensitive(email)

        if (receiver) {
            const wsMember = await workspaceRepository.memberExists(receiver.id, Invite.workspaceId)
            if (wsMember) throw new ConfilctError("User Already an Member of this Workspace")
        }

        try {
            const workspaceInvite = await inviteRepository.createWorkspaceInvite({
                workspaceId: Invite.workspaceId,
                actorId: Invite.actorId,
                email,
                receiverId: receiver?.id ?? null,
                token: generateInviteToken("wsi"),
            })

            if (receiver) {
                try {
                    await notificationRepository.createInvite({
                        type: NotificationType.WORKSPACE_INVITE,
                        entity: EntityType.WORKSPACE,
                        entityId: Invite.workspaceId,
                        receipentId: receiver.id,
                        actorId: Invite.actorId,
                        metadata: {
                            kind: "workspace",
                            workspaceId: Invite.workspaceId,
                            inviteId: workspaceInvite.id,
                        },
                    })
                } catch (notificationErr) {
                    loggers.db.warn("WORKSPACE_INVITE_NOTIFICATION_FAILED", {
                        inviteId: workspaceInvite.id,
                        error: notificationErr instanceof Error ? notificationErr.message : String(notificationErr),
                    })
                }
            }

            const emailSent = await this.sendWorkspaceInviteEmail({
                actorId: Invite.actorId,
                email,
                workspaceId: Invite.workspaceId,
                token: workspaceInvite.token,
            })

            return { invite: workspaceInvite, emailSent }
        } catch (err) {

            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {

                throw new ConfilctError("User Is already Invited")
            }
            throw err
        }
    }

    private async sendWorkspaceInviteEmail(input: {
        actorId: string
        email: string
        workspaceId: string
        token: string
    }) {
        const [context, actor] = await Promise.all([
            inviteRepository.getWorkspaceEmailContext(input.workspaceId),
            authRepository.getUser(input.actorId),
        ])

        if (!context) return false

        return mailerService.sendEmail({
            to: input.email,
            ...(actor?.email ? { replyTo: actor.email } : {}),
            ...workspaceInviteTemplate({
                inviterName: actor?.name ?? "A teammate",
                workspaceName: context.workspaceName,
                inviteUrl: buildInviteUrl(input.token),
                expiresInDays: INVITE_TTL_DAYS,
            }),
        })
    }

    private async sendChannelInviteEmail(input: {
        actorId: string
        email: string
        channelId: string
        channelName: string
        workspaceName: string
        token: string
    }) {
        const actor = await authRepository.getUser(input.actorId)

        return mailerService.sendEmail({
            to: input.email,
            ...(actor?.email ? { replyTo: actor.email } : {}),
            ...channelInviteTemplate({
                inviterName: actor?.name ?? "A teammate",
                workspaceName: input.workspaceName,
                channelName: input.channelName,
                inviteUrl: buildInviteUrl(input.token),
                expiresInDays: INVITE_TTL_DAYS,
            }),
        })
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
            const acceptedInvite = await inviteRepository.acceptWsInvite(receiverId, invite.workspaceId, inviteId)
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
            const rejectedInvite = await inviteRepository.rejectWsInvite(inviteId)
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
            const cancelledInvite = await inviteRepository.cancelWsInvite(inviteId)
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
        target: createChannelInviteDTO
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


        const email = target.email?.trim().toLowerCase();

        const receiver = target.receiverId
            ? await authRepository.getUser(target.receiverId)
            : email
              ? await authRepository.findUserByEmailInsensitive(email)
              : null;

        if (!receiver) {
            throw new NotFoundError(
                target.receiverId
                    ? "User not found."
                    : "No account exists for this email yet. Invite them to the workspace first."
            );
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
            receiverEmail: receiver.email,
            channelId: Channel.channelId,
            token: generateInviteToken("chi"),
        };

        try {
            const invite = await inviteRepository.createChannelInvite(inviteData);
            try {
                await notificationRepository.createInvite({
                    type: NotificationType.CHANNEL_INVITE,
                    entity: EntityType.CHANNEL,
                    entityId: Channel.channelId,
                    receipentId: receiver.id,
                    actorId,
                    metadata: {
                        kind: "channel",
                        workspaceId: Channel.workspaceId,
                        channelId: Channel.channelId,
                        inviteId: invite.id,
                    },
                });
            } catch (notificationErr) {
                loggers.db.warn("CHANNEL_INVITE_NOTIFICATION_FAILED", {
                    inviteId: invite.id,
                    error: notificationErr instanceof Error ? notificationErr.message : String(notificationErr),
                });
            }

            const channelContext = await inviteRepository.getChannelEmailContext(Channel.channelId);

            const emailSent = await this.sendChannelInviteEmail({
                actorId,
                email: receiver.email,
                channelId: Channel.channelId,
                channelName: channelContext?.channelName ?? "channel",
                workspaceName: channelContext?.workspace.workspaceName ?? "workspace",
                token: invite.token,
            });

            return { invite, emailSent };
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

    async previewInviteToken(token: string): Promise<InvitePreview> {
        const kind = parseInviteToken(token)

        if (kind === "workspace_invite") {
            const invite = await inviteRepository.getWsInviteByToken(token)
            if (!invite) throw new NotFoundError("Invite not found")

            const [context, actor] = await Promise.all([
                inviteRepository.getWorkspaceEmailContext(invite.workspaceId),
                authRepository.getUser(invite.actorId),
            ])

            const isExpired = invite.status === Status.PENDING && invite.expiresAt.getTime() < Date.now()

            return {
                kind,
                status: isExpired ? "EXPIRED" : invite.status,
                workspaceId: invite.workspaceId,
                workspaceName: context?.workspaceName ?? "Workspace",
                inviterName: actor?.name,
                email: maskEmail(invite.receiverEmail),
                expiresAt: invite.expiresAt,
            }
        }

        if (kind === "channel_invite") {
            const invite = await inviteRepository.getChannelInviteByToken(token)
            if (!invite) throw new NotFoundError("Invite not found")

            const [context, actor] = await Promise.all([
                inviteRepository.getChannelEmailContext(invite.channelId),
                authRepository.getUser(invite.actorId),
            ])

            const isExpired = invite.status === Status.PENDING && invite.expiresAt.getTime() < Date.now()

            return {
                kind,
                status: isExpired ? "EXPIRED" : invite.status,
                workspaceId: context?.workspace.id ?? "",
                workspaceName: context?.workspace.workspaceName ?? "Workspace",
                channelName: context?.channelName ?? "channel",
                inviterName: actor?.name,
                email: maskEmail(invite.receiverEmail),
                expiresAt: invite.expiresAt,
            }
        }

        if (kind === "workspace_link") {
            const link = await inviteRepository.getWorkspaceInviteLinkByToken(token)
            if (!link) throw new NotFoundError("Invite link not found")

            const [context, memberCount] = await Promise.all([
                inviteRepository.getWorkspaceEmailContext(link.workspaceId),
                inviteRepository.getWorkspaceMemberCount(link.workspaceId),
            ])

            const isExpired = link.expiresAt.getTime() < Date.now()

            return {
                kind,
                status: link.revokedAt ? "REVOKED" : isExpired ? "EXPIRED" : Status.PENDING,
                workspaceId: link.workspaceId,
                workspaceName: context?.workspaceName ?? "Workspace",
                memberCount,
                expiresAt: link.expiresAt,
            }
        }

        throw new NotFoundError("Invite not found")
    }

    private assertInviteEmailMatch(
        invite: { receiverId: string | null, receiverEmail: string },
        user: { id: string, email: string }
    ) {
        if (invite.receiverId) {
            if (invite.receiverId !== user.id) {
                throw new ForbiddenError("This invite was sent to a different email address.")
            }
            return
        }

        if (invite.receiverEmail.toLowerCase() !== user.email.toLowerCase()) {
            throw new ForbiddenError("This invite was sent to a different email address.")
        }
    }

    async acceptInviteToken(userId: string, token: string) {
        const kind = parseInviteToken(token)
        const user = await authRepository.getUser(userId)

        if (!user) throw new NotFoundError("User not found")

        if (kind === "workspace_invite") {
            const invite = await inviteRepository.getWsInviteByToken(token)
            if (!invite) throw new NotFoundError("Invite not found")

            this.assertInviteEmailMatch(invite, user)

            if (invite.status !== Status.PENDING) {
                throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
            }

            if (invite.expiresAt.getTime() < Date.now()) {
                await inviteRepository.expireWsInvite(invite.id)
                throw new ResourceGoneError("Invite has Expired")
            }

            const workspaceMember = await workspaceRepository.memberExists(userId, invite.workspaceId)
            if (workspaceMember) throw new ConfilctError("You are already a member of this workspace")

            return inviteRepository.acceptWsInvite(userId, invite.workspaceId, invite.id)
        }

        if (kind === "channel_invite") {
            const invite = await inviteRepository.getChannelInviteByToken(token)
            if (!invite) throw new NotFoundError("Invite not found")

            this.assertInviteEmailMatch(invite, user)

            if (invite.status !== Status.PENDING) {
                throw new ConfilctError(`Can't accept invite as the invite is already ${invite.status}`)
            }

            if (invite.expiresAt.getTime() < Date.now()) {
                await inviteRepository.expireChannelInvite(invite.id)
                throw new ResourceGoneError("Invite has Expired")
            }

            const channelContext = await inviteRepository.getChannelEmailContext(invite.channelId)
            if (!channelContext) throw new NotFoundError("Channel not found")

            const workspaceMember = await workspaceRepository.memberExists(userId, channelContext.workspace.id)
            if (!workspaceMember) {
                throw new ForbiddenError("Join the workspace before accepting this channel invite.")
            }

            const channelMember = await channelRepository.memberExists(workspaceMember.id, invite.channelId)
            if (channelMember) throw new ConfilctError("You are already a member of this channel")

            return inviteRepository.acceptChannelInvite(workspaceMember.id, invite.channelId, invite.id)
        }

        if (kind === "workspace_link") {
            const link = await inviteRepository.getWorkspaceInviteLinkByToken(token)
            if (!link) throw new NotFoundError("Invite link not found")

            if (link.revokedAt) throw new ResourceGoneError("This invite link has been revoked")
            if (link.expiresAt.getTime() < Date.now()) {
                throw new ResourceGoneError("This invite link has expired")
            }

            return inviteRepository.joinWorkspaceViaLink({
                linkId: link.id,
                userId,
                workspaceId: link.workspaceId,
                maxUses: link.maxUses,
            })
        }

        throw new NotFoundError("Invite not found")
    }

    async getWorkspaceInviteLink(actorId: string, workspaceId: string) {
        await this.assertCanManageInviteLinks(actorId, workspaceId)

        const link = await inviteRepository.getActiveWorkspaceInviteLink(workspaceId)
        return link ? this.serializeInviteLink(link) : null
    }

    async createWorkspaceInviteLink(actorId: string, workspaceId: string) {
        await this.assertCanManageInviteLinks(actorId, workspaceId)

        const existing = await inviteRepository.getActiveWorkspaceInviteLink(workspaceId)
        if (existing) return this.serializeInviteLink(existing)

        const link = await inviteRepository.createWorkspaceInviteLink({
            workspaceId,
            createdById: actorId,
            token: generateInviteToken("wsl"),
            expiresAt: new Date(Date.now() + INVITE_LINK_TTL_DAYS * 24 * 60 * 60 * 1000),
            maxUses: null,
        })

        return this.serializeInviteLink(link)
    }

    async revokeWorkspaceInviteLink(actorId: string, workspaceId: string) {
        await this.assertCanManageInviteLinks(actorId, workspaceId)

        const revoked = await inviteRepository.revokeActiveWorkspaceInviteLinks(workspaceId)
        return { revoked: revoked.count }
    }

    private async assertCanManageInviteLinks(actorId: string, workspaceId: string) {
        const member = await workspaceRepository.memberExists(actorId, workspaceId)

        if (!member) throw new ForbiddenError("You are not a member of this workspace.")
        if (!canWorkspace(member.role, 'workspaceMember', "invite")) {
            throw new ForbiddenError("You are not authorized to perform this action.")
        }
    }

    private serializeInviteLink(link: {
        id: string
        token: string
        workspaceId: string
        expiresAt: Date
        revokedAt: Date | null
        useCount: number
        maxUses: number | null
    }) {
        return {
            id: link.id,
            token: link.token,
            url: buildInviteUrl(link.token),
            workspaceId: link.workspaceId,
            expiresAt: link.expiresAt,
            revokedAt: link.revokedAt,
            useCount: link.useCount,
            maxUses: link.maxUses,
        }
    }

}

export const inviteService = new InviteService()
