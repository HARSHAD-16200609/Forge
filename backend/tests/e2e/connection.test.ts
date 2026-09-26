import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { prisma, resetDb } from "../support/db";
import { createConfirmedUser } from "../support/fixtures";
import { connect, expectConnectRejected, startTestServer, stopTestServer, waitForClose, waitForType } from "../support/realtime";
import { WS_PATH } from "../../src/createRealtimeServer";

let url: string;
let wsSocket: import("ws").WebSocket | undefined;

beforeAll(async () => {
  ({ url } = await startTestServer());
});

afterAll(async () => {
  await stopTestServer();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  if (wsSocket) {
    wsSocket.terminate();
    wsSocket = undefined;
  }
});

describe("connection upgrade security", () => {
  it("rejects the handshake without a cookie", async () => {
    expect(await expectConnectRejected(url)).toBe(401);
  });

  it("rejects the handshake with an invalid access token", async () => {
    expect(await expectConnectRejected(url, "not-a-real-token")).toBe(401);
  });

  it("rejects the handshake when the token references a missing session", async () => {
    const { user } = await createConfirmedUser();
    const token = jwt.sign(
      { userId: user.id, username: user.username, sessionId: "missing-session" },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    expect(await expectConnectRejected(url, token)).toBe(401);
  });

  it("rejects the handshake with an expired token", async () => {
    const { user, sessionId } = await createConfirmedUser();
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        sessionId,
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      env.JWT_SECRET
    );
    expect(await expectConnectRejected(url, token)).toBe(401);
  });

  it("connects a valid session and greets with the connected frame", async () => {
    const { accessToken } = await createConfirmedUser();
    wsSocket = await connect(url, accessToken);

    const hello = await waitForType(wsSocket, "pong");
    expect(hello.success).toBe(true);
    expect(hello.message).toContain("Connected to server");

    wsSocket.close();
    await waitForClose(wsSocket);
  });
});

describe("upgrade path enforcement", () => {
  it("rejects the handshake on any path other than the socket path", async () => {
    const { accessToken } = await createConfirmedUser();
    const wrongPath = url.replace(WS_PATH, "/not-the-socket");
    expect(await expectConnectRejected(wrongPath, accessToken)).toBe(404);
  });

  it("rejects the handshake on a trailing-slash variant of the socket path", async () => {
    const { accessToken } = await createConfirmedUser();
    expect(await expectConnectRejected(`${url}/`, accessToken)).toBe(404);
  });

  it("rejects the handshake without a cookie before checking the path", async () => {
    expect(await expectConnectRejected(url.replace(WS_PATH, ""))).toBe(404);
  });

  it("accepts a query string on the socket path", async () => {
    const { accessToken } = await createConfirmedUser();
    wsSocket = await connect(`${url}?probe=1`, accessToken);

    const hello = await waitForType(wsSocket, "pong");
    expect(hello.success).toBe(true);

    wsSocket.close();
    await waitForClose(wsSocket);
  });
});