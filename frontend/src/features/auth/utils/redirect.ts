const AUTH_REDIRECT_KEY = "forge:auth-redirect";
const FALLBACK = "/app";

export function safeRedirect(target: string | null | undefined, fallback = FALLBACK): string {
    if (target && target.startsWith("/") && !target.startsWith("//")) {
        return target;
    }
    return fallback;
}

export function storeRedirectForOAuth(target: string) {
    try {
        sessionStorage.setItem(AUTH_REDIRECT_KEY, target);
    } catch {
        // sessionStorage unavailable — fall back to /app after OAuth
    }
}

export function consumeRedirectForOAuth(): string {
    try {
        const stored = sessionStorage.getItem(AUTH_REDIRECT_KEY);
        sessionStorage.removeItem(AUTH_REDIRECT_KEY);
        return safeRedirect(stored);
    } catch {
        return FALLBACK;
    }
}
