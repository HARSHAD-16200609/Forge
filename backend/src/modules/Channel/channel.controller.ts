import { reqUserSchema } from "../../db/auth-schema";
import { createChannelSchema } from "../../db/channel.schema";
import { idSchema } from "../../db/workspace";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { channelService } from "./channe.service";
import { StatusCodes } from "http-status-codes";

export const createChannel = asyncHandler(async (req, res) => {
    const channel = createChannelSchema.safeParse(req.body)
    const workspace = idSchema.safeParse(req.params)
    const User = reqUserSchema.safeParse(req.user)
    if (!channel.success) throw new UserInputValidationError("Invalid Input", channel.error.flatten().fieldErrors)
    if (!workspace.success) throw new UserInputValidationError("Invalid Input", workspace.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const Channel = await channelService.createChannel(channel.data, workspace.data.id, User.data.userId)
    loggers.db.info("Channel Created", {
        channel: channel.data.channelName,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),

    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, Channel))
})

export const getChannels = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const workspace = idSchema.safeParse(req.params)
    if (!workspace.success) throw new UserInputValidationError("Invalid Input", workspace.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const Channels = await channelService.getChannels(workspace.data.id,User.data.userId)

    loggers.db.info("Channel Created", {
         user : User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),

    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, Channels))


})