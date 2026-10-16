import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../../src/modules/Invitation/invitation.repository", () => ({
    INVITE_TTL_DAYS: 7,
    INVITE_LINK_TTL_DAYS: 30,
    inviteRepository: {
        createWorkspaceInvite: vi.fn(),
        createChannelInvite: vi.fn(),
        getWsInvite: vi.fn(),
        getWsInviteByToken: vi.fn(),
        getChannelInvite: vi.fn(),
        getChannelInviteByToken: vi.fn(),
        getWorkspaceInviteLinkByToken: vi.fn(),
        acceptWsInvite: vi.fn(),
        acceptChannelInvite: vi.fn(),
        rejectWsInvite: vi.fn(),
        cancelWsInvite: vi.fn(),
        expireWsInvite: vi.fn(),
        expireChannelInvite: vi.fn(),
        getWorkspaceEmailContext: vi.fn(),
        getChannelEmailContext: vi.fn(),
        getWorkspaceMemberCount: vi.fn(),
        getActiveWorkspaceInviteLink: vi.fn(),
        createWorkspaceInviteLink: vi.fn(),
        revokeActiveWorkspaceInviteLinks: vi.fn(),
        joinWorkspaceViaLink: vi.fn(),
        linkPendingInvitesByEmail: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Workspace/workspace.repository", () => ({
    workspaceRepository: {
        memberExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Channel/channel.repository", () => ({
    channelRepository: {
        memberExists: vi.fn(),
        channelExists: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Auth/auth.repository", () => ({
    authRepository: {
        findUserByEmailInsensitive: vi.fn(),
        getUser: vi.fn(),
    },
}));

vi.mock("../../../src/modules/Notifications/notifications.repository", () => ({
    notificationRepository: {
        createInvite: vi.fn(),
    },
}));

vi.mock("../../../src/services/email/mailer", () => ({
    mailerService: {
        sendEmail: vi.fn().mockResolvedValue(true),
    },
}));

import { inviteRepository } from "../../../src/modules/Invitation/invitation.repository";
import { inviteService } from "../../../src/modules/Invitation/invitation.service";
import { workspaceRepository } from "../../../src/modules/Workspace/workspace.repository";
import { channelRepository } from "../../../src/modules/Channel/channel.repository";
import { authRepository } from "../../../src/modules/Auth/auth.repository";
import { notificationRepository } from "../../../src/modules/Notifications/notifications.repository";
import { mailerService } from "../../../src/services/email/mailer";
import {
    ConfilctError,
    ForbiddenError,
    NotFoundError,
    ResourceGoneError,
    UnauthorizedAccessError,
} from "../../../src/utility/errorHandling/customErrors";

const WORKSPACE_ID = "30a3aa89-92bc-4ecf-97d2-a642bc445c74";
const CHANNEL_ID = "f5f63127-9f69-446d-b5a1-82d25fc45a96";
const USER_ID = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
const INVITE_ID = "9f8e7d6c-5b4a-4938-8271-6a5b4c3d2e1f";
const TOKEN = "wsi_abc123def456";
const LINK_TOKEN = "wsl_abc123def456";
const CHANNEL_TOKEN = "chi_abc123def456";

const futureDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const pastDate = () => new Date(Date.now() - 1000);

const wsInvite = (overrides: Record<string, unknown> = {}) => ({
    id: INVITE_ID,
    status: "PENDING",
    sentAt: new Date(),
    actorId: USER_ID,
    receiverId: null,
    workspaceId: WORKSPACE_ID,
    expiresAt: futureDate(),
    receiverEmail: "invitee@example.com",
    token: TOKEN,
    acceptedAt: null,
    ...overrides,
});

