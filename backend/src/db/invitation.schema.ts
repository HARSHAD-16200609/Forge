import z from "zod";
import { Status } from "../../generated/prisma/enums";


export type InviteType = "sent" | "received" 

export const inviteTypeSchema = z.object({
  type: z.union([
    z.literal("sent"),
    z.literal("received"),
  ]),
 status : z.enum(Status).optional(),
 page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
});



export type getInviteType = z.infer<typeof inviteTypeSchema>