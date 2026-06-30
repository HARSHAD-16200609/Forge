import z from "zod";
import { Visibility } from "../../generated/prisma/enums";


export const createChannelSchema = z.object({
    channelName : z.string(),
    description : z.string().min(12),
    visibility : z.enum(Visibility)
})
export const ChannelParamsSchema = z.object({
    channelId : z.uuid(),
    workspaceId : z.uuid()
})

export const updateChannelSchema = z
  .object({
    channelName: z
      .string()
      .trim()
      .min(1, "Channel name is required")
      .max(50)
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),

    visibility: z
      .enum(["PUBLIC", "PRIVATE"])
      .optional(),
  })
  .refine(
    (data) =>
      data.channelName !== undefined ||
      data.description !== undefined ||
      data.visibility !== undefined,
    {
      message: "At least one field must be provided for update",
    }
  );


export type createChannelDTO = z.infer<typeof createChannelSchema>
export type channelParamsDTO = z.infer<typeof ChannelParamsSchema>
export type updateChannelDTO = z.infer<typeof updateChannelSchema>