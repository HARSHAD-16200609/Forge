import { WebSocket, WebSocketServer } from "ws";
import { AuthenticatedUpgradeRequest } from "./types";
import { connectionManager } from "./connectionManager";
import { webcrypto } from "node:crypto";



export const websocketServer = new WebSocketServer({
    noServer: true,
});


websocketServer.on("connection", (ws: WebSocket, req: AuthenticatedUpgradeRequest) => {
    const metadata = {
        userId: req.user.userId,
        sessionId: req.user.sessionId,
        connectedAt: new Date()
    }
    connectionManager.registerConnection(ws, metadata)
    ws.send("Hi From Server !!!!")


    ws.on("message", (data) => {
      
        const metadata = connectionManager.getMetadata(ws)

        ws.send("Hii "+metadata?.userId + " u are our first connection this is your first message "+data.toString())

    })

    websocketServer.on("close", () => {
        console.log("Client Disconnected")
    })


})

