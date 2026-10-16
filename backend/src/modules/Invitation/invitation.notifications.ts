import { EntityType, NotificationType } from "../../../generated/prisma/enums";
import { loggers } from "../../utility/logger/serviceLoggers";
import { notificationRepository } from "../Notifications/notifications.repository";
import { inviteRepository } from "./invitation.repository";

export interface LinkedWorkspaceInvite {
  id: string;
  workspaceId: string;
  actorId: string;
  receiverId: string | null;
}

export interface LinkedChannelInvite {
  id: string;
  channelId: string;
  actorId: string;
  receiverId: string | null;
}

export async function notifyLinkedInvites(linked: {
  wsInvites: LinkedWorkspaceInvite[];
  channelInvites: LinkedChannelInvite[];
}) {
  for (const invite of linked.wsInvites) {
    if (!invite.receiverId) continue;

    await notificationRepository.createInvite({
      type: NotificationType.WORKSPACE_INVITE,
      entity: EntityType.WORKSPACE,
      entityId: invite.workspaceId,
      receipentId: invite.receiverId,
      actorId: invite.actorId,
      metadata: {
        kind: "workspace",
        workspaceId: invite.workspaceId,
        inviteId: invite.id,
      },
    });
  }

  for (const invite of linked.channelInvites) {
    if (!invite.receiverId) continue;

    try {
      const context = await inviteRepository.getChannelEmailContext(invite.channelId);

      await notificationRepository.createInvite({
        type: NotificationType.CHANNEL_INVITE,
        entity: EntityType.CHANNEL,
        entityId: invite.channelId,
        receipentId: invite.receiverId,
        actorId: invite.actorId,
        metadata: {
          kind: "channel",
          workspaceId: context?.workspace.id ?? "",
          channelId: invite.channelId,
          inviteId: invite.id,
        },
      });
    } catch (err) {
      loggers.db.warn("CHANNEL_INVITE_LINK_NOTIFICATION_FAILED", {
        inviteId: invite.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
