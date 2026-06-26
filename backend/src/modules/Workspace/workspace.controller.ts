import { loggers } from "../../utility/logger/serviceLoggers";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { workspaceService } from "./workspace.service";
import { StatusCodes, UNAUTHORIZED } from "http-status-codes";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { idSchema, roleSchema, workspaceMemberInputSchema, workspaceSchema, wsMemberDeleteUpdateSchema } from "../../db/workspace";
import { BadRequestError, ForbiddenError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { reqUserSchema } from "../../db/auth-schema";
import { id } from "zod/locales";
import { Role } from "../../../generated/prisma/enums";



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
        userAgent: req.get("user-agent"),
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),

    })


    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, workspace, "Workspace Created sucessfully..."))

})

export const getAllWorkspaces = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

    const ws = await workspaceService.getAllWorkspaces(User.data)

    loggers.db.info("Workspace's Successfully Fetched", {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        fetecehdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
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
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
    })

    const data = {
        username: membership.user.username,
        worksspaceName: membership.workspace.workspaceName,
        role: membership.role
    }
    return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, data, "User Added To the Workspace Successfully"))


})

export const getWorkspace = asyncHandler(async (req, res) => {
    const result = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    if (!result.success) throw new UnauthorizedAccessError("Invalid WorkspaceId")
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

    const workspace = await workspaceService.getWorkspace(result.data.id, User.data.userId)

    loggers.db.info("workspace fetched sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        wsId: workspace?.id,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, workspace ?? {}, "Workspace Fetched Sucessfully"))
})

export const getAllMembers = asyncHandler(async (req, res) => {
    const result = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    if (!result.success) throw new UnauthorizedAccessError("Invalid WorkspaceId")
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")

    const members = await workspaceService.getAllMembers(result.data.id, User.data.userId)

    loggers.db.info("Ws Members fetched Sucessfully ...", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        wsId: result.data.id,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, members ?? {}, "Workspace Members Fetched Sucessfully"))


})

export const deleteWSMember = asyncHandler(async (req, res) => {
    const Requester = reqUserSchema.safeParse(req.user)
    const User = wsMemberDeleteUpdateSchema.safeParse(req.params)

    if (!Requester.success) throw new UserInputValidationError("validation-error please check your Entered details", Requester.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("validation-error please check your Entered details", User.error.flatten().fieldErrors)

    await workspaceService.deleteWSMember(User.data, Requester.data.userId)

    loggers.db.info("User deleted Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        wsId: User.data.workspaceId,
        deletedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    return res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, {}, "Member Deleted Sucessfully"))


})

export const updateRole = asyncHandler(async (req, res) => {
    const User = wsMemberDeleteUpdateSchema.safeParse(req.params)
    const updatedRole = roleSchema.safeParse(req.body)
    const Requester = reqUserSchema.safeParse(req.user)
    if (!User.success) throw new UserInputValidationError("Invalid UserId or WorkspaceId", User.error.flatten().fieldErrors)
    if (!updatedRole.success) throw new UserInputValidationError("Invalid UserId or WorkspaceId", updatedRole.error.flatten().fieldErrors)
    if (!Requester.success) throw new UserInputValidationError("validation-error please check your Entered details", Requester.error.flatten().fieldErrors)


    const updatedUser = await workspaceService.updateRole(User.data, updatedRole.data.role,Requester.data.userId)

    loggers.db.info("Role Updated Sucecssfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        wsId: User.data.workspaceId,
        updated: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {updatedUser}, "User Role Updated Successfully..."))

})