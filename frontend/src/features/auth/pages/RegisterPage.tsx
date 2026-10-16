import { Link, useSearchParams } from "react-router-dom";

import { AuthSplit } from "../components/AuthSplit";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect");
    const loginTo = redirect
        ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
        : "/auth/login";

    return (
        <AuthSplit
            title="Create an account"
            subtitle="Brainstrom in chat, build in cowork"
            switchLink={
                <Link
                    to={loginTo}
                    className="underline underline-offset-4 hover:text-white"
                >
                    Already have an account? <span className="font-medium">Log in</span>
                </Link>
            }
            footer={<>© {new Date().getFullYear()} Forge Labs. All rights reserved.</>}
        >
            <RegisterForm />
        </AuthSplit>
    );
}