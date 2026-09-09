import http from "http";
import app from "./app";
import { parseCookie } from "cookie";
import { validateSession, verifyAccessToken } from "./utility/auth/jwt";
import { AuthenticatedUpgradeRequest } from "./websockets/types/auth";
import { websocketServer } from "./websockets/websocketServer";

export function createRealtimeServer(): http.Server {
  const server = http.createServer(app);

  server.on("upgrade", async (req, socket, head) => {
    try {
      const cookie = req.headers.cookie;
      if (!cookie || cookie === undefined) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      const parsedCookie = parseCookie(cookie);
      const token = parsedCookie.accessToken;
      if (token === undefined) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const payload = await verifyAccessToken(token);

      await validateSession(payload);

      if (!payload.sessionId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      (req as AuthenticatedUpgradeRequest).user = {
        userId: payload.userId,
        username: payload.username,
        sessionId: payload.sessionId,
      };
      websocketServer.handleUpgrade(req, socket, head, (ws) => {
        websocketServer.emit("connection", ws, req);
      });
    } catch (err) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
  });

  return server;
}