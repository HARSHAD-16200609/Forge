import z from "zod";

export enum InviteTypeEnum{
  SENT = "sent",
  RECEIVED = "received",
}

export const inviteTypeSchema =  z.object({
    type : z.enum(InviteTypeEnum)
})

