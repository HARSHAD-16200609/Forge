
import { z } from "zod";

export const messageSchema = z.object({
  message: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Message cannot be empty")
      .max(4000, "Message is too long"),
  }),
});

export const getMessagesSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});

const ALLOWED_EMOJI = [
  "👍", "👎", "❤️", "🔥", "🎉",
  "😂", "😄", "😍", "😢", "😮",
  "😡", "🙏", "👏", "💯", "✅",
  "❌", "👀", "🤔", "🚀", "⭐"
] as const;

export const emojiSchema = z.object({
  reaction: z.enum(ALLOWED_EMOJI),
});


export type Message = z.infer<typeof messageSchema>
export type getMessagesDTO = z.infer<typeof getMessagesSchema> 