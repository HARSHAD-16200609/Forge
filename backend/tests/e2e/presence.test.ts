import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { WebSocket } from "ws";
import { prisma, resetDb } from "../support/db";
import {
  addChannelMember,
  addWorkspaceMember,
  createChannel,
  createConfirmedUser,
  createWorkspace,
  type ConfirmedUser,
} from "../support/fixtures";
import { connect, expectNoFrame, send, startTestServer, stopTestServer, waitForClose, waitForType } from "../support/realtime";
import { WsEvent } from "../../src/websockets/types/events";

interface PresenceScene {
  wsA: { id: string };
  wsB: { id: string };
  channel: { id: string };
  a: ConfirmedUser;
  b: ConfirmedUser;
  c: ConfirmedUser;
}

let url: string;
let scene: PresenceScene;
const sockets: WebSocket[] = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  ({ url } = await startTestServer());
});

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();

  const a = await createConfirmedUser();
  const b = await createConfirmedUser();
  const c = await createConfirmedUser();

  const wsA = await createWorkspace(a.user.id, "presence-a");
  const wsB = await createWorkspace(a.user.id, "presence-b");

  await addWorkspaceMember(b.user.id, wsA.id);
  await addWorkspaceMember(c.user.id, wsB.id);

  const aMember = await prisma.workspaceMember.findUniqueOrThrow({
    where: { userId_workspaceId: { userId: a.user.id, workspaceId: wsA.id } },
  });
  const bMember = await prisma.workspaceMember.findUniqueOrThrow({
    where: { userId_workspaceId: { userId: b.user.id, workspaceId: wsA.id } },
  });

  const channel = await createChannel(wsA.id, aMember.id, "presence-general");
  await addChannelMember(aMember.id, channel.id);
  await addChannelMember(bMember.id, channel.id);

  scene = { wsA, wsB, channel, a, b, c };
});

afterEach(async () => {
  for (const socket of sockets) socket.terminate();
  sockets.length = 0;
});

async function connectAs(user: ConfirmedUser): Promise<WebSocket> {
  const ws = await connect(url, user.accessToken);
  sockets.push(ws);
  return ws;
}

function onlineIds(frame: { data?: Record<string, unknown> }): string[] {
  return (frame.data!.online as { userId: string }[]).map((o) => o.userId);
}

describe("presence over websockets", () => {
  it("reports the roster on registration and broadcasts online", async () => {
    const sa = await connectAs(scene.a);
    const sb = await connectAs(scene.b);

    send(sa, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    const rosterA = await waitForType(sa, WsEvent.PresenceUpdate);
    expect(rosterA.data!.workspaceId).toBe(scene.wsA.id);
    expect(onlineIds(rosterA)).toEqual([scene.a.user.id]);

    send(sb, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    const rosterB = await waitForType(sb, WsEvent.PresenceUpdate);
    expect(onlineIds(rosterB)).toEqual([scene.a.user.id, scene.b.user.id]);

    const onlineB = await waitForType(sa, WsEvent.PresenceUpdate);
    expect(onlineB.data).toEqual({
      workspaceId: scene.wsA.id,
      userId: scene.b.user.id,
      username: scene.b.user.username,
      status: "online",
    });
  });

  it("deduplicates a multi-socket user in the roster", async () => {
    const sa1 = await connectAs(scene.a);
    const sa2 = await connectAs(scene.a);
    const sb = await connectAs(scene.b);

    send(sa1, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    await waitForType(sa1, WsEvent.PresenceUpdate);

    send(sa2, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    const rosterA2 = await waitForType(sa2, WsEvent.PresenceUpdate);
    expect(onlineIds(rosterA2)).toEqual([scene.a.user.id]);

    send(sb, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    const rosterB = await waitForType(sb, WsEvent.PresenceUpdate);
    expect(onlineIds(rosterB)).toEqual([scene.a.user.id, scene.b.user.id]);
  });

  it("only broadcasts offline once the user's last socket leaves", async () => {
    const sa1 = await connectAs(scene.a);
    const sa2 = await connectAs(scene.a);
    const sb = await connectAs(scene.b);

    send(sa1, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    await waitForType(sa1, WsEvent.PresenceUpdate);
    send(sa2, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    await waitForType(sa2, WsEvent.PresenceUpdate);
    send(sb, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    await waitForType(sb, WsEvent.PresenceUpdate);

    sa2.close();
    await waitForClose(sa2);
    await sleep(50);
    await expectNoFrame(sb, WsEvent.PresenceUpdate, 350);

    sa1.close();
    await waitForClose(sa1);

    const offlineA = await waitForType(sb, WsEvent.PresenceUpdate);
    expect(offlineA.data).toEqual({
      workspaceId: scene.wsA.id,
      userId: scene.a.user.id,
      username: scene.a.user.username,
      status: "offline",
    });
  });

  it("switching workspace drops presence and channel subscriptions", async () => {
    const sa = await connectAs(scene.a);
    const sb = await connectAs(scene.b);

    send(sa, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    await waitForType(sa, WsEvent.PresenceUpdate);
    send(sb, WsEvent.PresenceUpdate, { workspaceId: scene.wsA.id });
    await waitForType(sb, WsEvent.PresenceUpdate);

    for (const ws of [sa, sb]) {
      send(ws, WsEvent.ChannelSubscribe, {
        workspaceId: scene.wsA.id,
        channelId: scene.channel.id,
      });
      await waitForType(ws, WsEvent.ChannelSubscribe);
    }

    send(sa, WsEvent.PresenceUpdate, { workspaceId: scene.wsB.id });
    const rosterB = await waitForType(sa, WsEvent.PresenceUpdate);
    expect(rosterB.data!.workspaceId).toBe(scene.wsB.id);
    expect(onlineIds(rosterB)).toEqual([scene.a.user.id]);

    const offlineA = await waitForType(sb, WsEvent.PresenceUpdate);
    expect((offlineA.data as { status: string }).status).toBe("offline");
    expect((offlineA.data as { userId: string }).userId).toBe(scene.a.user.id);

    send(sb, WsEvent.ChannelMessage, {
      workspaceId: scene.wsA.id,
      channelId: scene.channel.id,
      content: "for switched-away user",
    });
    await waitForType(sb, WsEvent.ChannelMessageCreated);

    await expectNoFrame(sa, WsEvent.ChannelMessageCreated, 400);
  });
});