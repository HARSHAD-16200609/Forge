import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { WebSocket } from "ws";
import { prisma, resetDb } from "../support/db";
import { createConversationScene, type ConversationScene } from "../support/fixtures";
import { connect, expectNoFrame, send, startTestServer, stopTestServer, waitForType } from "../support/realtime";
import { WsEvent } from "../../src/websockets/types/events";

let url: string;
let scene: ConversationScene;
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
  scene = await createConversationScene();
});

afterEach(async () => {
  for (const socket of sockets) socket.terminate();
  sockets.length = 0;
});

async function connectAs(user: "alice" | "bob" | "carol"): Promise<WebSocket> {
  const ws = await connect(url, scene[user].accessToken);
  sockets.push(ws);
  return ws;
}

async function subscribeToConversation(
  ws: WebSocket,
  conversationId: string
): Promise<void> {
  send(ws, WsEvent.ConversationSubscribe, { conversationId });
  const ack = await waitForType(ws, WsEvent.ConversationSubscribe);
  expect(ack.success).toBe(true);
}

describe("conversation messaging over websockets", () => {
  it("fans a DM message out only to conversation members and persists it", async () => {
    const aliceWs = await connectAs("alice");
    const bobWs = await connectAs("bob");
    const carolWs = await connectAs("carol");

    await subscribeToConversation(aliceWs, scene.dm.id);
    await subscribeToConversation(bobWs, scene.dm.id);

    send(bobWs, WsEvent.ConversationMessage, {
      workspaceId: scene.workspace.id,
      conversationId: scene.dm.id,
      content: "private dm",
    });

    for (const ws of [aliceWs, bobWs]) {
      const created = await waitForType(ws, WsEvent.ConversationMessageCreated);
      expect((created.data as { content: string }).content).toBe("private dm");
      const messageId = (created.data as { id: string }).id;

      const row = await prisma.message.findUnique({ where: { id: messageId } });
      expect(row).toMatchObject({
        conversationId: scene.dm.id,
        channelId: null,
        senderId: scene.bob.user.id,
        deletedAt: null,
      });
    }

    await expectNoFrame(carolWs, WsEvent.ConversationMessageCreated);
  });

  it("fans DM update/delete out to members and persists them", async () => {
    const aliceWs = await connectAs("alice");
    const bobWs = await connectAs("bob");

    await subscribeToConversation(aliceWs, scene.dm.id);
    await subscribeToConversation(bobWs, scene.dm.id);

    send(aliceWs, WsEvent.ConversationMessage, {
      workspaceId: scene.workspace.id,
      conversationId: scene.dm.id,
      content: "edited soon",
    });
    const created = await waitForType(aliceWs, WsEvent.ConversationMessageCreated);
    await waitForType(bobWs, WsEvent.ConversationMessageCreated);
    const messageId = (created.data as { id: string }).id;

    send(aliceWs, WsEvent.ConversationMessageUpdate, {
      workspaceId: scene.workspace.id,
      conversationId: scene.dm.id,
      messageId,
      content: "edited in dm",
    });

    for (const ws of [aliceWs, bobWs]) {
      const updated = await waitForType(ws, WsEvent.ConversationMessageUpdated);
      expect((updated.data as { id: string }).id).toBe(messageId);
      expect((updated.data as { content: string }).content).toBe("edited in dm");
    }
    expect(
      (await prisma.message.findUnique({ where: { id: messageId } }))?.editedAt
    ).not.toBeNull();

    send(aliceWs, WsEvent.ConversationMessageDelete, {
      workspaceId: scene.workspace.id,
      conversationId: scene.dm.id,
      messageId,
    });

    for (const ws of [aliceWs, bobWs]) {
      const deleted = await waitForType(ws, WsEvent.ConversationMessageDeleted);
      expect((deleted.data as { id: string }).id).toBe(messageId);
      expect((deleted.data as { content: string }).content).toBe("");
      expect((deleted.data as { deletedAt: string | null }).deletedAt).not.toBeNull();
    }
    const row = await prisma.message.findUnique({ where: { id: messageId } });
    expect(row?.deletedAt).not.toBeNull();
  });

  it("creates a conversation reply with the entityType claim", async () => {
    const aliceWs = await connectAs("alice");
    const bobWs = await connectAs("bob");

    await subscribeToConversation(aliceWs, scene.dm.id);
    await subscribeToConversation(bobWs, scene.dm.id);

    send(aliceWs, WsEvent.ConversationMessage, {
      workspaceId: scene.workspace.id,
      conversationId: scene.dm.id,
      content: "dm parent",
    });
    const created = await waitForType(aliceWs, WsEvent.ConversationMessageCreated);
    await waitForType(bobWs, WsEvent.ConversationMessageCreated);
    const parentId = (created.data as { id: string }).id;

    send(bobWs, WsEvent.ConversationMessageReply, {
      workspaceId: scene.workspace.id,
      parentMsgId: parentId,
      entityId: scene.dm.id,
      entityType: "conversation",
      content: "dm reply",
    });

    let replyId = "";
    for (const ws of [aliceWs, bobWs]) {
      const replied = await waitForType(ws, WsEvent.ConversationMessageReply);
      expect((replied.data as { parentMsgId: string }).parentMsgId).toBe(parentId);
      replyId = (replied.data as { id: string }).id;
    }

    const row = await prisma.message.findUnique({ where: { id: replyId } });
    expect(row).toMatchObject({
      parentMsgId: parentId,
      conversationId: scene.dm.id,
      channelId: null,
    });
  });

  it("adds a conversation reaction via the entityType claim", async () => {
    const aliceWs = await connectAs("alice");
    const bobWs = await connectAs("bob");

    await subscribeToConversation(aliceWs, scene.dm.id);
    await subscribeToConversation(bobWs, scene.dm.id);

    send(aliceWs, WsEvent.ConversationMessage, {
      workspaceId: scene.workspace.id,
      conversationId: scene.dm.id,
      content: "fm",
    });
    const created = await waitForType(aliceWs, WsEvent.ConversationMessageCreated);
    await waitForType(bobWs, WsEvent.ConversationMessageCreated);
    const messageId = (created.data as { id: string }).id;

    send(bobWs, WsEvent.ConversationMessageReaction, {
      workspaceId: scene.workspace.id,
      entityId: scene.dm.id,
      entityType: "conversation",
      messageId,
      reaction: "❤️",
    });

    for (const ws of [aliceWs, bobWs]) {
      const reacted = await waitForType(ws, WsEvent.ConversationMessageReaction);
      expect((reacted.data as { action: string }).action).toBe("added");
      expect((reacted.data as { messageId: string }).messageId).toBe(messageId);
      expect((reacted.data as { userId: string }).userId).toBe(scene.bob.user.id);
      expect((reacted.data as { username: string }).username).toBe(scene.bob.user.username);
    }
    expect(
      await prisma.reaction.findFirst({
        where: { userId: scene.bob.user.id, messageId },
      })
    ).not.toBeNull();
  });

  it("rejects DM subscription for a non-member", async () => {
    const carolWs = await connectAs("carol");

    send(carolWs, WsEvent.ConversationSubscribe, { conversationId: scene.dm.id });
    const rejected = await waitForType(carolWs, WsEvent.ConversationSubscribe);
    expect(rejected.success).toBe(false);
    expect(rejected.statusCode).toBe(403);
    expect(rejected.error?.code).toBe("FORBIDDEN");
  });

  it("fans a GDM message out to all group members", async () => {
    const aliceWs = await connectAs("alice");
    const bobWs = await connectAs("bob");
    const carolWs = await connectAs("carol");

    for (const ws of [aliceWs, bobWs, carolWs]) {
      await subscribeToConversation(ws, scene.gdm.id);
    }

    send(carolWs, WsEvent.ConversationMessage, {
      workspaceId: scene.workspace.id,
      conversationId: scene.gdm.id,
      content: "group hello",
    });

    for (const ws of [aliceWs, bobWs, carolWs]) {
      const created = await waitForType(ws, WsEvent.ConversationMessageCreated);
      expect((created.data as { content: string }).content).toBe("group hello");
    }
  });
});