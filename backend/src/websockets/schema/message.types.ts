import emojiRegex from "emoji-regex";
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

export const updateChannelMessageSchema = z.object({
    workspaceId: z.uuid(),
    channelId: z.uuid(),
    messageId: z.uuid(),
    content: z.string().trim().max(4000, "Message is too long")
}).refine((data) => data.content.length > 0, {
    message: "Message content is required"
})

export const deleteChannelMessageSchema = z.object({
    workspaceId: z.uuid(),
    channelId: z.uuid(),
    messageId: z.uuid(),

})


export const updateConversationMessageSchema = z.object({
    workspaceId: z.uuid(),
    conversationId: z.uuid(),
    messageId: z.uuid(),
    content: z.string().trim().max(4000, "Message is too long")
}).refine((data) => data.content.length > 0, {
    message: "Message content is required"
})

export const deleteConversationMessageSchema = z.object({
    workspaceId: z.uuid(),
    conversationId: z.uuid(),
    messageId: z.uuid(),

})


const regex = emojiRegex();

export const messageReactionSchema = z.object({
    messageId: z.uuid(),
    reaction: z.string().refine((value) => {
        const matches = value.match(regex);
        return (
            matches !== null &&
            matches.length === 1 &&
            matches[0] === value
        );
    }, "Reaction must be exactly one emoji"),

})

export const typingIndicatorSchema = z.object({
    workspaceId: z.uuid(),
    entityId: z.uuid(),
    entityType: z.enum(["conversation", "channel"])

})

export type channelMessage = z.infer<typeof createChannelMessageSchema>