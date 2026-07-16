import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { createDM, createGDM, editMessage, getConversation, getConversations, getMessages, postMessage, postReaction, postReply } from "./conversations.controller";
import upload from "../../middlewares/multer.midleware";


const conversationRouter = Router()


conversationRouter.route("/conversations").post(verifyJwt, createDM)
conversationRouter.route("/conversations").get(verifyJwt, getConversations)
conversationRouter.route("/conversations/:id/messages").post(verifyJwt, upload.array("attachments", 10), postMessage)
conversationRouter.route("/conversations/:id").get(verifyJwt, getConversation)
conversationRouter.route("/conversations/:id/messages").get(verifyJwt, getMessages)
conversationRouter.route("/conversations/:conversationId/messages/:messageId").patch(verifyJwt, editMessage)
conversationRouter.route("/conversations/:conversationId/messages/:messageId").post(verifyJwt, postReply)
conversationRouter.route("/conversations/:conversationId/messages/:messageId/reactions").post(verifyJwt, postReaction)
conversationRouter.route("/workspaces/:id/conversations/groups").post(verifyJwt, createGDM)









export { conversationRouter }