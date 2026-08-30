import axios, {
    AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import { env } from "./env";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
    baseURL: env.apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(error);
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableConfig | undefined;
        const status = error.response?.status;

        if (status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        const url = originalRequest.url ?? "";
        if (
            originalRequest._retry ||
            url.includes("/auth/refresh") ||
            url.includes("/auth/login") ||
            url.includes("/auth/register")
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise<unknown>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => api(originalRequest))
                .catch(() => Promise.reject(error));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            await api.post("/auth/refresh");
            processQueue(null);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);