describe("inviteService.createWorkspaceInvite", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("rejects users who are not workspace members", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue(null);

        await expect(
            inviteService.createWorkspaceInvite({
                workspaceId: WORKSPACE_ID,
                actorId: USER_ID,
                email: "invitee@example.com",
            }),
        ).rejects.toBeInstanceOf(UnauthorizedAccessError);
    });

    it("creates an invite for an email without an account", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue({ id: "wm-1", role: "OWNER" });
        (authRepository.findUserByEmailInsensitive as Mock).mockResolvedValue(null);
        (inviteRepository.createWorkspaceInvite as Mock).mockImplementation(async (input) => ({
            ...wsInvite(),
            receiverId: input.receiverId,
            receiverEmail: input.email,
            token: input.token,
        }));
        (inviteRepository.getWorkspaceEmailContext as Mock).mockResolvedValue({
            workspaceName: "Forge Labs",
        });
        (authRepository.getUser as Mock).mockResolvedValue({
            id: USER_ID,
            name: "Ada",
            email: "ada@example.com",
        });

        const result = await inviteService.createWorkspaceInvite({
            workspaceId: WORKSPACE_ID,
            actorId: USER_ID,
            email: "Invitee@Example.com",
        });

        expect(inviteRepository.createWorkspaceInvite).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "invitee@example.com",
                receiverId: null,
                token: expect.stringMatching(/^wsi_/),
            }),
        );
        expect(notificationRepository.createInvite).not.toHaveBeenCalled();
        expect(mailerService.sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({ to: "invitee@example.com" }),
        );
        expect(result.emailSent).toBe(true);
    });

    it("notifies and links the receiver when the email has an account", async () => {
        (workspaceRepository.memberExists as Mock)
            .mockResolvedValueOnce({ id: "wm-1", role: "ADMIN" })
            .mockResolvedValueOnce(null);
        (authRepository.findUserByEmailInsensitive as Mock).mockResolvedValue({
            id: "receiver-1",
            email: "invitee@example.com",
        });
        (inviteRepository.createWorkspaceInvite as Mock).mockImplementation(async (input) => ({
            ...wsInvite(),
            receiverId: input.receiverId,
        }));
        (inviteRepository.getWorkspaceEmailContext as Mock).mockResolvedValue({
            workspaceName: "Forge Labs",
        });
        (authRepository.getUser as Mock).mockResolvedValue({
            id: USER_ID,
            name: "Ada",
            email: "ada@example.com",
        });

        await inviteService.createWorkspaceInvite({
            workspaceId: WORKSPACE_ID,
            actorId: USER_ID,
            email: "invitee@example.com",
        });

        expect(inviteRepository.createWorkspaceInvite).toHaveBeenCalledWith(
            expect.objectContaining({ receiverId: "receiver-1" }),
        );
        expect(notificationRepository.createInvite).toHaveBeenCalledWith(
            expect.objectContaining({ receipentId: "receiver-1" }),
        );
    });

    it("surfaces email delivery failures without failing the invite", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue({ id: "wm-1", role: "OWNER" });
        (authRepository.findUserByEmailInsensitive as Mock).mockResolvedValue(null);
        (inviteRepository.createWorkspaceInvite as Mock).mockImplementation(async (input) => ({
            ...wsInvite(),
            receiverId: input.receiverId,
        }));
        (inviteRepository.getWorkspaceEmailContext as Mock).mockResolvedValue({
            workspaceName: "Forge Labs",
        });
        (authRepository.getUser as Mock).mockResolvedValue({ id: USER_ID, name: "Ada", email: "ada@example.com" });
        (mailerService.sendEmail as Mock).mockResolvedValue(false);

        const result = await inviteService.createWorkspaceInvite({
            workspaceId: WORKSPACE_ID,
            actorId: USER_ID,
            email: "invitee@example.com",
        });

        expect(result.emailSent).toBe(false);
        expect(result.invite.id).toBe(INVITE_ID);
    });
});

