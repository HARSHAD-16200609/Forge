import z from "zod";
import { Visibility } from "../../generated/prisma/enums";


export const channelNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Channel name is required")
  .max(80, "Channel name must be 80 characters or less");

export const channelDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be 500 characters or less");

export const createChannelSchema = z.object({
    channelName : channelNameSchema,
    description : channelDescriptionSchema.optional(),
    visibility : z.enum(Visibility)
})
export const ChannelParamsSchema = z.object({
    channelId : z.uuid(),
    workspaceId : z.uuid(),
    memberId : z.uuid().optional()
})
export const ConversationParamsSchema = z.object({
    conversationId : z.uuid(),
    workspaceId : z.uuid(),
    memberId : z.uuid().optional()
})
export const ChannelInviteSchema = z.object({
    inviteId : z.uuid(),
    workspaceId : z.uuid(),
})

export const createChannelInviteSchema = z.object({
    email: z.string().trim().optional(),
    receiverId: z.uuid().optional(),
}).refine(
    (data) => data.email !== undefined || data.receiverId !== undefined,
    {
        message: "Either email or receiverId is required",
    }
);

export const updateChannelSchema = z
  .object({
    channelName: channelNameSchema.optional(),

    description: channelDescriptionSchema.optional(),

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
export type channelInviteDTO = z.infer<typeof ChannelInviteSchema>
export type createChannelInviteDTO = z.infer<typeof createChannelInviteSchema>
export type conversationParamsDTO = z.infer<typeof ConversationParamsSchema>