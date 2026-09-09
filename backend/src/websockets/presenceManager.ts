import { WebSocket } from "ws";
import { WebSocketMessage } from "./types/websocketMessage";
import { PresenceSchema } from "./schema/presence";
import { sendWs, WsResponse } from "./utility/wsResponse";
import { StatusCodes } from "http-status-codes";
import { formatValidationError } from "./utility/error";
import { connectionManager } from "./connectionManager";
import { subscriptionManager } from "./subscriptionManager";
import { workspaceRepository } from "../modules/Workspace/workspace.repository";
import { WsEvent } from "./types/events";

class PresenceHandler {

    public currentWorkspace = new Map<WebSocket, string>();
    public userConnections = new Map<string, Set<WebSocket>>();

    async registerConnection(ws: WebSocket, message: WebSocketMessage) {

        const userMetadata = connectionManager.getMetadata(ws)
        if (userMetadata === undefined) {
            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Unauthenticated user, please login first"
                )
            )
            return;
        }
        const { userId, username } = userMetadata
        const presencePayload = PresenceSchema.safeParse(message.payload)

        if (!presencePayload.success) {
            sendWs(ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    formatValidationError(presencePayload.error)
                ))
            return
        }

        const { workspaceId } = presencePayload.data

        const member = await workspaceRepository.memberExists(userMetadata.userId, workspaceId)
        if (!member) {
            sendWs(
                ws,
                WsResponse.fail(
                    message.type,
                    StatusCodes.FORBIDDEN,
                    "FORBIDDEN",
                    "You are not a member of the workspace"
                )
            )
            return
        }

        const previousWorkspaceId = this.currentWorkspace.get(ws)

        if (previousWorkspaceId !== workspaceId) {
            if (previousWorkspaceId) {
                const previousSockets = this.userConnections.get(previousWorkspaceId)
                previousSockets?.delete(ws)
                if (previousSockets && previousSockets.size === 0) {
                    this.userConnections.delete(previousWorkspaceId)
                }
                subscriptionManager.removeSocket(ws)
                
                this.notifyOffline(previousWorkspaceId, userId, username)

            }

            this.currentWorkspace.set(ws, workspaceId)

            let connections = this.userConnections.get(workspaceId)

            if (!connections) {
                connections = new Set<WebSocket>();
                this.userConnections.set(workspaceId, connections);
            }

            connections.add(ws)

            sendWs(
                ws,
                WsResponse.ok(message.type, "OK", StatusCodes.OK, {
                    workspaceId,
                    online: this.getRoster(workspaceId),
                })
            )

            this.broadcastToWorkspace(
                workspaceId,
                { workspaceId, userId, username, status: "online" },
                ws
            )
        }
    }

    removeConnection(ws: WebSocket): string | undefined {

        const previousWorkspaceId = this.currentWorkspace.get(ws)

        if (previousWorkspaceId) {
            const connections = this.userConnections.get(previousWorkspaceId)
            connections?.delete(ws)
            if (connections && connections.size === 0) {
                this.userConnections.delete(previousWorkspaceId)
            }
        }

        this.currentWorkspace.delete(ws)

        return previousWorkspaceId

    }

    notifyOffline(workspaceId: string, userId: string, username?: string): void {
        if (!this.isUserOnlineInWorkspace(workspaceId, userId)) {

            this.broadcastToWorkspace(
                workspaceId,
                { workspaceId, userId, username, status: "offline" }
            )
        }
    }

    getWorkspace(ws: WebSocket): string | undefined {
        return this.currentWorkspace.get(ws)
    }

    getOnlineSockets(workspaceId: string): ReadonlySet<WebSocket> | undefined {
        return this.userConnections.get(workspaceId)
    }

    isUserOnlineInWorkspace(workspaceId: string, userId: string): boolean {
        const connections = this.userConnections.get(workspaceId)
        if (!connections) {
            return false
        }
        for (const socket of connections) {
            if (connectionManager.getMetadata(socket)?.userId === userId) {
                return true
            }
        }
        return false
    }

    private broadcastToWorkspace(workspaceId: string, data: unknown, excludeWs?: WebSocket): void {
        const connections = this.userConnections.get(workspaceId)
        if (!connections) {
            return
        }
        const response = WsResponse.ok(WsEvent.PresenceUpdate, "OK", StatusCodes.OK, data)
        for (const socket of connections) {
            if (socket !== excludeWs) {
                sendWs(socket, response)
            }
        }
    }

    private getRoster(workspaceId: string): { userId: string; username: string }[] {
        const connections = this.userConnections.get(workspaceId)
        if (!connections) {
            return []
        }
        const roster = new Map<string, string>()
        for (const socket of connections) {
            const metadata = connectionManager.getMetadata(socket)
            if (metadata && !roster.has(metadata.userId)) {
                roster.set(metadata.userId, metadata.username ?? "unknown")
            }
        }
        return Array.from(roster, ([userId, username]) => ({ userId, username }))
    }


}


export const presenceHandler = new PresenceHandler()