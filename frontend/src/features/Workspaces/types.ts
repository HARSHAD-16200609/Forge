import { z } from "zod"

export interface Workspace {
    role: "OWNER" | "MEMBER";
    workspace: {
        id: string;
        workspaceName: string;
        visibility: "PUBLIC" | "PRIVATE";
        description: string;
    };
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