import { Link, useSearchParams } from "react-router-dom";

import { AuthSplit } from "../components/AuthSplit";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect");
    const registerTo = redirect
        ? `/auth/register?redirect=${encodeURIComponent(redirect)}`
        : "/auth/register";

    return (
        <AuthSplit
            title="Welcome back"
            switchLink={
                <Link
                    to={registerTo}
                    className="underline underline-offset-4 hover:text-white"
                >
                    Don&apos;t have an account? <span className="font-medium">Sign up</span>
                </Link>
            }
            footer={<>© {new Date().getFullYear()} Forge Labs. All rights reserved.</>}
        >
            <LoginForm />
        </AuthSplit>
    );
}