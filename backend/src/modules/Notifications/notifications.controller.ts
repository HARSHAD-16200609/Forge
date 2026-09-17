import StatusCodes from "http-status-codes"
import { reqUserSchema } from "../../db/auth-schema"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler"
import { UserInputValidationError } from "../../utility/errorHandling/customErrors"
import { loggers } from "../../utility/logger/serviceLoggers"
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse"
import { notificationService } from "./notifications.service"
import { listNotificationsQuerySchema, notificationIdParamsSchema } from "./notifications.schema"

export const listNotifications = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Query = listNotificationsQuerySchema.safeParse(req.query)

    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Query.success) throw new UserInputValidationError("Invalid Request", Query.error.flatten().fieldErrors)

    const { filter, cursor, limit } = Query.data
    const notifications = await notificationService.list(User.data.userId, filter, cursor, limit)

    loggers.db.info("Notifications Fetched", {
        user: User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        filter,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, notifications, "Notifications fetched successfully"))
})

export const getUnreadCount = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const unreadCount = await notificationService.unreadCount(User.data.userId)

    loggers.db.info("Unread Count Fetched", {
        user: User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        count: unreadCount.count,
        fetchedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, unreadCount, "Unread count fetched successfully"))
})

export const markNotificationRead = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    const Params = notificationIdParamsSchema.safeParse(req.params)

    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)
    if (!Params.success) throw new UserInputValidationError("Invalid Notification Id", Params.error.flatten().fieldErrors)

    const updated = await notificationService.markRead(User.data.userId, Params.data.id)

    loggers.db.info("Notification Marked Read", {
        user: User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        notificationId: Params.data.id,
        markedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, updated, "Notification marked as read"))
})

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
    const User = reqUserSchema.safeParse(req.user)
    if (!User.success) throw new UserInputValidationError("Invalid Token", User.error.flatten().fieldErrors)

    const updated = await notificationService.markAllRead(User.data.userId)

    loggers.db.info("All Notifications Marked Read", {
        user: User.data.userId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        count: updated.count,
        markedAt: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
        }),
    })

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, updated, "All notifications marked as read"))
})