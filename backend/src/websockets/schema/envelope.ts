import z from "zod/v4";
import { WsEvent } from "../types/events";


export const envelopeSchema = z.object({
    type: z.enum(WsEvent),
    payload: z.unknown(),
});


export function parseEnvelope(raw: string) {
    try {
        const json = JSON.parse(raw);

        return envelopeSchema.safeParse(json);
    } catch (error) {
        if (error instanceof SyntaxError) {
            return {
                success: false as const,
                error: "Malformed JSON",
            };
        }

        throw error;
    }
}
export const messageEnvelopeSchema = z.object({
    payload: z.object({
        conversationId: z.uuid(),
        content: z.string().max(500)
    })
})

export const conversationIdSchema = z.object({
     conversationId: z.uuid() 
})


export type Envelope = z.infer<typeof envelopeSchema>;
export type convoId = z.infer<typeof conversationIdSchema>
export type MessagePayload = z.infer<typeof messageEnvelopeSchema>
