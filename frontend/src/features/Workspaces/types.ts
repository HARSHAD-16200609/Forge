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
    createdAt: "2026-06-28T13:32:12.894Z",
    updatedAt: "2026-06-28T13:32:12.894Z",
    channels: Channel[],
    members: ChannelMember[],
    memberCount: number
}
export interface Channel {
  channelName: string;
  id:string
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
