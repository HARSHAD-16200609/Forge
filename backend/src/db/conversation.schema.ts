import z from "zod";


export const createDMSchema = z.object({
    receiverId: z.uuid()
})