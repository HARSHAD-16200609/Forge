import { WebSocket } from "ws";
import { StatusCodes } from "http-status-codes";
import { WsEvent } from "../types/events";

export interface WsErrorBody {
    code: string;
    errorMessage: string;
}

export class WsResponse {

    public readonly type: WsEvent;
    public readonly success: boolean;
    public readonly message?: string;
    public readonly statusCode: number;
    public readonly error?: WsErrorBody;

    constructor(statusCode: number, type: WsEvent, success: boolean, message?: string, error?: WsErrorBody) {
        this.statusCode = statusCode;
        this.type = type;
        if (error !== undefined) {
            this.error = error;
        }
        this.message = message || (error !== undefined ? "An error occurred" : "OK");
        this.success = error !== undefined ? false : success;
    }

    static ok(type: WsEvent, message = "OK", statusCode = StatusCodes.OK): WsResponse {
        return new WsResponse(statusCode, type, true, message);
    }

    static fail(type: WsEvent, statusCode: number, code: string, errorMessage: string): WsResponse {
        return new WsResponse(statusCode, type, false, errorMessage, { code, errorMessage });
    }
}

export function sendWs(ws: WebSocket, response: WsResponse): void {
    if (ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify(response));
}