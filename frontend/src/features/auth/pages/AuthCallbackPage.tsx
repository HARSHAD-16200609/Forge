import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useOAuthResult } from "../hooks/useOAuthResult";

export function AuthCallbackPage() {
    const result = useOAuthResult();
    const navigate = useNavigate();

    useEffect(() => {
        if (result === "error") {
            const timer = setTimeout(() => navigate("/auth/login", { replace: true }), 1500);
            return () => clearTimeout(timer);
        }
    }, [result, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                {result === "success" ? (
                    <p className="text-muted-foreground">Signing you in...</p>
                ) : result === "error" ? (
                    <p className="text-destructive">Google sign-in failed. Redirecting to login...</p>
                ) : (
                    <p className="text-muted-foreground">Finishing sign-in...</p>
                )}
            </div>
        </div>
    );
}