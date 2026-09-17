import { z } from "zod"

export const listNotificationsQuerySchema = z.object({
    filter: z.enum(["all", "unread", "mentions", "activity", "invites"]).default("all"),
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const notificationIdParamsSchema = z.object({
    id: z.uuid(),
})