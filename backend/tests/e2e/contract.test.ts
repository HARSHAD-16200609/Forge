import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { WebSocket } from "ws";
import { prisma, resetDb } from "../support/db";
import {
  createChannelScene,
  createConversationScene,
  type ChannelScene,
  type ConversationScene,
} from "../support/fixtures";
import {
  connect,
  send,
  startTestServer,
  stopTestServer,
  waitForType,
} from "../support/realtime";
import { WsEvent } from "../../src/websockets/types/events";

interface MessageDto {
  id: string;
  content: string;
  sentAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  parentMsgId: string | null;
  entity: { type: "channel" | "conversation"; id: string };
  sender: { id: string; username: string; name: string; avatar: string | null };
  uploads: unknown[];
  reactions: unknown[];
  replies: unknown[];
}

let url: string;
let baseUrl: string;
let channelScene: ChannelScene;
let conversationScene: ConversationScene;
const sockets: WebSocket[] = [];

beforeAll(async () => {
  ({ url } = await startTestServer());
  baseUrl = `http://127.0.0.1:${new URL(url).port}`;
});

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();
  channelScene = await createChannelScene();
  conversationScene = await createConversationScene();
});

afterEach(async () => {
  for (const socket of sockets) socket.terminate();
  sockets.length = 0;
});

async function open(accessToken: string): Promise<WebSocket> {
  const ws = await connect(url, accessToken);
  sockets.push(ws);
  return ws;
}

async function history(channelId: string): Promise<MessageDto[]> {
  const res = await fetch(
    `${baseUrl}/api/v1/workspace/${channelScene.workspace.id}/channel/${channelId}/messages?limit=30`,
    { headers: { Cookie: `accessToken=${channelScene.owner.accessToken}` } }
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    data: { messages: MessageDto[]; hasMore: boolean; nextCursor: string | null };
  };
  expect(body.data.hasMore).toBe(false);
  return body.data.messages;
}

const anyTime = expect.any(String) as unknown as string;

