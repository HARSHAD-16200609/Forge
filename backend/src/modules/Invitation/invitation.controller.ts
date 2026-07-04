import { loggers } from "../../utility/logger/serviceLoggers"
import { reqUserSchema } from "../../db/auth-schema"
import { idSchema, emailSchema } from "../../db/workspace"
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse"
import { UserInputValidationError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors"
import StatusCodes from "http-status-codes"
import { inviteService } from "./invitation.service"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler"
import { inviteTypeSchema } from "../../db/invitation.schema"
import { ChannelInviteSchema, ChannelParamsSchema } from "../../db/channel.schema"




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

export const listAllInvites = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const inviteType = inviteTypeSchema.safeParse(req.query)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!inviteType.success) throw new UserInputValidationError("Please Enter an valid inviteType", inviteType.error.flatten().fieldErrors)


    const fetchedInvites = await inviteService.listAllInvites(User.data.userId, inviteType.data)

    loggers.db.info("List of Invites fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })


    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, fetchedInvites ?? {}, "List of Invites fetched Sucessfully"))
})

export const acceptWsInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Invite = idSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Invite.success) throw new UserInputValidationError("Invalid UserID", Invite.error.flatten().fieldErrors)

    const acceptedInvite = await inviteService.acceptWsInvite(User.data.userId, Invite.data.id)

    loggers.db.info("User Accepted the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, acceptedInvite ?? {}, "Invite Accepted Succesfully"))

})

export const rejectWsInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Invite = idSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Invite.success) throw new UserInputValidationError("Invalid UserID", Invite.error.flatten().fieldErrors)

    const rejectedInvite = await inviteService.rejectWsInvite(User.data.userId, Invite.data.id)

    loggers.db.info("User Accepted the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, rejectedInvite ?? {}, "Invite Accepted Succesfully"))

})

export const cancelWsInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Invite = idSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Invite.success) throw new UserInputValidationError("Invalid UserID", Invite.error.flatten().fieldErrors)

    const cancelledInvite = await inviteService.cancelWsInvite(User.data.userId, Invite.data.id)

    loggers.db.info("User Accepted the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, cancelledInvite ?? {}, "Invite Accepted Succesfully"))

})


export const createChannelInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Channel = ChannelParamsSchema.safeParse(req.params)
    const Email = emailSchema.safeParse(req.body)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Channel.success) throw new UserInputValidationError("Invalid UserID", Channel.error.flatten().fieldErrors)
    if (!Email.success) throw new UserInputValidationError("Invalid Credentials", Email.error.flatten().fieldErrors)


    const invite = await inviteService.createChannelInvite(User.data.userId, Channel.data, Email.data.email)

    loggers.db.info("User Accepted the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        inviteId: invite.id,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, invite, "Invite Created Succesfully"))

})

export const listAllChannelInvites = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const inviteType = inviteTypeSchema.safeParse(req.query)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!inviteType.success) throw new UserInputValidationError("Please Enter an valid inviteType", inviteType.error.flatten().fieldErrors)


    const fetchedInvites = await inviteService.listAllChannelInvites(User.data.userId, inviteType.data)

    loggers.db.info("List of Invites fetched Sucessfully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })


    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, fetchedInvites ?? {}, "List of Invites fetched Sucessfully"))
})

export const acceptChannelInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Invite = ChannelInviteSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Invite.success) throw new UserInputValidationError("Invalid InviteId or workspaceId", Invite.error.flatten().fieldErrors)

    const acceptedInvite = await inviteService.acceptChannelInvite(User.data.userId, Invite.data)

    loggers.db.info("User Accepted the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, acceptedInvite ?? {}, "Invite Accepted Succesfully"))

})

export const rejectChannelInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Invite = ChannelInviteSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Invite.success) throw new UserInputValidationError("Invalid InviteId or workspaceId", Invite.error.flatten().fieldErrors)

    const rejectedInvite = await inviteService.rejectChannelInvite(User.data.userId, Invite.data)

    loggers.db.info("User Rejected the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        receiverId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, rejectedInvite ?? {}, "Invite Rejected Succesfully"))

})

export const cancelChannelInvite = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Invite = ChannelInviteSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Invite.success) throw new UserInputValidationError("Invalid InviteId or workspaceId", Invite.error.flatten().fieldErrors)

    const cancelleddInvite = await inviteService.cancelChannelInvite(User.data.userId, Invite.data)

    loggers.db.info("Actor Cancelled the Invite", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        actorId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, cancelleddInvite ?? {}, "Invite Revoked Succesfully"))

})