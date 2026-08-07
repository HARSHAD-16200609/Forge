import z from "zod/v4";
import { WsEvent } from "../types/events";


export const envelopeSchema = z.object({
    type: z.enum(WsEvent),
    payload: z.unknown(),
});


export function parseEnvelope(raw: string) {
    const json = JSON.parse(raw);

    return envelopeSchema.parse(json);
}

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


export type Envelope = z.infer<typeof envelopeSchema>;
export type SubscribePayload = z.infer<typeof subscribeEnvelopeSchema>
export type MessagePayload = z.infer<typeof messageEnvelopeSchema>
