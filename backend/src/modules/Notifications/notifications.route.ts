import { Router } from "express"
import { verifyJwt } from "../../middlewares/verifyJwt"
import {
    getUnreadCount,
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "./notifications.controller"

const notificationRouter = Router()

notificationRouter.route("/notifications").get(verifyJwt, listNotifications)
notificationRouter.route("/notifications/unread-count").get(verifyJwt, getUnreadCount)
notificationRouter.route("/notifications/read-all").patch(verifyJwt, markAllNotificationsRead)
notificationRouter.route("/notifications/:id/read").patch(verifyJwt, markNotificationRead)

export { notificationRouter }