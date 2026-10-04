import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AxiosError } from "axios";

const mocks = vi.hoisted(() => ({
    createChannel: vi.fn(),
    navigate: vi.fn(),
    setSelectedChannelId: vi.fn(),
    setActiveSection: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => mocks.navigate,
}));

vi.mock("../../src/features/Channel/channel.service", () => ({
    channelService: { createChannel: mocks.createChannel },
}));

vi.mock("../../src/stores/uiStore", () => ({
    useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
            setSelectedChannelId: mocks.setSelectedChannelId,
            setActiveSection: mocks.setActiveSection,
        }),
}));

import { useCreateChannel } from "../../src/features/Channel/hooks/useChannel";

const WORKSPACE_ID = "5a1f0f9e-1c2d-4e3f-8a9b-0c1d2e3f4a5b";
const NEW_CHANNEL_ID = "7c2e1d4a-9b8c-4d5e-9f0a-1b2c3d4e5f60";

const CREATED = {
    id: NEW_CHANNEL_ID,
    channelName: "design-review",
    description: null,
    visibility: "PUBLIC" as const,
    isDefault: false,
    workspaceId: WORKSPACE_ID,
    createdAt: "2026-10-04T10:00:00.000Z",
    updatedAt: "2026-10-04T10:00:00.000Z",
    createdByWorkspaceMemberId: "member-1",
};

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** Records the call order of invalidation vs. selection. */
function trackedQueryClient(order: string[]) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const original = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((...args: Parameters<typeof original>) => {
        order.push("invalidate");
        return original(...args);
    }) as typeof queryClient.invalidateQueries;
    return queryClient;
}

describe("useCreateChannel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createChannel.mockResolvedValue(CREATED);
    });

    it("creates the channel in the given workspace", async () => {
        const { result } = renderHook(() => useCreateChannel(WORKSPACE_ID), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({
                channelName: "design-review",
                visibility: "PUBLIC",
            });
        });

        expect(mocks.createChannel).toHaveBeenCalledWith(WORKSPACE_ID, {
            channelName: "design-review",
            visibility: "PUBLIC",
        });
    });

    it("awaits the workspace refetch before selecting the new channel", async () => {
        const order: string[] = [];
        const queryClient = trackedQueryClient(order);
        mocks.setSelectedChannelId.mockImplementation(() => order.push("select"));

        const { result } = renderHook(() => useCreateChannel(WORKSPACE_ID), {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        });

        await act(async () => {
            await result.current.mutateAsync({
                channelName: "design-review",
                visibility: "PUBLIC",
            });
        });

        expect(order).toEqual(["invalidate", "select"]);
    });

    it("selects the new channel and routes to the channel view", async () => {
        const { result } = renderHook(() => useCreateChannel(WORKSPACE_ID), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({
                channelName: "design-review",
                visibility: "PUBLIC",
            });
        });

        await waitFor(() => {
            expect(mocks.setSelectedChannelId).toHaveBeenCalledWith(NEW_CHANNEL_ID);
        });
        expect(mocks.setActiveSection).toHaveBeenCalledWith("home");
        expect(mocks.navigate).toHaveBeenCalledWith("/app/home");
    });

    it("does not select or navigate when creation fails", async () => {
        mocks.createChannel.mockRejectedValue(
            new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
                status: 409,
                data: { status: 409, message: "Channel Already Exists" },
            } as never),
        );

        const { result } = renderHook(() => useCreateChannel(WORKSPACE_ID), { wrapper });

        await act(async () => {
            await result.current
                .mutateAsync({ channelName: "general", visibility: "PUBLIC" })
                .catch(() => undefined);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(mocks.setSelectedChannelId).not.toHaveBeenCalled();
        expect(mocks.navigate).not.toHaveBeenCalled();
    });
});