import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { getMessages, postMessage } from "./message.controller";
const messageRouter = Router()


messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").post(verifyJwt,postMessage)
messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").get(verifyJwt,getMessages)

export {messageRouter}