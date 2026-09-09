import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { deleteAttachment, getConvoMessages, getMessage, getMessages } from "./message.controller";
const messageRouter = Router()


messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").get(verifyJwt, getMessages)
messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").get(verifyJwt,getConvoMessages)

messageRouter.route("/messages/:id").get(verifyJwt, getMessage)
messageRouter.route("/messages/:id/uploads").delete(verifyJwt,deleteAttachment)



export { messageRouter }