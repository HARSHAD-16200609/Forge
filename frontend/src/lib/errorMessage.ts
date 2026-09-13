import { AxiosError } from "axios";

export interface ApiErrorInfo {
    status?: number;
    message: string;
}

export function getApiError(error: unknown): ApiErrorInfo {
    if (error instanceof AxiosError) {
        const data = error.response?.data as
            | { message?: string }
            | string
            | undefined;
        const status = error.response?.status;
        return {
            status,
            message:
                typeof data === "object" && data?.message
                    ? data.message
                    : error.message || "Something went wrong",
        };
    }

    if (error instanceof Error) {
        return { message: error.message };
    }

    return { message: "Something went wrong" };
}