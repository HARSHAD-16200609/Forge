const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const wsUrlOverride = import.meta.env.VITE_WS_URL;

if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
}

function deriveWsUrl(apiBase: string): string {
    const url = new URL(apiBase);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}`;
}

export const env = {
    apiBaseUrl,
    wsUrl: wsUrlOverride ?? deriveWsUrl(apiBaseUrl),
} as const;