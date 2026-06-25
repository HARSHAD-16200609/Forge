// authz/permissions.ts
import { Role, Visibility } from "../../../generated/prisma/enums";

export type Resource = "workspace" | "workspaceMember" | "channel" | "channelMessage";
export type Action = "create" | "read" | "update" | "delete" | "invite" | "manageRoles" | "archive";


const WORKSPACE_MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  [Role.OWNER]: {
    workspace: ["read", "update", "delete"],
    workspaceMember: ["create", "read", "delete", "invite", "manageRoles"],
    channel: ["create", "read", "update", "delete", "archive"],
    channelMessage: ["create", "read", "update", "delete"], // override: can moderate any message
  },
  [Role.ADMIN]: {
    workspace: ["read", "update"],
    workspaceMember: ["create", "read", "delete", "invite"],
    channel: ["create", "read", "update", "delete", "archive"],
    channelMessage: ["create", "read", "update", "delete"], // override: can moderate any message
  },
  [Role.MEMBER]: {
    workspace: ["read"],
    workspaceMember: ["read"],
    channel: ["create", "read"], 
    channelMessage: ["create", "read", "update"], // own messages only — enforced separately, see below
  },
};

export function canWorkspace(role: Role, resource: Resource, action: Action): boolean {
  return WORKSPACE_MATRIX[role]?.[resource]?.includes(action) ?? false;
}

export function isWorkspaceAdminOrOwner(role: Role): boolean {
  return role === Role.ADMIN || role === Role.OWNER;
}