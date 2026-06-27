import { loggers } from "../../utility/logger/serviceLoggers"
import { reqUserSchema } from "../../db/auth-schema"
import {  idSchema, emailSchema } from "../../db/workspace"
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse"
import { UserInputValidationError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors"
import StatusCodes from "http-status-codes"
import { inviteService } from "./invitation.service"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler"



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

