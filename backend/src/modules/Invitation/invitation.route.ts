import {Router} from "express"
import { verifyJwt } from "../../middlewares/verifyJwt"
import {createWorkspaceInvite} from "./invitation.controller"

const inviteRouter = Router()



inviteRouter.route("/workspace/:id/invites").post(verifyJwt,createWorkspaceInvite)



export  {inviteRouter}