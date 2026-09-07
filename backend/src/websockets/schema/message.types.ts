import { uuid, z } from "zod";

export const createChannelMessageSchema = z.object({
    workspaceId: z.uuid(),
    channelId: z.uuid(),
    content: z
        .string()
        .trim()
        .max(4000, "Message is too long"),
    uploadIds: z.array(uuid()).max(3).default([]),
}).refine((data) => data.content.length > 0 || data.uploadIds.length > 0, {
    message: "Message content or at least one attachment is required"
});

export const createConversationMessageSchema = z.object({
    workspaceId: z.uuid(),
    conversationId: z.uuid(),
    content: z
        .string()
        .trim()
        .max(4000, "Message is too long"),
    uploadIds: z.array(uuid()).max(3).default([]),
}).refine((data) => data.content.length > 0 || data.uploadIds.length > 0, {
    message: "Message content or at least one attachment is required"
});


export const subscribeChannelSchema = z.object({
    workspaceId: z.uuid(),
    channelId: z.uuid(),
})



export type channelMessage = z.infer<typeof createChannelMessageSchema>