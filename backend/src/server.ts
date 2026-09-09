import { env } from "./config/env"
import { createRealtimeServer } from "./createRealtimeServer";
import { heartbeatManager } from "./websockets/heartbeatManager";

const PORT = Number(env.PORT) || 8000;

const server = createRealtimeServer();


server.listen(PORT, () => {
  heartbeatManager.start();
  console.log(`🚀 Server running on port ${PORT}`);
});

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