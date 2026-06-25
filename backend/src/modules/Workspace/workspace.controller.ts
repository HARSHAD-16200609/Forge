import { loggers } from "../../utility/logger/serviceLoggers";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { workspaceService } from "./workspace.service";
import { StatusCodes, UNAUTHORIZED } from "http-status-codes";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import {  idSchema, workspaceMemberInputSchema, workspaceSchema } from "../../db/workspace";
import { BadRequestError, ForbiddenError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { reqUserSchema } from "../../db/auth-schema";



export const createWorkspace = asyncHandler(async (req, res) => {
      const result = workspaceSchema.safeParse(req.body)
 const User = reqUserSchema.safeParse(req.user)
        if (!result.success) {

            throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)
        }
          if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

    const workspace = await workspaceService.createWorkspace(result.data, User.data)



    loggers.db.info("Workspace Created", {
        workspace: workspace.workspaceName,
        ip: req.ip,
        createdAt: new Date(),
        userAgent: req.get("user-agent"),

    })


    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, workspace, "Workspace Created sucessfully..."))

})

export const getWorkspaces = asyncHandler(async (req, res) => {
const User = reqUserSchema.safeParse(req.user)
     if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

    const ws = await workspaceService.getAllWorkspaces(User.data)

    loggers.db.info("Workspace's Successfully Fetched", {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        fetecehdAt: new Date()
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, ws ?? {}, "User's Workspaces Fetched Sucessfully..."))
})


export const addUserToWorkspace = asyncHandler(async (req, res) => {
    const UserResult = workspaceMemberInputSchema.safeParse(req.body)

    const wsIdResult = idSchema.safeParse(req.params)

    const User = reqUserSchema.safeParse(req.user)

    if (!UserResult.success) throw new UserInputValidationError("validation-error please check your Entered details", UserResult.error.flatten().fieldErrors)


    if (!wsIdResult.success) throw new BadRequestError("Invalid WorksapceId")


    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")


    const membership = await workspaceService.addUserToWorkspace({ ...UserResult.data, workspaceId: wsIdResult.data.id, }, User.data.userId)


    loggers.db.info("User Added To Workspace", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        createdAt: new Date(),
    })

    const data = {
        username : membership.user.username,
        worksspaceName : membership.workspace.workspaceName,
        role:membership.role
    }
    return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, data, "User Added To the Workspace Successfully"))


})

export const getWorkspace = asyncHandler(async(req,res)=>{
    const result = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
        if (!result.success) throw new UnauthorizedAccessError("Invalid WorkspaceId")
             if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

            const workspace = await workspaceService.getWorkspacebyId(result.data.id,User.data.userId)

        loggers.db.info("workspace fetched sucessfully",{
            ip : req.ip,
            userAgent : req.get("user-agent"),
            wsId : workspace?.id,
            fetchedAt : new Date()
        })

         return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK,workspace ?? {},"Workspace Fetched Sucessfully"))
})

export const getWorkspaceMembers = asyncHandler(async(req,res)=>{
    const result = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
  if (!result.success) throw new UnauthorizedAccessError("Invalid WorkspaceId")
             if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

                const members = await workspaceService.getwsMembers(result.data.id,User.data.userId)

               loggers.db.info("Ws Members fetched Sucessfully ...",{
             ip : req.ip,
            userAgent : req.get("user-agent"),
            wsId :result.data.id,
            fetchedAt : new Date()
               })

 return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK,members ?? {},"Workspace Members Fetched Sucessfully"))


})