import z from "zod";

export const PresenceSchema = z.object({
    workspaceId : z.uuid()

})

