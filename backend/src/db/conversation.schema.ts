import z from "zod";


export const createDMSchema = z.object({
    receiverId: z.uuid()
})

export const editMessageSchema = z.object({
    conversationId:z.uuid(),
    messageId:z.uuid()
})

