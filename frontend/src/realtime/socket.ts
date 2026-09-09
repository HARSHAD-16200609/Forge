import { env } from "@/lib/env";
import type { WsEnvelope, WsResponse } from "@/features/Messages/types";

export type ConnectionStatus = "idle" | "connecting" | "open" | "reconnecting" | "closed";

type FrameListener = (frame: WsResponse) => void;
type StatusListener = (status: ConnectionStatus) => void;

const PING_INTERVAL_MS = 25_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

class RealtimeSocket {
    private ws: WebSocket | null = null;
    private status: ConnectionStatus = "idle";
    private frameListeners = new Set<FrameListener>();
    private statusListeners = new Set<StatusListener>();
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private queue: WsEnvelope[] = [];
    private manualClose = false;

    reconnectAttempts = 0;

    get connectionStatus(): ConnectionStatus {
        return this.status;
    }

    onFrame(listener: FrameListener): () => void {
        this.frameListeners.add(listener);
        return () => this.frameListeners.delete(listener);
    }

    onStatus(listener: StatusListener): () => void {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    connect(): void {
        if (this.status === "connecting" || this.status === "open") return;

        this.manualClose = false;
        this.reconnectAttempts = 0;
        this.open();
    }

    disconnect(): void {
        this.manualClose = true;
        this.stopPing();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        const ws = this.ws;
        this.ws = null;
        if (ws) {
            ws.onclose = null;
            ws.close();
        }
        this.queue = [];
        this.setStatus("idle");
    }

    send(type: WsEnvelope["type"], payload: unknown): boolean {
        if (this.status !== "open" || !this.ws) return false;
        this.ws.send(JSON.stringify({ type, payload } satisfies WsEnvelope));
        return true;
    }

    sendQueued(type: WsEnvelope["type"], payload: unknown): void {
        if (this.send(type, payload)) return;
        this.queue.push({ type, payload } satisfies WsEnvelope);
    }

    private open(): void {
        this.setStatus(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

        let ws: WebSocket;
        try {
            ws = new WebSocket(env.wsUrl);
        } catch {
            this.scheduleReconnect();
            return;
        }

        this.ws = ws;

        ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.startPing();
            this.setStatus("open");
            this.flushQueue();
        };

        ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        ws.onclose = () => {
            this.handleClose();
        };

        ws.onerror = () => {
            // close event follows; nothing to do here
        };
    }

    private handleMessage(raw: unknown): void {
        if (typeof raw !== "string") return;

        let frame: WsResponse;
        try {
            frame = JSON.parse(raw) as WsResponse;
        } catch {
            return;
        }

        if (!frame || typeof frame.type !== "string") return;

        // The backend has no server-initiated ping; keep a defensive pong in case it adds one.
        if (frame.type === "ping") {
            this.send("pong", {
                timestamp:
                    frame.data && typeof frame.data === "object" && "timestamp" in frame.data
                        ? frame.data.timestamp
                        : Date.now(),
            });
        }

        for (const listener of this.frameListeners) listener(frame);
    }

    private flushQueue(): void {
        if (this.status !== "open" || !this.ws) return;
        while (this.queue.length > 0) {
            const envelope = this.queue.shift();
            if (!envelope) continue;
            this.ws.send(JSON.stringify(envelope));
        }
    }

    private handleClose(): void {
        this.stopPing();
        this.ws = null;

        if (this.manualClose) {
            this.setStatus("closed");
            return;
        }

        this.scheduleReconnect();
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;

        this.setStatus("reconnecting");

        const wait = Math.min(
            BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts,
            MAX_RECONNECT_DELAY_MS,
        );
        const jitter = Math.random() * 400;
        this.reconnectAttempts += 1;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.open();
        }, wait + jitter);
    }

    private startPing(): void {
        this.stopPing();
        this.pingTimer = setInterval(() => {
            this.send("ping", { timestamp: Date.now() });
        }, PING_INTERVAL_MS);
    }

    private stopPing(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    private setStatus(status: ConnectionStatus): void {
        this.status = status;
        for (const listener of this.statusListeners) listener(status);
    }
}

export const realtimeSocket = new RealtimeSocket();