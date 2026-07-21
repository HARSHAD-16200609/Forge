import z from "zod";


export const createDMSchema = z.object({
    receiverId: z.uuid(),
    idempotencyKey: z.uuidv4()
})

export const editMessageSchema = z.object({
    conversationId: z.uuid(),
    messageId: z.uuid()
})

export const renameGroupName = z.object({
    groupName: z.
        string()
        .trim()
        .min(3, "Group name must be at least 3 characters.")
        .max(50, "Group name cannot exceed 50 characters."),
})
export const createGDMSchema = z.object({
    idempotencyKey: z.uuidv4(),
    name: z
        .string()
        .trim()
        .min(3, "Group name must be at least 3 characters.")
        .max(50, "Group name cannot exceed 50 characters."),

    memberIds: z
        .array(z.uuid())
        .min(1, "At least one member is required.")
        .max(98, "A group can have at most 99 members.")
        .refine(
            (ids) => new Set(ids).size === ids.length,
            "Duplicate members are not allowed."
        ),
})

export const addGDMMembers = z.object({
    memberIds: z
        .array(z.uuid())
        .min(1, "At least one member is required.")
        .max(98, "A group can have at most 99 members.")
        .refine(
            (ids) => new Set(ids).size === ids.length,
            "Duplicate members are not allowed."
        ),
}) 

export const wsConversationIdSchema = z.object({
    workspaceId:z.uuid(),
    conversationId:z.uuid()
})