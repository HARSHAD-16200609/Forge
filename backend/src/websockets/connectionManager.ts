import { WebSocket } from "ws";
import { ConnectionMetadata } from "./types";

class ConnectionManager {

    private userConnections = new Map<string, Set<WebSocket>>();

    private connectionMetadata = new Map<WebSocket, ConnectionMetadata>();

    registerConnection(
        ws: WebSocket,
        metadata: ConnectionMetadata
    ): void {

        this.connectionMetadata.set(ws, metadata);

        let connections = this.userConnections.get(metadata.userId);

        if (!connections) {
            connections = new Set<WebSocket>();
            this.userConnections.set(metadata.userId, connections);
        }

        connections.add(ws);
    }

    removeConnection(ws: WebSocket): void {
        const metadata = this.connectionMetadata.get(ws);

        if (!metadata) {
            return;
        }

        const connections = this.userConnections.get(metadata.userId);

        if (connections) {
            connections.delete(ws);

            if (connections.size === 0) {
                this.userConnections.delete(metadata.userId);
            }
        }

        this.connectionMetadata.delete(ws);
    }

    getConnections(userId: string): ReadonlySet<WebSocket> | undefined {
        return this.userConnections.get(userId);
    }

    getMetadata(ws: WebSocket): ConnectionMetadata | undefined {
        return this.connectionMetadata.get(ws);
    }

    isUserOnline(userId: string): boolean {
        return this.userConnections.has(userId);
    }

    getConnectionCount(userId: string): number {
        return this.userConnections.get(userId)?.size ?? 0;
    }
}

export const connectionManager = new ConnectionManager();