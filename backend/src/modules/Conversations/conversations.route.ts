import { Router } from "express";
import { verifyJwt } from "../../middlewares/verifyJwt";
import { createDM } from "./conversations.controller";

const conversationRouter = Router()


conversationRouter.route("/conversations").post(verifyJwt,createDM)

export {conversationRouter}