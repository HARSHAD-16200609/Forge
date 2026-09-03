import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { deleteAttachment, deleteMessage, editMessage, getConvoMessages, getMessage, getMessages, postMessage, postReaction, postReply } from "./message.controller";
import upload from "../../middlewares/multer.midleware";
const messageRouter = Router()


messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").post(verifyJwt, upload.array("attachments", 10), postMessage)
messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").get(verifyJwt, getMessages)
messageRouter.route("/workspace/:workspaceId/channel/:channelId/messages").get(verifyJwt,getConvoMessages)

messageRouter.route("/messages/:id").get(verifyJwt, getMessage)
messageRouter.route("/messages/:id").patch(verifyJwt, editMessage)
messageRouter.route("/messages/:id").delete(verifyJwt, deleteMessage)
messageRouter.route("/messages/:id/replies").post(verifyJwt, upload.array("attachments", 10), postReply)
messageRouter.route("/messages/:id/reactions").post(verifyJwt, postReaction)
messageRouter.route("/messages/:id/uploads").delete(verifyJwt,deleteAttachment)



export { messageRouter }




// GET    /messages/:messageId
// PATCH  /messages/:messageId
// DELETE /messages/:messageId