describe("inviteService.previewInviteToken", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("throws NotFoundError for unknown token formats", async () => {
        await expect(inviteService.previewInviteToken("bogus_token")).rejects.toBeInstanceOf(
            NotFoundError,
        );
    });

    it("returns a masked preview for a pending workspace invite", async () => {
        (inviteRepository.getWsInviteByToken as Mock).mockResolvedValue(wsInvite());
        (inviteRepository.getWorkspaceEmailContext as Mock).mockResolvedValue({
            workspaceName: "Forge Labs",
        });
        (authRepository.getUser as Mock).mockResolvedValue({ id: USER_ID, name: "Ada" });

        const preview = await inviteService.previewInviteToken(TOKEN);

        expect(preview.kind).toBe("workspace_invite");
        expect(preview.status).toBe("PENDING");
        expect(preview.workspaceName).toBe("Forge Labs");
        expect(preview.email).toBe("i******@example.com");
    });

    it("reports EXPIRED for a pending invite past its expiry", async () => {
        (inviteRepository.getWsInviteByToken as Mock).mockResolvedValue(
            wsInvite({ expiresAt: pastDate() }),
        );
        (inviteRepository.getWorkspaceEmailContext as Mock).mockResolvedValue({
            workspaceName: "Forge Labs",
        });
        (authRepository.getUser as Mock).mockResolvedValue({ id: USER_ID, name: "Ada" });

        const preview = await inviteService.previewInviteToken(TOKEN);

        expect(preview.status).toBe("EXPIRED");
    });

    it("reports REVOKED for a revoked workspace link", async () => {
        (inviteRepository.getWorkspaceInviteLinkByToken as Mock).mockResolvedValue({
            id: "link-1",
            token: LINK_TOKEN,
            workspaceId: WORKSPACE_ID,
            expiresAt: futureDate(),
            revokedAt: new Date(),
            useCount: 0,
            maxUses: null,
        });
        (inviteRepository.getWorkspaceEmailContext as Mock).mockResolvedValue({
            workspaceName: "Forge Labs",
        });
        (inviteRepository.getWorkspaceMemberCount as Mock).mockResolvedValue(4);

        const preview = await inviteService.previewInviteToken(LINK_TOKEN);

        expect(preview.kind).toBe("workspace_link");
        expect(preview.status).toBe("REVOKED");
        expect(preview.memberCount).toBe(4);
    });
});

describe("inviteService.acceptInviteToken", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("rejects acceptance when the signed-in email does not match", async () => {
        (authRepository.getUser as Mock).mockResolvedValue({
            id: USER_ID,
            email: "someoneelse@example.com",
        });
        (inviteRepository.getWsInviteByToken as Mock).mockResolvedValue(wsInvite());

        await expect(inviteService.acceptInviteToken(USER_ID, TOKEN)).rejects.toBeInstanceOf(
            ForbiddenError,
        );
        expect(inviteRepository.acceptWsInvite).not.toHaveBeenCalled();
    });

    it("matches emails case-insensitively for unlinked invites", async () => {
        (authRepository.getUser as Mock).mockResolvedValue({
            id: USER_ID,
            email: "Invitee@Example.com",
        });
        (inviteRepository.getWsInviteByToken as Mock).mockResolvedValue(wsInvite());
        (workspaceRepository.memberExists as Mock).mockResolvedValue(null);
        (inviteRepository.acceptWsInvite as Mock).mockResolvedValue({ id: INVITE_ID });

        await inviteService.acceptInviteToken(USER_ID, TOKEN);

        expect(inviteRepository.acceptWsInvite).toHaveBeenCalledWith(
            USER_ID,
            WORKSPACE_ID,
            INVITE_ID,
        );
    });

    it("expires and rejects stale workspace invites", async () => {
        (authRepository.getUser as Mock).mockResolvedValue({
            id: USER_ID,
            email: "invitee@example.com",
        });
        (inviteRepository.getWsInviteByToken as Mock).mockResolvedValue(
            wsInvite({ expiresAt: pastDate() }),
        );

        await expect(inviteService.acceptInviteToken(USER_ID, TOKEN)).rejects.toBeInstanceOf(
            ResourceGoneError,
        );
        expect(inviteRepository.expireWsInvite).toHaveBeenCalledWith(INVITE_ID);
    });

    it("rejects revoked workspace links", async () => {
        (authRepository.getUser as Mock).mockResolvedValue({ id: USER_ID, email: "x@example.com" });
        (inviteRepository.getWorkspaceInviteLinkByToken as Mock).mockResolvedValue({
            id: "link-1",
            workspaceId: WORKSPACE_ID,
            expiresAt: futureDate(),
            revokedAt: new Date(),
            maxUses: null,
        });

        await expect(inviteService.acceptInviteToken(USER_ID, LINK_TOKEN)).rejects.toBeInstanceOf(
            ResourceGoneError,
        );
        expect(inviteRepository.joinWorkspaceViaLink).not.toHaveBeenCalled();
    });

    it("joins a workspace through a valid link", async () => {
        (authRepository.getUser as Mock).mockResolvedValue({ id: USER_ID, email: "x@example.com" });
        (inviteRepository.getWorkspaceInviteLinkByToken as Mock).mockResolvedValue({
            id: "link-1",
            workspaceId: WORKSPACE_ID,
            expiresAt: futureDate(),
            revokedAt: null,
            maxUses: null,
        });
        (inviteRepository.joinWorkspaceViaLink as Mock).mockResolvedValue({
            member: { id: "wm-9" },
            alreadyMember: false,
        });

        await inviteService.acceptInviteToken(USER_ID, LINK_TOKEN);

        expect(inviteRepository.joinWorkspaceViaLink).toHaveBeenCalledWith({
            linkId: "link-1",
            userId: USER_ID,
            workspaceId: WORKSPACE_ID,
            maxUses: null,
        });
    });

    it("requires workspace membership before accepting a channel invite", async () => {
        (authRepository.getUser as Mock).mockResolvedValue({
            id: USER_ID,
            email: "invitee@example.com",
        });
        (inviteRepository.getChannelInviteByToken as Mock).mockResolvedValue({
            id: "chi-1",
            status: "PENDING",
            actorId: "actor-1",
            receiverId: null,
            channelId: CHANNEL_ID,
            receiverEmail: "invitee@example.com",
            expiresAt: futureDate(),
        });
        (inviteRepository.getChannelEmailContext as Mock).mockResolvedValue({
            channelName: "launch-room",
            workspace: { id: WORKSPACE_ID, workspaceName: "Forge Labs" },
        });
        (workspaceRepository.memberExists as Mock).mockResolvedValue(null);

        await expect(
            inviteService.acceptInviteToken(USER_ID, CHANNEL_TOKEN),
        ).rejects.toBeInstanceOf(ForbiddenError);
        expect(channelRepository.memberExists).not.toHaveBeenCalled();
    });
});

