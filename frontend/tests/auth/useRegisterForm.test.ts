import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AxiosError } from "axios";
import { useRegisterForm } from "../../src/features/auth/hooks/useRegisterForm";

const mocks = vi.hoisted(() => ({
    registerUser: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("../../src/features/auth/hooks/useAuth", () => ({
    default: () => ({
        registerUser: mocks.registerUser,
    }),
}));

const mockNavigate = vi.fn();

const registerData = {
    name: "John Doe",
    email: "john@test.com",
    password: "secret123",
    username: "johndoe",
};

describe("useRegisterForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("posts the form data, resets the form, and navigates to login on success", async () => {
        mocks.registerUser.mockResolvedValue({ status: 201, data: { id: 1 } });

        const { result } = renderHook(() => useRegisterForm());

        await act(async () => {
            await result.current.onSubmit(registerData);
        });

        expect(mocks.registerUser).toHaveBeenCalledWith(registerData);
        expect(mockNavigate).toHaveBeenCalledWith("/auth/login");
        expect(result.current.errors.email).toBeUndefined();
    });

    it("sets a server error message when registration fails", async () => {
        mocks.registerUser.mockRejectedValue(
            new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
                status: 409,
                data: { message: "Email already exists" },
            } as never),
        );

        const { result } = renderHook(() => useRegisterForm());

        await act(async () => {
            await result.current.onSubmit(registerData);
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.errors.email?.message).toBe("Email already exists");
    });

    it("sets a generic error message when the request fails unexpectedly", async () => {
        mocks.registerUser.mockRejectedValue(new Error("Network down"));

        const { result } = renderHook(() => useRegisterForm());

        await act(async () => {
            await result.current.onSubmit(registerData);
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.errors.email?.message).toBe(
            "Something went wrong. Please try again.",
        );
    });
});