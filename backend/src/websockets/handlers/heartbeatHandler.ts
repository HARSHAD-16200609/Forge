import { WebSocket } from "ws";
import { WebSocketMessage } from "../types/websocketMessage";
import { sendWs, WsResponse } from "../utility/wsResponse";
import { WsEvent } from "../types/events";
import { StatusCodes } from "http-status-codes";

async function ping(
    ws: WebSocket,
    message: WebSocketMessage
): Promise<void> {
    const timestamp =
        message.payload &&
        typeof message.payload === "object" &&
        "timestamp" in message.payload &&
        typeof message.payload.timestamp === "number"
            ? message.payload.timestamp
            : undefined;

    sendWs(
        ws,
        WsResponse.ok(
            WsEvent.Pong,
            "OK",
            StatusCodes.OK,
            timestamp === undefined
                ? { serverTime: Date.now() }
                : { timestamp, serverTime: Date.now() }
        )
    );
}

export const heartbeatHandler = { ping }