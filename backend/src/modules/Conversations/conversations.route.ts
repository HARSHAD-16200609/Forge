import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { addMembers, createDM, createGDM, getConversation, getConversations, getMessages, leaveGroup, removeMembers, renameGDM } from "./conversations.controller";


const conversationRouter = Router()


conversationRouter.route("/workspaces/:id/conversations").post(verifyJwt, createDM)
conversationRouter.route("/workspaces/:id/conversations/groups").post(verifyJwt, createGDM)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId").patch(verifyJwt, renameGDM)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/members").post(verifyJwt, addMembers)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/members").delete(verifyJwt, removeMembers)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/leave").delete(verifyJwt, leaveGroup)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId").get(verifyJwt, getConversation)
conversationRouter.route("/workspaces/:workspaceId/conversations/:conversationId/messages").get(verifyJwt, getMessages)
conversationRouter.route("/workspaces/:id/conversations").get(verifyJwt, getConversations)




export { conversationRouter }