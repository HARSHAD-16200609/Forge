import { Router } from "express";
import { addUserToWorkspace, createWorkspace, getWorkspaces } from "./workspace.controller";
import { verifyJwt } from "../../middlewares/verifyJwt";





const workspaceRouter = Router()

workspaceRouter.route("/create/workspace").post(verifyJwt,createWorkspace)
workspaceRouter.route("/get/workspaces").get(verifyJwt,getWorkspaces)
workspaceRouter.route("/addUser/workspace/:id").post(verifyJwt,addUserToWorkspace)





export  {workspaceRouter}