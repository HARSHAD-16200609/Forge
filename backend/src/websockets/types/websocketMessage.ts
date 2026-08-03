import { WsEvent } from "./events";

export interface WebSocketMessage<T = unknown> {
    type: WsEvent;
    payload: T;
}

export interface WsResponse<T = unknown> {
    type: WsEvent;
    success: boolean;
    payload?: T;
    error?: {
        code: string;
        message: string;
    };
}

