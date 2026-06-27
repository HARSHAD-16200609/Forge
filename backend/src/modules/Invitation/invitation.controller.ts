import { loggers } from "../../utility/logger/serviceLoggers"
import { reqUserSchema } from "../../db/auth-schema"
import {  idSchema, emailSchema } from "../../db/workspace"
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse"
import { UserInputValidationError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors"
import StatusCodes from "http-status-codes"
import { inviteService } from "./invitation.service"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler"
import { inviteTypeSchema } from "../../db/invitation.schema"




 export const createWorkspaceInvite = asyncHandler(async (req, res) => {
    const Workspace = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    const Email = emailSchema.safeParse(req.body)
    if (!Workspace.success) throw new UserInputValidationError("Invalid Credentials", Workspace.error.flatten().fieldErrors)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!Email.success) throw new UserInputValidationError("Invalid Credentials", Email.error.flatten().fieldErrors)

    const Invite = {
        workspaceId: Workspace.data.id,
        actorId: User.data.userId,
        email: Email.data.email
    }


    const invite = await inviteService.createWorkspaceInvite(Invite)

    loggers.db.log("User Ivited Created SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        inviteId: invite?.id,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, invite ?? {}, "Workspace Invite Created Sucessfully"))


})

export const listAllInvites = asyncHandler(async(req,res)=>{
    const User = reqUserSchema.safeParse(req.user)
    const inviteType = inviteTypeSchema.safeParse(req.query)
    if(!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if(!inviteType.success) throw new UserInputValidationError("Please Enter an valid inviteType",inviteType.error.flatten().fieldErrors)   

        const invites = await inviteService.listAllInvites(User.data.userId,inviteType.data.type)

        loggers.db.info("List of Invites fetched Sucessfully",{
                ip: req.ip,
        userAgent: req.get("user-agent"),
        userId : User.data.userId,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
        })


        res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK,invites ?? {},"List of Invites fetched Sucessfully"))
})

export const acceptInvite = asyncHandler(async(req,res)=>{
    const User = reqUserSchema.safeParse(req.user)
    const Invite = idSchema.safeParse(req.params)
    if(!User.success) throw new UserInputValidationError("Invalid Token",User.error.flatten().fieldErrors)
     if(!Invite.success) throw new UserInputValidationError("Invalid UserID",Invite.error.flatten().fieldErrors)

        const acceptedInvite = await inviteService.acceptInvite(User.data.userId,Invite.data.id)

        loggers.db.info("User Accepted the Invite",{
                        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId : User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
        })

        res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK,acceptedInvite ?? {} , "Invite Accepted Succesfully"))

})