describe("locked message DTO contract", () => {
  it("emits exact canonical payloads for the channel message lifecycle and history matches", async () => {
    const ownerWs = await open(channelScene.owner.accessToken);
    const memberWs = await open(channelScene.member.accessToken);

    for (const ws of [ownerWs, memberWs]) {
      send(ws, WsEvent.ChannelSubscribe, {
        workspaceId: channelScene.workspace.id,
        channelId: channelScene.channel.id,
      });
      await waitForType(ws, WsEvent.ChannelSubscribe);
    }

    send(ownerWs, WsEvent.ChannelMessage, {
      workspaceId: channelScene.workspace.id,
      channelId: channelScene.channel.id,
      content: "contract hello",
    });
    const created = await waitForType(ownerWs, WsEvent.ChannelMessageCreated);
    await waitForType(memberWs, WsEvent.ChannelMessageCreated);
    const parentId = (created.data as { id: string }).id;

    expect(created.data).toStrictEqual({
      id: parentId,
      content: "contract hello",
      sentAt: anyTime,
      editedAt: null,
      deletedAt: null,
      parentMsgId: null,
      entity: { type: "channel", id: channelScene.channel.id },
      sender: {
        id: channelScene.owner.user.id,
        username: channelScene.owner.user.username,
        name: channelScene.owner.user.name,
        avatar: null,
      },
      uploads: [],
      reactions: [],
      replies: [],
    });

    send(ownerWs, WsEvent.ChannelMessageUpdate, {
      workspaceId: channelScene.workspace.id,
      channelId: channelScene.channel.id,
      messageId: parentId,
      content: "contract edited",
    });
    const updated = await waitForType(ownerWs, WsEvent.ChannelMessageUpdated);
    await waitForType(memberWs, WsEvent.ChannelMessageUpdated);
    expect(updated.data).toMatchObject({
      id: parentId,
      content: "contract edited",
      editedAt: anyTime,
      deletedAt: null,
      parentMsgId: null,
      entity: { type: "channel", id: channelScene.channel.id },
      sender: { id: channelScene.owner.user.id },
    });

    send(memberWs, WsEvent.ChannelMessageReply, {
      workspaceId: channelScene.workspace.id,
      parentMsgId: parentId,
      entityId: channelScene.channel.id,
      entityType: "channel",
      content: "contract reply",
    });
    const replied = await waitForType(ownerWs, WsEvent.ChannelMessageReply);
    await waitForType(memberWs, WsEvent.ChannelMessageReply);
    const replyId = (replied.data as { id: string }).id;
    expect(replied.data).toStrictEqual({
      id: replyId,
      content: "contract reply",
      sentAt: anyTime,
      editedAt: null,
      deletedAt: null,
      parentMsgId: parentId,
      entity: { type: "channel", id: channelScene.channel.id },
      sender: {
        id: channelScene.member.user.id,
        username: channelScene.member.user.username,
        name: channelScene.member.user.name,
        avatar: null,
      },
      uploads: [],
      reactions: [],
      replies: [],
    });

    send(memberWs, WsEvent.ChannelMessageReaction, {
      workspaceId: channelScene.workspace.id,
      entityId: channelScene.channel.id,
      entityType: "channel",
      messageId: parentId,
      reaction: "👍",
    });
    const reacted = await waitForType(ownerWs, WsEvent.ChannelMessageReaction);
    expect(reacted.data).toStrictEqual({
      userId: channelScene.member.user.id,
      username: channelScene.member.user.username,
      messageId: parentId,
      reaction: "👍",
      action: "added",
    });

    send(ownerWs, WsEvent.ChannelMessageDelete, {
      workspaceId: channelScene.workspace.id,
      channelId: channelScene.channel.id,
      messageId: parentId,
    });
    const deleted = await waitForType(ownerWs, WsEvent.ChannelMessageDeleted);
    await waitForType(memberWs, WsEvent.ChannelMessageDeleted);
    expect(deleted.data).toStrictEqual({
      id: parentId,
      content: "",
      sentAt: anyTime,
      editedAt: anyTime,
      deletedAt: anyTime,
      parentMsgId: null,
      entity: { type: "channel", id: channelScene.channel.id },
      sender: {
        id: channelScene.owner.user.id,
        username: channelScene.owner.user.username,
        name: channelScene.owner.user.name,
        avatar: null,
      },
      uploads: [],
      reactions: [{ emoji: "👍", reactedBy: { id: channelScene.member.user.id, username: channelScene.member.user.username, name: channelScene.member.user.name, avatar: null } }],
      replies: [{ id: replyId, content: "contract reply", sentAt: anyTime, sender: { id: channelScene.member.user.id, username: channelScene.member.user.username, name: channelScene.member.user.name, avatar: null } }],
    });

    const messages = await history(channelScene.channel.id);
    const replyFromHistory = messages.find((m) => m.id === replyId);
    const tombstoneFromHistory = messages.find((m) => m.id === parentId);

    expect(replyFromHistory).toStrictEqual(replied.data);
    expect(tombstoneFromHistory).toStrictEqual(deleted.data);
  });

  it("emits the conversation entity variant for DM messages", async () => {
    const aliceWs = await open(conversationScene.alice.accessToken);
    const bobWs = await open(conversationScene.bob.accessToken);

    for (const ws of [aliceWs, bobWs]) {
      send(ws, WsEvent.ConversationSubscribe, { conversationId: conversationScene.dm.id });
      await waitForType(ws, WsEvent.ConversationSubscribe);
    }

    send(aliceWs, WsEvent.ConversationMessage, {
      workspaceId: conversationScene.workspace.id,
      conversationId: conversationScene.dm.id,
      content: "dm contract",
    });
    const created = await waitForType(aliceWs, WsEvent.ConversationMessageCreated);

    expect(created.data).toStrictEqual({
      id: (created.data as { id: string }).id,
      content: "dm contract",
      sentAt: anyTime,
      editedAt: null,
      deletedAt: null,
      parentMsgId: null,
      entity: { type: "conversation", id: conversationScene.dm.id },
      sender: {
        id: conversationScene.alice.user.id,
        username: conversationScene.alice.user.username,
        name: conversationScene.alice.user.name,
        avatar: null,
      },
      uploads: [],
      reactions: [],
      replies: [],
    });
  });
});