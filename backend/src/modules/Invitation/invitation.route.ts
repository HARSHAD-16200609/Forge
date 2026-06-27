import {Router} from "express"
import { verifyJwt } from "../../middlewares/verifyJwt"
import {acceptInvite, createWorkspaceInvite, listAllInvites} from "./invitation.controller"

const inviteRouter = Router()



inviteRouter.route("/workspace/:id/invites").post(verifyJwt,createWorkspaceInvite)
inviteRouter.route("/workspace/sent/invites").get(verifyJwt,listAllInvites)
inviteRouter.route("/workspace/received/invites").get(verifyJwt,listAllInvites)
inviteRouter.route("/invites/:id/accept").post(verifyJwt,acceptInvite)




export  {inviteRouter}