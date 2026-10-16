import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AxiosError } from "axios";
import { useLoginForm } from "../../src/features/auth/hooks/useLoginForm";

const mocks = vi.hoisted(() => ({
    login: vi.fn(),
    setUser: vi.fn(),
    setIsLoading: vi.fn(),
    searchParams: new URLSearchParams(),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mocks.searchParams],
}));

vi.mock("../../src/features/auth/hooks/useAuth", () => ({
    default: () => ({
        login: mocks.login,
        setUser: mocks.setUser,
        setIsLoading: mocks.setIsLoading,
    }),
}));

const mockNavigate = vi.fn();

describe("useLoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.searchParams = new URLSearchParams();
    });

    it("navigates to /app on successful login", async () => {
        mocks.login.mockResolvedValue({ data: { user: { id: "1" } } });

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "secret" });
        });

        expect(mocks.login).toHaveBeenCalledWith({
            email: "user@test.com",
            password: "secret",
        });
        expect(mockNavigate).toHaveBeenCalledWith("/app");
    });

    it("navigates to the redirect target after login when one is present", async () => {
        mocks.searchParams = new URLSearchParams("redirect=/invite/wsi_abc123");
        mocks.login.mockResolvedValue({ data: { user: { id: "1" } } });

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "secret" });
        });

        expect(mockNavigate).toHaveBeenCalledWith("/invite/wsi_abc123");
    });

    it("ignores unsafe redirect targets", async () => {
        mocks.searchParams = new URLSearchParams("redirect=https://evil.example.com");
        mocks.login.mockResolvedValue({ data: { user: { id: "1" } } });

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "secret" });
        });

        expect(mockNavigate).toHaveBeenCalledWith("/app");
    });

    it("sets a server error message when login fails", async () => {
        mocks.login.mockRejectedValue(
            new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
                status: 401,
                data: { message: "Invalid credentials" },
            } as never),
        );

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "wrong" });
        });

        expect(result.current.errors.email?.message).toBe("Invalid credentials");
    });

    it("sets a generic error message when the request fails unexpectedly", async () => {
        mocks.login.mockRejectedValue(new Error("Network down"));

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "secret" });
        });

        expect(result.current.errors.email?.message).toBe(
            "Unable to connect to the server. Please try again later.",
        );
    });
});