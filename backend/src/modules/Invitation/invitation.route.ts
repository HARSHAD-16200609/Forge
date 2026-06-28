import {Router} from "express"
import { verifyJwt } from "../../middlewares/verifyJwt"
import {acceptInvite, cancelInvite, createWorkspaceInvite, listAllInvites, rejectInvite} from "./invitation.controller"

const inviteRouter = Router()



inviteRouter.route("/workspace/:id/invites").post(verifyJwt,createWorkspaceInvite)
inviteRouter.route("/workspace/sent/invites").get(verifyJwt,listAllInvites)
inviteRouter.route("/workspace/received/invites").get(verifyJwt,listAllInvites)
inviteRouter.route("/invites/:id/accept").post(verifyJwt,acceptInvite)
inviteRouter.route("/invites/:id/reject").post(verifyJwt,rejectInvite)
inviteRouter.route("/invites/:id/cancel").post(verifyJwt,cancelInvite)






export  {inviteRouter}