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
        <div className="flex min-h-screen items-center justify-center bg-white p-6 text-black antialiased dark:bg-[#050505] dark:text-white">
            <div className="text-center">
                {result === "success" ? (
                    <p className="text-black/60 dark:text-white/55">Signing you in...</p>
                ) : result === "error" ? (
                    <p className="text-red-600 dark:text-red-400">
                        Google sign-in failed. Redirecting to login...
                    </p>
                ) : (
                    <p className="text-black/60 dark:text-white/55">Finishing sign-in...</p>
                )}
            </div>
        </div>
    );
}