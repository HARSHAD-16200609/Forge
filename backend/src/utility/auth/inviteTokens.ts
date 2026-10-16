import { randomBytes } from "node:crypto";
import { env } from "../../config/env";

export const INVITE_TOKEN_KIND = {
  WORKSPACE_INVITE: "wsi",
  CHANNEL_INVITE: "chi",
  WORKSPACE_LINK: "wsl",
} as const;

export type InviteTokenKind = (typeof INVITE_TOKEN_KIND)[keyof typeof INVITE_TOKEN_KIND];

export type ParsedInviteTokenKind = "workspace_invite" | "channel_invite" | "workspace_link";

export function generateInviteToken(kind: InviteTokenKind): string {
  return `${kind}_${randomBytes(32).toString("base64url")}`;
}

export function parseInviteToken(token: string): ParsedInviteTokenKind | null {
  if (token.startsWith(`${INVITE_TOKEN_KIND.WORKSPACE_INVITE}_`)) return "workspace_invite";
  if (token.startsWith(`${INVITE_TOKEN_KIND.CHANNEL_INVITE}_`)) return "channel_invite";
  if (token.startsWith(`${INVITE_TOKEN_KIND.WORKSPACE_LINK}_`)) return "workspace_link";
  return null;
}

export function buildInviteUrl(token: string): string {
  return `${env.CLIENT_URL}/invite/${token}`;
}

export function maskEmail(email: string): string {
  const [local = "", domain] = email.split("@");
  if (!domain || local.length === 0) return email;

  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}
