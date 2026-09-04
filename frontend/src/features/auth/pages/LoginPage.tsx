import { Link } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
    return (
        <AuthShell footer={<>© {new Date().getFullYear()} WorkSphere Labs. All rights reserved.</>}>
            <div className="flex flex-col gap-1.5 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your email below to log in to your account
                </p>
            </div>

            <LoginForm />

            <div className="text-muted-foreground relative z-10 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                    to="/auth/register"
                    className="underline underline-offset-4 hover:text-foreground"
                >
                    Sign up
                </Link>
            </div>
        </AuthShell>
    );
}
