import { describe, expect, it } from "vitest";

import { channelInviteTemplate } from "../../../src/services/email/templates/channelInvite";
import { workspaceInviteTemplate } from "../../../src/services/email/templates/workspaceInvite";

const inviteUrl = "https://forrge.tech/invite/wsi_abc123";

describe("workspaceInviteTemplate", () => {
    const rendered = workspaceInviteTemplate({
        inviterName: "Ada Lovelace",
        workspaceName: "Forge Labs",
        inviteUrl,
        expiresInDays: 7,
    });

    it("builds a subject naming the inviter and workspace", () => {
        expect(rendered.subject).toBe("Ada Lovelace invited you to join Forge Labs on Forge");
    });

    it("includes the invite url in both html and text bodies", () => {
        expect(rendered.html).toContain(inviteUrl);
        expect(rendered.text).toContain(inviteUrl);
        expect(rendered.text).toContain("expires in 7 days");
    });

    it("escapes html in user-provided values", () => {
        const escaped = workspaceInviteTemplate({
            inviterName: '<script>alert("x")</script>',
            workspaceName: "Forge <Labs>",
            inviteUrl,
            expiresInDays: 7,
        });

        expect(escaped.html).not.toContain("<script>");
        expect(escaped.html).toContain("&lt;script&gt;");
        expect(escaped.html).toContain("Forge &lt;Labs&gt;");
    });
});

describe("channelInviteTemplate", () => {
    const rendered = channelInviteTemplate({
        inviterName: "Grace Hopper",
        workspaceName: "Forge Labs",
        channelName: "launch-room",
        inviteUrl,
        expiresInDays: 7,
    });

    it("builds a subject naming the channel and workspace", () => {
        expect(rendered.subject).toBe(
            "Grace Hopper invited you to #launch-room in Forge Labs",
        );
    });

    it("includes the invite url and channel name in the body", () => {
        expect(rendered.html).toContain(inviteUrl);
        expect(rendered.text).toContain("#launch-room");
    });
});
