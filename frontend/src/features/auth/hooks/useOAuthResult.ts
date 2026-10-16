import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import useAuth from "./useAuth";
import { consumeRedirectForOAuth } from "../utils/redirect";

export type OAuthResult = "success" | "error" | null;

export function useOAuthResult(): OAuthResult {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const oauth = searchParams.get("oauth");

    useEffect(() => {
        if (oauth === "success" && !isLoading && user) {
            navigate(consumeRedirectForOAuth(), { replace: true });
        }
    }, [oauth, isLoading, user, navigate]);

    if (oauth !== "success" && oauth !== "error") {
        return null;
    }
    return oauth;
}