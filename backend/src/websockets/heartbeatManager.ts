import { connectionManager } from "./connectionManager";

const SWEEP_INTERVAL_MS = 30_000;
const STALE_TIMEOUT_MS = 60_000;

class HeartbeatManager {

    private timer: NodeJS.Timeout | undefined = undefined;

    start(intervalMs: number = SWEEP_INTERVAL_MS, timeoutMs: number = STALE_TIMEOUT_MS): void {
        if (this.timer) {
            return;
        }
        this.timer = setInterval(() => {
            this.checkSockets(timeoutMs);
        }, intervalMs);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    checkSockets(timeoutMs: number): void {
        const now = Date.now();
        for (const socket of connectionManager.getAllConnections()) {
            const metadata = connectionManager.getMetadata(socket);
            if (metadata && now - metadata.lastSeenAt.getTime() > timeoutMs) {
                socket.terminate();
            }
        }
    }
}

export const heartbeatManager = new HeartbeatManager();