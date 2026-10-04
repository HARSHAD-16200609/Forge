import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";

const mocks = vi.hoisted(() => ({
    createChannel: vi.fn(),
    mutation: {} as Record<string, unknown>,
}));

vi.mock("../../src/features/Channel/hooks/useChannel", () => ({
    useCreateChannel: () => mocks.mutation,
}));

import { CreateChannelModal } from "../../src/features/Channel/components/CreateChannelModal";

const WORKSPACE_ID = "5a1f0f9e-1c2d-4e3f-8a9b-0c1d2e3f4a5b";

const CREATED = {
    id: "7c2e1d4a-9b8c-4d5e-9f0a-1b2c3d4e5f60",
    channelName: "design-review",
    description: null,
    visibility: "PUBLIC" as const,
    isDefault: false,
    workspaceId: WORKSPACE_ID,
    createdAt: "2026-10-04T10:00:00.000Z",
    updatedAt: "2026-10-04T10:00:00.000Z",
    createdByWorkspaceMemberId: "member-1",
};

function mockMutation(overrides: Record<string, unknown> = {}) {
    return {
        mutateAsync: mocks.createChannel,
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        ...overrides,
    };
}

function renderModal(onClose = vi.fn()) {
    return {
        onClose,
        ...render(
            <CreateChannelModal open workspaceId={WORKSPACE_ID} onClose={onClose} />,
        ),
    };
}

describe("CreateChannelModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createChannel.mockResolvedValue(CREATED);
        mocks.mutation = mockMutation();
    });

    it("renders nothing when closed", () => {
        render(<CreateChannelModal open={false} workspaceId={WORKSPACE_ID} onClose={vi.fn()} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("disables submit until a channel name is entered", async () => {
        const user = userEvent.setup();
        mocks.mutation = mockMutation();
        renderModal();

        const submit = screen.getByRole("button", { name: /create channel/i });
        expect(submit).toBeDisabled();

        await user.type(screen.getByLabelText(/name/i), "design");
        await waitFor(() => expect(submit).toBeEnabled());
    });

    it("shows the normalized slug preview while typing", async () => {
        const user = userEvent.setup();
        mocks.mutation = mockMutation();
        renderModal();

        await user.type(screen.getByLabelText(/name/i), "# Design Review");

        expect(screen.getByText("#design-review")).toBeInTheDocument();
    });

    it("submits the raw form values and closes on success", async () => {
        const user = userEvent.setup();
        mocks.mutation = mockMutation();
        const { onClose } = renderModal();

        await user.type(screen.getByLabelText(/name/i), "# Design Review");
        await user.type(screen.getByLabelText(/description/i), "Design critique");
        await user.click(screen.getByRole("radio", { name: /private/i }));
        await user.click(screen.getByRole("button", { name: /create channel/i }));

        await waitFor(() =>
            expect(mocks.createChannel).toHaveBeenCalledWith({
                channelName: "# Design Review",
                description: "Design critique",
                visibility: "PRIVATE",
            }),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("defaults to a public channel", async () => {
        const user = userEvent.setup();
        mocks.mutation = mockMutation();
        renderModal();

        expect(screen.getByRole("radio", { name: /public/i })).toHaveAttribute(
            "aria-checked",
            "true",
        );

        await user.type(screen.getByLabelText(/name/i), "general");
        await user.click(screen.getByRole("button", { name: /create channel/i }));

        await waitFor(() =>
            expect(mocks.createChannel).toHaveBeenCalledWith(
                expect.objectContaining({ visibility: "PUBLIC" }),
            ),
        );
    });

    it("surfaces the backend conflict message", async () => {
        const error = new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
            status: 409,
            data: { status: 409, message: "Channel Already Exists" },
        } as never);
        mocks.createChannel.mockRejectedValue(error);
        mocks.mutation = mockMutation({ isError: true, error });
        const { onClose } = renderModal();

        expect(await screen.findByText("Channel Already Exists")).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on Escape without submitting", async () => {
        const user = userEvent.setup();
        mocks.mutation = mockMutation();
        const { onClose } = renderModal();

        await user.keyboard("{Escape}");

        expect(onClose).toHaveBeenCalled();
        expect(mocks.createChannel).not.toHaveBeenCalled();
    });
});