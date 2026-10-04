import { z } from "zod"
import type { UserProfile } from "../auth/types";


export interface Workspace {
    role: "OWNER" | "MEMBER";
    workspace: {
        id: string;
        workspaceName: string;
        visibility: "PUBLIC" | "PRIVATE";
        description: string;
    };
}

export interface WorkspaceDetails {
    id: string;
    workspaceName: string;
    visibility: "PUBLIC" | "PRIVATE";
    description: string;
    createdAt: string,
    updatedAt: string,
    channels: Channel[],
    members: ChannelMember[],
    memberCount: number
}
export interface Channel {
  channelName: string;
  id:string,
  description?: string | null
  visibility?: "PUBLIC" | "PRIVATE"
  isMember?: boolean
}

export interface WorkspaceListProps {
    workspaces: Workspace[];
    onWorkspaceClick?: (workspace: Workspace["workspace"]) => void;
}

export interface WorkspaceFormData {
    workspaceName: string;
    visibility: "PUBLIC" | "PRIVATE";
    description: string
}

export const workspaceSchema = z.object({
    workspaceName: z.string().min(8).max(20),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    description: z.string().min(12).max(100),
})

export type WorkspaceObject = z.infer<typeof workspaceSchema>



export type User = Omit<UserProfile, "name" | "email">

export interface ChannelMember {
    role: "OWNER" | "MEMBER",
    user: User
}
