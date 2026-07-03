// authz/permissions.ts
import { Role, Visibility } from "../../../generated/prisma/enums";

export type Resource = "workspace" | "workspaceMember" | "channel" | "channelMessage" | "channelMember";
export type Action = "create" | "read" | "update" | "delete" | "invite" | "manageRoles" | "archive" | "remove";


const WORKSPACE_MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  [Role.OWNER]: {
    workspace: ["read", "update", "delete"],
    workspaceMember: ["create", "read", "delete", "invite", "manageRoles"],
    channel: ["create", "read", "update", "delete", "archive"],
    channelMessage: ["create", "read", "update", "delete"],
    channelMember: ["invite", "remove"]
  },
  [Role.ADMIN]: {
    workspace: ["read", "update"],
    workspaceMember: ["create", "read", "delete", "invite"],
    channel: ["create", "read", "update", "delete", "archive"],
    channelMessage: ["create", "read", "update", "delete"],
    channelMember: ["invite", "remove"]
  },
  [Role.MEMBER]: {
    workspace: ["read"],
    workspaceMember: ["read"],
    channel: ["create", "read"],
    channelMessage: ["create", "read", "update"], 
  },
};

export function canWorkspace(role: Role, resource: Resource, action: Action): boolean {
  return WORKSPACE_MATRIX[role]?.[resource]?.includes(action) ?? false;
}

export function isWorkspaceAdminOrOwner(role: Role): boolean {
  return role === Role.ADMIN || role === Role.OWNER;
}