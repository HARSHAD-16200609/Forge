import { WebSocket, WebSocketServer } from "ws";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedUpgradeRequest } from "./types/auth";
import { connectionManager } from "./connectionManager";
import { eventRouter } from "./eventRouter";
import { presenceHandler } from "./presenceManager";
import { parseEnvelope } from "./schema/envelope";
import { WsEvent } from "./types/events";
import { subscriptionManager } from "./subscriptionManager";
import { sendWs, WsResponse } from "./utility/wsResponse";
import { loggers } from "../utility/logger/serviceLoggers";



export const websocketServer = new WebSocketServer({
    noServer: true,
});


websocketServer.on("connection", (ws: WebSocket, req: AuthenticatedUpgradeRequest) => {
const metadata = {
        userId: req.user.userId,
        username: req.user.username,
        sessionId: req.user.sessionId,
        connectedAt: new Date(),
        lastSeenAt : new Date()
    }
    connectionManager.registerConnection(ws, metadata)

    sendWs(ws, WsResponse.ok(WsEvent.Pong, "Connected to server"))

    ws.on("message", (data) => {
        connectionManager.updateActivity(ws);

        const wsMessage = parseEnvelope(data.toString())

        if (!wsMessage.success) {
            sendWs(
                ws,
                WsResponse.fail(
                    WsEvent.error,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    wsMessage.error.toString()
                )
            )
            return
        }

        eventRouter.dispatch(ws, wsMessage.data)

    })

    ws.on("error", (error) => {
        loggers.audit.error("WS_SOCKET_ERROR", {
            userId: connectionManager.getMetadata(ws)?.userId,
            sessionId: connectionManager.getMetadata(ws)?.sessionId,
            error: error.message,
        });
    });

    ws.on("close", () => {
        const closedMetadata = connectionManager.getMetadata(ws);
        const closedUserId = closedMetadata?.userId;
        const closedUsername = closedMetadata?.username;
        const closedSessionId = closedMetadata?.sessionId;

        try {
            subscriptionManager.removeSocket(ws);
            const previousWorkspaceId = presenceHandler.removeConnection(ws);
            connectionManager.removeConnection(ws);

            if (previousWorkspaceId && closedUserId ) {
                presenceHandler.notifyOffline(previousWorkspaceId, closedUserId, closedUsername);
            }

            loggers.audit.info("WS_CONNECTION_CLOSED", {
                userId: closedUserId,
                sessionId: closedSessionId,
            });
        } catch (error) {
            loggers.audit.error("WS_CONNECTION_CLEANUP_FAILED", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    })

})