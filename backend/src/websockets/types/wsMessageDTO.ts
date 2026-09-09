import { Prisma } from "../../../generated/prisma/client";

export type WsMessageEntityType = "channel" | "conversation";

export interface WsMessageSender {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

export interface WsMessageUpload {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
}

export interface WsMessageReaction {
  emoji: string;
  reactedBy: WsMessageSender;
}

export interface WsMessageReply {
  id: string;
  content: string;
  sentAt: string;
  sender: WsMessageSender;
}

export interface WsMessageDTO {
  id: string;
  content: string;
  sentAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  parentMsgId: string | null;
  entity: { type: WsMessageEntityType; id: string };
  sender: WsMessageSender;
  uploads: WsMessageUpload[];
  reactions: WsMessageReaction[];
  replies: WsMessageReply[];
}

export const messageDetailsInclude = {
  sender: {
    select: { id: true, username: true, name: true, avatar: true },
  },
  uploads: {
    select: {
      id: true,
      url: true,
      filename: true,
      mimeType: true,
      fileSize: true,
      fileType: true,
    },
  },
  reactions: {
    select: {
      emoji: true,
      reactedBy: {
        select: { id: true, username: true, name: true, avatar: true },
      },
    },
  },
  replies: {
    select: {
      id: true,
      content: true,
      sentAt: true,
      sender: {
        select: { id: true, username: true, name: true, avatar: true },
      },
    },
  },
} satisfies Prisma.messageInclude;

export type MessageDetailsRow = Prisma.messageGetPayload<{
  include: typeof messageDetailsInclude;
}>;

export function toWsMessageDTO(row: MessageDetailsRow): WsMessageDTO {
  const entity = row.channelId
    ? { type: "channel" as const, id: row.channelId }
    : { type: "conversation" as const, id: row.conversationId as string };

  return {
    id: row.id,
    content: row.content,
    sentAt: row.sentAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    parentMsgId: row.parentMsgId,
    entity,
    sender: {
      id: row.sender.id,
      username: row.sender.username,
      name: row.sender.name,
      avatar: row.sender.avatar,
    },
    uploads: row.uploads.map((upload) => ({
      id: upload.id,
      url: upload.url,
      filename: upload.filename,
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      fileType: upload.fileType,
    })),
    reactions: row.reactions.map((reaction) => ({
      emoji: reaction.emoji,
      reactedBy: {
        id: reaction.reactedBy.id,
        username: reaction.reactedBy.username,
        name: reaction.reactedBy.name,
        avatar: reaction.reactedBy.avatar,
      },
    })),
    replies: row.replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      sentAt: reply.sentAt.toISOString(),
      sender: {
        id: reply.sender.id,
        username: reply.sender.username,
        name: reply.sender.name,
        avatar: reply.sender.avatar,
      },
    })),
  };
}