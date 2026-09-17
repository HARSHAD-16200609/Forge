export interface MentionMember {
    id: string;
    username: string;
    name?: string | null;
    avatar?: string | null;
}

const MENTION_ANCHOR_REGEX = /<a\s+[^>]*data-mention-id="([a-f0-9-]+)"[^>]*>@([^<]+)<\/a>/gi;

function escapeHtml(value: string): string {
    return value.replace(/[&<>"]/g, (char) => {
        switch (char) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            default:
                return char;
        }
    });
}

export function buildMentionHtml(member: MentionMember): string {
    return `<a href="#" class="mention" data-mention-id="${member.id}">@${escapeHtml(member.username)}</a>`;
}

export function extractMentionIds(contentJson: string): string[] {
    try {
        const parsed: unknown = JSON.parse(contentJson);
        const rawBlocks = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === "object" && Array.isArray((parsed as { blocks?: unknown }).blocks)
              ? (parsed as { blocks: unknown[] }).blocks
              : [];
        const ids = new Set<string>();
        for (const block of rawBlocks as Array<{ data?: { text?: unknown } }>) {
            const text = block?.data?.text;
            if (typeof text !== "string") continue;
            for (const match of text.matchAll(MENTION_ANCHOR_REGEX)) {
                if (match[1]) ids.add(match[1]);
            }
        }
        return [...ids];
    } catch {
        return [];
    }
}

export type MentionToken =
    | { type: "text"; value: string }
    | { type: "mention"; id: string; username: string };

export function splitMentionText(text: string): MentionToken[] {
    const tokens: MentionToken[] = [];
    let lastIndex = 0;
    for (const match of text.matchAll(MENTION_ANCHOR_REGEX)) {
        const index = match.index ?? 0;
        if (index > lastIndex) {
            tokens.push({ type: "text", value: text.slice(lastIndex, index) });
        }
        tokens.push({ type: "mention", id: match[1], username: match[2] });
        lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
        tokens.push({ type: "text", value: text.slice(lastIndex) });
    }
    return tokens.length === 0 ? [{ type: "text", value: text }] : tokens;
}