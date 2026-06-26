import { Router } from "express";
import { addUserToWorkspace, createWorkspace, deleteWSMember, getAllMembers, getAllWorkspaces, getWorkspace, updateRole } from "./workspace.controller";
import { verifyJwt } from "../../middlewares/verifyJwt";





const workspaceRouter = Router()

workspaceRouter.route("/create/workspace").post(verifyJwt,createWorkspace)
workspaceRouter.route("/get/workspaces").get(verifyJwt,getAllWorkspaces)
workspaceRouter.route("/addUser/workspace/:id").post(verifyJwt,addUserToWorkspace)
workspaceRouter.route("/get/workspace/:id").get(verifyJwt,getWorkspace)
workspaceRouter.route("/get/workspace/:id/members").get(verifyJwt,getAllMembers)
workspaceRouter.route("/get/workspace/:workspaceId/member/:userId").delete(verifyJwt,deleteWSMember)
workspaceRouter.route("/update/workspace/:workspaceId/member/:userId").patch(verifyJwt,updateRole)











export  {workspaceRouter}