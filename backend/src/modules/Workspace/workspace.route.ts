import { Router } from "express";
import { addUserToWorkspace, createWorkspace, deleteWSMember, getAllMembers, getAllWorkspaces, getWorkspace, updateRole } from "./workspace.controller";
import { verifyJwt } from "../../middlewares/verifyJwt";





const workspaceRouter = Router()

workspaceRouter.route("/workspace").post(verifyJwt,createWorkspace)
workspaceRouter.route("/workspaces").get(verifyJwt,getAllWorkspaces)
workspaceRouter.route("/workspace/:id").post(verifyJwt,addUserToWorkspace)
workspaceRouter.route("/workspace/:id").get(verifyJwt,getWorkspace)
workspaceRouter.route("/workspace/:id/members").get(verifyJwt,getAllMembers)
workspaceRouter.route("/workspace/:workspaceId/member/:memberId").delete(verifyJwt,deleteWSMember)
workspaceRouter.route("/workspace/:workspaceId/member/:memberId").patch(verifyJwt,updateRole)











export  {workspaceRouter}