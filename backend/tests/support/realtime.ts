import http from "http";
import { WebSocket } from "ws";
import { createRealtimeServer } from "../../src/createRealtimeServer";

export interface Frame {
  type: string;
  success: boolean;
  statusCode: number;
  message?: string;
  error?: { code: string; errorMessage: string };
  data?: Record<string, unknown>;
}

interface Waiter {
  resolve: (frame: Frame) => void;
  timer: NodeJS.Timeout;
  done: boolean;
}

const frameQueues = new WeakMap<WebSocket, Frame[]>();
const frameWaiters = new WeakMap<WebSocket, Waiter[]>();
const allClients = new Set<WebSocket>();

let server: http.Server | undefined;

function onWsMessage(ws: WebSocket, data: Buffer): void {
  const frame = JSON.parse(data.toString()) as Frame;
  const waiters = frameWaiters.get(ws);
  const waiter = waiters?.find((w) => !w.done);
  if (waiter) {
    waiter.done = true;
    clearTimeout(waiter.timer);
    removeWaiter(ws, waiter);
    waiter.resolve(frame);
    return;
  }
  const queue = frameQueues.get(ws) ?? [];
  queue.push(frame);
  frameQueues.set(ws, queue);
}

function addWaiter(ws: WebSocket, waiter: Waiter): void {
  const waiters = frameWaiters.get(ws) ?? [];
  waiters.push(waiter);
  frameWaiters.set(ws, waiters);
}

function removeWaiter(ws: WebSocket, waiter: Waiter): void {
  const waiters = frameWaiters.get(ws);
  if (!waiters) return;
  const index = waiters.indexOf(waiter);
  if (index >= 0) waiters.splice(index, 1);
}

export async function startTestServer(): Promise<{ url: string }> {
  server = createRealtimeServer();
  await new Promise<void>((resolve) => server!.listen(0, resolve));
  const address = server!.address() as { port: number };
  return { url: `ws://127.0.0.1:${address.port}` };
}

export async function stopTestServer(): Promise<void> {
  for (const client of allClients) {
    client.terminate();
  }
  allClients.clear();
  if (server) {
    const current = server;
    await new Promise<void>((resolve) => current.close(() => resolve()));
    server = undefined;
  }
}

export function connect(url: string, accessToken: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: { Cookie: `accessToken=${accessToken}` },
    });
    allClients.add(ws);
    ws.on("message", (data) => onWsMessage(ws, data as Buffer));
    ws.once("open", () => resolve(ws));
    ws.once("error", (err) => reject(err));
  });
}

export function expectConnectRejected(
  url: string,
  accessToken?: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const headers = accessToken
      ? { Cookie: `accessToken=${accessToken}` }
      : {};
    const ws = new WebSocket(url, { headers });
    allClients.add(ws);
    const timer = setTimeout(
      () => reject(new Error("expected connection to fail, but it succeeded")),
      2000
    );
    ws.once("error", (err) => {
      clearTimeout(timer);
      const match = /(\d{3})/.exec(String(err.message));
      resolve(match ? Number(match[1]) : 0);
    });
    ws.once("open", () => {
      clearTimeout(timer);
      ws.close();
      reject(new Error("expected connection to fail, but it succeeded"));
    });
  });
}

export function send(ws: WebSocket, type: string, payload: unknown): void {
  ws.send(JSON.stringify({ type, payload }));
}

export function takeNext(ws: WebSocket, timeoutMs = 3000): Promise<Frame> {
  const queue = frameQueues.get(ws);
  if (queue && queue.length > 0) return Promise.resolve(queue.shift()!);
  return new Promise((resolve, reject) => {
    const waiter: Waiter = {
      resolve,
      done: false,
      timer: setTimeout(() => {
        if (waiter.done) return;
        waiter.done = true;
        removeWaiter(ws, waiter);
        reject(new Error(`timed out waiting for a frame (${timeoutMs}ms)`));
      }, timeoutMs),
    };
    waiter.timer.unref?.();
    addWaiter(ws, waiter);
  });
}

export async function waitForType(
  ws: WebSocket,
  type: string,
  timeoutMs = 3000
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`timed out waiting for frame type "${type}"`);
    }
    const frame = await takeNext(ws, remaining);
    if (frame.type === type) return frame;
  }
}

export async function expectNoFrame(
  ws: WebSocket,
  type: string,
  windowMs = 400
): Promise<void> {
  const deadline = Date.now() + windowMs;
  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return;
    let frame: Frame;
    try {
      frame = await takeNext(ws, remaining);
    } catch {
      return;
    }
    if (frame.type === type) {
      throw new Error(`unexpected frame "${type}" received`);
    }
  }
}

export function waitForClose(ws: WebSocket, timeoutMs = 2000): Promise<void> {
  if (ws.readyState === WebSocket.CLOSED) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("timed out waiting for socket close")),
      timeoutMs
    );
    ws.once("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}