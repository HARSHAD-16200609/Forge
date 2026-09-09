import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { WebSocket } from "ws";
import { prisma, resetDb } from "../support/db";
import {
  addWorkspaceMember,
  createConfirmedUser,
  createWorkspace,
  type ConfirmedUser,
} from "../support/fixtures";
import { connect, send, startTestServer, stopTestServer, waitForClose, waitForType } from "../support/realtime";
import { WsEvent } from "../../src/websockets/types/events";
import { heartbeatManager } from "../../src/websockets/heartbeatManager";
import { connectionManager } from "../../src/websockets/connectionManager";
import { presenceHandler } from "../../src/websockets/presenceManager";

let url: string;
let workspaceId: string;
let a: ConfirmedUser;
let b: ConfirmedUser;
const sockets: WebSocket[] = [];

beforeAll(async () => {
  ({ url } = await startTestServer());
});

afterAll(async () => {
  heartbeatManager.stop();
  await stopTestServer();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();

  a = await createConfirmedUser();
  b = await createConfirmedUser();

  const workspace = await createWorkspace(a.user.id, "heartbeat-scene");
  await addWorkspaceMember(b.user.id, workspace.id);
  workspaceId = workspace.id;
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

async function joinWorkspace(user: ConfirmedUser): Promise<WebSocket> {
  const ws = await connectAs(user);
  send(ws, WsEvent.PresenceUpdate, { workspaceId });
  await waitForType(ws, WsEvent.PresenceUpdate);
  return ws;
}

describe("heartbeat over websockets", () => {
  it("answers a ping with a pong carrying the timestamp", async () => {
    const sa = await connectAs(a);
    await waitForType(sa, WsEvent.Pong);

    send(sa, WsEvent.Ping, { timestamp: 123456 });
    const pong = await waitForType(sa, WsEvent.Pong);
    expect(pong.success).toBe(true);
    expect((pong.data as { timestamp: number }).timestamp).toBe(123456);
    expect(typeof (pong.data as { serverTime: number }).serverTime).toBe("number");
  });

  it("terminates stale sockets and broadcasts offline", async () => {
    const sa = await joinWorkspace(a);
    const sb = await joinWorkspace(b);

    const serverSockets = presenceHandler.getOnlineSockets(workspaceId);
    expect(serverSockets).toBeDefined();
    const staleSocket = [...serverSockets!].find(
      (socket) => connectionManager.getMetadata(socket)?.userId === a.user.id
    );
    expect(staleSocket).toBeDefined();

    const metadata = connectionManager.getMetadata(staleSocket!);
    expect(metadata).toBeDefined();
    metadata!.lastSeenAt = new Date(Date.now() - 5000);

    heartbeatManager.checkSockets(1000);

    await waitForClose(sa);
    expect(connectionManager.getMetadata(staleSocket!)).toBeUndefined();

    const offlineA = await waitForType(sb, WsEvent.PresenceUpdate);
    expect(offlineA.data).toEqual({
      workspaceId,
      userId: a.user.id,
      username: a.user.username,
      status: "offline",
    });
  });
});