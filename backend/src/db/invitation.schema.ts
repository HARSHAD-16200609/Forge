import z from "zod";
import { Status } from "../../generated/prisma/enums";


export type InviteType = "sent" | "received" 

export const inviteTypeSchema = z.object({
  type: z.union([
    z.literal("sent"),
    z.literal("received"),
  ]),
 status : z.enum(Status).optional()
});



export type getInviteType = z.infer<typeof inviteTypeSchema>