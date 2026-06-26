
import z from "zod"


export const workspaceSchema = z.object({
    workspaceName : z.string().min(8).max(20),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    description: z.string().min(12).max(100),
})

export const workspaceMemberSchema = z.object({
    role : z.enum(["OWNER","ADMIN","MEMBER"]),
    userName : z.string(),
    workspaceId:z.uuid()
})

export const idSchema =z.object({
    id : z.uuid()
})

export const workspaceMemberInputSchema = z.object({
        role : z.enum(["OWNER","ADMIN","MEMBER"]),
    userName : z.string(),
})

export const wsMemberDeleteUpdateSchema = z.object({
    workspaceId : z.uuid(),
    userId:z.uuid()
})

export const roleSchema = z.object({
    role : z.enum(["OWNER","MEMBER","ADMIN"])
})

export const emailSchema = z.object({
    email : z.email()
}) 

export type ID = z.infer<typeof idSchema>
export type createWorkspaceDTO = z.infer<typeof workspaceSchema>
export type workspaceMemberDTO = z.infer<typeof workspaceMemberSchema>
export type workspaceMemberInput = z.infer<typeof workspaceMemberInputSchema>
export type wsMemberDeleteUpdateDTO = z.infer<typeof wsMemberDeleteUpdateSchema>
export type roleDTO = z.infer<typeof roleSchema>
export type emailInput = z.infer<typeof emailSchema>