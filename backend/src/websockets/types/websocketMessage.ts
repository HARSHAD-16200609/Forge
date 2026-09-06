import { WsEvent } from "./events";

export interface WebSocketMessage<T = unknown> {
    type: WsEvent;
    payload: T;
}