describe("inviteService workspace links", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("returns the existing active link instead of creating a duplicate", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue({ id: "wm-1", role: "OWNER" });
        (inviteRepository.getActiveWorkspaceInviteLink as Mock).mockResolvedValue({
            id: "link-1",
            token: LINK_TOKEN,
            workspaceId: WORKSPACE_ID,
            expiresAt: futureDate(),
            revokedAt: null,
            useCount: 2,
            maxUses: null,
        });

        const link = await inviteService.createWorkspaceInviteLink(USER_ID, WORKSPACE_ID);

        expect(link.token).toBe(LINK_TOKEN);
        expect(link.url).toContain(`/invite/${LINK_TOKEN}`);
        expect(inviteRepository.createWorkspaceInviteLink).not.toHaveBeenCalled();
    });

    it("forbids members without invite permission from managing links", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue({ id: "wm-1", role: "MEMBER" });

        await expect(
            inviteService.createWorkspaceInviteLink(USER_ID, WORKSPACE_ID),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("revokes active links", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue({ id: "wm-1", role: "OWNER" });
        (inviteRepository.revokeActiveWorkspaceInviteLinks as Mock).mockResolvedValue({ count: 1 });

        const result = await inviteService.revokeWorkspaceInviteLink(USER_ID, WORKSPACE_ID);

        expect(result.revoked).toBe(1);
    });
});

describe("inviteService.createChannelInvite recipient guards", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("refuses emails without an account, pointing at workspace invites", async () => {
        (workspaceRepository.memberExists as Mock).mockResolvedValue({ id: "wm-1", role: "OWNER" });
        (channelRepository.channelExists as Mock).mockResolvedValue({
            id: CHANNEL_ID,
            visibility: "PRIVATE",
        });
        (channelRepository.memberExists as Mock).mockResolvedValue({ id: "cm-1" });
        (authRepository.findUserByEmailInsensitive as Mock).mockResolvedValue(null);

        await expect(
            inviteService.createChannelInvite(
                USER_ID,
                { workspaceId: WORKSPACE_ID, channelId: CHANNEL_ID },
                { email: "new@example.com" },
            ),
        ).rejects.toBeInstanceOf(NotFoundError);
        expect(inviteRepository.createChannelInvite).not.toHaveBeenCalled();
    });
});
