import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { WebSocket } from "ws";
import { prisma, resetDb } from "../support/db";
import { createChannelScene, type ChannelScene } from "../support/fixtures";
import { connect, send, startTestServer, stopTestServer, waitForType } from "../support/realtime";
import { WsEvent } from "../../src/websockets/types/events";

let url: string;
let scene: ChannelScene;
const sockets: WebSocket[] = [];

beforeAll(async () => {
  ({ url } = await startTestServer());
});

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();
  scene = await createChannelScene();
});

afterEach(async () => {
  for (const socket of sockets) socket.terminate();
  sockets.length = 0;
});

async function memberSockets(): Promise<[WebSocket, WebSocket]> {
  const ownerWs = await connect(url, scene.owner.accessToken);
  const memberWs = await connect(url, scene.member.accessToken);
  sockets.push(ownerWs, memberWs);
  return [ownerWs, memberWs];
}

async function subscribeToChannel(ws: WebSocket): Promise<void> {
  send(ws, WsEvent.ChannelSubscribe, {
    workspaceId: scene.workspace.id,
    channelId: scene.channel.id,
  });
  const ack = await waitForType(ws, WsEvent.ChannelSubscribe);
  expect(ack.success).toBe(true);
}

describe("channel messaging over websockets", () => {
  it("fans a created message out to subscribers and persists it", async () => {
    const [ownerWs, memberWs] = await memberSockets();
    await subscribeToChannel(ownerWs);
    await subscribeToChannel(memberWs);

    send(memberWs, WsEvent.ChannelMessage, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      content: "hello from member",
    });

    for (const ws of [ownerWs, memberWs]) {
      const created = await waitForType(ws, WsEvent.ChannelMessageCreated);
      expect(created.success).toBe(true);
      expect((created.data!.message as { content: string }).content).toBe("hello from member");
      const messageId = (created.data!.message as { id: string }).id;

      const row = await prisma.message.findUnique({ where: { id: messageId } });
      expect(row).toMatchObject({
        channelId: scene.channel.id,
        senderId: scene.member.user.id,
        content: "hello from member",
        deletedAt: null,
        parentMsgId: null,
      });
    }
  });

  it("fans an edited message out to subscribers and persists editedAt", async () => {
    const [ownerWs, memberWs] = await memberSockets();
    await subscribeToChannel(ownerWs);
    await subscribeToChannel(memberWs);

    send(ownerWs, WsEvent.ChannelMessage, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      content: "original",
    });
    const created = await waitForType(ownerWs, WsEvent.ChannelMessageCreated);
    await waitForType(memberWs, WsEvent.ChannelMessageCreated);
    const messageId = (created.data!.message as { id: string }).id;

    send(ownerWs, WsEvent.ChannelMessageUpdate, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      messageId,
      content: "edited text",
    });

    for (const ws of [ownerWs, memberWs]) {
      const updated = await waitForType(ws, WsEvent.ChannelMessageUpdated);
      expect((updated.data as { id: string }).id).toBe(messageId);
      expect((updated.data as { content: string }).content).toBe("edited text");
    }

    const row = await prisma.message.findUnique({ where: { id: messageId } });
    expect(row?.content).toBe("edited text");
    expect(row?.editedAt).not.toBeNull();
  });

  it("fans a deleted message out to subscribers and soft-deletes it", async () => {
    const [ownerWs, memberWs] = await memberSockets();
    await subscribeToChannel(ownerWs);
    await subscribeToChannel(memberWs);

    send(ownerWs, WsEvent.ChannelMessage, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      content: "doomed",
    });
    const created = await waitForType(ownerWs, WsEvent.ChannelMessageCreated);
    await waitForType(memberWs, WsEvent.ChannelMessageCreated);
    const messageId = (created.data!.message as { id: string }).id;

    send(ownerWs, WsEvent.ChannelMessageDelete, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      messageId,
    });

    for (const ws of [ownerWs, memberWs]) {
      const deleted = await waitForType(ws, WsEvent.ChannelMessageDeleted);
      expect((deleted.data as { messageId: string }).messageId).toBe(messageId);
    }

    const row = await prisma.message.findUnique({ where: { id: messageId } });
    expect(row?.deletedAt).not.toBeNull();
    expect(row?.content).toBe("");
  });

  it("adds and removes a reaction and persists the toggle", async () => {
    const [ownerWs, memberWs] = await memberSockets();
    await subscribeToChannel(ownerWs);
    await subscribeToChannel(memberWs);

    send(ownerWs, WsEvent.ChannelMessage, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      content: "react to me",
    });
    const created = await waitForType(ownerWs, WsEvent.ChannelMessageCreated);
    await waitForType(memberWs, WsEvent.ChannelMessageCreated);
    const messageId = (created.data!.message as { id: string }).id;

    const react = (ws: WebSocket) =>
      send(ws, WsEvent.ChannelMessageReaction, {
        workspaceId: scene.workspace.id,
        entityId: scene.channel.id,
        entityType: "channel",
        messageId,
        reaction: "👍",
      });

    react(memberWs);
    for (const ws of [ownerWs, memberWs]) {
      const added = await waitForType(ws, WsEvent.ChannelMessageReaction);
      expect((added.data as { action: string }).action).toBe("added");
      expect((added.data as { reaction: string }).reaction).toBe("👍");
      expect((added.data as { messageId: string }).messageId).toBe(messageId);
    }
    expect(
      await prisma.reaction.findFirst({
        where: { userId: scene.member.user.id, messageId },
      })
    ).not.toBeNull();

    react(memberWs);
    for (const ws of [ownerWs, memberWs]) {
      const removed = await waitForType(ws, WsEvent.ChannelMessageReaction);
      expect((removed.data as { action: string }).action).toBe("removed");
    }
    expect(
      await prisma.reaction.findFirst({
        where: { userId: scene.member.user.id, messageId },
      })
    ).toBeNull();
  });

  it("creates a reply and persists the parent link", async () => {
    const [ownerWs, memberWs] = await memberSockets();
    await subscribeToChannel(ownerWs);
    await subscribeToChannel(memberWs);

    send(ownerWs, WsEvent.ChannelMessage, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
      content: "parent message",
    });
    const created = await waitForType(ownerWs, WsEvent.ChannelMessageCreated);
    await waitForType(memberWs, WsEvent.ChannelMessageCreated);
    const parentId = (created.data!.message as { id: string }).id;

    send(memberWs, WsEvent.ChannelMessageReply, {
      workspaceId: scene.workspace.id,
      parentMsgId: parentId,
      entityId: scene.channel.id,
      entityType: "channel",
      content: "a reply",
    });

    let replyId = "";
    for (const ws of [ownerWs, memberWs]) {
      const replied = await waitForType(ws, WsEvent.ChannelMessageReply);
      expect((replied.data as { parentMsgId: string }).parentMsgId).toBe(parentId);
      expect((replied.data as { content: string }).content).toBe("a reply");
      replyId = (replied.data as { id: string }).id;
    }

    const row = await prisma.message.findUnique({ where: { id: replyId } });
    expect(row).toMatchObject({
      parentMsgId: parentId,
      channelId: scene.channel.id,
      senderId: scene.member.user.id,
    });
  });

  it("rejects subscription for a workspace member who is not a channel member", async () => {
    const outsiderWs = await connect(url, scene.outsider.accessToken);
    sockets.push(outsiderWs);

    send(outsiderWs, WsEvent.ChannelSubscribe, {
      workspaceId: scene.workspace.id,
      channelId: scene.channel.id,
    });
    const rejected = await waitForType(outsiderWs, WsEvent.ChannelSubscribe);
    expect(rejected.success).toBe(false);
    expect(rejected.statusCode).toBe(403);
    expect(rejected.error?.code).toBe("FORBIDDEN");
  });
});