import { describe, expect, it, vi, beforeEach } from "vitest";
import { channelService } from "../../src/features/Channel/channel.service";

const mocks = vi.hoisted(() => ({
    post: vi.fn(),
}));

vi.mock("../../src/lib/api", () => ({
    api: { post: mocks.post },
}));

const WORKSPACE_ID = "5a1f0f9e-1c2d-4e3f-8a9b-0c1d2e3f4a5b";

const CREATED = {
    id: "7c2e1d4a-9b8c-4d5e-9f0a-1b2c3d4e5f60",
    channelName: "design-review",
    description: null,
    visibility: "PUBLIC",
    isDefault: false,
    workspaceId: WORKSPACE_ID,
    createdAt: "2026-10-04T10:00:00.000Z",
    updatedAt: "2026-10-04T10:00:00.000Z",
    createdByWorkspaceMemberId: "member-1",
};

describe("channelService.createChannel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.post.mockResolvedValue({ data: { data: CREATED } });
    });

    it("posts to the workspace channels endpoint", async () => {
        await channelService.createChannel(WORKSPACE_ID, {
            channelName: "design-review",
            visibility: "PUBLIC",
        });

        expect(mocks.post).toHaveBeenCalledWith(
            `/workspace/${WORKSPACE_ID}/channels`,
            expect.objectContaining({ channelName: "design-review" }),
        );
    });

    it("normalizes the name before sending it", async () => {
        await channelService.createChannel(WORKSPACE_ID, {
            channelName: "  #Design Review ",
            visibility: "PRIVATE",
        });

        expect(mocks.post).toHaveBeenCalledWith(
            `/workspace/${WORKSPACE_ID}/channels`,
            expect.objectContaining({ channelName: "design-review", visibility: "PRIVATE" }),
        );
    });

    it("omits description entirely when blank", async () => {
        await channelService.createChannel(WORKSPACE_ID, {
            channelName: "general",
            description: "   ",
            visibility: "PUBLIC",
        });

        const body = mocks.post.mock.calls[0][1];
        expect(body).not.toHaveProperty("description");
    });

    it("trims and sends a provided description", async () => {
        await channelService.createChannel(WORKSPACE_ID, {
            channelName: "general",
            description: "  Weekly sync notes.  ",
            visibility: "PUBLIC",
        });

        expect(mocks.post).toHaveBeenCalledWith(
            `/workspace/${WORKSPACE_ID}/channels`,
            expect.objectContaining({ description: "Weekly sync notes." }),
        );
    });

    it("unwraps the ApiResponse envelope", async () => {
        const created = await channelService.createChannel(WORKSPACE_ID, {
            channelName: "general",
            visibility: "PUBLIC",
        });

        expect(created).toEqual(CREATED);
    });
});