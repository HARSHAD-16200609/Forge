import { loggers } from "../../utility/logger/serviceLoggers"
import { reqUserSchema } from "../../db/auth-schema"
import { idSchema, emailSchema } from "../../db/workspace"
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse"
import { UserInputValidationError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors"
import StatusCodes from "http-status-codes"
import { inviteService } from "./invitation.service"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler"
import { inviteTypeSchema, inviteTokenSchema } from "../../db/invitation.schema"
import { ChannelInviteSchema, ChannelParamsSchema, createChannelInviteSchema } from "../../db/channel.schema"




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


    const result = await inviteService.createWorkspaceInvite(Invite)

    loggers.db.log("User Ivited Created SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        inviteId: result?.invite?.id,
        emailSent: result?.emailSent,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, result ?? {}, "Workspace Invite Created Sucessfully"))


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
    const InviteBody = createChannelInviteSchema.safeParse(req.body)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Channel.success) throw new UserInputValidationError("Invalid UserID", Channel.error.flatten().fieldErrors)
    if (!InviteBody.success) throw new UserInputValidationError("Invalid Credentials", InviteBody.error.flatten().fieldErrors)


    const result = await inviteService.createChannelInvite(User.data.userId, Channel.data, InviteBody.data)

    loggers.db.info("Channel Invite Created SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        inviteId: result?.invite?.id,
        emailSent: result?.emailSent,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, result, "Invite Created Succesfully"))

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

export const previewInviteToken = asyncHandler(async (req, res) => {
    const Token = inviteTokenSchema.safeParse(req.params)
    if (!Token.success) throw new UserInputValidationError("Invalid invite token", Token.error.flatten().fieldErrors)

    const preview = await inviteService.previewInviteToken(Token.data.token)

    loggers.db.info("Invite Token Previewed", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        kind: preview.kind,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, preview, "Invite fetched Succesfully"))
})

export const acceptInviteToken = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Token = inviteTokenSchema.safeParse(req.params)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!Token.success) throw new UserInputValidationError("Invalid invite token", Token.error.flatten().fieldErrors)

    const accepted = await inviteService.acceptInviteToken(User.data.userId, Token.data.token)

    loggers.db.info("Invite Token Accepted", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        acceptedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, accepted ?? {}, "Invite Accepted Succesfully"))
})

export const getWorkspaceInviteLink = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Workspace = idSchema.safeParse(req.params)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!Workspace.success) throw new UserInputValidationError("Invalid WorkspaceId", Workspace.error.flatten().fieldErrors)

    const link = await inviteService.getWorkspaceInviteLink(User.data.userId, Workspace.data.id)

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, link ?? {}, "Invite link fetched Succesfully"))
})

export const createWorkspaceInviteLink = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Workspace = idSchema.safeParse(req.params)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!Workspace.success) throw new UserInputValidationError("Invalid WorkspaceId", Workspace.error.flatten().fieldErrors)

    const link = await inviteService.createWorkspaceInviteLink(User.data.userId, Workspace.data.id)

    loggers.db.info("Workspace Invite Link Created", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, link, "Invite link created Succesfully"))
})

export const revokeWorkspaceInviteLink = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Workspace = idSchema.safeParse(req.params)
    if (!User.success) throw new UnauthorizedAccessError("Invalid UserId")
    if (!Workspace.success) throw new UserInputValidationError("Invalid WorkspaceId", Workspace.error.flatten().fieldErrors)

    const result = await inviteService.revokeWorkspaceInviteLink(User.data.userId, Workspace.data.id)

    loggers.db.info("Workspace Invite Link Revoked", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        revoked: result.revoked,
        revokedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, result, "Invite link revoked Succesfully"))
})