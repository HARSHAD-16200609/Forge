import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { addMembers, createDM, createGDM, editMessage, getConversation, getConversations, getMessages, leaveGroup, postMessage, postReaction, postReply, removeMembers, renameGDM } from "./conversations.controller";
import upload from "../../middlewares/multer.midleware";


const conversationRouter = Router()


conversationRouter.route("/workspaces/:id/conversations").post(verifyJwt, createDM)
conversationRouter.route("/workspaces/:id/conversations/groups").post(verifyJwt, createGDM)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId").patch(verifyJwt, renameGDM)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/members").post(verifyJwt, addMembers)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/members").delete(verifyJwt, removeMembers)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/leave").delete(verifyJwt, leaveGroup)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/messages").post(verifyJwt, upload.array("attachments", 10), postMessage)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId").get(verifyJwt, getConversation)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/messages").get(verifyJwt, getMessages)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/messages/:messageId").patch(verifyJwt, editMessage)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/messages/:messageId").post(verifyJwt, postReply)
conversationRouter.route("/workspaces/:id/conversations").get(verifyJwt, getConversations)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/messages/:messageId/reactions").post(verifyJwt, postReaction)





export { conversationRouter }