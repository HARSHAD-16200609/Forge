import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { createDM, getConversations } from "./conversations.controller";

const conversationRouter = Router()


conversationRouter.route("/conversations").post(verifyJwt,createDM)
conversationRouter.route("/conversations").get(verifyJwt,getConversations)


export {conversationRouter}