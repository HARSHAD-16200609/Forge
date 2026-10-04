export type ChannelVisibility = "PUBLIC" | "PRIVATE";

export const CHANNEL_NAME_MAX = 80;
export const CHANNEL_DESCRIPTION_MAX = 500;

export interface CreateChannelPayload {
    channelName: string;
    description?: string;
    visibility: ChannelVisibility;
}

/** Raw channel row returned by POST /workspace/:id/channels */
export interface CreatedChannel {
    id: string;
    channelName: string;
    description: string | null;
    visibility: ChannelVisibility;
    isDefault: boolean;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
    createdByWorkspaceMemberId: string;
}

/** Mirrors channelNameSchema on the backend so the UI can gate the submit button. */
export function normalizeChannelName(raw: string): string {
    return raw
        .trim()
        .replace(/^#+/, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

export function isValidChannelName(raw: string): boolean {
    const normalized = normalizeChannelName(raw);
    return normalized.length > 0 && normalized.length <= CHANNEL_NAME_MAX;
}