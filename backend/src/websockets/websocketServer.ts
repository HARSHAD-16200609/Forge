import { WebSocket, WebSocketServer } from "ws";
import { AuthenticatedUpgradeRequest } from "./types/auth";
import { connectionManager } from "./connectionManager";
import { eventRouter } from "./eventRouter";
import { parseEnvelope } from "./schema/envelope";



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

        const wsMessage = parseEnvelope(data.toString())
        
        if(!wsMessage.success){
            ws.send(JSON.stringify({
                type: "error",
                payload: {
                    message: wsMessage.error
                }
            }))
            return
        }

        eventRouter.dispatch(ws, wsMessage.data)

    })

    websocketServer.on("close", () => {
        console.log("Client Disconnected")
    })


})

