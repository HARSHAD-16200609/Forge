import z from "zod";
import { Visibility } from "../../generated/prisma/enums";


export const createChannelSchema = z.object({
    channelName : z.string(),
    description : z.string().min(12),
    visibility : z.enum(Visibility)
})

export type createChannelDTO = z.infer<typeof createChannelSchema>