import http from "http";
import app from "./app";
import { env } from "./config/env"
import { websocketServer } from "./websockets/websocketServer";
import { UnauthorizedAccessError } from "./utility/errorHandling/customErrors";
import { parseCookie } from "cookie"
import { validateSession, verifyAccessToken } from "./utility/auth/jwt";
import { AuthenticatedUpgradeRequest, AuthenticatedUser } from "./websockets/types";

const PORT = Number(env.PORT) || 8000;

const server = http.createServer(app)


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on("upgrade", async (req, socket, head) => {
  try {

    const cookie = req.headers.cookie;
    if (!cookie || cookie == undefined) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\n\r\n"
      );
      socket.destroy();
      return;
    }
    const parsedCookie = parseCookie(cookie)
    const token = parsedCookie.accessToken;
    if (token === undefined) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\n\r\n"
      );
      socket.destroy();
      return;
    }

    const payload = await verifyAccessToken(token)

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

      websocketServer.emit("connection", ws, req)

    })
  }
  catch (err) {
    socket.write(
      "HTTP/1.1 401 Unauthorized\r\n\r\n"
    );
    socket.destroy();
    return;
  }




})

const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forcefully shutting down...");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  server.close(() => process.exit(1));
});