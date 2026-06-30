import { reqUserSchema } from "../../db/auth-schema";
import { createChannelSchema, ChannelParamsSchema, updateChannelSchema } from "../../db/channel.schema";
import { idSchema } from "../../db/workspace";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { loggers } from "../../utility/logger/serviceLoggers";
import { channelService } from "./channel.service";
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

    loggers.db.log("Channel Created SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        channelId: Channel.id,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, Channel))
})

export const getChannels = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const workspace = idSchema.safeParse(req.params)
    if (!workspace.success) throw new UserInputValidationError("Invalid Input", workspace.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const Channels = await channelService.getChannels(workspace.data.id, User.data.userId)

    loggers.db.info("Channel Fetched", {
        user: User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        fetchdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),

    })


    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, Channels, "Channels Fetched .."))


})

export const getChannel = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Channel = ChannelParamsSchema.safeParse(req.params)
    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const Channels = await channelService.getChannel(Channel.data, User.data.userId)

    loggers.db.info("Channel Fetched", {
        user: User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: User.data.userId,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),

    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, Channels ?? {}, "Channel Fetched .."))


})

export const updateChannel = asyncHandler(async (req, res) => {
    const newChannelDetails = updateChannelSchema.safeParse(req.body)
    const User = reqUserSchema.safeParse(req.user)
    const Channel = ChannelParamsSchema.safeParse(req.params)

    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)
    if (!newChannelDetails.success) throw new UserInputValidationError("Invalid Details", newChannelDetails.error.flatten().fieldErrors)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const updatedChannel = await channelService.updateChannel(newChannelDetails.data, User.data.userId, Channel.data)

    loggers.db.info("Channel Updated SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        channelId: updatedChannel.id,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, updateChannel, "Channel Updatd Sucessfully"))

})

export const deleteChannel = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Channel = ChannelParamsSchema.safeParse(req.params)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Channel.success) throw new UserInputValidationError("Invalid Input", Channel.error.flatten().fieldErrors)

    await channelService.deleteChannel(Channel.data,User.data.userId)

        loggers.db.info("Channel Deleted SucessFully", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        channelId: Channel.data.channelId,
        createdAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        })
    })

    res.status(StatusCodes.NO_CONTENT).json(new ApiResponse(StatusCodes.NO_CONTENT, {}, "Channel Deleted Sucessfully"))


})