import z from "zod/v4";


export const messageEnvelopeSchema = z.object({
    type: z.string().min(20).max(30),
    payload : z.object({
        conversationId:z.uuid(),
        content : z.string().max(500)
    })

})

export const subscribeEnvelopeSchema = z.object({
    type: z.string().min(20).max(30),
    payload : z.object({
        content : z.string().max(500)
    })

})


export type SubscribePayload = z.infer<typeof subscribeEnvelopeSchema>
export type MessagePayload = z.infer<typeof messageEnvelopeSchema>
